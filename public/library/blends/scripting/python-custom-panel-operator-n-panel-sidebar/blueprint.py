# ============================================================
# BLUEPRINT: Python bpy.types.Panel + Operator — N-Panel Sidebar
# HoloFlow Export Prep Add-on  (Blender 5.1)
# ============================================================
# PURPOSE:
#   Complete add-on authoring pattern:
#     PropertyGroup → bpy.types.Panel → bpy.types.Operator → register()
#   Builds a "HoloFlow" tab in the 3D Viewport N-Panel with operators that
#   automate WebXR export prep: apply transforms, tag holoflow:facet, and
#   fire bpy.ops.export_scene.gltf() with studio-standard settings.
#
# WHY THIS MATTERS:
#   The N-Panel (toggled with N in the viewport) is where Blender artists
#   look for tool-specific controls. Putting export prep here, rather than
#   in the File menu, means it is reachable without leaving the viewport —
#   critical during iterative prop-tweaking sessions.
#
# TECHNIQUE — key decisions:
#   1. PropertyGroup on bpy.types.Scene (not Preferences) so settings travel
#      with the .blend file and differ between projects.
#   2. PointerProperty attaches the group to built-in types — Blender
#      introspects __annotations__ to build C-level RNA, so props must be
#      annotations, not plain class attributes.
#   3. poll() on every operator so buttons auto-grey when context is wrong
#      (wrong mode, no selection, etc.) — no error dialogs needed.
#   4. temp_override() wraps operator calls that need a specific active
#      object without permanently changing bpy.context.
#   5. Sub-panel with bl_parent_id nests cleanly inside the parent panel,
#      collapsible via DEFAULT_CLOSED to keep the UI uncluttered.
#
# BLENDER 5.1 NOTE:
#   bl_info still works for classic add-ons installed via Preferences >
#   Add-ons > Install. Extensions Platform (4.2+) uses blender_manifest.toml
#   instead — see tools/blender-addon/holoflow_extensions/ for that pattern.
#   The registration logic here is identical between the two.
# ============================================================

import os
import re

import bpy
from bpy.props import (
    BoolProperty,
    EnumProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
    StringProperty,
)
from bpy.types import Operator, Panel, PropertyGroup

bl_info = {
    "name": "HoloFlow Export Prep",
    "author": "Holoflow Studio",
    "version": (0, 1, 0),
    "blender": (5, 1, 0),
    "location": "View3D > Sidebar > HoloFlow",
    "description": "WebXR export-prep utilities: apply transforms, tag facets, batch GLB export.",
    "category": "Import-Export",
}

# ── Named constants ──────────────────────────────────────────
DRACO_DEFAULT = 6
SCALE_DEFAULT = 1.0
TEXTURE_ITEMS = [
    ("WEBP", "WebP",
     "Lossy/lossless WebP — Holoflow standard (smallest at equivalent quality)"),
    ("PNG",  "PNG",
     "Lossless PNG — for data textures where WebP chroma subsampling is harmful"),
    ("JPEG", "JPEG",
     "Lossy JPEG — legacy fallback; avoid for normal / roughness maps"),
]
_SNAKE_RE = re.compile(r"[^a-z0-9]+")

# ── PropertyGroup: scene-level settings ──────────────────────
# One instance per scene, persists in the .blend file.
# ALL props use __annotations__ (PEP 526 style). Plain class attributes
# like `my_prop = FloatProperty(...)` are silently ignored by Blender's
# RNA system in 4.x+ — a common beginner trap.

class HoloflowSceneProps(PropertyGroup):
    export_scale: FloatProperty(
        name="Export Scale",
        description="Uniform scale multiplier at GLB export (1.0 = metres for WebXR)",
        default=SCALE_DEFAULT,
        min=0.001, max=100.0, step=1, precision=3,
    )
    apply_transforms: BoolProperty(
        name="Apply Transforms",
        description="Apply loc/rot/scale before export so the GLB root matrix is identity",
        default=True,
    )
    texture_format: EnumProperty(
        name="Texture Format",
        description="Image format embedded in the GLB for all material textures",
        items=TEXTURE_ITEMS,
        default="WEBP",
    )
    draco_level: IntProperty(
        name="Draco Level",
        description="Draco mesh compression level 0–10; 6 balances size vs decode time",
        default=DRACO_DEFAULT,
        min=0, max=10,
    )
    output_dir: StringProperty(
        name="Output Dir",
        description="Absolute or blend-relative (//) path for exported GLBs",
        default="//exports/",
        subtype="DIR_PATH",
    )


