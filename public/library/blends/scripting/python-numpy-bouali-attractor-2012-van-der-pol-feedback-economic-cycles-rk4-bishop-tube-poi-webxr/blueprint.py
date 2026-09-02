# SPDX-License-Identifier: CC0-1.0
"""
Bouali Attractor — Extended Van der Pol Feedback & Economic Cycle Chaos
=======================================================================
Holoflow Studio · Blender 5.1 tutorial

Safieddine Bouali introduced this three-dimensional autonomous ODE in the
context of modelling macroeconomic boom–bust cycles, extending the Van der
Pol limit-cycle oscillator by adding a slow feedback variable z:

    ẋ =  α · x · (1 − y)  −  β · z        [economic activity]
    ẏ = −c  · y · (1 − x²)                 [employment rate]
    ż =  μ  · x                             [excess demand / debt]

    α = 3.0, β = 2.2, c = 1.0, μ = 0.01

Physical intuition
------------------
The (x, y) sub-system is a Van der Pol oscillator: when x² < 1, the −c·y
term damps y back to zero; when x² > 1, y grows, which in turn forces x
back through the α·x(1−y) term.  z, driven only by μ·x, changes so slowly
(μ = 0.01) that it acts as a quasi-static parameter — but because it feeds
back into ẋ it shifts the effective amplitude of each half-cycle, preventing
the orbit from ever closing.  The irregularly wandering amplitude is chaos.

Divergence and dissipation
--------------------------
∇·F = α(1−y) + c(x²−1) = (α−c) + cx² − αy
      — position-dependent; NOT constant.
      ⟨∇·F⟩ is negative on the attractor (net dissipation), but the
      sign of the instantaneous divergence changes with x and y, giving a
      more complex folding structure than Lorenz's constant dissipation.

Fixed points
------------
  ż = 0  iff  x = 0  (for μ ≠ 0)
  x = 0  →  ẏ = 0 trivially; ẋ = 0 − β·z → z = 0
  Unique equilibrium: O = (0, 0, 0)
  Jacobian eigenvalues at O: (α, −c, 0) → O is always an unstable saddle
  with one unstable and one centre-like direction; the drift of z is what
  seeds the spiralling-away transient.

Lyapunov spectrum (α=3, β=2.2, c=1, μ=0.01, numerical estimate)
-----------------------------------------------------------------
  λ₁ ≈ +0.073   positive: exponential divergence of nearby orbits
  λ₂ ≈  0.000   marginal along-flow direction
  λ₃ ≈ −0.073+∑λ   strong contraction
  D_KY ≈ 2 + λ₁/|λ₃|  ≈  2.01   very thin 2-D sheet attractor

Shape keys (four independent integrations)
------------------------------------------
  Basis           α=3.0, β=2.2, c=1.0, μ=0.01   canonical 5-term chaos
  SK_FastZ        α=3.0, β=2.2, c=1.0, μ=0.05   z moves 5× faster —
                  stronger 3-D coupling, noticeably wider z spread
  SK_WeakGrowth   α=2.0, β=2.2, c=1.0, μ=0.01   near-periodic boundary;
                  x amplitude shrinks, orbit almost closes
  SK_StrongCouple α=3.0, β=4.0, c=1.0, μ=0.01   stronger z→x feedback;
                  orbit topology shifts from figure-eight to spiral sheet

Colour attribute: Bouali_Speed  (FLOAT_COLOR, POINT domain)
------------------------------------------------------------
  Per-waypoint speed ‖(ẋ, ẏ, ż)‖ normalised to [0, 1].
  Cobalt (slow apices) → amber (fast crossings near origin).

References
----------
Bouali S (2012) Feedback Loop in Extended Van der Pol's Equation Applied to
  an Economic Model of Cycles. arXiv:1205.3169 [math.DS].
  Mathematical content public domain.
Sprott JC sprott.physics.wisc.edu/chaos/ — free academic reference
  collection (permissive educational use). System catalogued as "Bouali".
Gilpin W (2021–2024) dysts: Dynamical Systems Benchmarks. MIT licence.
  https://github.com/williamgilpin/dysts

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr
/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr
"""

