"""
holoflow_macros/gn_proximity_deform.py — reusable GN Proximity Deform helper
Blender 5.1 | CC0 | Holoflow Studio

Builds a Geometry Nodes tree that deforms a mesh by the nearest-surface
distance to a target object.  Eight nodes, no Simulation Zone required.

Usage:
    from holoflow_macros.gn_proximity_deform import build_proximity_deform_tree
    tree = build_proximity_deform_tree()
    mod  = obj.modifiers.new("ProxDeform", "NODES")
    mod.node_group = tree
    # then set mod["Max Depress"] / mod["Influence Radius"] as needed
"""

import bpy


def build_proximity_deform_tree(
    name: str           = "GNProximityDeform",
    target_obj          = None,
    max_depress: float  = 0.5,
    influence_radius: float = 1.0,
) -> bpy.types.GeometryNodeTree:
    """
    Returns a new GeometryNodeTree implementing a proximity deformation field.

    The tree exposes two float inputs on the modifier panel:
      • Max Depress       — peak −Z displacement in metres
      • Influence Radius  — distance at which displacement falls to zero

    target_obj: a bpy.types.Object whose surface drives the field.
    If None, the ObjectInfo node's Object input is left empty (set manually
    in the modifier's node group or via node.inputs[0].default_value = obj).
    """
    tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name=name)
    nodes = tree.nodes
    links = tree.links

    iface = tree.interface
    iface.new_socket("Geometry",         in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",         in_out="INPUT",  socket_type="NodeSocketGeometry")

    s_max = iface.new_socket("Max Depress",     in_out="INPUT", socket_type="NodeSocketFloat")
    s_max.default_value = max_depress
    s_max.min_value     = 0.0
    s_max.max_value     = 3.0

    s_rad = iface.new_socket("Influence Radius", in_out="INPUT", socket_type="NodeSocketFloat")
    s_rad.default_value = influence_radius
    s_rad.min_value     = 0.01
    s_rad.max_value     = 10.0

    n_in     = nodes.new("NodeGroupInput")
    n_out    = nodes.new("NodeGroupOutput")

    n_obj    = nodes.new("GeometryNodeObjectInfo")
    n_obj.transform_space         = "RELATIVE"
    n_obj.inputs[1].default_value = False  # As Instance
    if target_obj is not None:
        n_obj.inputs[0].default_value = target_obj

    n_prox   = nodes.new("GeometryNodeProximity")
    n_prox.target_element = "FACES"

    n_map    = nodes.new("ShaderNodeMapRange")
    n_map.data_type          = "FLOAT"
    n_map.interpolation_type = "SMOOTHERSTEP"
    n_map.clamp              = True
    n_map.inputs[1].default_value = 0.0
    n_map.inputs[3].default_value = 1.0
    n_map.inputs[4].default_value = 0.0

    n_mul    = nodes.new("ShaderNodeMath")
    n_mul.operation = "MULTIPLY"

    n_neg    = nodes.new("ShaderNodeMath")
    n_neg.operation = "SUBTRACT"
    n_neg.inputs[0].default_value = 0.0

    n_cxyz   = nodes.new("ShaderNodeCombineXYZ")
    n_cxyz.inputs[0].default_value = 0.0
    n_cxyz.inputs[1].default_value = 0.0

    n_setpos = nodes.new("GeometryNodeSetPosition")

    links.new(n_obj.outputs["Geometry"],         n_prox.inputs[0])
    links.new(n_prox.outputs["Distance"],         n_map.inputs[0])
    links.new(n_in.outputs["Influence Radius"],   n_map.inputs[2])
    links.new(n_map.outputs[0],                   n_mul.inputs[0])
    links.new(n_in.outputs["Max Depress"],        n_mul.inputs[1])
    links.new(n_mul.outputs[0],                   n_neg.inputs[1])
    links.new(n_neg.outputs[0],                   n_cxyz.inputs[2])
    links.new(n_in.outputs["Geometry"],           n_setpos.inputs[0])
    links.new(n_cxyz.outputs[0],                  n_setpos.inputs[3])
    links.new(n_setpos.outputs[0],                n_out.inputs["Geometry"])

    return tree
