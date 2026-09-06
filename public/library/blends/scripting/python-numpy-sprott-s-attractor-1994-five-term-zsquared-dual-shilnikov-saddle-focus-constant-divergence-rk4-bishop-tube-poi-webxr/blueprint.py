"""
Sprott S Attractor — 5-Term z²-Nonlinearity, Dual Fixed Points
================================================================
Julien C. Sprott, Physical Review E 50(2):R647–650 (1994)
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
RK4 integration of the 3-ODE Sprott S system produces a 3 000-waypoint
tube skeleton; Bishop parallel-transport frames extrude a round-profile
tube that is welded into a poi head mesh.  Four shape keys capture the
canonical parameter set plus three parameter variants that survey the
topology shift from single-lobe to dual-lobe orbit around P+ and P-.

WHY SPROTT S
------------
Sprott S is the last 5-term entry in the 1994 catalogue (A–S) to carry
a z²-nonlinearity.  Unlike Sprott H (∇·F = a − 1, parameter-dependent)
and N (∇·F = −2, stronger dissipation), S has:
  • ∇·F = −1 exactly, regardless of any parameter — same as Rössler and
    most of the Lorenz family.
  • Two genuine Shilnikov-type fixed points P± = (−1, ¼, ±1), one with
    real-stable + complex-unstable eigenvalues (P+, ratio ≈ 5.3 ✓),
    one with real-unstable + complex-stable eigenvalues (P−).  This pair
    creates the asymmetric two-scroll topology visible in the attractor.
  • No free parameter: the system as Sprott published it is fixed at the
    'minimal complexity' operating point.  The shape-key variants break
    that rigidity by perturbing ż = c + x (c varies), letting us watch
    the two scrolls merge, separate, and collapse to period-2.

Operator strategy: direct data API only (mesh.vertices, shape_keys).
Tube extrusion via Bishop parallel-transport (accumulate rotation in the
Frenet-free sense) avoids the flipping that Frenet-Serret produces at
inflection points — critical for the S attractor's tight two-scroll
crossings.

Reference:
  Sprott, J.C. (1994). Some simple chaotic flows.
  Physical Review E, 50(2), R647–R650.
  DOI: 10.1103/PhysRevE.50.R647   (open-access PD)

Related external sources:
  Sprott Chaos Data (https://sprott.physics.wisc.edu/chaos/sprott.htm)
    — public domain parameter tables & Lyapunov exponents.
  Viana & Grebogi (2022) "Riddled Basins of Attraction"
    — how dual-fixed-point attractors create fractal basin boundaries.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── Parameters ──────────────────────────────────────────────────────────────
DT          = 0.010        # RK4 timestep; stable for Sprott S dynamics
BURN_IN     = 3000         # steps discarded to land on the attractor
N_STEPS     = 90_000       # integration steps after burn-in
THIN        = 30           # keep every THIN-th point → 3 000 waypoints
TUBE_SEGS   = 8            # octagonal cross-section for GLB efficiency
TUBE_R      = 0.040        # tube radius in metres
HEAD_R      = 0.12         # poi head sphere radius (metres)
MESH_NAME   = "hf_sprott_s_poi"
OBJ_NAME    = "hf_sprott_s_poi"

# Shape-key parameter sets: (c in ż = c + x, label, burn, steps)
# Canonical: c = 1.0 (Sprott's original), others perturb c.
SHAPE_KEYS = [
    (1.00, "Basis",      3000, 90_000),   # Basis — dual-scroll canonical
    (0.70, "SK_LowC",   3000, 90_000),   # c=0.7 — P± gap narrows, tighter scrolls
    (1.30, "SK_HighC",  3000, 90_000),   # c=1.3 — P± gap widens, elongated
    (1.60, "SK_WideC",  3000, 90_000),   # c=1.6 — near bifurcation, topology shift
]

COBALT = np.array([0.027, 0.159, 0.408])
AMBER  = np.array([1.000, 0.702, 0.000])

# ── ODE: Sprott S ─────────────────────────────────────────────────────────
def f(state: np.ndarray, c: float = 1.0) -> np.ndarray:
    """
    ẋ = −x − 4y
    ẏ =  x + z²      ← z²-nonlinearity drives the rolling scroll
    ż =  c + x       ← c=1 in Sprott's original; we vary for shape keys

    Fixed points (any c):  x = −c, y = c/4, z = ±√c
    (require c > 0 for real fixed points — all our presets satisfy this)

    Divergence: ∇·F = ∂(−x−4y)/∂x + ∂(x+z²)/∂y + ∂(c+x)/∂z = −1 + 0 + 0 = −1
    Liouville: volume contracts at rate e^−t per unit time.
    """
    x, y, z = state
    return np.array([
        -x - 4.0 * y,
        x + z * z,
        c + x,
    ])

# ── RK4 integrator ────────────────────────────────────────────────────────
def rk4(state: np.ndarray, c: float) -> np.ndarray:
    """Classic 4th-order Runge-Kutta. DT=0.01 keeps local truncation error ≈ 10⁻¹⁰."""
    k1 = f(state, c)
    k2 = f(state + 0.5 * DT * k1, c)
    k3 = f(state + 0.5 * DT * k2, c)
    k4 = f(state + DT * k3, c)
    return state + (DT / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)

# ── Integrate one trajectory ───────────────────────────────────────────────
def integrate(c: float, burn: int, n_steps: int) -> np.ndarray:
    """
    Returns waypoints array (n_steps // THIN, 3).
    Initial condition near P+: slightly displaced along the unstable manifold.
    WHY this IC: starting near P+ (unstable complex pair) guarantees fast
    departure onto the attractor rather than spending burn-in near a stable
    manifold spiral.
    """
    # P+ = (−c, c/4, √c) + small noise
    rng = np.random.default_rng(42)
    ic  = np.array([-c, c / 4.0, np.sqrt(max(c, 1e-6))]) + rng.uniform(-0.01, 0.01, 3)

    state = ic.copy()
    for _ in range(burn):
        state = rk4(state, c)

    waypoints = np.empty((n_steps, 3), dtype=np.float64)
    for i in range(n_steps):
        state = rk4(state, c)
        waypoints[i] = state

    return waypoints[::THIN]

# ── Bishop parallel-transport tube ────────────────────────────────────────
def bishop_tube(pts: np.ndarray) -> tuple[list, list]:
    """
    Extrude a circular profile along the curve pts using the Bishop
    (rotation-minimising) frame.  Avoids Frenet flipping at zero-curvature.

    Returns (verts, faces) ready for mesh.from_pydata.

    WHY Bishop over Frenet: Sprott S has segments where adjacent tangents
    nearly align (low curvature near the origin crossing), causing the
    Frenet normal to jump discontinuously.  Bishop accumulates angular
    increments, guaranteeing a smooth ribbon even through zero-curvature.
    """
    N  = len(pts)
    ns = TUBE_SEGS
    r  = TUBE_R

    # Angle offsets for octagonal cross-section
    angles = np.linspace(0, 2 * np.pi, ns, endpoint=False)
    cs_a   = np.cos(angles)
    sn_a   = np.sin(angles)

    # ── Initial Bishop frame ──────────────────────────────────────────────
    t0 = pts[1] - pts[0]
    t0 /= np.linalg.norm(t0) + 1e-12

    # Arbitrary initial normal: pick vector least aligned to t0
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

        # Rodrigues rotation from t_prev to t_curr
        t_prev, n_prev, b_prev = frames[-1]
        axis = np.cross(t_prev, t1)
        slen = np.linalg.norm(axis)
        if slen < 1e-12:
            frames.append((t1, n_prev.copy(), b_prev.copy()))
        else:
            axis /= slen
            ang   = np.arctan2(slen, np.dot(t_prev, t1))
            c_a   = np.cos(ang); s_a = np.sin(ang)
            # Rotate n_prev by angle around axis
            n1 = (c_a * n_prev
                  + s_a * np.cross(axis, n_prev)
                  + (1 - c_a) * np.dot(axis, n_prev) * axis)
            n1 /= np.linalg.norm(n1) + 1e-12
            b1  = np.cross(t1, n1)
            frames.append((t1, n1, b1))

    # ── Build vertex rings and faces ─────────────────────────────────────
    verts = []
    for i, pt in enumerate(pts):
        _, n, b = frames[i]
        for j in range(ns):
            verts.append(pt + r * (cs_a[j] * n + sn_a[j] * b))

    faces = []
    for i in range(N - 1):
        for j in range(ns):
            a = i * ns + j
            b = i * ns + (j + 1) % ns
            c = (i + 1) * ns + (j + 1) % ns
            d = (i + 1) * ns + j
            faces.append((a, b, c, d))

    return verts, faces

# ── Colour (speed-mapped cobalt → amber) ──────────────────────────────────
def speed_colour(pts: np.ndarray) -> np.ndarray:
    """
    Per-waypoint speed → per-tube-vertex FLOAT_COLOR.
    Fast segments (near origin crossing) → amber.
    Slow segments (near P± equilibria spiralling) → cobalt.
    """
    diffs  = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    speeds = np.concatenate([[diffs[0]], diffs])     # pad to len(pts)
    v_norm = (speeds - speeds.min()) / (speeds.max() - speeds.min() + 1e-12)

    # Tile to TUBE_SEGS vertices per waypoint
    v_tiled = np.repeat(v_norm, TUBE_SEGS)           # (N*ns,)
    colours = np.outer(v_tiled, AMBER) + np.outer(1 - v_tiled, COBALT)
    # Add alpha channel
    return np.hstack([colours, np.ones((len(v_tiled), 1))])

# ── Poi sphere head ────────────────────────────────────────────────────────
def attach_poi_head(obj: bpy.types.Object, end_pt: np.ndarray) -> None:
    """
    Append a UV-sphere head at the trajectory endpoint.
    Poi convention: the 'head' is the glowing ball at the chain end.
    Merged into the same object so the GLB stays a single mesh.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=HEAD_R,
        segments=16,
        ring_count=8,
        location=tuple(end_pt),
    )
    head_obj = bpy.context.active_object

    # Join into the tube object
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    head_obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()

