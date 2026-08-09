"""
blueprint.py — Jacobi Elliptic Functions: sn/cn/dn, AGM & Elliptic Poi Head
=============================================================================
Blender 5.1 · Python 3.11 · CC0

The Jacobi elliptic functions sn(u,k), cn(u,k), dn(u,k) are the elliptic
analogue of sin, cos, and the constant 1.  They arise as the EXACT solution
of the nonlinear pendulum — not the small-angle sin≈θ approximation, but the
full swinging arc at any amplitude.  Modulus k = sin(θ₀/2) where θ₀ is the
peak angle; at k→0 the functions reduce to trig, at k→1 they become tanh/sech.

K(k) — the complete elliptic integral of the first kind — is the quarter-period:
    K(k) = ∫₀^(π/2) dθ / √(1 - k²sin²θ)
computed here via the arithmetic-geometric mean (AGM), which converges quadratically:
    a₀ = 1, b₀ = √(1-k²);  aₙ₊₁ = (aₙ+bₙ)/2,  bₙ₊₁ = √(aₙbₙ)
    K(k) = π / (2 · AGM(1, √(1-k²)))

Surface of interest: dn(u,k) acts as the "energy envelope" of the oscillation.
We use it as a radial modulator on a sphere:
    ρ(θ,k) = R · dn(θ · 2K(k)/π, k)
    x = ρ·sinθ·cosφ,  y = ρ·sinθ·sinφ,  z = ρ·cosθ
At k=0: dn≡1 → perfect sphere.  At k→1: dn dips to k′=√(1-k²) at the equator
and the poi head develops a deep waist — two lobes joined at a narrow neck.

Shape keys encode five modulus values; vertex colour is the dn magnitude
(gold at poles, deep violet at equator).

Run inside Blender ≥ 5.1:
    blender --background --python blueprint.py

References:
    Abramowitz & Stegun §16 (1964) NBS — Public Domain.
    DLMF §22 Jacobian Elliptic Functions — PD (NIST US Gov).
    scipy.special.ellipj — BSD-3-Clause.
"""

import bpy
import bmesh
import numpy as np
import math
import os
from mathutils import Vector

# ── Optional scipy (bundled in Blender 5.1) ───────────────────────────────────
try:
    from scipy.special import ellipj as _scipy_ellipj
    from scipy.special import ellipk as _scipy_ellipk
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

# ═══════════════════════════════════════════════════════════════════════════════
# PARAMETERS
# ═══════════════════════════════════════════════════════════════════════════════
K_VALUES = [0.00, 0.50, 0.80, 0.95, 0.999]   # moduli for shape keys
N_THETA  = 40     # colatitude rings (including poles)
N_PHI    = 64     # longitude segments
R_POI    = 0.050  # metres — pole radius (≈ sphere radius at k=0)

NAME       = "hf_jacobi_poi"
OUTPUT_GLB = "//hf_jacobi_poi.glb"

COL_POLE    = (1.00, 0.75, 0.20, 1.0)   # warm gold — dn = 1
COL_EQUATOR = (0.08, 0.04, 0.55, 1.0)   # deep violet — dn = k′
EMIT_STR    = 3.0

# ═══════════════════════════════════════════════════════════════════════════════
# JACOBI UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

def agm_K(m: float) -> float:
    """K(m) via arithmetic-geometric mean; m = k².  Quadratic convergence."""
    if m >= 1.0:
        return float("inf")
    a, b = 1.0, math.sqrt(max(0.0, 1.0 - m))
    for _ in range(64):
        a, b = (a + b) * 0.5, math.sqrt(a * b)
        if abs(a - b) < 1e-15:
            break
    return math.pi / (2.0 * a)


