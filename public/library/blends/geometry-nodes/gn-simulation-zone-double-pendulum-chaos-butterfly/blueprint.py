"""
Double Pendulum Chaos — Blueprint (Blender 5.1)
================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Two rigid rods joined at the lower tip of the upper rod — fully
deterministic yet exponentially sensitive to initial conditions.
Five pendulums start with θ₁ offset by ε = 0.001 rad; within 120
frames they diverge to completely different trajectories. The lower-
bob trails are pre-baked, stored as mesh edge sequences, and
revealed frame-by-frame via Build modifiers — the computational
equivalent of a slow-exposure light-painting photograph.

Equations of motion (Lagrangian, unequal m/L):
  Δ     = θ₂ − θ₁
  denom = L₁·(2M₁ + M₂ − M₂·cos(2Δ))
  α₁    = [−(2M₁+M₂)·g·sinθ₁ − M₂·g·sin(θ₁−2θ₂)
            − 2·sinΔ·M₂·(ω₂²L₂ + ω₁²L₁·cosΔ)] / denom
  α₂    = 2·sinΔ·[(M₁+M₂)·ω₁²L₁ + (M₁+M₂)·g·cosθ₁
            + M₂·ω₂²L₂·cosΔ] / (L₂·(2M₁+M₂−M₂·cos(2Δ)))

Integrator: Symplectic (semi-implicit) Euler — velocities updated
first, then positions. Conserves energy better than naive Euler
over long runs; suitable for visual demos.

Outside sources:
  Matplotlib double_pendulum.py  BSD-3-Clause  The Matplotlib Contributors
    https://github.com/matplotlib/matplotlib/blob/main/galleries/examples/animation/double_pendulum.py
    related: https://github.com/matplotlib/matplotlib  (scipy ecosystem)
  Lagrange, J.-L. "Mécanique analytique" (1788)  Public Domain
    https://archive.org/details/mcaniqueanalytiq00lagr
    related: https://archive.org/details/euleroperaomnia
"""

import bpy, bmesh, math
from bpy.app.handlers import persistent

# ── Constants ────────────────────────────────────────────────────────────────
SLUG      = "hf_double_pendulum"
N_PEND    = 5
L1, L2    = 1.0, 0.85
M1, M2    = 1.0, 0.75
G         = 9.81
DT        = 1.0 / 60.0
TH1_0     = math.radians(120.0)
TH2_0     = math.radians(150.0)
EPSILON   = 0.001
FRAME_END = 250
BOB_R     = 0.06

NEON = [
    (0.02, 0.85, 1.00),
    (1.00, 0.20, 0.90),
    (0.15, 1.00, 0.30),
    (1.00, 0.65, 0.05),
    (0.55, 0.15, 1.00),
]

# ── Physics ───────────────────────────────────────────────────────────────────
def _step(th1, om1, th2, om2):
    d   = th2 - th1
    sd  = math.sin(d)
    cd  = math.cos(d)
    s1  = math.sin(th1)
    c1  = math.cos(th1)
    s2  = math.sin(th2)
    den = 2.0 * M1 + M2 - M2 * math.cos(2.0 * d)
    if abs(den) < 1e-10:
        den = 1e-10
    al1 = (-(2*M1+M2)*G*s1 - M2*G*math.sin(th1-2*th2)
           - 2*sd*M2*(om2**2*L2 + om1**2*L1*cd)) / (L1 * den)
    al2 = (2*sd*((M1+M2)*om1**2*L1 + (M1+M2)*G*c1
           + M2*om2**2*L2*cd)) / (L2 * den)
    om1 += al1 * DT
    om2 += al2 * DT
    return th1 + om1*DT, om1, th2 + om2*DT, om2

def _bob_pos(th1, th2):
    x1 = L1 * math.sin(th1); y1 = -L1 * math.cos(th1)
    x2 = x1 + L2 * math.sin(th2); y2 = y1 - L2 * math.cos(th2)
    return (x1, y1, 0.0), (x2, y2, 0.0)

def _precompute():
    states = [(TH1_0 + i*EPSILON, 0.0, TH2_0, 0.0) for i in range(N_PEND)]
    traj = [states[:]]
    for _ in range(FRAME_END):
        states = [_step(*s) for s in states]
        traj.append(states[:])
    return traj

