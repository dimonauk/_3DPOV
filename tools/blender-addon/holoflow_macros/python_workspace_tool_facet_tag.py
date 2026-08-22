"""
holoflow_macros/python_workspace_tool_facet_tag.py
Reusable factory for a WorkSpaceTool that click-assigns any INT attribute.
Blender 5.1  |  CC0

Usage
-----
    from holoflow_macros.python_workspace_tool_facet_tag import (
        build_facet_tag_tool,
        register_facet_tag_tool,
        unregister_facet_tag_tool,
    )

    # In your add-on register():
    register_facet_tag_tool(attr_name="holoflow:facet", after={"builtin.select"})

    # In your add-on unregister():
    unregister_facet_tag_tool()
"""

import bpy
import bmesh

# Module-level references so unregister can find what was registered
_tool_cls = None
_prop_cls = None
_op_cls   = None


def build_facet_tag_tool(attr_name: str = "holoflow:facet"):
    """
    Dynamically builds a WorkSpaceTool + Operator pair for the given
    attribute name.  Returns (ToolClass, PropClass, OpClass).

    Why dynamic: Blender WorkSpaceTools have their bl_idname baked as a
    class attribute at definition time.  If you want multiple tools for
    different attributes, you must define separate classes — this factory
    does that at call time via type().
    """
    prop_cls_name = f"HLF_TagToolProps_{attr_name.replace(':', '_')}"
    op_idname     = f"mesh.hlf_tag_{attr_name.replace(':', '_').replace('-', '_')}"
    tool_idname   = f"mesh_tool.hlf_{attr_name.replace(':', '_').replace('-', '_')}"

    PropCls = type(prop_cls_name, (bpy.types.PropertyGroup,), {
        "__annotations__": {
            "enable": bpy.props.BoolProperty(
                name="Enable",
                description=f"Write 1 to {attr_name} on click; uncheck to write 0",
                default=True,
            )
        }
    })

    # Build operator class with closure over attr_name and prop_cls_name
    def make_op(attr, pcn):
        class _Op(bpy.types.Operator):
            bl_idname  = op_idname
            bl_label   = f"Tag {attr}"
            bl_options = {"REGISTER", "UNDO"}

            @classmethod
            def poll(cls, context):
                return (
                    context.active_object is not None
                    and context.active_object.type == 'MESH'
                    and context.mode == 'EDIT_MESH'
                )

            def invoke(self, context, event):
                bpy.ops.view3d.select(
                    location=(event.mouse_region_x, event.mouse_region_y),
                    deselect_all=True,
                )
                obj = context.active_object
                me  = obj.data
                bm  = bmesh.from_edit_mesh(me)
                bm.faces.ensure_lookup_table()
                face = bm.faces.active
                if face is None:
                    return {'CANCELLED'}
                layer = bm.faces.layers.int.get(attr)
                if layer is None:
                    layer = bm.faces.layers.int.new(attr)
                props = getattr(context.window_manager, pcn)
                face[layer] = 1 if props.enable else 0
                bmesh.update_edit_mesh(me, loop_triangles=False, destructive=False)
                return {'FINISHED'}

        _Op.__name__     = f"HLF_OT_{attr.replace(':', '_')}"
        _Op.__qualname__ = _Op.__name__
        return _Op

    OpCls = make_op(attr_name, prop_cls_name)

    def make_draw(pcn):
        @staticmethod
        def draw_settings(context, layout, tool):
            props = getattr(context.window_manager, pcn)
            row = layout.row(align=True)
            row.prop(props, "enable", text="Enable", toggle=True)
        return draw_settings

    ToolCls = type(
        f"HLF_WT_{attr_name.replace(':', '_')}",
        (bpy.types.WorkSpaceTool,),
        {
            "bl_space_type":   'VIEW_3D',
            "bl_context_mode": 'EDIT_MESH',
            "bl_idname":       tool_idname,
            "bl_label":        f"HF {attr_name}",
            "bl_description":  f"Click to set {attr_name} INT attribute on face",
            "bl_icon":         "BRUSHES_ALL",
            "bl_cursor":       "CROSSHAIR",
            "bl_widget":       None,
            "bl_keymap": (
                (op_idname, {"type": "LEFTMOUSE", "value": "PRESS"}, {}),
            ),
            "draw_settings": make_draw(prop_cls_name),
        },
    )

    return ToolCls, PropCls, OpCls


def register_facet_tag_tool(attr_name: str = "holoflow:facet",
                             after: set = None):
    """Register the tool, operator, and property group for attr_name."""
    global _tool_cls, _prop_cls, _op_cls
    _tool_cls, _prop_cls, _op_cls = build_facet_tag_tool(attr_name)

    bpy.utils.register_class(_prop_cls)
    bpy.utils.register_class(_op_cls)
    bpy.utils.register_tool(
        _tool_cls,
        after=after or {"builtin.select"},
        separator=True,
    )
    prop_attr = _prop_cls.__name__
    setattr(bpy.types.WindowManager, prop_attr,
            bpy.props.PointerProperty(type=_prop_cls))


def unregister_facet_tag_tool():
    """Unregister in safe reverse order."""
    global _tool_cls, _prop_cls, _op_cls
    if _prop_cls is None:
        return
    prop_attr = _prop_cls.__name__
    if hasattr(bpy.types.WindowManager, prop_attr):
        delattr(bpy.types.WindowManager, prop_attr)
    try:
        bpy.utils.unregister_tool(_tool_cls)
    except Exception:
        pass
    for cls in [_op_cls, _prop_cls]:
        try:
            bpy.utils.unregister_class(cls)
        except Exception:
            pass
    _tool_cls = _prop_cls = _op_cls = None