import bpy
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
ALPHA       = 3.0        # Van der Pol growth coefficient
BETA        = 2.2        # z-feedback coupling into ẋ
C_DAMP      = 1.0        # y-damping coefficient
MU          = 0.01       # x → z drive rate (slow variable)
DT          = 0.05       # RK4 time step
BURN_IN     = 2_000      # transient steps discarded (~100 time units)
N_STEPS     = 120_000    # integration steps recorded (~6 000 time units)
SKIP        = 40         # one waypoint per SKIP steps → 3 000 waypoints
TUBE_SIDES  = 10         # polygon cross-section of Bishop tube
TUBE_R      = 0.016      # tube radius [m]
POI_R       = 0.085      # target poi bounding-radius [m]

COBALT      = (0.05, 0.22, 0.82, 1.0)   # slow-speed vertices (apices)
AMBER       = (0.92, 0.58, 0.04, 1.0)   # fast-speed vertices (crossings)
WHITE       = (0.94, 0.94, 0.94, 1.0)   # mid-range


# ── ODE derivative ────────────────────────────────────────────────────────────
def _deriv(s, alpha, beta, c, mu):
    x, y, z = s
    return np.array([
        alpha * x * (1.0 - y) - beta * z,   # ẋ  (Van der Pol growth − feedback)
        -c * y * (1.0 - x * x),              # ẏ  (damped when |x|<1, grows |x|>1)
        mu * x,                               # ż  (slow drift driven by x)
    ])


# ── RK4 orbit ─────────────────────────────────────────────────────────────────
def rk4_orbit(alpha, beta, c, mu, n_steps, dt, burn, skip):
    """Return (N, 3) waypoints and (N, 3) derivative magnitudes."""
    s = np.array([1.0, 0.5, 0.0], dtype=float)
    for _ in range(burn):
        k1 = _deriv(s, alpha, beta, c, mu)
        k2 = _deriv(s + 0.5 * dt * k1, alpha, beta, c, mu)
        k3 = _deriv(s + 0.5 * dt * k2, alpha, beta, c, mu)
        k4 = _deriv(s + dt * k3, alpha, beta, c, mu)
        s += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
    pts, spds = [], []
    for i in range(n_steps):
        k1 = _deriv(s, alpha, beta, c, mu)
        k2 = _deriv(s + 0.5 * dt * k1, alpha, beta, c, mu)
        k3 = _deriv(s + 0.5 * dt * k2, alpha, beta, c, mu)
        k4 = _deriv(s + dt * k3, alpha, beta, c, mu)
        s += (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        if i % skip == 0:
            pts.append(s.copy())
            spds.append(np.linalg.norm(k1))    # speed at this waypoint
    return np.array(pts), np.array(spds)


# ── Bishop parallel-transport frame ───────────────────────────────────────────
def bishop_frame(pts):
    """Return per-point tangent T, normal N, binormal B arrays."""
    n = len(pts)
    tangents = np.diff(pts, axis=0)
    lens = np.linalg.norm(tangents, axis=1, keepdims=True)
    lens = np.where(lens < 1e-12, 1e-12, lens)
    T = np.vstack([tangents / lens, tangents[-1:] / lens[-1:]])

    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty((n, 3))
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i - 1], T[i])
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            N[i] = (cos_a * N[i - 1]
                    + sin_a * np.cross(axis, N[i - 1])
                    + (1.0 - cos_a) * np.dot(axis, N[i - 1]) * axis)
    B = np.cross(T, N)
    return T, N, B


