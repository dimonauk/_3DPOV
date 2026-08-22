"""
Blueprint: Python Modal Operator — Interactive 3-D Vertex-Colour Painter
=========================================================================
Blender 5.1 | CC0

The modal operator pattern is the only way to hold continuous control of the
3-D viewport between user events.  A regular operator executes and returns
immediately; a modal operator stays alive — field-testing each input event
through its own modal() method — until it decides to FINISH or CANCEL.

This blueprint implements a paint-by-click tool that:
  1. Casts a ray from the 2-D mouse position through the viewport into the
     scene, using bpy_extras.view3d_utils (screen-space → world-space unproject)
     followed by bpy.context.scene.ray_cast() (BVH intersection test).
  2. Writes BYTE_COLOR values directly to mesh.color_attributes on the
     CORNER domain — the correct 5.1 API; vertex_colors is deprecated.
  3. Draws a live brush-radius circle using gpu.shader + batch_for_shader via
     a SpaceView3D draw handler registered in POST_PIXEL space.
  4. Removes the draw handler on FINISH / CANCEL, preventing handler leakage.

Key design choices
------------------
CORNER domain, not POINT domain.
  Each polygon loop gets an independent colour entry, so adjacent faces can
  differ at a shared vertex.  This is required for the studio's faceted shading.

BYTE_COLOR, not FLOAT_COLOR.
  8-bit per-channel is standard for albedo painting.  FLOAT_COLOR is for HDR
  data (emission maps, light bakes).  BYTE_COLOR matches what Blender's own
  vertex-paint mode writes.

{'GRAB_CURSOR', 'BLOCKING'} on the operator.
  GRAB_CURSOR locks the OS cursor inside the viewport during a stroke.
  BLOCKING prevents any other operator from capturing mouse events.
  Both are essential for a paint tool; without them scroll-zoom or orbit can
  fire mid-stroke.

scene.ray_cast() vs. object.ray_cast()
  scene.ray_cast() hits the BVH tree of all visible objects and returns the
  hit object as well as the face index.  We filter by active object so stray
  geometry in the scene cannot accidentally receive paint.

Usage
-----
  1. Run this script in Blender's Scripting workspace (Run Script).
  2. Open the N-panel (press N in the 3-D Viewport), Holoflow tab.
  3. Click "HF Vertex Colour Paint".
  4. LMB drag — paint strokes.  Enter / Space — confirm.  Esc / RMB — cancel.
"""

import bpy
from bpy_extras import view3d_utils
import gpu
import blf
from gpu_extras.batch import batch_for_shader
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
SPHERE_NAME     = "paint_canvas"
COL_ATTR_NAME   = "Col"
BRUSH_COLOUR    = (1.0, 0.25, 0.05, 1.0)  # vivid vermillion, linear sRGB
BASE_COLOUR     = (0.35, 0.35, 0.35, 1.0) # neutral grey baseline
BRUSH_RADIUS_PX = 48                        # screen-space indicator radius
SPHERE_SEGMENTS = 32                        # UV sphere horizontal divisions
SPHERE_RINGS    = 16                        # UV sphere vertical divisions
SPHERE_RADIUS   = 1.4                       # metres


# ── Scene setup ────────────────────────────────────────────────────────────────

