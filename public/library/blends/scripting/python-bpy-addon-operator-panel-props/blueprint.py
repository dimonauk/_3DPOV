"""
BLUEPRINT: python-bpy-addon-operator-panel-props
Topic: scripting  |  Blender 5.1  |  CC0
─────────────────────────────────────────────────────────────────────────────
A Blender 5.1 extension is three things working together: a PropertyGroup that
owns typed, undo-aware values; an Operator that reads those values and changes
scene state inside execute(); and a Panel that presents both in the N-panel.
Registering in the right class order and pairing PointerProperty on a built-in
type (Scene, Object, Mesh) is what glues them into a coherent tool.

This blueprint implements "Holoflow Grid Stamp" — a mini-addon that arrays the
active object into a configurable X × Y grid at a controlled spacing.  It uses
every common property type (Int, Float, Enum, Bool), a poll() guard, REGISTER +
UNDO bl_options for the redo-panel, and a draw() override so the redo-panel
mirrors the N-panel without duplicating code.
─────────────────────────────────────────────────────────────────────────────
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

# ── Named constants ───────────────────────────────────────────────────────────
ADDON_ID       = "holoflow_grid_stamp"
PANEL_CATEGORY = "Holoflow"        # N-panel tab label
PANEL_SPACE    = "VIEW_3D"
PANEL_REGION   = "UI"

GRID_X_DEFAULT  = 3
GRID_Y_DEFAULT  = 3
SPACING_DEFAULT = 1.5
SCALE_DEFAULT   = 1.0
PLANE_DEFAULT   = "XY"

# ── PropertyGroup ─────────────────────────────────────────────────────────────
# PropertyGroup stores the settings on the Scene so they survive undo/redo and
# are accessible from any operator, panel, or driver without passing arguments.
class HOLOFLOW_PG_GridStamp(PropertyGroup):
    grid_x: IntProperty(
        name="Columns",
        description="Copies along the primary axis",
        default=GRID_X_DEFAULT,
        min=1, max=32,
    )
    grid_y: IntProperty(
        name="Rows",
        description="Copies along the secondary axis",
        default=GRID_Y_DEFAULT,
        min=1, max=32,
    )
    spacing: FloatProperty(
        name="Spacing",
        description="Centre-to-centre distance (Blender units)",
        default=SPACING_DEFAULT,
        min=0.0, soft_max=20.0,
        step=10, precision=3,
        unit="LENGTH",
    )
    scale: FloatProperty(
        name="Scale",
        description="Uniform scale applied to each duplicate",
        default=SCALE_DEFAULT,
        min=0.001, max=100.0, soft_max=4.0,
        step=1, precision=3,
    )
    plane: EnumProperty(
        name="Plane",
        description="Grid orientation in world space",
        items=[
            ("XY", "XY — ground",    "Grid lies flat on the ground plane"),
            ("XZ", "XZ — front wall","Grid on a vertical front-facing wall"),
            ("YZ", "YZ — side wall", "Grid on a vertical side-facing wall"),
        ],
        default=PLANE_DEFAULT,
    )
    apply_transforms: BoolProperty(
        name="Apply Transforms",
        description="Apply scale and rotation on copies (required for correct GLB export)",
        default=False,
    )

# ── Operator ──────────────────────────────────────────────────────────────────
class HOLOFLOW_OT_GridStamp(Operator):
    """Array the active object into an X × Y grid at configurable spacing"""
    bl_idname  = "holoflow.grid_stamp"
    bl_label   = "Grid Stamp"
    # REGISTER  → puts parameters in the redo-panel (F9 / bottom-left corner)
    # UNDO      → hooks into Ctrl-Z; wraps execute() in a single undo step
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        # Guard: object mode, exactly one active+selected object
        ob = context.active_object
        return (
            context.mode == "OBJECT"
            and ob is not None
            and ob.select_get()
        )

    def _offset(self, col: int, row: int, spacing: float, plane: str):
        s = spacing
        if plane == "XY":
            return (col * s, row * s, 0.0)
        elif plane == "XZ":
            return (col * s, 0.0, row * s)
        return (0.0, col * s, row * s)  # YZ

    def execute(self, context):
        props = context.scene.holoflow_grid_stamp
        src   = context.active_object
        count = 0

        for row in range(props.grid_y):
            for col in range(props.grid_x):
                if col == 0 and row == 0:
                    continue  # source object is the (0, 0) slot — skip duplicate
                dx, dy, dz = self._offset(col, row, props.spacing, props.plane)
                # linked_duplicate: copies object data by reference (shared mesh)
                bpy.ops.object.duplicate(linked=True)
                dup = context.active_object
                dup.location = (
                    src.location.x + dx,
                    src.location.y + dy,
                    src.location.z + dz,
                )
                dup.scale = (props.scale, props.scale, props.scale)
                if props.apply_transforms:
                    bpy.ops.object.transform_apply(scale=True, rotation=True)
                count += 1

        self.report(
            {"INFO"},
            f"Grid Stamp: {props.grid_x}×{props.grid_y}, {count + 1} objects total",
        )
        return {"FINISHED"}

    def draw(self, context):
        """Mirror of the N-panel — called by the redo-panel without extra code."""
        _draw_props(self.layout, context)

# ── Panel ─────────────────────────────────────────────────────────────────────
class HOLOFLOW_PT_GridStamp(Panel):
    bl_label      = "Grid Stamp"
    bl_idname     = "HOLOFLOW_PT_grid_stamp"
    bl_space_type = PANEL_SPACE
    bl_region_type = PANEL_REGION
    bl_category   = PANEL_CATEGORY
    bl_order      = 10

    def draw(self, context):
        _draw_props(self.layout, context)
        self.layout.separator()
        self.layout.operator("holoflow.grid_stamp", text="Stamp Grid", icon="MOD_ARRAY")

# Shared draw helper — avoids identical code in Panel.draw and Operator.draw
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

# ── Registration ──────────────────────────────────────────────────────────────
# ORDER MATTERS: PropertyGroup before Panel/Operator, which reference it via
# context.scene.holoflow_grid_stamp.  Unregister in reverse to clean up safely.
CLASSES = [
    HOLOFLOW_PG_GridStamp,
    HOLOFLOW_OT_GridStamp,
    HOLOFLOW_PT_GridStamp,
]

def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    # PointerProperty attaches the PropertyGroup namespace to every Scene
    bpy.types.Scene.holoflow_grid_stamp = PointerProperty(type=HOLOFLOW_PG_GridStamp)

def unregister():
    del bpy.types.Scene.holoflow_grid_stamp
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)

# ── Demo scene (run in Blender's Text Editor to build the showcase) ───────────
def demo():
    """Build a 4×4 icosphere grid to showcase the addon in action."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.45, location=(0, 0, 0))
    src = bpy.context.active_object
    src.name = "grid_source"

    mat = bpy.data.materials.new("holoflow_cyan")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.08, 0.62, 0.85, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.0
    bsdf.inputs["Roughness"].default_value  = 0.35
    src.data.materials.append(mat)

    try:
        register()
    except ValueError:
        pass  # already registered in this session

    props = bpy.context.scene.holoflow_grid_stamp
    props.grid_x   = 4
    props.grid_y   = 4
    props.spacing  = 1.2
    props.scale    = 1.0
    props.plane    = "XY"
    props.apply_transforms = False

    bpy.ops.holoflow.grid_stamp()
    print("demo(): 4×4 grid stamped.")

if __name__ == "__main__":
    demo()
