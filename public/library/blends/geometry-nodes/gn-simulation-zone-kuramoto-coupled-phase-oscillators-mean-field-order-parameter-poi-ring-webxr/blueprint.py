"""
GN Simulation Zone — Kuramoto Coupled Phase Oscillators
Mean-Field Synchronisation, Order Parameter & Poi Ring (Blender 5.1)
======================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Yoshiki Kuramoto (1975) showed that N identical oscillators with a spread
of natural frequencies ωᵢ (drawn from a distribution g(ω)) and all-to-all
sinusoidal coupling spontaneously synchronise when the coupling K exceeds a
critical threshold K_c = 2 / (π g(0)).

For a Lorentzian g(ω) = (γ/π) / (ω² + γ²), the critical coupling is:
    K_c = 2 γ

The order parameter r ∈ [0, 1] measures global coherence:
    r · e^{iΨ} = (1/N) Σⱼ e^{iθⱼ}      (complex mean-field)

Mean-field reduction replaces the N-body sum:
    dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ)
with the two-variable form:
    dθᵢ/dt = ωᵢ + K·r·sin(Ψ − θᵢ)

In Geometry Nodes the mean-field computation collapses to one
AttributeStatistic node per axis:
    r·cos Ψ = AttributeStatistic(cos θ).Mean
    r·sin Ψ = AttributeStatistic(sin θ).Mean

Outside sources:
  Kuramoto Y. (1975) Lect. Notes Phys. 39, pp.420–422  Public Domain (maths)
    https://link.springer.com/chapter/10.1007/BFb0013365
    Related: Strogatz S.H. — nonlinear-dynamics.org; Ott-Antonsen reduction
  Strogatz S.H. (2000) "From Kuramoto to Crawford" Physica D 143:1-20
    CC-BY (Elsevier open-access archive; mathematical content PD)
    https://www.sciencedirect.com/science/article/pii/S0167278900000506
    Related: networkx/networkx (BSD-3-Clause) github.com/networkx/networkx
"""

import bpy, bmesh, math, array
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
N         = 64          # number of phase oscillators
RING_R    = 1.0         # ring radius in metres
GAMMA     = 0.5         # Lorentzian half-width  (K_c = 2γ = 1.0)
K         = 1.8         # coupling constant (1.8 × K_c → well synchronised)
DT        = 0.025       # Euler step (stable for these parameters)
FRAME_END = 240         # 240 frames @ 24 fps = 10 s animation
Z_SCALE   = 0.35        # Z height = Z_SCALE × r (order parameter lift)
SEED      = 42
SLUG      = ("gn-simulation-zone-kuramoto-coupled-phase-oscillators-"
             "mean-field-order-parameter-poi-ring-webxr")


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials,
              bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


# ── Node helpers ──────────────────────────────────────────────────────────────
def _n(ng, t):     return ng.nodes.new(t)
def _lk(ng, s, d): ng.links.new(s, d)


def _math(ng, op, a, b=None):
    """ShaderNodeMath works inside GN trees; use_clamp off for phase arithmetic."""
    nd = _n(ng, 'ShaderNodeMath'); nd.operation = op; nd.use_clamp = False
    for i, v in enumerate([a, b]):
        if v is None: continue
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]


def _na(ng, nm):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT'; nd.inputs['Name'].default_value = nm
    return nd.outputs['Attribute']


def _store(ng, g, nm, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = nm
    _lk(ng, g, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']


def _stat(ng, geo, attr):
    """AttributeStatistic.Mean over all POINT-domain FLOAT values."""
    nd = _n(ng, 'GeometryNodeAttributeStatistic')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    _lk(ng, geo, nd.inputs['Geometry'])
    _lk(ng, attr, nd.inputs['Attribute'])
    return nd.outputs['Mean']


def _comb(ng, x, y, z):
    nd = _n(ng, 'ShaderNodeCombineXYZ')
    for i, v in enumerate([x, y, z]):
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]


def _setpos(ng, g, p):
    nd = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, g, nd.inputs['Geometry']); _lk(ng, p, nd.inputs['Position'])
    return nd.outputs['Geometry']


