"""
Duffing Oscillator: Period-Doubling Route to Chaos, Poincaré Sections
& Basins as Poi Light-Trail — Blender 5.1 blueprint.

Equation (double-well, Holmes-Whitley form):
    dx/dt = y
    dy/dt = x - x³ - δy + γcos(ωt)

The potential V(x) = -x²/2 + x⁴/4 has two stable wells at x = ±1
and an unstable saddle at x = 0. Periodic forcing γcos(ωt) drives the
particle between wells. As γ increases from 0, the system passes through
period-1 → period-2 → period-4 → chaos via the Feigenbaum cascade.
"""
import bpy
import numpy as np
from math import pi, tau

# ── Parameters (top-level constants for easy experimentation) ─────────────
DELTA        = 0.30      # viscous damping
OMEGA        = 1.20      # forcing frequency (rad/s)
T_PERIOD     = tau / OMEGA       # one forcing period ≈ 5.236 s
DT           = T_PERIOD / 400    # RK4 step; 400 sub-steps per period
N_TRANS      = 800               # periods to discard (transient burn-in)
N_ORBIT      = 80                # periods to record for phase portrait
N_POINCARE   = 5_000             # stroboscopic samples for fractal section
DOWNSAMPLE   = 8                 # keep every Nth phase-portrait point
BEVEL_R      = 0.018             # tube radius (world units)
SCALE        = 1.5               # scale (x, y) → world coords
Z_STEP       = 3.6               # Z-offset between orbit slabs

CASES = [
    # (label, γ, (x₀, y₀), emission colour)
    ("period_1", 0.20, ( 1.0,  0.0), (0.10, 0.55, 1.00)),  # ice blue
    ("period_2", 0.28, ( 1.0,  0.0), (0.25, 1.00, 0.50)),  # mint green
    ("period_4", 0.29, ( 1.0,  0.0), (1.00, 0.75, 0.10)),  # amber
    ("chaos",    0.50, ( 0.3,  0.1), (1.00, 0.22, 0.22)),  # red
]


# ── ODE kernel ────────────────────────────────────────────────────────────
def _deriv(state: np.ndarray, t: float, gamma: float) -> np.ndarray:
    x, y = state
    # double-well restoring force x - x³, plus damping, plus forcing
    return np.array([y, x - x * x * x - DELTA * y + gamma * np.cos(OMEGA * t)])


def _rk4(state: np.ndarray, t: float, gamma: float) -> np.ndarray:
    """One RK4 step.  Local truncation error O(h⁵) — essential for chaos
    because Euler's O(h²) error aliases into false bifurcations at small γ."""
    h = DT
    k1 = _deriv(state, t, gamma)
    k2 = _deriv(state + 0.5 * h * k1, t + 0.5 * h, gamma)
    k3 = _deriv(state + 0.5 * h * k2, t + 0.5 * h, gamma)
    k4 = _deriv(state + h * k3, t + h, gamma)
    return state + (h / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)


# ── Integration ───────────────────────────────────────────────────────────
def integrate(gamma: float, x0: float, y0: float,
              n_trans: int, n_keep: int,
              n_poincare: int = 0) -> tuple:
    """
    Integrate the Duffing oscillator.

    Returns
    -------
    traj      : (n_keep * steps_per_period, 2) phase-portrait samples
    poincare  : (n_poincare, 2) stroboscopic Poincaré samples (if requested)
    """
    steps_per = int(round(T_PERIOD / DT))   # steps per forcing period
    state = np.array([x0, y0], dtype=np.float64)
    t = 0.0

    # Burn transients: the system hasn't reached its attractor yet.
    # Skipping N_TRANS periods ensures we record steady-state behaviour,
    # not the transient approach from initial conditions.
    for _ in range(n_trans * steps_per):
        state = _rk4(state, t, gamma)
        t += DT

    # Record steady-state trajectory
    n_pts = n_keep * steps_per
    traj = np.empty((n_pts, 2), dtype=np.float64)
    poincare_list = []
    step_in = 0
    for i in range(n_pts):
        traj[i] = state
        if step_in == 0:              # stroboscopic sample at t = n·T
            poincare_list.append(state.copy())
        state = _rk4(state, t, gamma)
        t += DT
        step_in = (step_in + 1) % steps_per

    # Extended Poincaré run (chaotic attractor mapping)
    poincare = np.empty((0, 2))
    if n_poincare > n_keep:
        extra = n_poincare - n_keep
        for _ in range(extra * steps_per):
            state = _rk4(state, t, gamma)
            t += DT
            step_in = (step_in + 1) % steps_per
            if step_in == 0:
                poincare_list.append(state.copy())
        poincare = np.array(poincare_list)
    elif poincare_list:
        poincare = np.array(poincare_list)

    return traj, poincare


