"""
Chirikov–Taylor Standard Map — Poincaré Section Stage Floor, Blender 5.1
=========================================================================
The standard map (Chirikov 1969 / Taylor 1969) is the canonical area-preserving
diffeomorphism of the 2-torus T² = [0,2π)²:

    p_{n+1} = p_n + K·sin(θ_n)   (mod 2π)
    θ_{n+1} = θ_n + p_{n+1}       (mod 2π)

K is the stochasticity parameter. At K=0 the map is integrable: every orbit lies
on the horizontal line p = const (action conserved). For 0 < K < K_c ≈ 0.9716
Kolmogorov–Arnold–Moser (KAM) theory guarantees that sufficiently irrational
invariant tori survive — visible as horizontal ridges of high orbit density.
At K_c Greene's residue criterion (1979) identifies the critical torus with golden-
mean winding number (√5−1)/2 as the last KAM torus; it breaks into a Cantorus
(MacKay–Mather theory), opening the chaotic sea to global transport. Above K_c
accelerator modes arise — anomalous diffusion in action.

GEOMETRY
A GRID×GRID vertex lattice (θ,p) covers T² on a flat FLOOR_SIZE×FLOOR_SIZE slab.
N_TRAJ orbits are run for N_ITER steps; hit counts accumulate in a 2D histogram.
log(1+count) is normalised to [0,1] and mapped to vertex height z = norm × H_SCALE.
Five shape keys record five K values so the viewer can morph through the
integrable→chaotic transition.

Vertex colour: AMBER where density is high (KAM ridges / island chains),
COBALT where density is low (chaotic sea, uniform background).
"""

import bpy
import bmesh
import numpy as np

# ─── NAMED CONSTANTS ────────────────────────────────────────────────────────
SLUG      = "hf_chirikov_floor"
OBJ_NAME  = "Chirikov_Standard_Map_Floor"
MAT_NAME  = "Chirikov_Mat"
ATTR_NAME = "Chirikov_Density"

GRID      = 96          # histogram resolution (GRID×GRID cells)
N_TRAJ    = 180         # independent starting points (stratified over T²)
N_ITER    = 3500        # map iterations per trajectory

FLOOR_SIZE = 4.0        # world-space extent (m) per axis
H_SCALE    = 0.35       # height at maximum density bin (m)

# Five K values: (shape-key name, stochasticity parameter)
K_LEVELS = [
    ("Basis",          0.9716),   # Greene's threshold — last KAM torus
    ("SK_Integrable",  0.00  ),   # fully integrable — horizontal lines only
    ("SK_Partial",     0.50  ),   # KAM tori intact, small island chains
    ("SK_Chaotic",     2.00  ),   # chaotic sea dominates; small residual islands
    ("SK_Wild",        5.00  ),   # accelerator modes; stochastic web prominent
]

COL_AMBER  = (0.90, 0.58, 0.07, 1.0)   # high-density ridges
COL_COBALT = (0.05, 0.14, 0.68, 1.0)   # low-density sea
TAU        = 2.0 * np.pi


# ─── SIMULATION ─────────────────────────────────────────────────────────────
def simulate(K: float) -> np.ndarray:
    """
    Vectorised Chirikov–Taylor map over N_TRAJ initial conditions.
    WHY vectorise: N_TRAJ=180 orbits × N_ITER=3500 steps = 630 000 map
    evaluations; numpy broadcasting reduces this to ~3500 Python iterations
    each operating on an array of 180 floats — orders of magnitude faster
    than a pure Python loop.
    Stratified initialisation places one trajectory per cell of a
    sqrt(N_TRAJ)×sqrt(N_TRAJ) grid on T²; this ensures phase-space coverage
    even at low N_TRAJ where random sampling would leave gaps.
    """
    n_side = int(np.sqrt(N_TRAJ))
    lin = np.linspace(0, TAU, n_side, endpoint=False)
    # Outer product → (n_side², 2) starting points covering T²
    PP, TT = np.meshgrid(lin, lin)
    p  = PP.ravel()[:N_TRAJ].copy()
    th = TT.ravel()[:N_TRAJ].copy()

    hist = np.zeros((GRID, GRID), dtype=np.int64)

    for _ in range(N_ITER):
        p  = (p  + K * np.sin(th)) % TAU
        th = (th + p             ) % TAU
        # Row index ↔ p, column index ↔ θ
        ri = (p  / TAU * GRID).astype(np.int32).clip(0, GRID - 1)
        ci = (th / TAU * GRID).astype(np.int32).clip(0, GRID - 1)
        np.add.at(hist, (ri, ci), 1)

    return hist


def log_norm(hist: np.ndarray) -> np.ndarray:
    """log(1+count) normalised to [0,1]. Compresses the dynamic range so that
    sparse chaotic regions and dense KAM ridges are both visible."""
    h = np.log1p(hist.astype(np.float64))
    denom = h.max()
    return (h / denom) if denom > 0 else h


