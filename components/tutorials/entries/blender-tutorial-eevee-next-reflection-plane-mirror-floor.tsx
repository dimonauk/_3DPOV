import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeNextReflectionPlaneMirrorFloorBody() {
  return (
    <>
      <p>
        EEVEE Next ships three mechanisms for specular reflections and each
        occupies a distinct position in the quality-versus-cost space.{" "}
        <strong>Screen Space Reflections</strong> trace rays in 2D image space:
        fast, zero bake time, but inherently blind to geometry that is not
        currently on screen — move the camera and the floor near the edges
        loses its reflection, even though the scene geometry is still there.{" "}
        <strong>Sphere Probes</strong> capture a 360° cubemap from one point in
        the scene, pre-filter it into a mip chain, and let any glossy surface
        within the influence radius sample it — excellent positional accuracy,
        correct parallax, but the result is static: bake once, pay forever,
        and re-bake whenever a light or object moves.  The{" "}
        <strong>Plane Light Probe</strong> (type{" "}
        <code>&apos;PLANAR&apos;</code>) is the third option and the subject of
        this tutorial: it renders the scene from a camera reflected across the
        probe&apos;s plane normal on every single frame, reprojects the result
        onto surfaces inside its influence volume, and gives you{" "}
        <em>dynamic, geometrically-correct</em> specular reflections on flat
        surfaces with no bake step.  Move an object, scrub the timeline, swap
        a light&apos;s colour — the floor reflection updates instantly.
      </p>

      <p>
        The price is one additional geometry draw call per opaque mesh that
        sits inside the probe&apos;s rectangular footprint.  For a scene with
        four columns and two spheres that is six extra draw calls per rendered
        frame — negligible on a modern GPU but worth understanding before you
        tile twenty probes across a large interior.  The technique is therefore
        best applied selectively: one probe per flat reflective surface (floor,
        water plane, studio tabletop), with the surrounding geometry handled by
        Sphere Probes for curved surfaces and SSR as a catch-all fallback.  This
        tutorial builds exactly that layered stack, following the same lighting
        philosophy as the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          Irradiance Volume + Sphere Probe tutorial
        </Link>
        , which covers the baked-GI half of the EEVEE Next probe system.  Where
        that tutorial trades freshness for completeness (bake once, cover the
        whole room), the Plane Probe trades completeness for freshness — it only
        knows about flat surfaces but it always knows what they look like right
        now.
      </p>

      <p>
        The critical parameter that trips up most newcomers is{" "}
        <code>clip_start</code> on the probe data-block.  When the probe sits
        exactly at Z&nbsp;=&nbsp;0 with a clip_start of 0, the reflected
        camera&apos;s near plane also sits at Z&nbsp;=&nbsp;0, and the floor
        mesh at Z&nbsp;=&nbsp;0 intersects it with floating-point instability —
        the result is a dark horizontal band drawn across the centre of the
        reflection where the floor self-intersects the capture geometry.  The
        fix is a clip_start of 0.001–0.005&nbsp;m: just enough to push the near
        plane clear of the floor surface.  The blueprint in this tutorial sets
        it to 0.002&nbsp;m and places the probe origin at the same height, so
        the reflected camera starts cleanly above the floor mesh every frame.
        Contrast this with the equivalent artefact in Sphere Probes — the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-path-glass-fireflies"
          className={lk}
        >
          Cycles Light Path glass tutorial
        </Link>{" "}
        contains a parallel discussion of near-plane self-intersection in a
        transmission context, where the fix is{" "}
        <code>Transparent Shadows</code> rather than clip_start, but the
        root cause is the same: a rendering camera too close to the surface
        it is trying to sample.
      </p>

      <p>
        For the WebXR export side, the Plane Probe does not survive the glTF
        pipeline — the glTF&nbsp;2.0 specification has no planar reflection
        extension.  The closest WebXR equivalent is a static equirectangular
        panorama rendered from floor level and fed to Three.js via{" "}
        <code>PMREMGenerator.fromEquirectangular()</code>, which pre-filters it
        into the same mip chain that{" "}
        <code>MeshStandardMaterial.envMap</code> expects.  The{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/PMREMGenerator.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Three.js PMREMGenerator source (MIT)
        </a>{" "}
        is a clean read — the key insight is that it builds the mip chain by
        convolving the equirectangular against a split-sum approximation of the
        GGX BRDF, exactly matching what Blender&apos;s offline bake does for
        Sphere Probes.  This is the same pipeline that powers the reflection
        quality in the{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>
        .  The approach trades the live update of the Plane Probe for a
        one-time render cost at scene load, which is the right trade-off for
        most WebXR experiences where the camera moves but the environment lights
        do not.  For scenes where lights animate, the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-linking-character-rig"
          className={lk}
        >
          EEVEE Light Linking character rig tutorial
        </Link>{" "}
        shows how to contain animated lights within selective influence sets so
        that surrounding probe captures remain stable and do not need re-baking
        every frame.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-eevee-next-reflection-plane-mirror-floor",
  title:
    "EEVEE Next — Reflection Plane Probe: Real-Time Specular Mirror Floor",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "EEVEE Next Plane Light Probe (type='PLANAR'): live, geometrically-correct specular reflections on flat surfaces with no bake step. Probe placement, clip_start self-intersection fix, SSR roughness cutoff, GLB export and Three.js PMREMGenerator WebXR equivalence. Blender 5.1.",
  Body: EeveeNextReflectionPlaneMirrorFloorBody,
};

export const entry = buildInstructable(
  {
    time: "one session (45–90 minutes)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 (EEVEE Next renderer)",
        "blueprint.py from public/library/blends/lighting/eevee-next-reflection-plane-mirror-floor/",
      ],
      tools: [
        "3D Viewport › Rendered shading mode",
        "Properties › Object Data (probe clip_start, falloff, influence_distance)",
        "Properties › Render › Screen Space Reflections",
        "Scripting workspace",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and switch to Rendered mode",
        content: `Open Blender 5.1.  In the Scripting workspace, open blueprint.py and click Run Script.
The script creates:
  mirror_floor       — 10 × 10 m plane, Roughness 0.04, IOR 1.52
  column_00–03       — four brass cylinders at the corners
  sphere_red         — red glossy sphere, left of centre
  sphere_blue        — blue glossy sphere, right of centre
  refl_plane_probe   — Plane Light Probe at Z = 0.002
  sun_key + area_fill — asymmetric lighting rig
  camera_main        — low-angle 28 mm camera (height 0.55 m)

Switch to the Layout workspace.  Press Z and select Rendered.
The reflection appears immediately in the viewport — no bake button, no loading bar.
This live update is the defining characteristic of the Plane Probe compared to the
Sphere Probe (which shows nothing until you press Bake Indirect Lighting).

Confirm the reflection is working: the polished floor should show inverted colour
images of the red and blue spheres, and the shadow cast by the key sun should
appear both below the columns and reflected in the floor below those shadows.`,
      },
      {
        title: "Inspect the probe object and its data properties",
        content: `Select refl_plane_probe in the Outliner.
Switch to Properties › Object Data (the light probe icon — a green sphere with a ring).

You will see three parameters set by blueprint.py:

  Clip Start: 0.002 m
    The near clipping plane for the reflected camera.  Must be > 0.
    At 0.0, the camera origin coincides with the floor surface and floating-point
    rounding causes the floor to partially self-intersect the capture, producing
    a dark stripe across the centre of the reflection.
    0.002 m is the minimum safe value for a floor at Z = 0.

  Falloff: 0.15
    Fraction of the influence rectangle used as an edge-blend zone.
    0.15 → the outer 15% of the footprint blends from full probe contribution
    down to zero; beyond that edge, SSR takes over.
    Too low (< 0.05) → hard seam visible where probe ends and SSR begins,
    especially on low-roughness materials at glancing camera angles.
    Too high (> 0.40) → the probe contribution is diluted across the whole
    footprint; centre reflections look washed.

  Influence Distance: 2.9 m
    How far above the probe plane the influence volume extends (metres).
    Set to COLUMN_HEIGHT + 0.5 so all columns are inside the influence volume
    and their geometry is captured in the reflection.
    Geometry above this height falls back to SSR.

Also inspect the probe object scale in the viewport header or N-panel:
  Scale X/Y: 4.6, Scale Z: 1.0
This rectangular scale controls the footprint — the orange rectangle you see
in the viewport.  The probe captures and reprojects reflections only within
this rectangle; scale it to match the physical floor boundary.`,
      },
      {
        title: "Understand the SSR max-roughness cutoff",
        content: `The Plane Probe and SSR share one critical setting:
Properties › Render › Screen Space Reflections › Max Roughness.
In blueprint.py this is set to 0.45.

Rule: any surface with Roughness > Max Roughness receives no specular reflection
from either SSR or the Plane Probe.  The material just shows the diffuse BSDF
lobe plus the World environment contribution — a matte surface.

To see this live:
  1. Select mirror_floor.
  2. Open Properties › Material › Surface › Roughness.
  3. Drag Roughness from 0.04 upward toward 0.50.
  At Roughness ≈ 0.45 the reflection cuts out completely — floor goes matte.
  4. Drag back to 0.04.  Reflection returns.

This is a hard threshold, not a gradual fade (unlike how roughness affects BSDF
highlight sharpness).  In production, set SSR Max Roughness to the roughest
material in the scene that still needs a meaningful reflection — typically
around 0.35–0.55 for interior arch-viz.  Surfaces above this threshold save
the extra draw call cost entirely.

Note: record.py animates this cutoff transition across 90 frames.  Run it and
press Space to play to see the before/after reveal.`,
      },
      {
        title: "Demonstrate the live update advantage",
        content: `This step proves the Plane Probe is live, not baked.

  1. In Rendered mode, grab sphere_red (G then X to constrain) and drag it
     left and right.  The floor reflection tracks the sphere in real time.
     Release with Enter to drop it, Alt+G to reset.

  2. Select sun_key.  In Properties › Object Data › Light, change Energy from
     5.0 to 20.0.  The shadow in the floor reflection brightens immediately.
     Reduce back to 5.0.

  3. Select area_fill.  In the same panel, change Colour to a warm orange
     (H=0.07, S=0.8, V=1.0).  The whole fill side of the scene and its
     reflection changes colour without any bake.
     Reset to white (H=0.0, S=0.0, V=1.0).

Repeat the same experiment after enabling a Sphere Probe instead:
  - Shift+A › Light Probe › Sphere, position at (0, 0, 1.0).
  - Without baking, the sphere probe contributes nothing.
  - After baking, moving sphere_red leaves the reflection frozen — it
    shows sphere_red at its original position.
  This contrast is the core teaching: Plane Probe = live;
  Sphere Probe = accurate-but-static.`,
      },
      {
        title: "Adjust probe footprint for partial-floor coverage",
        content: `For large rooms it is often more efficient to cover only the area
where reflections matter rather than the entire floor.

To split the probe into two smaller footprints (e.g., left half and right half
of the floor):

  1. Select refl_plane_probe.  In the viewport, scale X down to half:
     S X 0.5 Enter.  The footprint shrinks to cover only the left half.
     Notice that the right half of the floor now shows SSR fallback only —
     rougher and with screen-space artefacts near the camera bottom edge.

  2. Shift+D to duplicate.  Move the duplicate to the right half:
     G X 2.3 Enter.  You now have two probes, each covering one half.
     The cost is two reflected render passes instead of one, but each pass
     draws fewer meshes (only those inside the respective footprint).

  3. For the tutorial, undo back to a single full-floor probe: Ctrl+Z twice.

The general rule: one probe per contiguous reflective surface of roughly
equal area to the capture footprint.  Overlapping probes blend by distance
at any given surface point — EEVEE picks the probe whose origin is closest.`,
      },
      {
        title: "GLB export and WebXR PMREMGenerator workflow",
        content: `File › Export › glTF 2.0:
  Format: GLB
  Draco compression: ON, level 6
  Images: WebP
  Apply Modifiers: ON
  +Y Up: ON
  Lighting Mode: Unitless

The exported GLB contains the floor mesh, columns, and spheres.  The
refl_plane_probe object is skipped — glTF 2.0 has no planar reflection type.
The floor in a Three.js WebXR scene will initially show only the envMap
contribution (no floor-specific reflection).

To add a convincing WebXR-equivalent reflection:

  1. In Blender, add a Camera at (0, 0, 0.05) — floor level.
     Camera › Type: Panoramic.  Panorama Type: Equirectangular.
     Resolution: 2048 × 1024.  Render engine: EEVEE Next (probe baked) or Cycles.
     Render to EXR: Render › Render Image, Image › Save As… → floor_env.exr.

  2. In Three.js:
       import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
       const exr = await new EXRLoader().loadAsync('floor_env.exr')
       const pmrem = new PMREMGenerator(renderer)
       const envMap = pmrem.fromEquirectangular(exr).texture
       floorMaterial.envMap = envMap
       floorMaterial.envMapIntensity = 1.0

  This gives the WebXR floor a single-frame-captured reflection — static but
  geometrically correct at floor level.  For animated scenes, re-render the
  panorama and hot-swap the envMap texture at runtime.

  Source: Three.js PMREMGenerator (MIT) — github.com/mrdoob/three.js
  Related upstream projects: @react-three/fiber, @react-three/drei (both MIT).`,
      },
    ],
    finalResult:
      "A polished-floor scene with four brass columns and two coloured spheres rendered in EEVEE Next using a Plane Light Probe for live, no-bake planar reflections. GLB export of scene geometry, plus a tested workflow for adding a PMREMGenerator-based reflection env-map in Three.js for WebXR.",
    variations: [
      "Water plane: set FLOOR_IOR to 1.33, add a Wave Texture node driving the Roughness input (0.0 → 0.25 oscillation) and the Normal input via a Bump node. The Plane Probe captures the reflection through the varying roughness, giving an animated rippled-water surface where rougher crests lose the reflection and smooth troughs mirror perfectly. Add a Noise Texture at a larger scale to drive a subtle Displacement modifier for surface undulation.",
      "Tilted mirror wall: rotate the probe 90° around X so the plane normal faces +Y instead of +Z. Position it at the back wall's surface. The captured reflection now shows the room from a horizontal mirror angle — correct for a bathroom mirror or a shop display backing panel. clip_start should increase to 0.01 m on a vertical wall to clear any wall-thickness geometry.",
      "Glossy table-top for product photography: scale the probe to match a 0.6 × 0.6 m studio table, set FLOOR_ROUGHNESS to 0.08 for a satin lacquer finish, and position two rim lights above and behind the product. The Plane Probe reflection captures only the product and the rim-light flare — nothing else is inside the footprint. This isolates the reflection from background clutter without any compositing.",
    ],
    troubleshooting: [
      {
        symptom:
          "Dark horizontal stripe across the centre of the floor reflection",
        cause:
          "The probe's clip_start is 0.0 m (or very close to 0). The reflected camera's near plane intersects the floor mesh at Z = 0, causing the floor's own backface to be rasterised as an opaque surface inside the reflection — it appears as a dark band at the floor's horizon line.",
        fix: "Select refl_plane_probe. In Properties › Object Data, set Clip Start to at least 0.002 m. Also confirm the probe origin is not below the floor surface (check Z coordinate in the N-panel — it should be ≥ Clip Start). Re-check in Rendered mode; the stripe should disappear without re-baking.",
      },
      {
        symptom:
          "Floor is matte / shows no reflection even with Roughness = 0.04",
        cause:
          "Screen Space Reflections is disabled, or the probe object is hidden (H key), or the probe is in a collection that is excluded from the active View Layer.",
        fix: "Check Properties › Render › Screen Space Reflections: Use Screen Space Reflections must be ON. Then check the Outliner — refl_plane_probe must have the eye icon (viewport) and camera icon (render) both enabled. If the probe is in a collection, confirm that collection is included in the active View Layer (Properties › View Layer › Collections). Finally, confirm the probe Scale is large enough to cover the floor: select the probe and check Scale X and Y ≥ FLOOR_SIZE in the N-panel.",
      },
      {
        symptom:
          "Reflection shows a ghost image of geometry that is not in the scene, or the reflection lags behind when objects move",
        cause:
          "A Sphere Probe is overlapping the Plane Probe's footprint and its baked cubemap is winning the blend. Sphere Probes bake a static capture; when objects move, the sphere probe's stale data competes with the Plane Probe's live render.",
        fix: "Select any Sphere Probe objects in the scene and check their influence radius (Properties › Object Data › Influence Distance). If the sphere probe's influence overlaps the floor, either reduce its influence_distance so it no longer reaches the floor surface, or set Properties › Object Data › Visibility › Indirect Only on the probe (this excludes it from the live Plane Probe capture pass). Alternatively, move the sphere probe origin above the floor so its influence starts at least 0.3 m from the floor surface.",
      },
    ],
  },
  base,
);

export { entry };
