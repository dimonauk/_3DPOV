"""
Abelian Sandpile Model — Bak, Tang & Wiesenfeld (1987) Self-Organised Criticality
Blender 5.1  |  bpy direct-data API  |  no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each cell of an N×N grid holds non-negative integer chips. Toppling rule:

    G[i,j] ≥ 4  →  G[i,j] -= 4
                    each cardinal neighbour gains 1 chip
                    chips leaving the grid boundary are permanently lost

The "Abelian" property (Dhar 1990, Phys Rev Lett 64:1613): any sequence of
toppling unstable cells reaches the same final stable configuration — order
of toppling does not matter. Parallel (synchronous) toppling per numpy round
therefore gives the canonical stable state.

When n chips are added to the centre cell of an N×N grid with absorbing
boundary, the stable pile forms a quasi-fractal disc with:
  • exact D₄ (4-fold square) symmetry
  • boundary Hausdorff dimension d_H ≈ 1.7845
  • mean chip density ρ ≈ 2.125 chips/cell → radius R ≈ √(n / πρ)
  • avalanche size distribution P(s) ∝ s^{−τ}, τ ≈ 1.21 in 2D

Levine & Peres (2010) proved the rescaled pile converges to a deterministic
limit shape — a disc with intricate quasi-periodic internal domain structure.

Sources:
  Bak P, Tang C, Wiesenfeld K (1987) Phys Rev Lett 59(4):381.  Equations PD.
  Dhar D (1990) Phys Rev Lett 64(14):1613.  Equations PD.
"""

import bpy
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────
N          = 101          # grid side; odd → exact centre at (50, 50)
CX = CY    = N // 2       # = 50: centre cell index
CELL_SIZE  = 0.07         # metres per cell → mesh ≈ 7.07 m × 7.07 m
HEIGHT_SCL = 0.35         # z for 3 chips (max stable)  metres
BATCH      = 200          # chips added per stabilisation call (fast convergence)
RING_OFF   = 20           # off-centre seed distance for SK_Cross
OBJ_NAME   = "Sandpile_SOC"
ATTR_NAME  = "Sandpile_Chips"

N_BASIS   = 12_000        # → R ≈ 42 cells; canonical diamond fractal
N_SPARSE  =  3_000        # → R ≈ 21 cells; small, intricate early pattern
N_DENSE   = 25_000        # → R ≈ 61 cells; exceeds grid half → finite-size cutoff
N_CROSS   =  1_500        # chips per seed (4 seeds); overlapping cross-pattern

# Chip-count → RGBA colour  (cobalt 0 → sky-blue 1 → warm-amber 2 → amber 3)
COLOR_MAP = np.array([
    [0.00, 0.38, 0.74, 1.0],
    [0.25, 0.62, 0.85, 1.0],
    [0.85, 0.55, 0.10, 1.0],
    [1.00, 0.65, 0.00, 1.0],
], dtype=np.float32)


# ── CHIP-FIRING ────────────────────────────────────────────────────────────
def stabilise(G: np.ndarray) -> np.ndarray:
    """
    Parallel (synchronous) toppling: every cell with ≥ 4 chips fires once
    per round; repeat until the entire grid is stable (< 4 everywhere).

    Boundary = absorbing sink.  The Abelian property (Dhar 1990) guarantees
    this produces the canonical stable state for any toppling order.

    Why single-fire-per-round?  Firing each cell exactly once per round gives
    the correct canonical BTW state.  "Batch" firing (k times per round) is
    faster but produces a different chip distribution for large initial piles.
    """
    G = G.copy().astype(np.int64)
    while True:
        mask = G >= 4
        if not mask.any():
            break
        f = mask.astype(np.int64)    # 0 or 1 per cell per round
        G -= 4 * f
        G[:-1, :] += f[1:,  :]      # receive from cell below  (i+1→i)
        G[1:,  :] += f[:-1, :]      # receive from cell above  (i-1→i)
        G[:, :-1] += f[:,  1:]      # receive from cell right  (j+1→j)
        G[:,  1:] += f[:, :-1]      # receive from cell left   (j-1→j)
    return G


def make_pile(n_total: int, seeds: list) -> np.ndarray:
    """
    Add n_total chips in BATCH increments to the given seed cells, stabilising
    after each batch.  Incremental addition confines each disturbance to the
    active pile edge, keeping rounds-per-batch ≈ R rather than ≈ n.
    """
    G = np.zeros((N, N), dtype=np.int64)
    for start in range(0, n_total, BATCH):
        n_here = min(BATCH, n_total - start)
        share, rem = divmod(n_here, len(seeds))
        for k, (r, c) in enumerate(seeds):
            G[r, c] += share + (rem if k == 0 else 0)
        G = stabilise(G)
    return G


