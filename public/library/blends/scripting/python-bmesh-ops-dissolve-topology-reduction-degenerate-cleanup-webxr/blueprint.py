"""
bmesh.ops dissolve family — Topology Reduction Pipeline
Coplanar Collapse & Degenerate Cleanup for Export-Safe GLBs — Blender 5.1

dissolve_degenerate  → merges vertices within dist, removing near-zero geometry
dissolve_limit       → dissolves edges whose dihedral angle < angle_limit
dissolve_edges       → removes targeted edges, merging adjacent faces
dissolve_verts       → removes targeted vertices, merging adjacent edges/faces

Production order: degenerate → limit → edges → verts.
Reversing the order strands near-degenerate topology that resists later merges
and leaves invisible dark patches in the GLB NORMAL accessor.

Demo: a 6×4 over-dense panel tile (68 faces from a SubD-bake retopology workflow)
reduced to 6 faces without displacing a single vertex, then exported as a GLB.
"""

import bpy, bmesh
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
PANEL_W       = 2.0      # metres, X span
PANEL_H       = 1.2      # metres, Y span
DEPTH         = 0.08     # slab extrusion along −Z
GRID_COLS     = 6        # front-face columns (deliberately over-dense)
GRID_ROWS     = 4        # front-face rows (deliberately over-dense)
DEGEN_DIST    = 1e-4     # dissolve_degenerate merge threshold (metres)
PLANAR_LIMIT  = 0.017    # dissolve_limit angle (radians ≈ 1°)
EXPORT_PATH   = "//hf_panel_tile.glb"

# ── Step 1: Build 6×4 front-face grid (deliberately over-dense) ───────────────
bm = bmesh.new()

cw = PANEL_W / GRID_COLS     # cell width
ch = PANEL_H / GRID_ROWS     # cell height

vgrid = []
for iy in range(GRID_ROWS + 1):
    row = []
    for ix in range(GRID_COLS + 1):
        x = ix * cw - PANEL_W * 0.5
        y = iy * ch - PANEL_H * 0.5
        row.append(bm.verts.new((x, y, 0.0)))
    vgrid.append(row)

bm.verts.ensure_lookup_table()

front_faces = []
for iy in range(GRID_ROWS):
    for ix in range(GRID_COLS):
        v0 = vgrid[iy][ix];   v1 = vgrid[iy][ix + 1]
        v2 = vgrid[iy + 1][ix + 1]; v3 = vgrid[iy + 1][ix]
        front_faces.append(bm.faces.new([v0, v1, v2, v3]))

# ── Step 2: Inject a near-degenerate vertex (simulates CAD import noise) ───────
# Placed 40 % of DEGEN_DIST from the bottom-left corner — close enough that
# dissolve_degenerate will merge it, but invisible in the viewport at normal zoom.
noise_v = bm.verts.new(vgrid[0][0].co + Vector((DEGEN_DIST * 0.4, 0.0, 0.0)))

# ── Step 3: Extrude slab — 24 front + 24 back + 20 side walls = 68 faces ──────
# extrude_face_region copies the face geom; original front_faces stay at z=0.
# All new geometry (back face + side walls) is returned in ret['geom'].
ret = bmesh.ops.extrude_face_region(bm, geom=front_faces)
new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, vec=Vector((0.0, 0.0, -DEPTH)), verts=new_verts)

bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()
print(f"[before] verts={len(bm.verts)}  edges={len(bm.edges)}  faces={len(bm.faces)}")
# Expect ≈ 70 verts, 161 edges, 68 + degenerate wire = 68 faces

# ── Step 4: dissolve_degenerate — always first ────────────────────────────────
# Merges every pair of vertices within DEGEN_DIST of each other.
# The noise_v we planted (0.4 × DEGEN_DIST away from vgrid[0][0]) is merged
# back into the corner, removing the near-zero wire edge.
# edges= must list all edges in the bmesh; the operator inspects their lengths.
# CRITICAL: run before dissolve_limit — a nearly-zero-length edge creates a
# degenerate face whose dihedral angle is undefined; the limit pass may freeze
# or silently skip it, leaving a dark triangle in the NORMAL accessor.
bmesh.ops.dissolve_degenerate(bm, dist=DEGEN_DIST, edges=bm.edges[:])

