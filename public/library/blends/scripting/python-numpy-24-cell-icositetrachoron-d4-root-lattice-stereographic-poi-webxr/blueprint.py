"""
blueprint.py — 24-Cell {3,4,3}: D₄ Root System & Stereographic Poi Head
=========================================================================
Blender 5.1 · Python 3.11 · CC0

The 24-cell is the unique self-dual regular 4-polytope. Its 24 vertices
are ALL PERMUTATIONS of (±1, ±1, 0, 0) in ℝ⁴ — the short roots of the
D₄ root system. Self-duality arises from D₄'s rare triality symmetry:
the Dynkin diagram A=B=C all share a central node, so the group has a
non-trivial outer automorphism of order 3 (S₃). No other root system
above rank 2 has this property.

Stereographic projection from the north pole of S³ maps the 96 edges to
straight lines in ℝ³ that reveal three nested shells:
  • Northern shell (w = +1/√2): 6 vertices, 12 edges — small icosahedron-like
  • Equatorial shell (w = 0): 12 vertices, 24 edges — cuboctahedron
  • Southern shell (w = −1/√2): 6 vertices spread outward

Edges connecting northern↔equatorial carry the tension between the tight
inner cage and the middle cuboctahedron; those connecting equatorial↔southern
fan out to the widest extent of the poi head.

Run inside Blender ≥ 5.1:
    blender --background --python blueprint.py

References:
    Coxeter (1973) Regular Polytopes, 3rd ed., Dover — PD algorithm.
    Salazar & Torrence (2018) "The 24-cell is self-dual."
    Mathematics Magazine 91(5):378-382. https://doi.org/10.1080/0025570X.2018.1528875
"""

import bpy
import bmesh
import numpy as np
import os
from itertools import combinations
from mathutils import Vector, Matrix, Quaternion

# ═══════════════════════════════════════════════════════════════════════════════
# PARAMETERS
# ═══════════════════════════════════════════════════════════════════════════════
TUBE_SEGS    = 8        # polygon sides per edge tube (low → faceted)
TUBE_R       = 0.006    # metres — edge tube radius
VERT_R       = 0.013    # metres — vertex sphere radius
POI_SCALE    = 0.14     # metres — outer shell radius target
NAME         = "hf_24cell_poi"
OUTPUT_GLB   = "//hf_24cell_poi.glb"

# Three emission colours keyed to the 4th coordinate (w) tier of each vertex.
# Blender emission (R,G,B,A):
COL_NORTH  = (0.10, 0.55, 1.00, 1.0)   # w = +1/√2 — icy blue
COL_EQUAT  = (1.00, 0.68, 0.08, 1.0)   # w = 0     — amber
COL_SOUTH  = (0.08, 1.00, 0.42, 1.0)   # w = −1/√2 — lime
EMIT_STR   = 4.5

# ═══════════════════════════════════════════════════════════════════════════════
# 1. VERTEX GENERATION — all perms of (±1, ±1, 0, 0)
# ═══════════════════════════════════════════════════════════════════════════════
def gen_24cell_verts() -> np.ndarray:
    """
    Return (24, 4) float64 array.
    Every pair of positions {i,j} from {0,1,2,3} receives signs ±1;
    remaining two positions are 0. Total: C(4,2) × 4 = 6 × 4 = 24. ✓
    All vectors lie on the radius-√2 sphere; the D₄ root system.
    """
    verts = []
    for i, j in combinations(range(4), 2):
        for si in (+1, -1):
            for sj in (+1, -1):
                v = [0, 0, 0, 0]
                v[i] = float(si)
                v[j] = float(sj)
                verts.append(v)
    V = np.array(verts, dtype=float)
    assert V.shape == (24, 4)
    return V

V4_raw  = gen_24cell_verts()                              # (24,4) radius-√2
V4_unit = V4_raw / np.linalg.norm(V4_raw, axis=1, keepdims=True)  # unit S³

# 4th coordinate (w) per vertex on unit sphere: values in {0, ±1/√2}
w_vals = V4_unit[:, 3]  # (24,)

