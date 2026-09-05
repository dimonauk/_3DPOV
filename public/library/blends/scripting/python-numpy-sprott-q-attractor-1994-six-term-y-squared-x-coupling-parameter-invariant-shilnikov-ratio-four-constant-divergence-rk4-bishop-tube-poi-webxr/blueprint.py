"""
Sprott Q Attractor — 6-Term Y²-Nonlinearity, Parameter-Invariant Shilnikov Ratio
==================================================================================
Julien C. Sprott, Physical Review E 50(2):R647–650 (1994)
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Sprott Q system produces a 3 000-waypoint
tube skeleton; Bishop parallel-transport frames extrude a round-profile
tube that is welded into a poi head mesh.  Four shape keys vary the
coupling parameter a in ż = ax + y² + 0.5z, revealing how the attractor
geometry transforms while the Shilnikov certificate stays fixed.

WHY SPROTT Q — THE INVARIANT RATIO
-----------------------------------
Sprott Q has a structural algebraic property shared by no other entry in
the 1994 catalogue: the characteristic polynomial at the origin factors as

    (λ + 1)(λ² − 0.5λ + a) = 0

regardless of the parameter a.  This means:
  • λ_r = −1 exactly for all a  (not approximate — exact algebra)
  • Re(λ_c) = 0.25 exactly for all a
  • Shilnikov ratio |λ_r|/Re(λ_c) = 1/0.25 = 4.0 exactly for all a

The shape-key family therefore explores GEOMETRICALLY different attractors
that share the SAME topological Shilnikov certificate.  This is a
rare "isochronous" property in the minimal-chaos zoo.

The system has two equilibria:
  O  = (0, 0, 0)           — Shilnikov saddle-focus (chaos source)
  P* = (−a, −a, 0)         — saddle-spiral (eigenvalue ≈ +0.83, ±1.81i for a=3.1)

Divergence: ∇·F = 0 + (−1) + 0.5 = −0.5  (constant, a-independent)

Operator strategy: direct data API only (mesh.vertices, shape_keys).
Bishop parallel-transport avoids Frenet flipping at zero-curvature inflections.

Reference:
  Sprott, J.C. (1994). Some simple chaotic flows.
  Physical Review E, 50(2), R647–R650.
  DOI: 10.1103/PhysRevE.50.R647   (open-access PD)

Related external sources:
  dysts library (https://github.com/williamgilpin/dysts)
    MIT — 131-attractor benchmark with full Lyapunov spectra.
  Bishop RL (1975) "There is more than one way to frame a curve."
    American Mathematical Monthly 82(3):246–251.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── Parameters ──────────────────────────────────────────────────────────────
DT        = 0.010         # RK4 timestep — safe for Sprott Q's y²-nonlinearity
BURN_IN   = 3000          # steps discarded to land on the attractor
N_STEPS   = 90_000        # integration steps after burn-in
THIN      = 30            # keep every THIN-th point → 3 000 waypoints
TUBE_SEGS = 8             # octagonal cross-section for GLB efficiency
TUBE_R    = 0.040         # tube radius in metres
HEAD_R    = 0.12          # poi head sphere radius (metres)
D_PARAM   = 0.5           # fixed z-feedback coefficient (0.5 canonical)
MESH_NAME = "hf_sprott_q_poi"
OBJ_NAME  = "hf_sprott_q_poi"

# Shape-key parameter sets: (a, label, burn, steps)
# a drives ż = ax + y² + 0.5z.  All share λ_r = −1, Shilnikov ratio = 4.0.
SHAPE_KEYS = [
    (3.10, "Basis",        3000, 90_000),  # Canonical Sprott Q
    (2.00, "SK_LowA",      3000, 90_000),  # a=2.0 — orbit widens, Im(λ_c)↓
    (4.50, "SK_HighA",     3000, 90_000),  # a=4.5 — orbit tightens, Im(λ_c)↑
    (1.00, "SK_NearTorus", 3000, 90_000),  # a=1.0 — near onset, quasi-periodic
]

COBALT = np.array([0.027, 0.159, 0.408])
AMBER  = np.array([1.000, 0.702, 0.000])


# ── ODE: Sprott Q ──────────────────────────────────────────────────────────
def f(state: np.ndarray, a: float, d: float = D_PARAM) -> np.ndarray:
    """
    ẋ = −z
    ẏ =  x − y       ← linear sink that drives x-tracking with lag
    ż =  ax + y² + dz ← y²-nonlinearity; a couples the fast x channel back

    Equilibria (general a, d):
      O  = (0, 0, 0)           always exists
      P* = (−a, −a, 0)         second fixed point; shifts with a

    Divergence: ∇·F = 0 − 1 + d = d − 1 = −0.5  (constant — a-independent)

    WHY y²: the y² term breaks the odd-symmetry of the linear subsystem,
    preventing the mirror-image fixed points seen in many Z₂-symmetric
    systems (Lorenz, Shaw, Shimizu–Morioka).  Sprott Q has a single scroll
    topology near O rather than the dual-scroll of the Z₂ family.
    """
    x, y, z = state
    return np.array([
        -z,
        x - y,
        a * x + y * y + d * z,
    ])


# ── RK4 integrator ─────────────────────────────────────────────────────────
def rk4(state: np.ndarray, a: float) -> np.ndarray:
    """Classic 4th-order Runge-Kutta.  DT=0.01 keeps local error ≈ 10⁻¹⁰."""
    k1 = f(state, a)
    k2 = f(state + 0.5 * DT * k1, a)
    k3 = f(state + 0.5 * DT * k2, a)
    k4 = f(state + DT * k3, a)
    return state + (DT / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


# ── Integrate one trajectory ────────────────────────────────────────────────
def integrate(a: float, burn: int, n_steps: int) -> np.ndarray:
    """
    Returns waypoints array (n_steps // THIN, 3).
    IC near the origin's complex-unstable manifold (Re(λ_c) = +0.25).

    WHY this IC: the origin has two complex-unstable eigenvalues 0.25±1.743i.
    Starting at (0.1, 0, −0.1) displaces along both x and z simultaneously,
    which projects onto the unstable plane.  The burn-in then collapses the
    trajectory to the attractor proper.
    """
    rng = np.random.default_rng(42)
    ic  = np.array([0.1, 0.0, -0.1]) + rng.uniform(-0.01, 0.01, 3)

    state = ic.copy()
    for _ in range(burn):
        state = rk4(state, a)

    waypoints = np.empty((n_steps, 3), dtype=np.float64)
    for i in range(n_steps):
        state = rk4(state, a)
        waypoints[i] = state

    return waypoints[::THIN]


# ── Bishop parallel-transport tube ─────────────────────────────────────────
def bishop_tube(pts: np.ndarray) -> tuple[list, list]:
    """
    Extrude a circular profile along pts using Bishop rotation-minimising frames.
    Avoids Frenet flipping at zero-curvature segments of the Sprott Q orbit.

    Returns (verts, faces) lists ready for mesh.from_pydata.
    """
    N  = len(pts)
    ns = TUBE_SEGS
    r  = TUBE_R

    angles = np.linspace(0, 2 * np.pi, ns, endpoint=False)
    cs_a   = np.cos(angles)
    sn_a   = np.sin(angles)

    # ── Seed frame ──────────────────────────────────────────────────────────
    t0 = pts[1] - pts[0]
    t0 /= np.linalg.norm(t0) + 1e-12

    helper = np.array([1.0, 0.0, 0.0])
    if abs(np.dot(t0, helper)) > 0.9:
        helper = np.array([0.0, 1.0, 0.0])
    n0 = helper - np.dot(helper, t0) * t0
    n0 /= np.linalg.norm(n0) + 1e-12
    b0 = np.cross(t0, n0)
    frames = [(t0.copy(), n0.copy(), b0.copy())]

    for i in range(1, N):
        t1  = pts[min(i + 1, N - 1)] - pts[i - 1]
        t1 /= np.linalg.norm(t1) + 1e-12

        t_prev, n_prev, b_prev = frames[-1]
        axis = np.cross(t_prev, t1)
        slen = np.linalg.norm(axis)
        if slen < 1e-12:
            frames.append((t1, n_prev.copy(), b_prev.copy()))
        else:
            axis /= slen
            ang   = np.arctan2(slen, np.dot(t_prev, t1))
            c_a   = np.cos(ang); s_a = np.sin(ang)
            n1 = (c_a * n_prev
                  + s_a * np.cross(axis, n_prev)
                  + (1 - c_a) * np.dot(axis, n_prev) * axis)
            n1 /= np.linalg.norm(n1) + 1e-12
            b1  = np.cross(t1, n1)
            frames.append((t1, n1, b1))

    verts = []
    for i, pt in enumerate(pts):
        _, n, b = frames[i]
        for j in range(ns):
            verts.append(pt + r * (cs_a[j] * n + sn_a[j] * b))

    faces = []
    for i in range(N - 1):
        for j in range(ns):
            a_v = i * ns + j
            b_v = i * ns + (j + 1) % ns
            c_v = (i + 1) * ns + (j + 1) % ns
            d_v = (i + 1) * ns + j
            faces.append((a_v, b_v, c_v, d_v))

    return verts, faces


# ── Colour (speed-mapped cobalt → amber) ───────────────────────────────────
def speed_colour(pts: np.ndarray) -> np.ndarray:
    """
    Per-waypoint speed → per-tube-vertex FLOAT_COLOR attribute SprottQ_Speed.
    Fast segments (near origin approach) → amber.
    Slow segments (spiralling near P*) → cobalt.
    """
    diffs  = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    speeds = np.concatenate([[diffs[0]], diffs])
    v_norm = (speeds - speeds.min()) / (speeds.max() - speeds.min() + 1e-12)
    v_tiled = np.repeat(v_norm, TUBE_SEGS)
    colours = np.outer(v_tiled, AMBER) + np.outer(1 - v_tiled, COBALT)
    return np.hstack([colours, np.ones((len(v_tiled), 1))])


# ── Poi sphere head ─────────────────────────────────────────────────────────
def attach_poi_head(obj: bpy.types.Object, end_pt: np.ndarray) -> None:
    """Append a UV-sphere head and join it into the tube object."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=HEAD_R,
        segments=16,
        ring_count=8,
        location=tuple(end_pt),
    )
    head_obj = bpy.context.active_object
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    head_obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()


