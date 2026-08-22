# Holoflow Quick Facet — Blender 5.1 Extension Source
# tutorial: Python — Custom Panel + PropertyGroup + Operator
#
# PURPOSE
# -------
# This file IS the extension.  Paste it into Blender's Text Editor and
# press Alt+P to register the add-on in the running session, or install
# it via Preferences → Get Extensions → Install from Disk.
#
# The extension demonstrates every core pattern for building a Blender
# 5.1 add-on: PropertyGroup, Panel, Operator, poll(), bl_options UNDO,
# and the correct register / unregister lifecycle.
#
# WHAT IT BUILDS
# --------------
# A "Quick Facet" sidebar panel (N-panel → Holoflow tab) with three
# properties.  The Apply button:
#   1. Sets shade mode (flat / smooth / auto-smooth).
#   2. Adds or updates a Bevel modifier on the active mesh.
#
# Blender 5.1 / Extensions Platform:
#   — blender_manifest.toml (see tools/blender-addon/holoflow_extensions/quick_facet/)
#     is the preferred distribution descriptor.  bl_info is legacy but still
#     parsed for backward compat with older launchers; keep both.
#   — Extensions install via Extensions Platform; no need to zip manually.

import bpy
from bpy.props import (
    EnumProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
)
from bpy.types import Operator, Panel, PropertyGroup

# ── Module-level constants (change here, cascade everywhere) ────────────────────
ADDON_ID       = "holoflow_quick_facet"
PANEL_CATEGORY = "Holoflow"
BEVEL_MOD_NAME = "HF_Bevel"


# ── PropertyGroup ───────────────────────────────────────────────────────────────
#
# WHY PropertyGroup instead of top-level bpy.types.Scene properties?
#   — Bundles related props under one namespace (scene.hf_facet.*).
#   — Prevents pollution of the global Scene type with dozens of loose props.
#   — Can be reused: PointerProperty lets you attach the same group to
#     Scene, Object, Material, or any other ID type simultaneously.
#   — Saved to .blend like any other ID property — each file carries its own values.

class QuickFacetProps(PropertyGroup):
    """Per-scene settings for the Quick Facet operator."""

    shade_mode: EnumProperty(
        name="Normal Mode",
        description=(
            "How face normals are handled.  "
            "Flat = hard facets; Smooth = soft shading; "
            "Auto = smooth within the bevel hinge angle"
        ),
        items=[
            ("FLAT",   "Flat",   "Disable smooth shading — every polygon shows its own normal"),
            ("SMOOTH", "Smooth", "Enable smooth shading across all edges"),
            ("AUTO",   "Auto",   "Smooth shading, but honour hard edges at 30° threshold"),
        ],
        default="FLAT",
    )  # type: ignore  # bpy descriptors are not typed for mypy

    bevel_width: FloatProperty(
        name="Bevel Width",
        description="Half-width of the chamfer added to hard edges",
        default=0.015,
        min=0.0,
        max=1.0,
        step=0.5,      # UI step = 0.005 (step / 100)
        precision=3,
        unit="LENGTH",
    )  # type: ignore

    bevel_segments: IntProperty(
        name="Segments",
        description=(
            "Loop-cut count inside the bevel.  "
            "1 = clean chamfer (preferred for faceted/low-poly).  "
            "3+ = smooth arc (better with SMOOTH shade mode)."
        ),
        default=1,
        min=1,
        max=8,
    )  # type: ignore


# ── Operator ────────────────────────────────────────────────────────────────────
#
# bl_idname convention: <category>.<name>  — all lowercase, underscore only.
#   "holoflow.quick_facet" registers as bpy.ops.holoflow.quick_facet().
#
# bl_options:
#   REGISTER — adds the operator to the Redo panel (F9 after execution)
#              so the user can tweak width/segments immediately.
#   UNDO     — pushes an undo step.  Without this, Ctrl+Z won't reverse it.

