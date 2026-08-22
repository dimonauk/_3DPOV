# ============================================================
# RECORD — Skin + Voxel Remesh Character Blocking
# Blender 5.1  |  Holoflow Studio  |  CC0-1.0
# ============================================================
# Renders a 10-second EEVEE turntable viewport animation to:
#   public/library/videos/modifiers/
#     modifier-skin-remesh-character-blocking/viewport.mp4
#
# Run blueprint.py first, then run this script.
# The object named "character_block" must be in the scene.

import bpy
import math

SLUG        = "modifier-skin-remesh-character-blocking"
TOPIC       = "modifiers"
OUTPUT_DIR  = f"//../../../../public/library/videos/{TOPIC}/{SLUG}/"
FPS         = 24
TOTAL_FRAMES = 240   # 10 s at 24 fps = one full 360° rotation

# ── FIND CHARACTER OBJECT ────────────────────────────────────
obj = bpy.data.objects.get("character_block")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'character_block' not found.")

# ── TURNTABLE ANIMATION ──────────────────────────────────────
# Rotate 360° over TOTAL_FRAMES, linear interpolation (no ease).
# We keyframe at frame 1 (0°) and frame TOTAL_FRAMES+1 (360°).
# Rendering frames 1–TOTAL_FRAMES therefore produces a seamless loop.
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert('rotation_euler', index=2, frame=1)

obj.rotation_euler.z = math.tau   # 2π = full revolution
obj.keyframe_insert('rotation_euler', index=2, frame=TOTAL_FRAMES + 1)

# Flatten to LINEAR interpolation so the spin speed is constant.
action = obj.animation_data.action
for fcurve in action.fcurves:
    if fcurve.data_path == 'rotation_euler' and fcurve.array_index == 2:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'

# Reset rotation back to 0 for frame-1 pose
obj.rotation_euler.z = 0

# ── RENDER SETTINGS ──────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine          = 'BLENDER_EEVEE_NEXT'
sc.eevee.taa_render_samples = 16
sc.render.resolution_x    = 1280
sc.render.resolution_y    = 720
sc.render.resolution_percentage = 100
sc.render.fps             = FPS
sc.frame_start            = 1
sc.frame_end              = TOTAL_FRAMES

sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.ffmpeg_preset       = 'GOOD'
sc.render.ffmpeg.audio_codec         = 'NONE'

sc.render.filepath = OUTPUT_DIR + "viewport"

# ── RENDER ───────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓ Turntable rendered → {sc.render.filepath}")