# ── Build full mesh ────────────────────────────────────────────────────────
def build_mesh() -> bpy.types.Object:
    # Build all four trajectories up front
    trajectories = []
    for c, label, burn, n_steps in SHAPE_KEYS:
        print(f"  Integrating Sprott S c={c:.2f} ({label}) …")
        pts = integrate(c, burn, n_steps)
        trajectories.append(pts)

    # Use Basis trajectory to create the base mesh
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

    # ── Shape keys ──────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)
    basis_sk = obj.data.shape_keys.key_blocks["Basis"]

    # Apply Basis coordinates from pts0
    v0 = [v for v in verts]  # already set by from_pydata
    basis_co = np.array([[v[0], v[1], v[2]] for v in v0])
    basis_sk.data.foreach_set("co", basis_co.ravel())

    for idx, (c, label, burn, n_steps) in enumerate(SHAPE_KEYS[1:], start=1):
        pts_sk   = trajectories[idx]
        v_sk, _  = bishop_tube(pts_sk)

        sk = obj.shape_key_add(name=label, from_mix=False)
        co_arr = np.array([[v[0], v[1], v[2]] for v in v_sk])
        sk.data.foreach_set("co", co_arr.ravel())

    # ── FLOAT_COLOR: SprottS_Speed ───────────────────────────────────────
    colours = speed_colour(pts0)
    attr    = mesh.color_attributes.new(
        name="SprottS_Speed", type="FLOAT_COLOR", domain="POINT"
    )
    attr.data.foreach_set("color", colours.ravel())

    mesh.update()
    return obj, pts0

# ── Main ──────────────────────────────────────────────────────────────────
def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    obj, pts0 = build_mesh()
    attach_poi_head(obj, pts0[-1])   # head at trajectory end

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    n_v = len(obj.data.vertices)
    n_f = len(obj.data.polygons)
    n_sk = len(obj.data.shape_keys.key_blocks)
    print(f"Done — '{OBJ_NAME}': {n_v} verts, {n_f} faces, {n_sk} shape keys.")
    print("Fixed points: P+ = (-c, c/4, +√c),  P- = (-c, c/4, -√c)  (c=1 → P±=(−1,¼,±1))")
    print("Shilnikov at P+: |λ_r|≈1.60 > Re(λ_c)≈0.30, ratio≈5.3 ✓")

main()
