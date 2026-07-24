"""
GN Simulation Zone + Repeat Zone — Kelvin-Helmholtz Vortex Filament Sheet
& Birkhoff-Rott Equation: Shear-Flow Spiral Roll-Up for Light Painting
=======================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

When two fluid layers slide past each other at different velocities, any
small perturbation at the interface amplifies exponentially — the Kelvin-
Helmholtz instability.  In the potential-flow limit the interface is
represented exactly by a sheet of discrete vortex filaments; their
evolution is governed by the Birkhoff-Rott equation (Moore 1979):

    d(z̄_k*)/dt = (1/2πi) Σ_{j≠k} Γ_j / (z_k − z_j)

where z_k = x_k + iy_k is the complex filament position, bar denotes
complex conjugate, and Γ_j = Γ/N is the circulation per filament.  To
prevent singularity when z_k → z_j the Krasny (1986) desingularisation
replaces r² → r² + δ² in the denominator.

In real 2-D form, the velocity induced at filament i by filament j is:
    u_x(i←j) =  Γ/(2π N) · (y_i − y_j) / (r²_ij + δ²)   (1 − δ_{ij})
    u_y(i←j) = −Γ/(2π N) · (x_i − x_j) / (r²_ij + δ²)   (1 − δ_{ij})

The GN tree implements this as:
  Simulation Zone (outer) — maintains px, py state per frame
    Reset vx, vy accumulators to 0.0
    Repeat Zone (N iterations j=0..N−1) — accumulates Biot-Savart sum
      Per iteration j: SampleIndex reads (x_j, y_j); vectorised over all i
      dvx_i += Γ/(2πN) · dy_ij / r²_ij · mask(i≠j)
      dvy_i += −Γ/(2πN) · dx_ij / r²_ij · mask(i≠j)
    Euler integrate: px += vx·dt, py += vy·dt
    Set Position: visual coords = physics coords / (2π)
  Outside zone: MeshToCurve → CurveToMesh (hex tube, radius 0.012)

Outside sources:
  Blender Foundation — Simulation Zone Manual   CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    related: projects.blender.org/blender/blender-manual
  Blender Foundation — Repeat Zone Manual   CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/repeat_zone.html
    related: projects.blender.org/blender/blender-manual
  Lord Kelvin (William Thomson) — "Hydrokinetic solutions and observations"
    Phil. Mag. 42 (1871) pp.362-377   Public Domain
    https://www.biodiversitylibrary.org/item/18369
    related: archive.org/details/mathematicalphys01kelv
  Krasny, R. — "Vortex sheet desingularisation by the point vortex method"
    Unpublished notes, U Michigan, adapted in public-domain course materials
    https://dept.math.lsa.umich.edu/~krasny/  (see lecture notes, CC-style)
    related: fluid.caltech.edu/resources/course-notes
"""

import bpy, bmesh, math, array

# ── Parameters ─────────────────────────────────────────────────────────────
N         = 24          # filament count (N² = 576 Biot-Savart pairs per frame)
EPSILON   = 0.12        # initial sinusoidal perturbation amplitude
DELTA     = 0.35        # Krasny core radius δ (0 → singular; 0.3-0.5 → smooth rollup)
DT        = 0.018       # Euler time step (reduce for accuracy; increase for drama)
FRAME_END = 200
L         = 2 * math.pi  # domain period [0, L)
SLUG      = "gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups,
              bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