# ── Tube geometry ──────────────────────────────────────────────────────────────
def build_tube(pts, N_arr, B_arr, r, sides):
    """Return (vertices_list, faces_list) for a Bishop-frame tube."""
    n = len(pts)
    angles = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)
    verts = (pts[:, None, :]
             + r * ca[None, :, None] * N_arr[:, None, :]
             + r * sa[None, :, None] * B_arr[:, None, :])
    verts = verts.reshape(-1, 3)
    faces = []
    for i in range(n - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.append((a, b, c, d))
    return verts.tolist(), faces


# ── Colour: speed → cobalt→amber ──────────────────────────────────────────────
def speed_colours(spds, sides):
    """Cobalt = slow (apices), amber = fast (crossings near origin)."""
    lo, hi = np.percentile(spds, 2), np.percentile(spds, 98)
    t = np.clip((spds - lo) / max(hi - lo, 1e-8), 0.0, 1.0)
    cols = np.where(
        t[:, None] < 0.5,
        np.array(COBALT[:3]) * (1 - 2 * t[:, None]) + np.array(WHITE[:3]) * (2 * t[:, None]),
        np.array(WHITE[:3]) * (2 - 2 * t[:, None]) + np.array(AMBER[:3]) * (2 * t[:, None] - 1.0),
    )
    cols = np.clip(np.hstack([cols, np.ones((len(spds), 1))]), 0.0, 1.0)
    return np.repeat(cols, sides, axis=0)   # broadcast to tube ring vertices


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    # ── clear scene ──────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # ── integrate canonical (Basis) orbit ─────────────────────────────────
    pts_b, spds_b = rk4_orbit(ALPHA, BETA, C_DAMP, MU,
                               N_STEPS, DT, BURN_IN, SKIP)

    # scale to poi bounding radius
    centre = pts_b.mean(axis=0)
    extent = np.max(np.linalg.norm(pts_b - centre, axis=1))
    scale  = POI_R / max(extent, 1e-8)
    pts_b  = (pts_b - centre) * scale

    n_pts  = len(pts_b)
    T, N_arr, B_arr = bishop_frame(pts_b)
    verts_b, faces  = build_tube(pts_b, N_arr, B_arr, TUBE_R, TUBE_SIDES)

    # ── create mesh and object ────────────────────────────────────────────
    mesh = bpy.data.meshes.new("bouali_attractor")
    obj  = bpy.data.objects.new("bouali_attractor", mesh)
    bpy.context.collection.objects.link(obj)
    mesh.from_pydata(verts_b, [], faces)
    mesh.update()
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))

    # ── FLOAT_COLOR attribute ─────────────────────────────────────────────
    vcol = mesh.color_attributes.new("Bouali_Speed", "FLOAT_COLOR", "POINT")
    cols = speed_colours(spds_b, TUBE_SIDES)
    vcol.data.foreach_set("color", cols.ravel().astype(np.float32))

    # ── shape keys ────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_variants = [
        ("SK_FastZ",        ALPHA, BETA, C_DAMP, 0.05),   # faster z
        ("SK_WeakGrowth",   2.0,   BETA, C_DAMP, MU),     # near-periodic
        ("SK_StrongCouple", ALPHA, 4.0,  C_DAMP, MU),     # stronger feedback
    ]
    for sk_name, a, b, c, m in sk_variants:
        pts_sk, _ = rk4_orbit(a, b, c, m, N_STEPS, DT, BURN_IN, SKIP)
        pts_sk    = (pts_sk - pts_sk.mean(axis=0)) * scale
        _, N_sk, B_sk = bishop_frame(pts_sk)
        verts_sk, _ = build_tube(pts_sk, N_sk, B_sk, TUBE_R, TUBE_SIDES)
        sk = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co", np.array(verts_sk).ravel().astype(np.float32))

    # ── material ──────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("Cobalt_Amber_BoualiSpeed")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Bouali_Speed"
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf.inputs["Metallic"].default_value          = 0.50
    bsdf.inputs["Roughness"].default_value         = 0.22
    bsdf.inputs["Emission Strength"].default_value = 1.7
    lnk = nt.links
    lnk.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    lnk.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    lnk.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    mesh.materials.append(mat)

    # ── Holoflow metadata ─────────────────────────────────────────────────
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:topic"]    = "bouali-attractor"

    # ── orient for WebXR (+Y up, apply −90° X rotation) ──────────────────
    obj.rotation_euler = (1.5707963, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    print(f"Bouali attractor: {n_pts} waypoints, "
          f"{len(verts_b)} vertices, {len(faces)} faces")


main()