# ── PropertyGroup: per-object settings ───────────────────────
# Stored on bpy.types.Object so each object carries its own flag.

class HoloflowObjectProps(PropertyGroup):
    facet_flag: BoolProperty(
        name="holoflow:facet",
        description=(
            "Marks this object for flat-shaded faceted rendering in WebXR. "
            "Sets custom property holoflow:facet = 1 which the exporter reads."
        ),
        default=False,
    )


# ── Operators ─────────────────────────────────────────────────
# Naming rule: CATEGORY_OT_verb_noun (all-caps category, OT separator).
# poll() is a classmethod; returning False greys the button — no execute() call.
# bl_options: REGISTER puts the op in the Undo history; UNDO enables Ctrl-Z.

class HOLOFLOW_OT_apply_transforms(Operator):
    bl_idname = "holoflow.apply_transforms"
    bl_label = "Apply All Transforms"
    bl_description = "Apply location / rotation / scale on every selected mesh object"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return (
            context.mode == "OBJECT"
            and any(o.type == "MESH" for o in context.selected_objects)
        )

    def execute(self, context):
        meshes = [o for o in context.selected_objects if o.type == "MESH"]
        for obj in meshes:
            # transform_apply is a context-sensitive operator: it always acts on
            # context.active_object. temp_override() swaps that for the duration
            # of the call without touching the real context permanently.
            with context.temp_override(active_object=obj, selected_objects=[obj]):
                bpy.ops.object.transform_apply(
                    location=True, rotation=True, scale=True
                )
        self.report({"INFO"}, f"Applied transforms on {len(meshes)} object(s).")
        return {"FINISHED"}


class HOLOFLOW_OT_tag_facet(Operator):
    bl_idname = "holoflow.tag_facet"
    bl_label = "Tag holoflow:facet"
    bl_description = "Set or clear the holoflow:facet custom property on selected objects"
    bl_options = {"REGISTER", "UNDO"}

    enable: BoolProperty(name="Enable", default=True)  # operator property set by the caller

    @classmethod
    def poll(cls, context):
        return context.mode == "OBJECT" and bool(context.selected_objects)

    def execute(self, context):
        for obj in context.selected_objects:
            obj.hf_props.facet_flag = self.enable
            if self.enable:
                # Custom properties with colons can't be set via Python attribute
                # access — use dict-style assignment instead.
                obj["holoflow:facet"] = 1
            elif "holoflow:facet" in obj:
                del obj["holoflow:facet"]
        state = "set" if self.enable else "cleared"
        self.report({"INFO"}, f"holoflow:facet {state} on {len(context.selected_objects)} object(s).")
        return {"FINISHED"}


class HOLOFLOW_OT_batch_rename_snake(Operator):
    bl_idname = "holoflow.batch_rename_snake"
    bl_label = "Rename → snake_case"
    bl_description = "Rename selected objects to lowercase snake_case (replaces spaces and dots)"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        return context.mode == "OBJECT" and bool(context.selected_objects)

    def execute(self, context):
        for obj in context.selected_objects:
            lower = obj.name.lower()
            snake = _SNAKE_RE.sub("_", lower).strip("_")
            obj.name = snake
        return {"FINISHED"}


class HOLOFLOW_OT_export_glb(Operator):
    bl_idname = "holoflow.export_glb"
    bl_label = "Export Selected GLB"
    bl_description = "Export selection to GLB using scene HoloFlow settings"
    bl_options = {"REGISTER"}

    @classmethod
    def poll(cls, context):
        return context.mode == "OBJECT" and bool(context.selected_objects)

    def execute(self, context):
        props = context.scene.hf_scene
        out_dir = bpy.path.abspath(props.output_dir)
        os.makedirs(out_dir, exist_ok=True)

        blend_name = bpy.path.basename(context.blend_data.filepath) or "untitled"
        stem = os.path.splitext(blend_name)[0]
        out_path = os.path.join(out_dir, f"{stem}.glb")

        if props.apply_transforms:
            bpy.ops.holoflow.apply_transforms()

        # export_apply bakes the modifier stack into real vertices in the GLB —
        # without it the base un-modified mesh is exported, which is almost never
        # what you want for production assets.
        bpy.ops.export_scene.gltf(
            filepath=out_path,
            use_selection=True,
            export_apply=True,
            export_image_format=props.texture_format,
            export_image_quality=90,
            export_draco_mesh_compression_enable=props.draco_level > 0,
            export_draco_mesh_compression_level=props.draco_level,
            export_yup=True,
        )
        self.report({"INFO"}, f"Exported → {out_path}")
        return {"FINISHED"}


