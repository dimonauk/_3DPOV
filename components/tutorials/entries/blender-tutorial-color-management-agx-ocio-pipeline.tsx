import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AgxBody() {
  return (
    <>
      <p>
        Every value in Blender&rsquo;s shader graph lives in{" "}
        <em>scene-linear</em> light units.  The number{" "}
        <code>1.0</code> is not &ldquo;white&rdquo; — it is the
        luminance of an 18&nbsp;% grey card under unity-exposure sunlight.
        An emissive panel at Strength 8.0 is eight times brighter than that
        reference.  This physical encoding is what allows Blender to handle
        high-dynamic-range light correctly, but it also means the rendered
        image cannot go straight to a monitor: something must map that 0&nbsp;→&nbsp;∞
        linear range onto the 0&nbsp;→&nbsp;1 display range without crushing every
        shadow to black or clipping every highlight to featureless white.
        That something is the <em>display transform</em>.
      </p>

      <p>
        AgX has been Blender&rsquo;s default display transform since 4.0.  It
        replaced Filmic because of one key property: <em>chromaticity
        preservation</em>.  When a red light burns very bright, Filmic
        desaturates it towards orange then white — the hue shifts as luminance
        rises.  AgX rolls the bright highlight smoothly into white while
        maintaining the spectral character of the source for much longer.  The
        difference is most visible on chrome spheres under an overbright key
        light, or on vivid emissive panels.  Both cases appear in this
        tutorial&rsquo;s colour-stress test scene.
      </p>

      <p>
        The colour management settings also travel into GLB and WebXR
        delivery.  The glTF 2.0 specification is colour-space explicit: base
        colour textures are sRGB, data textures (roughness, normal, occlusion)
        are linear.  If you paint in the wrong space, every texture bake and
        every WebXR render will be subtly wrong — too dark, too saturated, or
        with blown-out highlights.  The final steps of this tutorial show how
        to verify the colour-space flag on every Image Texture node before
        export, and how those flags map onto the glTF JSON.  For the full
        compositing pipeline that processes the rendered frames before final
        delivery, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          compositor tone-mapping tutorial
        </Link>
        .  For understanding how lighting interacts with AgX specifically,
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          irradiance volume tutorial
        </Link>{" "}
        shows how probe-baked indirect light is stored in scene-linear units
        and displayed through the same AgX pipeline.  For the Cycles render
        settings that feed into this colour pipeline, see{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          Cycles camera rig and render settings
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-color-management-agx-ocio-pipeline",
  title:
    "Color Management — AgX Colour Science + OCIO Pipeline (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Scene-linear light, display transforms, and why AgX outperforms Filmic on " +
    "overbright highlights: configure view_transform, look presets, exposure, " +
    "and gamma; verify GLB texture colour spaces; plug in a custom OCIO config " +
    "for ACES pipelines.",
  Body: AgxBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/color-management/color-management-agx-ocio-pipeline/",
    time: "one to two hours",
    difficulty: "intermediate",
    overview:
      "Blender stores all shader values in scene-linear light units (0 to infinity). " +
      "The display transform — AgX by default in Blender 4.0 and later — converts that " +
      "linear range to the 0–1 display-referred image a monitor can show. " +
      "AgX uses a chromaticity-preserving rolloff that keeps bright highlights " +
      "tonally coherent; the older Filmic transform desaturated and white-clipped them. " +
      "This tutorial explains the full pipeline: scene-linear encoding, display transform " +
      "selection, AgX Look presets, exposure vs. gamma, and the GLB texture colour-space " +
      "rules that govern correct WebXR delivery.",
    goal:
      "Build a colour-stress test scene (overbright key light, chrome sphere, saturated " +
      "red ball, vivid emissive panel), configure AgX with Medium High Contrast look, " +
      "compare AgX vs. Filmic vs. Standard in the rendered viewport, and verify that " +
      "all Image Texture nodes in a GLB-destined material carry the correct colour space.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Basic Blender navigation — orbiting, zooming, selecting objects",
      "Knows how to open the Properties panel and switch between property tabs",
      "Has run at least one Cycles or EEVEE-Next render",
      "Aware that Principled BSDF exists; no deep shader knowledge required",
    ],
    steps: [
      {
        title: "Scene-linear colour: the one concept that changes everything",
        body: `Every shader node in Blender operates in scene-linear light units.
'Linear' means the numbers are proportional to physical photon counts:
  0.0 = no light
  0.18 = an 18 % grey card (photographic middle grey)
  1.0 = a perfectly diffuse white surface lit by unity-exposure daylight
  8.0 = eight times that — overbright by about 3 EV

This encoding is physically correct and allows Blender to simulate
high-dynamic-range phenomena (specular highlights many stops above shadow)
without baking compromises into the shader network.

The display transform converts the linear image to a display-referred image
(0–1) that a calibrated monitor can show.  Without a transform, values
above 1.0 would be silently clamped by the graphics driver, every bright
light would clip to featureless white, and there would be no way to recover
the highlight structure.

The two most common confusions at this stage:
  1. "My white ball looks grey." → It should: a diffuse albedo of 0.8 under
     unity-exposure daylight is 80 % of that reference, which maps to roughly
     a mid-off-white in the display-referred image.  Add a key light; that
     drives the illuminated surface above 1.0 into the rolloff shoulder.

  2. "My emissive material is overexposed." → Emission Strength 1.0 is equal
     to the unity reference.  Strength 8.0 is 8× brighter.  AgX rolls it off
     into the shoulder — that's the correct behaviour, not a bug.  Reduce
     strength if you want it to read as a gentle glow rather than a blowout.`,
      },
      {
        title: "AgX vs Filmic vs Standard: what each transform does",
        body: `The View Transform dropdown (Properties → Render → Color Management) controls
the mathematical function applied to each linear render pixel before display.

AgX (default since Blender 4.0):
  Developed by Troy Sobotka. Per-channel S-curves designed to preserve
  chromaticity at high luminances. A saturated red spotlight at Strength 20
  stays red as it rolls into the shoulder; it does NOT desaturate to white.

Filmic (Blender 2.80–3.6 default):
  S-curve applied equally to all channels → desaturates highlights towards
  white. Bright coloured lights lose hue identity early. The orange key-light
  specular on a chrome sphere goes white above ~0.6 in the shoulder.
  Not wrong — some studios prefer the cinematic bleach effect.

Standard (linear-sRGB):
  Applies only the sRGB OETF (gamma 2.2). Values above 1.0 are silently
  clamped. Use ONLY for inspecting shader value ranges, never for final renders.

Raw:
  Scene-linear values sent directly to the display driver; values above 1.0
  clip. Useful for inspecting linear EXR data in a side-by-side viewer.

To compare in the rendered viewport (Z → Rendered): switch transforms live
and watch the chrome sphere's highlight — AgX retains the warm tungsten tint
even when blown three stops above unity; Standard clips it to solid white.`,
      },
      {
        title: "AgX Look presets and when to use each",
        body: `The 'Look' dropdown modifies the AgX transform with a pre-baked contrast/
saturation grade.  Look names in Blender 5.1:

  Very High Contrast   — steep S-curve; vivid, contrasty output
  High Contrast
  Medium High Contrast — factory default; solid baseline for most scenes
  Base Contrast        — lowest contrast; maximum grading headroom in compositor
  Medium Low Contrast
  Low Contrast
  Very Low Contrast    — flat, LOG-adjacent; good if you plan heavy compositing
  Punchy               — moderate contrast + saturation boost; not a pure AgX look

Recommended choice per workflow:
  Direct-to-JPEG/PNG delivery → Medium High Contrast (default)
  Compositor grading in Blender  → Base Contrast or Low Contrast
  WebXR screenshot capture → Medium High Contrast
  Professional VFX pipeline with OCIO → set Look to 'None' and apply the
    grade in your OCIO config (the studio ACES config will define its own looks)

'Punchy' is a common trap: it makes the render look immediately better on
a cheap monitor by boosting saturation, but that saturation bake cannot be
reversed later.  Resist the temptation unless the deliverable is truly
final.  Prefer Base Contrast + a Curves node in the compositor.

Python to set look:
  scene.view_settings.look = "AgX - Medium High Contrast"
The look string must include the "AgX - " prefix when using the AgX
view_transform, because Blender's OCIO config treats each look as
scoped to its associated transform.`,
      },
      {
        title: "Exposure and Gamma: what they actually do",
        body: `Both sliders brighten the image but operate at completely different
points in the pipeline.

Exposure (pre-transform):
  linear_out = linear_in × 2^exposure
  Applied BEFORE the AgX S-curve, so highlights still roll off into the
  shoulder rather than clipping.  +1.0 EV doubles scene-linear light.
  Use Exposure to correct a scene lit ±1–2 EV off-target without relighting.
  Dragging to +1.5 under AgX pushes the chrome highlight deeper into the
  rolloff; the same drag under Standard clips at +0.5.

Gamma (post-transform):
  display_out = display_in^(1/gamma)
  Applied AFTER AgX, on display-referred (0–1) values.
  A simple power function: lifts mid-tones without touching black or white.
  Use ONLY on an uncalibrated display that cannot be profiled via ICC.
  On any calibrated monitor leave Gamma at 1.0.

  Common mistake: pushing Gamma to 1.2 to 'fix' a flat render instead of
  adjusting lighting.  The image looks correct only on that one display;
  it will be over-bright everywhere else.`,
      },
      {
        title: "GLB texture colour spaces: the rule and why it matters",
        body: `glTF 2.0 is colour-space explicit.  Blender reads the colour space from
each Image Texture node's 'Color Space' dropdown and writes it into GLB metadata.

Mandatory assignments:
  Base Color / Emission texture → sRGB
  Normal / Roughness / Metallic / Occlusion → Non-Color (linear)

Error example: a roughness texture set to sRGB applies gamma 2.2 de-gamma.
A grey 0.5 value becomes √0.5 ≈ 0.71 — wrong by a full stop.
The GLB carries that error into the browser.

Python audit:
  for mat in bpy.data.materials:
      if not mat.use_nodes: continue
      for n in mat.node_tree.nodes:
          if n.type == 'TEX_IMAGE' and n.image:
              print(f"{mat.name} | {n.label or n.name} → "
                    f"{n.image.colorspace_settings.name}")

Emission Strength > 1.0 is exported via KHR_materials_emissive_strength.
Three.js (ACESFilmic by default) applies its own tone mapping in the browser.
Never bake a tonemapped sRGB value into a texture that will be re-tonemapped
at render time — highlight detail is lost twice.`,
      },
      {
        title: "Custom OCIO config for ACES / VFX pipelines",
        body: `Blender's colour management is built on OpenColorIO (OCIO).
The built-in config ships AgX, Filmic, Raw, and Standard.
Studios standardising on ACES or a proprietary LUT pipeline need to replace it.

To load a custom config:
  Edit → Preferences → Color Management
  ☑ Use Custom Color Management → OCIO Config: /path/to/config.ocio

The View Transform and Look dropdowns then list whatever the new config defines
("ACES - SDR Video", "Output - sRGB", CDLs, etc.).  Existing materials are
unaffected — OCIO only changes the display pipeline, not shader values.

The ACES CG config (Apache-2.0, community maintained):
  https://github.com/colour-science/OpenColorIO-Configs

Collaboration note: the config path is stored in the .blend file as a relative
path.  Anyone opening without the config sees Raw passthrough.  Include the
config directory in your project repository.

For Holoflow Studio WebXR work the built-in AgX config is sufficient.
The GLB exporter is agnostic to OCIO — textures are encoded to sRGB / linear
per their node colour space regardless of what the viewport displays.`,
      },
    ],
  },
  base
);