class HOLOFLOW_OT_quick_facet(Operator):
    """Apply flat shading and bevel to the active mesh in one click.\n\nSee Holoflow Quick Facet panel for settings."""
    bl_idname  = "holoflow.quick_facet"
    bl_label   = "Apply Quick Facet"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        # poll() is called every redraw — keep it cheap.
        # Return True only when the button should be active.
        return (
            context.active_object is not None
            and context.active_object.type == "MESH"
            and context.mode == "OBJECT"
        )

    def execute(self, context):
        ob    = context.active_object
        props = context.scene.hf_facet

        # ── Shade mode ──────────────────────────────────────────────────────────
        # In Blender 5.1, smooth/flat is an object-level flag, not per-polygon.
        # The operators below set ob.data.polygons[*].use_smooth implicitly.
        # use_auto_smooth was removed from mesh data in 5.x — the Smooth by Angle
        # modifier replaces it; for simplicity we mimic the old behaviour here.
        if props.shade_mode == "FLAT":
            bpy.ops.object.shade_flat()
        elif props.shade_mode == "SMOOTH":
            bpy.ops.object.shade_smooth()
        else:  # AUTO — smooth shading + 30° hard-edge threshold
            bpy.ops.object.shade_smooth()
            # Smooth by Angle modifier (Blender 5.x equivalent of auto-smooth):
            ang_mod = ob.modifiers.get("HF_SmoothAngle")
            if ang_mod is None:
                ang_mod = ob.modifiers.new("HF_SmoothAngle", "SMOOTH_BY_ANGLE")
            ang_mod.angle = 0.523599   # 30 degrees in radians

        # ── Bevel modifier ──────────────────────────────────────────────────────
        # Idempotent: re-use the modifier if it already exists so re-running
        # the operator updates values rather than stacking duplicate modifiers.
        bevel = ob.modifiers.get(BEVEL_MOD_NAME)
        if bevel is None:
            bevel = ob.modifiers.new(name=BEVEL_MOD_NAME, type="BEVEL")

        bevel.width            = props.bevel_width
        bevel.segments         = props.bevel_segments
        bevel.limit_method     = "ANGLE"
        bevel.angle_limit      = 0.523599    # 30° — standard hard-surface threshold
        bevel.miter_outer      = "MITER_ARC" # Arc miter prevents corner pinching
        bevel.use_clamp_overlap = True       # Prevents self-intersection on tight verts

        self.report({"INFO"}, f"Quick Facet applied to '{ob.name}'")
        return {"FINISHED"}


# ── Panel ────────────────────────────────────────────────────────────────────────
#
# bl_space_type = "VIEW_3D"  — only appears in the 3D Viewport.
# bl_region_type = "UI"      — UI = the collapsible N-panel on the right.
# bl_category               — the tab label shown in the N-panel strip.
#
# draw() is called every redraw; keep it fast, no heavy computation.

class HOLOFLOW_PT_quick_facet(Panel):
    """Holoflow Quick Facet — sidebar panel."""
    bl_label       = "Quick Facet"
    bl_idname      = "HOLOFLOW_PT_quick_facet"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = PANEL_CATEGORY

    def draw(self, context):
        layout = context.layout
        props  = context.scene.hf_facet

        col = layout.column(align=True)
        col.prop(props, "shade_mode")
        col.separator()
        col.prop(props, "bevel_width",    slider=True)
        col.prop(props, "bevel_segments", slider=True)

        layout.separator()
        layout.operator(HOLOFLOW_OT_quick_facet.bl_idname, icon="MOD_BEVEL")

        if not HOLOFLOW_OT_quick_facet.poll(context):
            layout.label(text="Select a mesh in Object Mode", icon="INFO")


# ── Register / Unregister ────────────────────────────────────────────────────────
#
# Classes are registered in dependency order:
#   PropertyGroup first (other classes reference it),
#   then Operator and Panel (independent of each other).
# Unregistration reverses that order.

_CLASSES = (
    QuickFacetProps,
    HOLOFLOW_OT_quick_facet,
    HOLOFLOW_PT_quick_facet,
)


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    # PointerProperty attaches the group to bpy.types.Scene.
    # Each open .blend file carries its own independent copy of hf_facet values.
    bpy.types.Scene.hf_facet = PointerProperty(type=QuickFacetProps)


def unregister():
    del bpy.types.Scene.hf_facet
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)


# Guard: Alt+P in the Text Editor sets __name__ == "__main__".
# This block lets you test the add-on interactively without a Preferences install.
if __name__ == "__main__":
    register()
