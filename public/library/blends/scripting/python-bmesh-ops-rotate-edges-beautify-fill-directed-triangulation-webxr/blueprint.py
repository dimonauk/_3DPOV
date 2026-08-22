"""
bmesh.ops.rotate_edges + bmesh.ops.beautify_fill
Directed-Diagonal Triangulation & Delaunay Refinement
Faceted Terrain Tile for WebXR — Blender 5.1

rotate_edges flips the shared edge of a tri-pair to its alternative diagonal.
beautify_fill swaps edges to minimise the maximum area ratio in each tri-pair.
Both operate on an existing triangulation — they do not add or remove verts.

Showcase: 8×8 noise-displaced quad grid triangulated then split into two regions.
Left region: rotate_edges (every diagonal flipped once → chevron pattern).
Right region: beautify_fill (Delaunay-quality diagonals, locally optimal).
The side-by-side contrast reveals when to choose each approach in production.
"""

import bpy, bmesh, math, random
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_X     = 8          # quad columns
GRID_Y     = 8          # quad rows
CELL_SIZE  = 0.25       # metres per quad edge
NOISE_Z    = 0.10       # max vertex Z jitter
NOISE_SEED = 17         # deterministic
SPLIT_X    = 0.0        # world X boundary between left and right regions
EXPORT_PATH = "//hf_terrain_tile.glb"

# ── Seeded RNG (deterministic, no Date.now equivalent) ───────────────────────
rng = random.Random(NOISE_SEED)

# ── Build vertex grid ─────────────────────────────────────────────────────────
bm = bmesh.new()
vgrid = []
for iy in range(GRID_Y + 1):
    row = []
    for ix in range(GRID_X + 1):
        x = ix * CELL_SIZE - GRID_X * CELL_SIZE * 0.5
        y = iy * CELL_SIZE - GRID_Y * CELL_SIZE * 0.5
        z = rng.uniform(-NOISE_Z, NOISE_Z)
        row.append(bm.verts.new((x, y, z)))
    vgrid.append(row)

bm.verts.ensure_lookup_table()

# ── Build quad faces ──────────────────────────────────────────────────────────
source_quads = []
for iy in range(GRID_Y):
    for ix in range(GRID_X):
        v0 = vgrid[iy][ix];   v1 = vgrid[iy][ix + 1]
        v2 = vgrid[iy + 1][ix + 1]; v3 = vgrid[iy + 1][ix]
        source_quads.append(bm.faces.new([v0, v1, v2, v3]))

# ── Uniform triangulation with FIXED diagonal ─────────────────────────────────
# FIXED slices every quad 0→2 (bottom-left→top-right diagonal).
# All diagonals run the same direction — the tabula rasa for directed rotation.
# BEAUTY would run beautify_fill implicitly; we want the raw starting state.
bmesh.ops.triangulate(bm, faces=source_quads, quad_method='FIXED')

bm.faces.ensure_lookup_table()
bm.edges.ensure_lookup_table()

# ── Helper: interior edges shared between exactly two tris ────────────────────
def _interior_tri_edges(bm_inst):
    return [
        e for e in bm_inst.edges
        if len(e.link_faces) == 2
        and all(len(f.verts) == 3 for f in e.link_faces)
    ]

interior = _interior_tri_edges(bm)

# ── Partition into left (rotate) and right (beautify) regions ─────────────────
left_edges  = []
right_faces = set()

for e in interior:
    cx = (e.verts[0].co.x + e.verts[1].co.x) * 0.5
    if cx < SPLIT_X:
        left_edges.append(e)
    else:
        for f in e.link_faces:
            right_faces.add(f)

# ── LEFT REGION: bmesh.ops.rotate_edges ───────────────────────────────────────
# Rotates each interior edge to its perpendicular alternative within the quad
# formed by the two adjacent triangles.
#
# Before:   A───B        After:    A───B
#           │╲  │                  │  ╱│
#           │ ╲ │    rotate →      │ ╱ │
#           │  ╲│                  │╱  │
#           C───D                  C───D
# Shared edge BD becomes AC.  Clockwise winding is preserved.
#
# use_ccw=False: rotate in the clockwise sense within the plane of the quad.
# On a uniform FIXED triangulation one pass flips ALL diagonals to their mirror —
# creating a uniform chevron / herringbone visual signature at flat-shade facets.
#
# result['edges'] — the newly created edge objects after each rotation.
# The original references in left_edges are now invalid (old edges removed).
result_r = bmesh.ops.rotate_edges(bm, edges=left_edges, use_ccw=False)

# ── RIGHT REGION: bmesh.ops.beautify_fill ─────────────────────────────────────
# Swaps edges to improve triangulation quality inside the given face set.
#
# method='AREA' — prefers equal-area tris; minimises the max area ratio per pair.
# method='ANGLE' — minimises the largest interior angle across each edge swap.
# 'AREA' is usually preferable for flat-shaded surfaces because equal-area tris
# produce similarly sized flat facets — avoiding the sliver-heavy "seams" visible
# under rim lighting that unequal triangles cause on a noise-displaced surface.
#
# Pass faces= (not edges=) — beautify_fill selects the interior edges itself
# from the face set; passing edges= restricts which edges it is *allowed* to swap.
result_b = bmesh.ops.beautify_fill(
    bm,
    faces=list(right_faces),
    edges=[],               # no restriction — let it optimise every interior edge
    use_restrict_tag=False,
    method='AREA',
)

# ── Materials ─────────────────────────────────────────────────────────────────
bm.normal_update()
for f in bm.faces:
    f.smooth = False        # flat-shading — each tri becomes one visible facet

me = bpy.data.meshes.new("hf_terrain_tile")
ob = bpy.data.objects.new("hf_terrain_tile", me)
bpy.context.scene.collection.objects.link(ob)

mat_l = bpy.data.materials.new("hf_left")
mat_l.diffuse_color = (0.14, 0.40, 0.30, 1.0)   # teal — directed diagonals
mat_r = bpy.data.materials.new("hf_right")
mat_r.diffuse_color = (0.36, 0.20, 0.48, 1.0)   # violet — optimal diagonals
me.materials.append(mat_l); me.materials.append(mat_r)

bm.to_mesh(me); bm.free()

# Assign materials by polygon centre X
for poly in me.polygons:
    cx = sum(me.vertices[vi].co.x for vi in poly.vertices) / len(poly.vertices)
    poly.material_index = 0 if cx < SPLIT_X else 1
    poly.use_smooth = False

# ── Export ────────────────────────────────────────────────────────────────────
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH, export_format='GLB',
    use_selection=False, export_apply=True,
    export_normals=True, export_yup=True,
    export_texcoords=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
