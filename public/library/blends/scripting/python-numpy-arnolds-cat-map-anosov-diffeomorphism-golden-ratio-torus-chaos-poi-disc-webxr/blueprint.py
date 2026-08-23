"""
Arnold's Cat Map — Anosov Diffeomorphism & Golden-Ratio Manifolds (Blender 5.1)
===========================================================================
Vladimir Arnold introduced this torus automorphism in the 1960s to illustrate
how a smooth, area-preserving map can produce perfect chaos via hyperbolicity.

THE CAT MAP
    f: T² → T²  (T² = ℝ²/ℤ², the flat 2-torus)
    (u, v) ↦ (2u + v, u + v)  mod 1
    written as  M · [u, v]ᵀ mod 1,  M = [[2, 1], [1, 1]]

KEY INVARIANTS
    det M = 1          area-preserving (Liouville's theorem)
    tr  M = 3
    Eigenvalues: λ± = (3 ± √5) / 2  = φ²  and  1/φ²
        where φ = (1+√5)/2 ≈ 1.618 is the golden ratio
    λ₊ = φ² ≈ 2.618   (expansion along unstable manifold)
    λ₋ = 1/φ² ≈ 0.382 (contraction along stable manifold)
    Lyapunov exponent: Λ = log φ² = 2 log φ ≈ 0.962 nats/iteration

FIBONACCI CONNECTION
    M^k has entries given by Fibonacci numbers:
    M^1 = [[2,1],[1,1]],  M^2 = [[5,3],[3,2]],  M^3 = [[13,8],[8,5]],
    M^5 = [[89,55],[55,34]],  M^8 = [[987,610],[610,377]]
    — these ARE the Fibonacci numbers (F_2k+1, F_2k, F_2k-1).

UNSTABLE MANIFOLD
    Eigenvector of λ₊: v = (1, 1/φ) = (φ, 1) up to scale.
    The unstable manifold through (0,0) is the dense set
        {(t, t/φ) mod 1 : t ∈ ℝ}
    Since 1/φ is irrational this wraps everywhere on T².

PERIOD ON FINITE LATTICE
    On the N×N lattice (p/N, q/N), the period T(N) is finite:
    N=2: T=3;  N=3: T=4;  N=5: T=10;  N=8: T=6;  N=13: T=7.
    The scramble field at K=T(N) returns exactly to zero — the
    famous "cat image recovery" demonstration.

VISUALISATION (this blueprint)
    N×N float grid on [0,1)² mapped to a 1 m × 1 m poi disc.
    Scramble distance after K steps:
        d_K(u,v) = torus_dist( M^K(u,v) mod 1, (u,v) )
    Height z = d_K · HEIGHT_SCALE.
    Shape keys store the height field for K = 1, 2, 3, 5, 8.
    FLOAT_COLOR "CatMap_Scramble" uses d₃ (K=3) — best visual.

    A second object traces the unstable manifold as a dense curve.

Blender 5.1 · bpy direct-API · NumPy vectorised · no external deps.
"""

import bpy
import bmesh
import numpy as np

# ─────────────────────── parameters ─────────────────────────────────────────
SLUG          = "hf_arnold_cat"
N             = 64          # vertices per side; N² = 4 096 vertices
PHYS_SIZE     = 1.0         # disc side length in metres
HEIGHT_SCALE  = 0.20        # max z-height for scramble-distance field

K_COLOUR      = 3           # which step's d_K drives the vertex colour

# golden ratio
PHI = (1.0 + np.sqrt(5.0)) / 2.0      # ≈ 1.6180339887

# Arnold cat-map matrix (integer, exact)
M_INT = np.array([[2, 1], [1, 1]], dtype=np.int64)

# colour stops (r, g, b, a) — linear sRGB
COL_COBALT  = (0.02, 0.12, 0.60, 1.0)  # near-zero scramble
COL_AMBER   = (0.90, 0.55, 0.05, 1.0)  # mid scramble
COL_CRIMSON = (0.75, 0.04, 0.10, 1.0)  # max scramble

# ─────────────────────── UV grid ─────────────────────────────────────────────
# u, v ∈ [0, 1) — endpoint=False avoids duplicate seam vertex
u_lin = np.linspace(0.0, 1.0, N, endpoint=False)
v_lin = np.linspace(0.0, 1.0, N, endpoint=False)
UU, VV = np.meshgrid(u_lin, v_lin, indexing="ij")   # (N, N)
pts = np.stack([UU.ravel(), VV.ravel()], axis=1)     # (N², 2) in [0,1)

# ─────────────────────── helpers ─────────────────────────────────────────────
def torus_dist_sq(a, b):
    """Squared toroidal distance between arrays a, b with shape (n, 2)."""
    d = a - b
    d -= np.round(d)      # wrap to (-0.5, +0.5] on each axis
    return (d * d).sum(axis=1)

def cat_k(pts_in, k):
    """Apply the cat map exactly k times using M^k; return result mod 1."""
    Mk = np.linalg.matrix_power(M_INT, k).astype(np.float64)
    # matrix multiply: each row of pts_in by Mk (Mk @ col = row @ Mk.T)
    return (pts_in @ Mk.T) % 1.0

# ─────────────────────── scramble distances ──────────────────────────────────
K_STEPS = [1, 2, 3, 5, 8]
d_sq = {}
for k in K_STEPS:
    d_sq[k] = torus_dist_sq(cat_k(pts, k), pts)

d_max = max(np.sqrt(v).max() for v in d_sq.values())
d_max = max(d_max, 1e-9)    # guard zero-division