# ── Geometry ──────────────────────────────────────────────────────────────────
def make_ring():
    rng   = np.random.default_rng(SEED)
    theta = rng.uniform(-math.pi, math.pi, N)
    # Lorentzian quantile: ω = γ·tan(π·(U − ½)) avoids scipy
    U     = rng.uniform(1e-4, 1 - 1e-4, N)
    omega = GAMMA * np.tan(math.pi * (U - 0.5))

    mesh = bpy.data.meshes.new('kuramoto_ring')
    obj  = bpy.data.objects.new('hf_kuramoto_poi', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for t in theta:
        bm.verts.new((RING_R * math.cos(float(t)), RING_R * math.sin(float(t)), 0.0))
    bm.to_mesh(mesh); bm.free(); mesh.update()

    def _set(nm, vals, dtype='FLOAT'):
        a = mesh.attributes.new(nm, dtype, 'POINT')
        a.data.foreach_set('value', [float(v) for v in vals])

    _set('theta',      theta)
    _set('omega',      omega)
    _set('cos_th',     np.cos(theta))
    _set('sin_th',     np.sin(theta))
    frac = ((theta + math.pi) / (2 * math.pi)) % 1.0
    _set('theta_frac', frac)
    return obj, theta.tolist(), omega.tolist()


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_gn_tree(obj):
    mod = obj.modifiers.new('KuramotoGN', 'NODES')
    ng  = bpy.data.node_groups.new('KuramotoGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput');               gi.location    = (-1400, 0)
    go    = _n(ng, 'NodeGroupOutput');              go.location    = (2800, 0)
    sim_i = _n(ng, 'GeometryNodeSimulationInput'); sim_i.location = (-900, 0)
    sim_o = _n(ng, 'GeometryNodeSimulationOutput'); sim_o.location = (2400, 0)
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    theta = _na(ng, 'theta');  omega = _na(ng, 'omega')

    # Store cos/sin of current phase so AttributeStatistic can read them
    cos_th = _math(ng, 'COSINE', theta)
    sin_th = _math(ng, 'SINE',   theta)
    geo_c  = _store(ng, geo,   'cos_th', cos_th)
    geo_s  = _store(ng, geo_c, 'sin_th', sin_th)

    # Mean-field: r·cos Ψ = <cos θ>,  r·sin Ψ = <sin θ>
    mean_cos = _stat(ng, geo_s, _na(ng, 'cos_th'))
    mean_sin = _stat(ng, geo_s, _na(ng, 'sin_th'))

    r   = _math(ng, 'SQRT', _math(ng, 'ADD',
                _math(ng, 'MULTIPLY', mean_cos, mean_cos),
                _math(ng, 'MULTIPLY', mean_sin, mean_sin)))
    psi = _math(ng, 'ARCTAN2', mean_sin, mean_cos)

    # Euler: θ_new = θ + Δt · (ω + K·r·sin(Ψ − θ))
    Kr        = _math(ng, 'MULTIPLY', K, r)
    coupling  = _math(ng, 'MULTIPLY', Kr, _math(ng, 'SINE',
                      _math(ng, 'SUBTRACT', psi, theta)))
    dtheta    = _math(ng, 'ADD', omega, coupling)
    theta_new = _math(ng, 'ADD', theta, _math(ng, 'MULTIPLY', DT, dtheta))

    # Normalised phase in [0, 1] for material colour mapping
    TWO_PI     = 2.0 * math.pi
    theta_norm = _math(ng, 'MULTIPLY', _math(ng, 'ADD', theta_new, math.pi), 1.0 / TWO_PI)
    # FLOOR-subtract = fract (avoids FRACTION enum uncertainty across Blender builds)
    theta_frac = _math(ng, 'SUBTRACT', theta_norm, _math(ng, 'FLOOR', theta_norm))

    # Update stored attributes
    geo_th  = _store(ng, geo_s,  'theta',      theta_new)
    geo_out = _store(ng, geo_th, 'theta_frac', theta_frac)

    # Set position: orbit on ring, Z lifted by order parameter r
    nx = _math(ng, 'MULTIPLY', RING_R, _math(ng, 'COSINE', theta_new))
    ny = _math(ng, 'MULTIPLY', RING_R, _math(ng, 'SINE',   theta_new))
    nz = _math(ng, 'MULTIPLY', Z_SCALE, r)
    geo_pos = _setpos(ng, geo_out, _comb(ng, nx, ny, nz))

    _lk(ng, geo_pos,                   sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])


# ── Material ──────────────────────────────────────────────────────────────────
def make_material(obj):
    mat = bpy.data.materials.new('kuramoto_emit')
    mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'theta_frac'
    # cobalt (0.13, 0.35, 0.80) → amber (1.00, 0.55, 0.10) gradient
    ramp.color_ramp.elements[0].color = (0.13, 0.35, 0.80, 1.0)
    ramp.color_ramp.elements[1].color = (1.00, 0.55, 0.10, 1.0)
    emit.inputs['Strength'].default_value = 12.0
    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── Scene ─────────────────────────────────────────────────────────────────────
def setup_scene():
    sc = bpy.context.scene
    sc.frame_start = 1; sc.frame_end = FRAME_END; sc.frame_set(1)
    sc.render.fps = 24
    # Camera: overhead look-down to see the ring orbits clearly
    cam_d = bpy.data.cameras.new('Cam')
    cam_o = bpy.data.objects.new('Camera', cam_d)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location = (0.0, 0.0, 4.5)
    cam_o.rotation_euler = (0.0, 0.0, 0.0)
    sc.camera = cam_o
    # Dark world
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0, 0, 0, 1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.0


def run():
    purge()
    obj, _theta, _omega = make_ring()
    build_gn_tree(obj)
    make_material(obj)
    setup_scene()
    print(f"[Kuramoto] Scene built — N={N}, K={K}, K_c={2*GAMMA:.2f}, "
          f"K/K_c={K/(2*GAMMA):.2f}. Play timeline to watch synchronisation emerge.")


run()
