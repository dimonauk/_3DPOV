# holoflow_macros/gn_distribute_points_on_curves_ivy.py
# Blender 5.1 | CC0 | Holoflow Studio
#
# Reusable macro: build a GN Distribute Points on Curves ivy-scatter tree
# on any existing Curves object.  Call build_ivy_scatter(obj, ...) then
# optionally call add_stem_branch(ng) separately.
#
# Usage:
#   from holoflow_macros.gn_distribute_points_on_curves_ivy import build_ivy_scatter
#   build_ivy_scatter(bpy.context.active_object)

import bpy, math

def build_ivy_scatter(
    curve_obj,
    leaf_density: float  = 5.0,
    min_distance: float  = 0.13,
    seed:         int    = 42,
    leaf_w:       float  = 0.18,
    leaf_h:       float  = 0.12,
    stem_radius:  float  = 0.007,
    stem_res:     int    = 8,
    mat_stem=None,
    mat_leaf=None,
) -> bpy.types.NodesModifier:
    """
    Add the HF_IvyScatter GN modifier to curve_obj.
    Returns the modifier.  If mat_stem / mat_leaf are None,
    simple emission materials are created automatically.
    """
    if mat_stem is None:
        mat_stem = _make_emit('hf_ivy_stem', (0.04, 0.18, 0.03))
    if mat_leaf is None:
        mat_leaf = _make_emit('hf_ivy_leaf', (0.10, 0.52, 0.09))

    mod = curve_obj.modifiers.new('HF_IvyScatter', 'NODES')
    ng  = bpy.data.node_groups.new('HF_IvyScatter', 'GeometryNodeTree')
    mod.node_group = ng

    n = ng.nodes
    lk = ng.links
    ifc = ng.interface

    # ── Group sockets ─────────────────────────────────────────────────────────
    ifc.new_socket('Geometry',    in_out='INPUT',  socket_type='NodeSocketGeometry')
    s_ld = ifc.new_socket('Leaf Density', in_out='INPUT',  socket_type='NodeSocketFloat')
    s_md = ifc.new_socket('Min Distance', in_out='INPUT',  socket_type='NodeSocketFloat')
    s_sd = ifc.new_socket('Seed',         in_out='INPUT',  socket_type='NodeSocketInt')
    s_lw = ifc.new_socket('Leaf Width',   in_out='INPUT',  socket_type='NodeSocketFloat')
    s_lh = ifc.new_socket('Leaf Height',  in_out='INPUT',  socket_type='NodeSocketFloat')
    ifc.new_socket('Geometry',    in_out='OUTPUT', socket_type='NodeSocketGeometry')

    s_ld.default_value = leaf_density
    s_md.default_value = min_distance
    s_sd.default_value = seed
    s_lw.default_value = leaf_w
    s_lh.default_value = leaf_h

    gin  = n.new('NodeGroupInput')
    gout = n.new('NodeGroupOutput')

    # ── Branch A: stem ────────────────────────────────────────────────────────
    circ = n.new('GeometryNodeCurvePrimitiveCircle')
    circ.mode = 'RADIUS'
    circ.inputs['Resolution'].default_value = stem_res
    circ.inputs['Radius'].default_value     = stem_radius

    c2m = n.new('GeometryNodeCurveToMesh')
    c2m.inputs['Fill Caps'].default_value = True
    lk.new(gin.outputs['Geometry'], c2m.inputs['Curve'])
    lk.new(circ.outputs['Curve'],   c2m.inputs['Profile Curve'])

    sm_node = n.new('GeometryNodeSetMaterial')
    lk.new(c2m.outputs['Mesh'], sm_node.inputs['Geometry'])
    sm_node.inputs['Material'].default_value = mat_stem

    # ── Branch B: leaves ──────────────────────────────────────────────────────
    dist = n.new('GeometryNodeDistributePointsOnCurves')
    lk.new(gin.outputs['Geometry'],    dist.inputs['Curves'])
    lk.new(gin.outputs['Leaf Density'], dist.inputs['Density'])
    lk.new(gin.outputs['Min Distance'], dist.inputs['Distance Min'])
    lk.new(gin.outputs['Seed'],         dist.inputs['Seed'])

    leaf_geo = n.new('GeometryNodeMeshGrid')
    leaf_geo.inputs['Vertices X'].default_value = 2
    leaf_geo.inputs['Vertices Y'].default_value = 2
    lk.new(gin.outputs['Leaf Width'],  leaf_geo.inputs['Size X'])
    lk.new(gin.outputs['Leaf Height'], leaf_geo.inputs['Size Y'])

    lm_node = n.new('GeometryNodeSetMaterial')
    lk.new(leaf_geo.outputs['Mesh'], lm_node.inputs['Geometry'])
    lm_node.inputs['Material'].default_value = mat_leaf

    # Parameter → scale taper
    remap = n.new('ShaderNodeMapRange')
    remap.inputs['From Min'].default_value = 0.0
    remap.inputs['From Max'].default_value = 1.0
    remap.inputs['To Min'].default_value   = 1.2
    remap.inputs['To Max'].default_value   = 0.45
    lk.new(dist.outputs['Parameter'], remap.inputs['Value'])
    csc = n.new('ShaderNodeCombineXYZ')
    lk.new(remap.outputs['Result'], csc.inputs['X'])
    lk.new(remap.outputs['Result'], csc.inputs['Y'])
    csc.inputs['Z'].default_value = 1.0

    # Rotation
    align = n.new('FunctionNodeAlignEulerToVector')
    align.axis       = 'Z'
    align.pivot_axis = 'X'
    lk.new(dist.outputs['Normal'], align.inputs['Vector'])

    rand_a = n.new('FunctionNodeRandomValue')
    rand_a.data_type = 'FLOAT'
    rand_a.inputs['Min'].default_value   = -math.pi / 3.0
    rand_a.inputs['Max'].default_value   =  math.pi / 3.0
    lk.new(gin.outputs['Seed'], rand_a.inputs['Seed'])

    rot_e = n.new('FunctionNodeRotateEuler')
    rot_e.type  = 'AXIS_ANGLE'
    rot_e.space = 'LOCAL'
    lk.new(align.outputs['Rotation'], rot_e.inputs['Rotation'])
    lk.new(rand_a.outputs['Value'],   rot_e.inputs['Angle'])
    lk.new(dist.outputs['Tangent'],   rot_e.inputs['Axis'])

    inst = n.new('GeometryNodeInstanceOnPoints')
    lk.new(dist.outputs['Points'],      inst.inputs['Points'])
    lk.new(lm_node.outputs['Geometry'], inst.inputs['Instance'])
    lk.new(rot_e.outputs['Rotation'],   inst.inputs['Rotation'])
    lk.new(csc.outputs['Vector'],       inst.inputs['Scale'])

    real = n.new('GeometryNodeRealizeInstances')
    lk.new(inst.outputs['Instances'], real.inputs['Geometry'])

    # Join + output
    join = n.new('GeometryNodeJoinGeometry')
    lk.new(sm_node.outputs['Geometry'], join.inputs['Geometry'])
    lk.new(real.outputs['Geometry'],    join.inputs['Geometry'])
    lk.new(join.outputs['Geometry'], gout.inputs['Geometry'])

    # Apply modifier socket defaults
    defaults = {
        'Leaf Density': leaf_density, 'Min Distance': min_distance,
        'Seed': seed, 'Leaf Width': leaf_w, 'Leaf Height': leaf_h,
    }
    for item in ng.interface.items_tree:
        if item.name in defaults:
            mod[item.identifier] = defaults[item.name]

    return mod


def _make_emit(name: str, rgb: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = (*rgb, 1.0)
    emit.inputs['Strength'].default_value = 1.0
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat
