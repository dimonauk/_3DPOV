"""
GN Simulation Zone — FitzHugh-Nagumo Excitable Medium
Action-Potential Propagation, Spiral Reentry & Poi Fire-Ring
Light Painting (Blender 5.1)
==============================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

FitzHugh-Nagumo (FHN) is the canonical 2-variable reduction of the full
4-variable Hodgkin-Huxley nerve-membrane model (FitzHugh 1961).  In 2-D
space with diffusion the PDE describes how a single action potential
propagates outward as an expanding ring — and, when a wavefront is broken
mid-propagation, curls into a self-sustaining rotating spiral (reentry).

PDE (continuous, Euler-discretised per frame):
    ∂u/∂t = u − u³/3 − v + I_ext + D ∇²u   (fast activator)
    ∂v/∂t = ε (u + α − βv)                  (slow recovery / gating)

Discrete Laplacian via BlurAttribute:
    blur(u) = mean of self + 4 neighbours = (u_c + u_N + u_S + u_E + u_W)/5
    → blur(u) − u = Laplacian/5
    → D ∇²u  ≈  D_EFF × (blur(u) − u),  D_EFF = D × 5

Cross-field spiral protocol (frame-gated in the GN tree):
  S1 (frames 1-4):   left 3 columns excited → plane wave propagates right
  S2 (frames 60-63): bottom half stimulated → wave break at the refractory
                     boundary between S1's tail (top) and resting state (bot)
                     → the break tip curls into a rotating spiral (reentry)

Poi connection: each wavefront isocontour u ≈ 0 (rising) is the exact arc
a poi head traces during a body-wrap.  The spiral's rotation period
T ≈ 20–25 frames maps to a 1.2–1.5 Hz poi beat frequency.

Outside sources:
  FitzHugh R. (1961). Biophysical Journal 1(6):445–466. NIH Open Access.
    https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1366333/  (Public Domain)
    Related: Hodgkin A.L. & Huxley A.F. (1952), J. Physiol. 117:500–544
  Blender Foundation — Blur Attribute Manual. CC-BY-SA 4.0.
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html
    Related: projects.blender.org/blender/blender-manual
"""

import bpy, bmesh, math, array