# ── COMPUTE FOUR CONFIGURATIONS ───────────────────────────────────────────
print("Sandpile SOC — Basis (12 000 chips)…")
G_basis  = make_pile(N_BASIS,  [(CX, CY)])
print("Sandpile SOC — SK_Sparse (3 000 chips)…")
G_sparse = make_pile(N_SPARSE, [(CX, CY)])
print("Sandpile SOC — SK_Dense (25 000 chips, finite-size cutoff)…")
G_dense  = make_pile(N_DENSE,  [(CX, CY)])
print("Sandpile SOC — SK_Cross (4 × 1 500 chips, overlapping piles)…")
G_cross  = make_pile(
    N_CROSS * 4,
    [(CX - RING_OFF, CY), (CX + RING_OFF, CY),
     (CX, CY - RING_OFF), (CX, CY + RING_OFF)],
)


# ── MESH ──────────────────────────────────────────────────────────────────
jj, ii = np.meshgrid(np.arange(N, dtype=np.float64),
                      np.arange(N, dtype=np.float64))
x_flat = (jj.ravel() - CX) * CELL_SIZE
y_flat = (ii.ravel() - CY) * CELL_SIZE
z_flat = G_basis.ravel() / 3.0 * HEIGHT_SCL

verts = list(zip(x_flat.tolist(), y_flat.tolist(), z_flat.tolist()))

ii_f, jj_f = np.meshgrid(np.arange(N - 1), np.arange(N - 1), indexing='ij')
ii_f, jj_f = ii_f.ravel(), jj_f.ravel()
v00 = ii_f * N + jj_f
v01 = ii_f * N + (jj_f + 1)
v11 = (ii_f + 1) * N + (jj_f + 1)
v10 = (ii_f + 1) * N + jj_f
faces = list(zip(v00.tolist(), v01.tolist(), v11.tolist(), v10.tolist()))

# ── SCENE SETUP ───────────────────────────────────────────────────────────
for obj in [o for o in bpy.data.objects if o.name.startswith(OBJ_NAME)]:
    bpy.data.objects.remove(obj, do_unlink=True)
for me in [m for m in bpy.data.meshes if m.name.startswith(OBJ_NAME)]:
    bpy.data.meshes.remove(me)

mesh = bpy.data.meshes.new(OBJ_NAME)
mesh.from_pydata(verts, [], faces)
mesh.update()

ob = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(ob)

# ── VERTEX COLOUR ATTRIBUTE ───────────────────────────────────────────────
attr = mesh.color_attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
col_arr = COLOR_MAP[G_basis.ravel()].ravel()
attr.data.foreach_set("color", col_arr.tolist())

# ── SHAPE KEYS ────────────────────────────────────────────────────────────
def add_sk(ob, name: str, G: np.ndarray) -> None:
    """Add a shape key using foreach_set for speed (avoids per-vertex Python loop)."""
    sk = ob.shape_key_add(name=name, from_mix=False)
    z_sk = G.ravel() / 3.0 * HEIGHT_SCL
    co = np.column_stack([x_flat, y_flat, z_sk]).ravel()
    sk.data.foreach_set("co", co.tolist())


ob.shape_key_add(name="Basis", from_mix=False)
add_sk(ob, "SK_Sparse", G_sparse)
add_sk(ob, "SK_Dense",  G_dense)
add_sk(ob, "SK_Cross",  G_cross)

# ── MATERIAL ──────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(OBJ_NAME + "_Mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out  = nt.nodes.new("ShaderNodeOutputMaterial")
emit = nt.nodes.new("ShaderNodeEmission")
atr  = nt.nodes.new("ShaderNodeAttribute")
atr.attribute_name         = ATTR_NAME
emit.inputs["Strength"].default_value = 1.8
nt.links.new(atr.outputs["Color"],    emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
ob.data.materials.append(mat)

# ── EXPORT TRANSFORM (+Y up) ──────────────────────────────────────────────
import math
ob.rotation_euler = (math.pi / 2, 0.0, 0.0)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.transform_apply(rotation=True)

ob["holoflow:facet"]    = False
ob["holoflow:category"] = "stage-floor"
ob["holoflow:topic"]    = "abelian-sandpile-soc"

nv, nf = len(mesh.vertices), len(mesh.polygons)
print(f"Done — {nv} vertices, {nf} faces, 4 shape keys (Basis / SK_Sparse / SK_Dense / SK_Cross).")
