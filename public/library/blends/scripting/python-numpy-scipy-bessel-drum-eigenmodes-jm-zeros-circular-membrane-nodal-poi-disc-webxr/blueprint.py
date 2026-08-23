"""
Bessel Drum Eigenmodes — Circular Membrane Vibrational Modes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
J_m(k_{mn} r/R) cos(mθ) · Nodal Circles + Diameters · Poi Disc
Blender 5.1 · bpy + numpy + scipy.special · CC0 · Holoflow Studio

────────────────────────────────────────────────────────────────────
TECHNIQUE
The 2D wave equation  ∂²u/∂t² = c²∇²u  on a disc of radius R,
subject to the fixed-rim Dirichlet condition  u(R,θ,t) = 0,
separates into a purely spatial eigenvalue problem:

    ∇²Φ + k² Φ = 0     with   Φ(R,θ) = 0

Via polar separation  Φ = R(r)·Θ(θ):

    Θ(θ) = cos(mθ)  or  sin(mθ)        m = 0, 1, 2, …
    R(r)  = J_m(kr)                     (Bessel function, first kind)

The rim condition  J_m(kR) = 0  forces  kR = k_{mn},  the n-th
positive zero of J_m.  Each pair (m, n) is an eigenmode:

    u_{m,n}(r,θ) = J_m(k_{mn} r/R) × cos(mθ)

NODAL STRUCTURE (regions of zero displacement):
  n−1 interior nodal circles at  r = R × j_{m,k}/j_{m,n}  (k<n)
  2m  nodal diameters at  θ = π(2l+1)/(2m)  for l = 0 … m−1

WHY J_m(0) = δ_{m0}: J_m(x) ≈ (x/2)^m / Γ(m+1) for small x.
At the pole r = 0 only the breathing modes (m=0) have non-zero
displacement; all higher-order modes are exactly zero at the centre.

TRADE-OFF — cosine vs sine: cos(mθ) places an antinode at θ=0
(positive-x axis) making the orientation immediately readable.
Sine modes are equivalent but rotated by π/(2m).

Source authority: NIST DLMF §10 (US Government, public domain);
scipy.special (BSD-3-Clause).
────────────────────────────────────────────────────────────────────
"""

import bpy
import numpy as np
from scipy.special import jn, jn_zeros

# ── PARAMETERS ─────────────────────────────────────────────────────────────
SLUG      = "hf_bessel_drum_poi"
OBJ_NAME  = "Bessel_Drum_Disc"
MAT_NAME  = "Bessel_Drum_Mat"
ATTR_NAME = "Drum_Mode"

RAD_INNER = 0.006          # 6 mm inner hole (negligible, avoids pole topo)
RAD_OUTER = 0.46           # 46 cm — standard poi disc radius
N_R       = 60             # radial rings
N_THETA   = 120            # azimuthal sectors
AMPL      = 0.16           # shape-key cupping amplitude (m)

# (mode-name, m, n): azimuthal order m, radial order n
MODES = [
    ("SK_Mode_0_1", 0, 1),  # fundamental: single dome, 0 nodal lines
    ("SK_Mode_1_1", 1, 1),  # 1 nodal diameter — "sloshing" mode
    ("SK_Mode_2_1", 2, 1),  # 2 nodal diameters (4 equal sectors)
    ("SK_Mode_0_2", 0, 2),  # 1 interior nodal circle — "breathing" 2nd mode
    ("SK_Mode_3_1", 3, 1),  # 3 nodal diameters (6 equal sectors)
    ("SK_Mode_1_2", 1, 2),  # 1 diameter + 1 interior circle
]

COL_POS  = (0.06, 0.14, 0.66, 1.0)   # cobalt  — positive displacement
COL_ZERO = (0.93, 0.93, 0.93, 1.0)   # white   — nodal line
COL_NEG  = (0.88, 0.52, 0.04, 1.0)   # amber   — negative displacement


# ── GRID HELPERS ────────────────────────────────────────────────────────────

def grid_radii():
    """N_R evenly spaced radii from RAD_INNER to RAD_OUTER."""
    return np.linspace(RAD_INNER, RAD_OUTER, N_R, dtype=np.float64)


def grid_thetas():
    """N_THETA evenly spaced angles [0, 2π)."""
    return np.linspace(0.0, 2.0 * np.pi, N_THETA, endpoint=False,
                       dtype=np.float64)


def make_base_positions():
    """
    Flat annular disc: N_R × N_THETA vertices, z = 0.
    Returns float32 (N_R*N_THETA, 3).
    indexing='ij' → row i = constant radius across all N_THETA columns.
    """
    RR, TT = np.meshgrid(grid_radii(), grid_thetas(), indexing="ij")
    X = RR * np.cos(TT)
    Y = RR * np.sin(TT)
    Z = np.zeros_like(X)
    return np.stack([X, Y, Z], axis=-1).reshape(-1, 3).astype(np.float32)