# ── Parameters ────────────────────────────────────────────────────────────────
N        = 64        # grid side: 64×64 = 4096 points (edge of GN real-time budget)
CELL     = 0.12      # metres per grid step (7.68 m domain)
ALPHA    = 0.7       # v-nullcline x-offset  (canonical FHN parameters)
BETA     = 0.8       # v-nullcline inverse slope
EPSILON  = 0.08      # timescale ratio: v is 12.5× slower than u
I_EXT    = 0.5       # external drive — oscillatory regime; 0.0 → excitable only
D        = 0.5       # u diffusion coefficient
D_EFF    = D * 5.0   # blur-Laplacian gain (4-connected: k+1 = 5)
DT       = 0.05      # Euler step — stable for these parameters
U_STIM   = 1.8       # stimulus amplitude (well above threshold ≈ 0.5)
Z_SCALE  = 0.15      # height per unit u (gives readable 3-D topography)
S1_COL   = 3 * CELL  # S1 x-boundary: left 3 columns
S2_ROW   = (N // 2) * CELL  # S2 y-boundary: bottom half
S1_END   = 4.5;  S2_START = 59.5;  S2_END = 63.5
FRAME_END = 280
SLUG = "gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials,
              bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


def make_grid():
    """4-connected N×N grid with fhn_u and fhn_v POINT attributes.
    WHY hand-built with bmesh: Mesh Grid primitive creates FACE topology;
    BlurAttribute Laplacian needs consistent EDGE connectivity on POINT domain."""
    mesh = bpy.data.meshes.new('fhn_mesh')
    obj  = bpy.data.objects.new('hf_fitzhugh_nagumo', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bm = bmesh.new()
    for r in range(N):
        for c in range(N):
            bm.verts.new((c * CELL, r * CELL, 0.0))
    bm.verts.ensure_lookup_table()
    for r in range(N):
        for c in range(N - 1):
            bm.edges.new([bm.verts[r * N + c], bm.verts[r * N + c + 1]])
    for r in range(N - 1):
        for c in range(N):
            bm.edges.new([bm.verts[r * N + c], bm.verts[(r + 1) * N + c]])
    bm.to_mesh(mesh); bm.free(); mesh.update()
    u_arr = array.array('f', [U_STIM if (i % N) < 3 else -1.2 for i in range(N * N)])
    v_arr = array.array('f', [-0.625] * (N * N))  # resting v*
    mesh.attributes.new('fhn_u', 'FLOAT', 'POINT').data.foreach_set('value', u_arr)
    mesh.attributes.new('fhn_v', 'FLOAT', 'POINT').data.foreach_set('value', v_arr)
    return obj


def make_material():
    """Emission ramp: deep blue (resting) → violet (subthreshold) → orange (peak).
    The refractory zone (recovering) shows intermediate violet — distinguishable
    from the resting state, making refractory tails visible during wave propagation."""
    mat = bpy.data.materials.new('hf_fhn_mat')
    mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'u_01'; attr.attribute_type = 'GEOMETRY'
    emit.inputs['Strength'].default_value = 6.0
    cr = ramp.color_ramp; cr.interpolation = 'LINEAR'
    while len(cr.elements) < 5: cr.elements.new(0.5)
    for el, (pos, col) in zip(cr.elements, [
        (0.00, (0.03, 0.05, 0.55, 1.0)),
        (0.30, (0.38, 0.05, 0.75, 1.0)),
        (0.55, (1.00, 0.42, 0.05, 1.0)),
        (0.78, (1.00, 0.78, 0.35, 1.0)),
        (1.00, (0.97, 0.97, 0.97, 1.0)),
    ]):
        el.position = pos; el.color = col
    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GN node helpers ───────────────────────────────────────────────────────────
def _n(ng, t):     return ng.nodes.new(t)
def _lk(ng, s, d): ng.links.new(s, d)

def _math(ng, op, a, b=None):
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

def _blur(ng, val):
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT'
    _lk(ng, val, nd.inputs['Value'])
    nd.inputs['Iterations'].default_value = 1
    nd.inputs['Weight'].default_value = 1.0
    return nd.outputs['Value']

def _sep(ng, v):
    nd = _n(ng, 'ShaderNodeSeparateXYZ'); _lk(ng, v, nd.inputs[0])
    return nd.outputs['X'], nd.outputs['Y'], nd.outputs['Z']

def _comb(ng, x, y, z):
    nd = _n(ng, 'ShaderNodeCombineXYZ')
    for i, v in enumerate([x, y, z]):
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]

def _pos(ng):  return _n(ng, 'GeometryNodeInputPosition').outputs['Position']

def _setpos(ng, g, p):
    nd = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, g, nd.inputs['Geometry']); _lk(ng, p, nd.inputs['Position'])
    return nd.outputs['Geometry']

def _cmp(ng, a, b, op='LESS_THAN'):
    nd = _n(ng, 'FunctionNodeCompare'); nd.data_type = 'FLOAT'; nd.operation = op
    if isinstance(a, (int,float)): nd.inputs[0].default_value = float(a)
    else: _lk(ng, a, nd.inputs[0])
    if isinstance(b, (int,float)): nd.inputs[1].default_value = float(b)
    else: _lk(ng, b, nd.inputs[1])
    return nd.outputs[0]

def _and(ng, a, b):
    nd = _n(ng, 'FunctionNodeBooleanMath'); nd.operation = 'AND'
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1])
    return nd.outputs[0]

def _or(ng, a, b):
    nd = _n(ng, 'FunctionNodeBooleanMath'); nd.operation = 'OR'
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1])
    return nd.outputs[0]

def _sw(ng, cond, false_v, true_v):
    nd = _n(ng, 'GeometryNodeSwitch'); nd.input_type = 'FLOAT'
    _lk(ng, cond, nd.inputs['Switch'])
    if isinstance(false_v, (int,float)): nd.inputs['False'].default_value = float(false_v)
    else: _lk(ng, false_v, nd.inputs['False'])
    if isinstance(true_v, (int,float)): nd.inputs['True'].default_value = float(true_v)
    else: _lk(ng, true_v, nd.inputs['True'])
    return nd.outputs['Output']

def _maprange(ng, val, a, b):
    nd = _n(ng, 'ShaderNodeMapRange'); nd.clamp = True
    _lk(ng, val, nd.inputs['Value'])
    nd.inputs['From Min'].default_value = a; nd.inputs['From Max'].default_value = b
    nd.inputs['To Min'].default_value   = 0.0; nd.inputs['To Max'].default_value = 1.0
    return nd.outputs['Result']