def build_scene():
    """Clear the scene and create a paint-ready UV sphere."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SEGMENTS,
        ring_count=SPHERE_RINGS,
        radius=SPHERE_RADIUS,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = obj.data.name = SPHERE_NAME

    bpy.ops.object.shade_smooth()

    # Colour attribute — BYTE_COLOR / CORNER domain
    col_attr = obj.data.color_attributes.new(
        name=COL_ATTR_NAME,
        type="BYTE_COLOR",
        domain="CORNER",
    )
    for d in col_attr.data:
        d.color = BASE_COLOUR
    obj.data.color_attributes.active_color = col_attr

    # Camera
    bpy.ops.object.camera_add(location=(0, -4.5, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.26, 0.0, 0.0)
    bpy.context.scene.camera = cam

    # Key light
    bpy.ops.object.light_add(type="SUN", location=(3, -2, 5))
    bpy.context.active_object.data.energy = 3.0

    # Viewport: show vertex colour
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            area.spaces.active.shading.type = "SOLID"
            area.spaces.active.shading.color_type = "VERTEX"
            break

    bpy.ops.object.select_all(action="DESELECT")
    canvas = bpy.data.objects[SPHERE_NAME]
    bpy.context.view_layer.objects.active = canvas
    canvas.select_set(True)
    return canvas


# ── HUD draw callback ──────────────────────────────────────────────────────────

def _draw_brush_hud(op, context):
    """Render the brush-radius circle and status text each redraw."""
    mx, my = op._mouse_x, op._mouse_y

    # Brush circle: LINE_STRIP of 33 points (closed loop)
    n = 32
    pts = [
        (mx + BRUSH_RADIUS_PX * math.cos(i * 2 * math.pi / n),
         my + BRUSH_RADIUS_PX * math.sin(i * 2 * math.pi / n))
        for i in range(n + 1)
    ]
    shader = gpu.shader.from_builtin("UNIFORM_COLOR")
    batch  = batch_for_shader(shader, "LINE_STRIP", {"pos": pts})
    gpu.state.blend_set("ALPHA")
    gpu.state.line_width_set(1.5)
    shader.bind()
    shader.uniform_float("color", (1.0, 1.0, 1.0, 0.85))
    batch.draw(shader)
    gpu.state.blend_set("NONE")

    # Status hint at bottom-left
    blf.size(0, 15)
    blf.color(0, 1.0, 1.0, 1.0, 0.9)
    blf.position(0, 12, 28, 0)
    blf.draw(0, "HF Vertex Paint  ·  LMB drag: paint  ·  Enter: confirm  ·  Esc: cancel")


# ── Modal Operator ─────────────────────────────────────────────────────────────

class HOLOFLOW_OT_vertex_colour_paint(bpy.types.Operator):
    """Paint vertex colours onto the active mesh by clicking / dragging."""
    bl_idname  = "holoflow.vertex_colour_paint"
    bl_label   = "HF Vertex Colour Paint"
    bl_options = {"REGISTER", "UNDO", "GRAB_CURSOR", "BLOCKING"}

    _handle   = None
    _painting = False
    _mouse_x  = 0
    _mouse_y  = 0

    @classmethod
    def poll(cls, context):
        return (context.area and context.area.type == "VIEW_3D" and
                context.active_object is not None and
                context.active_object.type == "MESH")

    def invoke(self, context, event):
        if context.area.type != "VIEW_3D":
            self.report({"WARNING"}, "Must be invoked from a 3-D Viewport")
            return {"CANCELLED"}

        self._mouse_x  = event.mouse_region_x
        self._mouse_y  = event.mouse_region_y
        self._painting = False

        # Register the per-redraw HUD callback
        self._handle = bpy.types.SpaceView3D.draw_handler_add(
            _draw_brush_hud, (self, context), "WINDOW", "POST_PIXEL"
        )
        context.window_manager.modal_handler_add(self)
        context.area.tag_redraw()
        return {"RUNNING_MODAL"}

    def modal(self, context, event):
        context.area.tag_redraw()
        self._mouse_x = event.mouse_region_x
        self._mouse_y = event.mouse_region_y

        if event.type in {"RET", "NUMPAD_ENTER", "SPACE"} and event.value == "PRESS":
            self._finish(context)
            return {"FINISHED"}

        if event.type in {"RIGHTMOUSE", "ESC"} and event.value == "PRESS":
            self._finish(context)
            return {"CANCELLED"}

        if event.type == "LEFTMOUSE":
            if event.value == "PRESS":
                self._painting = True
                self._paint(context, event.mouse_region_x, event.mouse_region_y)
            elif event.value == "RELEASE":
                self._painting = False

        if self._painting and event.type == "MOUSEMOVE":
            self._paint(context, event.mouse_region_x, event.mouse_region_y)

        # Let viewport navigation pass through when the brush is not down
        if event.type in {"MIDDLEMOUSE", "WHEELUPMOUSE", "WHEELDOWNMOUSE"}:
            return {"PASS_THROUGH"}

        return {"RUNNING_MODAL"}

    def _paint(self, context, mx, my):
        region = context.region
        rv3d   = context.region_data
        obj    = context.active_object

        origin    = view3d_utils.region_2d_to_origin_3d(region, rv3d, (mx, my))
        direction = view3d_utils.region_2d_to_vector_3d(region, rv3d, (mx, my))

        hit, _loc, _norm, face_idx, hit_obj, _mat = context.scene.ray_cast(
            context.view_layer, origin, direction
        )

        if not hit or hit_obj is not obj:
            return

        mesh     = obj.data
        col_attr = mesh.color_attributes.get(COL_ATTR_NAME)
        if col_attr is None:
            col_attr = mesh.color_attributes.new(
                name=COL_ATTR_NAME, type="BYTE_COLOR", domain="CORNER"
            )

        # Write colour to every loop of the hit polygon
        poly = mesh.polygons[face_idx]
        for li in range(poly.loop_start, poly.loop_start + poly.loop_total):
            col_attr.data[li].color = BRUSH_COLOUR

        mesh.update()

    def _finish(self, context):
        if self._handle:
            bpy.types.SpaceView3D.draw_handler_remove(self._handle, "WINDOW")
            self._handle = None
        if context.area:
            context.area.tag_redraw()


# ── Panel ──────────────────────────────────────────────────────────────────────

class HOLOFLOW_PT_vertex_paint(bpy.types.Panel):
    bl_label       = "Vertex Colour Painter"
    bl_idname      = "HOLOFLOW_PT_vertex_paint"
    bl_space_type  = "VIEW_3D"
    bl_region_type = "UI"
    bl_category    = "Holoflow"

    def draw(self, context):
        self.layout.operator("holoflow.vertex_colour_paint", icon="BRUSH_DATA")


# ── Register ───────────────────────────────────────────────────────────────────

CLASSES = [HOLOFLOW_OT_vertex_colour_paint, HOLOFLOW_PT_vertex_paint]


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    for cls in reversed(CLASSES):
        try:
            bpy.utils.unregister_class(cls)
        except Exception:
            pass
    build_scene()
    register()
    print("[blueprint] paint_canvas sphere ready.")
    print("[blueprint] N-panel → Holoflow → 'HF Vertex Colour Paint' to start.")
