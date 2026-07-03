"""
Blender 5.1 | bpy.types.GizmoGroup
Holoflow Facet Tag Visualiser — Persistent Viewport Gizmo Overlay

GizmoGroup registers persistent 3D handles in the viewport, polled per-frame,
with hover highlighting and undo participation — unlike draw_handler_add which
is unconditional and has no pick semantics.

WHY GizmoGroup over draw_handler_add?  draw_handler runs every frame with no
hover, no undo, no operator binding.  GizmoGroup gizmos highlight on hover,
fire operators on click, and are undone by Ctrl+Z — what spatial tags need.

TECHNIQUE:
  • GIZMO_GT_primitive_3d (CIRCLE) above each holoflow:facet tagged object
  • GIZMO_GT_arrow_3d aligned to local +Y (WebXR export up-axis)
  • target_set_operator() fires toggle operator on click with full undo

PARAMETERS:
"""

import bpy
import mathutils

CIRCLE_OFFSET_Z = 0.30    # metres above bounding-box top
CIRCLE_SCALE    = 0.18    # screen-space radius (basis units)
ARROW_SCALE     = 0.45
COLOR_TAGGED    = (0.05, 0.95, 0.40)
COLOR_HIGHLIGHT = (1.00, 0.85, 0.10)
COLOR_UNTAGGED  = (0.30, 0.30, 0.30)
ALPHA_TAGGED    = 0.80
ALPHA_UNTAGGED  = 0.25

bl_info = {
    "name": "Holoflow Facet Tag Visualiser",
    "author": "Holoflow Studio",
    "version": (1, 0, 0),
    "blender": (5, 1, 0),
    "category": "3D View",
}


# ---------------------------------------------------------------------------
# TOGGLE OPERATOR — fired when artist clicks a gizmo circle
# ---------------------------------------------------------------------------

class HOLOFLOW_OT_toggle_facet_tag(bpy.types.Operator):
    """Toggle holoflow:facet on the named object"""
    bl_idname  = "holoflow.toggle_facet_tag"
    bl_label   = "Toggle Facet Tag"
    bl_options = {'REGISTER', 'UNDO'}   # UNDO puts click on the undo stack

    object_name: bpy.props.StringProperty()

    def execute(self, context):
        obj = bpy.data.objects.get(self.object_name)
        if obj is None:
            return {'CANCELLED'}
        obj["holoflow:facet"] = 0 if int(obj.get("holoflow:facet", 0)) else 1
        context.region.tag_redraw()
        return {'FINISHED'}


# ---------------------------------------------------------------------------
# GIZMO GROUP
# ---------------------------------------------------------------------------

def _top_z(obj: bpy.types.Object) -> float:
    """World-space Z of the highest bounding-box corner."""
    return max((obj.matrix_world @ mathutils.Vector(c)).z for c in obj.bound_box)