# ═══════════════════════════════════════════════════════════════════════════════
# 2. EDGE DETECTION — pairs at unit-sphere chord distance = 1
# ═══════════════════════════════════════════════════════════════════════════════
# Unnormalised edge length = √2; divided by radius √2 gives 1 on unit sphere.
# WHY sqrt(2)? Vertices at (±1,±1,0,0): differ in exactly 2 non-zero positions
# by ±1 each → |Δ|² = 1+1 = 2 → |Δ| = √2. After normalising by √2: 1. ✓

EDGE_D2 = 1.0    # expected squared chord on unit sphere
EDGE_TOL = 0.02

edges = [
    (i, j)
    for i, j in combinations(range(24), 2)
    if abs(np.sum((V4_unit[i] - V4_unit[j])**2) - EDGE_D2) < EDGE_TOL
]
assert len(edges) == 96, f"Expected 96 edges, got {len(edges)}"

# ═══════════════════════════════════════════════════════════════════════════════
# 3. STEREOGRAPHIC PROJECTION S³ → ℝ³
# ═══════════════════════════════════════════════════════════════════════════════
# Project from north pole N=(0,0,0,1) — not a vertex of the 24-cell.
# π(x,y,z,w) = (x,y,z)/(1−w).
# w values for our vertices: {0, ±1/√2}. Denominators: {1, 1∓1/√2} > 0. ✓
#
# Resulting 3D shell structure:
#  • w = 0    → equatorial, projects to unit cuboctahedron (|v|≤1)
#  • w = +1/√2 → northern, large denominator ≈ 0.29, projects far out
#  • w = −1/√2 → southern, denominator ≈ 1.71, projects inward (inner cage)

w4 = V4_unit[:, 3]
denom = 1.0 - w4                                # (24,)
V3_raw = V4_unit[:, :3] / denom[:, np.newaxis]  # (24,3)

max_r = float(np.max(np.linalg.norm(V3_raw, axis=1)))
V3 = V3_raw * (POI_SCALE / max_r)               # scale to poi head size

# ═══════════════════════════════════════════════════════════════════════════════
# 4. SCENE SETUP & MATERIALS
# ═══════════════════════════════════════════════════════════════════════════════
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.outliner.orphans_purge(do_recursive=True)

def emit_mat(name: str, colour, strength: float = EMIT_STR):
    """Create/replace an emission material."""
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = colour
    emit.inputs['Strength'].default_value = strength
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return m

mat_n = emit_mat("24c_north", COL_NORTH)
mat_e = emit_mat("24c_equat", COL_EQUAT)
mat_s = emit_mat("24c_south", COL_SOUTH)

def mat_for_w(w: float):
    if w >  0.1: return mat_n
    if w < -0.1: return mat_s
    return mat_e

# ═══════════════════════════════════════════════════════════════════════════════
# 5. GEOMETRY HELPERS (pure bmesh, no bpy.ops.mesh primitives)
# ═══════════════════════════════════════════════════════════════════════════════
import mathutils

def add_tube(bm: bmesh.types.BMesh,
             p0: np.ndarray, p1: np.ndarray,
             radius: float, n: int) -> None:
    """
    Add a capped cylinder tube from p0 to p1 into bm.
    Build circle rings in local +Z frame, rotate to align, translate to mid.
    No bpy.ops context required — pure bmesh.
    """
    p0v = mathutils.Vector(p0.tolist())
    p1v = mathutils.Vector(p1.tolist())
    mid    = (p0v + p1v) * 0.5
    vec    = p1v - p0v
    length = vec.length
    if length < 1e-9:
        return
    rot = mathutils.Vector((0, 0, 1)).rotation_difference(vec.normalized()).to_matrix()

    thetas = [2 * np.pi * k / n for k in range(n)]

    def ring(z_off):
        return [
            bm.verts.new(rot @ mathutils.Vector(
                (radius * np.cos(t), radius * np.sin(t), z_off)
            ) + mid)
            for t in thetas
        ]

    bot = ring(-length * 0.5)
    top = ring(+length * 0.5)

    for k in range(n):
        k1 = (k + 1) % n
        bm.faces.new([bot[k], bot[k1], top[k1], top[k]])

    bm.faces.new(bot)              # bottom cap
    bm.faces.new(list(reversed(top)))  # top cap


