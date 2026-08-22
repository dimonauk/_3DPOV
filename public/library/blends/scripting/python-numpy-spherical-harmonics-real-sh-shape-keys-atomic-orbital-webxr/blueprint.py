"""
blueprint.py — Real Spherical Harmonics: Orbital Shape Keys for WebXR
Blender 5.1 — Holoflow Studio — CC0

Real spherical harmonics Y_l^m(θ, φ) form a complete orthonormal basis for
square-integrable functions on S².  Evaluating them on an ico-sphere's vertex
angular positions and displacing each vertex radially by DISPLACE * Y_l^m
yields the classic atomic-orbital lobed shapes (p_z, d_z², d_x²-y², f_z³…).
Each mode is stored as a Blender shape key so the user can blend between
orbital geometries interactively and the GLB exports all morph targets for
WebXR animation.

The associated Legendre polynomials are computed via the Bonnet recurrence:
  P_l^m = [(2l−1) x P_{l-1}^m − (l+m−1) P_{l-2}^m] / (l−m)
This avoids calling scipy and stays numerically stable for l ≤ 10.
"""

# ─── Parameters ─────────────────────────────────────────────────────────────
ICO_SUBDIV    = 4        # ico-sphere refinement: 4 → 642 verts / 1280 tris
DISPLACE      = 0.55     # radial displacement amplitude (world-space units)
EMIT_STRENGTH = 6.0      # EEVEE emission multiplier; drives bloom in WebXR
EXPORT        = "//hf_sh_orbitals.glb"

# (l, m) modes baked as shape keys — all p, all d, two selected f
SH_MODES = [
    (1, -1), (1,  0), (1,  1),                    # p orbitals
    (2, -2), (2, -1), (2,  0), (2,  1), (2,  2),  # d orbitals
    (3,  0), (3,  3),                              # f orbitals (f_z³, f_xyz)
]

# ─── Imports ─────────────────────────────────────────────────────────────────
import bpy
import bmesh
import math
import os
import numpy as np

# ─── Real spherical harmonics ─────────────────────────────────────────────────
def _alp(l: int, m: int, x: np.ndarray) -> np.ndarray:
    """
    Associated Legendre polynomial P_l^m(x) via Bonnet recurrence, m ≥ 0.

    WHY Bonnet instead of the explicit derivative formula: the textbook
    definition  P_l^m = (−1)^m (1−x²)^{m/2} d^m/dx^m P_l(x)  requires
    computing the m-th derivative of a degree-l polynomial, which loses
    precision near x=±1 for large l.  The Bonnet form uses only multiply-
    and-add, vectorises over the vertex array without any Python loop per
    vertex, and remains stable for l up to at least 10 at double precision.
    """
    m = abs(m)  # caller passes signed m; this function operates on |m|
    # Seed: P_m^m(x) = (−1)^m (2m−1)!! sqrt(1−x²)^m
    pmm = np.ones_like(x)
    if m > 0:
        s   = np.sqrt(np.maximum(1.0 - x * x, 0.0))
        fac = 1.0
        for _ in range(m):
            pmm *= -fac * s
            fac += 2.0
    if l == m:
        return pmm
    pmmp1 = x * (2 * m + 1) * pmm
    if l == m + 1:
        return pmmp1
    # General Bonnet recurrence  P_l^m = [(2l−1)x P_{l-1}^m − (l+m−1)P_{l-2}^m] / (l−m)
    prev2, prev1 = pmm, pmmp1
    result = prev1
    for ll in range(m + 2, l + 1):
        result = ((2 * ll - 1) * x * prev1 - (ll + m - 1) * prev2) / (ll - m)
        prev2, prev1 = prev1, result
    return result


def real_sh(l: int, m: int, theta: np.ndarray, phi: np.ndarray) -> np.ndarray:
    """
    Real (tesseral) spherical harmonic Y_l^m(θ, φ).
    θ ∈ [0, π] polar angle from +Z;  φ ∈ [−π, π] azimuth.
    Normalised so ∫∫ |Y_l^m|² sin θ dθ dφ = 1.

    Real convention:
      m > 0 : Y = √2 K  cos(mφ) P_l^m(cosθ)
      m = 0 : Y =    K           P_l^0(cosθ)
      m < 0 : Y = √2 K  sin(|m|φ) P_l^|m|(cosθ)
    where  K = √[(2l+1)/(4π) · (l−|m|)!/(l+|m|)!]

    Log-factorial avoids integer overflow for large (l+|m|)! — this library
    is used up to l=6 so exact integers would be fine, but the pattern is
    correct for higher-order extensions.
    """
    m_abs = abs(m)
    log_n = sum(math.log(i) for i in range(1, l - m_abs + 1)) if l > m_abs else 0.0
    log_d = sum(math.log(i) for i in range(1, l + m_abs + 1)) if l + m_abs > 0 else 0.0
    K     = math.sqrt((2 * l + 1) / (4 * math.pi) * math.exp(log_n - log_d))

    P = _alp(l, m_abs, np.cos(theta))
    if m > 0:
        return math.sqrt(2.0) * K * np.cos(m_abs * phi) * P
    if m < 0:
        return math.sqrt(2.0) * K * np.sin(m_abs * phi) * P
    return K * P