# ─────────────────────── physical positions ───────────────────────────────────
# Centre the disc so u=0.5, v=0.5 maps to (0, 0)
x_phys = (UU.ravel() - 0.5) * PHYS_SIZE     # (N²,)
y_phys = (VV.ravel() - 0.5) * PHYS_SIZE
z_flat  = np.zeros(N * N)

positions_basis = np.column_stack([x_phys, y_phys, z_flat]).astype(np.float32)

# ─────────────────────── vertex colour ───────────────────────────────────────
def scramble_colour(d_norm):
    """d_norm ∈ [0,1] → RGBA via cobalt → amber → crimson ramp."""
    n    = len(d_norm)
    rgba = np.zeros((n, 4), dtype=np.float32)
    rgba[:, 3] = 1.0
    lo = d_norm <= 0.5
    t1 = d_norm[lo] * 2.0
    hi = ~lo
    t2 = (d_norm[hi] - 0.5) * 2.0
    for ch in range(3):
        rgba[lo, ch] = COL_COBALT[ch] + t1 * (COL_AMBER[ch] - COL_COBALT[ch])
        rgba[hi, ch] = COL_AMBER[ch]  + t2 * (COL_CRIMSON[ch] - COL_AMBER[ch])
    return rgba

d_norm_colour = np.sqrt(d_sq[K_COLOUR]) / d_max
colours = scramble_colour(d_norm_colour)

# ─────────────────────── scene setup ────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# ─────────────────────── build main disc mesh ─────────────────────────────────
mesh = bpy.data.meshes.new(SLUG)
obj  = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()
verts = [bm.verts.new(positions_basis[i].tolist()) for i in range(N * N)]
bm.verts.ensure_lookup_table()

# (N-1)×(N-1) quad faces; seam-wrap is not needed for the flat representation
for row in range(N - 1):
    for col in range(N - 1):
        i0 = row * N + col
        bm.faces.new([verts[i0], verts[i0 + 1],
                      verts[i0 + N + 1], verts[i0 + N]])

bm.to_mesh(mesh)
bm.free()
mesh.update()

# FLOAT_COLOR POINT attribute — linear sRGB, exports to GLTF COLOR_0
col_attr = mesh.attributes.new("CatMap_Scramble", "FLOAT_COLOR", "POINT")
col_attr.data.foreach_set("color", colours.ravel())

# ─────────────────────── shape keys ──────────────────────────────────────────
# Basis shape key (flat disc, k=0)
obj.shape_key_add(name="Basis", from_mix=False)
sk_basis = obj.data.shape_keys.key_blocks["Basis"]
sk_basis.data.foreach_set("co", positions_basis.ravel())

for k in K_STEPS:
    name = f"SK_Step{k}"
    obj.shape_key_add(name=name, from_mix=False)
    sk = obj.data.shape_keys.key_blocks[name]
    z_k   = (np.sqrt(d_sq[k]) / d_max * HEIGHT_SCALE).astype(np.float32)
    pos_k = np.column_stack([x_phys, y_phys, z_k]).astype(np.float32)
    sk.data.foreach_set("co", pos_k.ravel())

# ─────────────────────── unstable manifold curve ─────────────────────────────
# The unstable eigenvector of M is (1, 1/φ); the manifold through origin wraps
# densely on T². Draw it as a point cloud slightly above the disc.
M_PTS = 1200
LIFT  = 0.004   # metres above z=0 so it is visible
t_arr = np.linspace(0.0, 1.0, M_PTS, endpoint=False)
um_u  = t_arr % 1.0
um_v  = (t_arr / PHI) % 1.0
um_x  = (um_u - 0.5) * PHYS_SIZE
um_y  = (um_v - 0.5) * PHYS_SIZE
um_z  = np.full(M_PTS, LIFT, dtype=np.float32)

um_mesh = bpy.data.meshes.new(f"{SLUG}_unstable_mfd")
um_obj  = bpy.data.objects.new(f"{SLUG}_unstable_mfd", um_mesh)
bpy.context.collection.objects.link(um_obj)

bm2 = bmesh.new()
um_verts = [bm2.verts.new((um_x[i], um_y[i], float(um_z[i]))) for i in range(M_PTS)]
bm2.verts.ensure_lookup_table()
for i in range(M_PTS - 1):
    bm2.edges.new([um_verts[i], um_verts[i + 1]])
bm2.to_mesh(um_mesh)
bm2.free()

# amber emission material for the manifold
mat_um = bpy.data.materials.new("CatMap_Unstable_Mfd")
mat_um.use_nodes = True
nodes = mat_um.node_tree.nodes
nodes.clear()
em = nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value  = (*COL_AMBER[:3], 1.0)
em.inputs["Strength"].default_value = 2.0
out = nodes.new("ShaderNodeOutputMaterial")
mat_um.node_tree.links.new(em.outputs["Emission"], out.inputs["Surface"])
um_obj.data.materials.append(mat_um)

# ─────────────────────── holoflow metadata & export ──────────────────────────
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-disc"
obj["holoflow:licence"]  = "CC0"
obj["holoflow:topic"]    = "arnolds-cat-map"

# orient +Y up for WebXR
import math
obj.rotation_euler    = (math.pi / 2, 0.0, 0.0)
um_obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

import os
glb_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                        "glbs", "scripting",
                        "python-numpy-arnolds-cat-map-anosov-diffeomorphism-golden-ratio-torus-chaos-poi-disc-webxr",
                        f"{SLUG}.glb")
os.makedirs(os.path.dirname(glb_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath                             = glb_path,
    use_selection                        = True,
    export_format                        = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_colors                        = True,
    export_morph                         = True,
    export_morph_normal                  = False,
    export_image_format                  = "WEBP",
)
print(f"[arnold-cat-map] GLB → {glb_path}")
