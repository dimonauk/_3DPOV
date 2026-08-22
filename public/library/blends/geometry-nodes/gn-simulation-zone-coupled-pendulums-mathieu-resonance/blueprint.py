"""
GN Simulation Zone — Coupled Pendulums: Mathieu Parametric Resonance
=====================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

A chain of N=20 pendulums is evolved frame-by-frame inside a GN Simulation
Zone using the symplectic Euler (kick-drift) integrator.  Each pendulum
swings in its own vertical plane; adjacent pendulums are spring-coupled
across the horizontal axis, producing transverse wave modes.

Physics (dimensionless after dividing by pendulum length L):

  α_i = -(Ω₀²·f(t)) sin(θ_i) + K·(θ_{i-1} + θ_{i+1} − 2·θ_i) − γ·ω_i

  Ω₀² = g/L = 39.24 rad²/s²   (natural frequency squared)
  f(t) = 1 + 2·ε·sin(2·π·f_d·t) — Mathieu parametric driving
  K    = 5.0 rad/s²             (coupling spring constant)
  γ    = 0.012                  (velocity damping per step)
  ε    = 0.15                   (driving amplitude — near principal resonance)
  f_d  = Ω₀/(2π) ≈ 0.996 Hz   (principal Mathieu resonance: ω_d = Ω₀)

Symplectic Euler (kick-drift, dt = 1/24 s):
  ω_{t+1} = ω_t + α_t · dt          ← kick
  θ_{t+1} = θ_t + ω_{t+1} · dt      ← drift (uses NEW velocity → symplectic)

Boundary conditions:
  SampleIndex returns 0 for out-of-range indices when clamp=False.
  θ_{-1} = θ_N = 0 → both ends are fixed (Dirichlet = 0).

Bob 3-D position (pivot at (i·D, 0, 0)):
  x = i·D + L·sin(θ)
  y = 0
  z = -L·cos(θ)

State stored as FLOAT named attributes on the POINT domain:
  'theta'  — pendulum angle (rad) from vertical
  'omega'  — angular velocity (rad/s)

Outside sources:
  Blender Manual — Simulation Zone  CC-BY-SA-4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    related: https://projects.blender.org/blender/blender
  NIST Digital Library of Mathematical Functions — Ch. 28: Mathieu Functions  Public Domain
    https://dlmf.nist.gov/28
    related: https://github.com/NIST-DLMF
  OpenStax University Physics Vol.1 Ch. 15 — Oscillations  CC BY 4.0
    https://openstax.org/books/university-physics-volume-1/pages/15-introduction
    related: https://github.com/openstax
"""

import bpy, bmesh
from mathutils import Vector
import math

# ---------------------------------------------------------------------------
# Parameters (all constants at the top so Dimona can tweak without reading code)
# ---------------------------------------------------------------------------
N           = 20         # number of pendulums
L           = 0.25       # pendulum length (m)
D           = 0.30       # horizontal pivot spacing (m)
G_ACC       = 9.81       # gravitational acceleration (m/s²)
OMEGA0_SQ   = G_ACC / L  # ≈ 39.24 rad²/s²
K_COUPLE    = 5.0        # coupling spring constant (rad/s²)
DAMPING     = 0.012      # velocity damping per step (dimensionless)
DT          = 1.0 / 24.0 # seconds per Blender frame (24 fps)
DRIVE_FREQ  = math.sqrt(OMEGA0_SQ) / (2.0 * math.pi)  # ≈ 0.996 Hz
DRIVE_AMP   = 0.15       # dimensionless driving amplitude ε
BOB_RADIUS  = 0.04       # display sphere radius (m)
INIT_AMP    = 0.25       # initial half-sine mode amplitude (rad)


