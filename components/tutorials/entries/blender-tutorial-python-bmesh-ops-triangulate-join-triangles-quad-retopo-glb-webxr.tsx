import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.triangulate</code> and{" "}
        <code>bmesh.ops.join_triangles</code> are symmetrical BMesh primitives:
        one explodes every face into triangles, the other dissolves adjacent
        coplanar triangle pairs back into quads. The glTF 2.0 specification
        accepts only triangles in mesh primitives, so understanding this pair
        is prerequisite knowledge for every GLB / WebXR export pipeline the
        studio runs — from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset panel workflow
        </Link>{" "}
        that introduces BMesh face operations, through the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr"
          className={lk}
        >
          extrude_face_region control-deck
        </Link>{" "}
        that builds multi-height slabs, to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          grid_fill display panel
        </Link>{" "}
        where a structured quad patch closes a rectangular hole. The prop for
        this tutorial — a hexagonal buckler shield with a central n-gon boss —
        is a deliberately simple mixed topology: six radial quads plus one
        6-gon face, extruded into a slab. Simple enough to follow in a
        wireframe overlay; realistic enough to reproduce the n-gon problem
        encountered on every imported CAD or sculpted source mesh.
      </p>

      <h2>Why not rely on the GLB exporter&apos;s auto-triangulation?</h2>
      <p>
        Blender&apos;s glTF exporter triangulates automatically, invisibly, on
        export using <code>BEAUTY</code> by default. This is fine until:
      </p>
      <ul>
        <li>
          A UV seam runs across a quad and the auto-triangulation picks the
          diagonal that crosses the seam — producing a visible split in the
          texture.
        </li>
        <li>
          A driven blend-shape or morph target references vertex indices, and
          auto-triangulation remaps those indices between the .blend and the
          GLB.
        </li>
        <li>
          You need to verify face count or winding in the viewport before
          submission.
        </li>
      </ul>
      <p>
        Pre-triangulating with <code>bmesh.ops.triangulate</code> locks the
        diagonal choice in the .blend, making the exported GLB deterministic
        regardless of which Blender version, exporter version, or export
        settings are used downstream.
      </p>

      <h2>Signature — triangulate</h2>
      <pre>{`result = bmesh.ops.triangulate(
    bm,
    faces       = [],        # list[BMFace] — all faces to triangulate
    quad_method = 'BEAUTY',  # BEAUTY | FIXED | FIXED_ALTERNATE
                             # | SHORTEST_DIAGONAL
    ngon_method = 'BEAUTY',  # BEAUTY | CLIP
)
# result['faces'] → list of NEW triangle BMFace handles
# ⚠  every handle in faces= is now INVALID — do not reuse`}</pre>

      <h2>quad_method options</h2>
      <pre>{`BEAUTY           # Delaunay criterion: minimises max angle difference.
                 # Best aesthetic result for hard-surface panels and
                 # organic surfaces alike.  The default in Blender UI.

FIXED            # Always cuts the 0→2 diagonal (top-left to bottom-right
                 # in a standard grid layout).  Deterministic and fast.
                 # Use when UV diagonal direction must be predictable.

FIXED_ALTERNATE  # Alternates 0→2 / 1→3 in a checkerboard pattern.
                 # Distributes long-triangle artifacts more evenly.

SHORTEST_DIAGONAL # Cuts whichever diagonal is shorter in 3D space.
                  # Useful on near-square quads — avoids needle tris.`}</pre>

      <h2>ngon_method options</h2>
      <pre>{`BEAUTY  # Ear-clip triangulation + Lawson-flip beauty pass.
        # Produces better average angles on concave n-gons.
        # Recommended for most cases.

CLIP    # Pure ear-clip — no beauty pass.  Faster; may leave
        # elongated tris on concave polygons with many vertices.`}</pre>

      <h2>The single most important invariant</h2>
      <p>
        Every <code>BMFace</code> handle passed in <code>faces=</code> becomes{" "}
        <strong>invalid</strong> the moment <code>triangulate</code> returns.
        This includes any variable holding a reference to those faces — for
        example, a <code>boss_face</code> variable you stored after{" "}
        <code>bm.faces.new(inner_ring)</code>. Attempting to read{" "}
        <code>boss_face.material_index</code> after triangulate will raise{" "}
        <code>ReferenceError: BMFace dead</code>. Assign material indices and
        mark sharp edges{" "}
        <strong>before</strong> the triangulate call.
      </p>
      <pre>{`# ✓ correct order
for f in bm.faces:
    if is_boss(f):
        f.material_index = 1    # assign BEFORE triangulate

all_faces = list(bm.faces)      # materialise list BEFORE triangulate

result = bmesh.ops.triangulate(
    bm, faces=all_faces,
    quad_method='BEAUTY', ngon_method='BEAUTY',
)

# ✗ wrong — boss_face is dead after triangulate
# result['faces'][0].material_index = 1`}</pre>

      <h2>Building the buckler shield</h2>
      <pre>{`import bpy, bmesh, math
from mathutils import Vector

OUTER_R = 0.60   # hex circumradius
INNER_R = 0.22   # boss ring circumradius
DEPTH   = 0.05   # slab thickness

bm = bmesh.new()

def ring(r, n=6):
    return [bm.verts.new(Vector((
        r * math.cos(2*math.pi*i/n + math.pi/n),
        r * math.sin(2*math.pi*i/n + math.pi/n), 0
    ))) for i in range(n)]

outer = ring(OUTER_R)
inner = ring(INNER_R)

# 6 radial quads
for i in range(6):
    j = (i+1) % 6
    bm.faces.new([outer[i], outer[j], inner[j], inner[i]])

# central boss: one 6-gon n-gon ← the important face
boss_face = bm.faces.new(inner)
boss_face.material_index = 1    # set BEFORE extrude / triangulate

# extrude slab downward
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
bottom_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=bottom_verts, vec=Vector((0,0,-DEPTH)))`}</pre>

      <h2>STEP B — triangulate</h2>
      <pre>{`# collect ALL faces BEFORE the call
all_faces = list(bm.faces)

tri_result = bmesh.ops.triangulate(
    bm,
    faces       = all_faces,
    quad_method = 'BEAUTY',
    ngon_method = 'BEAUTY',
)
new_tris = tri_result['faces']
# new_tris holds only the newly created triangle handles
# all_faces handles are now dead`}</pre>

      <h2>Signature — join_triangles</h2>
      <pre>{`result = bmesh.ops.join_triangles(
    bm,
    faces                 = [],    # list[BMFace] — triangle candidates only
    angle_face_threshold  = 0.01,  # radians — max dihedral between pair normals
    angle_shape_threshold = 0.1,   # radians — max shape deviation from rectangle
    cmp_seam              = False, # True → don't join across UV seam edges
    cmp_sharp             = False, # True → don't join across sharp edges
    cmp_uvs               = False, # True → compare UV islands
    cmp_vcols             = False, # True → compare vertex-colour layers
    cmp_materials         = True,  # True → don't join across material slots
)
# result['faces'] → list of NEW quad BMFace handles
# ⚠  every handle in faces= that was merged is now INVALID`}</pre>

      <h2>join_triangles parameter deep dive</h2>
      <pre>{`angle_face_threshold = 0.0    # strict coplanar only (floating-point unsafe)
angle_face_threshold = 0.020  # ~1.1° — correct for hard-surface flat faces
angle_face_threshold = 0.10   # ~5.7° — allows gently curved organic surfaces

angle_shape_threshold = 0.0   # only perfectly rectangular quads accepted
angle_shape_threshold = 0.15  # allows moderate rhomboids (e.g. hex-derived quads)
angle_shape_threshold = 0.35  # permissive — accepts most non-degenerate shapes`}</pre>
      <p>
        <code>cmp_sharp=True</code> is the most commonly forgotten flag. If
        your mesh carries deliberate hard-edge marks — as every faceted studio
        prop does — passing <code>cmp_sharp=False</code> (the default) will
        dissolve those edges, obliterating the split-normal data and producing
        a smooth-shaded result in the GLB normal accessor. Always set{" "}
        <code>cmp_sharp=True</code> on any mesh that carries hard-edge marks
        for faceted rendering.
      </p>

      <h2>STEP C — selective join</h2>
      <pre>{`# Restore quads on horizontal (top/bottom slab) faces only.
# Side faces have near-vertical normals → excluded from the candidate list.
bm.faces.ensure_lookup_table()
horiz_tris = [f for f in bm.faces if abs(f.normal.z) > 0.85]

join_result = bmesh.ops.join_triangles(
    bm,
    faces                 = horiz_tris,
    angle_face_threshold  = 0.020,
    angle_shape_threshold = 0.25,
    cmp_sharp             = True,
    cmp_materials         = True,
    cmp_seam              = False,
)
new_quads = join_result['faces']`}</pre>

      <h2>The axis filter trick</h2>
      <p>
        By passing only a subset of faces — <code>horiz_tris</code> selected by{" "}
        <code>abs(f.normal.z) &gt; 0.85</code> — we selectively restore quads
        on the flat top and bottom of the slab while the side band remains
        triangulated. This is the canonical pattern for mixed-topology export:
        tris on curved or angled surfaces (where the triangulation direction is
        meaningful for the renderer), quads on flat surfaces (where clean edge
        flow matters for UV seams and subdivision creases).
      </p>
      <p>
        The same technique works across any axis: filter by{" "}
        <code>abs(f.normal.x) &gt; 0.85</code> to restore only left/right faces
        on a side-facing panel, or use <code>f.material_index == SLOT_FLAT</code>{" "}
        to join by material rather than by orientation.
      </p>

      <h2>Troubleshooting</h2>
      <pre>{`# "ReferenceError: BMFace dead"
# → a face handle from before triangulate/join is still referenced.
#   Collect result handles immediately and discard the old list.

# join_triangles returns empty result['faces']
# → either no valid tri pairs in the candidate list,
#   or all pairs failed one of the threshold / cmp_ gates.
#   Check: are you passing actual triangle faces?
#          Is cmp_sharp blocking joins on edges you didn't intend to mark?
print(f"tris passed: {len(horiz_tris)}")
print(f"quads made:  {len(join_result['faces'])}")

# triangulate produces needle tris on n-gon boss
# → switch to ngon_method='BEAUTY' (ear-clip + Lawson flips).
#   Or pre-subdivide the n-gon to reduce vertex count before triangulating.

# GLB exporter still produces different diagonal than blueprint.py
# → export_apply=True bakes the mesh as Python left it.
#   Without export_apply the exporter re-triangulates from the .blend quads.`}</pre>

      <h2>Export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath                             = "hf_shield_disc.glb",
    export_format                        = 'GLB',
    export_apply                         = True,   # bake tri state
    export_yup                           = True,   # WebXR +Y up
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_normals                       = True,
)`}</pre>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation · related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender source
          </a>
          {" "}·{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.types
          </a>
        </li>
        <li>
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF 2.0 Specification — Mesh Primitives
          </a>{" "}
          · CC-BY-4.0 · Khronos Group · related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>
          {" "}·{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF spec repo
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr",
  title:
    "Python bmesh.ops.triangulate + bmesh.ops.join_triangles — Export-Safe Triangulation & Selective Quad Restoration for WebXR (Blender 5.1)",
  description:
    "triangulate converts any n-gon/quad/tri mix to a guaranteed-all-triangle mesh for GLB; join_triangles is the selective inverse, restoring coplanar quad pairs. Covers quad_method (BEAUTY/FIXED/SHORTEST_DIAGONAL), ngon_method (BEAUTY/CLIP), the BMFace-handle-invalidation invariant, angle_face_threshold vs angle_shape_threshold, the axis-filter trick for partial rejoin, and cmp_sharp preservation of hard-edge marks.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "triangulate",
    "join_triangles",
    "retopology",
    "n-gon",
    "quad",
    "glb",
    "webxr",
    "faceted",
    "export",
    "hard-surface",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr",
  Body,
  keyInsights: [
    "every BMFace handle passed in faces= becomes INVALID after triangulate or join_triangles — collect result handles immediately; never reuse old references",
    "quad_method='BEAUTY' picks the Delaunay-quality diagonal — minimises maximum angle difference; FIXED always cuts the 0→2 diagonal for deterministic UV diagonal direction; SHORTEST_DIAGONAL cuts whichever diagonal is shorter in 3D space",
    "ngon_method='BEAUTY' runs ear-clip then a Lawson-flip beauty pass; 'CLIP' is faster but may leave elongated tris on concave n-gons — use BEAUTY for boss faces and medallions",
    "join_triangles cmp_sharp=True is the most commonly forgotten flag — without it the operation dissolves sharp-marked edges and wipes split-normal data from the GLB normal accessor",
    "the axis-filter trick: filter bm.faces by abs(f.normal.z) > 0.85 before passing to join_triangles to restore quads on flat slab faces while leaving side tris intact",
    "angle_face_threshold=0.0 is floating-point unsafe on near-flat faces — use 0.020 (~1.1°) to catch the floating-point haze around truly coplanar hex-derived quads",
    "pre-triangulating in Python locks the diagonal before export — Blender's auto-triangulate on export is invisible and can pick different diagonals when UV seams cross quads",
  ],
});
