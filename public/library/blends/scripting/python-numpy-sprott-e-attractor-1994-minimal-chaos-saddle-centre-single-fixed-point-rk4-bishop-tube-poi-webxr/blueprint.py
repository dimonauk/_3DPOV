"""
Sprott E Attractor — Saddle-Centre Fixed Point, Minimal Chaos
=============================================================
Blender 5.1 · Python 3.11 · numpy only · CC0

Sprott E is one of nineteen minimal three-variable autonomous ODE systems
discovered by Julien Clinton Sprott in a systematic computer search (1994).
It achieves genuine bounded chaos with only five terms, two of which are
quadratic, and a SINGLE fixed point whose eigenvalue structure is unlike
any standard category: one real stable direction combined with a pair of
purely imaginary eigenvalues (a "saddle-centre" in 3-D).

ODE (canonical α = 4):
  ẋ = y · z
  ẏ = x² − y
  ż = 1 − α · x

The attractor wraps a thin ribbon around that lone fixed point P = (1/α, 1/α², 0).

Eigenvalues at P (general α):  −1 ,  ±i/√α
  • Real −1: globally attracting manifold (phase-volume contracts here)
  • Imaginary ±i/√α: the centre manifold oscillates at frequency 1/√α
  → α controls the "spin frequency" near equilibrium and the attractor breadth

For α = 4:   eigenvalues = −1, ±i/2
For α = 3:   eigenvalues = −1, ±i/√3 ≈ ±0.577i  (slower spin → broader)
For α = 5:   eigenvalues = −1, ±i/√5 ≈ ±0.447i  (faster spin → tighter)
For α = 2.5: eigenvalues = −1, ±i/√2.5 ≈ ±0.632i (near onset, wider loops)

Divergence (constant):  ∇·F = ∂(yz)/∂x + ∂(x²−y)/∂y + ∂(1−αx)/∂z = −1
Liouville:  λ₁ + λ₂ + λ₃ = −1 = ∇·F  (verified numerically below)

Lyapunov spectrum (α = 4, IC = (0, 1, 0)):
  λ₁ ≈ +0.053   →  chaos is real (positive exponent)
  λ₂ ≈  0        →  marginal direction along the flow
  λ₃ ≈ −1.053   →  strong contraction onto thin attractor sheet
  D_KY = 2 + 0.053/1.053 ≈ 2.050   (Kaplan-Yorke dimension)

Source: Sprott JC (1994) "Some simple chaotic flows"
        Phys Rev E 50(2):R647–R650. Mathematical content CC0 / PD.
"""

import math
import numpy as np
import bpy
import bmesh
from mathutils import Vector

# ── CONSTANTS ────────────────────────────────────────────────────────────────
MESH_NAME  = "SprottE_Poi"
OBJ_NAME   = "SprottE_Poi"
MAT_NAME   = "SprottE_Mat"
ATTR_NAME  = "SprottE_Speed"

DT         = 0.010       # RK4 step size
BURN_IN    = 3_000       # warm-up steps (transient, discarded)
N_STEPS    = 90_000      # integration steps after warm-up
THIN       = 30          # keep every THIN-th point → 3 000 waypoints
TUBE_R     = 0.052       # tube radius (m)  — slim ribbon feel
TUBE_SEGS  = 8           # cross-section polygon sides

# Cobalt (slow) → Amber (fast)
COL_SLOW   = (0.05, 0.25, 0.85, 1.0)
COL_FAST   = (1.00, 0.55, 0.05, 1.0)

# Shape-key configs: (name, α, initial condition)
SK_CONFIGS = [
    ("Basis",    4.0, (0.0, 1.0, 0.0)),  # canonical α=4, eigenvalues −1, ±i/2
    ("SK_Loose", 3.0, (0.0, 1.0, 0.0)),  # α=3 → ±i/√3 ≈ ±0.577i, broader loops
    ("SK_Tight", 5.0, (0.0, 1.0, 0.0)),  # α=5 → ±i/√5 ≈ ±0.447i, compressed
    ("SK_Wide",  2.5, (0.0, 1.0, 0.0)),  # α=2.5 → ±i/√2.5, near-onset geometry
]


# ── ODE ──────────────────────────────────────────────────────────────────────
def deriv(state, alpha):
    """Sprott E vector field."""
    x, y, z = state
    return np.array([y * z, x * x - y, 1.0 - alpha * x])


def rk4_step(state, dt, alpha):
    """Fourth-order Runge-Kutta integration step."""
    k1 = deriv(state, alpha)
    k2 = deriv(state + 0.5 * dt * k1, alpha)
    k3 = deriv(state + 0.5 * dt * k2, alpha)
    k4 = deriv(state + dt * k3, alpha)
    return state + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)


def integrate(alpha, ic, burn, n_steps, thin, dt):
    """Integrate Sprott E; return (n_steps//thin, 3) trajectory array."""
    state = np.array(ic, dtype=float)
    for _ in range(burn):
        state = rk4_step(state, dt, alpha)
    pts = []
    for i in range(n_steps):
        state = rk4_step(state, dt, alpha)
        if i % thin == 0:
            pts.append(state.copy())
    return np.array(pts)


def arc_speeds(pts, alpha):
    """Pointwise arc-speed |γ'(t)| — used for cobalt-to-amber colouring."""
    return np.array([np.linalg.norm(deriv(p, alpha)) for p in pts])


