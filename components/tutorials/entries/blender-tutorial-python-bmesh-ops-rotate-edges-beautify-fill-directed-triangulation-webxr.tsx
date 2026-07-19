import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.rotate_edges</code> and{" "}
        <code>bmesh.ops.beautify_fill</code> are two complementary operations
        that redirect interior edges within an existing triangulation without
        adding or removing a single vertex. <code>rotate_edges</code> is a
        deliberate, artist-directed flip — you hand it a list of edges and it
        replaces each one with the opposite diagonal of the quad formed by the
        two adjacent triangles. <code>beautify_fill</code> is a quality pass —
        it surveys every interior edge in a face set and swaps those whose
        rotation would produce a more uniform triangulation. The two sit at
        opposite ends of the control/quality spectrum and are often used in
        sequence: <code>beautify_fill</code> first for structural quality, then
        selective <code>rotate_edges</code> on specific edges for visual
        effect.
      </p>

      <h2>Signatures</h2>
      <pre>{`# rotate_edges — flip each edge to the perpendicular alternative diagonal
result = bmesh.ops.rotate_edges(
    bm,
    edges   = list[BMEdge],  # must be shared between exactly 2 triangle faces
    use_ccw = False,         # winding sense of the rotation (CW vs CCW)
)
# Returns {'edges': list[BMEdge]} — the newly created edge objects.
# The input edge references in 'edges' are invalid after the call.

# beautify_fill — swap edges for locally optimal triangulation quality
result = bmesh.ops.beautify_fill(
    bm,
    faces          = list[BMFace],  # triangulated faces to process
    edges          = [],            # restrict to these edges only (empty = no restriction)
    use_restrict_tag = False,       # if True, only rotate tag-marked edges
    method         = 'AREA',        # 'AREA' or 'ANGLE'
)
# Returns {'geom': list[BMVert | BMEdge | BMFace]} — all geometry in the region.`}</pre>

      <h2>Topology mechanics — what "rotate" means</h2>
      <pre>{`Two adjacent triangles share edge BD and together cover quad ABDC:

  A ─── B
  │  ╲  │    ← shared edge BD (current state)
  │   ╲ │
  C ─── D

After rotate_edges(bm, edges=[BD]):

  A ─── B
  │  ╱  │    ← new edge AC replaces BD
  │ ╱   │
  C ─── D

The two triangle-pairs are: (ABD, BDC) → (ABC, ACD).
Vertex positions do not change — only which vertex each triangle claims.`}</pre>
      <p>
        The operation is its own inverse: rotating the same edge twice returns
        to the original state. This makes it safe to experiment in a loop: keep
        rotating until a quality criterion (e.g. edge length or face area
        balance) improves, then stop.
      </p>

      <h2>
        rotate_edges vs the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr"
          className={lk}
        >
          triangulate operator
        </Link>
      </h2>
      <p>
        <code>bmesh.ops.triangulate</code> with <code>quad_method='FIXED'</code>{" "}
        gives every quad the same diagonal — a uniform starting state with no
        quality consideration. <code>rotate_edges</code> is the surgical tool
        you reach for after triangulation when you need a specific diagonal for
        artistic or structural reasons. Concretely:
      </p>
      <ul>
        <li>
          <strong>Chevron / herringbone patterns</strong> — rotate every
          interior diagonal once on a regular grid to produce the opposite
          direction uniformly.
        </li>
        <li>
          <strong>Edge-flow correction</strong> — after a{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
            className={lk}
          >
            split_edges
          </Link>{" "}
          pass or boolean operation, specific diagonals may run against the
          desired shading gradient; rotating them aligns the flat-face facet
          grain with the surface curvature.
        </li>
        <li>
          <strong>Targeted normal improvement</strong> — a triangle whose
          normal deviates from its quad&apos;s intended normal (due to vertex
          noise) often improves after rotating the diagonal.
        </li>
      </ul>

      <h2>beautify_fill method comparison</h2>
      <pre>{`method='AREA'  — minimises the maximum area ratio within each tri-pair.
               Produces the most visually uniform facet size under flat shading.
               Best for low-poly terrain and cel-shade surfaces.

method='ANGLE' — minimises the maximum interior angle across each edge swap.
               Closest to a true Delaunay criterion; prefers equilateral tris.
               Best when the triangulation feeds a normal-bake or a physics sim
               that is sensitive to degenerate (sliver) triangles.`}</pre>
      <p>
        Note that neither method is a global Delaunay solver — each pass is one
        round of local edge swaps. Running <code>beautify_fill</code> multiple
        times converges toward the global optimum but is rarely needed in
        practice; one pass is sufficient for flat-shaded WebXR assets.
      </p>

      <h2>Blueprint — directed terrain tile</h2>
      <p>
        An 8 × 8 quad grid with seeded Z-noise is triangulated with{" "}
        <code>FIXED</code> diagonal direction. The world X midpoint divides it
        into two regions: the left half demonstrates{" "}
        <code>rotate_edges</code> (uniform chevron pattern), and the right half
        demonstrates <code>beautify_fill</code> (locally optimal). The
        side-by-side contrast is visible in flat-shaded solid view — the teal
        left half shows parallel diagonal striping; the violet right half shows
        a varied, noise-adapted pattern. See{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-discrete-faces-per-face-spike-urchin-crystal-webxr"
          className={lk}
        >
          extrude_discrete_faces
        </Link>{" "}
        for the extrusion step that typically follows once the triangulation
        quality is set.
      </p>
      <pre>{`import bpy, bmesh, math, random
from mathutils import Vector

GRID_X = 8; GRID_Y = 8; CELL_SIZE = 0.25; NOISE_Z = 0.10
NOISE_SEED = 17; SPLIT_X = 0.0; EXPORT_PATH = "//hf_terrain_tile.glb"
rng = random.Random(NOISE_SEED)

bm = bmesh.new()
vgrid = []
for iy in range(GRID_Y + 1):
    row = []
    for ix in range(GRID_X + 1):
        x = ix * CELL_SIZE - GRID_X * CELL_SIZE * 0.5
        y = iy * CELL_SIZE - GRID_Y * CELL_SIZE * 0.5
        row.append(bm.verts.new((x, y, rng.uniform(-NOISE_Z, NOISE_Z))))
    vgrid.append(row)

source_quads = []
for iy in range(GRID_Y):
    for ix in range(GRID_X):
        v0 = vgrid[iy][ix]; v1 = vgrid[iy][ix+1]
        v2 = vgrid[iy+1][ix+1]; v3 = vgrid[iy+1][ix]
        source_quads.append(bm.faces.new([v0,v1,v2,v3]))

# Uniform FIXED diagonal gives every quad the same starting diagonal direction
bmesh.ops.triangulate(bm, faces=source_quads, quad_method='FIXED')

bm.faces.ensure_lookup_table(); bm.edges.ensure_lookup_table()

interior = [
    e for e in bm.edges
    if len(e.link_faces) == 2
    and all(len(f.verts) == 3 for f in e.link_faces)
]

left_edges, right_faces = [], set()
for e in interior:
    cx = (e.verts[0].co.x + e.verts[1].co.x) * 0.5
    if cx < SPLIT_X:
        left_edges.append(e)
    else:
        for f in e.link_faces:
            right_faces.add(f)

# rotate_edges: flip every interior diagonal in the left half once.
# After the call, left_edges refs are invalid — use result['edges'] for new refs.
result_r = bmesh.ops.rotate_edges(bm, edges=left_edges, use_ccw=False)

# beautify_fill: let it pick the best diagonal independently per tri-pair.
# Pass faces=, NOT edges= — the operator selects candidate edges from the faces.
result_b = bmesh.ops.beautify_fill(
    bm, faces=list(right_faces), edges=[], use_restrict_tag=False, method='AREA',
)

bm.normal_update()
for f in bm.faces: f.smooth = False

me = bpy.data.meshes.new("hf_terrain_tile")
ob = bpy.data.objects.new("hf_terrain_tile", me)
bpy.context.scene.collection.objects.link(ob)

mat_l = bpy.data.materials.new("hf_left");  mat_l.diffuse_color  = (0.14,0.40,0.30,1)
mat_r = bpy.data.materials.new("hf_right"); mat_r.diffuse_color = (0.36,0.20,0.48,1)
me.materials.append(mat_l); me.materials.append(mat_r)

bm.to_mesh(me); bm.free()

for poly in me.polygons:
    cx = sum(me.vertices[vi].co.x for vi in poly.vertices)/len(poly.vertices)
    poly.material_index = 0 if cx < SPLIT_X else 1
    poly.use_smooth = False

ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    use_selection=False, export_apply=True,
    export_normals=True, export_yup=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
)`}</pre>

      <h2>Directed-rotation patterns</h2>
      <p>
        Beyond uniform one-pass flipping, <code>rotate_edges</code> enables
        artist-directed topological patterns when you select edges
        conditionally:
      </p>
      <pre>{`# Radial pattern: rotate diagonals that point "away" from a focal point
# so they all swing to point "toward" it instead.
import mathutils

focal = mathutils.Vector((0, 0, 0))

def points_away(edge, focal_pt):
    """Return True if the edge direction has a component away from focal."""
    mid   = (edge.verts[0].co + edge.verts[1].co) * 0.5
    to_f  = (focal_pt - mid).normalized()
    e_dir = (edge.verts[1].co - edge.verts[0].co).normalized()
    return e_dir.dot(to_f) < 0   # negative dot → edge points away

radial_edges = [e for e in interior if points_away(e, focal)]
bmesh.ops.rotate_edges(bm, edges=radial_edges, use_ccw=False)`}</pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr"
          className={lk}
        >
          poke_faces
        </Link>{" "}
        operator achieves a similar radial "burst" from face centres; combine
        it with <code>rotate_edges</code> post-poke to redirect the spoke
        diagonals for a more crystalline facet grain.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>
            <code>rotate_edges</code> has no effect on some edges.
          </strong>{" "}
          The edge must be shared between <em>exactly</em> two triangular
          faces. Edges on boundary loops, wire edges, or edges adjacent to
          quads or N-gons are silently skipped. Run{" "}
          <code>bmesh.ops.triangulate</code> first and verify with{" "}
          <code>all(len(f.verts) == 3 for f in e.link_faces)</code> before
          passing to <code>rotate_edges</code>.
        </li>
        <li>
          <strong>Input edge references invalid after the call.</strong>{" "}
          <code>rotate_edges</code> removes the old edge and inserts a new
          one. The <code>BMEdge</code> objects in your{" "}
          <code>edges</code> list no longer exist in the bmesh after the call.
          Use <code>result[&apos;edges&apos;]</code> to get the newly created
          edges; call <code>bm.edges.ensure_lookup_table()</code> to rebuild
          the index.
        </li>
        <li>
          <strong>
            <code>beautify_fill</code> appears to do nothing.
          </strong>{" "}
          The <code>faces</code> argument must contain only triangles. If the
          faces list includes quads or N-gons,{" "}
          <code>beautify_fill</code> skips them without error — pass{" "}
          <code>bmesh.ops.triangulate</code> output first, or filter with{" "}
          <code>[f for f in bm.faces if len(f.verts) == 3]</code>.
        </li>
        <li>
          <strong>
            GLB normals look wrong after rotation — some faces are dark.
          </strong>{" "}
          Call <code>bm.normal_update()</code> after all rotation/beautify
          operations, before <code>bm.to_mesh()</code>. Edge rotations change
          face winding and the cached normals must be recomputed before the
          glTF exporter reads them.
        </li>
        <li>
          <strong>
            <code>use_ccw</code> seems to have no visible effect.
          </strong>{" "}
          On a co-planar quad the two diagonals are simply each other&apos;s
          alternative — there is only one other option, so{" "}
          <code>use_ccw</code> affects winding of the result tris rather than
          which diagonal is chosen. On a non-planar quad it can determine which
          of two topologically valid rotations produces less face folding.
          Prefer <code>use_ccw=False</code> (the default) and call{" "}
          <code>bm.normal_update()</code> to verify the result before export.
        </li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/current/bmesh.ops.html#bmesh.ops.rotate_edges"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            <code>bmesh.ops.rotate_edges</code> — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA 4.0 · Blender Foundation). Canonical parameter reference.
          Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bmesh.ops.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            full bmesh.ops module
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/CGArtPython/blender_plus_python"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            CGArtPython/blender_plus_python
          </a>{" "}
          (MIT · Victor Stepanov). Blender scripting cookbook covering mesh
          construction and export pipelines. Related:{" "}
          <a
            href="https://github.com/CGArtPython/bpy_building_blocks"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bpy_building_blocks
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr",
  title:
    "Python bmesh.ops.rotate_edges + beautify_fill — Directed-Diagonal Triangulation & Delaunay Refinement: Faceted Terrain Tile for WebXR (Blender 5.1)",
  description:
    "rotate_edges flips the shared diagonal of a tri-pair to its alternative without moving vertices — enabling uniform chevron patterns, targeted edge-flow correction, and artist-directed triangulation grain. beautify_fill swaps interior edges for locally optimal (minimum area-ratio or angle-deviation) quality. Covers the topology mechanics of diagonal rotation, the AREA vs ANGLE method comparison, the two-region blueprint demonstrating both operators side-by-side, and the four silent-failure modes most likely to catch scripting newcomers.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "rotate-edges",
    "beautify-fill",
    "triangulation",
    "topology",
    "delaunay",
    "faceted",
    "terrain",
    "glb",
    "webxr",
    "flat-shading",
    "low-poly",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-rotate-edges-beautify-fill-directed-triangulation-webxr",
  Body,
  keyInsights: [
    "rotate_edges only operates on edges shared between exactly two triangular faces — boundary edges, wire edges, and edges adjacent to quads or N-gons are silently skipped; always verify tri-pair status before passing to the operator",
    "input BMEdge references in the edges list are invalid after the call — rotate_edges removes the old edge and creates a new one; use result['edges'] to obtain live references and call bm.edges.ensure_lookup_table() to rebuild the index",
    "beautify_fill takes faces= not edges= as its primary argument — pass the triangulated face set and let the operator collect candidate edges itself; passing edges= alone (with no faces) restricts the allowed swaps but does not define the region",
    "bm.normal_update() is mandatory after all edge-rotation operations before bm.to_mesh() — diagonal rotation changes face winding and the cached normals must be recomputed before the glTF exporter reads them",
    "rotate_edges is its own inverse: rotating the same edge twice returns to the original state — useful for a loop that keeps rotating until a quality criterion (area balance, normal deviation) improves and then stops",
    "beautify_fill method='AREA' produces visually uniform facet sizes under flat shading; method='ANGLE' minimises the maximum interior angle and is preferable when the triangulation feeds a normal-bake or a physics simulation sensitive to sliver triangles",
    "on a co-planar quad use_ccw affects winding of the resulting tri-pair rather than which diagonal is selected — there is only one alternative diagonal; on a non-planar quad it can determine which of two topologically valid rotations produces less face folding",
  ],
});
