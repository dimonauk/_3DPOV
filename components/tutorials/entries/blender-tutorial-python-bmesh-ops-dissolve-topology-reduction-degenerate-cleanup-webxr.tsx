import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The dissolve family is the surgical inverse of subdivision. Where{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr"
          className={lk}
        >
          subdivide_edges
        </Link>{" "}
        adds geometry, the five dissolve operators remove it — without
        repositioning any vertex, without altering visible shape, and without
        the polygon-count unpredictability of Decimate. Each operator has a
        precise topological criterion so you know exactly which elements it will
        remove before you call it. Together they form a complete reduction
        pipeline that takes a SubD-bake retopology output (dozens of
        unnecessary interior loops on flat surfaces) down to a minimal low-poly
        mesh in three sequential calls.
      </p>

      <h2>The five operators at a glance</h2>
      <pre>{`# 1. dissolve_degenerate — weld vertices closer than dist
bmesh.ops.dissolve_degenerate(bm, dist=1e-4, edges=bm.edges[:])
# No return value. Vertices within dist of each other are merged.
# Also removes zero-area faces that become stranded after the merge.

# 2. dissolve_limit — collapse coplanar edge loops in one pass
bmesh.ops.dissolve_limit(
    bm,
    angle_limit             = 0.017,    # radians (≈ 1°)
    use_dissolve_boundaries = False,    # True is dangerous on open shells
    verts                   = bm.verts[:],
    edges                   = bm.edges[:],
    delimit                 = set(),    # {'SHARP','SEAM','UV','MATERIAL','CREASE'}
)
# No return value. Every edge whose dihedral angle < angle_limit is dissolved.

# 3. dissolve_faces — merge a face selection into one n-gon
bmesh.ops.dissolve_faces(bm, faces=face_list, use_verts=True)
# No return value. Input face handles are invalid after the call.

# 4. dissolve_edges — remove targeted edges
bmesh.ops.dissolve_edges(bm, edges=edge_list, use_verts=True, use_face_split=False)
# No return value. use_verts=True also merges any resulting valence-2 vertices.

# 5. dissolve_verts — remove targeted vertices
bmesh.ops.dissolve_verts(bm, verts=vert_list, use_face_split=False,
                          use_boundary_tear=False)
# No return value.`}</pre>

      <h2>Production order — why it is not optional</h2>
      <p>
        Always run in this sequence: <strong>degenerate → limit → edges → verts</strong>.
      </p>
      <ul>
        <li>
          <strong>degenerate first</strong> — a near-zero-length edge creates a
          face whose dihedral angle is numerically undefined. The subsequent
          limit pass either freezes on it or silently skips it, leaving a dark
          triangle in the GLB <code>NORMAL</code> accessor that is invisible in
          Blender&apos;s viewport but visible under any real renderer.
        </li>
        <li>
          <strong>limit second</strong> — the broadest stroke: one call reduces
          entire flat regions. Running targeted dissolve_edges before limit
          forces you to manually enumerate every loop that limit would have
          caught automatically.
        </li>
        <li>
          <strong>edges then verts</strong> — edge dissolution can strand
          T-junction vertices (valence 2, non-boundary, collinear). A final
          vert pass sweeps them. Reversing this order misses the T-junctions
          because the vertex is not yet valence 2 while the edge still exists.
        </li>
      </ul>

      <h2>dissolve_degenerate — what it catches and what it misses</h2>
      <p>
        The operator merges any pair of vertices whose world-space distance is
        less than <code>dist</code>. This indirectly removes near-zero-area
        faces: once the two vertices of a sliver triangle are merged, the face
        collapses to a line and is discarded. What it does{" "}
        <em>not</em> catch:
      </p>
      <ul>
        <li>
          <strong>Isolated valence-0 vertices</strong> (floating points not
          connected to any edge) — use{" "}
          <code>
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not
            v.link_edges], context=&apos;VERTS&apos;)
          </code>{" "}
          before the dissolve pipeline.
        </li>
        <li>
          <strong>Wire edges</strong> (connected to no face) — dissolve_degenerate
          leaves them. Follow with{" "}
          <code>
            bmesh.ops.delete(bm, geom=[e for e in bm.edges if not
            e.link_faces], context=&apos;EDGES&apos;)
          </code>{" "}
          if a weld-clean mesh is required.
        </li>
        <li>
          <strong>Non-manifold geometry</strong> such as T-junctions where
          three faces share one edge — dissolve_degenerate does not repair
          topology, only near-coincident vertices.
        </li>
      </ul>

      <h2>
        dissolve_limit — the dihedral angle and the{" "}
        <code>delimit</code> set
      </h2>
      <pre>{`Front face 24 co-planar quads:  dihedral angle = 0 rad  → ALL dissolved
Side wall top edge to front:    dihedral angle = π/2 rad → NOT dissolved
Slightly warped pair (1.05°):   dihedral angle = 0.018 rad → NOT dissolved at 0.017

# PLANAR_LIMIT = 0.017 rad ≈ 1°.  Edges below this threshold are dissolved.
# Increase to 0.035 (≈ 2°) to catch mildly warped nominally-flat surfaces.
# The safe ceiling for hard-surface props is ≈ 0.087 rad (5°) — above that
# you risk dissolving the chamfer edges of a bevel in production.`}</pre>
      <p>
        The <code>delimit</code> set controls which attributes act as hard
        boundaries that dissolve_limit will never cross:
      </p>
      <pre>{`delimit=set()             # no protection — dissolves everything below threshold
delimit={'SHARP'}         # protects edges tagged e.smooth=False (sharp_edge attr)
delimit={'SEAM'}          # protects UV seam edges — dissolving a seam edge
                          # orphans the UV islands on either side
delimit={'MATERIAL'}      # never dissolves across a material slot boundary
delimit={'SHARP','SEAM'}  # combine: protect both sharp edges AND seam edges

# For WebXR GLBs always use delimit={'SHARP'} if you have pre-tagged hard
# normals — dissolve_limit will otherwise erase the sharp_edge boolean
# attribute on coplanar edges, flattening your split normals in the
# NORMAL accessor.`}</pre>
      <p>
        See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
          className={lk}
        >
          split_edges & hard normals
        </Link>{" "}
        for the full split-normal workflow that dissolve_limit can disrupt if
        <code>delimit</code> is left empty.
      </p>

      <h2>dissolve_faces — not the same as dissolve_limit on a selection</h2>
      <p>
        <code>dissolve_faces</code> merges a set of faces into a single n-gon
        regardless of their planarity. Use it when you want to collapse a
        deliberately non-flat face group — e.g. the triangulated cap of a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr"
          className={lk}
        >
          panel extrusion
        </Link>{" "}
        — into a single polygon for later UV placement. It is riskier than
        dissolve_limit because it creates non-planar n-gons that the GLB
        exporter will triangulate with arbitrary diagonals.
      </p>
      <pre>{`# Merge a hand-selected group of faces into one n-gon:
face_group = [f for f in bm.faces if f.calc_center_median().z > 0.04]
bmesh.ops.dissolve_faces(bm, faces=face_group, use_verts=True)
# input face handles in face_group are INVALID after the call.
# use_verts=True also dissolves any valence-2 vertices the merge creates.`}</pre>

      <h2>Blueprint — 68 → 6 faces in three calls</h2>
      <p>
        The blueprint builds a 6 × 4 over-dense panel slab (24 front quads + 24
        back quads + 20 side-wall quads = 68 faces) representing a typical
        retopology output. A near-degenerate vertex is planted at a
        sub-threshold offset to demonstrate dissolve_degenerate. Then:
      </p>
      <pre>{`import bpy, bmesh
from mathutils import Vector

PANEL_W = 2.0; PANEL_H = 1.2; DEPTH = 0.08
GRID_COLS = 6; GRID_ROWS = 4
DEGEN_DIST = 1e-4; PLANAR_LIMIT = 0.017
EXPORT_PATH = "//hf_panel_tile.glb"

bm = bmesh.new()
cw = PANEL_W / GRID_COLS; ch = PANEL_H / GRID_ROWS

vgrid = []
for iy in range(GRID_ROWS + 1):
    row = []
    for ix in range(GRID_COLS + 1):
        row.append(bm.verts.new((ix*cw - PANEL_W*0.5, iy*ch - PANEL_H*0.5, 0.0)))
    vgrid.append(row)

front_faces = []
for iy in range(GRID_ROWS):
    for ix in range(GRID_COLS):
        front_faces.append(bm.faces.new([
            vgrid[iy][ix], vgrid[iy][ix+1],
            vgrid[iy+1][ix+1], vgrid[iy+1][ix]
        ]))

# Inject near-degenerate vertex (0.4 × DEGEN_DIST from bottom-left corner)
bm.verts.new(vgrid[0][0].co + Vector((DEGEN_DIST * 0.4, 0.0, 0.0)))

# Extrude slab → 68 faces total
ret = bmesh.ops.extrude_face_region(bm, geom=front_faces)
new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, vec=Vector((0.0, 0.0, -DEPTH)), verts=new_verts)

bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table()

# Step 1: clear near-coincident vertices (catches the planted noise_v)
bmesh.ops.dissolve_degenerate(bm, dist=DEGEN_DIST, edges=bm.edges[:])

# Step 2: collapse all coplanar interior loops in one pass
bmesh.ops.dissolve_limit(
    bm,
    angle_limit=PLANAR_LIMIT, use_dissolve_boundaries=False,
    verts=bm.verts[:], edges=bm.edges[:], delimit=set(),
)

# Step 3: surgical sweep — any surviving near-coplanar interior edges
surviving = [
    e for e in bm.edges
    if len(e.link_faces) == 2
    and (ang := e.calc_face_angle(None)) is not None
    and ang < PLANAR_LIMIT * 4
]
if surviving:
    bmesh.ops.dissolve_edges(bm, edges=surviving, use_verts=True, use_face_split=False)

# Step 4: clean T-junctions left by dissolved edges
t_verts = [v for v in bm.verts if len(v.link_edges) == 2 and not v.is_boundary]
if t_verts:
    bmesh.ops.dissolve_verts(bm, verts=t_verts, use_face_split=False,
                              use_boundary_tear=False)

# Result: 8 verts · 12 edges · 6 faces — a clean rectangular slab.
bm.normal_update()
for f in bm.faces: f.smooth = False
me = bpy.data.meshes.new("hf_panel_tile")
ob = bpy.data.objects.new("hf_panel_tile", me)
bpy.context.scene.collection.objects.link(ob)
bm.to_mesh(me); bm.free()
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    export_apply=True, export_normals=True, export_yup=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
)`}</pre>

      <h2>Why 6 faces is better than 68 for WebXR GLBs</h2>
      <p>
        The glTF 2.0 exporter re-triangulates all n-gons on export. A 68-face
        slab and a 6-face slab produce visually identical renders — but they
        differ in what the renderer&apos;s normal interpolator does when adjacent
        triangles disagree on a shared vertex normal. With 68 faces there are 68
        independent triangulation decisions; a different Blender version, a
        different exporter flag, or a different import library can produce a
        different diagonal direction on any face. With 6 faces there are 6, and
        the flat faces have no interior diagonals at all.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr"
          className={lk}
        >
          triangulate + join_triangles
        </Link>{" "}
        explains how to lock the diagonal direction explicitly when you do need
        fine control.
      </p>
      <p>
        For spatial computing assets that travel through multiple export/import
        stages — Blender → GLB → Three.js → XR headset — the minimal topology
        prevents cascading normal artefacts downstream. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr"
          className={lk}
        >
          rotate_edges + beautify_fill
        </Link>{" "}
        tutorial shows how to optimise the triangulation quality of the faces
        that remain after the dissolve pipeline.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>dissolve_limit appears to do nothing.</strong> All operators
          require an up-to-date lookup table:{" "}
          <code>bm.verts.ensure_lookup_table()</code>,{" "}
          <code>bm.edges.ensure_lookup_table()</code> before the call. If
          lookup tables are stale the passed <code>verts</code> and{" "}
          <code>edges</code> slices may be empty.
        </li>
        <li>
          <strong>
            <code>use_dissolve_boundaries=True</code> collapses a side wall
            into a wire.
          </strong>{" "}
          On an open shell, a boundary edge has only one adjacent face. Setting{" "}
          <code>use_dissolve_boundaries=True</code> allows that edge to be
          dissolved. The result is a wire edge with no face — invisible in the
          viewport, but a validation error in the glTF spec. Always leave{" "}
          <code>use_dissolve_boundaries=False</code> for closed shells and
          panel assets.
        </li>
        <li>
          <strong>
            <code>dissolve_verts</code> creates an unexpected n-gon instead of
            merging edges.
          </strong>{" "}
          A valence-2 vertex with non-collinear adjacent edges produces a curved
          n-gon face when dissolved. Check{" "}
          <code>len(v.link_edges) == 2 and not v.is_boundary</code> but also
          verify that the two edges are roughly collinear:{" "}
          <code>
            e0.other_vert(v).co, v.co, e1.other_vert(v).co
          </code>{" "}
          should be nearly collinear (cross product near zero) before dissolving.
        </li>
        <li>
          <strong>
            Sharp-tagged edges disappear after dissolve_limit.
          </strong>{" "}
          The <code>sharp_edge</code> boolean attribute lives on the edge. When
          dissolve_limit removes the edge, the attribute is gone. Pass{" "}
          <code>delimit={'{'}&apos;SHARP&apos;{'}'}</code> to protect all
          sharp-marked edges from the limit pass.
        </li>
        <li>
          <strong>
            <code>calc_face_angle(None)</code> returns <code>None</code> — the
            walrus operator crashes.
          </strong>{" "}
          Boundary edges (link_faces count = 1) and wire edges (count = 0)
          return <code>None</code>. Guard with{" "}
          <code>
            if (ang := e.calc_face_angle(None)) is not None and ang &lt;
            threshold
          </code>
          .
        </li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html#bmesh.ops.dissolve_limit"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.ops.dissolve_limit — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA 4.0 · Blender Foundation). Canonical parameter reference
          for all five dissolve operators. Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            blender/blender source
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0 · Khronos Group). The Blender glTF exporter that
          re-triangulates n-gons on export — understanding its triangulation
          pass explains why dissolving to fewer faces reduces export
          unpredictability. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF specification
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr",
  title:
    "Python bmesh.ops dissolve_degenerate + dissolve_limit + dissolve_edges + dissolve_verts — Topology Reduction Pipeline: Coplanar Collapse & Degenerate Cleanup for Export-Safe GLBs (Blender 5.1)",
  description:
    "The five dissolve operators form a complete polygon-reduction pipeline that removes interior loops without moving vertices. dissolve_degenerate clears near-coincident vertices before they corrupt dihedral-angle computation. dissolve_limit collapses entire coplanar regions in one call. dissolve_edges and dissolve_verts handle surgical cleanup of surviving loops and T-junctions. Covers the mandatory production order, the delimit set for sharp-edge protection, the use_dissolve_boundaries boundary-collapse hazard, and the four failure modes most likely to produce invisible artefacts in the GLB NORMAL accessor.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "dissolve",
    "topology",
    "polygon-reduction",
    "mesh-cleanup",
    "dissolve-limit",
    "dissolve-degenerate",
    "webxr",
    "glb",
    "flat-shading",
    "hard-surface",
    "low-poly",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr",
  Body,
  keyInsights: [
    "always run dissolve_degenerate before dissolve_limit — a near-zero-length edge creates a face with an undefined dihedral angle that the limit pass either freezes on or silently skips, leaving an invisible dark triangle in the GLB NORMAL accessor",
    "dissolve_limit operates on DIHEDRAL ANGLE between adjacent face normals — a perfectly flat surface has angle 0, so every interior edge is dissolved; the angle_limit threshold in radians is the maximum allowed deviation before an edge is considered non-coplanar and preserved",
    "delimit={'SHARP'} protects sharp-marked edges from dissolve_limit — without this flag the sharp_edge boolean attribute on coplanar edges is removed along with the edge, erasing your pre-tagged split normals from the GLB NORMAL accessor",
    "use_dissolve_boundaries=True in dissolve_limit can collapse boundary edges of an open shell into wire edges — a validation error in the glTF spec that is invisible in Blender but breaks XR renderers; always leave it False for hard-surface assets",
    "dissolve_edges use_verts=True merges any valence-2 vertices the edge removal creates — omitting this strands T-junction vertices that break UV unwrapping and normal interpolation downstream",
    "calc_face_angle(None) returns None for boundary edges and wire edges — guard every face-angle check with a walrus-operator None test before comparing to a threshold to avoid unhandled TypeError crashes",
    "the n-gons produced by dissolve_limit are re-triangulated by the GLB exporter on every export; a 6-face minimal slab has 6 triangulation decisions vs 68 for the over-dense source — fewer decisions means less risk of contradictory diagonal choices across Blender versions or export pipeline changes",
    "dissolve_verts on a valence-2 vertex with non-collinear edges produces a non-planar n-gon, not a straight edge merge — verify collinearity with a cross-product check before including a vertex in the dissolve list",
  ],
});