def jacobi_dn(u_arr: np.ndarray, m: float) -> np.ndarray:
    """
    Return dn(u, m) evaluated at every point in u_arr.
    Uses scipy when available; falls back to the identity
        dn² = 1 - m·sn²   with sn from scipy or a simple quadrature.
    Returned values lie in [√(1-m), 1] for m ∈ [0,1].
    """
    if HAS_SCIPY:
        _sn, _cn, dn, _ph = _scipy_ellipj(u_arr, m)
        return dn
    # Pure-numpy fallback: solve the pendulum ODE by integrating
    # ds/du = cn·dn,  dc/du = -sn·dn,  dd/du = -m·sn·cn
    # via RK4 on a sorted grid then re-order.
    order = np.argsort(u_arr)
    u_sorted = u_arr[order]
    n = len(u_sorted)
    u_dense = np.linspace(0.0, float(u_sorted[-1]) if n > 0 else 1.0, max(n * 8, 512))
    du = u_dense[1] - u_dense[0] if len(u_dense) > 1 else 1e-6
    sn, cn, dn_v = 0.0, 1.0, 1.0
    dn_out = np.ones(n)
    j = 0
    for i, u_i in enumerate(u_dense):
        if j < n and u_i >= u_sorted[j]:
            dn_out[j] = dn_v
            j += 1
            if j >= n:
                break
        def deriv(s, c, d):
            return c * d, -s * d, -m * s * c
        k1s, k1c, k1d = deriv(sn, cn, dn_v)
        k2s, k2c, k2d = deriv(sn + 0.5*du*k1s, cn + 0.5*du*k1c, dn_v + 0.5*du*k1d)
        k3s, k3c, k3d = deriv(sn + 0.5*du*k2s, cn + 0.5*du*k2c, dn_v + 0.5*du*k2d)
        k4s, k4c, k4d = deriv(sn + du*k3s, cn + du*k3c, dn_v + du*k3d)
        sn += du * (k1s + 2*k2s + 2*k3s + k4s) / 6.0
        cn += du * (k1c + 2*k2c + 2*k3c + k4c) / 6.0
        dn_v += du * (k1d + 2*k2d + 2*k3d + k4d) / 6.0
    result = np.empty(n)
    result[order] = dn_out
    return result

# ═══════════════════════════════════════════════════════════════════════════════
# SURFACE COMPUTATION
# ═══════════════════════════════════════════════════════════════════════════════

def jacobi_sphere_verts(k: float) -> tuple[np.ndarray, np.ndarray]:
    """
    Build (N_THETA × N_PHI, 3) vertex array for the dn-modulated sphere.
    Also return the (N_THETA × N_PHI,) dn colour values in [0,1].
    """
    m   = k * k
    K   = agm_K(m)

    # Colatitude θ ∈ [0,π] mapped to u ∈ [0, 2K]
    theta = np.linspace(0.0, math.pi, N_THETA)
    u_arr = theta * (2.0 * K / math.pi)

    dn_col = jacobi_dn(u_arr, m)      # (N_THETA,)
    rho    = R_POI * dn_col           # modulated radius per latitude

    phi = np.linspace(0.0, 2.0 * math.pi, N_PHI, endpoint=False)

    # Broadcast: (N_THETA,1) × (1,N_PHI)
    RHO   = rho[:, None]
    THETA = theta[:, None]
    PHI   = phi[None, :]

    X = RHO * np.sin(THETA) * np.cos(PHI)
    Y = RHO * np.sin(THETA) * np.sin(PHI)
    Z = RHO * np.cos(THETA)

    verts  = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)
    dn_flat = np.broadcast_to(dn_col[:, None], (N_THETA, N_PHI)).reshape(-1)

    # Normalise dn → [0,1] for vertex colour (1 at pole, k′ or ~0 at equator)
    dn_norm = (dn_flat - dn_flat.min()) / max(dn_flat.max() - dn_flat.min(), 1e-9)
    return verts, dn_norm


def uv_grid_faces() -> list[tuple]:
    """Quad connectivity for a N_THETA × N_PHI grid (seam-wrapped)."""
    faces = []
    for ti in range(N_THETA - 1):
        for pi in range(N_PHI):
            a = ti * N_PHI + pi
            b = ti * N_PHI + (pi + 1) % N_PHI
            c = (ti + 1) * N_PHI + (pi + 1) % N_PHI
            d = (ti + 1) * N_PHI + pi
            faces.append((a, b, c, d))
    return faces

