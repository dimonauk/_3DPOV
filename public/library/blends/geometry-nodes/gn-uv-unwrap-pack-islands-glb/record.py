"""
record.py — viewport animation for GN UV Unwrap + Pack Islands
Outputs: public/library/videos/geometry-nodes/gn-uv-unwrap-pack-islands-glb/viewport.mp4

Run AFTER blueprint.py has created crystal_geode.blend and saved it.

The animation shows the crystal geode rotating 360° while the UV-driven
gradient washes across its faces — demonstrating that the procedural UV
survives the object's changing orientation without baking or re-unwrapping.
Duration: 120 frames at 24 fps = 5 seconds.
"""

import bpy
import math
import os

# ── OUTPUT PATH ──────────────────────────────────────────────────────────────
OUTPUT_DIR  = "public/library/videos/geometry-nodes/gn-uv-unwrap-pack-islands-glb"
OUTPUT_FILE = "viewport"
TOTAL_FRAMES = 120
FPS          = 24

# ── FIND BLEND ────────────────────────────────────────────────────────────────
blend_path = bpy.path.abspath("//crystal_geode.blend")
if not bpy.data.filepath:
    raise RuntimeError("Open crystal_geode.blend first before running record.py")

scene = bpy.context.scene
obj   = bpy.data.objects.get("crystal_geode")
if obj is None:
    raise RuntimeError("crystal_geode object not found. Run blueprint.py first.")

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.fps                  = FPS
scene.frame_start                 = 1
scene.frame_end                   = TOTAL_FRAMES
scene.eevee.use_bloom             = True
scene.eevee.bloom_intensity       = 0.08
scene.eevee.bloom_radius          = 4.0

# ── OUTPUT ────────────────────────────────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILE)

# ── CLEAR EXISTING ANIMATION ─────────────────────────────────────────────────
obj.animation_data_clear()

# ── ROTATION ANIMATION ────────────────────────────────────────────────────────
# One full Z-axis rotation over TOTAL_FRAMES, showing all crystal faces.
# We also add a gentle X tilt that reverses halfway — reveals top and bottom.
obj.rotation_euler = (0.0, 0.0, 0.0)

for f in range(1, TOTAL_FRAMES + 1):
    t = (f - 1) / (TOTAL_FRAMES - 1)   # 0 → 1

    # Z rotates 360°
    obj.rotation_euler[2] = 2 * math.pi * t

    # X tilts 0 → +25° → 0°  (mid-arc reveal)
    obj.rotation_euler[0] = math.radians(25) * math.sin(math.pi * t)

    obj.keyframe_insert(data_path="rotation_euler", frame=f)

# Smooth all keyframe curves
for fcurve in obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.easing = 'AUTO'

# ── CAMERA ANIMATION ─────────────────────────────────────────────────────────
cam_obj = scene.camera
if cam_obj:
    cam_obj.animation_data_clear()
    # Slight arc from left to right to add parallax depth.
    start_loc = (3.2, -3.2, 2.4)
    end_loc   = (3.0, -3.4, 2.0)

    cam_obj.location = start_loc
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.location = end_loc
    cam_obj.keyframe_insert(data_path="location", frame=TOTAL_FRAMES)

    for fcurve in cam_obj.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Rendered {TOTAL_FRAMES} frames → {OUTPUT_DIR}/{OUTPUT_FILE}.mp4")