def add_ico_sphere(bm: bmesh.types.BMesh,
                   centre: np.ndarray, radius: float) -> None:
    """
    Add a subdivided-0 icosahedron (20 triangles) into bm.
    Uses the golden-ratio vertex formula for a unit icosahedron.
    """
    phi = (1.0 + np.sqrt(5.0)) * 0.5
    # 12 icosahedron vertices (unit sphere)
    raw = np.array([
        [0,  1,  phi], [0, -1,  phi], [0,  1, -phi], [0, -1, -phi],
        [ 1,  phi, 0], [-1,  phi, 0], [ 1, -phi, 0], [-1, -phi, 0],
        [ phi, 0,  1], [-phi, 0,  1], [ phi, 0, -1], [-phi, 0, -1],
    ], dtype=float)
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    raw = raw / norms * radius

    ctr = mathutils.Vector(centre.tolist())
    vs = [bm.verts.new(mathutils.Vector(p.tolist()) + ctr) for p in raw]

    # 20 icosahedron faces (CCW winding outward)
    faces = [
        (0,1,8),(0,8,4),(0,4,5),(0,5,9),(0,9,1),
        (1,6,8),(8,10,4),(4,3,5),(5,11,9),(9,7,1),
        (6,10,8),(10,3,4),(3,11,5),(11,7,9),(7,6,1),
        (6,2,10),(10,2,3),(3,2,11),(11,2,7),(7,2,6),
    ]
    for f in faces:
        bm.faces.new([vs[i] for i in f])

# ═══════════════════════════════════════════════════════════════════════════════
# 6. BUILD MESH FOR EACH TIER AND CREATE OBJECTS
# ═══════════════════════════════════════════════════════════════════════════════
def w_tier(w: float) -> int:
    """0=north(blue), 1=equatorial(amber), 2=south(green)"""
    if w >  0.1: return 0
    if w < -0.1: return 2
    return 1

bm_tiers = [bmesh.new() for _ in range(3)]

# Edge tubes — colour by mean w of two endpoint vertices
for (ai, bi) in edges:
    w_avg = float((w_vals[ai] + w_vals[bi]) * 0.5)
    add_tube(bm_tiers[w_tier(w_avg)], V3[ai], V3[bi], TUBE_R, TUBE_SEGS)

# Vertex icospheres
for idx in range(24):
    add_ico_sphere(bm_tiers[w_tier(float(w_vals[idx]))], V3[idx], VERT_R)

# Convert bmeshes to mesh objects
materials  = [mat_n, mat_e, mat_s]
tier_objs  = []

for tier_idx, (bm, mat) in enumerate(zip(bm_tiers, materials)):
    bm.verts.ensure_lookup_table()
    me = bpy.data.meshes.new(f"24c_tier{tier_idx}")
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = False
    me.update()
    me.materials.append(mat)
    ob = bpy.data.objects.new(f"24c_tier{tier_idx}", me)
    bpy.context.scene.collection.objects.link(ob)
    tier_objs.append(ob)

# ═══════════════════════════════════════════════════════════════════════════════
# 7. JOIN, TAG & EXPORT
# ═══════════════════════════════════════════════════════════════════════════════
bpy.ops.object.select_all(action='DESELECT')
for ob in tier_objs:
    ob.select_set(True)
bpy.context.view_layer.objects.active = tier_objs[0]
bpy.ops.object.join()

poi = bpy.context.active_object
poi.name = NAME

bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
poi["holoflow:facet"] = True   # WebXR flat-shade signal

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_attributes=True,
    use_selection=False,
)

print(f"[24-cell] {len(V4_raw)} vertices, {len(edges)} edges → {OUTPUT_GLB}")
print(f"[24-cell] Shell radii (before scale):")
for label, w_thr in [("north", 0.5), ("equat", 0.0), ("south", -0.5)]:
    mask = np.abs(w_vals - w_thr) < 0.4
    r = float(np.mean(np.linalg.norm(V3[mask], axis=1)))
    print(f"  {label}: mean radius ≈ {r:.4f} m")