# ── Scene setup ───────────────────────────────────────────────────────────────
def _purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups,
                bpy.data.curves):
        for b in list(col):
            col.remove(b, do_unlink=True)

def _emission_mat(name, rgb, strength=12.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    emi = nt.nodes.new('ShaderNodeEmission')
    emi.inputs['Color'].default_value = (*rgb, 1.0)
    emi.inputs['Strength'].default_value = strength
    nt.links.new(emi.outputs['Emission'], out.inputs['Surface'])
    return mat

# ── Trail objects (pre-baked, Build modifier reveals edges per frame) ─────────
def _make_trail(idx, traj, mat):
    me = bpy.data.meshes.new(f"trail_{idx}")
    bm = bmesh.new()
    for frame_states in traj:
        _, bob2 = _bob_pos(*frame_states[idx][:2], *frame_states[idx][2:])
        bm.verts.new(bob2)
    bm.verts.ensure_lookup_table()
    for i in range(len(traj) - 1):
        bm.edges.new([bm.verts[i], bm.verts[i + 1]])
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(f"trail_{idx}", me)
    ob.data.materials.append(mat)
    bpy.context.collection.objects.link(ob)
    mod = ob.modifiers.new("Build", 'BUILD')
    mod.frame_start = 1
    mod.frame_duration = float(FRAME_END)
    mod.use_random_order = False
    # Wireframe render at 2 px for visible neon tube look
    ob.display_type = 'WIRE'
    return ob

def _make_arm(idx, mat):
    me = bpy.data.meshes.new(f"arm_{idx}")
    bm = bmesh.new()
    for _ in range(3):
        bm.verts.new((0, 0, 0))
    bm.verts.ensure_lookup_table()
    bm.edges.new([bm.verts[0], bm.verts[1]])
    bm.edges.new([bm.verts[1], bm.verts[2]])
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(f"arm_{idx}", me)
    ob.data.materials.append(mat)
    bpy.context.collection.objects.link(ob)
    ob.display_type = 'WIRE'
    return ob

# ── Frame handler ─────────────────────────────────────────────────────────────
_arm_obs: list = []
_traj: list = []

@persistent
def _on_frame(scene, _depsgraph=None):
    f = min(scene.frame_current, FRAME_END)
    states = _traj[f]
    for i, ob in enumerate(_arm_obs):
        th1, om1, th2, om2 = states[i]
        b1, b2 = _bob_pos(th1, th2)
        verts = ob.data.vertices
        verts[0].co = (0, 0, 0)
        verts[1].co = b1
        verts[2].co = b2
        ob.data.update()

# ── Main ──────────────────────────────────────────────────────────────────────
_purge()
_traj = _precompute()

pivot_me = bpy.data.meshes.new("pivot"); pivot_me.from_pydata([(0,0,0)],[],[])
pivot_ob = bpy.data.objects.new("pivot", pivot_me)
bpy.context.collection.objects.link(pivot_ob)

for i in range(N_PEND):
    col = NEON[i]
    mat = _emission_mat(f"neon_{i}", col, strength=10.0 + i * 0.5)
    _make_trail(i, _traj, mat)
    arm_mat = _emission_mat(f"arm_neon_{i}", col, strength=3.0)
    _arm_obs.append(_make_arm(i, arm_mat))

# camera
cam = bpy.data.cameras.new("Cam")
cam_ob = bpy.data.objects.new("Cam", cam)
cam_ob.location = (0, -5.5, -0.5); cam_ob.rotation_euler = (1.5708, 0, 0)
cam.lens = 35.0
bpy.context.collection.objects.link(cam_ob)
bpy.context.scene.camera = cam_ob

# EEVEE + scene
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = FRAME_END
bpy.context.scene.render.fps = 60
bpy.context.scene.world = bpy.data.worlds.new("World")
bpy.context.scene.world.color = (0, 0, 0)
bpy.context.scene.eevee.bloom_threshold   = 0.3
bpy.context.scene.eevee.bloom_intensity   = 1.2
bpy.context.scene.eevee.bloom_radius      = 5.0
bpy.context.scene.eevee.use_bloom         = True

# register handler and run frame 1
if _on_frame not in bpy.app.handlers.frame_change_pre:
    bpy.app.handlers.frame_change_pre.append(_on_frame)
bpy.context.scene.frame_set(1)
print(f"[{SLUG}] blueprint ready — {N_PEND} pendulums, {FRAME_END} frames.")
