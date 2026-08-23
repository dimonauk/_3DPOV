"""
Gray-Scott Reaction-Diffusion / Turing Patterns — Blender 5.1 Blueprint
======================================================================
Produces a flat poi disc (80×80 quad grid, ±0.20 m) whose height and
vertex colour are driven by V (inhibitor) concentration from the Gray-Scott
two-variable reaction-diffusion model:

  dU/dt = D_u · ∇²U  −  U·V²  +  F·(1 − U)
  dV/dt = D_v · ∇²V  +  U·V²  −  (F+k)·V

Turing instability (Turing 1952) arises when D_u >> D_v. The ratio
D_u / D_v = 2 is the classic Gray-Scott choice. Four shape keys explore
Pearson (1993) parameter classes: spots, stripes, labyrinthine, solitons.

Outside sources:
  · Alan M. Turing (1952) Proc R Soc B 237:37-72. Public Domain.
  · J.E. Pearson (1993) Science 261(5118):189-192. Equations PD.
  · NumPy Developers, BSD-3-Clause, https://numpy.org
"""
import bpy, bmesh, numpy as np, math

# ── Named constants ─────────────────────────────────────────────────────────
N            = 80        # grid resolution (N×N vertices, (N-1)² quads)
PHYS_SIZE    = 0.20      # half-extent in metres → disc is 0.40 m wide
HEIGHT_SCALE = 0.018     # max z-displacement (V=1.0 → z = 18 mm)
D_U          = 0.160     # activator (U) diffusion coefficient
D_V          = 0.080     # inhibitor (V) diffusion coeff  (D_U / D_V = 2)
N_STEPS      = 3000      # integration steps per simulation run
DT           = 1.0       # Gray-Scott time units per step
SEED         = 42        # RNG seed for reproducible seeding pattern
POI_NAME     = "HF_GrayScott_RD_Poi"

# Pearson (1993) parameter classes — (feed rate F, kill rate k)
PARAM_SETS = {
    "Basis":        (0.055, 0.062),  # leopard spots  (Pearson α)
    "SK_Stripes":   (0.060, 0.045),  # zebra stripes  (Pearson γ)
    "SK_Labyrinth": (0.062, 0.061),  # labyrinthine   (Pearson ε)
    "SK_Solitons":  (0.025, 0.060),  # isolated spots (Pearson μ-ish)
}

COL_LOW  = (0.02, 0.12, 0.70)   # cobalt  — inhibitor-rich (V→1, spot core)
COL_HIGH = (0.92, 0.58, 0.06)   # amber   — substrate-rich (V→0, background)


# ── Gray-Scott integrator ───────────────────────────────────────────────────
def run_gray_scott(F: float, k: float):
    """
    Periodic finite-difference integration on an N×N torus.

    WHY np.roll for Laplacian: cleanest periodic BC in pure NumPy; avoids
    scipy.ndimage so the script has zero non-stdlib imports beyond numpy/bpy.
    Five-point stencil: lap_U = U[i+1,j]+U[i-1,j]+U[i,j+1]+U[i,j-1]-4U[i,j]

    Seed: 20×20 random patch centred on grid (WHY: symmetry-breaking needed;
    pure uniform IC gives only uniform steady-state, no Turing modes excite).
    """
    rng = np.random.default_rng(SEED)
    U = np.ones( (N, N), dtype=np.float64)
    V = np.zeros((N, N), dtype=np.float64)
    c, h = N // 2, 10
    V[c-h:c+h, c-h:c+h] = rng.uniform(0.0, 1.0, (2*h, 2*h))
    U[c-h:c+h, c-h:c+h] = 1.0 - V[c-h:c+h, c-h:c+h]

    for _ in range(N_STEPS):
        lU = (np.roll(U, 1, 0) + np.roll(U, -1, 0)
            + np.roll(U, 1, 1) + np.roll(U, -1, 1) - 4.0 * U)
        lV = (np.roll(V, 1, 0) + np.roll(V, -1, 0)
            + np.roll(V, 1, 1) + np.roll(V, -1, 1) - 4.0 * V)
        UVV   = U * V * V
        U_new = U + DT * (D_U * lU - UVV + F * (1.0 - U))
        V_new = V + DT * (D_V * lV + UVV - (F + k) * V)
        U, V  = U_new.clip(0.0, 1.0), V_new.clip(0.0, 1.0)
    return U, V   # (N,N) each