def make_vortex_polyline() -> bpy.types.Object:
    """
    N vertices connected as a polyline (edges k→k+1).
    Initial positions: x_k = k·L/N, y_k = EPSILON·sin(2π·k/N).
    Stores px, py (physics coordinates) and vx, vy (velocity accumulators).
    Polyline gives MeshToCurve a connected spline to sweep the tube over.
    """
    mesh = bpy.data.meshes.new('kh_mesh')
    obj  = bpy.data.objects.new('kh_vortex_sheet', mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    verts = []
    for k in range(N):
        x = k * L / N
        y = EPSILON * math.sin(2 * math.pi * k / N)
        verts.append(bm.verts.new((x / L, y, 0.0)))   # visual ≈ x/L ∈ [0,1]
    bm.verts.ensure_lookup_table()
    for k in range(N - 1):
        bm.edges.new([verts[k], verts[k + 1]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    px = array.array('f', [k * L / N for k in range(N)])
    py = array.array('f', [EPSILON * math.sin(2 * math.pi * k / N) for k in range(N)])
    vx = array.array('f', [0.0] * N)
    vy = array.array('f', [0.0] * N)
    for nm, data in [('px', px), ('py', py), ('vx', vx), ('vy', vy)]:
        a = mesh.attributes.new(nm, 'FLOAT', 'POINT')
        a.data.foreach_set('value', data)
    return obj


def make_material(obj: bpy.types.Object):
    """
    Emission tube: object-space Y (∝ py) drives a three-stop colour ramp.
    Blue (y < 0, lower fluid) → white (interface) → orange (y > 0, upper fluid).
    The ramp reads raw object Y so the spiral colouring evolves naturally.
    """
    mat = bpy.data.materials.new('kh_tube')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    tc   = nt.nodes.new('ShaderNodeTexCoord')
    sep  = nt.nodes.new('ShaderNodeSeparateXYZ')
    mr   = nt.nodes.new('ShaderNodeMapRange')

    mr.inputs['From Min'].default_value = -0.25
    mr.inputs['From Max'].default_value =  0.25

    cr = ramp.color_ramp; cr.interpolation = 'B_SPLINE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.03, 0.15, 0.85, 1)
    cr.elements[1].position = 0.5; cr.elements[1].color = (0.95, 0.92, 0.88, 1)
    cr.elements.new(1.0);           cr.elements[2].color = (1.00, 0.42, 0.04, 1)

    emit.inputs['Strength'].default_value = 9.0

    nt.links.new(tc.outputs['Object'],      sep.inputs['Vector'])
    nt.links.new(sep.outputs['Y'],          mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],     emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'],  out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── GN node helpers ─────────────────────────────────────────────────────────
def _n(ng, t):          return ng.nodes.new(t)
def _lk(ng, s, d):      ng.links.new(s, d)

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

def _sample(ng, geo, val, idx):
    nd = _n(ng, 'GeometryNodeSampleIndex')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    _lk(ng, geo, nd.inputs['Geometry'])
    _lk(ng, val, nd.inputs['Value'])
    _lk(ng, idx, nd.inputs['Index'])
    return nd.outputs[0]

def _store(ng, geo, nm, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = nm
    _lk(ng, geo, nd.inputs['Geometry'])
    if isinstance(val, (int, float)): nd.inputs['Value'].default_value = float(val)
    else: _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']

def _sw(ng, cond, fv, tv):
    """Returns fv when cond=False, tv when cond=True."""
    nd = _n(ng, 'GeometryNodeSwitch'); nd.input_type = 'FLOAT'
    _lk(ng, cond, nd.inputs[0])
    for i, v in [(1, fv), (2, tv)]:
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]

def _cmp_int(ng, a, b, op):
    nd = _n(ng, 'FunctionNodeCompare')
    nd.data_type = 'INT'; nd.operation = op
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1])
    return nd.outputs['Result']


# ── GN Simulation + Repeat Zone ─────────────────────────────────────────────
def build_kh_tree(obj: bpy.types.Object):
    """
    Simulation Zone (stateful frame update):
      1. Reset vx, vy to 0.0
      2. Repeat Zone N times (j = 0 .. N−1):
           Read xj = SampleIndex(px, j), yj = SampleIndex(py, j)
           dx, dy = px_i − xj, py_i − yj   (per-point)
           r² = dx² + dy² + δ²   (Krasny regularisation)
           mask = 1.0 if Index ≠ j else 0.0
           dvx += (1/N) · dy / r² · mask
           dvy += −(1/N) · dx / r² · mask
      3. Euler: px += vx·dt, py += vy·dt
      4. Set Position = (px/2π, py/2π, 0)
    Outside zone: MeshToCurve → CurveToMesh tube.
    """
    mod = obj.modifiers.new('KH_BR', 'NODES')
    ng  = bpy.data.node_groups.new('KHBirkhoffRott', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi = _n(ng, 'NodeGroupInput')
    go = _n(ng, 'NodeGroupOutput')

    sim_i = _n(ng, 'GeometryNodeSimulationInput')
    sim_o = _n(ng, 'GeometryNodeSimulationOutput')
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    # Reset velocity accumulators each frame
    geo = _store(ng, geo, 'vx', 0.0)
    geo = _store(ng, geo, 'vy', 0.0)

    # ── Repeat Zone: N Biot-Savart accumulations ──────────────────────────
    rep_o = _n(ng, 'GeometryNodeRepeatOutput')
    rep_o.repeat_items.new('GEOMETRY', 'State')
    rep_i = _n(ng, 'GeometryNodeRepeatInput')
    rep_i.pair_with_output(rep_o)
    rep_i.inputs['Iterations'].default_value = N
    _lk(ng, geo, rep_i.inputs['State'])

    j     = rep_i.outputs['Iteration']    # current j (INT scalar)
    geo_s = rep_i.outputs['State']        # geometry state for this iteration

    # Read filament j's physics coordinates (scalar)
    xj = _sample(ng, geo_s, _na(ng, 'px'), j)
    yj = _sample(ng, geo_s, _na(ng, 'py'), j)

    # Per-point displacement from j to all i
    dx  = _math(ng, 'SUBTRACT', _na(ng, 'px'), xj)
    dy  = _math(ng, 'SUBTRACT', _na(ng, 'py'), yj)
    r2  = _math(ng, 'ADD',
                _math(ng, 'ADD', _math(ng, 'MULTIPLY', dx, dx),
                                 _math(ng, 'MULTIPLY', dy, dy)),
                DELTA * DELTA)

    # Self-exclusion: mask = 0.0 when Index == j
    idx = _n(ng, 'GeometryNodeInputIndex').outputs['Index']
    mk  = _sw(ng, _cmp_int(ng, idx, j, 'EQUAL'), 1.0, 0.0)

    # Γ/(2πN) = 1/N  (total circulation = 2π, so Γ_j = 2π/N, divide by 2π)
    G = 1.0 / N
    dvx = _math(ng, 'MULTIPLY',
                _math(ng, 'MULTIPLY', _math(ng, 'DIVIDE', dy, r2), mk), G)
    dvy = _math(ng, 'MULTIPLY',
                _math(ng, 'MULTIPLY',
                      _math(ng, 'DIVIDE', _math(ng, 'MULTIPLY', dx, -1.0), r2), mk), G)

    # Accumulate and pass to next iteration
    geo_s = _store(ng, geo_s, 'vx', _math(ng, 'ADD', _na(ng, 'vx'), dvx))
    geo_s = _store(ng, geo_s, 'vy', _math(ng, 'ADD', _na(ng, 'vy'), dvy))
    _lk(ng, geo_s, rep_o.inputs['State'])
    geo = rep_o.outputs['State']

    # ── Euler integration ─────────────────────────────────────────────────
    px_n = _math(ng, 'ADD', _na(ng, 'px'), _math(ng, 'MULTIPLY', _na(ng, 'vx'), DT))
    py_n = _math(ng, 'ADD', _na(ng, 'py'), _math(ng, 'MULTIPLY', _na(ng, 'vy'), DT))
    geo  = _store(ng, _store(ng, geo, 'px', px_n), 'py', py_n)

    # ── Set visual position (scale physics [0,2π] → [0,1]) ───────────────
    SVZ  = 1.0 / L          # 1/(2π)
    cxyz = _n(ng, 'ShaderNodeCombineXYZ')
    _lk(ng, _math(ng, 'MULTIPLY', px_n, SVZ), cxyz.inputs['X'])
    _lk(ng, _math(ng, 'MULTIPLY', py_n, SVZ), cxyz.inputs['Y'])
    sp = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, geo, sp.inputs['Geometry'])
    _lk(ng, cxyz.outputs['Vector'], sp.inputs['Position'])
    _lk(ng, sp.outputs['Geometry'], sim_o.inputs['Geometry'])

    # ── Outside sim zone: tube sweep ─────────────────────────────────────
    geo_out = sim_o.outputs['Geometry']
    m2c = _n(ng, 'GeometryNodeMeshToCurve')
    _lk(ng, geo_out, m2c.inputs['Mesh'])
    circ = _n(ng, 'GeometryNodeCurvePrimitiveCircle')
    circ.inputs['Resolution'].default_value = 6
    circ.inputs['Radius'].default_value     = 0.012
    c2m = _n(ng, 'GeometryNodeCurveToMesh')
    c2m.inputs['Fill Caps'].default_value = False
    _lk(ng, m2c.outputs['Curve'],   c2m.inputs['Curve'])
    _lk(ng, circ.outputs['Curve'], c2m.inputs['Profile Curve'])
    _lk(ng, c2m.outputs['Mesh'],   go.inputs['Geometry'])


def main():
    import os
    purge()
    obj = make_vortex_polyline()
    make_material(obj)
    build_kh_tree(obj)

    # Camera: top-down on the evolving spiral, centred on x=0.5, y≈0
    bpy.ops.object.camera_add(location=(0.5, 0.0, 3.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.camera = cam
    bpy.context.scene.frame_end = FRAME_END

    bpy.context.scene.render.engine               = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom             = True
    bpy.context.scene.eevee.bloom_intensity       = 0.9
    bpy.context.scene.eevee.bloom_threshold       = 0.3
    bpy.context.scene.eevee.bloom_radius          = 4.0

    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new('KHWorld')
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0, 0, 0, 1)
        bg.inputs['Strength'].default_value = 0.0

    out = os.path.join(bpy.path.abspath('//'),
                       f'public/library/blends/geometry-nodes/{SLUG}/')
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(
        filepath=os.path.join(out, 'hf_kh_vortex.blend'))
    print(f'[blueprint] → {out}hf_kh_vortex.blend')


if __name__ == '__main__':
    main()
