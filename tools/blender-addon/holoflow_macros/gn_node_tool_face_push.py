"""
holoflow_macros/gn_node_tool_face_push.py
Blender 5.1 · CC0 · Holoflow Studio

Installs the Face-Push Panel Stamp as a registered Node Tool in the
Blender 5.1 3D View toolbar. When the add-on is enabled, 'Face Push
Stamp' appears under the Holoflow tab in Edit Mode.

The actual GN tree (GN_FacePush_Tool, is_tool=True) must already exist
in the .blend file — either from blueprint.py or packed into the add-on
blend data. This module handles only registration + UI discovery; the
tree drives the actual mesh editing.

Usage:
  1. Run blueprint.py to create GN_FacePush_Tool in your scene.
  2. Copy this file to your Blender add-on directory.
  3. Enable it under Edit → Preferences → Add-ons.
  4. Enter Edit Mode → select faces → Toolbar (T) → Holoflow → Face Push Stamp.
"""

bl_info = {
    "name":        "Holoflow — Face Push Stamp (Node Tool)",
    "author":      "Holoflow Studio",
    "version":     (1, 0, 0),
    "blender":     (5, 1, 0),
    "location":    "3D View > Toolbar > Holoflow (Edit Mode)",
    "description": "Push selected faces along their normals via a GN Node Tool",
    "category":    "Mesh",
}

import bpy

TOOL_NG_NAME = "GN_FacePush_Tool"


class HOLOFLOW_OT_face_push_stamp(bpy.types.Operator):
    """Push selected faces outward along their normals."""
    bl_idname      = "holoflow.face_push_stamp"
    bl_label       = "Face Push Stamp"
    bl_options     = {"REGISTER", "UNDO"}
    bl_context_mode = "EDIT_MESH"

    amount: bpy.props.FloatProperty(
        name="Amount",
        default=0.06,
        min=-0.5,
        max=0.5,
        unit="LENGTH",
        description="Outward push distance in metres",
    )
    randomness: bpy.props.FloatProperty(
        name="Randomness",
        default=0.0,
        min=0.0,
        max=1.0,
        description="Per-face magnitude variation (0 = uniform, 1 = ±50 %)",
    )

    @classmethod
    def poll(cls, context):
        return (
            context.mode == "EDIT_MESH"
            and TOOL_NG_NAME in bpy.data.node_groups
        )

    def execute(self, context):
        ob = context.active_object
        ng = bpy.data.node_groups[TOOL_NG_NAME]

        # Apply the tool tree as a temporary modifier, bake, then remove.
        mod = ob.modifiers.new("_fp_tmp", "NODES")
        mod.node_group = ng
        for item in ng.interface.items_tree:
            if item.name == "Amount":
                mod[item.identifier] = self.amount
            elif item.name == "Randomness":
                mod[item.identifier] = self.randomness

        # Exit edit mode to bake, re-enter
        bpy.ops.object.editmode_toggle()
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.object.editmode_toggle()
        return {"FINISHED"}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)


class HOLOFLOW_PT_face_push_panel(bpy.types.Panel):
    bl_label       = "Face Push Stamp"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = "Holoflow"
    bl_context     = ".mesh_edit"

    def draw(self, context):
        layout = self.layout
        layout.operator("holoflow.face_push_stamp", icon="MOD_DISPLACE")
        if TOOL_NG_NAME not in bpy.data.node_groups:
            layout.label(text="Run blueprint.py first", icon="ERROR")


def register():
    bpy.utils.register_class(HOLOFLOW_OT_face_push_stamp)
    bpy.utils.register_class(HOLOFLOW_PT_face_push_panel)


def unregister():
    bpy.utils.unregister_class(HOLOFLOW_PT_face_push_panel)
    bpy.utils.unregister_class(HOLOFLOW_OT_face_push_stamp)


if __name__ == "__main__":
    register()
