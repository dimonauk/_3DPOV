import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeNextVolumetricLightConeBody() {
  return (
    <>
      <p>
        EEVEE Legacy rendered volumes by marching rays through a single
        screen-space buffer, which produced an incoherent smear that barely
        resembled a beam unless the light was almost perfectly aimed at the
        camera.  EEVEE Next — the sole EEVEE in Blender 5.x, replacing Legacy
        entirely — works differently: it tiles the camera frustum into a 3-D
        voxel grid (2&nbsp;px, 4&nbsp;px, 8&nbsp;px, or 16&nbsp;px per cell)
        and integrates scatter at each step through the grid, sampling each
        light&apos;s shadow map along the way.  The shadow map is the crucial
        part.  When a spot light&apos;s shadow map occludes the volume
        outside the cone, the voxels inside the cone receive the scatter
        contribution and the voxels outside do not — which is how the visible
        shaft shape emerges.  Without{" "}
        <code>use_volumetric_shadows = True</code> the light leaks uniformly
        into the entire volume and the beam vanishes into a flat haze.  This
        is the single most common mis-configuration when someone opens EEVEE
        Next volumetrics for the first time.  It is not a density problem, not
        an anisotropy problem — it is a shadow problem.  Turn on volumetric
        shadows and the shaft appears at the correct settings every time.  The
        same architecture drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral"
          className={lk}
        >
          Points to Volume geometry node
        </Link>
        , which converts point clouds to a density field that EEVEE Next then
        samples via the same voxel path — a different route into the same render
        pipeline.
      </p>

      <p>
        The <strong>Principled Volume</strong> shader has three interacting
        channels: <em>scatter</em> (colour and density — photons deflect here),
        <em>absorption</em> (photons disappear here — darkens without scatter),
        and <em>emission</em> (the volume glows from within, independent of
        lights).  For a dust-and-mist interior you want scatter only, with
        Absorption Colour at black and Emission Strength at zero.  The{" "}
        <strong>Anisotropy</strong> parameter is the Mie-scattering asymmetry
        factor: at 0.0 each scatter event sends the photon equally in all
        directions (isotropic — looks like thick fog with no directionality);
        at 0.9 almost all energy scatters forward (looking toward the light
        source you see a brilliant cone; looking away you see almost nothing).
        The sweet spot for a studio &lsquo;visible beam from any angle&rsquo;
        look is 0.55–0.65: enough forward bias to make the shaft read as a
        shaft rather than a glow, but not so much that it disappears when the
        camera is at 90° to the beam.  Compare this physics with the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin"
          className={lk}
        >
          Subsurface Scattering tutorial
        </Link>
        , where the Radius vector controls a similar per-channel mean-free-path
        concept but inside a solid mesh rather than a participating medium.
        Both are fundamentally about how far light travels before it changes
        direction — one inside tissue, the other inside air.
      </p>

      <p>
        EEVEE Next volumes are GPU shader data.  The glTF&nbsp;2.0
        specification has no volume extension, so{" "}
        <code>bpy.ops.export_scene.gltf</code> silently discards the World
        volume during export.  The workaround used in this blueprint is a{" "}
        <strong>fake emission-cone mesh</strong>: a truncated cone with a
        Mix&nbsp;Shader (Transparent + Emission, Fac&nbsp;=&nbsp;0.11,{" "}
        <code>blend_method = &apos;BLEND&apos;</code>) placed at the same
        position and angle as each spot light.  Three.js and Babylon.js render
        the alpha-blended emissive cone over the dark scene, producing a
        passable approximation of the shaft — not volumetric, but convincing at
        the resolutions used in WebXR spatial scenes.  The same technique
        applies to any EEVEE-only effect that needs to survive a GLB export;
        compare the baked-texture fallback described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking guide
        </Link>
        , which applies an equivalent &lsquo;capture the GPU effect as a static
        asset&rsquo; philosophy to screen-space ambient occlusion.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE Toon Cel Shader tutorial
        </Link>{" "}
        covers a third approach: building the effect purely from materials
        that export cleanly as-is, with no post-process dependency at all.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-eevee-next-volumetric-light-cone",
  title: "EEVEE Next — Volumetric Light Cone + Bloom",
  date: "2026-06-10",
  kind: "tutorial",
  excerpt:
    "EEVEE Next voxel-grid volumetric sampler, Principled Volume shader (scatter, Mie anisotropy), spot-light shadow occlusion of the volume, Bloom post-process, and a transparent emission-cone mesh as a GLB-exportable beam proxy for WebXR. Blender 5.1.",
  Body: EeveeNextVolumetricLightConeBody,
};

export const entry = buildInstructable(
  {
    time: "one session (1–2 hours)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 (EEVEE Next renderer — default in 5.x)",
        "blueprint.py from public/library/blends/lighting/eevee-next-volumetric-light-cone/",
      ],
      tools: [
        "Shader Editor (World context)",
        "Properties › Render › Volumetrics",
        "Properties › Render › Bloom",
        "3D Viewport › Rendered shading mode",
        "Properties › Material (for fake cone setup)",
      ],
    },
    steps: [
      {
        title: "Set engine to EEVEE Next and confirm scene scale",
        content: `In Properties › Render, confirm the engine reads "EEVEE" (EEVEE Next is
the only EEVEE in Blender 5.1 — if you see "EEVEE Legacy", you are on an older
build).

Scene scale matters for volumetrics: 1 Blender unit = 1 metre.  A density of
0.042 in a 1m scene reads as dense smoke; the same 0.042 in an 8m room reads
as light dust.  Before adding any volume, set:
  Scene Properties › Units › Length: Metres
  Scene Properties › Units › Scale: 1.0

blueprint.py builds an 8 × 8 × 5m interior and calibrates Density = 0.042 for
this scale — visible beams without the scene going opaque.`,
      },
      {
        title: "Add a Principled Volume to the World",
        content: `Open the Shader Editor.  In the header, click the Object dropdown and
select World.

The default World has a Background shader.  Add a Principled Volume node
(Shift+A › Shader › Principled Volume) and connect its Volume output to the
World Output's Volume socket.  Leave the Background shader connected to
Surface — it sets the backdrop colour for areas with no geometry behind them.

Set:
  Color → (0.80, 0.88, 1.00) — slightly blue scatter (cool studio dust)
  Density → 0.042
  Anisotropy → 0.60

Absorption and Emission remain at defaults (0.0 / black / 0.0).
Switch the 3D viewport to Rendered mode.  You should see a subtle milky haze
with no visible shafts yet — that's correct.  Shafts require shadow maps (Step 3).`,
      },
      {
        title: "Add spot lights and enable volumetric shadows",
        content: `Add the first spot light: Shift+A › Light › Spot.
Position at (2.2, -1.0, 4.2), energy 2800 W, colour (1.0, 0.6, 0.2) warm amber.
Set Spot Size (full cone angle) to 56° (= 2 × 28° half-angle).
Set Spot Blend to 0.12 (soft edge) and Shadow Soft Size to 0.04 m.

In Light Properties, confirm Cast Shadow is ON.

Add the second spot light at (-1.8, 1.8, 3.8), 2200 W, colour (0.28, 0.68, 1.0)
cool teal, Spot Size 44°.

Now go to Properties › Render › Volumetrics:
  ✓ Volumetric Shadows
  Shadow Samples: 16

In the viewport you should NOW see the crossing beam shafts.  If you do not, the
most likely cause is that Volumetric Shadows is off (see Troubleshooting).

Aim each light at the floor centre by selecting it, pressing G, moving to
position, then Ctrl+R to use the Aim Constraint — or run blueprint.py which
uses to_track_quat('-Z', 'Y') for a precise direction-to-target aim.`,
      },
      {
        title: "Configure Bloom",
        content: `Go to Properties › Render › Bloom.

  ✓ Bloom (checkbox)
  Threshold: 0.75 — pixels with HDR brightness above this glow.
    For 2800 W spot lights the lamp body will be well above threshold.
    Raise to 1.5+ to restrict bloom to only the very brightest elements.
  Intensity: 0.065 — how bright the bloom aura is.
    Above 0.15 reads as overexposed lens flare; below 0.03 is barely visible.
  Radius: 5.5 — spread of the bloom halo in pixels.
    Increase to 8–10 for a dreamy halo; lower to 3 for a tight crisp glow.

The warm amber and cool teal lights will bloom different colours, producing
a visible colour fringe where the two halos overlap — this is physically
correct (each wavelength blooms independently).

NOTE: In Blender 5.0 (early EEVEE Next builds), Bloom was temporarily moved
to the Compositor as a Glare node.  If Properties › Render shows no Bloom
section, use Compositor › Glare › Bloom instead.`,
      },
      {
        title: "Tune tile size and sample count",
        content: `Properties › Render › Volumetrics:

  Start: 0.1 m — begin integrating from 10 cm in front of camera.
    Set below your nearest object's distance from camera.
  End: 18.0 m — stop integrating here.
    Match to your scene depth (8m room + camera pullback ≈ 12–14m minimum).
  Tile Size: 2 px — each frustum voxel is 2 × 2 screen pixels.
    Start at "4" for interactive tweaking, switch to "2" for final quality.
    "8" and "16" produce visible step artefacts at scene scale.
  Samples: 64 — ray steps per voxel column.
    64 is sufficient for smooth density 0.042.  Very dense scenes (Density > 0.2)
    may need 128 to avoid banding.

Changing Tile Size from 4 to 2 halves the performance but doubles the
effective sample density — the beam edges go from slightly jagged to smooth.`,
      },
      {
        title: "Build the fake emission cone for GLB export",
        content: `glTF 2.0 has no volume extension — the World volume does not transfer to GLB.
Build a proxy cone mesh for WebXR rendering:

Add a cone (Shift+A › Mesh › Cone, 20 vertices).
Scale to match the beam: for the amber light at height 4.2m with 28° half-angle,
base radius = tan(28°) × 4.2 ≈ 2.23 m.
Position apex at the light location; base at the floor centre.
Rotate to align the cone axis with the light direction.

In Material Properties:
  Add a new material.
  In Shader Editor: delete Principled BSDF.
  Add Mix Shader → Transparent BSDF (input 1) + Emission (input 2).
  Emission Colour: (1.0, 0.6, 0.2) warm amber.  Strength: 0.35.
  Mix Factor (Fac): 0.11 — 11% emission, 89% transparent.
  In Material Properties header: Blend Mode → Alpha Blend.

This cone exports cleanly to GLB.  In Three.js / Babylon.js the alpha-blended
emissive cone reads as a glowing shaft against the dark background mesh.
The blueprint.py add_fake_cone() function builds this automatically for both lights.`,
      },
    ],
    finalResult:
      "A dark interior with two crossing spot-light god-ray cones (warm amber + cool teal) rendered in EEVEE Next 5.1. Bloom halos the lamp bodies. The GLB export contains transparent emission-cone meshes as WebXR beam proxies, with the dark floor and back wall as scene geometry.",
    variations: [
      "Coloured height fog: add a Gradient Texture node (object space, Z axis) driving the Density input of Principled Volume via a Color Ramp. Map the bottom 20% of the room to density 0.12 (thick ground fog) and the top 60% to density 0.02 (clear air). The result is a noir-style floor haze with clean air above — spot beams cut through the thick layer and become fainter as they rise. Pair with the procedural wood-grain floor from the procedural wood tutorial for a full noir floor-level stage look.",
      "Animated density pulse: keyframe World › Principled Volume › Density from 0.02 → 0.09 → 0.02 over 48 frames (2 seconds at 24fps). This simulates a slow atmospheric swell — dusty air gusting through the scene. In the NLA editor, create an action strip and loop it for the full animation. The effect is especially prominent when Anisotropy is 0.55–0.65, as the shaft visibility pulses in and out with the density.",
      "Window god rays: replace the spot lights with a large Area light (2 m × 0.15 m, positioned outside a wall opening) and place a grid of thin box-primitives across the opening to simulate window bars. Each bar casts a hard shadow into the volume, producing parallel shafts that sweep across the floor as the light angle changes. This requires a higher Shadow Soft Size on the Area light (0.0 = sharp bars) and benefits from increasing Volumetric Shadow Samples to 32.",
    ],
    troubleshooting: [
      {
        symptom: "No visible shaft — scene shows a uniform grey haze with no beam shape",
        cause:
          "Volumetric Shadows is off. Without shadow-map occlusion, every voxel in the frustum receives the full scatter contribution from the spot light, producing a flat omnidirectional glow. The beam shape emerges only when the shadow map actively blocks the volume outside the cone.",
        fix: "Properties › Render › Volumetrics → tick Volumetric Shadows. Set Shadow Samples to at least 8. If the shaft still does not appear, confirm the spot light has Cast Shadow enabled in Light Properties, and that Spot Blend is less than 0.5 (a very high Blend value makes the cone edge so diffuse it blends into the ambient haze).",
      },
      {
        symptom: "Beam has hard rectangular or square step artefacts along its length",
        cause:
          "Tile Size is too large. At '8' or '16', each voxel covers 8 or 16 screen pixels; the scatter integration jumps in discrete steps that are visible as bands or blocks especially at the cone edge.",
        fix: "Reduce Tile Size to '4' or '2' in Properties › Render › Volumetrics. Also increase Samples from 64 to 128 — at larger tile sizes the per-tile sample count is more spread out and the banding becomes visible sooner. If performance is the concern, use '4' for interactive work and switch to '2' only for final renders.",
      },
      {
        symptom: "Fake emission cone appears as a solid white or grey shape in the WebXR viewer",
        cause:
          "The material's Blend Mode is set to OPAQUE (the default for new materials) rather than Alpha Blend. In OPAQUE mode the alpha value from the Mix Shader is ignored and the mesh renders fully opaque at the Emission colour.",
        fix: "In Material Properties, find the Blend Mode dropdown (just below the material name) and set it to Alpha Blend. In the Shader Editor, also confirm the Mix Shader Fac is 0.11 (not 1.0, which would be fully emissive). In Three.js, ensure the corresponding mesh material has transparent=true and alphaTest=0 — the Khronos glTF importer should set this automatically from the KHR_materials_unlit or alpha mode in the GLB.",
      },
    ],
  },
  base,
);

export { entry };
