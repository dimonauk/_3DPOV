"""
GN Simulation Zone — Abelian Sandpile (Bak-Tang-Wiesenfeld SOC)
================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Per Bak, Chao Tang, and Kurt Wiesenfeld described in 1987 a deceptively simple
cellular automaton that exhibits Self-Organised Criticality: each face on a
GRID_N×GRID_N quad grid holds a FLOAT 'sand' attribute (grain count).  When
sand ≥ 4 a face TOPPLES — it loses 4 grains and each of its four cardinal
edge-neighbours gains one.  Grains toppled off the grid boundary are absorbed
(open boundary).  From a central pile of N_GRAINS grains the system avalanches
until every face holds 0–3 grains, tracing a diamond-shaped fractal pattern
whose fine structure has power-law statistics.

Why SampleIndex, not BlurAttribute:
  GoL and Predator-Prey need only 'any toppling neighbour?' — a threshold on
  a neighbourhood MEAN, cheaply given by BlurAttribute×4.  The sandpile rule
  requires the EXACT INTEGER COUNT of toppling neighbours because each
  contributes precisely one grain; averaging over boundary faces (3 or 2
  neighbours) would give fractional corrections.  SampleIndex addresses each
  of the four cardinal faces by computed face index, returning 0.0 for
  out-of-range indices when clamp=False.  Left/right neighbours at column
  boundaries wrap to the adjacent row, so a GeometryNodeSwitch guards those
  two directions.

Node tree sketch (Simulation Zone body):
  col      = Index() % GRID_N
  is_L     = Compare(col, 0, EQUAL)
  is_R     = Compare(col, GRID_N-1, EQUAL)
  sand     = NamedAttribute('sand')
  up_s     = SampleIndex(geo, sand, idx + GRID_N, clamp=False)  →0 top row
  dn_s     = SampleIndex(geo, sand, idx - GRID_N, clamp=False)  →0 bot row
  lt_s     = Switch(is_L, SampleIndex(sand, idx-1), 0.0)
  rt_s     = Switch(is_R, SampleIndex(sand, idx+1), 0.0)
  received = Σ (n_s >= 4.0)*1.0  for n_s in {up, dn, lt, rt}
  new_sand = max(sand - (sand>=4)*4 + received, 0.0)
  Store('sand', FLOAT, FACE, new_sand)

Outside sources:
  Blender Manual — Simulation Zone
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    Related: Simulation Bake Node; GeometryNodeSampleIndex docs (same manual)
  Per Bak, Chao Tang, Kurt Wiesenfeld — 'Self-organised criticality: An
    explanation of the 1/f noise', Physical Review Letters 59(4):381, 1987.
    Public Domain scientific paper.
    Related: rosamc/SandpileModel MIT https://github.com/rosamc/SandpileModel;
    Growing Neural Cellular Automata CC0 https://distill.pub/2020/growing-ca/
"""

import bpy
import bmesh
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_N     = 32       # GRID_N×GRID_N = 1 024 quad faces (keep power-of-two)
GRID_SCALE = 5.0      # metres: world-space side length of the grid
N_GRAINS   = 1536     # grains heaped at the centre face before simulation
SAND_ATTR  = 'sand'   # FLOAT attribute on FACE domain
FRAME_END  = 300      # 300 frames; fractal diamond stabilises ~200 frames

# 4-stop CONSTANT palette: grain counts 0–3 mapped via sand÷4 → 0.0–0.75
COL_0 = (0.003, 0.003, 0.010, 1.0)   # 0 grains — void black
COL_1 = (0.02,  0.42,  0.18,  1.0)   # 1 grain   — deep green
COL_2 = (0.10,  0.90,  0.35,  1.0)   # 2 grains  — bright green
COL_3 = (0.95,  0.90,  0.18,  1.0)   # 3 grains  — yellow-white
EMIT  = 7.0


# ── Scene helpers ─────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for blk in list(col):
            col.remove(blk, do_unlink=True)