def make_pendulum_mesh(scene: bpy.types.Scene) -> bpy.types.Object:
    """Create N pivot-point vertices and initialise theta/omega attributes."""
    bm = bmesh.new()
    for i in range(N):
        bm.verts.new(Vector((i * D, 0.0, 0.0)))

    me = bpy.data.meshes.new("PendulumMesh")
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new("CoupledPendulums", me)
    scene.collection.objects.link(obj)

    # Half-sine first-mode excitation: θ_i = A·sin(π·i/(N−1))
    theta_vals = [INIT_AMP * math.sin(math.pi * i / (N - 1)) for i in range(N)]
    omega_vals = [0.0] * N

    th = me.attributes.new("theta", "FLOAT", "POINT")
    th.data.foreach_set("value", theta_vals)

    om = me.attributes.new("omega", "FLOAT", "POINT")
    om.data.foreach_set("value", omega_vals)

    return obj


def _link(tree, from_node, from_sock, to_node, to_sock):
    tree.links.new(from_node.outputs[from_sock], to_node.inputs[to_sock])


def _math(tree, op, loc, label=""):
    nd = tree.nodes.new("ShaderNodeMath")
    nd.operation = op
    nd.location = loc
    nd.label = label
    nd.use_clamp = False
    return nd


def _float(tree, val, loc):
    nd = tree.nodes.new("ShaderNodeValue")
    nd.outputs[0].default_value = val
    nd.location = loc
    return nd


