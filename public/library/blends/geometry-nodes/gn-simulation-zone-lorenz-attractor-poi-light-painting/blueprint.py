"""
Lorenz Strange Attractor — Blueprint (Blender 5.1)
===================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Edward Lorenz's 1963 autonomous ODE for atmospheric convection rolls:
  dX/dt = σ(Y − X)
  dY/dt = X(ρ − Z) − Y
  dZ/dt = XY − βZ

At σ=10, ρ=28, β=8/3 the system has two unstable fixed points C±
(the "eye" of each wing) and no stable periodic orbits.  Trajectories
are attracted to a fractal surface — the strange attractor — yet never
repeat.  Six trails start within ε=0.01 of each other and diverge
exponentially: the positive Lyapunov exponent λ₁ ≈ 0.906 per time unit
means separation grows as e^(λ₁·t).  After 8 time units, an initial
gap of 0.01 has grown to ~9 Lorenz units — the trails fill different
regions of the butterfly.

Integrator: 4th-order Runge-Kutta (RK4), local error O(h⁵) per step,
global error O(h⁴).  At DT=0.002 the per-step truncation error is
~10⁻¹³ — negligible relative to the physical chaos timescale ~1 s.

Blender technique: POLY curves with bevel_depth (tube cross-section).
bevel_factor_end animated 0→1 over FRAME_END frames draws the trail
growing along the curve — no Build modifier required.

Outside sources:
  Matplotlib lorenz_attractor.py  BSD-3-Clause  The Matplotlib Contributors
    https://github.com/matplotlib/matplotlib/blob/main/galleries/examples/lines_bars_and_markers/lorenz_attractor.py
    related: https://github.com/matplotlib/matplotlib  (scipy/numpy ecosystem)
  Lorenz, E. N. (1963) "Deterministic Nonperiodic Flow"  Public Domain (maths)
    J. Atmos. Sci. 20(2):130–141
    https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml
    related: https://journals.ametsoc.org  (AMS open-access archive)
"""

import bpy, math

# ── Parameters ───────────────────────────────────────────────────────────────
SLUG        = "hf_lorenz"
SIGMA       = 10.0
RHO         = 28.0
BETA        = 8.0 / 3.0

DT          = 0.002       # RK4 step (stability: < 0.02 for σ=10, ρ=28)
N_SKIP      = 800         # transient steps → attractor (800×0.002 = 1.6 t.u.)
N_FRAMES    = 400         # animation frame count
N_SUBSTEPS  = 10          # RK4 substeps per frame (0.02 effective Δt/frame)
FRAME_END   = N_FRAMES    # 400 frames ≈ 8 time units recorded

SCALE       = 0.05        # Lorenz ±20 → ±1.0 Blender unit
N_TRAJ      = 6           # diverging trajectories
EPSILON     = 0.01        # X₀ perturbation between trajectories

TUBE_R      = 0.013       # bevel_depth radius → ~26 mm diameter tube
BEVEL_RES   = 3           # sides per bevel quarter = 4×(RES+1) total sides
EMIT_STR    = 10.0

# Neon palette: sky-blue · hot-pink · neon-green · amber · violet · cyan-teal
NEON = [
    (0.10, 0.70, 1.00),
    (1.00, 0.28, 0.90),
    (0.15, 1.00, 0.40),
    (1.00, 0.70, 0.05),
    (0.75, 0.18, 1.00),
    (0.05, 0.95, 0.78),
]

# ── RK4 integrator ────────────────────────────────────────────────────────────
def _deriv(x, y, z):
    return SIGMA*(y - x), x*(RHO - z) - y, x*y - BETA*z

def _rk4(x, y, z, dt):
    k1 = _deriv(x, y, z)
    k2 = _deriv(x+.5*dt*k1[0], y+.5*dt*k1[1], z+.5*dt*k1[2])
    k3 = _deriv(x+.5*dt*k2[0], y+.5*dt*k2[1], z+.5*dt*k2[2])
    k4 = _deriv(x+dt*k3[0],    y+dt*k3[1],    z+dt*k3[2])
    return (
        x + dt*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])/6,
        y + dt*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])/6,
        z + dt*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])/6,
    )

def _integrate(x0, y0, z0):
    x, y, z = x0, y0, z0
    for _ in range(N_SKIP):
        x, y, z = _rk4(x, y, z, DT)
    pts = []
    for _ in range(N_FRAMES):
        for _ in range(N_SUBSTEPS):
            x, y, z = _rk4(x, y, z, DT)
        pts.append((x * SCALE, y * SCALE, z * SCALE))
    return pts

