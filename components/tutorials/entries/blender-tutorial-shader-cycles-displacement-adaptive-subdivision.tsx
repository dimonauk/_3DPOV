import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CyclesDisplacementBody() {
  return (
    <>
      <p>
        Blender offers three levels of surface relief, each more computationally
        expensive and more geometrically honest than the last. <strong>Bump</strong> perturbs
        the shading normal without touching the geometry — the silhouette of a
        sphere stays perfectly smooth even when the surface appears cratered.{" "}
        <strong>Normal maps</strong> encode pre-baked surface orientation into a
        texture, offering cheap high-frequency detail at the cost of a bake
        pass. <strong>True displacement</strong> actually moves vertices along their
        normals, producing correct silhouettes and self-shadowing — but it
        requires Cycles, the Experimental feature set, and an Adaptive
        Subdivision modifier to tessellate the mesh at render time.
      </p>
      <p>
        The Adaptive Subdivision system in Cycles is camera-relative: the{" "}
        <em>dicing rate</em> specifies the maximum micropolygon edge length in
        screen pixels, so a sphere close to the camera automatically receives
        more geometry than the same sphere in the background. This is the same
        principle as REYES rendering (used in Pixar&apos;s RenderMan since the
        1980s) applied to a modern GPU-accelerated path tracer. The practical
        consequence is that you model at low-poly resolution and let Cycles
        handle the tessellation budget — a 512-quad UV sphere renders as though
        it has hundreds of thousands of faces at a dicing rate of 1.0 pixel.
      </p>
      <p>
        The studio pipeline goes one step further: after finalising the
        displacement in Cycles, a bake pass writes the displaced surface to a
        2&thinsp;K normal map on the original low-poly UV layout. That normal
        map travels into the GLB alongside the base colour and roughness
        textures, giving near-identical shading in WebXR / Three.js without any
        subdivision geometry at runtime. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO tutorial
        </Link>{" "}
        for the full multi-object bake workflow.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-cycles-displacement-adaptive-subdivision",
  title:
    "Cycles Adaptive Subdivision + True Displacement: Micropolygon Stone Surface",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "Build a stone-surface material that displaces actual Cycles geometry using Adaptive Subdivision, then bake the result to a 2 K normal map for WebXR/GLB delivery.",
  Body: CyclesDisplacementBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-cycles-displacement-adaptive-subdivision/",
    time: "one focused session",
    difficulty: "advanced",
    overview:
      "Cycles' Experimental feature set unlocks Adaptive Subdivision — a camera-relative micropolygon tessellator that produces true geometric displacement without permanently subdividing the mesh. This tutorial builds a Noise Texture → ColorRamp → Displacement node chain on a UV sphere, configures dicing rates, compares the three displacement modes side-by-side, and ends with a bake pass that converts the displaced geometry to a portable normal map.",
    goal: "A Blender 5.1 stone sphere with camera-adaptive micropolygon displacement (Noise fBm, clipped valleys, dicing rate 1.0 px) and a 2 K baked normal map ready for GLB/WebXR export.",
    prerequisites: [
      "Comfortable navigating the Shader Editor and adding/linking nodes",
      "Basic understanding of Cycles render settings",
      "Familiar with UV unwrapping (Smart Project is sufficient here)",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Must be set to Cycles + Experimental feature set for true displacement",
      },
    ],
    steps: [
      {
        title: "Enable Cycles + Experimental feature set",
        body: `Open Properties › Render Properties.  Set Render Engine to Cycles.

Locate the Feature Set dropdown (just below the engine selector) and switch it from Supported to Experimental.  A new Subdivision section appears in the render panel.

WHY: Adaptive Subdivision lives in Experimental because render times on complex scenes are hard to predict — Blender flags it so you know the tessellator is unbounded without a sensible dicing rate.  The feature itself is stable in 5.1; the warning is a good-faith nudge, not a bug report.

Set Dicing Rate to 1.0 px (fine quality) and Preview Dicing Rate to 8.0 px (fast viewport preview).`,
      },
      {
        title: "Add a UV sphere and Adaptive Subdivision modifier",
        body: `Add › Mesh › UV Sphere with Segments=32, Rings=16.  This stays as the edit mesh; Cycles handles the tessellation.

With the sphere selected: Properties › Object Properties › Modifiers › Add Modifier › Subdivision Surface.
  • Subdivision Type: Catmull-Clark
  • Tick Use Adaptive Subdivision (only visible under Experimental)
  • Levels Viewport: 1  (one manual level for solid-mode preview)
  • Render Levels: 6    (fallback if adaptive is disabled)

In Edit Mode: select all → UV › Smart UV Project (angle limit ~66°).  The UV is needed both for texture-coordinate lookups in the Displacement node and for the future normal bake.`,
      },
      {
        title: "Set displacement mode on the material",
        body: `With the sphere active, open Properties › Material.  Create a new material named displaced_stone.

Scroll down to the Settings section and locate Displacement.  Switch from Bump Only to Displacement Only.

mat.cycles.displacement_method = 'DISPLACEMENT'  # Python equivalent

This tells Cycles to move vertices rather than just perturb normals.  Without this switch the Displacement socket on the Material Output is ignored — many beginners wire up the Displacement node correctly but forget this setting and wonder why nothing changes.`,
      },
      {
        title: "Build the displacement node graph",
        body: `Open the Shader Editor.  Clear the default nodes and build this chain:

Texture Coordinate (UV output)
  → Noise Texture
      Scale=5.0, Detail=10.0, Roughness=0.65, Distortion=0.15
  → ColorRamp (Ease interpolation)
      Left stop at 0.35  ← clips valleys flat; only peaks displace outward
      Right stop at 1.0
  → Displacement node
      Space: Object  ← height is independent of object scale
      Midlevel: 0.0  ← displace outward only
      Scale: 0.12    ← 12 cm peak height
  → Material Output (Displacement socket)

Also add a Principled BSDF → Material Output (Surface):
  Base Color: (0.38, 0.32, 0.26) warm sandstone
  Roughness: 0.88
  Metallic: 0.0

The ColorRamp stop at 0.35 is the designer decision: noise values below 35% map to flat (zero displacement), so the valleys read as eroded stone beds rather than foam rubber. Slide it toward 0 for a bumpier look; toward 0.5 for deep craters.`,
      },
      {
        title: "Check dicing in the Rendered viewport",
        body: `Switch the viewport to Rendered mode (Z key › Rendered, or the sphere icon in the top-right).  Give Cycles 10–20 seconds to progressively refine.

Switch to Material Preview (EEVEE) and back to Rendered — notice how the silhouette in Rendered mode shows actual geometric ridges, while Material Preview is smooth.  This is the fundamental difference between true displacement and bump shading.

Open Viewport Overlays › Statistics.  Change Dicing Rate from 8.0 to 1.0 and watch the triangle count jump — at 1.0 px the sphere has ~200 K+ triangles at this camera distance; at 8.0 px it has ~3 K.  The camera-adaptive system means those 200 K triangles only exist on screen when the camera is close.`,
      },
      {
        title: "Bake displaced normals to a 2 K texture",
        body: `The displacement is Cycles-only; GLB/WebXR scenes need the equivalent encoded as a normal map.

1. Duplicate the sphere (Shift+D → confirm in place).  Name it stone_sphere_bake_target.
2. Remove the Subdivision modifier from the duplicate (it receives the bake, stays low-poly).
3. Create a new material on the target with one Image Texture node — create a new 2048×2048 image, Non-Color space.  Make this node active (click it; it gets a white outline).
4. Select stone_sphere_bake_target (low-poly, active), Shift-click stone_sphere (displaced source).
5. Properties › Render › Bake:
   • Type: Normal
   • Tick Selected to Active
   • Cage Extrusion: 0.25  (must exceed maximum displacement height of 0.12)
6. Click Bake.  The 2 K normal map fills in; ~30–60 s on CPU.

Replace the Displacement node chain with a Normal Map node reading the baked image + a Bump node for micro-roughness.  Export to GLB with the normal map included.  The result is visually near-identical to the Cycles version at a fraction of the geometry cost.`,
      },
      {
        title: "Export the low-poly + baked normal as GLB",
        body: `Select the bake target sphere.  File › Export › glTF 2.0.

Key export settings:
  • Include: Limit to Selected Objects  ← exports only the low-poly sphere
  • Geometry: Apply Modifiers  (none remain on the target)
  • Material: Images as WebP, JPEG Quality 90
  • Compression: Draco level 6

The resulting GLB carries the baked normal map as an OCT/tangent-space normal
in the normalTexture slot of the PBR material — readable by Three.js
MeshStandardMaterial.normalMap at runtime without any subdivision.

holoflow_webxr_exporter convention: ensure the root object is named
stone_sphere_bake_target (snake_case), transforms are applied
(Ctrl+A › All Transforms before export), and +Y-up is active in the GLB
exporter Advanced settings.`,
      },
    ],
    finalResult:
      "A Blender 5.1 stone sphere with Cycles Adaptive Subdivision (dicing rate 1.0 px) driven by a Noise Texture fBm (Scale=5, Detail=10) through a valley-clipping ColorRamp to a Displacement node (Scale=0.12 m, Space=Object). Correct displaced silhouettes in Cycles Experimental mode. A 2 K normal map baked from the displaced high-poly to the original low-poly UV layout, ready for GLB/WebXR delivery via Three.js MeshStandardMaterial.normalMap.",
    variations: [
      "Vector Displacement for overhangs: replace the Displacement node with a Vector Displacement node (ShaderNodeVectorDisplacement) and feed an RGB EXR baked from a sculpted high-poly — the RGB channels encode XYZ displacement simultaneously, allowing overhangs and undercuts that a scalar height field cannot represent. Set Space to Object on the Vector Displacement node. The bake type is DIFFUSE with Color rather than NORMAL. This is the pro-VFX workflow for character skin detail.",
      "Layered displacement: mix two Noise Textures at different scales (Scale=2 for large rock forms, Scale=15 for fine grain) using a MixRGB set to Add, clamped by a ColorRamp. Feed the combined output into the Displacement node. The large-scale noise provides the primary silhouette and the fine-scale noise adds surface texture. Adjust the weights so the fine layer contributes roughly 20% of the total Scale to avoid aliasing at the dicing rate.",
      "Animated displacement: add a Mapping node between Texture Coordinate and Noise Texture. Driver the Mapping node's Z Location with #frame * 0.003 (Python driver expression). The noise field scrolls through the sphere surface frame by frame, simulating a breathing or morphing organic surface. Bake at a single representative frame for GLB export; for WebXR animation, export a sequence of GLBs and step through them as morph targets.",
    ],
    troubleshooting: [
      {
        symptom: "The Adaptive Subdivision tick is greyed out on the modifier",
        cause:
          "The render engine is not set to Cycles, or Cycles is not in Experimental feature set mode. The modifier shows the option only when both conditions are true.",
        fix: "Properties › Render › Render Engine: Cycles. Properties › Render › Feature Set: Experimental. The modifier's Use Adaptive Subdivision checkbox will then become interactive. If the tick is visible but the viewport still shows static subdivision, verify you are in Rendered mode (not Solid or Material Preview) — EEVEE does not evaluate Adaptive Subdivision.",
      },
      {
        symptom: "The displaced geometry looks correct in Rendered view but the silhouette is still smooth",
        cause:
          "mat.cycles.displacement_method is still set to BUMP (the default). The Displacement node is wired to Material Output but the engine is ignoring the displacement socket and treating it as a normal perturbation.",
        fix: "Properties › Material › Settings › Displacement: switch from Bump Only to Displacement Only (or Displacement and Bump). Confirm in the Shader Editor that the Displacement node output connects to the Displacement socket (bottom input) of the Material Output, not the Surface socket.",
      },
      {
        symptom: "Bake produces a flat pink normal map with no detail",
        cause:
          "The ray cast from the low-poly surface did not reach the displaced high-poly geometry. Either Cage Extrusion is too small (rays stop short of the displaced peaks) or the source object (displaced sphere) is not selected before the bake.",
        fix: "Set Cage Extrusion to at least 150% of the maximum displacement Scale value — for Scale=0.12 m, use 0.18–0.25 m. Ensure the workflow is: select low-poly (bake target) first, Shift-click high-poly (displaced sphere) second, then make low-poly active (brighter orange outline). Only with Selected to Active ticked and the high-poly selected will Blender cast rays from the low-poly surface outward to capture the displaced surface.",
      },
      {
        symptom: "Render is very slow or hangs at high dicing subdivisions",
        cause:
          "The dicing rate is too fine (close to 0.1 px) or the camera is very close to the sphere, generating millions of micropolygons. Memory can also be exhausted if max_subdivisions is too high.",
        fix: "Set scene.cycles.dicing_rate to at least 0.5 px for test renders; use 1.0 px for final quality. Set scene.cycles.max_subdivisions = 8 to cap the per-face subdivision count regardless of camera distance. If memory is exhausted (>16 GB VRAM on GPU), switch to CPU rendering or increase dicing rate.",
      },
    ],
  },
  base,
);

export { entry };
