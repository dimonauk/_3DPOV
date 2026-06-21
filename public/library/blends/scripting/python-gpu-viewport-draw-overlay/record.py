"""
record.py — viewport animation capture
Python — gpu Module: Custom Viewport Overlay
Blender 5.1 | Run from Scripting workspace

Outputs: public/library/videos/scripting/python-gpu-viewport-draw-overlay/viewport.mp4

WHAT THIS DOES
--------------
1. Resets to an empty scene.
2. Adds a Suzanne head + Subdivision Surface modifier.
3. Animates a Y-axis rotation so the face normals sweep in all directions.
4. Registers the gpu-overlay draw handler (normal arrows).
5. Renders 60 frames via bpy.ops.render.opengl(animation=True) — this
   captures the 3D Viewport exactly as you see it, INCLUDING custom
   POST_VIEW draw handlers.

WHY render.opengl?
-----------------
render.opengl() asks the GPU to re-execute the viewport draw pipeline and
write each frame to disk.  It is the only Blender-native way to record
what appears in the 3D View, including GPU draw-handler overlays.  The
regular render.render() path goes through Cycles/EEVEE and has no access
to SpaceView3D draw callbacks.

RUN INSTRUCTIONS
----------------
1. Open Blender 5.1.
2. Switch the top-left editor to 'Scripting'.
3. Click 'Open' and load this file (or paste it into a new text block).
4. Click 'Run Script'.
5. The OpenGL render will start automatically; progress shows in the header.
6. Output lands in the path set by OUT_DIR (relative to the .blend file,
   or absolute if you set an absolute path).
"""

import bpy
import math

# ============================================================
# PARAMETERS
# ============================================================
FRAME_START = 1
FRAME_END   = 60          # 2 s at 30 fps

# Relative to the directory where this .blend will be saved.
# Change to an absolute path (e.g. "/tmp/holoflow/") if running headless.
OUT_DIR = "//../../../../public/library/videos/scripting/python-gpu-viewport-draw-overlay/"

NORMAL_LENGTH = 0.15
LINE_WIDTH    = 2.5
COL_DOWN = (0.10, 0.35, 1.00, 1.0)
COL_UP   = (1.00, 0.20, 0.10, 1.0)

# ============================================================
# INLINE DRAW CALLBACK (self-contained — no import from blueprint.py)
# ============================================================
import gpu
import mathutils
from gpu_extras.batch import batch_for_shader

_handle  = None
_ishader = None


def _build_batch_inline(obj):
    global _ishader
    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    mesh     = eval_obj.to_mesh()

    mat   = obj.matrix_world
    inv_t = mat.inverted().transposed().to_3x3()

    verts  = []
    colors = []

    for poly in mesh.polygons:
        w_centre = mat @ poly.center
        w_normal = (inv_t @ mathutils.Vector(poly.normal)).normalized()
        tip = w_centre + w_normal * NORMAL_LENGTH

        t = (w_normal.z + 1.0) * 0.5
        col = (
            COL_DOWN[0] + (COL_UP[0] - COL_DOWN[0]) * t,
            COL_DOWN[1] + (COL_UP[1] - COL_DOWN[1]) * t,
            COL_DOWN[2] + (COL_UP[2] - COL_DOWN[2]) * t,
            1.0,
        )
        verts  += [tuple(w_centre), tuple(tip)]
        colors += [col, col]

    eval_obj.to_mesh_clear()

    if _ishader is None:
        _ishader = gpu.shader.from_builtin("SMOOTH_COLOR")

    return batch_for_shader(_ishader, "LINES", {"pos": verts, "color": colors})


def _draw_cb():
    ctx = bpy.context
    obj = ctx.active_object
    if obj is None or obj.type != "MESH":
        return
    batch = _build_batch_inline(obj)
    gpu.state.depth_test_set("LESS_EQUAL")
    gpu.state.depth_mask_set(False)
    gpu.state.line_width_set(LINE_WIDTH)
    _ishader.bind()
    batch.draw(_ishader)
    gpu.state.line_width_set(1.0)
    gpu.state.depth_mask_set(True)
    gpu.state.depth_test_set("LESS_EQUAL")


def _register():
    global _handle
    if _handle is not None:
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")
    _handle = bpy.types.SpaceView3D.draw_handler_add(
        _draw_cb, (), "WINDOW", "POST_VIEW"
    )


def _unregister():
    global _handle, _ishader
    if _handle:
        bpy.types.SpaceView3D.draw_handler_remove(_handle, "WINDOW")
        _handle  = None
        _ishader = None


# ============================================================
# SCENE SETUP
# ============================================================
def setup_scene():
    bpy.ops.wm.read_homefile(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = 30

    # Suzanne — dense, interesting normals, a Blender classic
    bpy.ops.mesh.primitive_monkey_add(size=1.5)
    monkey = bpy.context.active_object
    monkey.name = "NormalDemo"

    bpy.ops.object.modifier_add(type="SUBSURF")
    monkey.modifiers["Subdivision"].levels        = 1
    monkey.modifiers["Subdivision"].render_levels = 1

    # Full Y-rotation over the sequence so all faces sweep past the camera
    monkey.rotation_euler = (0.0, 0.0, 0.0)
    monkey.keyframe_insert("rotation_euler", frame=FRAME_START)
    monkey.rotation_euler = (0.0, math.radians(360), 0.0)
    monkey.keyframe_insert("rotation_euler", frame=FRAME_END)

    for fc in monkey.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    # Camera: side view looking slightly down
    bpy.ops.object.camera_add(location=(0.0, -4.0, 0.6))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(82), 0.0, 0.0)
    scene.camera = cam

    # Neutral sun light
    bpy.ops.object.light_add(type="SUN", location=(2.0, -2.0, 4.0))

    # Render output — FFMPEG H.264 MP4
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath = OUT_DIR
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"


# ============================================================
# MAIN
# ============================================================
setup_scene()
_register()

# Re-select Suzanne after scene reset
bpy.data.objects["NormalDemo"].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["NormalDemo"]

# Run OpenGL viewport render inside a VIEW_3D context
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        with bpy.context.temp_override(area=area):
            bpy.ops.render.opengl(animation=True)
        break

_unregister()
print("Done → " + OUT_DIR)
