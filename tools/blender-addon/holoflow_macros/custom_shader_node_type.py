"""
holoflow_macros/custom_shader_node_type.py
Reusable base classes for custom Shader Editor nodes.
Blender 5.1 | CC0

Import into any Holoflow add-on to create custom Shader Editor nodes:

    from holoflow_macros.custom_shader_node_type import (
        HFNodeMixin, make_bool_socket, register_node_category
    )

    class ShaderNodeMyCustom(HFNodeMixin, bpy.types.ShaderNode):
        bl_idname = "ShaderNodeMyCustom"
        bl_label  = "My Custom Node"
        ...
"""

import bpy
from bpy.props import BoolProperty
from nodeitems_utils import NodeCategory, NodeItem  # type: ignore


class HFBoolSocket(bpy.types.NodeSocket):
    """Shared Boolean status socket with green/red colour coding."""
    bl_idname = "HFBoolSocket"
    bl_label  = "HF Bool Status"

    default_value: BoolProperty(default=False)  # type: ignore

    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "default_value", text=text)

    def draw_color(self, context, node):
        return (0.0, 0.78, 0.22, 1.0) if self.default_value else (0.80, 0.12, 0.12, 1.0)


class HFNodeMixin:
    """Mixin that restricts a ShaderNode subclass to the Shader Editor."""

    @classmethod
    def poll(cls, ntree):
        return ntree.bl_idname == "ShaderNodeTree"


class HFShaderNodeCategory(NodeCategory):
    """NodeCategory restricted to the Shader Editor."""
    @classmethod
    def poll(cls, context):
        return context.space_data.tree_type == "ShaderNodeTree"


def make_bool_socket(node_self, name: str) -> None:
    """Add an HFBoolSocket output named `name` to `node_self`."""
    node_self.outputs.new("HFBoolSocket", name)


def register_node_category(unique_id: str, label: str, node_idnames: list) -> None:
    """Register a Holoflow Shader Editor category with the given node id-names."""
    from nodeitems_utils import register_node_categories
    register_node_categories(unique_id, [
        HFShaderNodeCategory(unique_id, label, items=[
            NodeItem(n) for n in node_idnames
        ]),
    ])


def unregister_node_category(unique_id: str) -> None:
    from nodeitems_utils import unregister_node_categories
    unregister_node_categories(unique_id)


_MACRO_CLASSES = [HFBoolSocket]


def register():
    for cls in _MACRO_CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(_MACRO_CLASSES):
        bpy.utils.unregister_class(cls)
