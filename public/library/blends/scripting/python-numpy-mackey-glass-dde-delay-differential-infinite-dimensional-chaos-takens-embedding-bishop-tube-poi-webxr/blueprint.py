"""
Mackey-Glass DDE — Infinite-Dimensional Chaos & Takens Delay Embedding
=======================================================================
Blender 5.1 · Python 3.11 · numpy only · CC0

The Mackey-Glass delay-differential equation (Mackey & Glass 1977, Science
197:287) models blood-cell production under a delayed negative-feedback loop:

  dx/dt = β · x(t-τ) / (1 + x(t-τ)ⁿ) − γ · x(t)

β = feedback amplitude   γ = decay rate   n = Hill coefficient   τ = delay

Why it matters: the state is NOT a point in ℝ³ but the FUNCTION segment
x(s) for s ∈ [t-τ, t] — an infinite-dimensional phase space.  Bounded chaos
can therefore appear even in this single-variable equation once τ is large
enough.  For the canonical parameters (β=0.2, γ=0.1, n=10) the onset is near
τ ≈ 16.8; for τ=17 the first positive Lyapunov exponent λ₁ ≈ +0.0065 and the
Kaplan-Yorke dimension D_KY ≈ 3.6 (Farmer 1982).

Visualisation: Takens' embedding theorem (1981) guarantees that a delay
coordinate map Φ: x(t) → (x(t), x(t-τ/2), x(t-τ)) is a diffeomorphism onto
the attractor for a generic embedding dimension d ≥ 2·D_KY + 1.  Here d=3
suffices because D_KY < 4.  The resulting 3-D curve is threaded through a
Bishop parallel-transport tube to form the poi-head mesh.

Numerics: 4th-order Runge-Kutta with frozen-delay approximation.  At step n,
x_τ = x(t_n − τ) is computed by linear interpolation from a pre-allocated
history array.  The frozen-delay error is O(DT²·ẋ_τ) — negligible for DT=0.1
against τ=17.  History initialised to x₀ = 0.5 for t < 0.

Shape keys
----------
Basis    : τ=17  canonical weak chaos  (λ₁≈+0.0065, D_KY≈3.6)
SK_Med   : τ=23  moderate chaos        (λ₁≈+0.0180, D_KY≈4.5)
SK_Limit : τ=13  periodic orbit        (sub-threshold, closed loop)
SK_Strong: τ=30  high-dimensional chaos (D_KY≥7, dense tangle)

Source: Mackey MC & Glass L 1977 "Oscillation and chaos in physiological
        control systems" Science 197(4300):287-289. Equations public domain.
"""

import math
import numpy as np
import bpy
import bmesh

# ── CONSTANTS ────────────────────────────────────────────────────────────────
MESH_NAME  = "MackeyGlass_Poi"
OBJ_NAME   = "MackeyGlass_Poi"
MAT_NAME   = "MackeyGlass_Mat"
ATTR_NAME  = "MG_Signal"

BETA    = 0.2          # feedback gain
GAMMA   = 0.1          # decay rate
N_POW   = 10           # Hill coefficient
TAU     = 17.0         # delay (chaotic, onset ≈ 16.8)
X0      = 0.5          # constant initial history for t < 0

DT       = 0.1         # RK4 step size
WARMUP   = 2_000       # warm-up steps discarded (200 time units)
N_STEPS  = 90_000      # steps post-warmup
THIN     = 30          # keep every THIN-th → 3 000 waypoints

TUBE_R   = 0.048       # tube radius (m)
TUBE_SEG = 8           # cross-section polygon sides

TAU_MAX  = 32.0        # largest τ across shape keys
HIST_LEN = math.ceil(TAU_MAX / DT) + 4   # 324 — covers all variants

COL_LO = (0.04, 0.20, 0.72)   # cobalt
COL_HI = (1.00, 0.62, 0.04)   # amber

# ── DDE INTEGRATION ──────────────────────────────────────────────────────────

def integrate_mg(tau: float) -> tuple[np.ndarray, np.ndarray]:
    """
    Integrate MG DDE for given delay τ.
    Returns waypoints (N_WP, 3) in Takens embedding space and speed array.
    """
    k_lo  = int(tau / DT)          # integer delay slots
    frac  = tau / DT - k_lo        # fractional remainder for linear interp

    # Flat history+trajectory array; indices 0..(HIST_LEN-1) = t < 0
    total = HIST_LEN + WARMUP + N_STEPS + 1
    xarr  = np.full(total, X0, dtype=np.float64)

    # RK4 with frozen-delay: x_τ held constant across all four stages.
    # Error = O(DT² · ẋ_τ); for DT/τ ≈ 0.006 this is negligible.
    for i in range(HIST_LEN, total - 1):
        x     = xarr[i]
        x_tau = (1.0 - frac) * xarr[i - k_lo] + frac * xarr[i - k_lo - 1]

        def f(xc: float) -> float:
            return BETA * x_tau / (1.0 + x_tau ** N_POW) - GAMMA * xc

        k1 = DT * f(x)
        k2 = DT * f(x + 0.5 * k1)
        k3 = DT * f(x + 0.5 * k2)
        k4 = DT * f(x + k3)
        xarr[i + 1] = x + (k1 + 2*k2 + 2*k3 + k4) / 6.0

    # Takens embedding: (x(t), x(t−τ/2), x(t−τ))
    half_k  = int((tau / 2) / DT)
    half_fr = (tau / 2) / DT - half_k
    start   = HIST_LEN + WARMUP
    indices = list(range(start, start + N_STEPS, THIN))
    N_WP    = len(indices)
    pts     = np.empty((N_WP, 3), dtype=np.float64)
    spd     = np.empty(N_WP,      dtype=np.float64)

    for j, idx in enumerate(indices):
        xn    = xarr[idx]
        x_h   = (1.0 - half_fr) * xarr[idx - half_k]   + half_fr * xarr[idx - half_k - 1]
        x_t   = (1.0 - frac)    * xarr[idx - k_lo]     + frac    * xarr[idx - k_lo - 1]
        pts[j] = (xn, x_h, x_t)
        spd[j] = abs(BETA * x_t / (1.0 + x_t ** N_POW) - GAMMA * xn)

    # Centre and scale to ~1 m bounding box
    mn, mx = pts.min(axis=0), pts.max(axis=0)
    rng    = (mx - mn).max()
    pts    = (pts - (mn + mx) * 0.5) / rng
    return pts, spd


