import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function NishitaSkyBody() {
  return (
    <>
      <p>
        Every outdoor scene needs a sky that feels physically grounded.{" "}
        <code>ShaderNodeTexSky</code> in <strong>Nishita mode</strong> delivers exactly
        that, computing the full Rayleigh&ndash;Mie&ndash;Ozone atmospheric scattering
        path analytically for every sky-dome direction — no HDRI texture required.  The
        model traces the 1993 SIGGRAPH paper by Nishita, Sirai, Tadamura, and Nakamae.
      </p>
      <p className="mt-3">
        Five parameters span the range from crystal alpine noon to haze-softened tropical
        sunset: <code>air_density</code>, <code>dust_density</code>,{" "}
        <code>ozone_density</code>, <code>altitude</code>, and{" "}
        <code>sun_elevation</code>.  Animate <code>sun_elevation</code> from &minus;5° to 70°
        across 180 frames and you have a complete sunrise-to-noon sequence.  A matching SUN
        lamp tracks the same direction to cast directed shadows.  AgX colour management
        (Blender&apos;s default since 4.0) handles the sky&apos;s 10<sup>7</sup>:1 HDR range.
      </p>
      <p className="mt-3">
        For pre-baked indirect lighting that complements the sky IBL, see{" "}
        <Link href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe" className={lk}>
          EEVEE Next Irradiance Volume + Sphere Probe
        </Link>
        .  For a full Cycles outdoor render, see{" "}
        <Link href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh" className={lk}>
          Cycles Cinematic Camera Rig: DoF + Motion Blur
        </Link>
        .  To post-process the sky render, see{" "}
        <Link href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping" className={lk}>
          Compositor Glare + Film Grain + Tone Map
        </Link>
        .  For SSR that shows sky colour in glossy EEVEE reflections, see{" "}
        <Link href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy" className={lk}>
          EEVEE Next Screen-Space Ray Tracing
        </Link>
        .
      </p>
      <p className="mt-3 text-sm text-zinc-400">
        Sources:{" "}
        <a href="https://dl.acm.org/doi/10.1145/166117.166140" className={lk}
          target="_blank" rel="noopener noreferrer">
          Nishita et al., SIGGRAPH 1993 (PD academic)
        </a>{" "}
        and{" "}
        <a href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Sky.js"
          className={lk} target="_blank" rel="noopener noreferrer">
          Three.js Sky.js (MIT)
        </a>{" "}
        — sibling Preetham sky for WebXR / TSL use.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-sky-nishita-sun-position-hdri-rig",
  title:
    "World Shader: Nishita Sky Texture + Sun Position — Physically-Based Outdoor Lighting Rig (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "ShaderNodeTexSky in Nishita mode computes Rayleigh + Mie + Ozone atmospheric " +
    "scattering analytically — no HDRI file required. Five parameters span crystal alpine " +
    "noon to haze-softened sunset. A SUN lamp mirrors the sky's sun direction. Animate " +
    "sun_elevation from −5° to 70°; AgX preserves the 10⁷:1 HDR range. Exports a " +
    "golden-hour GLB snapshot for WebXR via Three.js Sky.js.",
  Body: NishitaSkyBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-sky-nishita-sun-position-hdri-rig",
    time: "1–1.5 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable opening the Shader Editor and adding nodes (Shift+A)",
      "Understands the World Output node and Background shader",
      "Has used the Timeline and inserted keyframes (I key)",
      "Familiar with EEVEE Next or Cycles Render Properties",
    ],
    steps: [
      {
        title: "Nishita vs Hosek-Wilkie vs Preetham — choosing the right model",
        body: `Sky Texture offers three sky_type options:

NISHITA (use this): Full scattering path, sun disc, altitude parameter.
  At low elevations (<15°) the horizon orange is physically accurate.
  Five knobs: air_density (Rayleigh), dust_density (Mie/aerosol),
  ozone_density, altitude (km), sun_elevation.
  air_density 1.0 = standard. 3.0 = deep alpine blue. 0.3 = washed out.
  dust_density 0.0 = crystal clear. 2.0 = hazy city. 5.0 = smoke.

HOSEK_WILKIE: Fitted to measured sky-dome datasets. No sun disc. No altitude.
  Better colour accuracy at near-horizon elevations than Nishita.
  Use when the sun is off-screen and you need an accurate horizon band.

PREETHAM: Simple 2002 model. Fast. No disc. Incorrect below ~10° (horizon browns).
  Three.js Sky.js implements Preetham — see external references for WebXR use.

Set: sky_type='NISHITA', air_density=1.0, dust_density=0.5, ozone_density=1.0.`,
      },
      {
        title: "World node tree: Sky Texture → Background → World Output",
        body: `Shader Editor header drop-down → switch from Object to World.
Delete default nodes. Add:
  Shift+A → Texture → Sky Texture
  Shift+A → Shader → Background
  Shift+A → Output → World Output

Connect: Sky Texture Color → Background Color → World Output Surface.

Sky Texture properties:
  Sky Type      = Nishita
  Sun Disc      = True  (shows the solar disc; HOSEK_WILKIE ignores this flag)
  Sun Elevation = 0.087 rad (5°)
  Sun Rotation  = 0.785 rad (45°: south-west azimuth)
  Air Density   = 1.0
  Dust Density  = 0.5
  Ozone Density = 1.0
  Altitude      = 0.0 km

Background Strength = 1.0.  Strength is a post-sky multiplier; adjusting it
shifts exposure but also boosts noise — prefer adjusting Colour Management
Exposure for tonemapped output.

EEVEE bakes the world tree into a cubemap (Render Props → World → Resolution,
default 512).  Raise to 2048 for large glossy surfaces that need a sharp horizon
gradient.  Cycles evaluates the sky analytically per sample — no cubemap needed.`,
      },
      {
        title: "Matching SUN lamp: direction, energy, and penumbra width",
        body: `The sky IBL illuminates the scene but casts no directed shadow.
A SUN type lamp supplies the shadow; it must track the sky's sun position.

Add: Shift+A → Light → Sun.
Light Properties:
  Energy = 5.0 W/m²    — noon direct irradiance proxy
  Angle  = 0.526°       — correct solar angular diameter → realistic penumbra

Object Transform rotation (for sun_elevation = 5°, sun_rotation = 45°):
  Rotation X = 90° − elevation_deg  = 85°
  Rotation Z = 45°   (azimuth)

If lamp direction differs from the sky sun disc by >3°, shadows point somewhere
other than away from the disc — immediately noticeable.

Energy at low elevations: direct irradiance ∝ sin(elevation) via Beer–Lambert.
At −5° (below horizon): energy ≈ 0. At 70°: full SUN_ENERGY_NOON.
The blueprint uses: energy = 5.0 × max(0.04, sin(elev + 0.1)) per frame.

For Cycles only: you can skip the SUN lamp and rely on sky MIS sampling
(scene.cycles.use_light_tree = True). EEVEE always needs the SUN lamp for shadows.`,
      },
      {
        title: "AgX colour management — not optional for sky renders",
        body: `Nishita sky luminance range:
  Sun disc centre:  ~1.6 × 10⁹ cd/m²
  Clear zenith:     ~7 × 10³ cd/m²
  Horizon band:     ~2 × 10⁴ cd/m² (peak near 5° elevation)

That is a 10⁷:1 range.  View Transform options:
  Standard — clips sun disc to pure white. Horizon saturates flat orange.
  Linear   — same problem. Use only for EXR output with offline tonemapping.
  Filmic   — handles the range but shifts mid-tone chroma (skin tones cool).
  AgX      — best chroma preservation: orange-to-red sunset retains saturation
             all the way to the horizon. Default since Blender 4.0.

Render Properties → Colour Management:
  View Transform = AgX
  Look           = None   (or 'AgX - High Contrast' for drama)
  Exposure       = 0.0

'AgX - Punchy' look adds extra saturation: fine for stills, can look unrealistic
in animated dawn transitions.  Use Look = None for animation.`,
      },
      {
        title: "Animating the sun: keyframing sun_elevation + lamp energy",
        body: `With Sky Texture node selected in Shader Editor:
  Frame 1: set Sun Elevation = −0.087 rad (−5°). Hover field → I → keyframe.
  Frame 180: set Sun Elevation = 1.222 rad (70°). Hover → I → keyframe.

Press Spacebar: sky shifts from violet twilight → orange golden hour → midday blue.

Match the SUN lamp:
  Frame 1 → lamp Rotation X = 95°, Energy = 0.22 → keyframe both.
  Frame 180 → lamp Rotation X = 20°, Energy = 5.0 → keyframe both.

Golden hour ≈ frame 30 (sun_elevation ≈ 7.5°): warmest orange horizon band.
The blueprint parks at frame 30 for file save and GLB export.

In the Graph Editor: confirm the sun_elevation F-curve lives under
World → Node Tree → Sky Texture.  The interpolation mode is LINEAR by default —
BEZIER would ease in/out and feel more cinematic for a longer-form time-lapse.
Switch via: channel right-click → Interpolation → Bezier.`,
      },
      {
        title: "GLB export and WebXR sky reconstruction",
        body: `The Nishita sky cannot be baked into a GLB (infinite, view-dependent, analytical).
Export geometry only (Ground, Chrome_Sphere, Clay_Cube).

For WebXR sky, three options:
  A. Three.js Sky.js (MIT — mrdoob/three.js):
     Preetham model, ~100 lines.  Add Sky object, set turbidity, rayleigh,
     sunPosition uniform.  Fastest WebXR option.
     Limitation: Preetham browns the horizon at low elevations.

  B. TSL sky shader (Three.js Shading Language, MIT):
     Write a custom Nishita TSL node using uniform nodes for air/dust/ozone.
     Full accuracy match to Blender.  More author effort.

  C. Pre-baked EXR panorama:
     Render the Blender sky as a 360° equirectangular EXR (Camera type = Panoramic,
     Panorama = Equirectangular, resolution 4096 × 2048).
     Load in Three.js via EXRLoader + PMREMGenerator.
     Accurate and simple — captures one sun position only.

The exported GLB chrome sphere demonstrates the sky IBL at golden hour.
In Three.js, apply a PMREMGenerator environment from the sky EXR for correct
Metallic=1.0 reflections without re-implementing the sky model.

EEVEE vs Cycles for final renders:
  EEVEE: fast, needs SSR (use_raytracing=True) for reflections, cubemap bake.
  Cycles: accurate, sky sampled as area light via use_light_tree, no bake needed.
  For stills: Cycles 256 samples + denoising. For animation: EEVEE + SSR.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Sky background is black in the viewport.",
        cause: "Viewport is in Solid mode, which never shows the world shader.",
        fix: "Switch to Material Preview (Z → Material Preview) and enable Scene World in N-panel → View → World.  Or render (F12) — the world renders correctly regardless of viewport mode.",
      },
      {
        symptom: "Sky appears but there is no sun disc — just a gradient.",
        cause: "sun_disc is False on the Sky Texture node, or Sky Type is HOSEK_WILKIE (no disc).",
        fix: "Select Sky Texture node → enable Sun Disc checkbox. Confirm Sky Type = Nishita.",
      },
      {
        symptom: "Chrome sphere shows sky but with wrong or flat colours in EEVEE.",
        cause: "SSR is disabled; EEVEE uses a blurry probe approximation without it.",
        fix: "Render Properties → Ray Tracing: ON. Set World Resolution to 2048 for a sharp sky gradient in the reflection.",
      },
      {
        symptom: "Horizon is pure white — no orange gradient.",
        cause: "Colour Management View Transform is Standard or Linear, clipping the HDR sky.",
        fix: "Render Properties → Colour Management → View Transform = AgX.",
      },
      {
        symptom: "Shadows point in a different direction from the visible sun disc.",
        cause: "SUN lamp rotation does not match sky node's sun_elevation and sun_rotation.",
        fix: "Lamp Rotation X = 90° − elevation_deg.  Lamp Rotation Z = sun_rotation_deg.  If shadows are 180° off, flip Rotation Z by +180°.",
      },
      {
        symptom: "GLB chrome sphere appears flat grey in Three.js.",
        cause: "No IBL environment map applied; Metallic + Roughness 0.05 requires an environment for reflections.",
        fix: "Add a PMREMGenerator environment in Three.js from a RoomEnvironment or from the pre-baked sky EXR. The material export is correct — the IBL source is missing.",
      },
    ],
  },
  base
);
