# Holoflow Quick Facet — Blender 5.1 Extension
# Installable via: Preferences → Get Extensions → Install from Disk
#
# This file is the entry point for the extension when installed normally.
# It is identical to the tutorial's blueprint.py; the split exists only so the
# tools/ directory has a clean, pip-installable copy separate from the library.
#
# For the annotated teaching version with full inline commentary, see:
#   public/library/blends/scripting/python-addon-custom-panel-property-group/blueprint.py

import bpy
from bpy.props import (
    EnumProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
)
from bpy.types import Operator, Panel, PropertyGroup

PANEL_CATEGORY = "Holoflow"
BEVEL_MOD_NAME = "HF_Bevel"


class QuickFacetProps(PropertyGroup):
    shade_mode: EnumProperty(
        name="Normal Mode",
        items=[
            ("FLAT",   "Flat",   "Hard facets — disable smooth shading entirely"),
            ("SMOOTH", "Smooth", "Smooth shading across all edges"),
            ("AUTO",   "Auto",   "Smooth shading with 30° hard-edge threshold"),
        ],
        default="FLAT",
    )  # type: ignore

    bevel_width: FloatProperty(
        name="Bevel Width",
        default=0.015,
        min=0.0, max=1.0,
        step=0.5, precision=3,
        unit="LENGTH",
    )  # type: ignore

    bevel_segments: IntProperty(
        name="Segments",
        default=1, min=1, max=8,
    )  # type: ignore


class HOLOFLOW_OT_quick_facet(Operator):
    """Apply flat shading and bevel to the active mesh."""
    bl_idname  = "holoflow.quick_facet"
    bl_label   = "Apply Quick Facet"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return (
            context.active_object is not None
            and context.active_object.type == "MESH"
            and context.mode == "OBJECT"
        )

    def execute(self, context):
        ob    = context.active_object
        props = context.scene.hf_facet

        if props.shade_mode == "FLAT":
            bpy.ops.object.shade_flat()
        elif props.shade_mode == "SMOOTH":
            bpy.ops.object.shade_smooth()
        else:
            bpy.ops.object.shade_smooth()
            ang_mod = ob.modifiers.get("HF_SmoothAngle")
            if ang_mod is None:
                ang_mod = ob.modifiers.new("HF_SmoothAngle", "SMOOTH_BY_ANGLE")
            ang_mod.angle = 0.523599   # 30°

        bevel = ob.modifiers.get(BEVEL_MOD_NAME)
        if bevel is None:
            bevel = ob.modifiers.new(name=BEVEL_MOD_NAME, type="BEVEL")

        bevel.width             = props.bevel_width
        bevel.segments          = props.bevel_segments
        bevel.limit_method      = "ANGLE"
        bevel.angle_limit       = 0.523599
        bevel.miter_outer       = "MITER_ARC"
        bevel.use_clamp_overlap = True

        self.report({"INFO"}, f"Quick Facet applied to '{ob.name}'")
        return {"FINISHED"}


class HOLOFLOW_PT_quick_facet(Panel):
    bl_label       = "Quick Facet"
    bl_idname      = "HOLOFLOW_PT_quick_facet"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = PANEL_CATEGORY

    def draw(self, context):
        layout = context.layout
        props  = context.scene.hf_facet
        col    = layout.column(align=True)
        col.prop(props, "shade_mode")
        col.separator()
        col.prop(props, "bevel_width",    slider=True)
        col.prop(props, "bevel_segments", slider=True)
        layout.separator()
        layout.operator(HOLOFLOW_OT_quick_facet.bl_idname, icon="MOD_BEVEL")
        if not HOLOFLOW_OT_quick_facet.poll(context):
            layout.label(text="Select a mesh in Object Mode", icon="INFO")


_CLASSES = (QuickFacetProps, HOLOFLOW_OT_quick_facet, HOLOFLOW_PT_quick_facet)


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.hf_facet = PointerProperty(type=QuickFacetProps)


def unregister():
    del bpy.types.Scene.hf_facet
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)
