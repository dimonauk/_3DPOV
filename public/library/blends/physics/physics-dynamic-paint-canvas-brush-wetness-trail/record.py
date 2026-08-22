# ============================================================
#  Holoflow Studio — record.py
#  Slug  : physics-dynamic-paint-canvas-brush-wetness-trail
#  Output: public/library/videos/physics/
#          physics-dynamic-paint-canvas-brush-wetness-trail/viewport.mp4
#
#  Run this AFTER blueprint.py has baked the Dynamic Paint simulation.
#  It renders a 90-frame overhead dolly that reveals the paint trail
#  building up frame-by-frame.
# ============================================================

import bpy
import math
import os

FRAME_START   = 1
FRAME_END     = 90
FPS           = 30
OUTPUT_DIR    = "//../../videos/physics/physics-dynamic-paint-canvas-brush-wetness-trail/"
OUTPUT_FILE   = OUTPUT_DIR + "viewport"

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS

# ── Output settings ────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = OUTPUT_FILE
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# ── Camera dolly: slow arc from high-overhead → eye-level ──
cam = scene.camera
if cam is None:
    bpy.ops.object.camera_add(location=(0, -2.8, 2.4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(52), 0, 0)
    scene.camera = cam

# Start: near-overhead (Z=3.5)  End: lower diagonal (Z=1.8)
cam.animation_data_clear()

scene.frame_set(FRAME_START)
cam.location = (0.0, -2.5, 3.5)
cam.rotation_euler = (math.radians(68), 0, 0)
cam.keyframe_insert("location")
cam.keyframe_insert("rotation_euler")

scene.frame_set(FRAME_END)
cam.location = (1.2, -2.1, 1.8)
cam.rotation_euler = (math.radians(50), 0, math.radians(-18))
cam.keyframe_insert("location")
cam.keyframe_insert("rotation_euler")

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Render engine: EEVEE Next (fast, vertex colour support) ─
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# ── Render ─────────────────────────────────────────────────
os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record] Rendered {FRAME_END - FRAME_START + 1} frames → {OUTPUT_FILE}")
