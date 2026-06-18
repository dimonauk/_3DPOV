import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function RetopologyPolybuildShrinkwrapBody() {
  return (
    <>
      <p>
        A sculpt produced by Dyntopo or Multiresolution holds tens of thousands
        of irregular triangles — excellent for surface detail, useless for
        armature deformation.  Retopology replaces that mesh with a clean,
        low-polygon quad cage whose edge loops follow the form of the subject:
        around the eye socket, along the lip border, down the jawline.  The
        Poly Build tool lets you draw those quads directly over the sculpt in
        Edit Mode; a live Shrinkwrap modifier on the retopo mesh snaps every
        vertex to the sculpt surface the moment it is placed.
      </p>
      <p className="mt-3">
        This connects forward to the{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb"
          className={lk}
        >
          Multires normal-bake pipeline
        </Link>{" "}
        (the retopo cage is the low-poly target for the bake), to{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature weight paint
        </Link>{" "}
        (clean loops at joints produce natural weight gradients), and to{" "}
        <Link
          href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised"
          className={lk}
        >
          UV unwrapping
        </Link>{" "}
        (seam edges follow the same anatomical boundaries as the retopo loops).
        The sculpt side is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh"
          className={lk}
        >
          Dyntopo + Voxel Remesh tutorial
        </Link>
        .
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-4">{`# Modifier stack on the retopo mesh (index 0 = applied first):
#   [0] Mirror      use_axis X, bisect X, clip = True
#   [1] Shrinkwrap  target = sculpt_ref
#                   wrap_method = PROJECT
#                   use_negative_direction = True
#                   use_positive_direction = True
#                   offset = 0.001
#
# Mirror fires first → symmetric half is created.
# Shrinkwrap projects all verts (both halves) onto the sculpt.
# Applying order: Mirror first, then Shrinkwrap.`}</pre>
    </>
  );
}

const base = {
  slug: "blender-tutorial-retopology-polybuild-shrinkwrap",
  title:
    "Retopology — Poly Build + Shrinkwrap: Manual Quad Retopology Workflow",
  date: "2026-06-18",
  kind: "tutorial" as const,
  excerpt:
    "Draw a clean quad cage over a dense sculpt using Blender 5.1's Poly Build tool. " +
    "Every placed vertex snaps automatically to the sculpt surface via a live Shrinkwrap " +
    "modifier in PROJECT mode. Expert depth on modifier stack order (Mirror above Shrinkwrap), " +
    "Poly Build's four gestures, edge-loop flow strategy (poles, loops, anatomical boundaries), " +
    "and the apply sequence before UV bake.",
  tags: [
    "blender",
    "retopology",
    "sculpting",
    "poly-build",
    "shrinkwrap",
    "topology",
    "vrm",
  ],
  Body: RetopologyPolybuildShrinkwrapBody,
};

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Scene composition: sculpt reference + retopo layer",
        body:
          "Place the sculpt reference on its own collection so you can toggle it without affecting the retopo mesh:\n\n  # Assign sculpt_ref to 'Sculpt_Ref' collection\n  ref_col = bpy.data.collections.new('Sculpt_Ref')\n  bpy.context.scene.collection.children.link(ref_col)\n  ref_col.objects.link(sculpt)\n\nIn the Outliner, set that collection to Wire display mode: click the collection's icon in the Outliner properties column → Display Mode → Wire.  The sculpt renders as a dark-grey wireframe cage, making the retopo mesh's solid faces easy to distinguish.\n\nEnable 'In Front' on the sculpt reference:\n  sculpt.show_in_front = True\n\nWHY In Front: without it, the sculpt occludes the retopo mesh in Solid view, forcing you to work in Wireframe (Z key) continuously.  With In Front enabled, the semi-transparent sculpt sits visually above the retopo quad cage — you see the sculpt contour and the retopo edge simultaneously.\n\nSet up X-Ray tint via material Alpha = 0.25 (BLEND mode) so the sculpt surface normal direction is readable without obscuring the retopo mesh underneath.  Cycles viewport renders the alpha in Material Preview; in Solid mode Blender ignores material alpha but the orange tint is still applied to the diffuse colour.\n\nFace Orientation overlay (Viewport Overlays dropdown) colours front faces blue and back faces red.  Flip any red-facing surface normals on the sculpt before starting — Shrinkwrap in PROJECT mode fires rays along the retopo vertex normals and projects to the CLOSEST intersection; flipped normals on the sculpt can cause the ray to pass through the surface rather than stopping at it.",
      },
      {
        title: "Shrinkwrap modifier: PROJECT mode parameters",
        body:
          "Shrinkwrap has four wrap_method options:\n\n  NEAREST_SURFACEPOINT — moves each vertex to the geometrically closest point\n                         on the target surface. Fast. Incorrect at concave\n                         regions (eye socket, under chin) where 'nearest' is\n                         ambiguous — vertices can flip to the inside of the mesh.\n\n  PROJECT              — fires a ray from each vertex along its normal direction\n                         and snaps to the first intersection. Directional, so\n                         concave areas behave predictably. Correct choice for\n                         retopology over complex organic shapes.\n\n  NEAREST_VERTEX       — snaps to nearest vertex on target. Rarely useful;\n                         the sculpt density means nearest vertex is almost\n                         always a good approximation of NEAREST_SURFACEPOINT.\n\n  TARGET_PROJECT       — projects along the *target's* surface normals. Good for\n                         matching another mesh's silhouette but not for retopo.\n\nFor retopology use PROJECT:\n\n  sw.wrap_method            = 'PROJECT'\n  sw.use_project_z          = True   # fire along global Z\n  sw.use_negative_direction = True   # ray inward (retopo outside sculpt)\n  sw.use_positive_direction = True   # ray outward (retopo inside sculpt)\n  sw.offset                 = 0.001  # ε gap prevents Z-fighting\n\nWHY both directions: when you start with the retopo sphere slightly outside the sculpt (RETOPO_OFFSET = 1.05), all vertices are outside → only negative-direction rays find the surface.  As you move vertices in Poly Build some may end up inside the sculpt; positive direction catches those.  Enabling both means Shrinkwrap is forgiving about starting position.\n\nuse_cull_face (not set here, default False): if True, Shrinkwrap ignores back-face intersections.  Keep False for a closed mesh like this sphere so that vertices on the interior of the sculpt still project correctly.\n\noffset = 0.001 in Blender world units (metres at default scale).  Too small: Z-fighting produces viewport shimmer.  Too large: the retopo mesh floats visibly above the sculpt and the baked normal map carries an unwanted offset bias.  0.001 m = 1 mm — imperceptible in the bake at standard character scale (1.7 m height).",
      },
      {
        title: "Mirror modifier: stack order and bisect clipping",
        body:
          "For a symmetrical character, Mirror must sit ABOVE (lower index in the stack) Shrinkwrap:\n\n  retopo.modifiers.new('Mirror',     'MIRROR')     # index 0 — applied first\n  retopo.modifiers.new('Shrinkwrap', 'SHRINKWRAP') # index 1 — applied second\n\nBlender evaluates the modifier stack from index 0 downward.  With Mirror at index 0, Blender mirrors the half-mesh before Shrinkwrap fires.  Both original and mirrored vertices then project independently onto the sculpt's correct side.\n\nIf you place Shrinkwrap above Mirror (index 0):\n  1. Shrinkwrap projects the half-mesh onto one side of the sculpt.\n  2. Mirror copies those already-projected vertices to the far side.\n  3. The mirrored vertices have been offset by Shrinkwrap and now sit on the\n     wrong side of the sculpt — clipping or floating.\n\nbisect_axis[0] = True: cuts the mirrored copy at the X = 0 plane, preventing Mirror from producing verts on the wrong side when you drag a vertex across the seam in Poly Build.\n\nuse_clip = True: welds vertices that fall within merge_threshold (0.001 m) of the X = 0 plane.  Without clip, the centre-line seam has a visible gap even after applying the modifier.  With clip, centre-line vertices from the original half and their mirrored copies are merged into single shared vertices — the seam is closed.\n\nPractical workflow: work on only the +X half.  Mirror shows the -X result live.  When the +X half is done, apply Mirror (Properties → Modifiers → Mirror → Apply), then apply Shrinkwrap.  Never apply Shrinkwrap before Mirror — the apply sequence must follow the stack order.",
      },
      {
        title: "Poly Build tool: the four gestures",
        body:
          "Select the retopo mesh → Tab into Edit Mode → T-panel → Poly Build.\n\nThe tool has four gestures, all driven by modifier keys on LMB:\n\n1. CREATE FACE  — click empty space near existing geometry\n   Blender creates a triangle from the cursor position to the nearest edge or\n   vertex.  If two open edges are nearby it auto-completes a quad.  The new\n   vertex snaps to the sculpt via Shrinkwrap immediately on release.\n\n2. EXTRUDE EDGE — drag from an existing edge\n   Hover over an edge (it highlights); hold and drag outward.  Blender extrudes\n   a new quad following the cursor, with the new free vertices already\n   Shrinkwrap-projected onto the sculpt.  This is the primary gesture for\n   extending an existing loop.\n\n3. DELETE ELEMENT — Ctrl + LMB click\n   Removes the face, edge, or vertex under the cursor.  Use to cut back stray\n   triangles or incorrect quads without switching to a separate delete operator.\n\n4. MOVE VERTEX — Shift + LMB drag\n   Grabs the vertex under the cursor and moves it along the view plane.  On\n   release, Shrinkwrap re-projects the vertex to the sculpt surface.  Use to\n   fine-tune loop spacing after placing a run of quads.\n\nEnable Face Snap in the header Snap menu (magnet icon → Face) and check\n'Project Individual Elements on Surfaces'.  This makes each vertex follow the\nsculpt surface even when dragging — useful for gesture 4 on curved surfaces\nwhere the view-plane drag would otherwise pull verts off the surface.\n\nPractice sequence:\n  a. Place three quads around the equator of the sculpt sphere.\n  b. Extrude each equator quad northward twice (pole direction).\n  c. Continue south similarly.\n  d. Close the poles by merging the last-ring verts: select ring → M → At\n     Centre (creates an N-gon pole — dissolve to quad fans in the next pass).",
      },
      {
        title: "Edge loop flow strategy: poles and anatomical loops",
        body:
          "The difference between a retopo mesh that deforms well and one that doesn't is almost entirely topology flow.  Three rules cover 90 % of cases:\n\nRULE 1 — Loops encircle joints and features:\n  Every joint that bends (elbow, knee, wrist, knuckle) needs at least three\n  parallel edge loops encircling it: one at the bend crease and one on each\n  side.  As the joint bends, intermediate vertices in those loops spread\n  evenly, preventing the pinched-crease artefact you get when a single loop\n  is forced to carry all the deformation.\n\nRULE 2 — Poles belong at topology transitions, NOT at deforming areas:\n  A pole is a vertex with ≠ 4 edges (3-pole or 5-pole).  Quads meeting at a\n  5-pole allow the surrounding loop count to change — essential at the corner\n  of the mouth (5 loops arrive, 4 depart toward the cheek) or at the outer\n  corner of the eye.  3-poles are the complement: they reduce loop count.\n  Place poles at the back of the ear, under the chin, at the hairline — areas\n  that do not deform.  A pole at the elbow crease produces a visible pinch\n  under skin weights.\n\nRULE 3 — Loops at material and UV boundaries:\n  Place a loop where a material boundary runs (skin → cloth, skin → hair).  The\n  seam for UV unwrapping will follow that loop, meaning the UV island boundary\n  exactly coincides with the material boundary — no bleeding.\n\nFor the sphere blueprint, the RETOPO_SEGMENTS = 12, RETOPO_RINGS = 8 gives:\n  Equator loop:  12 quads → one encircling band\n  Pole ring:     12-sided N-gon capped by a pole vertex at each end\n\nA real character head has roughly:\n  Eye orbit:  8–12 loops encircling the eyelid rim\n  Mouth loop: 8–12 loops encircling the lip border\n  Ear loop:   simple 6-8 quad shell\n  Total:      ~500–800 quads for a game-res head\n\nUse the Loop Cut tool (Ctrl+R) after completing the Poly Build pass to insert\nadditional loops at joint crease positions before weighting.",
      },
      {
        title: "Applying the modifier stack and exporting the cage",
        body:
          "Apply modifiers in stack order — top first:\n\n  # In the UI: Properties → Modifiers → Mirror → Apply\n  with bpy.context.temp_override(object=retopo):\n      bpy.ops.object.modifier_apply(modifier='Mirror')\n\n  # Then apply Shrinkwrap\n  with bpy.context.temp_override(object=retopo):\n      bpy.ops.object.modifier_apply(modifier='Shrinkwrap')\n\nWHY this order matters:\n  Applying Shrinkwrap before Mirror would apply the projection to only the\n  half-mesh, then Mirror would copy already-applied positions — but those\n  copied positions are missing the Shrinkwrap projection because the modifier\n  is gone.  Apply Mirror first to materialise the full mesh, then Shrinkwrap\n  to lock the snapped positions permanently.\n\nAfter applying:\n  1. Recalculate normals: Edit Mode → Mesh → Normals → Recalculate Outside\n     (Shift+N).  The apply step can leave some normals inverted.\n  2. Smart UV Project: UV Editor → UV → Smart UV Project, angle limit 66°.\n     Alternatively, mark seams along the anatomical boundaries identified in\n     step 5 and use Unwrap (U → Unwrap).\n  3. Bake normal map from sculpt_ref onto retopo_mesh (Cycles render engine):\n       bpy.ops.object.bake(\n           type='NORMAL',\n           use_selected_to_active=True,\n           cage_extrusion=0.05,\n       )\n  4. Export as GLB:\n       bpy.ops.export_scene.gltf(\n           filepath     = '//retopo_mesh.glb',\n           export_apply = True,\n           use_selection= True,\n           export_draco_mesh_compression_enable = True,\n           export_draco_mesh_compression_level  = 6,\n       )\n\nThe exported GLB contains the clean quad cage with the baked normal map\nembedded as a KHR_materials texture — the sculpt detail is recovered at\nruntime without sending the full sculpt geometry.\n\nDelete sculpt_ref before export (or place it in an excluded collection);\nthe Holoflow GLB asset loader does not expect a reference mesh in the scene.",
      },
    ],

    finalResult:
      "A retopo_mesh.blend containing sculpt_ref (96 × 48 displaced UV sphere, ~9 k faces) and retopo_mesh (12 × 8 UV sphere, ~96 faces) with Mirror + Shrinkwrap applied. The scaffold is the starting point for a manual Poly Build session. Running record.py produces a 5-second viewport animation (viewport.mp4) fading the retopo mesh in over the sculpt reference.",

    variations: [
      "Vertex-group-masked Shrinkwrap: when the retopo mesh includes areas that should NOT snap to the sculpt (e.g. inner mouth, eyelid rim), assign those vertices to a vertex group and set sw.vertex_group on the modifier. Vertices in the group are excluded from projection; they can be moved freely and merged manually.",
      "SnapUtilities add-on: the bundled 'Snap Utilities Line' add-on (Extensions Platform) extends Face Snap with a continuous snap cursor that follows the sculpt surface — useful for drawing long straight edge runs along flat surface regions without the cursor drifting. Enable via Extensions → Snap Utilities → Snap Line.",
      "Automated quad remesh as starting point: run bpy.ops.object.voxel_remesh(voxel_size=0.05) on a copy of the sculpt to produce a clean manifold mesh, then use a second Shrinkwrap pass on the voxel result. The output is not anatomy-driven but gives a fast even-quad starting mesh you can then refine with Poly Build to add loops at joints and poles at feature corners.",
      "Retopology guide mesh: before starting Poly Build, block in the major loop positions as vertex-only wires (add empty mesh → Ctrl+LMB in Edit Mode to place edge-guide verts). Use Snap to Surface on those wires, then connect them into faces with the F key. The guide verts establish loop spacing before edge extrusion, preventing uneven density in the final mesh.",
    ],

    troubleshooting: [
      {
        symptom: "Vertices placed with Poly Build do not snap to the sculpt surface",
        cause:
          "The Shrinkwrap modifier's target field is empty, or the sculpt object was renamed after the modifier was set up.",
        fix:
          "In Properties → Modifiers → Shrinkwrap, confirm the Target field shows 'sculpt_ref'. If empty, click the eyedropper and select the sculpt object. If the Shrinkwrap panel shows 'No Target' in red, re-assign via Python: sw.target = bpy.data.objects['sculpt_ref'].",
      },
      {
        symptom: "Mirror creates an ugly seam — vertices at X=0 do not weld",
        cause:
          "use_clip is False, or merge_threshold is too small relative to your scene scale, or the retopo mesh origin is not at X=0.",
        fix:
          "Set mirror.use_clip = True and mirror.merge_threshold = 0.001. Ensure the retopo object's origin is exactly at world origin (Object → Set Origin → Origin to Geometry, then snap origin to (0,0,0) via N-panel). If the centre-line verts are further than 0.001 m from X=0 after snapping, increase merge_threshold to 0.005.",
      },
      {
        symptom: "Shrinkwrap pushes retopo vertices through the sculpt to the far side",
        cause:
          "use_negative_direction and use_positive_direction are both True, and the retopo mesh has faces pointing away from the sculpt (normals inverted). The ray fires in the wrong direction and finds the far surface.",
        fix:
          "Enter Edit Mode on the retopo mesh → Mesh → Normals → Recalculate Outside (Shift+N). All face normals should point outward. Then in Shrinkwrap settings, disable use_positive_direction if the retopo mesh starts outside the sculpt — single-direction negative projection is less ambiguous.",
      },
      {
        symptom: "Poly Build triangle creation produces N-gons, not quads",
        cause:
          "Clicking near a vertex rather than near the midpoint of an open edge creates a triangle fanned from that vertex. Multiple triangles accumulate into an N-gon before Blender auto-converts.",
        fix:
          "Target open edge midpoints, not vertices, when clicking to create faces. The cursor highlight shows an edge highlight (bright line segment) rather than a vertex dot when correctly positioned. Enable Face Dot Size in Overlay settings to make vertices smaller and edge midpoints easier to target.",
      },
    ],
  },
  base,
);
