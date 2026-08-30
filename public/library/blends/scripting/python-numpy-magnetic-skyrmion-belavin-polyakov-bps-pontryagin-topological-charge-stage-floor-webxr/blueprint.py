"""
Magnetic Skyrmion — Belavin-Polyakov BPS Topological Soliton
Blender 5.1  |  bpy direct-data API  |  NumPy vectorised
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The O(3) / CP¹ sigma model places a unit 3-vector n(x,y) ∈ S² on the
2-D plane.  Configurations that differ in how n wraps around S² cannot be
continuously deformed into each other — this is the content of π₂(S²) = ℤ.
The integer topological charge (Pontryagin / Hopf index) is:

    Q = (1/4π) ∫ n · (∂_x n × ∂_y n) dx dy ∈ ℤ

Belavin & Polyakov (1975) found the energy lower bound E ≥ 4π|Q|J and the
exact configurations that saturate it (BPS / self-dual solutions):

    f(r) = 2·arctan( (λ/r)^m )       m ∈ ℤ≠0, λ > 0  (size parameter)
    n = ( sin f·cos(mθ+γ),  sin f·sin(mθ+γ),  cos f )

    n_z = cos f = ( r^{2m} − λ^{2m} ) / ( r^{2m} + λ^{2m} )

Pontryagin density (Q per unit area):
    ρ(r) = m·f′·sin f / (4π r) = −m²·λ^{2m}·r^{2m−2} / (π·(r^{2m}+λ^{2m})²)

Stage floor: z = n_z(x,y)·Z_SCALE.  At r=0 the skyrmion core has n_z=−1
(pointing down into the floor); the background far from the core has n_z→+1.
Vertex colour Skyrmion_Nz maps cobalt (n_z=−1, core) → amber (n_z=+1, edge).

Shape keys explore the BPS family:
  Basis    m=1  λ=0.50 m  Q=1  Bloch skyrmion
  SK_Q2    m=2  λ=0.50 m  Q=2  two-skyrmion (steeper walls, double winding)
  SK_Anti  m=1  λ=0.50 m  Q=−1 antiskyrmion (n_z flipped, core points up)
  SK_Large m=1  λ=1.00 m  Q=1  dilated skyrmion — same topology, wider profile

Sources
-------
Belavin AA & Polyakov AM (1975) JETP Lett 22(10):503–506 — PD
Skyrme THR (1961) Proc Roy Soc A 260:127–138 — PD
"""

import bpy
import numpy as np

# ─── parameters ───────────────────────────────────────────────────────────────
OBJ_NAME   = "skyrmion_floor"
NX = NY    = 120                 # grid resolution (even → no r=0 grid point)
DOMAIN     = 2.5                 # m — half-size of stage floor
LAM_BASIS  = 0.50                # m — skyrmion size, Basis & SK_Q2 & SK_Anti
LAM_LARGE  = 1.00                # m — dilated skyrmion, SK_Large
Z_SCALE    = 0.40                # m — vertical amplitude (n_z range ±1 → ±Z_SCALE)
COBALT     = (0.03, 0.15, 0.58, 1.0)   # core colour (n_z = −1)
AMBER      = (1.00, 0.65, 0.00, 1.0)   # edge colour (n_z = +1)

# ─── 2-D grid ─────────────────────────────────────────────────────────────────
xs = np.linspace(-DOMAIN, DOMAIN, NX)
ys = np.linspace(-DOMAIN, DOMAIN, NY)
XX, YY = np.meshgrid(xs, ys, indexing="ij")   # (NX, NY) each
RR      = np.sqrt(XX**2 + YY**2)               # radial distance at each vertex

# ─── BPS physics ──────────────────────────────────────────────────────────────
def nz_bps(r, lam, m_abs):
    """Exact n_z for the Belavin-Polyakov BPS skyrmion.

    Uses identity: cos(2·arctan(u)) = (1−u²)/(1+u²)  with u = (λ/r)^m_abs.

    Returns values in (−1, +1):  −1 at r→0 (core down), +1 at r→∞ (vacuum up).
    """
    r_s = np.maximum(r, 1e-9)
    u   = (lam / r_s) ** (2 * m_abs)   # (λ/r)^{2m}, → ∞ at centre, → 0 at edge
    return (1.0 - u) / (1.0 + u)


def pontryagin_density(r, lam, m_abs):
    """Topological charge density ρ(r) for the BPS solution (always ≤ 0).

    ρ = −m²·λ^{2m}·r^{2m−2} / (π·(r^{2m}+λ^{2m})²)

    Integrate over 2-D plane: ∫ρ·2πr dr = −m (i.e. Q = −m for m_abs = m).
    """
    r_s   = np.maximum(r, 1e-9)
    lm2   = lam ** (2 * m_abs)
    rm2   = r_s ** (2 * m_abs)
    r_fac = r_s ** max(2 * m_abs - 2, 0)   # r^{2m−2}; avoid 1/r² at m=1→r^0=1
    return -(m_abs ** 2) * lm2 * r_fac / (np.pi * (rm2 + lm2) ** 2)