# ── Grid coordinates ────────────────────────────────────────────────────────
xs = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
ys = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
GX, GY = np.meshgrid(xs, ys, indexing='ij')  # (N,N) spatial coords

def _verts(V_field):
    z = V_field.ravel() * HEIGHT_SCALE
    return list(zip(GX.ravel().tolist(), GY.ravel().tolist(), z.tolist()))

def _faces():
    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            a = i * N + j
            faces.append((a, a+1, a+N+1, a+N))
    return faces


# ── Run Basis simulation, build mesh ───────────────────────────────────────
U_basis, V_basis = run_gray_scott(*PARAM_SETS["Basis"])

me = bpy.data.meshes.new(POI_NAME)
ob = bpy.data.objects.new(POI_NAME, me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

me.from_pydata(_verts(V_basis), [], _faces())
me.update()

# WHY shade_flat: studio holoflow:facet=True convention; faceted look on an RD
# height-field expresses the discrete nature of the finite-difference model.
for p in me.polygons:
    p.use_smooth = False


# ── Shape keys for four parameter classes ───────────────────────────────────
ob.shape_key_add(name="Basis", from_mix=False)

for sk_name, (F, k) in PARAM_SETS.items():
    if sk_name == "Basis":
        continue
    _, V_sk = run_gray_scott(F, k)
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    coords = np.empty(len(me.vertices) * 3, dtype=np.float32)
    coords[0::3] = GX.ravel()
    coords[1::3] = GY.ravel()
    coords[2::3] = V_sk.ravel() * HEIGHT_SCALE
    sk.data.foreach_set("co", coords)
    # WHY foreach_set: bulk-writes avoid Python per-vertex loop overhead;
    # shape-key .data.co is float32 in Blender's internal representation.


# ── Vertex colour: V-concentration → cobalt (spot core) / amber (bg) ────────
col_attr = me.color_attributes.new(
    name="RD_Concentration",
    type="FLOAT_COLOR",    # HDR-ready; matches holoflow exporter export_colors
    domain="POINT",
)
v_flat = V_basis.ravel().astype(np.float32)
cols = np.ones(len(me.vertices) * 4, dtype=np.float32)  # alpha channel =1
for ch, (lo, hi) in enumerate(zip(COL_LOW, COL_HIGH)):
    cols[ch::4] = lo + v_flat * (hi - lo)
col_attr.data.foreach_set("color", cols)


# ── Material ─────────────────────────────────────────────────────────────────
mat  = bpy.data.materials.new("RD_Mat")
mat.use_nodes         = True
mat.use_backface_culling = False
nt   = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
attr = nt.nodes.new("ShaderNodeAttribute")
attr.attribute_name  = "RD_Concentration"
attr.attribute_type  = "GEOMETRY"
nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Metallic"].default_value          = 0.52
bsdf.inputs["Roughness"].default_value         = 0.20
bsdf.inputs["Emission Strength"].default_value = 0.28
nt.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
ob.data.materials.append(mat)


# ── Holoflow metadata ─────────────────────────────────────────────────────────
ob["holoflow:facet"]      = True
ob["holoflow:category"]   = "poi-disc"
ob["holoflow:surface"]    = "gray-scott-rd"
ob["holoflow:space_group"]= "none (RD pattern, not crystallographic)"


# ── +Y-up convention, apply transform, export GLB ────────────────────────────
ob.rotation_euler = (math.pi / 2, 0.0, 0.0)
bpy.ops.object.transform_apply(rotation=True)

bpy.ops.export_scene.gltf(
    filepath           = "//hf_gray_scott_poi.glb",
    export_format      = "GLB",
    export_yup         = True,
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format = "WEBP",
    export_colors      = True,
    export_morph       = True,
    use_selection      = True,
)

print(f"✓ Gray-Scott RD poi exported → hf_gray_scott_poi.glb")
print(f"  Vertices: {len(me.vertices)}  Faces: {len(me.polygons)}")
print(f"  Shape keys: {[k.name for k in ob.data.shape_keys.key_blocks]}")
