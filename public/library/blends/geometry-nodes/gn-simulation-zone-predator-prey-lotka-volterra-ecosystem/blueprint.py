"""
GN Simulation Zone — Predator-Prey Lotka-Volterra Ecosystem
Blender 5.1  ·  CC0  ·  Holoflow Studio

Three-state spatial cellular automaton — Empty / Prey / Predator — encoded
as a single FLOAT 'state' attribute (0.0 / 1.0 / 2.0) on face domain.

The Blur Attribute trick from the GoL tutorial extends naturally here: two
independent Blur passes, one each for prey and predator masks converted to
float, give the mean of edge-adjacent face values for each population.
Multiplying by four (interior quad faces) recovers approximate integer neighbour
counts.  Greater-Than compares against 0.5 give Boolean 'any prey/pred
neighbour' flags — enough to drive the three-state update.

Update rules (spatial Lotka-Volterra / Rock-Paper-Scissors spatial game):
  Prey    → stays Prey      if no Predator neighbour (survival)
  Prey    → becomes Pred    if ≥1 Predator neighbour (predation)
  Pred    → stays Pred      if ≥1 Prey neighbour     (fed)
  Pred    → becomes Empty   if  0 Prey neighbours    (starvation)
  Empty   → becomes Prey    if ≥1 Prey neighbour     (colonisation)
  Empty   → stays Empty     otherwise

These rules produce rotating spiral waves — the same spiralling attractor seen
in Lotka-Volterra ODEs, now spatially explicit on a mesh surface.

Outside sources:
  Blender Manual — Simulation Zone
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    Related: Simulation Bake Node, Simulation State Items (same section)
  Maarten Lankhorst — 'Spatial Rock-Paper-Scissors' interactive demo (CC0)
    https://github.com/mlankhorst/rps-cellular  (MIT)
    Related sibling: pmneila/jsexp (Grey-Scott reaction-diffusion, MIT)
  KhronosGroup — glTF-Blender-IO
    Apache-2.0  ·  https://github.com/KhronosGroup/glTF-Blender-IO
    Related: glTF-Validator, Draco mesh compression extension
"""

import bpy, bmesh, random

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_DIVS    = 31          # 31 subdivisions → 31² = 961 quad faces
GRID_SCALE   = 6.0         # metres
PREY_DENSITY = 0.35        # fraction of faces seeded as Prey at t=0
PRED_DENSITY = 0.15        # fraction seeded as Predator at t=0
SEED         = 7           # RNG seed
STATE_ATTR   = 'state'     # float face attribute: 0=empty, 1=prey, 2=pred
FRAME_END    = 200

COL_EMPTY    = (0.003, 0.003, 0.008, 1.0)   # near-black void
COL_PREY     = (0.02,  0.90,  0.35,  1.0)   # phosphor green
COL_PRED     = (1.0,   0.08,  0.08,  1.0)   # hot red
EMIT_STR     = 6.0                           # emission strength for colour ramp


# ── Scene helpers ─────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for blk in list(col):
            col.remove(blk, do_unlink=True)


def make_grid() -> bpy.types.Object:
    """Create quad grid and seed the three-state 'state' float attribute."""
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIVS, y_subdivisions=GRID_DIVS, size=GRID_SCALE)
    obj = bpy.context.active_object
    obj.name = 'pp_grid'

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    lay = bm.faces.layers.float.new(STATE_ATTR)
    rng = random.Random(SEED)
    for f in bm.faces:
        r = rng.random()
        f[lay] = 1.0 if r < PREY_DENSITY else (2.0 if r < PREY_DENSITY + PRED_DENSITY else 0.0)
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def make_material(obj: bpy.types.Object):
    """Emission-driven material: colour ramp maps state 0/1/2 to 3 colours."""
    mat = bpy.data.materials.new('pp_material')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = EMIT_STR
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    # Three stops at normalised positions: 0→empty, 0.33→prey, 0.66→predator
    # The state attribute ranges 0–2; divide by 2 to map to 0–1.
    for i, (pos, col) in enumerate(((0.0, COL_EMPTY), (0.4, COL_PREY), (0.7, COL_PRED))):
        if i >= len(ramp.color_ramp.elements):
            ramp.color_ramp.elements.new(pos)
        el = ramp.color_ramp.elements[i]
        el.position, el.color = pos, col

    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = STATE_ATTR
    # Divide state (0–2) by 2 to map into 0–1 for the colour ramp
    div = nt.nodes.new('ShaderNodeMath')
    div.operation = 'DIVIDE'
    div.inputs[1].default_value = 2.0

    nt.links.new(attr.outputs['Fac'],   div.inputs[0])
    nt.links.new(div.outputs[0],        ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs[0],       out.inputs['Surface'])

    obj.data.materials.append(mat)


def _n(tree, typename: str, **props) -> bpy.types.Node:
    nd = tree.nodes.new(typename)
    for k, v in props.items():
        setattr(nd, k, v)
    return nd


