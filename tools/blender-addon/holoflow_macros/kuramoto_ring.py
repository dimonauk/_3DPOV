"""
holoflow_macros/kuramoto_ring.py
Reusable helper: build a Kuramoto GN Simulation Zone on any POINTS object.

Usage
-----
    from holoflow_macros.kuramoto_ring import add_kuramoto_modifier
    add_kuramoto_modifier(obj, N=64, K=1.8, gamma=0.5, DT=0.025)

The modifier reads 'theta' and 'omega' FLOAT POINT attributes that must
already exist on `obj`.  It stores 'theta', 'cos_th', 'sin_th', and
'theta_frac' each frame and sets Z = Z_SCALE * r (order parameter lift).

Blender 5.1 · CC0 · Holoflow Studio
"""

import bpy, math

RING_R  = 1.0
Z_SCALE = 0.35


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


def _stat(ng, geo, attr):
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


def add_kuramoto_modifier(obj, K=1.8, DT=0.025,
                          ring_r=RING_R, z_scale=Z_SCALE):
    """Add a Kuramoto Simulation Zone modifier to `obj`.

    Requires FLOAT POINT attributes 'theta' and 'omega' on the mesh.
    """
    mod = obj.modifiers.new('KuramotoGN', 'NODES')
    ng  = bpy.data.node_groups.new('KuramotoGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput')
    go    = _n(ng, 'NodeGroupOutput')
    sim_i = _n(ng, 'GeometryNodeSimulationInput')
    sim_o = _n(ng, 'GeometryNodeSimulationOutput')
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    theta = _na(ng, 'theta');  omega = _na(ng, 'omega')
    geo_c  = _store(ng, geo,   'cos_th', _math(ng, 'COSINE', theta))
    geo_s  = _store(ng, geo_c, 'sin_th', _math(ng, 'SINE',   theta))

    mc  = _stat(ng, geo_s, _na(ng, 'cos_th'))
    ms  = _stat(ng, geo_s, _na(ng, 'sin_th'))
    r   = _math(ng, 'SQRT', _math(ng, 'ADD',
                _math(ng, 'MULTIPLY', mc, mc), _math(ng, 'MULTIPLY', ms, ms)))
    psi = _math(ng, 'ARCTAN2', ms, mc)

    theta_new = _math(ng, 'ADD', theta,
                      _math(ng, 'MULTIPLY', DT,
                            _math(ng, 'ADD', omega,
                                  _math(ng, 'MULTIPLY', K,
                                        _math(ng, 'MULTIPLY', r,
                                              _math(ng, 'SINE',
                                                    _math(ng, 'SUBTRACT', psi, theta)))))))

    TWO_PI = 2.0 * math.pi
    tn     = _math(ng, 'MULTIPLY', _math(ng, 'ADD', theta_new, math.pi), 1.0 / TWO_PI)
    tf     = _math(ng, 'SUBTRACT', tn, _math(ng, 'FLOOR', tn))

    geo_th  = _store(ng, geo_s,  'theta',      theta_new)
    geo_out = _store(ng, geo_th, 'theta_frac', tf)

    nx = _math(ng, 'MULTIPLY', ring_r, _math(ng, 'COSINE', theta_new))
    ny = _math(ng, 'MULTIPLY', ring_r, _math(ng, 'SINE',   theta_new))
    nz = _math(ng, 'MULTIPLY', z_scale, r)
    geo_pos = _setpos(ng, geo_out, _comb(ng, nx, ny, nz))

    _lk(ng, geo_pos,                   sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])
    return mod