# ─── mesh builder ─────────────────────────────────────────────────────────────
def make_floor_mesh(name, nz_vals):
    """Convert n_z height field to a quad-grid Blender mesh (NX×NY vertices)."""
    verts = np.column_stack([XX.ravel(), YY.ravel(), nz_vals.ravel() * Z_SCALE])

    # Vectorised face indices: avoid nested Python loop (14161 quads)
    i = np.arange(NX - 1)
    j = np.arange(NY - 1)
    II, JJ = np.meshgrid(i, j, indexing="ij")
    II = II.ravel(); JJ = JJ.ravel()
    a = II * NY + JJ
    b = (II + 1) * NY + JJ
    c = (II + 1) * NY + (JJ + 1)
    d = II * NY + (JJ + 1)
    faces = np.column_stack([a, b, c, d])

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces.tolist())
    me.update()
    return me


# ─── vertex colour helper ─────────────────────────────────────────────────────
def apply_nz_colour(me, nz_vals, attr_name="Skyrmion_Nz"):
    """Encode n_z as FLOAT_COLOR attribute (per-vertex, cobalt→amber)."""
    t  = np.clip((nz_vals.ravel() + 1.0) / 2.0, 0.0, 1.0)  # n_z∈[−1,1] → [0,1]
    co = np.array(COBALT[:3])
    am = np.array(AMBER[:3])
    rgb = t[:, None] * am[None, :] + (1.0 - t[:, None]) * co[None, :]
    rgba = np.column_stack([rgb, np.ones(len(t))]).ravel()

    attr = me.color_attributes.new(attr_name, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", rgba)


# ─── shape-key helper ─────────────────────────────────────────────────────────
def add_shape_key(ob, key_name, nz_vals):
    """Add a named shape key with positions from the given n_z field."""
    sk = ob.shape_key_add(name=key_name, from_mix=False)
    verts_new = np.column_stack([XX.ravel(), YY.ravel(), nz_vals.ravel() * Z_SCALE])
    sk.data.foreach_set("co", verts_new.ravel())


# ─── material ─────────────────────────────────────────────────────────────────
def make_material(ob):
    """Emission + Principled BSDF driven by the Skyrmion_Nz colour attribute."""
    mat = bpy.data.materials.new("Skyrmion_Mat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    attr  = tree.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Skyrmion_Nz"
    attr.attribute_type = "GEOMETRY"

    bsdf  = tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value  = 0.55
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Emission Strength"].default_value = 2.0

    out   = tree.nodes.new("ShaderNodeOutputMaterial")

    links = tree.links
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ─── main ──────────────────────────────────────────────────────────────────────
# Compute the four n_z fields
nz_basis = nz_bps(RR, LAM_BASIS, 1)             # Q=1 skyrmion
nz_q2    = nz_bps(RR, LAM_BASIS, 2)             # Q=2 two-skyrmion
nz_anti  = -nz_basis                            # Q=−1 antiskyrmion (n_z flipped)
nz_large = nz_bps(RR, LAM_LARGE, 1)             # Q=1, λ×2

# Build Basis mesh and object
for old in bpy.data.objects:
    if old.name.startswith(OBJ_NAME):
        bpy.data.objects.remove(old, do_unlink=True)

me = make_floor_mesh(OBJ_NAME, nz_basis)
ob = bpy.data.objects.new(OBJ_NAME, me)
bpy.context.scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)

# holoflow metadata
ob["holoflow:facet"]       = False
ob["holoflow:category"]    = "stage-floor"
ob["holoflow:export_name"] = OBJ_NAME

# Vertex colour on Basis
apply_nz_colour(me, nz_basis)

# Shape keys (Basis must be first)
ob.shape_key_add(name="Basis", from_mix=False)
add_shape_key(ob, "SK_Q2",    nz_q2)
add_shape_key(ob, "SK_Anti",  nz_anti)
add_shape_key(ob, "SK_Large", nz_large)

make_material(ob)

# +Y up: rotate −90° about X so Blender +Z → WebXR +Y
import math
ob.rotation_euler = (-math.pi / 2, 0.0, 0.0)
bpy.ops.object.transform_apply(rotation=True)

print("Skyrmion stage floor built.")
print(f"  Vertices : {len(me.vertices):,}")
print(f"  Quads    : {len(me.polygons):,}")
print(f"  Shape keys: {[k.name for k in ob.data.shape_keys.key_blocks]}")

# ─── GLB export ───────────────────────────────────────────────────────────────
import os
out_path = os.path.join(
    os.path.dirname(bpy.data.filepath) or "/tmp",
    OBJ_NAME + ".glb",
)
bpy.ops.export_scene.gltf(
    filepath        = out_path,
    export_format   = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_morph    = True,
    export_colors   = True,
    export_yup      = True,
    use_selection   = False,
)
print(f"GLB saved → {out_path}")