def build_pendulum_tree(obj: bpy.types.Object) -> None:
    """Wire the Geometry Nodes tree for Coupled Pendulums simulation."""
    tree = bpy.data.node_groups.new("CoupledPendulumsGN", "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    # -- I/O --
    gi  = nodes.new("NodeGroupInput");  gi.location  = (-900, 0)
    go  = nodes.new("NodeGroupOutput"); go.location  = (1400, 0)
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    # -- Simulation Zone pair --
    si  = nodes.new("GeometryNodeSimulationInput");  si.location  = (-600,  0)
    so  = nodes.new("GeometryNodeSimulationOutput"); so.location  = (1100,  0)
    si.pair_with_output(so)
    _link(tree, gi, "Geometry", si, "Geometry")

    # -- Named attribute readers (inside zone) --
    na_th = nodes.new("GeometryNodeInputNamedAttribute")
    na_th.data_type = "FLOAT"; na_th.location = (-380, 120)
    na_th.inputs["Name"].default_value = "theta"

    na_om = nodes.new("GeometryNodeInputNamedAttribute")
    na_om.data_type = "FLOAT"; na_om.location = (-380, 0)
    na_om.inputs["Name"].default_value = "omega"

    idx_nd = nodes.new("GeometryNodeInputIndex"); idx_nd.location = (-600, -120)

    # -- Sample neighbour thetas --
    sub1 = _math(tree, "SUBTRACT", (-420, -200), "i-1")
    sub1.inputs[1].default_value = 1.0
    _link(tree, idx_nd, "Index", sub1, 0)

    add1 = _math(tree, "ADD", (-420, -320), "i+1")
    add1.inputs[1].default_value = 1.0
    _link(tree, idx_nd, "Index", add1, 0)

    # SampleIndex for prev theta (i-1); clamp=False → returns 0 at boundary
    samp_prev = nodes.new("GeometryNodeSampleIndex")
    samp_prev.data_type = "FLOAT"; samp_prev.domain = "POINT"
    samp_prev.location = (-200, -200)
    _link(tree, si, "Geometry", samp_prev, "Geometry")
    _link(tree, na_th, "Attribute", samp_prev, "Value")
    _link(tree, sub1, 0, samp_prev, "Index")

    samp_next = nodes.new("GeometryNodeSampleIndex")
    samp_next.data_type = "FLOAT"; samp_next.domain = "POINT"
    samp_next.location = (-200, -320)
    _link(tree, si, "Geometry", samp_next, "Geometry")
    _link(tree, na_th, "Attribute", samp_next, "Value")
    _link(tree, add1, 0, samp_next, "Index")

    # -- Coupling force: K·(θ_prev + θ_next − 2·θ) --
    pn_sum  = _math(tree, "ADD",      (0,  -240), "prev+next")
    two_th  = _math(tree, "MULTIPLY", (0,  -360), "2·theta")
    two_th.inputs[1].default_value = 2.0
    lap     = _math(tree, "SUBTRACT", (200,-300), "Laplacian θ")
    couple  = _math(tree, "MULTIPLY", (400,-300), "couple_force")
    couple.inputs[1].default_value = K_COUPLE

    _link(tree, samp_prev, "Value", pn_sum, 0)
    _link(tree, samp_next, "Value", pn_sum, 1)
    _link(tree, na_th, "Attribute", two_th, 0)
    _link(tree, pn_sum, 0, lap, 0)
    _link(tree, two_th, 0, lap, 1)
    _link(tree, lap, 0, couple, 0)

    # -- Parametric driving: f(t) = 1 + 2·ε·sin(2π·f_d·t) --
    stime = nodes.new("GeometryNodeInputSceneTime"); stime.location = (-600, 300)
    scale_t = _math(tree, "MULTIPLY", (-400, 300), "2π·f_d·t")
    scale_t.inputs[1].default_value = 2.0 * math.pi * DRIVE_FREQ
    _link(tree, stime, "Seconds", scale_t, 0)

    sin_t  = _math(tree, "SINE",     (-200, 300), "sin(2π f_d t)")
    _link(tree, scale_t, 0, sin_t, 0)

    eps_m  = _math(tree, "MULTIPLY", (0, 300), "2ε·sin")
    eps_m.inputs[1].default_value = 2.0 * DRIVE_AMP
    _link(tree, sin_t, 0, eps_m, 0)

    om0_mod = _math(tree, "MULTIPLY", (200, 300), "Ω₀²·ε·mod")
    om0_mod.inputs[1].default_value = OMEGA0_SQ
    _link(tree, eps_m, 0, om0_mod, 0)

    om0_t  = _math(tree, "ADD", (400, 300), "Ω₀²(t)")
    om0_t.inputs[1].default_value = OMEGA0_SQ
    _link(tree, om0_mod, 0, om0_t, 0)

    # -- Gravity restoring: −Ω₀²(t)·sin(θ) --
    sin_th = _math(tree, "SINE",     (0,  120), "sin(θ)")
    _link(tree, na_th, "Attribute", sin_th, 0)

    grav_r = _math(tree, "MULTIPLY", (200, 200), "Ω₀²·sin(θ)")
    _link(tree, om0_t, 0, grav_r, 0)
    _link(tree, sin_th, 0, grav_r, 1)

    grav_f = _math(tree, "SUBTRACT", (400, 200), "−grav")
    grav_f.inputs[0].default_value = 0.0
    _link(tree, grav_r, 0, grav_f, 1)

    # -- Damping: −γ·ω --
    damp_f = _math(tree, "MULTIPLY", (200, 0), "−γ·ω")
    damp_f.inputs[1].default_value = -DAMPING
    _link(tree, na_om, "Attribute", damp_f, 0)

    # -- Total angular acceleration α --
    alp1 = _math(tree, "ADD", (600, 250), "α grav+couple")
    _link(tree, grav_f, 0, alp1, 0)
    _link(tree, couple, 0, alp1, 1)

    alpha = _math(tree, "ADD", (600, 100), "α total")
    _link(tree, alp1, 0, alpha, 0)
    _link(tree, damp_f, 0, alpha, 1)

    # -- Symplectic Euler: kick then drift --
    alp_dt   = _math(tree, "MULTIPLY", (800, 100), "α·dt")
    alp_dt.inputs[1].default_value = DT
    _link(tree, alpha, 0, alp_dt, 0)

    om_new   = _math(tree, "ADD", (800, 0), "ω_{t+1}")
    _link(tree, na_om, "Attribute", om_new, 0)
    _link(tree, alp_dt, 0, om_new, 1)

    om_dt    = _math(tree, "MULTIPLY", (800, -120), "ω_{t+1}·dt")
    om_dt.inputs[1].default_value = DT
    _link(tree, om_new, 0, om_dt, 0)

    th_new   = _math(tree, "ADD", (800, -240), "θ_{t+1}")
    _link(tree, na_th, "Attribute", th_new, 0)
    _link(tree, om_dt, 0, th_new, 1)

    # -- Store updated state --
    st_th = nodes.new("GeometryNodeStoreNamedAttribute")
    st_th.data_type = "FLOAT"; st_th.domain = "POINT"
    st_th.location = (950, 0)
    st_th.inputs["Name"].default_value = "theta"
    _link(tree, si, "Geometry", st_th, "Geometry")
    _link(tree, th_new, 0, st_th, "Value")

    st_om = nodes.new("GeometryNodeStoreNamedAttribute")
    st_om.data_type = "FLOAT"; st_om.domain = "POINT"
    st_om.location = (950, -120)
    st_om.inputs["Name"].default_value = "omega"
    _link(tree, st_th, "Geometry", st_om, "Geometry")
    _link(tree, om_new, 0, st_om, "Value")

    # -- Bob 3-D position: (i·D + L·sin(θ), 0, -L·cos(θ)) --
    idx_f  = _math(tree, "MULTIPLY", (800, -400), "i·D")
    idx_f.inputs[1].default_value = D
    _link(tree, idx_nd, "Index", idx_f, 0)

    sin_new = _math(tree, "SINE",     (800, -520), "sin(θ_new)")
    _link(tree, th_new, 0, sin_new, 0)

    cos_new = _math(tree, "COSINE",   (800, -600), "cos(θ_new)")
    _link(tree, th_new, 0, cos_new, 0)

    bx_off = _math(tree, "MULTIPLY", (950, -520), "L·sin")
    bx_off.inputs[1].default_value = L
    _link(tree, sin_new, 0, bx_off, 0)

    bz_off = _math(tree, "MULTIPLY", (950, -600), "−L·cos")
    bz_off.inputs[1].default_value = -L
    _link(tree, cos_new, 0, bz_off, 0)

    bx = _math(tree, "ADD", (1050, -520), "bob_x")
    _link(tree, idx_f, 0, bx, 0)
    _link(tree, bx_off, 0, bx, 1)

    cxyz = nodes.new("ShaderNodeCombineXYZ"); cxyz.location = (1100, -560)
    cxyz.inputs["Y"].default_value = 0.0
    _link(tree, bx, 0, cxyz, "X")
    _link(tree, bz_off, 0, cxyz, "Z")

    setpos = nodes.new("GeometryNodeSetPosition"); setpos.location = (1050, -80)
    _link(tree, st_om, "Geometry", setpos, "Geometry")
    _link(tree, cxyz, "Vector", setpos, "Position")

    # -- Instance bob spheres --
    sphere = nodes.new("GeometryNodeMeshIcoSphere"); sphere.location = (900, -720)
    sphere.inputs["Radius"].default_value = BOB_RADIUS
    sphere.inputs["Subdivisions"].default_value = 2

    inst = nodes.new("GeometryNodeInstanceOnPoints"); inst.location = (1200, -200)
    _link(tree, setpos, "Geometry", inst, "Points")
    _link(tree, sphere, "Mesh", inst, "Instance")
    inst.inputs["Scale"].default_value = (1.0, 1.0, 1.0)

    _link(tree, inst, "Instances", so, "Geometry")
    _link(tree, so, "Geometry", go, "Geometry")

    mod = obj.modifiers.new("CoupledPendulumsGN", "NODES")
    mod.node_group = tree


def setup_camera_and_light(scene: bpy.types.Scene) -> None:
    cam_data = bpy.data.cameras.new("PendulumCam")
    cam = bpy.data.objects.new("PendulumCam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (N * D / 2 - D / 2, -5.0, -0.5)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    scene.collection.objects.link(sun)
    sun.location = (3.0, -3.0, 5.0)


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = 300
    scene.render.fps  = 24

    obj = make_pendulum_mesh(scene)
    build_pendulum_tree(obj)
    setup_camera_and_light(scene)

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Save blend
    bpy.ops.wm.save_as_mainfile(
        filepath="//hf_pendulums.blend",
        check_existing=False,
    )
    print("CoupledPendulums: scene built — bake via Properties > Geometry Nodes Cache > Bake All")


if __name__ == "__main__":
    main()