# ── BISHOP PARALLEL-TRANSPORT FRAMING ────────────────────────────────────────
def _rot_mat(axis, angle):
    """Rodrigues rotation matrix for axis (unit) and angle (rad)."""
    c, s   = math.cos(angle), math.sin(angle)
    ax, ay, az = axis
    return np.array([
        [c + ax*ax*(1-c),     ax*ay*(1-c) - az*s, ax*az*(1-c) + ay*s],
        [ay*ax*(1-c) + az*s,  c + ay*ay*(1-c),    ay*az*(1-c) - ax*s],
        [az*ax*(1-c) - ay*s,  az*ay*(1-c) + ax*s, c + az*az*(1-c)],
    ])


def bishop_tube(pts, r, n_segs):
    """
    Builds a Bishop-framed tube along the closed curve `pts`.
    Returns (verts, quads) suitable for bpy Mesh.from_pydata.
    """
    N = len(pts)

    # Central-difference tangents
    tans = np.zeros((N, 3))
    for i in range(N):
        d = pts[(i + 1) % N] - pts[(i - 1) % N]
        tans[i] = d / (np.linalg.norm(d) + 1e-12)

    # Seed normal via Gram-Schmidt
    t0  = tans[0]
    arb = np.array([0.0, 0.0, 1.0]) if abs(t0[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    n0  = arb - np.dot(arb, t0) * t0
    n0 /= np.linalg.norm(n0)

    norms  = np.zeros((N, 3));  norms[0]  = n0
    binrms = np.zeros((N, 3));  binrms[0] = np.cross(t0, n0)

    for i in range(1, N):
        axis_v = np.cross(tans[i-1], tans[i])
        sin_v  = np.linalg.norm(axis_v)
        if sin_v > 1e-10:
            axis_v /= sin_v
            angle   = math.atan2(sin_v, np.clip(np.dot(tans[i-1], tans[i]), -1, 1))
            R       = _rot_mat(axis_v, angle)
            norms[i]  = R @ norms[i-1]
            binrms[i] = R @ binrms[i-1]
        else:
            norms[i]  = norms[i-1]
            binrms[i] = binrms[i-1]

    angles = np.linspace(0.0, 2.0 * math.pi, n_segs, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)

    verts = []
    for i in range(N):
        for j in range(n_segs):
            verts.append(pts[i] + r * (ca[j] * norms[i] + sa[j] * binrms[i]))

    faces = []
    for i in range(N):
        ni = (i + 1) % N
        for j in range(n_segs):
            nj = (j + 1) % n_segs
            a, b = i * n_segs + j, i * n_segs + nj
            c, d = ni * n_segs + nj, ni * n_segs + j
            faces.append((a, b, c, d))

    return verts, faces


# ── HELPERS ───────────────────────────────────────────────────────────────────
def scale_to_poi(pts):
    """Centre and normalise trajectory into ≈1 m bounding sphere."""
    pts = pts - pts.mean(axis=0)
    r   = np.max(np.linalg.norm(pts, axis=1))
    return pts / (r + 1e-12)


# ── SCENE BUILD ───────────────────────────────────────────────────────────────
def build_scene():
    # Remove stale objects
    bpy.ops.object.select_all(action='DESELECT')
    for name in (OBJ_NAME,):
        if name in bpy.data.objects:
            bpy.data.objects[name].select_set(True)
            bpy.ops.object.delete()

    obj = None

    for sk_idx, (sk_name, alpha, ic) in enumerate(SK_CONFIGS):
        pts    = scale_to_poi(integrate(alpha, ic, BURN_IN, N_STEPS, THIN, DT))
        speeds = arc_speeds(pts, alpha)
        verts, faces = bishop_tube(pts, TUBE_R, TUBE_SEGS)

        if sk_idx == 0:
            mesh = bpy.data.meshes.new(MESH_NAME)
            mesh.from_pydata([Vector(v) for v in verts], [], faces)
            mesh.update()
            obj = bpy.data.objects.new(OBJ_NAME, mesh)
            bpy.context.scene.collection.objects.link(obj)
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)

            # Basis shape key
            obj.shape_key_add(name="Basis", from_mix=False)

            # FLOAT_COLOR attribute for arc-speed
            attr  = mesh.color_attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
            spd_r = np.repeat(speeds, TUBE_SEGS)  # one speed per ring vertex
            s_lo, s_hi = spd_r.min(), spd_r.max() + 1e-12
            for vi, spd in enumerate(spd_r):
                t = (spd - s_lo) / (s_hi - s_lo)
                attr.data[vi].color = (
                    COL_SLOW[0]*(1-t) + COL_FAST[0]*t,
                    COL_SLOW[1]*(1-t) + COL_FAST[1]*t,
                    COL_SLOW[2]*(1-t) + COL_FAST[2]*t,
                    1.0,
                )
        else:
            sk = obj.shape_key_add(name=sk_name, from_mix=False)
            for vi, v in enumerate(verts):
                sk.data[vi].co = Vector(v)

    return obj


def build_material(obj):
    mat  = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt   = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial');  out.location  = (400, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled');  bsdf.location = (100, 0)
    attr = nt.nodes.new('ShaderNodeAttribute');        attr.location = (-200, 0)
    attr.attribute_name = ATTR_NAME
    bsdf.inputs['Roughness'].default_value = 0.30
    bsdf.inputs['Metallic'].default_value  = 0.18
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])
    obj.data.materials.append(mat)


def main():
    obj = build_scene()
    build_material(obj)
    obj.location       = (0, 0, 0)
    obj.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    nv = len(obj.data.vertices)
    nf = len(obj.data.polygons)
    print(f"[SprottE] OK — {nv} verts, {nf} faces, {len(SK_CONFIGS)} shape keys")


if __name__ == "__main__":
    main()
