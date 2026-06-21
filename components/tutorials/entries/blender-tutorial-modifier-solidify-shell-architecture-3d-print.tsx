import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SolidifyBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Solidify modifier operates in two modes that share a name
        but solve fundamentally different problems. <strong>Simple mode</strong>{" "}
        offsets every vertex along its averaged face-normal and runs fast — but it
        cannot close concave corners. Where two faces meet at an inward angle (a
        room wall corner, a box frame rebate, any re-entrant edge), the Simple
        inner-offset normals diverge and the resulting faces either gap or
        self-intersect, producing geometry that is not manifold and fails 3D print
        wall-thickness checks. <strong>Complex mode</strong> (Python:{" "}
        <code>solidify_mode = &apos;NON_MANIFOLD&apos;</code>, introduced in
        Blender 2.82) applies a halfedge-miter algorithm: instead of extending
        offset faces until they cross, it inserts a diagonal miter strip at each
        concave vertex so the joint closes cleanly. Use Complex mode by default;
        fall back to Simple only when the source mesh is convex throughout and
        speed matters for very large poly-counts.
      </p>
      <p>
        The canonical test case is an L-shaped room corner — two flat quads
        sharing a vertical corner edge at 90°. Simple Solidify produces an
        overlapping inner corner that is immediately visible in X-ray view and
        causes havoc with physics colliders and slice-preview in slicer software.
        Complex Solidify inserts a 45° miter face and the inner corner closes with
        a single clean diagonal edge. The same miter logic applies at T-junctions,
        five-wall meeting points, and any non-planar open shell — all common in
        architectural modelling and hard-surface prop construction. For the
        hard-surface workflow that stacks Solidify above Boolean cutters, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-boolean-exact-hard-surface-trim"
          className={lk}
        >
          Boolean Exact Hard-Surface Trim tutorial
        </Link>
        , which relies on Solidify being in position [0] of the stack precisely
        so cutters pierce the full wall thickness.
      </p>
      <p>
        The material slot system is one of Solidify&rsquo;s least-documented
        features. The modifier exposes two offset integers:{" "}
        <code>material_offset</code> (added to every shell face&rsquo;s source
        material index) and <code>material_offset_rim</code> (added to rim /
        edge-fill faces). Setting <code>material_offset_rim&nbsp;=&nbsp;1</code>{" "}
        with two material slots (0 = EXTERIOR concrete, 1 = RIM reveal) assigns
        the wall edge faces their own material automatically — no manual
        face-selection in Edit Mode required. Note the limitation: both outer and
        inner shell faces carry the same material index; Solidify uses face
        normals, not material slots, to distinguish them. To assign a distinct
        interior plaster material after the fact, apply the modifier on a
        duplicate, select back-facing geometry in Edit Mode, and reassign — or use
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          GN Store Named Attribute shader bridge
        </Link>{" "}
        to drive a material mix from a normal-direction attribute without
        destructively splitting the mesh.
      </p>
      <p>
        For WebXR delivery the solidified wall corner exports cleanly as a GLB via
        the apply-on-duplicate pattern used throughout this library. The manifold
        output also integrates with the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate Planar LOD workflow
        </Link>{" "}
        — Planar decimation collapses the flat wall panels to exactly two
        triangles each while preserving the miter-corner geometry, giving a
        minimal runtime mesh that still reads as a solid room corner. For 3D
        printing, enable the 3D Print Toolbox (built-in add-on) and run
        Analyse&nbsp;→ Check All after applying the modifier; a correct Complex
        Solidify output should report zero non-manifold edges, zero intersecting
        faces, and zero thin faces above the minimum thickness threshold.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-solidify-shell-architecture-3d-print",
  title:
    "Modifier — Solidify: Simple vs Complex Mode, Wall Thickness for Architecture and WebXR (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Apply Solidify in Complex (Non-Manifold) mode to an L-shaped room corner to produce manifold, miter-correct walls — with a two-slot material system for shell and rim faces — then export as a WebXR-ready GLB.",
  Body: SolidifyBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "beginner",
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-solidify-shell-architecture-3d-print/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Solidify Complex mode (solidify_mode = NON_MANIFOLD) was introduced in Blender 2.82. All parameters in this tutorial confirmed stable in 5.1.",
      },
    ],
    prerequisites: [
      "Knows how to add an object and open the Properties panel.",
      "Comfortable adding a modifier from the spanner (wrench) tab.",
      "Understands the difference between object mode and edit mode — this tutorial stays in object mode.",
    ],
    steps: [
      {
        title: "Simple vs Complex — the one decision that matters",
        body:
          "Open the Solidify modifier panel (Properties → Modifier → Add → Solidify). The Mode dropdown shows 'Simple' and 'Complex'. The difference is the corner-closure algorithm, not performance:\n\nSimple: offsets each vertex along its local average normal. On a flat convex mesh (a single flat plane, a cube face) this is correct and fast. On a concave dihedral angle (any inner corner) the offset normals point toward each other and the inner faces intersect.\n\nComplex (NON_MANIFOLD): at each vertex where the local solid angle is concave, the modifier calculates the bisecting plane of the surrounding faces and inserts a miter face. The resulting mesh has no self-intersections even at acute angles.\n\nPython:\n  mod.solidify_mode = 'NON_MANIFOLD'   # Complex\n  mod.solidify_mode = 'SIMPLE'          # Simple\n\nBenchmark guidance: on meshes under 500 k faces, Complex runs in under 1 second. Switch back to Simple only when profiling confirms it is a bottleneck.",
      },
      {
        title: "Building the L-shaped corner with bmesh",
        body:
          "The blueprint creates two quads that share a vertical corner edge:\n\nWall A: v0(0,0,0) → v1(4,0,0) → v2(4,0,2.8) → v3(0,0,2.8) — flat in XZ, normal faces −Y.\nWall B: v0(0,0,0) → v4(0,3,0) → v5(0,3,2.8) → v3(0,0,2.8) — flat in YZ, normal faces −X.\n\nThe shared edge v0→v3 is the vertical corner. Both faces belong to the same mesh object. Solidify sees the 90° concave dihedral at this edge and correctly inserts a miter strip.\n\nKey bmesh winding rule: vertices must wind counter-clockwise as seen from the outward normal direction for Solidify to know which side is exterior. bm.faces.normal_update() after to_mesh() recalculates normals if unsure.\n\nAlternative construction: model an L-shaped polygon in Edit Mode with the Knife tool, but bmesh is reproducible and script-friendly.",
      },
      {
        title: "Thickness, Offset direction, and Even Thickness",
        body:
          "Three parameters control where the shell grows:\n\nThickness (mod.thickness): the perpendicular distance between outer and inner shell faces. 0.20 m for a masonry wall; 0.003 m for a sheet-metal chassis panel.\n\nOffset (mod.offset): a −1.0 to +1.0 scalar that controls growth direction. −1.0 means the outer (source) face stays in place and the inner shell is pushed inward. +1.0 means the inner shell stays and the outer shell grows. 0.0 splits the thickness evenly either side of the source face.\n\nFor room walls: use Offset = −1.0 (exterior face = the original modelled surface; interior is added inward). For 3D print shells: use 0.0 (source face becomes the mid-surface — true wall thickness is symmetric).\n\nEven Thickness (Simple mode only, mod.use_even_offset): corrects vertex offset on curved surfaces so that the measured wall thickness remains constant along the surface rather than along the local normal. Not available in Complex mode, which uses the EVEN sub-option of nonmanifold_thickness_mode:\n  mod.nonmanifold_thickness_mode = 'EVEN'  # equivalent to Simple's Even Thickness",
      },
      {
        title: "Material slots: shell vs. rim offset system",
        body:
          "Add material slots to the object before adding the modifier. Solidify's material assignments reference slot indices, not material names.\n\nSlot 0: WALL_EXTERIOR (dark concrete, roughness 0.85)\nSlot 1: WALL_RIM (edge reveal, roughness 0.60)\n\nIn the modifier:\n  mod.material_offset     = 0   # shell faces: source_slot + 0 = slot 0\n  mod.material_offset_rim = 1   # rim faces:   source_slot + 1 = slot 1\n\nThis means: if a source face uses material slot 0, its shell copies remain slot 0 (EXTERIOR) and its rim faces become slot 1 (RIM). If the source mesh has multiple materials (e.g., glass vs. concrete), each propagates correctly — the offset is always relative to the source face's slot.\n\nLimitation: both outer and inner shell faces get the same shifted slot. To assign a distinct INTERIOR material, the options are:\n  (a) Apply modifier on duplicate, select back-faces by normal direction (Select → All by Trait → Face Sides → Back), reassign in Edit Mode.\n  (b) Use a GN Store Named Attribute driven by geometry normal direction, then read it in the shader with an Attribute node.\n  (c) Add a second Solidify modifier above the first (experimental, can cause artifacts).",
      },
      {
        title: "Rim Fill Type: NONE, OPEN, CLOSED, BRIDGE",
        body:
          "The Rim Fill Type (mod.rim_fill_mode) controls how the open edges at mesh boundaries — where there is no adjacent face — are handled:\n\nNONE: no rim faces created. The open boundary edges are left as-is. The result is not watertight and will fail 3D print checks. Only use when the rim is intentionally open (a tube, a channel).\n\nOPEN (deprecated name in 5.x — use NONE): same as NONE in most versions.\n\nCLOSED: fills each boundary edge loop with a single quad strip bridging the outer and inner shells. This is the correct setting for watertight geometry. Use for all architecture and 3D print work.\n\nBRIDGE: similar to CLOSED but applies the Bridge Edge Loops algorithm — useful when the rim loop is very complex or when you want the rim to follow a curve rather than a straight bridge.\n\nFor this tutorial: mod.rim_fill_mode = 'CLOSED'. Check watertightness with:\n  bpy.ops.mesh.print3d_check_all()  # 3D Print Toolbox\nor manually: Edit Mode → Select → Select All by Trait → Non Manifold.",
      },
      {
        title: "Modifier stack position with Boolean and Bevel",
        body:
          "When building complex props (as in the Boolean Exact tutorial), the modifier stack position is:\n\n  [0] Solidify  — adds thickness FIRST\n  [1] Boolean A  — cutters pierce the full solidified depth\n  [2] Boolean B\n  [3] Bevel      — chamfers every edge Solidify and Boolean created\n\nIf Solidify sits BELOW Boolean, the Boolean operates on the zero-thickness source plane; Solidify then extrudes the cut edges sideways, producing flared walls rather than vertical channel cuts.\n\nFor the Subdiv + Crease workflow (see the Subdiv Crease Bevel tutorial), Solidify must sit ABOVE Subdivision Surface:\n\n  [0] Solidify   — establishes wall topology\n  [1] Subdivision Surface — subdivides the solidified shell\n\nReversing this order subdivides the thin source plane first, then Solidify extrudes a dense mesh — much higher vertex count for no benefit, and the even-thickness error compounds across the subdivided surface.",
      },
      {
        title: "Export GLB with apply-on-duplicate",
        body:
          "Never apply the Solidify modifier on the working object — the live stack is the source of truth. Instead:\n\n  1. Select the wall_corner object.\n  2. Duplicate: bpy.ops.object.duplicate(linked=False)\n  3. Apply all modifiers on the duplicate:\n       for mod in list(dup.modifiers):\n           bpy.ops.object.modifier_apply(modifier=mod.name)\n  4. Apply transforms: bpy.ops.object.transform_apply(all=True)\n  5. Export with Draco level 6, WebP, Y-up:\n       bpy.ops.export_scene.gltf(\n           filepath=GLB_OUT,\n           use_selection=True,\n           export_draco_mesh_compression_enable=True,\n           export_draco_mesh_compression_level=6,\n           export_image_format='WEBP',\n           export_yup=True,\n       )\n  6. Delete the duplicate.\n\nThe applied GLB for this tutorial is approximately 800–1200 triangles (two wall quads solidified = 12 triangles per wall face × 3 faces per wall + rim + miter). Run the Decimate Planar LOD tutorial afterward to reduce the flat wall areas to 2 triangles each if runtime budget is tight.",
      },
    ],
    finalResult:
      "A manifold, miter-correct L-shaped room corner built from two flat quads, solidified to 200 mm wall thickness using Blender 5.1's Complex (Non-Manifold) Solidify mode. The modifier stack stays live for non-destructive editing. Two material slots assign concrete to the shell and a reveal material to the rim. A GLB export (wall_corner_solidify.glb) is produced via the apply-on-duplicate pattern, ready for WebXR scenes or 3D print slicing.",
    variations: [
      "Boolean below Solidify for window openings: after Solidify adds wall depth, add a Boolean Difference modifier at position [1] with a box cutter mesh that spans the full wall thickness. Because Solidify runs first, the Boolean carves a complete window through both inner and outer faces. Enable Hole Tolerant if the cutter does not fully exit the opposite face. The rim faces around the window opening are not automatically filled — bridge them manually in Edit Mode or add a second nested Solidify to the cutter.",
      "Animated wall reveal: keyframe mod.thickness from 0.0 at frame 1 to 0.20 at frame 60. The walls appear to grow in from nothing — a useful transition for architectural presentations and WebXR room reveals. Combine with a camera that starts outside the wall and tracks through as the interior is revealed.",
      "3D print prep with variable wall thickness: use multiple Solidify modifiers on separate mesh objects for different material requirements (outer skin at 3 mm, structural ribs at 6 mm, base plate at 10 mm). Because Solidify is non-destructive and stackable per-object, each mesh can have its own thickness profile without any boolean merging until the final STL export.",
    ],
    troubleshooting: [
      {
        symptom: "Inner corner faces overlap or self-intersect",
        cause:
          "Solidify mode is set to Simple. Simple mode offsets vertex positions along averaged normals without miter correction — at concave corners the inner faces cross.",
        fix:
          "Switch mod.solidify_mode to 'NON_MANIFOLD' (Complex). In the Properties panel: Modifier → Solidify → Mode → Complex. Verify in X-ray view (Alt+Z) that the inner corner is now a clean miter diagonal instead of crossing faces.",
      },
      {
        symptom: "Rim faces are missing — inner and outer shells are not connected",
        cause:
          "mod.use_rim is False, or rim_fill_mode is 'NONE'. The open boundary edges at mesh borders are not filled.",
        fix:
          "Enable mod.use_rim = True and set mod.rim_fill_mode = 'CLOSED'. In the Properties panel: Solidify → Fill Rim → enable, Fill Mode → Closed. For watertight 3D print geometry this is mandatory.",
      },
      {
        symptom: "Wall grows outward when Offset = −1.0 is expected to grow inward",
        cause:
          "Source face normals point inward (wrong winding). The Offset direction is relative to the face normal direction — if normals are flipped, −1.0 grows the wrong way.",
        fix:
          "In Edit Mode, select all faces, then Mesh → Normals → Recalculate Outside (Shift+N). Confirm face normals with the Viewport Overlays → Face Orientation toggle (blue = outward). Re-run blueprint.py after fixing if scripting.",
      },
      {
        symptom: "GLB opens in three.js with back-faces visible / no interior wall",
        cause:
          "Three.js applies backface culling by default. Both inner and outer shell faces are present in the GLB, but the engine only renders the front-facing (outward normal) side from any given camera angle.",
        fix:
          "This is expected behaviour — it is correct. The interior wall face IS present; it renders when the camera is inside the room (facing outward). If you need double-sided rendering (visible from both directions), set material.side = THREE.DoubleSide in the three.js material, or enable 'Double Sided' on the Blender material before GLB export.",
      },
      {
        symptom: "nonmanifold_thickness_mode attribute error in Python",
        cause:
          "solidify_mode is set to 'SIMPLE', not 'NON_MANIFOLD'. The nonmanifold_* sub-properties only exist on the modifier when Complex mode is active.",
        fix:
          "Set mod.solidify_mode = 'NON_MANIFOLD' before accessing mod.nonmanifold_thickness_mode or mod.nonmanifold_boundary_mode. The blueprint guards this with an explicit if-check.",
      },
    ],
  },
  base,
);
