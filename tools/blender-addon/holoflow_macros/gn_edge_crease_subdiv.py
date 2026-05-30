# =============================================================================
# HOLOFLOW STUDIO — holoflow_macros/gn_edge_crease_subdiv.py
# Reusable helper: attach the GN edge-angle-crease + Subdiv modifier stack.
# Licence: CC0
# =============================================================================
"""
add_gn_edge_crease(obj, angle_deg, blend_deg, subdiv_levels)

Builds a GNEdgeCrease node group (if not already in bpy.data.node_groups),
attaches it as a GN modifier on obj, then appends a Subdivision Surface
modifier that reads the written crease_edge attribute.

Usage:
    from holoflow_macros.gn_edge_crease_subdiv import add_gn_edge_crease
    add_gn_edge_crease(bpy.context.active_object, angle_deg=40.0)
"""

import bpy
import math

_RAD = math.pi / 180.0

GN_TREE_NAME   = "GNEdgeCrease"
GN_MOD_NAME    = "HoloflowGNCrease"
SUBDIV_MOD_NAME = "HoloflowSubdiv"


def _build_or_get_tree(angle_deg: float = 40.0, blend_deg: float = 15.0):
    if GN_TREE_NAME in bpy.data.node_groups:
        return bpy.data.node_groups[GN_TREE_NAME]

    tree  = bpy.data.node_groups.new(type='GeometryNodeTree', name=GN_TREE_NAME)
    nodes = tree.nodes
    links = tree.links

    tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    s_th = tree.interface.new_socket('Angle Threshold Deg', in_out='INPUT',
                                     socket_type='NodeSocketFloat')
    s_th.default_value = angle_deg; s_th.min_value = 0.0; s_th.max_value = 180.0
    s_bl = tree.interface.new_socket('Blend Width Deg', in_out='INPUT',
                                     socket_type='NodeSocketFloat')
    s_bl.default_value = blend_deg; s_bl.min_value = 0.1; s_bl.max_value = 45.0

    n_gin  = nodes.new('NodeGroupInput');  n_gin.location  = (-820, 0)
    n_gout = nodes.new('NodeGroupOutput'); n_gout.location = (420, 0)

    n_th_conv = nodes.new('ShaderNodeMath')
    n_th_conv.operation = 'MULTIPLY'
    n_th_conv.inputs[1].default_value = _RAD
    n_th_conv.location = (-560, 120)
    links.new(n_gin.outputs['Angle Threshold Deg'], n_th_conv.inputs[0])

    n_bl_conv = nodes.new('ShaderNodeMath')
    n_bl_conv.operation = 'MULTIPLY'
    n_bl_conv.inputs[1].default_value = _RAD * 0.5  # π/360
    n_bl_conv.location = (-560, -120)
    links.new(n_gin.outputs['Blend Width Deg'], n_bl_conv.inputs[0])

    n_lo = nodes.new('ShaderNodeMath'); n_lo.operation = 'SUBTRACT'; n_lo.location = (-320, 120)
    links.new(n_th_conv.outputs['Value'], n_lo.inputs[0])
    links.new(n_bl_conv.outputs['Value'], n_lo.inputs[1])

    n_hi = nodes.new('ShaderNodeMath'); n_hi.operation = 'ADD'; n_hi.location = (-320, -40)
    links.new(n_th_conv.outputs['Value'], n_hi.inputs[0])
    links.new(n_bl_conv.outputs['Value'], n_hi.inputs[1])

    n_angle = nodes.new('GeometryNodeEdgeAngle'); n_angle.location = (-320, -240)

    n_map = nodes.new('ShaderNodeMapRange')
    n_map.data_type = 'FLOAT'; n_map.clamp = True; n_map.location = (-80, 0)
    links.new(n_angle.outputs['Unsigned Angle'], n_map.inputs['Value'])
    links.new(n_lo.outputs['Value'],             n_map.inputs['From Min'])
    links.new(n_hi.outputs['Value'],             n_map.inputs['From Max'])
    n_map.inputs['To Min'].default_value = 0.0
    n_map.inputs['To Max'].default_value = 1.0

    n_store = nodes.new('GeometryNodeStoreNamedAttribute')
    n_store.data_type = 'FLOAT'; n_store.domain = 'EDGE'; n_store.location = (200, 0)
    n_store.inputs['Name'].default_value = 'crease_edge'
    links.new(n_gin.outputs['Geometry'], n_store.inputs['Geometry'])
    links.new(n_map.outputs['Result'],   n_store.inputs['Value'])
    links.new(n_store.outputs['Geometry'], n_gout.inputs['Geometry'])

    return tree


def add_gn_edge_crease(
    obj: "bpy.types.Object",
    angle_deg: float = 40.0,
    blend_deg: float = 15.0,
    subdiv_viewport: int = 2,
    subdiv_render: int = 3,
) -> tuple:
    """
    Attach GN edge-crease + Subdiv stack to obj.

    Returns (mod_gn, mod_subdiv) for further configuration.
    """
    tree = _build_or_get_tree(angle_deg, blend_deg)

    mod_gn            = obj.modifiers.new(name=GN_MOD_NAME, type='NODES')
    mod_gn.node_group = tree
    mod_gn['Input_2'] = angle_deg
    mod_gn['Input_3'] = blend_deg

    mod_sub                  = obj.modifiers.new(name=SUBDIV_MOD_NAME, type='SUBSURF')
    mod_sub.subdivision_type = 'CATMULL_CLARK'
    mod_sub.levels           = subdiv_viewport
    mod_sub.render_levels    = subdiv_render
    mod_sub.use_creases      = True
    mod_sub.use_limit_surface = True

    return mod_gn, mod_sub
