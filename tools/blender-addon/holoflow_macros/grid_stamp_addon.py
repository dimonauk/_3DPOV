"""
holoflow_macros/grid_stamp_addon.py
=====================================
Blender 5.1 | Holoflow Studio | CC0

Reusable mini-addon skeleton: PropertyGroup + Operator + Panel.
Illustrates the complete registration anatomy in importable form.

Usage (from another add-on or script):

    from holoflow_macros.grid_stamp_addon import register, unregister, run_grid_stamp

    register()
    # … configure bpy.context.scene.holoflow_grid_stamp …
    run_grid_stamp(grid_x=5, grid_y=3, spacing=2.0, plane="XZ")
    # unregister() when done to clean up

See tutorial: /tutorials/blender-tutorial-python-bpy-addon-operator-panel-props
See blueprint: public/library/blends/scripting/python-bpy-addon-operator-panel-props/blueprint.py
"""

import bpy
from bpy.types import Operator, Panel, PropertyGroup
from bpy.props import (
    BoolProperty,
    EnumProperty,
    FloatProperty,
    IntProperty,
    PointerProperty,
)

PANEL_CATEGORY = "Holoflow"

# ── PropertyGroup ─────────────────────────────────────────────────────────────
class HOLOFLOW_PG_GridStamp(PropertyGroup):
    grid_x: IntProperty(name="Columns", default=3, min=1, max=32)
    grid_y: IntProperty(name="Rows",    default=3, min=1, max=32)
    spacing: FloatProperty(
        name="Spacing", default=1.5,
        min=0.0, soft_max=20.0, step=10, precision=3, unit="LENGTH",
    )
    scale: FloatProperty(name="Scale", default=1.0, min=0.001, soft_max=4.0)
    plane: EnumProperty(
        name="Plane",
        items=[
            ("XY", "XY — ground",    "Grid lies flat"),
            ("XZ", "XZ — front wall","Grid on front wall"),
            ("YZ", "YZ — side wall", "Grid on side wall"),
        ],
        default="XY",
    )
    apply_transforms: BoolProperty(
        name="Apply Transforms",
        description="Apply scale/rotation on each copy (needed for GLB export)",
        default=False,
    )

# ── Operator ──────────────────────────────────────────────────────────────────
class HOLOFLOW_OT_GridStamp(Operator):
    """Array the active object into an X × Y grid"""
    bl_idname  = "holoflow.grid_stamp"
    bl_label   = "Grid Stamp"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        ob = context.active_object
        return context.mode == "OBJECT" and ob is not None and ob.select_get()

    def execute(self, context):
        props = context.scene.holoflow_grid_stamp
        src   = context.active_object
        for row in range(props.grid_y):
            for col in range(props.grid_x):
                if col == 0 and row == 0:
                    continue
                s = props.spacing
                if props.plane == "XY":
                    dx, dy, dz = col * s, row * s, 0.0
                elif props.plane == "XZ":
                    dx, dy, dz = col * s, 0.0, row * s
                else:
                    dx, dy, dz = 0.0, col * s, row * s
                bpy.ops.object.duplicate(linked=True)
                dup = context.active_object
                dup.location = (src.location.x + dx, src.location.y + dy, src.location.z + dz)
                dup.scale = (props.scale,) * 3
                if props.apply_transforms:
                    bpy.ops.object.transform_apply(scale=True, rotation=True)
        self.report({"INFO"}, f"Grid Stamp: {props.grid_x}×{props.grid_y}")
        return {"FINISHED"}

    def draw(self, context):
        _draw_props(self.layout, context)

# ── Panel ─────────────────────────────────────────────────────────────────────
class HOLOFLOW_PT_GridStamp(Panel):
    bl_label       = "Grid Stamp"
    bl_idname      = "HOLOFLOW_PT_grid_stamp"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = PANEL_CATEGORY
    bl_order       = 10

    def draw(self, context):
        _draw_props(self.layout, context)
        self.layout.separator()
        self.layout.operator("holoflow.grid_stamp", icon="MOD_ARRAY")

# ── Shared draw helper ─────────────────────────────────────────────────────────
def _draw_props(layout, context):
    props = context.scene.holoflow_grid_stamp
    layout.use_property_split    = True
    layout.use_property_decorate = False
    col = layout.column()
    col.prop(props, "grid_x")
    col.prop(props, "grid_y")
    col.prop(props, "spacing")
    col.prop(props, "scale")
    col.prop(props, "plane")
    col.prop(props, "apply_transforms")

# ── Registration ───────────────────────────────────────────────────────────────
_CLASSES = [HOLOFLOW_PG_GridStamp, HOLOFLOW_OT_GridStamp, HOLOFLOW_PT_GridStamp]

def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.holoflow_grid_stamp = PointerProperty(type=HOLOFLOW_PG_GridStamp)

def unregister():
    del bpy.types.Scene.holoflow_grid_stamp
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)

# ── Convenience helper for scripted calls ─────────────────────────────────────
def run_grid_stamp(
    grid_x: int = 3,
    grid_y: int = 3,
    spacing: float = 1.5,
    scale: float = 1.0,
    plane: str = "XY",
    apply_transforms: bool = False,
):
    """Configure and run Grid Stamp in one call."""
    props = bpy.context.scene.holoflow_grid_stamp
    props.grid_x            = grid_x
    props.grid_y            = grid_y
    props.spacing           = spacing
    props.scale             = scale
    props.plane             = plane
    props.apply_transforms  = apply_transforms
    bpy.ops.holoflow.grid_stamp()

if __name__ == "__main__":
    register()
    print("Grid Stamp addon registered.  Run run_grid_stamp() to test.")