def _lk(tree, src, dst):
    tree.links.new(src, dst)


def build_pp_tree(obj: bpy.types.Object):
    """
    Construct the Predator-Prey Geometry Nodes tree.

    Node tree structure (inside Simulation Zone body):
      read_state   ← NamedAttribute('state', FLOAT)
      is_prey      ← (state > 0.5) AND (state < 1.5)
      is_pred      ← state > 1.5
      is_empty     ← NOT(is_prey OR is_pred)
      prey_f       ← is_prey × 1.0  (bool→float for Blur)
      pred_f       ← is_pred × 1.0
      blur_prey    ← BlurAttribute(prey_f, iter=1)
      blur_pred    ← BlurAttribute(pred_f, iter=1)
      n_prey       ← blur_prey × 4  (approx neighbour count on quad grid)
      n_pred       ← blur_pred × 4
      has_prey_nbr ← n_prey > 0.5
      has_pred_nbr ← n_pred > 0.5
      # Prey update
      prey_survives← is_prey AND NOT(has_pred_nbr)
      prey_born    ← is_empty AND has_prey_nbr
      new_is_prey  ← prey_survives OR prey_born
      # Predator update
      pred_fed     ← is_pred AND has_prey_nbr
      pred_kills   ← is_prey AND has_pred_nbr   ← predation flips prey→pred
      new_is_pred  ← pred_fed OR pred_kills
      # Re-encode
      new_state    ← (new_is_prey × 1.0) + (new_is_pred × 2.0)
      Store('state', FLOAT, FACE, new_state)
    """
    mod = obj.modifiers.new('GN_PredatorPrey', 'NODES')
    ng  = bpy.data.node_groups.new('GN_PredatorPrey', 'GeometryNodeTree')
    mod.node_group = ng
    nodes, links = ng.nodes, ng.links
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi  = _n(ng, 'NodeGroupInput')
    go  = _n(ng, 'NodeGroupOutput')
    sim_i = _n(ng, 'GeometryNodeSimulationInput')
    sim_o = _n(ng, 'GeometryNodeSimulationOutput')
    sim_i.pair_with_output(sim_o)

    _lk(ng, gi.outputs['Geometry'],    sim_i.inputs['Geometry'])

    # ── body ─────────────────────────────────────────────────────────────────
    rs = _n(ng, 'GeometryNodeInputNamedAttribute'); rs.data_type = 'FLOAT'; rs.inputs[0].default_value = STATE_ATTR

    gt05 = _n(ng, 'FunctionNodeCompare'); gt05.data_type = 'FLOAT'; gt05.operation = 'GREATER_THAN'; gt05.inputs['B'].default_value = 0.5
    lt15 = _n(ng, 'FunctionNodeCompare'); lt15.data_type = 'FLOAT'; lt15.operation = 'LESS_THAN';    lt15.inputs['B'].default_value = 1.5
    gt15 = _n(ng, 'FunctionNodeCompare'); gt15.data_type = 'FLOAT'; gt15.operation = 'GREATER_THAN'; gt15.inputs['B'].default_value = 1.5

    is_prey_b = _n(ng, 'FunctionNodeBooleanMath'); is_prey_b.operation = 'AND'
    is_pred_b = gt15  # already a boolean
    is_either = _n(ng, 'FunctionNodeBooleanMath'); is_either.operation = 'OR'
    is_empty  = _n(ng, 'FunctionNodeBooleanMath'); is_empty.operation  = 'NOT'

    _lk(ng, rs.outputs['Attribute'],   gt05.inputs['A'])
    _lk(ng, rs.outputs['Attribute'],   lt15.inputs['A'])
    _lk(ng, rs.outputs['Attribute'],   gt15.inputs['A'])
    _lk(ng, gt05.outputs['Result'],    is_prey_b.inputs[0])
    _lk(ng, lt15.outputs['Result'],    is_prey_b.inputs[1])
    _lk(ng, is_prey_b.outputs[0],     is_either.inputs[0])
    _lk(ng, gt15.outputs['Result'],   is_either.inputs[1])
    _lk(ng, is_either.outputs[0],     is_empty.inputs[0])

    def b2f(src_socket):
        m = _n(ng, 'ShaderNodeMath'); m.operation = 'MULTIPLY'; m.inputs[1].default_value = 1.0
        _lk(ng, src_socket, m.inputs[0])
        return m.outputs[0]

    blur_prey  = _n(ng, 'GeometryNodeBlurAttribute'); blur_prey.data_type = 'FLOAT'
    blur_pred  = _n(ng, 'GeometryNodeBlurAttribute'); blur_pred.data_type = 'FLOAT'
    scale_p    = _n(ng, 'ShaderNodeMath'); scale_p.operation = 'MULTIPLY'; scale_p.inputs[1].default_value = 4.0
    scale_d    = _n(ng, 'ShaderNodeMath'); scale_d.operation = 'MULTIPLY'; scale_d.inputs[1].default_value = 4.0
    hp         = _n(ng, 'FunctionNodeCompare'); hp.data_type = 'FLOAT'; hp.operation = 'GREATER_THAN'; hp.inputs['B'].default_value = 0.5
    hd         = _n(ng, 'FunctionNodeCompare'); hd.data_type = 'FLOAT'; hd.operation = 'GREATER_THAN'; hd.inputs['B'].default_value = 0.5

    prey_f_sock = b2f(is_prey_b.outputs[0])
    pred_f_sock = b2f(gt15.outputs['Result'])
    _lk(ng, sim_i.outputs['Geometry'], blur_prey.inputs['Geometry'])
    _lk(ng, sim_i.outputs['Geometry'], blur_pred.inputs['Geometry'])
    _lk(ng, prey_f_sock,               blur_prey.inputs['Value'])
    _lk(ng, pred_f_sock,               blur_pred.inputs['Value'])
    _lk(ng, blur_prey.outputs['Value'],scale_p.inputs[0])
    _lk(ng, blur_pred.outputs['Value'],scale_d.inputs[0])
    _lk(ng, scale_p.outputs[0],        hp.inputs['A'])
    _lk(ng, scale_d.outputs[0],        hd.inputs['A'])

    # Prey: survives OR born
    not_hd     = _n(ng, 'FunctionNodeBooleanMath'); not_hd.operation = 'NOT'
    surv_prey  = _n(ng, 'FunctionNodeBooleanMath'); surv_prey.operation  = 'AND'
    born_prey  = _n(ng, 'FunctionNodeBooleanMath'); born_prey.operation  = 'AND'
    new_prey   = _n(ng, 'FunctionNodeBooleanMath'); new_prey.operation   = 'OR'
    _lk(ng, hd.outputs['Result'],      not_hd.inputs[0])
    _lk(ng, is_prey_b.outputs[0],      surv_prey.inputs[0])
    _lk(ng, not_hd.outputs[0],         surv_prey.inputs[1])
    _lk(ng, is_empty.outputs[0],       born_prey.inputs[0])
    _lk(ng, hp.outputs['Result'],      born_prey.inputs[1])
    _lk(ng, surv_prey.outputs[0],      new_prey.inputs[0])
    _lk(ng, born_prey.outputs[0],      new_prey.inputs[1])

    # Predator: fed OR kills
    pred_fed   = _n(ng, 'FunctionNodeBooleanMath'); pred_fed.operation  = 'AND'
    pred_kills = _n(ng, 'FunctionNodeBooleanMath'); pred_kills.operation = 'AND'
    new_pred   = _n(ng, 'FunctionNodeBooleanMath'); new_pred.operation   = 'OR'
    _lk(ng, gt15.outputs['Result'],    pred_fed.inputs[0])
    _lk(ng, hp.outputs['Result'],      pred_fed.inputs[1])
    _lk(ng, is_prey_b.outputs[0],      pred_kills.inputs[0])
    _lk(ng, hd.outputs['Result'],      pred_kills.inputs[1])
    _lk(ng, pred_fed.outputs[0],       new_pred.inputs[0])
    _lk(ng, pred_kills.outputs[0],     new_pred.inputs[1])

    # Re-encode: new_state = new_prey×1.0 + new_pred×2.0
    m1 = _n(ng, 'ShaderNodeMath'); m1.operation = 'MULTIPLY'; m1.inputs[1].default_value = 1.0
    m2 = _n(ng, 'ShaderNodeMath'); m2.operation = 'MULTIPLY'; m2.inputs[1].default_value = 2.0
    add = _n(ng, 'ShaderNodeMath'); add.operation = 'ADD'
    _lk(ng, new_prey.outputs[0],       m1.inputs[0])
    _lk(ng, new_pred.outputs[0],       m2.inputs[0])
    _lk(ng, m1.outputs[0],             add.inputs[0])
    _lk(ng, m2.outputs[0],             add.inputs[1])

    store = _n(ng, 'GeometryNodeStoreNamedAttribute')
    store.data_type  = 'FLOAT'
    store.domain     = 'FACE'
    store.inputs['Name'].default_value = STATE_ATTR
    _lk(ng, sim_i.outputs['Geometry'], store.inputs['Geometry'])
    _lk(ng, add.outputs[0],            store.inputs['Value'])
    _lk(ng, store.outputs['Geometry'], sim_o.inputs['Geometry'])

    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])


def main():
    purge_scene()
    bpy.context.scene.frame_end = FRAME_END
    obj = make_grid()
    make_material(obj)
    build_pp_tree(obj)
    bpy.ops.wm.save_mainfile(filepath='//hf_predator_prey.blend')
    print("Blueprint complete. Predator-Prey Simulation Zone active.")


if __name__ == '__main__':
    main()