# ─── SCENE SETUP ────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# ─── RUN SIMULATIONS ────────────────────────────────────────────────────────
histograms = {}
for sk_name, K_val in K_LEVELS:
    histograms[sk_name] = log_norm(simulate(K_val))

basis_norm = histograms["Basis"]   # K_c ≈ 0.9716 is the reference shape

# ─── MESH GRID ──────────────────────────────────────────────────────────────
half = FLOOR_SIZE / 2.0
x_lin = np.linspace(-half, half, GRID, dtype=np.float64)   # θ axis
y_lin = np.linspace(-half, half, GRID, dtype=np.float64)   # p axis
XX, YY = np.meshgrid(x_lin, y_lin, indexing="xy")          # (GRID,GRID)

# Basis vertex positions
verts_xyz = np.column_stack(
    [XX.ravel(), YY.ravel(), (basis_norm * H_SCALE).ravel()]
)

# Quad faces: (GRID-1)² quads
r_idx = np.arange(GRID - 1)
c_idx = np.arange(GRID - 1)
RR, CC = np.meshgrid(r_idx, c_idx, indexing="ij")
v0    = (RR * GRID + CC).ravel()
faces = np.column_stack([v0, v0 + 1, v0 + GRID + 1, v0 + GRID])

# Create Blender mesh via data API (no bpy.ops — avoids context dependency)
me = bpy.data.meshes.new(SLUG)
me.from_pydata(verts_xyz.tolist(), [], faces.tolist())
me.update()

obj = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ─── SHAPE KEYS ─────────────────────────────────────────────────────────────
obj.shape_key_add(name="Basis", from_mix=False)

for sk_name, _ in K_LEVELS[1:]:
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    norm = histograms[sk_name]
    z_vals = (norm * H_SCALE).ravel()
    # foreach_set is ~10× faster than per-element assignment
    coords = np.column_stack(
        [XX.ravel(), YY.ravel(), z_vals]
    ).ravel().tolist()
    sk.data.foreach_set("co", coords)

# ─── VERTEX COLOUR ──────────────────────────────────────────────────────────
# CORNER domain: one colour per face-corner (= 4 per quad)
attr = me.attributes.new(name=ATTR_NAME, type="FLOAT_COLOR", domain="CORNER")
n_quads = (GRID - 1) ** 2

# Per-quad density: average the four corner values from basis_norm
r0 = (RR).ravel();  c0 = (CC).ravel()
d00 = basis_norm[r0,   c0  ]
d01 = basis_norm[r0,   c0+1]
d10 = basis_norm[r0+1, c0  ]
d11 = basis_norm[r0+1, c0+1]
t = ((d00 + d01 + d10 + d11) / 4.0)        # (n_quads,)

flat = np.empty(n_quads * 4 * 4, dtype=np.float32)
for ch in range(4):
    lo = float(COL_COBALT[ch]);  hi = float(COL_AMBER[ch])
    c_per_quad = lo + t * (hi - lo)         # (n_quads,)
    c_repeated = np.repeat(c_per_quad, 4)   # (n_quads*4,) — 4 corners each
    flat[ch::4] = c_repeated.astype(np.float32)
attr.data.foreach_set("color", flat.tolist())

# ─── MATERIAL ───────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name=MAT_NAME)
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
attr_node = nt.nodes.new("ShaderNodeAttribute")
attr_node.attribute_name = ATTR_NAME

bsdf.inputs["Roughness"].default_value    = 0.35
bsdf.inputs["Metallic"].default_value     = 0.40
nt.links.new(attr_node.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],      out.inputs["Surface"])

out.location      = (400, 0)
bsdf.location     = (0,   0)
attr_node.location= (-300, 0)

obj.data.materials.append(mat)

# ─── HOLOFLOW METADATA ──────────────────────────────────────────────────────
obj["holoflow:facet"]    = False          # smooth landscape, not faceted
obj["holoflow:category"] = "stage-floor"
obj["holoflow:topic"]    = "standard-map"

# ─── APPLY TRANSFORMS & EXPORT ──────────────────────────────────────────────
import os
obj.rotation_euler = (0.0, 0.0, 0.0)    # +Y up — flat floor, no rotation needed
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

out_dir = os.path.join(
    bpy.path.abspath("//"),
    "public", "library", "glbs", "scripting",
    "python-numpy-chirikov-standard-map-kam-tori-stochasticity-threshold-poincare-stage-floor-webxr"
)
os.makedirs(out_dir, exist_ok=True)
glb_path = os.path.join(out_dir, "hf_chirikov_floor.glb")

bpy.ops.export_scene.gltf(
    filepath          = glb_path,
    export_format     = "GLB",
    use_selection     = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    export_colors                        = True,
    export_morph                         = True,
    export_morph_normal                  = False,
)

bpy.ops.wm.save_as_mainfile(
    filepath=os.path.join(out_dir, "hf_chirikov_floor.blend")
)

print(f"[holoflow] exported → {glb_path}")
