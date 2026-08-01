"""
record.py — viewport animation render for the Duffing tutorial.

Outputs: public/library/videos/scripting/
             python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr/
             viewport.mp4

Run after blueprint.py has populated the scene.  Animates the camera
in a slow orbit around the four orbit slabs so the period-doubling
cascade reads clearly left-to-right in the final video.
"""
import bpy
import math

# ── Config ────────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 240          # 8 s at 30 fps
ORBIT_RADIUS = 16.0
ORBIT_HEIGHT = 5.4          # midpoint of four Z-slabs (CASES × Z_STEP / 2)
ORBIT_TILT   = 0.55         # radians — shows Z-stack clearly
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr/viewport"

bpy.context.scene.frame_start = FRAME_START
bpy.context.scene.frame_end   = FRAME_END
bpy.context.scene.render.fps  = 30

# ── Render settings (EEVEE Next) ──────────────────────────────────────────
bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
bpy.context.scene.eevee.use_bloom = True
bpy.context.scene.render.image_settings.file_format = "FFMPEG"
bpy.context.scene.render.ffmpeg.format = "MPEG4"
bpy.context.scene.render.ffmpeg.codec  = "H264"
bpy.context.scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080
bpy.context.scene.render.filepath = OUTPUT_PATH

# ── Camera orbit keyframes ────────────────────────────────────────────────
cam = bpy.context.scene.camera
if cam is None:
    raise RuntimeError("Run blueprint.py first to create the camera.")

cam.rotation_mode = "XYZ"

for frame in range(FRAME_START, FRAME_END + 1):
    t = (frame - FRAME_START) / (FRAME_END - FRAME_START)  # 0 → 1
    angle = math.tau * t * 0.75   # three-quarter orbit

    x = ORBIT_RADIUS * math.sin(angle)
    y = -ORBIT_RADIUS * math.cos(angle)
    z = ORBIT_HEIGHT + ORBIT_RADIUS * 0.25 * math.sin(ORBIT_TILT + angle * 0.5)

    cam.location = (x, y, z)
    cam.rotation_euler = (
        math.pi * 0.45,
        0.0,
        angle + math.pi,
    )
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)

# Smooth all F-curves
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── Render ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("Record complete →", OUTPUT_PATH)