# ─── Build scene ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc      = bpy.context.scene
sc.name = "sh_orbitals"

# bmesh.ops.create_icosphere is preferred over bpy.ops.mesh.primitive_ico_sphere_add:
# the ops version creates a clean mesh without entering edit mode, avoids
# operator context requirements, and does not leave stray objects in the scene.
me = bpy.data.meshes.new("hf_sh_orbital")
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIV, radius=1.0)
bm.to_mesh(me)
bm.free()

ob = bpy.data.objects.new("hf_sh_orbital", me)
sc.collection.objects.link(ob)
sc.view_layer.update()

# ─── Vertex coordinate arrays ─────────────────────────────────────────────────
n = len(me.vertices)
raw = np.empty(n * 3, dtype=np.float64)
me.vertices.foreach_get("co", raw)
coords = raw.reshape(n, 3)

r  = np.linalg.norm(coords, axis=1)              # all ≈ 1.0 on the unit sphere
th = np.arccos(np.clip(coords[:, 2] / r, -1.0, 1.0))  # polar   θ ∈ [0, π]
ph = np.arctan2(coords[:, 1], coords[:, 0])            # azimuth φ ∈ [−π, π]
r_inv = coords / r[:, None]                       # unit radial vectors

# ─── Shape keys ───────────────────────────────────────────────────────────────
# A Basis key must exist before relative shape keys can be added.  It stores
# the unperturbed ico-sphere positions; setting all other shape key values to
# 0 returns the sphere.
ob.shape_key_add(name="Basis", from_mix=False)

for l, m in SH_MODES:
    Y = real_sh(l, m, th, ph)                         # shape (n,)
    displaced = coords + DISPLACE * Y[:, None] * r_inv  # radial displacement
    sk = ob.shape_key_add(name=f"Y_{l}_{m:+d}", from_mix=False)
    # foreach_set is the bulk path; ~5× faster than iterating sk.data[i].co
    sk.data.foreach_set("co", displaced.ravel().astype(np.float32))

# ─── Vertex attribute for shader colouring ───────────────────────────────────
# Store Y_2^0 normalised to [0, 1] as a named FLOAT per-point attribute.
# The material reads it via an Attribute node; the ColourRamp maps
# 0→blue (negative lobe) / 0.5→black (nodal surface) / 1→amber (+lobe).
# This encodes the d_z² lobe structure in the mesh data permanently so the
# material is meaningful even after the script exits.
attr = me.attributes.new("sh_value", type="FLOAT", domain="POINT")
y20  = real_sh(2, 0, th, ph)
lo, hi = float(y20.min()), float(y20.max())
y20_n  = (y20 - lo) / (hi - lo + 1e-9)
attr.data.foreach_set("value", y20_n.astype(np.float32))
me.update()

# ─── Material: bipolar emission driven by sh_value attribute ─────────────────
mat = bpy.data.materials.new("hf_sh_mat")
mat.use_nodes        = True
mat.use_backface_culling = False   # both lobes must be visible in XR headsets
nt  = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial")
emit = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = EMIT_STRENGTH

ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.interpolation = "EASE"
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color    = (0.05, 0.18, 0.80, 1.0)  # deep blue  (−lobe)
ramp.color_ramp.elements[1].position = 1.0
ramp.color_ramp.elements[1].color    = (1.00, 0.68, 0.05, 1.0)  # amber      (+lobe)
mid = ramp.color_ramp.elements.new(0.5)
mid.color = (0.01, 0.01, 0.01, 1.0)   # near-black at Y=0 nodal surface

attr_nd = nt.nodes.new("ShaderNodeAttribute")
attr_nd.attribute_name = "sh_value"
attr_nd.attribute_type = "GEOMETRY"

nt.links.new(attr_nd.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"],  emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
ob.data.materials.append(mat)

# ─── World & camera ───────────────────────────────────────────────────────────
world = bpy.data.worlds.new("hf_world")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
sc.world = world

cam_data = bpy.data.cameras.new("hf_cam")
cam_ob   = bpy.data.objects.new("hf_cam", cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob
cam_ob.location        = (0.0, -3.6, 1.0)
cam_ob.rotation_euler  = (math.radians(74), 0.0, 0.0)

# ─── Export GLB ───────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath     = bpy.path.abspath(EXPORT),
    export_format= "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format  = "WEBP",
    export_apply         = True,
    use_selection        = False,
)

print(f"[hf] GLB → {EXPORT}")
print(f"[hf] {n} verts · {len(me.polygons)} faces · {len(SH_MODES)} shape keys")
