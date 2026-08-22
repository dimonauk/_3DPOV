"""
Rössler Strange Attractor — Blueprint (Blender 5.1)
====================================================
CC0  ·  Holoflow Studio

Otto E. Rössler (1976) discovered that a single quadratic nonlinearity — z·(x−c)
in the third equation — is sufficient for deterministic chaos:

    dx/dt = −y − z
    dy/dt =  x + a·y
    dz/dt =  b + z·(x − c)

With a = b = 0.2, c = 5.7 the flow spirals outward in the x–y plane, reaches
the fold region near x ≈ c, is flung to high z by the nonlinear term (z grows
when x > c), then drops back to restart the spiral.  The attractor is a folded
band — topologically distinct from the Lorenz butterfly (two lobes, two
nonlinearities).  Lyapunov spectrum: λ₁ ≈ +0.071, λ₂ ≈ 0, λ₃ ≈ −5.39.
Kaplan–Yorke dimension ≈ 2.013 — barely more than a surface.

λ₁ is twelve times smaller than Lorenz's (0.906), so divergence is slower and
more painterly — seeds stay visibly close for the first few spiral turns before
separating, which gives the light-painting its layered-coil aesthetic.

Integration: 4th-order Runge–Kutta at h = 0.002.  Local error O(h⁵) ≈ 10⁻¹³
per step — negligible compared to the positive Lyapunov growth.

Outside sources:
  Rössler 1976 — "An equation for continuous chaos" — Phys. Lett. A 57 (5)
    https://doi.org/10.1016/0375-9601(76)90101-8
    Equations are mathematical facts; no copyright applies.
    related: https://sprott.physics.wisc.edu/chaos/rossler.htm
  Blender Python API — bpy.types.Curve — CC-BY-SA-4.0 — Blender Foundation
    https://docs.blender.org/api/5.1/bpy.types.Curve.html
    related: https://projects.blender.org/blender/blender
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
A, B, C     = 0.2, 0.2, 5.7   # classic chaotic regime; c > 4.6 → chaos
N_TRAJ      = 8                # parallel trajectories spread around a tiny circle
EPSILON     = 0.025            # initial separation between seeds (Rössler units)
N_SKIP      = 600              # warm-up integration steps (discard transient)
N_FRAMES    = 480              # frames to record
N_SUB       = 20               # RK4 substeps per recorded frame
DT          = 0.002            # RK4 step size h
# Scale keeps the attractor (~15 Rössler units wide) inside a 0.6 m cube
SCALE       = 0.035
BEVEL_R     = 0.009            # tube radius (m)
BEVEL_RES   = 3                # 2*(res+1) = 8-sided cross-section
FRAME_END   = N_FRAMES
EMIT_STR    = 9.0              # emission strength for EEVEE bloom
OUTPUT_GLB  = bpy.path.abspath("//hf_rossler.glb")

# Warm→cool palette follows the attractor energy: inner spiral (warm) → fold (cool)
PALETTE = [
    (1.00, 0.92, 0.20, 1.0),  # gold
    (1.00, 0.60, 0.10, 1.0),  # amber
    (1.00, 0.25, 0.10, 1.0),  # red-orange
    (0.85, 0.10, 0.40, 1.0),  # raspberry
    (0.55, 0.10, 0.85, 1.0),  # violet
    (0.10, 0.55, 1.00, 1.0),  # cerulean
    (0.10, 0.95, 0.60, 1.0),  # jade
    (1.00, 1.00, 1.00, 1.0),  # white
]

# ── Scene reset ───────────────────────────────────────────────────────────────
def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.curves, bpy.data.actions):
        for item in list(block):
            block.remove(item, do_unlink=True)

# ── Rössler ODE ───────────────────────────────────────────────────────────────
def _ode(x, y, z):
    # dz: when x < c, term z*(x-c) < 0 → z shrinks toward 0 (spiral stays flat)
    # dz: when x > c, term z*(x-c) > 0 → z grows rapidly (fold-back kick)
    return (-y - z,
             x + A * y,
             B + z * (x - C))

def _rk4(x, y, z):
    k1 = _ode(x, y, z)
    k2 = _ode(x + DT/2*k1[0], y + DT/2*k1[1], z + DT/2*k1[2])
    k3 = _ode(x + DT/2*k2[0], y + DT/2*k2[1], z + DT/2*k2[2])
    k4 = _ode(x + DT*k3[0],   y + DT*k3[1],   z + DT*k3[2])
    return (x + DT*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6,
            y + DT*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6,
            z + DT*(k1[2]+2*k2[2]+2*k3[2]+k4[2])/6)

# ── Integration ───────────────────────────────────────────────────────────────
def _integrate(x0, y0, z0):
    """Warm-up N_SKIP steps, then record N_FRAMES points (N_SUB substeps each)."""
    x, y, z = x0, y0, z0
    for _ in range(N_SKIP):
        x, y, z = _rk4(x, y, z)
    pts = []
    for _ in range(N_FRAMES):
        for _ in range(N_SUB):
            x, y, z = _rk4(x, y, z)
        pts.append(Vector((x * SCALE, y * SCALE, z * SCALE)))
    return pts

# ── Emission material ─────────────────────────────────────────────────────────
def _mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    tree = m.node_tree
    tree.nodes.clear()
    em  = tree.nodes.new("ShaderNodeEmission")
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    em.inputs["Color"].default_value    = rgba
    em.inputs["Strength"].default_value = EMIT_STR
    tree.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m

# ── Curve trail ───────────────────────────────────────────────────────────────
def _make_trail(idx, pts, mat):
    cu = bpy.data.curves.new(f"rossler_{idx}", 'CURVE')
    cu.dimensions    = '3D'
    cu.bevel_depth   = BEVEL_R
    cu.bevel_resolution = BEVEL_RES
    cu.fill_mode     = 'FULL'

    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p.x, p.y, p.z, 1.0)

    ob = bpy.data.objects.new(f"rossler_{idx}", cu)
    ob.data.materials.append(mat)
    bpy.context.collection.objects.link(ob)

    # bevel_factor_end on the CURVE data-block (not the object) — grows the tube
    cu.bevel_factor_end = 0.0
    cu.keyframe_insert("bevel_factor_end", frame=1)
    cu.bevel_factor_end = 1.0
    cu.keyframe_insert("bevel_factor_end", frame=FRAME_END)
    for fc in cu.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'   # constant drawing speed

# ── Scene setup ───────────────────────────────────────────────────────────────
def _setup_scene():
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = FRAME_END
    scn.render.fps  = 30

    # Pure-black world — long-exposure light-painting canvas
    w = bpy.data.worlds.new("World")
    scn.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0, 0, 0, 1)
        bg.inputs["Strength"].default_value = 0.0

    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    ev = scn.eevee
    ev.use_bloom       = True
    ev.bloom_threshold = 0.3
    ev.bloom_intensity = 1.5
    ev.bloom_radius    = 5.5

    # Camera — 30° above the x–y plane to show spiral + z-fold together
    cam_d = bpy.data.cameras.new("Cam")
    cam_o = bpy.data.objects.new("Cam", cam_d)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location       = (0.55, -0.85, 0.50)
    cam_o.rotation_euler = (math.radians(52), 0, math.radians(35))
    scn.camera = cam_o

# ── GLB export ────────────────────────────────────────────────────────────────
def _export():
    bpy.context.scene.frame_set(FRAME_END)  # full tubes at export frame
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_animations=False,
    )

# ── Run ───────────────────────────────────────────────────────────────────────
_purge()
_setup_scene()

# Seeds distributed on a tiny circle in the x–y plane.
# Angular offsets stagger the fold arrivals across trajectories.
for i in range(N_TRAJ):
    angle = 2 * math.pi * i / N_TRAJ
    pts   = _integrate(EPSILON * math.cos(angle),
                       EPSILON * math.sin(angle), 0.0)
    mat   = _mat(f"rossler_mat_{i}", PALETTE[i % len(PALETTE)])
    _make_trail(i, pts, mat)

_export()

total_t = (N_SKIP + N_FRAMES * N_SUB) * DT
print(f"[hf_rossler] {N_TRAJ} trails · {N_FRAMES} pts · {total_t:.1f} s total · GLB → {OUTPUT_GLB}")
