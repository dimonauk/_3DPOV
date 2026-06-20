"""
record.py — Viewport animation recording for python-app-handler-frame-change-depsgraph
Holoflow Studio Library · Blender 5.1 · CC0

Run from Blender's Scripting workspace AFTER blueprint.py has been executed.
Renders a 60-frame opengl animation to:
  public/library/videos/scripting/python-app-handler-frame-change-depsgraph/viewport.mp4

The handler fires on every frame_set() call during the render loop, so the
ripple displacement is baked into each frame's render output correctly.
"""

import bpy
import os
import math

# ── Output path ───────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
LIBRARY_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../../"))
OUTPUT_DIR   = os.path.join(
    LIBRARY_ROOT,
    "videos",
    "scripting",
    "python-app-handler-frame-change-depsgraph",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH  = os.path.join(OUTPUT_DIR, "viewport")   # Blender appends ####.png

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.fps             = 30
scene.frame_start            = 1
scene.frame_end              = 60

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.ffmpeg.audio_codec         = "NONE"
scene.render.filepath                   = os.path.join(OUTPUT_DIR, "viewport.mp4")

# EEVEE: fast pass — ambient occlusion off, shadows on.
scene.eevee.use_gtao          = False
scene.eevee.shadow_cube_size  = "512"

# ── Camera framing ────────────────────────────────────────────────────────────
# Camera was placed at (0, -4.5, 3.5) with 45° X rotation in blueprint.py.
# Confirm it exists; if not, add a quick override camera.
if scene.camera is None:
    bpy.ops.object.camera_add(location=(0, -4.5, 3.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(45), 0, 0)
    scene.camera = cam

# ── Fire handler for frame 1 to prime the mesh before render ─────────────────
from blueprint import _ripple_handler  # noqa: E402  (blueprint.py already loaded)
if _ripple_handler not in bpy.app.handlers.frame_change_post:
    bpy.app.handlers.frame_change_post.append(_ripple_handler)
_ripple_handler(scene, bpy.context.evaluated_depsgraph_get())

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow] viewport.mp4 written → {scene.render.filepath}")