# ── Blender helpers ───────────────────────────────────────────────────────
def _emission_mat(name: str, rgb: tuple) -> bpy.types.Material:
    """Unlit emission material — survives GLB export as KHR_materials_emissive."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    em = tree.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*rgb, 1.0)
    em.inputs["Strength"].default_value = 4.0
    tree.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def _orbit_curve(name: str, pts: np.ndarray,
                 z: float, colour: tuple) -> bpy.types.Object:
    """NURBS order-4 (cubic B-spline) tube through a downsampled trajectory.

    NURBS order 4 gives C² continuity — no kinks at control points —
    essential for smooth tube rendering.  Order 2 would be a polyline.
    """
    cdata = bpy.data.curves.new(name, type="CURVE")
    cdata.dimensions = "3D"
    cdata.bevel_depth = BEVEL_R
    cdata.bevel_resolution = 6

    sp = cdata.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for i, (x, y) in enumerate(pts):
        sp.points[i].co = (x * SCALE, y * SCALE, z, 1.0)
    sp.use_cyclic_u = True
    sp.order_u = 4

    obj = bpy.data.objects.new(name, cdata)
    bpy.context.scene.collection.objects.link(obj)
    cdata.materials.append(_emission_mat(name + "_mat", colour))
    return obj


def _poincare_mesh(name: str, pts: np.ndarray,
                   z: float, colour: tuple) -> bpy.types.Object:
    """Vertex cloud from stroboscopic Poincaré samples.

    Each vertex is one Poincaré iterate (x_n, y_n) at phase nT.
    The cloud's fractal structure (box-counting dim ≈ 1.3) is the
    strange attractor's fingerprint in the Poincaré section.
    """
    verts = [(float(p[0]) * SCALE, float(p[1]) * SCALE, z) for p in pts]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(_emission_mat(name + "_mat", colour))
    return obj


# ── Main ──────────────────────────────────────────────────────────────────
def main() -> None:
    # Clear scene (safe direct-data deletion — no context-dependent ops)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    print("Duffing oscillator — integrating four cases …")

    for i, (label, gamma, (x0, y0), colour) in enumerate(CASES):
        n_poisson = N_POINCARE if label == "chaos" else 0
        traj, poincare = integrate(gamma, x0, y0, N_TRANS, N_ORBIT, n_poisson)

        # Downsample trajectory so the NURBS curve stays manageable
        pts = traj[::DOWNSAMPLE]
        z = i * Z_STEP
        _orbit_curve(f"duffing_{label}", pts, z, colour)
        print(f"  {label}: γ={gamma:.2f}  pts={len(pts)}")

        # Poincaré section only for the chaotic attractor
        if label == "chaos" and len(poincare):
            _poincare_mesh("duffing_poincare", poincare,
                           z + Z_STEP * 0.55, (0.90, 0.45, 1.00))
            print(f"  poincare: {len(poincare)} iterates")

    # ── Camera & area light ──
    bpy.ops.object.camera_add(location=(0, -12, (len(CASES) - 1) * Z_STEP * 0.5))
    cam = bpy.context.object
    cam.data.type = "PERSP"
    cam.data.lens = 50
    cam.rotation_euler = (pi / 2, 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="AREA", location=(4, -8, 8))
    bpy.context.object.data.energy = 600

    # ── Export ──
    glb_path = bpy.path.abspath("//hf_duffing.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_materials="EXPORT",
        export_apply=True,
    )
    print(f"Exported → {glb_path}")


main()