# ═══════════════════════════════════════════════════════════════════════════════
# BLENDER ASSEMBLY
# ═══════════════════════════════════════════════════════════════════════════════

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system      = "METRIC"
scene.unit_settings.scale_length = 1.0

# --- BASE MESH (k = K_VALUES[0]) ---
base_verts, base_dn = jacobi_sphere_verts(K_VALUES[0])
faces = uv_grid_faces()

mesh = bpy.data.meshes.new(NAME)
bm   = bmesh.new()
bm_verts = [bm.verts.new(Vector(v)) for v in base_verts]
bm.verts.ensure_lookup_table()
for f in faces:
    try:
        bm.faces.new([bm_verts[i] for i in f])
    except ValueError:
        pass   # duplicate-face guard

# Merge degenerate poles (radius ≈ 0 at k>0 poles become coincident)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.faces.ensure_lookup_table()
bm.to_mesh(mesh)
bm.free()
mesh.update()

obj = bpy.data.objects.new(NAME, mesh)
scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj["holoflow:facet"] = True

# Flat shading (faceted look)
mesh.shade_flat()

# --- SHAPE KEYS ---
obj.shape_key_add(name="Basis", from_mix=False)

for k in K_VALUES[1:]:
    sk = obj.shape_key_add(name=f"k_{int(k*100):03d}", from_mix=False)
    verts_k, _ = jacobi_sphere_verts(k)
    # Shape key vertex count must match basis after remove_doubles.
    # Re-build vert positions mapped to the merged mesh topology.
    bm2 = bmesh.new()
    bm2.from_mesh(mesh)
    bm2.verts.ensure_lookup_table()
    # Build KD-tree from base_verts to locate merged vert positions
    from mathutils import kdtree as KDT
    kd = KDT.KDTree(len(base_verts))
    for idx, v in enumerate(base_verts):
        kd.insert(Vector(v), idx)
    kd.balance()
    for mv in bm2.verts:
        _loc, src_idx, _dist = kd.find(mv.co)
        if src_idx < len(verts_k):
            sk.data[mv.index].co = Vector(verts_k[src_idx])
    bm2.free()

# --- VERTEX COLOUR (dn magnitude) ---
mesh.vertex_colors.new(name="dn_colour")
vc_layer = mesh.vertex_colors["dn_colour"]

# Rebuild dn map for k=0 (base shape)
bm3 = bmesh.new()
bm3.from_mesh(mesh)
bm3.verts.ensure_lookup_table()
from mathutils import kdtree as KDT2
kd2 = KDT2.KDTree(len(base_verts))
for idx, v in enumerate(base_verts):
    kd2.insert(Vector(v), idx)
kd2.balance()

for poly in mesh.polygons:
    for li in poly.loop_indices:
        vi = mesh.loops[li].vertex_index
        mv_co = mesh.vertices[vi].co
        _loc, src_idx, _dist = kd2.find(mv_co)
        t = float(base_dn[src_idx]) if src_idx < len(base_dn) else 0.5
        r = COL_POLE[0] * t + COL_EQUATOR[0] * (1 - t)
        g = COL_POLE[1] * t + COL_EQUATOR[1] * (1 - t)
        b = COL_EQUATOR[2] * (1 - t) + COL_POLE[2] * t
        vc_layer.data[li].color = (r, g, b, 1.0)

bm3.free()

# --- MATERIAL ---
mat = bpy.data.materials.new("jacobi_emit")
mat.use_nodes = True
nt = mat.node_tree
for n in nt.nodes:
    nt.nodes.remove(n)

attr  = nt.nodes.new("ShaderNodeAttribute")
attr.attribute_name = "dn_colour"
attr.location = (-300, 0)

emit  = nt.nodes.new("ShaderNodeEmission")
emit.inputs["Strength"].default_value = EMIT_STR
emit.location = (0, 0)

out   = nt.nodes.new("ShaderNodeOutputMaterial")
out.location = (200, 0)

nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

mesh.materials.append(mat)

# --- GLB EXPORT ---
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_colors=True,
    export_morph=True,
    export_morph_normal=False,
)
print(f"[holoflow] Exported → {OUTPUT_GLB}")