# ── Build full mesh ─────────────────────────────────────────────────────────
def build_mesh() -> tuple:
    trajectories = []
    for a, label, burn, n_steps in SHAPE_KEYS:
        print(f"  Integrating Sprott Q a={a:.2f} ({label}) …")
        pts = integrate(a, burn, n_steps)
        trajectories.append(pts)

    pts0 = trajectories[0]
    verts, faces = bishop_tube(pts0)

    mesh = bpy.data.meshes.new(MESH_NAME)
    mesh.from_pydata([v.tolist() for v in verts], [], faces)
    mesh.update()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_flat()

    # ── Shape keys ───────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    basis_sk = obj.data.shape_keys.key_blocks["Basis"]
    basis_co = np.array([[v[0], v[1], v[2]] for v in verts])
    basis_sk.data.foreach_set("co", basis_co.ravel())

    for idx, (a, label, burn, n_steps) in enumerate(SHAPE_KEYS[1:], start=1):
        pts_sk  = trajectories[idx]
        v_sk, _ = bishop_tube(pts_sk)
        sk = obj.shape_key_add(name=label, from_mix=False)
        co_arr = np.array([[v[0], v[1], v[2]] for v in v_sk])
        sk.data.foreach_set("co", co_arr.ravel())

    # ── FLOAT_COLOR: SprottQ_Speed ────────────────────────────────────────
    colours = speed_colour(pts0)
    attr    = mesh.color_attributes.new(
        name="SprottQ_Speed", type="FLOAT_COLOR", domain="POINT"
    )
    attr.data.foreach_set("color", colours.ravel())

    mesh.update()
    return obj, pts0


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    obj, pts0 = build_mesh()
    attach_poi_head(obj, pts0[-1])

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    a_canonical = SHAPE_KEYS[0][0]
    n_v  = len(obj.data.vertices)
    n_f  = len(obj.data.polygons)
    n_sk = len(obj.data.shape_keys.key_blocks)
    print(f"Done — '{OBJ_NAME}': {n_v} verts, {n_f} faces, {n_sk} shape keys.")
    print(f"Canonical a = {a_canonical}  →  O = (0,0,0)  P* = ({-a_canonical},{-a_canonical},0)")
    print("λ_r = −1 exact  |  λ_c = 0.25 ± 1.743i  |  Shilnikov ratio = 4.0 (all a)")
    print("∇·F = −0.5  |  ∑λᵢ ≈ −0.5  |  λ₁ ≈ +0.091  D_KY ≈ 2.154")

main()