def make_quad_faces():
    """
    Quads connecting adjacent radial rings, circular closure in θ.
    WHY CCW from +Z: Blender uses right-hand normals pointing outward.
    WHY % N_THETA: the last sector wraps back to j=0 seamlessly.
    """
    faces = []
    for i in range(N_R - 1):
        for j in range(N_THETA):
            j1 = (j + 1) % N_THETA
            a  =  i      * N_THETA + j
            b  = (i + 1) * N_THETA + j
            c  = (i + 1) * N_THETA + j1
            d  =  i      * N_THETA + j1
            faces.append((a, b, c, d))
    return faces


# ── EIGENMODE COMPUTATION ────────────────────────────────────────────────────

def eigenmode_displacements(m: int, n: int) -> np.ndarray:
    """
    Compute normalised displacement for mode (m, n) at every grid vertex.

    u(r, θ) = J_m(k_{mn} r / R) × cos(mθ),  normalised so max|u| = 1.

    Returns float32 array of shape (N_R*N_THETA,) in row-major order
    matching make_base_positions().

    WHY jn_zeros(m, n)[-1]: jn_zeros returns the first n positive zeros
    of J_m in ascending order; the n-th zero (index -1) is k_{mn}.

    WHY normalise: maximum of J_m on [0, k_{mn}] occurs at r = 0 for
    m=0 (J_0(0)=1) and at the first Bessel maximum (J_m'=0 point) for
    m≥1.  Normalising to unit amplitude gives all modes equal visual
    weight in the shape-key cupping, making nodal geometry the
    perceptually dominant feature rather than raw amplitude differences.
    """
    k_mn = float(jn_zeros(m, n)[-1])
    RR, TT = np.meshgrid(grid_radii(), grid_thetas(), indexing="ij")
    u = jn(m, k_mn * RR / RAD_OUTER) * np.cos(m * TT)  # (N_R, N_T)

    peak = float(np.max(np.abs(u)))
    if peak > 1e-12:
        u /= peak

    return u.reshape(-1).astype(np.float32)


# ── VERTEX COLOUR ────────────────────────────────────────────────────────────

def mode_colours(u: np.ndarray) -> np.ndarray:
    """
    Map displacement u ∈ [−1, 1] → RGBA colour per vertex.
    u > 0 : lerp(white, cobalt);  u < 0 : lerp(white, amber).
    Nodal lines (u ≈ 0) appear white, making them immediately visible
    without any additional geometry — the gradient colouring IS the
    nodal diagram.
    """
    c_pos = np.array(COL_POS,  dtype=np.float32)
    c_zer = np.array(COL_ZERO, dtype=np.float32)
    c_neg = np.array(COL_NEG,  dtype=np.float32)
    u_c   = np.clip(u, -1.0, 1.0)
    pos   = np.clip( u_c, 0, 1)[:, None]
    neg   = np.clip(-u_c, 0, 1)[:, None]
    return c_zer + pos * (c_pos - c_zer) + neg * (c_neg - c_zer)


# ── MATERIAL ─────────────────────────────────────────────────────────────────

def make_material():
    """
    Principled BSDF reading the FLOAT_COLOR POINT attribute.
    Slight metallic sheen mirrors studio facet-art aesthetic.
    """
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        bpy.data.materials.remove(mat)
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = "GEOMETRY"   # reads POINT domain

    nt.links.new(attr.outputs["Color"],  bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],   out.inputs["Surface"])

    bsdf.inputs["Roughness"].default_value = 0.28
    bsdf.inputs["Metallic"].default_value  = 0.18

    out.location  = (400,   0)
    bsdf.location = (100,   0)
    attr.location = (-200,  0)
    return mat


# ── MAIN BUILD ───────────────────────────────────────────────────────────────

def build():
    # Cleanup
    for o in list(bpy.data.objects):
        if o.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if m.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(m)

    verts_np = make_base_positions()
    faces    = make_quad_faces()

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(verts_np.tolist(), [], faces)
    mesh.update()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Basis vertex colour = fundamental mode (0,1)
    u_basis  = eigenmode_displacements(0, 1)
    colours  = mode_colours(u_basis)
    attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", colours.ravel())

    # Material
    mat = make_material()
    obj.data.materials.append(mat)

    # Shape keys — Basis first, then 6 modes
    obj.shape_key_add(name="Basis", from_mix=False)

    for (sk_name, m, n) in MODES:
        u  = eigenmode_displacements(m, n)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        pos = verts_np.copy()
        pos[:, 2] = u * AMPL
        sk.data.foreach_set("co", pos.ravel())

    # Studio conventions: flat shading, +Y up, holoflow properties
    mesh.shade_flat()
    obj.rotation_euler = (1.5707963267948966, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    obj["holoflow:facet"]   = True
    obj["holoflow:topic"]   = "bessel-drum-eigenmodes"
    obj["holoflow:modes"]   = str([(m, n) for (_, m, n) in MODES])

    print(f"[Bessel Drum] Built {len(verts_np)} verts, "
          f"{len(faces)} quads, {len(MODES)} shape keys.")


build()