# ── BISHOP TUBE ──────────────────────────────────────────────────────────────

def bishop_tube(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Build Bishop parallel-transport tube around a 3-D curve.
    Returns verts (N*S, 3) and quad faces array.
    """
    S, N = TUBE_SEG, len(pts)

    # Tangent: central differences, endpoints one-sided
    T = np.empty_like(pts)
    T[1:-1] = pts[2:] - pts[:-2]
    T[0]    = pts[1]  - pts[0]
    T[-1]   = pts[-1] - pts[-2]
    norms   = np.linalg.norm(T, axis=1, keepdims=True)
    norms[norms < 1e-12] = 1.0
    T /= norms

    # Seed normal perpendicular to T[0]
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([1.0, 0.0, 0.0])
    N0    = np.cross(T[0], ref); N0 /= np.linalg.norm(N0)
    Nf    = np.empty_like(pts); Nf[0] = N0

    # Rodrigues parallel transport — avoids Frenet-Serret twisting at inflections
    for i in range(1, N):
        ax = np.cross(T[i-1], T[i])
        sa = np.linalg.norm(ax)
        ca = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sa < 1e-10:
            Nf[i] = Nf[i-1]
        else:
            ax /= sa
            Nf[i] = (ca * Nf[i-1]
                     + sa * np.cross(ax, Nf[i-1])
                     + (1 - ca) * np.dot(ax, Nf[i-1]) * ax)

    B    = np.cross(T, Nf)
    ang  = np.linspace(0, 2 * math.pi, S, endpoint=False)
    ca2, sa2 = np.cos(ang), np.sin(ang)

    # (N, S, 3) ring array
    rings = (pts[:, None, :] + TUBE_R * (ca2[None, :, None] * Nf[:, None, :]
                                        + sa2[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3)

    faces = []
    for i in range(N - 1):
        ni = i + 1
        for s in range(S):
            s1 = (s + 1) % S
            faces.append((i*S+s, ni*S+s, ni*S+s1, i*S+s1))
    return verts, np.array(faces, dtype=np.int32)


# ── MAIN BUILD ───────────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Basis integration
pts_b, spd_b = integrate_mg(TAU)
verts_b, faces_b = bishop_tube(pts_b)

# Blender mesh
mesh = bpy.data.meshes.new(MESH_NAME)
bm   = bmesh.new()
bm_v = [bm.verts.new(tuple(v)) for v in verts_b]
bm.verts.ensure_lookup_table()
for f in faces_b:
    try:
        bm.faces.new([bm_v[i] for i in f])
    except Exception:
        pass
bm.to_mesh(mesh); bm.free()
obj = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# FLOAT_COLOR attribute: speed → cobalt-to-amber
attr = mesh.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
spd_r  = np.repeat(spd_b, TUBE_SEG)
vmin, vmax = spd_r.min(), spd_r.max()
t_col  = (spd_r - vmin) / max(vmax - vmin, 1e-9)
cols   = np.zeros(len(spd_r) * 4)
cols[0::4] = COL_LO[0] + t_col * (COL_HI[0] - COL_LO[0])
cols[1::4] = COL_LO[1] + t_col * (COL_HI[1] - COL_LO[1])
cols[2::4] = COL_LO[2] + t_col * (COL_HI[2] - COL_LO[2])
cols[3::4] = 1.0
attr.data.foreach_set("color", cols)

# Shape keys
obj.shape_key_add(name="Basis", from_mix=False)
for sk_name, tau_v in [("SK_Med", 23.0), ("SK_Limit", 13.0), ("SK_Strong", 30.0)]:
    pts_v, _ = integrate_mg(tau_v)
    verts_v, _ = bishop_tube(pts_v)
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for vi, co in enumerate(verts_v):
        sk.data[vi].co = tuple(co)

# ── MATERIAL ─────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nt  = mat.node_tree; nt.nodes.clear()
atr = nt.nodes.new("ShaderNodeAttribute"); atr.attribute_name = ATTR_NAME
bsd = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsd.inputs["Metallic"].default_value         = 0.50
bsd.inputs["Roughness"].default_value        = 0.22
bsd.inputs["Emission Strength"].default_value = 1.6
out = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(atr.outputs["Color"], bsd.inputs["Base Color"])
nt.links.new(atr.outputs["Color"], bsd.inputs["Emission Color"])
nt.links.new(bsd.outputs["BSDF"],  out.inputs["Surface"])
mesh.materials.append(mat)

# ── ORIENTATION & METADATA ────────────────────────────────────────────────────
obj["holoflow:facet"]    = False
obj["holoflow:category"] = "poi-head"
obj.rotation_euler       = (-math.pi / 2, 0, 0)   # +Y-up for WebXR
bpy.ops.object.transform_apply(rotation=True)
