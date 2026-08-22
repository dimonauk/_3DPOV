import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeNextIrradianceSphereProbeBody() {
  return (
    <>
      <p>
        Without light probes, EEVEE Next evaluates indirect lighting once for
        the entire scene using a single irradiance sample drawn from the World
        shader.  Every surface — regardless of position — receives the same
        diffuse contribution from the sky, and every glossy surface reflects the
        same equirectangular environment.  A red wall in the corner bleeds no
        colour onto the adjacent floor.  A chrome ball reflects the World sky
        rather than the room it sits in.  The scene looks plausible from a
        distance but falls apart under close inspection, especially for
        architectural or product-shot work where position-dependent GI is a
        prerequisite.  Light probes fix this.
      </p>

      <p>
        EEVEE Next ships two probe types that divide the problem cleanly.  An{" "}
        <strong>Irradiance Volume</strong> (<code>type=&apos;GRID&apos;</code>)
        voxelises a region of space and bakes L2 spherical harmonics at each
        grid point — nine coefficients that encode the incoming Lambertian
        radiance from all directions.  Diffuse surfaces across the volume
        interpolate between the nearest grid points to reconstruct
        position-dependent indirect lighting.  A{" "}
        <strong>Sphere Probe</strong> (<code>type=&apos;SPHERE&apos;</code>)
        bakes a single HDR cubemap from one position.  EEVEE Next pre-filters
        this cubemap into a mip chain (a PMREM) so that glossy surfaces at any
        roughness value can importance-sample the correct lobe.  Within the
        probe&apos;s influence radius the metallic surface reflects actual room
        geometry; outside it falls back to the World environment.
      </p>

      <p>
        The critical detail that trips up newcomers: both probe types must be{" "}
        <strong>baked</strong> before they contribute anything to the render.
        An unbaked probe object is a bounding shape with no data — it appears
        in the Outliner, shows its orange influence cage in the viewport, and
        does absolutely nothing to the image.  Baking requires an OpenGL context
        because EEVEE rasterises each cubemap face on the GPU.  The bake runs
        via Properties &rsaquo; Render &rsaquo; Indirect Lighting &rsaquo; Bake
        Indirect Lighting.  The resulting cache is stored inside the{" "}
        <code>.blend</code> file, which is why probe-baked scenes are larger on
        disk than their geometry alone would warrant — and why the GLB export
        is leaner: the exporter discards probe data entirely since glTF&nbsp;2.0
        has no irradiance-volume extension.  For WebXR scenes that need
        probe-quality reflections, the workaround is a panoramic 360° render
        from the probe&apos;s position (Camera type&nbsp;= Panoramic, Panorama
        Type&nbsp;= Equirectangular), which Three.js consumes via{" "}
        <code>PMREMGenerator.fromEquirectangular()</code> — the same technique
        used in the{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>
        .  Compare the purely node-based material export approach described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF v2 Transmission + Iridescence tutorial
        </Link>
        , where the reflective effect survives GLB export without any bake step
        because it is encoded as material parameters rather than captured image
        data.  The contrast between the two strategies is the central design
        decision in any EEVEE-to-WebXR pipeline.  For static scenes, baked
        cubemap extraction is higher quality; for dynamic scenes, the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone"
          className={lk}
        >
          proxy-mesh approach from the volumetric light cone tutorial
        </Link>{" "}
        generalises better.
      </p>

      <p>
        The blueprint builds a small gallery room (4 &times; 4 &times; 3&nbsp;m)
        with a bright red left wall and an emerald green right panel — both
        deliberately intense so that colour bleeding onto the floor, ceiling, and
        the central chrome sphere is unmistakable.  A 4&nbsp;&times;&nbsp;4&nbsp;&times;&nbsp;3
        voxel Irradiance Volume covers the room; one Sphere Probe sits at the
        chrome ball&apos;s centre with an influence radius of 1.2&nbsp;m.  The
        record script toggles the Sphere Probe off and on mid-animation as a
        visual before/after — the single most instructive demo for showing what
        a probe contributes.  Follow along with the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>{" "}
        for the complementary Cycles baking workflow, which captures the same
        indirect information as vertex colours or a UV normal map rather than a
        probe cache.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-eevee-next-irradiance-sphere-probe",
  title: "EEVEE Next — Irradiance Volume + Sphere Probe: Baked Indirect Lighting",
  date: "2026-06-11",
  kind: "tutorial",
  excerpt:
    "EEVEE Next two-tier probe system: Irradiance Volume (L2 spherical harmonics, voxel grid) for position-dependent diffuse GI, Sphere Probe (HDR cubemap, PMREM pre-filter) for accurate specular reflections. Bake workflow, influence radius, parallax correction, and WebXR cubemap extraction. Blender 5.1.",
  Body: EeveeNextIrradianceSphereProbeBody,
};

export const entry = buildInstructable(
  {
    time: "one session (1–2 hours including bake time)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 (EEVEE Next renderer — the only EEVEE in 5.x)",
        "blueprint.py from public/library/blends/lighting/eevee-next-irradiance-sphere-probe/",
      ],
      tools: [
        "3D Viewport › Rendered shading mode",
        "Properties › Render › Indirect Lighting (Bake button)",
        "Properties › Object Data (probe settings)",
        "Scripting workspace",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and inspect the unbaked state",
        content: `Open Blender 5.1.  Switch to the Scripting workspace, open blueprint.py,
and click Run Script.  The script builds the 4 × 4 × 3 m gallery room with the
chrome sphere, pedestal, and two lights.  It also adds the Irradiance Volume
and Sphere Probe objects, and sets EEVEE Next as the render engine.

Switch the 3D Viewport to Rendered mode (Z → Rendered, or the sphere icon in
the viewport header).  What you see is the UNBAKED baseline: the chrome sphere
reflects only the World environment (a neutral grey sky), the red wall bleeds
no colour onto the floor, and the scene looks flat and uniform.

This is intentional.  Identifying the unbaked state is the first skill:
  • Chrome sphere shows a simple grey gradient — no room reflections.
  • Floor near the red wall is not pink-tinged.
  • Pedestal under the sphere has no warm/cool gradient from the two lights.

The Irradiance Volume and Sphere Probe objects are visible as orange wireframe
cages in the viewport.  They are structurally present but contribute nothing
until baked.`,
      },
      {
        title: "Configure probe quality settings",
        content: `Before baking, verify the quality settings in Properties › Render.
Scroll to the Indirect Lighting section (only visible when the engine is EEVEE Next).

  Irradiance Volume Resolution: set via the probe object, not here.
    Select the "irradiance_volume_room" object.
    In Properties › Object Data, you see:
      Resolution X: 4, Y: 4, Z: 3  (set by blueprint.py)
    These are the voxel counts per axis.  4×4×3 = 48 voxels for a 4×4×3 m room —
    one voxel per metre on each axis.  For a smooth gradient in a small room this
    is adequate.  For large interiors (10m+ rooms) use 6–8 voxels per metre in
    areas with strong colour variation.

  gi_cubemap_resolution (Cubemap Size): 256
    This controls the resolution of each Sphere Probe face.
    256 → 256×256 px per face, × 6 faces = 393k px per probe.
    Adequate for room-sized scenes and chrome objects up to ~50 cm.
    Raise to 512 for architectural visualisation where reflections show
    fine edge detail.  Raise to 1024 for stills only — bake time multiplies.

  gi_irradiance_pool_size (Irradiance Pool): 32
    Atlas tile count for the irradiance cache.
    32 → can hold 1024 irradiance voxels total across all GRID probes in the scene.
    Our 4×4×3 = 48 voxels fits easily.  Only increase if you add many probes.

Leave Clip Start at 0.10 m and Clip End at 10.0 m (set in blueprint.py on
the probe data blocks).  A clip_start of 0.0 causes self-intersection artefacts
— the probe cubemap captures its own influence cage as a solid surface, producing
dark patches on nearby geometry.`,
      },
      {
        title: "Bake indirect lighting",
        content: `In Properties › Render › Indirect Lighting, click "Bake Indirect Lighting".

The status bar at the top of the Blender window shows progress:
  Baking irradiance: voxel 1/48, 2/48, ... (for the Irradiance Volume)
  Baking reflection: (for the Sphere Probe — one capture per probe)

Bake time at these settings on a modern GPU: ~15–30 seconds.
On CPU-only (no GPU acceleration for EEVEE): 2–5 minutes.

As soon as baking completes, the Rendered viewport updates automatically:
  • The chrome sphere now reflects the room geometry — you should see a
    distorted image of the red wall, ceiling, and warm key light.
  • The floor near the red wall has a pink-red tinge from indirect bounce.
  • The pedestal shows a warm/cool gradient: warm (+Y area light) on top,
    cooler (−Y fill point) on the camera-facing side.

If the viewport does NOT update: press N to open the sidebar, go to the
View tab, and click "Update Probes" — some Blender builds require a manual
refresh after the bake completes.

File › Save now.  The bake cache is stored inside the .blend file.  If you
close without saving, you lose the bake data and must re-bake next session.`,
      },
      {
        title: "Adjust Sphere Probe influence and parallax",
        content: `Select the "sphere_probe_chrome" object.  In Properties › Object Data:

  Influence Distance: 1.20 m — the radius of the probe's effect sphere.
    Surfaces within 1.20 m from the probe centre sample this cubemap for specular.
    Beyond 1.20 m, surfaces blend toward the World environment.

  Falloff: 0.30 — 30% of 1.20 m = 0.36 m transition zone at the boundary.
    In the 0.36 m blending shell, the probe contribution decreases smoothly
    to zero.  A falloff of 0.0 gives a hard cutoff (visible seam on reflective
    surfaces at the boundary).  A falloff of 1.0 means the entire influence
    sphere is a blend — the probe centre gets only 50% weight, which softens
    room reflections too aggressively for a chrome object.

  Custom Parallax: OFF (default)
    When OFF, the influence sphere also acts as the parallax volume.
    The renderer assumes that all reflected geometry lies on the surface of
    a sphere of radius = influence_distance centred at the probe.
    For an isolated object like our chrome ball this is accurate enough.
    For an interior corner, set Custom Parallax ON and set the Parallax
    Distance to match the room half-diagonal (here ~2.8 m) — this corrects
    the apparent position of walls in reflections as the camera moves.

After adjusting Influence Distance: re-bake.  The probe does not automatically
update — every parameter change requires a fresh bake to take effect.`,
      },
      {
        title: "Add a second Sphere Probe for the corner",
        content: `The Irradiance Volume handles diffuse GI across the whole room, but
the specular reflections on any object outside the first Sphere Probe's
influence fall back to the World environment.

Add a second Sphere Probe to cover the right (green) corner:
  Shift+A › Light Probe › Sphere
  Location: (1.8, 1.2, 0.80)       (near the green wall corner)
  Influence Distance: 0.90 m
  Falloff: 0.25

Both Sphere Probes will blend at their boundaries: where their influence
spheres overlap, EEVEE Next weights each probe by the inverse distance from
the surface to each probe's centre.  The chrome sphere at (0, 0, 0.30) is
1.88 m from the new probe — outside its influence — so only the first probe
contributes.  A second metallic object placed in the green corner would
correctly reflect the green wall via the new probe.

Re-bake after adding: Render › Indirect Lighting › Bake Indirect Lighting.
The two probes bake independently; EEVEE composites them per-surface at render
time using the influence weights.`,
      },
      {
        title: "Export GLB and plan the WebXR cubemap workflow",
        content: `File › Export › glTF 2.0:
  Format: GLB
  Draco compression: ON, level 6
  Images: WebP
  Apply Modifiers: ON
  +Y Up: ON

The GLB contains the room geometry and chrome sphere mesh.  It does NOT
contain the probe bake data — glTF 2.0 has no irradiance-volume or sphere-probe
extension.  In a Three.js / WebXR scene the chrome sphere will revert to
environment-map-only reflections unless you supply a custom env map.

WebXR cubemap extraction:
  1. Select the "sphere_probe_chrome" object and note its world location: (0, 0, 0.30).
  2. Add a new camera at that position, set type = Panoramic, Panorama = Equirectangular.
  3. Set resolution to 2048 × 1024 px.
  4. Switch to Cycles (or EEVEE Rendered with the probe baked).
  5. Render to EXR or HDRI format.
  6. In Three.js: load the EXR → use PMREMGenerator.fromEquirectangular() →
     assign to mesh.material.envMap.
  This gives the GLB scene near-probe-quality reflections in the browser without
  any runtime probe system.`,
      },
    ],
    finalResult:
      "A 4 × 4 × 3 m EEVEE Next gallery room with baked indirect lighting: red-wall colour bleed on the floor via Irradiance Volume, and chrome sphere reflections showing room geometry via Sphere Probe. GLB export of room geometry, plus guidance for extracting a PMREM-ready equirectangular env map for WebXR.",
    variations: [
      "Visibility collections on probes: each probe has an Object Properties › Visibility › Indirect Only option and a custom Visibility Collection. Set the Sphere Probe's Visibility Collection to a collection containing only the room walls — this prevents the chrome sphere from reflecting itself in the probe cubemap, which would otherwise produce an incorrect bright blob at the sphere's position in the reflection.",
      "Irradiance Volume for character GI: reduce the GRID voxel volume to a 0.4 × 0.4 × 1.8 m column around a standing character and set resolution to 6 × 6 × 12 (roughly one voxel per 7 cm). The tight grid gives face and hand geometry accurate colour-bled GI from costume fabrics and surrounding props — far closer to Cycles quality than the default world-only pass. Bake after any scene lighting change.",
      "Per-room probe stacking: for a multi-room architectural scene, add one Irradiance Volume per room sized exactly to the room interior and one Sphere Probe per glossy surface. Reduce the per-room falloff to 0.15 to minimise probe bleeding through thin walls. EEVEE Next blends probes by influence weight; a properly sized per-room probe outweighs the adjacent room's probe at every interior point, so colour bleed stops at the wall boundary.",
    ],
    troubleshooting: [
      {
        symptom: "Chrome sphere still shows only a grey world environment after baking",
        cause:
          "The Sphere Probe influence_distance is smaller than the distance from the probe centre to the chrome sphere surface, or the probe object was not included in the bake (hidden, or in an excluded View Layer collection).",
        fix: "Select the sphere_probe_chrome object. In Properties › Object Data, confirm Influence Distance ≥ chrome sphere radius (0.30 m) + a small margin. Confirm the probe is visible in the viewport (not hidden with H). Re-bake. If the probe is in a collection excluded from the View Layer, it will be omitted from the bake even if it appears in the 3D viewport.",
      },
      {
        symptom: "Dark circular patches or black rings visible on the chrome sphere's reflection",
        cause:
          "Clip Start on the Sphere Probe is 0.0 m. At zero clip, the probe rasterises from its exact centre, and floating-point precision at near distance causes the sphere's own surface to self-intersect the probe capture — the geometry at the centre of each cubemap face is rendered as a black disc.",
        fix: "Select sphere_probe_chrome. In Properties › Object Data, set Clip Start to at least 0.05 m (recommended: 0.10 m). This pushes the cubemap near plane out past the self-intersection zone. Re-bake. For very small probes (< 0.3 m influence) you may need Clip Start as low as 0.02 m — keep it just above the probe's minimum expected surface distance.",
      },
      {
        symptom: "Baking finishes instantly (less than 1 second) and nothing changes in the viewport",
        cause:
          "EEVEE Next is not the active render engine, or the Indirect Lighting section is not visible because you are looking at the wrong Properties panel. The bake operator silently exits if no EEVEE Next probes are present in the active view layer.",
        fix: "Check Properties › Render › Render Engine: it must read 'EEVEE' (not 'Cycles' or 'Workbench'). If correct, open the Indirect Lighting section and confirm both probes appear in the probe list. If the section is missing entirely you are on a build prior to EEVEE Next — upgrade to Blender 4.2 or later.",
      },
    ],
  },
  base,
);

export { entry };
