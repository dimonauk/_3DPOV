"""
holoflow_macros.gn_interpolate_curves_hair
==========================================
Reusable macro: adds a HF_HairInterpolate GN modifier to a selected mesh
object given an existing HairCurves guide object and a carrier scalp mesh.

Usage (Blender scripting workspace):
    import importlib, holoflow_macros.gn_interpolate_curves_hair as m
    importlib.reload(m)
    m.apply(
        output_obj  = bpy.data.objects["hair_strands"],
        guides_obj  = bpy.data.objects["VRM_GuideHair"],
        scalp_obj   = bpy.data.objects["VRM_Scalp"],
        strand_count = 256,
        strand_len   = 0.18,
        strand_radius = 0.0025,
    )
"""

import bpy

GN_TREE_NAME = "HF_HairInterpolate"


def apply(
    output_obj:    bpy.types.Object,
    guides_obj:    bpy.types.Object,
    scalp_obj:     bpy.types.Object,
    strand_count:  int   = 256,
    strand_len:    float = 0.18,
    strand_radius: float = 0.0025,
    seed:          int   = 0,
) -> bpy.types.NodesModifier:
    """Build and attach a HF_HairInterpolate GN modifier.

    Idempotent: removes any existing tree with the same name before rebuilding.
    Returns the NodesModifier added to output_obj.
    """
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])

    ng    = bpy.data.node_groups.new(GN_TREE_NAME, 'GeometryNodeTree')
    ng.is_modifier = True
    iface = ng.interface
    nodes = ng.nodes
    links = ng.links

    iface.new_socket("Geometry",      in_out='OUTPUT', socket_type='NodeSocketGeometry')
    iface.new_socket("Geometry",      in_out='INPUT',  socket_type='NodeSocketGeometry')
    s_cnt  = iface.new_socket("Strand Count",  in_out='INPUT', socket_type='NodeSocketInt')
    s_cnt.default_value  = strand_count
    s_cnt.min_value      = 1
    s_cnt.max_value      = 4096
    s_seed = iface.new_socket("Seed",          in_out='INPUT', socket_type='NodeSocketInt')
    s_seed.default_value = seed
    s_len  = iface.new_socket("Strand Length", in_out='INPUT', socket_type='NodeSocketFloat')
    s_len.default_value  = strand_len
    s_len.min_value      = 0.005

    gout     = nodes.new('NodeGroupOutput')
    gin      = nodes.new('NodeGroupInput')
    n_gi     = nodes.new('GeometryNodeObjectInfo')
    n_si     = nodes.new('GeometryNodeObjectInfo')
    n_interp = nodes.new('GeometryNodeInterpolateCurves')
    n_circle = nodes.new('GeometryNodeCurvePrimitiveCircle')
    n_c2m    = nodes.new('GeometryNodeCurveToMesh')

    n_gi.inputs['Object'].default_value = guides_obj
    n_si.inputs['Object'].default_value = scalp_obj
    n_gi.transform_space = 'RELATIVE'
    n_si.transform_space = 'RELATIVE'

    n_interp.guide_up_mode = 'MINIMUM_TWIST'

    n_circle.mode = 'POINTS'
    n_circle.inputs['Vertices'].default_value = 6
    n_circle.inputs['Radius'].default_value   = strand_radius

    n_c2m.inputs['Fill Caps'].default_value = False

    links.new(n_gi.outputs['Geometry'],     n_interp.inputs[0])
    links.new(n_si.outputs['Geometry'],     n_interp.inputs[1])
    links.new(gin.outputs['Strand Count'],  n_interp.inputs['Count'])
    links.new(gin.outputs['Seed'],          n_interp.inputs['Seed'])
    links.new(gin.outputs['Strand Length'], n_interp.inputs['Length'])
    links.new(n_interp.outputs['Curves'],   n_c2m.inputs['Curve'])
    links.new(n_circle.outputs['Curve'],    n_c2m.inputs['Profile Curve'])
    links.new(n_c2m.outputs['Mesh'],        gout.inputs['Geometry'])

    for existing in list(output_obj.modifiers):
        if existing.type == 'NODES' and existing.node_group and existing.node_group.name == GN_TREE_NAME:
            output_obj.modifiers.remove(existing)

    mod = output_obj.modifiers.new("HairInterpolate", 'NODES')
    mod.node_group = ng
    return mod
