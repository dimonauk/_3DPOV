"""
GN Simulation Zone — 2D Wave Equation: Chladni Standing Waves (Blender 5.1)
=============================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Leapfrog (Störmer-Verlet) discretisation of the 2-D wave PDE on a
GRID_N×GRID_N quad mesh with Dirichlet (fixed-end) boundary conditions:

    u[t+1] = 2u[t] − u[t−1] + C_SQ · ∇²ₕu[t]

C_SQ = c²(dt/dx)² must satisfy the 2-D CFL condition C_SQ ≤ 0.5.

∇²ₕu ≈ 4·(BlurAttribute_mean − u)  [5-point stencil on a quad grid]

BlurAttribute(iter=1) on POINT domain gives mean of edge-adjacent
neighbours.  Interior quad-mesh vertices have exactly four cardinal
neighbours, so multiplying (mean−u) by 4 recovers the unscaled sum,
i.e. the standard finite-difference Laplacian with dx=1.

Chladni mode seed:
  u(col,row) = A·sin(Mπ·col/(N−1))·sin(Nπ·row/(N−1)) — eigenfunction of
  ∇²ₕ on the fixed-end plate.  u_prev = u_curr → zero initial velocity.
  Mode (2,3) oscillates with period T ≈ 44 frames; nodal lines form a
  cross (2 vertical + 2 horizontal) = the classic cruciform Chladni figure.

Outside sources:
  Blender Manual — Simulation Zone  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    related: projects.blender.org/blender/blender-manual
  Blender Manual — Blur Attribute   CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html
    related: projects.blender.org/blender/blender
  KhronosGroup/glTF-Blender-IO  Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
    related: https://github.com/KhronosGroup/glTF-Sample-Assets
"""

import bpy, bmesh, math, array

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_N    = 40        # vertices per side; interior = (N−2)² active cells
CELL_SIZE = 0.15      # metres per cell → 5.85 m plate
C_SQ      = 0.24      # c²(dt/dx)² — CFL limit for 2-D: ≤ 0.5
HEIGHT_SC = 0.80      # Z displacement scale (metres)
MODE_M    = 2         # X wavenumber of seed Chladni mode
MODE_N    = 3         # Y wavenumber  (vertical nodal lines = N−1 = 2)
AMPLITUDE = 0.40      # initial displacement (keep ≤ 1.0 for colour ramp)
FRAME_END = 120       # ≈ 2.7 oscillation cycles for mode (2,3)
SLUG      = "gn-simulation-zone-wave-equation-chladni-standing-waves"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for b in list(c): c.remove(b, do_unlink=True)


def make_plate() -> bpy.types.Object:
    """Build 40×40 quad mesh; initialise u_curr and u_prev to mode (M,N)."""
    mesh = bpy.data.meshes.new('chladni_mesh')
    obj  = bpy.data.objects.new('chladni_plate', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for row in range(GRID_N):
        for col in range(GRID_N):
            bm.verts.new((col * CELL_SIZE, row * CELL_SIZE, 0.0))
    bm.verts.ensure_lookup_table()
    N = GRID_N
    for row in range(N - 1):
        for col in range(N - 1):
            i = row * N + col
            bm.faces.new([bm.verts[i], bm.verts[i + 1],
                          bm.verts[i + N + 1], bm.verts[i + N]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    u = array.array('f', [
        AMPLITUDE * math.sin(MODE_M * math.pi * (i % N) / (N - 1)) *
                    math.sin(MODE_N * math.pi * (i // N) / (N - 1))
        for i in range(N * N)])
    for name in ('u_curr', 'u_prev'):
        a = mesh.attributes.new(name, 'FLOAT', 'POINT')
        a.data.foreach_set('value', u)
    return obj


def make_material(obj: bpy.types.Object):
    """Diverging blue–black–red emission map on 'u_curr'; nodal lines black."""
    mat = bpy.data.materials.new('chladni_mat')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    rng  = nt.nodes.new('ShaderNodeMapRange')
    attr = nt.nodes.new('ShaderNodeAttribute')

    attr.attribute_name = 'u_curr'; attr.attribute_type = 'GEOMETRY'
    rng.data_type = 'FLOAT'
    rng.inputs['From Min'].default_value = -AMPLITUDE
    rng.inputs['From Max'].default_value =  AMPLITUDE
    rng.inputs['To Min'].default_value   = 0.0
    rng.inputs['To Max'].default_value   = 1.0

    cr = ramp.color_ramp; cr.interpolation = 'B_SPLINE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.0, 0.05, 0.70, 1.0)
    cr.elements[1].position = 1.0; cr.elements[1].color = (1.0, 0.90, 0.50, 1.0)
    cr.elements.new(0.5).color  = (0.0, 0.00, 0.00, 1.0)  # black nodal line
    cr.elements.new(0.32).color = (0.0, 0.30, 1.00, 1.0)  # electric blue trough
    cr.elements.new(0.68).color = (1.0, 0.25, 0.00, 1.0)  # hot orange peak

    emit.inputs['Strength'].default_value = 8.0
    nt.links.new(attr.outputs['Fac'],      rng.inputs['Value'])
    nt.links.new(rng.outputs['Result'],    ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── GN helpers ────────────────────────────────────────────────────────────────
def _n(ng, t):     return ng.nodes.new(t)
def _lk(ng, s, d): ng.links.new(s, d)

def _na(ng, nm):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT'; nd.inputs['Name'].default_value = nm
    return nd.outputs['Attribute']

def _blur(ng, s):
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT'
    _lk(ng, s, nd.inputs['Value'])
    nd.inputs['Iterations'].default_value = 1
    nd.inputs['Weight'].default_value     = 1.0
    return nd.outputs['Value']

def _math(ng, op, a, b=None):
    nd = _n(ng, 'ShaderNodeMath'); nd.operation = op
    if isinstance(a, (int, float)): nd.inputs[0].default_value = float(a)
    else: _lk(ng, a, nd.inputs[0])
    if b is not None:
        if isinstance(b, (int, float)): nd.inputs[1].default_value = float(b)
        else: _lk(ng, b, nd.inputs[1])
    return nd.outputs[0]

def _cmp(ng, a, b, op):
    nd = _n(ng, 'FunctionNodeCompare'); nd.data_type = 'FLOAT'; nd.operation = op
    if isinstance(a, (int, float)): nd.inputs[0].default_value = float(a)
    else: _lk(ng, a, nd.inputs[0])
    if isinstance(b, (int, float)): nd.inputs[1].default_value = float(b)
    else: _lk(ng, b, nd.inputs[1])
    return nd.outputs['Result']

def _or(ng, a, b):
    nd = _n(ng, 'FunctionNodeBooleanMath'); nd.operation = 'OR'
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1])
    return nd.outputs['Boolean']

def _sw(ng, cond, fv, tv):
    nd = _n(ng, 'GeometryNodeSwitch'); nd.input_type = 'FLOAT'
    _lk(ng, cond, nd.inputs[0])
    if isinstance(fv, (int, float)): nd.inputs[1].default_value = float(fv)
    else: _lk(ng, fv, nd.inputs[1])
    if isinstance(tv, (int, float)): nd.inputs[2].default_value = float(tv)
    else: _lk(ng, tv, nd.inputs[2])
    return nd.outputs[0]

def _store(ng, geo, nm, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = nm
    _lk(ng, geo, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_wave_tree(obj: bpy.types.Object):
    """
    Zone anatomy:
      gi.Geometry → sim_i → [wave update] → SetPosition → sim_o → go.Geometry

    Inside the zone per frame:
      blur_u  = BlurAttribute(u_curr, iter=1)
      lapl    = 4·(blur_u − u_curr)               — 5-point Laplacian
      u_next  = 2·u_curr + C_SQ·lapl − u_prev     — Leapfrog step
      u_final = Switch(is_boundary → 0.0, u_next)  — Dirichlet BC
      Store('u_prev', u_curr); Store('u_curr', u_final)
      SetPosition(x, y, u_final·HEIGHT_SC)          — height display
    """
    mod = obj.modifiers.new('WaveGN', 'NODES')
    ng  = bpy.data.node_groups.new('ChladniWaveGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',
                            socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT',
                            socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput')
    go    = _n(ng, 'NodeGroupOutput')
    sim_i = _n(ng, 'GeometryNodeSimulationInput')
    sim_o = _n(ng, 'GeometryNodeSimulationOutput')
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    u_curr = _na(ng, 'u_curr')
    u_prev = _na(ng, 'u_prev')

    # Discrete Laplacian via BlurAttribute mean → 4·(mean − u) = 5-point sum
    lapl   = _math(ng, 'MULTIPLY',
                   _math(ng, 'SUBTRACT', _blur(ng, u_curr), u_curr),
                   4.0)

    # Leapfrog: u[t+1] = 2u[t] + C_SQ·∇²u − u[t−1]
    u_next = _math(ng, 'SUBTRACT',
                   _math(ng, 'ADD',
                         _math(ng, 'MULTIPLY', u_curr, 2.0),
                         _math(ng, 'MULTIPLY', lapl,   C_SQ)),
                   u_prev)

    # Dirichlet BC: zero at grid boundary
    idx  = _n(ng, 'GeometryNodeInputIndex').outputs['Index']
    col  = _math(ng, 'MODULO', idx,  float(GRID_N))
    row  = _math(ng, 'FLOOR',  _math(ng, 'DIVIDE', idx, float(GRID_N)))
    is_b = _or(ng,
               _or(ng, _cmp(ng, col, 0.0,              'LESS_EQUAL'),
                       _cmp(ng, col, float(GRID_N - 1), 'GREATER_EQUAL')),
               _or(ng, _cmp(ng, row, 0.0,              'LESS_EQUAL'),
                       _cmp(ng, row, float(GRID_N - 1), 'GREATER_EQUAL')))
    u_final = _sw(ng, is_b, u_next, 0.0)

    # Advance state
    geo2 = _store(ng, geo,  'u_prev', u_curr)
    geo3 = _store(ng, geo2, 'u_curr', u_final)

    # Height display: preserve XY from current position, set Z from u_final
    pos  = _n(ng, 'GeometryNodeInputPosition')
    sep  = _n(ng, 'ShaderNodeSeparateXYZ')
    comb = _n(ng, 'ShaderNodeCombineXYZ')
    sp   = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, pos.outputs['Position'], sep.inputs['Vector'])
    _lk(ng, sep.outputs['X'], comb.inputs['X'])
    _lk(ng, sep.outputs['Y'], comb.inputs['Y'])
    _lk(ng, _math(ng, 'MULTIPLY', u_final, HEIGHT_SC), comb.inputs['Z'])
    _lk(ng, geo3, sp.inputs['Geometry'])
    _lk(ng, comb.outputs['Vector'], sp.inputs['Position'])
    _lk(ng, sp.outputs['Geometry'], sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])


def main():
    purge()
    obj = make_plate()
    make_material(obj)
    build_wave_tree(obj)
    mid = (GRID_N * CELL_SIZE) / 2
    bpy.ops.object.camera_add(location=(mid, mid, 9.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.camera = cam
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom       = True
    bpy.context.scene.eevee.bloom_intensity = 0.6

    import os
    out = os.path.join(bpy.path.abspath('//'),
                       f'public/library/blends/geometry-nodes/{SLUG}/')
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'hf_chladni_wave.blend'))
    print(f'[blueprint] → {out}hf_chladni_wave.blend')


if __name__ == '__main__':
    main()