# ── Panels ────────────────────────────────────────────────────
# Naming rule: CATEGORY_PT_descriptive_name (PT = panel type).
# bl_category creates (or reuses) a tab in the N-Panel sidebar.
# Sub-panels declare bl_parent_id pointing to their parent's bl_idname.

class HOLOFLOW_PT_export_prep(Panel):
    bl_idname = "HOLOFLOW_PT_export_prep"
    bl_label = "Export Prep"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "HoloFlow"

    def draw(self, context):
        layout = self.layout
        props = context.scene.hf_scene

        # use_property_split: labels align left, widgets right — standard Blender look.
        # use_property_decorate = False: hides the keyframe-animation dot column.
        layout.use_property_split = True
        layout.use_property_decorate = False

        col = layout.column(align=True)
        col.prop(props, "output_dir")
        col.prop(props, "export_scale")
        col.prop(props, "texture_format")
        col.prop(props, "draco_level")

        layout.separator()
        layout.prop(props, "apply_transforms", icon="ORIENTATION_GLOBAL")

        layout.separator()
        row = layout.row()
        row.scale_y = 1.4   # taller button makes the primary action visually prominent
        row.operator("holoflow.export_glb", icon="EXPORT")


class HOLOFLOW_PT_object_props(Panel):
    bl_idname = "HOLOFLOW_PT_object_props"
    bl_label = "Active Object"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "HoloFlow"
    bl_parent_id = "HOLOFLOW_PT_export_prep"  # nests inside the parent
    bl_options = {"DEFAULT_CLOSED"}

    @classmethod
    def poll(cls, context):
        return context.active_object is not None

    def draw(self, context):
        layout = self.layout
        obj = context.active_object
        layout.use_property_split = True
        layout.use_property_decorate = False

        box = layout.box()
        box.label(text=obj.name, icon="OBJECT_DATA")
        box.prop(obj.hf_props, "facet_flag")

        # Operator properties set via the returned operator reference, not kwargs.
        row = box.row(align=True)
        op_set = row.operator("holoflow.tag_facet", text="Tag Facet", icon="CHECKMARK")
        op_set.enable = True
        op_clr = row.operator("holoflow.tag_facet", text="Clear",     icon="X")
        op_clr.enable = False

        layout.separator()
        layout.operator("holoflow.batch_rename_snake", icon="SORTALPHA")
        layout.operator("holoflow.apply_transforms",  icon="ORIENTATION_GLOBAL")


# ── Registration ──────────────────────────────────────────────
# PropertyGroups must register before the PointerProperty calls in register().
# Panels may register in any order relative to operators, but keeping them last
# makes the intent clearer.

CLASSES = [
    HoloflowSceneProps,
    HoloflowObjectProps,
    HOLOFLOW_OT_apply_transforms,
    HOLOFLOW_OT_tag_facet,
    HOLOFLOW_OT_batch_rename_snake,
    HOLOFLOW_OT_export_glb,
    HOLOFLOW_PT_export_prep,
    HOLOFLOW_PT_object_props,
]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    # Attach groups after registering the group classes; otherwise
    # PointerProperty(type=...) would reference an unregistered type.
    bpy.types.Scene.hf_scene  = PointerProperty(type=HoloflowSceneProps)
    bpy.types.Object.hf_props = PointerProperty(type=HoloflowObjectProps)


def unregister():
    # Delete PointerProperties before unregistering the classes they point to;
    # reversing the order causes a RuntimeError on the del statement.
    del bpy.types.Scene.hf_scene
    del bpy.types.Object.hf_props
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    # Running from the Scripting workspace Text editor executes this block.
    # If classes are already registered (re-run after an edit), unregister first.
    try:
        unregister()
    except Exception:
        pass
    register()