# ── Step 5: dissolve_limit — collapse all coplanar loops in one call ───────────
# angle_limit=0.017 rad (≈ 1°): any interior edge whose two adjacent face normals
# differ by less than 1° is dissolved.  On a perfectly flat surface the dihedral
# angle is 0 → EVERY interior edge of the 6×4 front grid and the 6×4 back grid
# is dissolved.  The four side walls meet the flat faces at 90° (π/2 rad >> 1°)
# and are NOT dissolved — they survive as individual quads.
#
# delimit=set() means no group boundaries are respected.
# delimit={'SHARP'} would protect edges marked sharp — essential if you have
# pre-tagged hard normals you want to survive the reduction pass.
#
# use_dissolve_boundaries=False: never dissolve open boundary edges.
# Setting True can collapse the perimeter of an open shell into a wire,
# removing the floor of the side walls on partially-open meshes.
bmesh.ops.dissolve_limit(
    bm,
    angle_limit             = PLANAR_LIMIT,
    use_dissolve_boundaries = False,
    verts                   = bm.verts[:],
    edges                   = bm.edges[:],
    delimit                 = set(),
)

bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()
print(f"[after limit] verts={len(bm.verts)}  edges={len(bm.edges)}  faces={len(bm.faces)}")
# Expect: 8 verts, 12 edges, 6 faces — a perfect rectangular slab.

# ── Step 6: dissolve_edges — surgical removal of any surviving interior loops ──
# After dissolve_limit the slab is already minimal here.  In production a slight
# angle deviation (e.g. 1.2° on a nominally-flat-but-warped mesh) keeps edges
# alive.  Target them explicitly: collect edges whose adjacent faces are nearly
# co-planar using calc_face_angle(), then dissolve.
# use_verts=True also merges any valence-2 vertices the edge removal creates,
# preventing T-junction stranding that trips up UV unwrappers.
surviving_interior = [
    e for e in bm.edges
    if len(e.link_faces) == 2
    and (ang := e.calc_face_angle(None)) is not None
    and ang < PLANAR_LIMIT * 4           # catch edges dissolve_limit may have missed
]
if surviving_interior:
    bmesh.ops.dissolve_edges(
        bm,
        edges          = surviving_interior,
        use_verts      = True,     # merge any resulting valence-2 verts
        use_face_split = False,    # keep co-planar neighbours merged
    )

# ── Step 7: dissolve_verts — clean up any T-junction vertices ─────────────────
# A valence-2 non-boundary vertex is a T-junction: two collinear edges that
# could be a single edge.  dissolve_verts removes the vertex and merges the
# pair into one.  On this mesh geometry no T-junctions survive to this step,
# but the pattern is the standard final sweep in every production pipeline.
t_verts = [v for v in bm.verts if len(v.link_edges) == 2 and not v.is_boundary]
if t_verts:
    bmesh.ops.dissolve_verts(
        bm,
        verts             = t_verts,
        use_face_split    = False,
        use_boundary_tear = False,
    )

print(f"[final] verts={len(bm.verts)}  edges={len(bm.edges)}  faces={len(bm.faces)}")

# ── Materials & flat-shade ─────────────────────────────────────────────────────
bm.normal_update()
for f in bm.faces:
    f.smooth = False

me = bpy.data.meshes.new("hf_panel_tile")
ob = bpy.data.objects.new("hf_panel_tile", me)
bpy.context.scene.collection.objects.link(ob)

mat = bpy.data.materials.new("hf_panel_body")
mat.diffuse_color = (0.18, 0.22, 0.30, 1.0)   # cool steel charcoal
me.materials.append(mat)

bm.to_mesh(me)
bm.free()

# ── Export GLB ────────────────────────────────────────────────────────────────
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath                              = EXPORT_PATH,
    export_format                         = 'GLB',
    use_selection                         = False,
    export_apply                          = True,
    export_normals                        = True,
    export_yup                            = True,
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
)