def make_grid() -> bpy.types.Object:
    """
    Create a GRID_N×GRID_N quad mesh and seed N_GRAINS at the centre face.

    primitive_grid_add(x_subdivisions=N, y_subdivisions=N) produces N² quads.
    Centre face is found geometrically — closest face median to world origin —
    rather than by hardcoded index, so the script is robust to grid orientation
    changes.  All other faces start at 0.0.
    """
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_N, y_subdivisions=GRID_N,
        size=GRID_SCALE, enter_editmode=False)
    obj = bpy.context.active_object
    obj.name = 'sandpile_grid'

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    lay    = bm.faces.layers.float.new(SAND_ATTR)
    origin = mathutils.Vector((0.0, 0.0, 0.0))
    centre = min(bm.faces, key=lambda f: (f.calc_center_median() - origin).length)
    for f in bm.faces:
        f[lay] = float(N_GRAINS) if f is centre else 0.0
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def make_material(obj: bpy.types.Object):
    """
    Emission material: sand÷4 maps to 0–1, CONSTANT colour ramp snaps to
    one of four palette entries (no interpolation between grain counts).
    The ramp stops sit at 0.0/0.26/0.51/0.76 so each of the four FLOAT
    values 0.0, 0.25, 0.5, 0.75 lands clearly in its band.
    """
    mat = bpy.data.materials.new('sandpile_mat')
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = EMIT
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = SAND_ATTR
    div  = nt.nodes.new('ShaderNodeMath')
    div.operation = 'DIVIDE'
    div.inputs[1].default_value = 4.0

    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'
    for i, (pos, col) in enumerate(
            ((0.0, COL_0), (0.26, COL_1), (0.51, COL_2), (0.76, COL_3))):
        if i >= len(cr.elements):
            cr.elements.new(pos)
        cr.elements[i].position = pos
        cr.elements[i].color    = col

    lk = nt.links.new
    lk(attr.outputs['Fac'],   div.inputs[0])
    lk(div.outputs[0],        ramp.inputs['Fac'])
    lk(ramp.outputs['Color'], emit.inputs['Color'])
    lk(emit.outputs[0],       out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── GN node-tree helpers ──────────────────────────────────────────────────────
def _n(ng, typ, **kw):
    nd = ng.nodes.new(typ)
    for k, v in kw.items():
        setattr(nd, k, v)
    return nd


def _lk(ng, src, dst):
    ng.links.new(src, dst)


def _math(ng, op, a=None, b=None, bv=None):
    m = _n(ng, 'ShaderNodeMath', operation=op, use_clamp=False)
    if a is not None:  _lk(ng, a, m.inputs[0])
    if b is not None:  _lk(ng, b, m.inputs[1])
    if bv is not None: m.inputs[1].default_value = float(bv)
    return m.outputs[0]


def _cmp(ng, op, a=None, bv=None):
    """FunctionNodeCompare with FLOAT data_type. Returns Result (BOOL)."""
    c = _n(ng, 'FunctionNodeCompare', data_type='FLOAT', operation=op)
    if a is not None:  _lk(ng, a, c.inputs['A'])
    if bv is not None: c.inputs['B'].default_value = float(bv)
    return c.outputs['Result']


def _sample(ng, geo, sand_fld, idx_sock):
    """
    Sample 'sand' (FLOAT, FACE domain) at an explicit face index.
    clamp=False: negative or ≥ domain_size indices return 0.0 — this gives
    free open-boundary semantics for the top/bottom rows without extra nodes.
    """
    s = _n(ng, 'GeometryNodeSampleIndex',
           data_type='FLOAT', domain='FACE', clamp=False)
    _lk(ng, geo,      s.inputs['Geometry'])
    _lk(ng, sand_fld, s.inputs['Value'])
    _lk(ng, idx_sock, s.inputs['Index'])
    return s.outputs['Value']


def _sw0(ng, cond, real_val):
    """
    Switch: if cond (on boundary) → 0.0, else → real_val.
    GeometryNodeSwitch input layout (FLOAT type):
      [0] Switch (BOOL)  [1] False branch  [2] True branch
    """
    sw = _n(ng, 'GeometryNodeSwitch', input_type='FLOAT')
    _lk(ng, cond,     sw.inputs[0])   # condition: is-on-boundary?
    _lk(ng, real_val, sw.inputs[1])   # false → real neighbour sand
    sw.inputs[2].default_value = 0.0  # true  → boundary: no grain
    return sw.outputs[0]


def _topple(ng, s_sock):
    """(sand >= 4.0) cast BOOL→FLOAT via ×1.0 = grain contribution (0 or 1)."""
    cmp = _cmp(ng, 'GREATER_EQUAL', a=s_sock, bv=4.0)
    return _math(ng, 'MULTIPLY', a=cmp, bv=1.0)


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_sandpile_tree(obj: bpy.types.Object):
    """
    Simulation Zone implementing the Abelian Sandpile toppling rule.

    Key design choice — SampleIndex over BlurAttribute:
    BlurAttribute divides by each face's actual neighbour count (4 interior,
    3 edge, 2 corner).  Multiplying by a fixed 4 to recover integer counts
    overshoots by 1/3 on edge faces and by 2/2 on corner faces, producing
    incorrect grain deliveries at the boundary.  SampleIndex with explicit
    index offsets ±1 / ±GRID_N reads exact FLOAT sand values from each
    cardinal face; boundary flags zero out only the left/right wrap-risk
    directions.  Up/down are naturally handled by clamp=False → 0.0.
    """
    mod = obj.modifiers.new('Sandpile', 'NODES')
    ng  = bpy.data.node_groups.new('SandpileGN', 'GeometryNodeTree')
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

    # ── Sand field (reads from simulation body) ───────────────────────────
    na = _n(ng, 'GeometryNodeInputNamedAttribute', data_type='FLOAT')
    na.inputs['Name'].default_value = SAND_ATTR
    sand = na.outputs['Attribute']

    # ── Face index and column coordinate ─────────────────────────────────
    idx  = _n(ng, 'GeometryNodeInputIndex').outputs['Index']
    col  = _math(ng, 'MODULO', a=idx, bv=GRID_N)

    is_left  = _cmp(ng, 'EQUAL', a=col, bv=0)
    is_right = _cmp(ng, 'EQUAL', a=col, bv=GRID_N - 1)

    # ── Neighbour indices ─────────────────────────────────────────────────
    up_idx = _math(ng, 'ADD',      a=idx, bv=GRID_N)   # next row up
    dn_idx = _math(ng, 'SUBTRACT', a=idx, bv=GRID_N)   # next row down
    lt_idx = _math(ng, 'SUBTRACT', a=idx, bv=1)        # left col
    rt_idx = _math(ng, 'ADD',      a=idx, bv=1)        # right col

    # ── Neighbour sand samples ────────────────────────────────────────────
    # Up/down: OOB indices → 0.0 via clamp=False (free boundary handling)
    up_s  = _sample(ng, geo, sand, up_idx)
    dn_s  = _sample(ng, geo, sand, dn_idx)
    # Left/right: col=0 → idx-1 wraps to prev row; guard with Switch
    lt_s  = _sw0(ng, is_left,  _sample(ng, geo, sand, lt_idx))
    rt_s  = _sw0(ng, is_right, _sample(ng, geo, sand, rt_idx))

    # ── Toppling neighbour count (each toppling nbr sends 1 grain) ────────
    received = _math(ng, 'ADD',
                     a=_math(ng, 'ADD', a=_topple(ng, up_s), b=_topple(ng, dn_s)),
                     b=_math(ng, 'ADD', a=_topple(ng, lt_s), b=_topple(ng, rt_s)))

    # ── This face's loss: 0 or 4 grains ──────────────────────────────────
    i_topple = _math(ng, 'MULTIPLY',
                     a=_cmp(ng, 'GREATER_EQUAL', a=sand, bv=4.0), bv=4.0)

    # ── Update: sand = sand - 4·topple + received (clamped ≥ 0) ─────────
    raw  = _math(ng, 'ADD',
                 a=_math(ng, 'SUBTRACT', a=sand, b=i_topple),
                 b=received)
    new  = _math(ng, 'MAXIMUM', a=raw, bv=0.0)

    store = _n(ng, 'GeometryNodeStoreNamedAttribute',
               data_type='FLOAT', domain='FACE')
    store.inputs['Name'].default_value = SAND_ATTR
    _lk(ng, geo,                      store.inputs['Geometry'])
    _lk(ng, new,                      store.inputs['Value'])
    _lk(ng, store.outputs['Geometry'], sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])


def main():
    purge_scene()
    bpy.context.scene.frame_end = FRAME_END
    obj = make_grid()
    make_material(obj)
    build_sandpile_tree(obj)
    bpy.ops.wm.save_mainfile(filepath='//hf_sandpile.blend')
    print("Sandpile scene ready.  "
          "Object → Geometry Nodes Cache → Bake All, then play frames 0–300.")


if __name__ == '__main__':
    main()