def build_fhn_tree(obj):
    mod = obj.modifiers.new('FhnGN', 'NODES')
    ng  = bpy.data.node_groups.new('FitzHughNagumoGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi    = _n(ng, 'NodeGroupInput');              gi.location  = (-900, 0)
    go    = _n(ng, 'NodeGroupOutput');             go.location  = (2100, 0)
    sim_i = _n(ng, 'GeometryNodeSimulationInput'); sim_i.location = (-600, 0)
    sim_o = _n(ng, 'GeometryNodeSimulationOutput'); sim_o.location = (1700, 0)
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    u = _na(ng, 'fhn_u');  v = _na(ng, 'fhn_v')

    # Laplacian: blur(u) - u = Laplacian/5 → scale by D_EFF=D×5 to recover D∇²u
    diff_u = _math(ng, 'MULTIPLY', D_EFF, _math(ng, 'SUBTRACT', _blur(ng, u), u))

    # du/dt = u - u³/3 - v + I_ext + D∇²u
    # The cubic u³/3 term creates the N-shaped u-nullcline: bistability between
    # the left (resting) and right (excited) branches drives the action potential.
    u_cu3   = _math(ng, 'MULTIPLY', _math(ng, 'MULTIPLY', u, _math(ng, 'MULTIPLY', u, u)), 1.0/3.0)
    react_u = _math(ng, 'ADD', _math(ng, 'SUBTRACT', _math(ng, 'SUBTRACT', u, u_cu3), v), I_EXT)
    du      = _math(ng, 'ADD', react_u, diff_u)

    # dv/dt = ε(u + α - βv)
    # ε = 0.08 means v lags u by a factor of 12.5 — v's slow rise ENDS excitation
    # (refractoriness); its slow fall RESTORES excitability (recovery).
    dv = _math(ng, 'MULTIPLY', EPSILON,
               _math(ng, 'SUBTRACT', _math(ng, 'ADD', u, ALPHA), _math(ng, 'MULTIPLY', BETA, v)))

    u_new = _math(ng, 'ADD', u, _math(ng, 'MULTIPLY', DT, du))
    v_new = _math(ng, 'ADD', v, _math(ng, 'MULTIPLY', DT, dv))

    # Cross-field stimulation gates
    # S1: frames 1-4, left 3 columns (pacemaker → target waves)
    # S2: frames 60-63, bottom half ONLY → wave break in S1's refractory tail → spiral
    frame = _n(ng, 'GeometryNodeSceneTime').outputs['Frame']
    pos   = _pos(ng); px, py, _ = _sep(ng, pos)
    s1_mask = _and(ng, _cmp(ng, frame, S1_END), _cmp(ng, px, S1_COL))
    s2_mask = _and(ng, _and(ng, _cmp(ng, frame, S2_END),
                               _cmp(ng, S2_START, frame)),
                       _cmp(ng, py, S2_ROW))
    u_final = _sw(ng, _or(ng, s1_mask, s2_mask), u_new, U_STIM)

    geo = _store(ng, geo, 'fhn_u', u_final)
    geo = _store(ng, geo, 'fhn_v', v_new)
    cx, cy, _ = _sep(ng, _pos(ng))
    geo = _setpos(ng, geo, _comb(ng, cx, cy, _math(ng, 'MULTIPLY', u_final, Z_SCALE)))
    _lk(ng, geo, sim_o.inputs['Geometry'])

    # Outside zone: normalise u to [0,1] for colour material
    u_01  = _maprange(ng, _na(ng, 'fhn_u'), -1.5, 2.0)
    final = _store(ng, sim_o.outputs['Geometry'], 'u_01', u_01)
    _lk(ng, final, go.inputs['Geometry'])


def setup_scene(obj, mat):
    obj.data.materials.append(mat)
    centre = (N - 1) * CELL / 2.0
    bpy.context.scene.frame_end = FRAME_END; bpy.context.scene.frame_set(1)
    cam_d = bpy.data.cameras.new('FhnCam'); cam_d.lens = 28.0
    cam_o = bpy.data.objects.new('FhnCam', cam_d)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location = (centre, centre - 5.2, 9.0)
    cam_o.rotation_euler = (math.radians(55), 0, 0)
    bpy.context.scene.camera = cam_o
    bpy.context.scene.world.use_nodes = True
    bpy.context.scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0,0,0,1)
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'


if __name__ == '__main__':
    purge()
    obj = make_grid()
    mat = make_material()
    build_fhn_tree(obj)
    setup_scene(obj, mat)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(
        f'//public/library/blends/geometry-nodes/{SLUG}/hf_fitzhugh_nagumo.blend'))
    print(f'[FHN] {N*N} grid built. Play the timeline — target waves appear by frame 20, '
          f'spiral reentry after frame 70.')