class HOLOFLOW_GGT_facet_overlay(bpy.types.GizmoGroup):
    """Persistent overlay: circles + arrows above holoflow:facet objects."""
    bl_idname      = "HOLOFLOW_GGT_facet_overlay"
    bl_label       = "Holoflow Facet Tag Overlay"
    bl_space_type  = 'VIEW_3D'
    bl_region_type = 'WINDOW'
    # '3D'        — world-space matrix_basis; without it, matrices are ignored
    # 'PERSISTENT' — stays visible even when another tool is active
    bl_options = {'3D', 'PERSISTENT'}

    @classmethod
    def poll(cls, context):
        # Respects the artist's global Overlays toggle automatically
        return (context.space_data.overlay.show_overlays
                and any(o.type == 'MESH' for o in context.scene.objects))

    # setup() is called ONCE at group creation — allocate all gizmos here.
    # gizmo count cannot grow after setup; hide extras with gz.hide = True.
    def setup(self, context):
        self._circles: list[bpy.types.Gizmo] = []
        self._arrows:  list[bpy.types.Gizmo] = []
        self._names:   list[str]              = []

        for obj in context.scene.objects:
            if obj.type != 'MESH':
                continue

            # Circle — display dot + clickable
            gz_c = self.gizmos.new("GIZMO_GT_primitive_3d")
            gz_c.draw_style     = 'CIRCLE'
            gz_c.scale_basis    = CIRCLE_SCALE
            gz_c.use_draw_hover = True   # yellow highlight on hover
            gz_c.use_draw_scale = True
            gz_c.line_width     = 2.0
            # target_set_operator returns a props object; assign before first draw
            op = gz_c.target_set_operator("holoflow.toggle_facet_tag")
            op.object_name = obj.name

            # Arrow — local +Y export axis indicator, display-only
            gz_a = self.gizmos.new("GIZMO_GT_arrow_3d")
            gz_a.scale_basis    = ARROW_SCALE
            gz_a.use_draw_hover = False
            gz_a.line_width     = 1.5

            self._circles.append(gz_c)
            self._arrows.append(gz_a)
            self._names.append(obj.name)

        self.refresh(context)

    # refresh() is called on context changes — update positions and colours.
    # Never call bpy.ops.* here; read properties and set fields only.
    def refresh(self, context):
        objs = {o.name: o for o in context.scene.objects}

        for gz_c, gz_a, name in zip(self._circles, self._arrows, self._names):
            obj = objs.get(name)
            if obj is None:
                gz_c.hide = gz_a.hide = True
                continue

            tagged = bool(obj.get("holoflow:facet", 0))

            gz_c.color           = COLOR_TAGGED if tagged else COLOR_UNTAGGED
            gz_c.color_highlight = COLOR_HIGHLIGHT if tagged else COLOR_UNTAGGED
            gz_c.alpha           = ALPHA_TAGGED if tagged else ALPHA_UNTAGGED
            gz_c.hide            = False
            gz_a.color           = COLOR_TAGGED if tagged else COLOR_UNTAGGED
            gz_a.alpha           = ALPHA_TAGGED if tagged else ALPHA_UNTAGGED
            gz_a.hide            = not tagged

            # Circle: flat disk just above bounding-box top
            origin = obj.matrix_world.to_translation()
            gz_c.matrix_basis = mathutils.Matrix.Translation(
                mathutils.Vector((origin.x, origin.y, _top_z(obj) + CIRCLE_OFFSET_Z))
            )

            # Arrow: object origin, rotated to local +Y.
            # .normalized() strips non-uniform scale preserving rotation —
            # essential; raw matrix_world bakes scale into the arrow shape.
            if tagged:
                mat = obj.matrix_world.normalized()
                mat.col[3][:3] = (origin.x, origin.y, origin.z + 0.05)
                gz_a.matrix_basis = mat

    def draw_prepare(self, context):
        # Called every frame before draw — keep cost near zero.
        # For pulsing/flicker: read context.scene.frame_current and set gz.alpha.
        pass


# ---------------------------------------------------------------------------
# SCENE SETUP
# ---------------------------------------------------------------------------

def build_demo_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    for pos, name, tag in [
        ((0, 0, 0),    "Prop_Tagged_A",  1),
        ((3, 0, 0),    "Prop_Tagged_B",  1),
        ((-3, 0, 0),   "Prop_Untagged",  0),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=pos)
        obj = bpy.context.active_object
        obj.name = name
        if tag:
            obj["holoflow:facet"] = 1

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = mathutils.Vector((0, -8, 4))
    cam_obj.rotation_euler = (1.1, 0, 0)
    bpy.context.scene.camera = cam_obj


# ---------------------------------------------------------------------------
# REGISTER / UNREGISTER
# ---------------------------------------------------------------------------

CLASSES = [
    HOLOFLOW_OT_toggle_facet_tag,
    HOLOFLOW_GGT_facet_overlay,
]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    # Unregister GizmoGroup first to avoid dangling gizmo references
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except RuntimeError:
            pass


if __name__ == "__main__":
    try:
        unregister()
    except Exception:
        pass
    register()
    build_demo_scene()
    print("Blueprint loaded. Green circles and arrows appear above tagged cubes.")
