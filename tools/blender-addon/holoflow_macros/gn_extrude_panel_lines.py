"""
holoflow_macros.gn_extrude_panel_lines
=======================================
Reusable function: attach the PanelLines GN modifier to any mesh object
that already has a BOOLEAN FACE attribute named 'panel_face'.

Usage:
    from holoflow_macros.gn_extrude_panel_lines import attach_panel_lines_modifier
    attach_panel_lines_modifier(obj, panel_depth=-0.04, panel_inset=0.82)

The GN tree is created once per Blender session and reused if the node group
'PanelLinesGN' already exists, so multiple objects share the same tree.
"""

import bpy
from typing import Optional

MODIFIER_ID = "HoloflowPanelLines"
NODE_GROUP  = "PanelLinesGN"


def _get_or_build_tree() -> bpy.types.GeometryNodeTree:
    existing = bpy.data.node_groups.get(NODE_GROUP)
    if existing is not None:
        return existing  # reuse across objects

    tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name=NODE_GROUP)
    nodes = tree.nodes
    links = tree.links

    tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    s_d = tree.interface.new_socket("Panel Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    s_d.default_value = -0.04
    s_d.min_value = -0.20
    s_d.max_value = 0.0
    s_i = tree.interface.new_socket("Panel Inset", in_out="INPUT", socket_type="NodeSocketFloat")
    s_i.default_value = 0.82
    s_i.min_value = 0.5
    s_i.max_value = 1.0

    n_in  = nodes.new("NodeGroupInput");   n_in.location  = (-700, 0)
    n_out = nodes.new("NodeGroupOutput");  n_out.location = ( 700, 0)

    n_attr = nodes.new("GeometryNodeInputNamedAttribute")
    n_attr.data_type = "BOOLEAN"
    n_attr.inputs[0].default_value = "panel_face"
    n_attr.location = (-450, -180)

    n_extrude = nodes.new("GeometryNodeExtrudeMesh")
    n_extrude.mode = "FACES"
    n_extrude.inputs[4].default_value = True  # Individual
    n_extrude.location = (-160, 0)

    n_scale = nodes.new("GeometryNodeScaleElements")
    n_scale.domain = "FACE"
    n_scale.scale_mode = "UNIFORM"
    n_scale.location = (180, 0)

    n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = False
    n_smooth.location = (460, 0)

    links.new(n_in.outputs["Geometry"],    n_extrude.inputs["Mesh"])
    links.new(n_attr.outputs[0],           n_extrude.inputs["Selection"])
    links.new(n_in.outputs["Panel Depth"], n_extrude.inputs["Offset Scale"])
    links.new(n_extrude.outputs["Mesh"],   n_scale.inputs["Geometry"])
    links.new(n_extrude.outputs["Top"],    n_scale.inputs["Selection"])
    links.new(n_in.outputs["Panel Inset"], n_scale.inputs["Scale"])
    links.new(n_scale.outputs["Geometry"], n_smooth.inputs["Geometry"])
    links.new(n_smooth.outputs["Geometry"], n_out.inputs["Geometry"])

    return tree


def attach_panel_lines_modifier(
    obj: bpy.types.Object,
    panel_depth: float = -0.04,
    panel_inset: float = 0.82,
    modifier_name: Optional[str] = None,
) -> bpy.types.NodesModifier:
    """
    Attach (or replace) the PanelLines GN modifier on obj.
    Requires obj.data to have a BOOLEAN FACE attribute 'panel_face'.
    Returns the modifier for further customisation.
    """
    name = modifier_name or MODIFIER_ID
    existing_mod = obj.modifiers.get(name)
    if existing_mod:
        obj.modifiers.remove(existing_mod)

    tree = _get_or_build_tree()
    mod = obj.modifiers.new(name=name, type="NODES")
    mod.node_group = tree
    mod["Input_1"] = panel_depth
    mod["Input_2"] = panel_inset
    return mod