# ── Scene utilities ───────────────────────────────────────────────────────────
def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.curves,
                bpy.data.node_groups, bpy.data.objects, bpy.data.actions):
        for b in list(col):
            col.remove(b, do_unlink=True)

def _emission_mat(name, rgb, strength=EMIT_STR):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    emi = nt.nodes.new('ShaderNodeEmission')
    emi.inputs['Color'].default_value    = (*rgb, 1.0)
    emi.inputs['Strength'].default_value = strength
    nt.links.new(emi.outputs['Emission'], out.inputs['Surface'])
    return mat

def _make_trail(idx, pts, mat):
    cu = bpy.data.curves.new(f"lorenz_{idx}", 'CURVE')
    cu.dimensions    = '3D'
    cu.fill_mode     = 'FULL'
    cu.bevel_depth   = TUBE_R
    cu.bevel_resolution = BEVEL_RES
    cu.use_fill_caps = True

    spl = cu.splines.new('POLY')
    spl.points.add(len(pts) - 1)
    for i, (x, y, z) in enumerate(pts):
        spl.points[i].co = (x, y, z, 1.0)

    ob = bpy.data.objects.new(f"lorenz_{idx}", cu)
    ob.data.materials.append(mat)
    bpy.context.collection.objects.link(ob)

    # Animate bevel_factor_end 0→1: trail grows along the curve each frame.
    # Keyframe on the CURVE data-block, not the object.
    cu.bevel_factor_end = 0.0
    cu.keyframe_insert("bevel_factor_end", frame=0)
    cu.bevel_factor_end = 1.0
    cu.keyframe_insert("bevel_factor_end", frame=FRAME_END)
    if cu.animation_data and cu.animation_data.action:
        for fc in cu.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    return ob

# ── Main ──────────────────────────────────────────────────────────────────────
_purge()

# Initial conditions: X₀ + i·ε, Y₀ = 0.0, Z₀ = 1.0 (near C⁺ wing saddle)
X0, Y0, Z0 = 0.0, 1.0, 1.05

trails = []
for i in range(N_TRAJ):
    pts  = _integrate(X0 + i * EPSILON, Y0, Z0)
    mat  = _emission_mat(f"neon_{i}", NEON[i])
    trails.append(_make_trail(i, pts, mat))

# Camera: elevated front view showing both butterfly wings
cam_data = bpy.data.cameras.new("Cam")
cam_ob   = bpy.data.objects.new("Cam", cam_data)
# Lorenz centre ≈ (0, 0, 1.35) in Blender space; position above and in front
cam_ob.location       = (0.0, -4.2, 2.0)
cam_ob.rotation_euler = (1.15, 0.0, 0.0)
cam_data.lens         = 40.0
bpy.context.collection.objects.link(cam_ob)
bpy.context.scene.camera = cam_ob

# World: pure black so emission reads as long-exposure light painting
world = bpy.data.worlds.new("World")
world.use_nodes = False
world.color     = (0.0, 0.0, 0.0)
bpy.context.scene.world = world

# Scene timeline
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = 30

# EEVEE Next — bloom for neon glow
eevee = scene.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = 0.25
eevee.bloom_intensity = 1.4
eevee.bloom_radius    = 6.0

print(f"[{SLUG}] {N_TRAJ} Lorenz trajectories · {N_FRAMES} frames · ε={EPSILON}")
print(f"[{SLUG}] Lyapunov divergence after {N_FRAMES * N_SUBSTEPS * DT:.1f} time units: "
      f"ε·e^(0.906×{N_FRAMES*N_SUBSTEPS*DT:.1f}) ≈ "
      f"{EPSILON * math.exp(0.906 * N_FRAMES * N_SUBSTEPS * DT):.2f} Lorenz units")

# ── GLB export ────────────────────────────────────────────────────────────────
import os

GLB_DIR  = os.path.join(bpy.path.abspath("//"), "..", "..", "..", "glbs",
                        "geometry-nodes",
                        "gn-simulation-zone-lorenz-attractor-poi-light-painting")
os.makedirs(GLB_DIR, exist_ok=True)

# Export the full-trail snapshot (bevel_factor_end=1.0, curves→mesh)
scene.frame_set(FRAME_END)
bpy.ops.export_scene.gltf(
    filepath          = os.path.join(GLB_DIR, "hf_lorenz.glb"),
    export_format     = 'GLB',
    export_apply      = True,
    export_materials  = 'EXPORT',
    export_colors     = True,
    use_selection     = False,
    use_active_collection = False,
)
print(f"[{SLUG}] GLB exported → {GLB_DIR}/hf_lorenz.glb")
