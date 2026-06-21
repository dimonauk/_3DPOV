"""
record.py — Boolean Hard-Surface Trim Sheet viewport animation (Blender 5.1)
=============================================================================
Renders a 90-frame turntable of the finished panel to:
  public/library/videos/modifiers/modifier-boolean-exact-hard-surface-trim/viewport.mp4

Run after blueprint.py: the scene must have 'hard_surface_panel', camera, and lights.
Orbit the panel 360° over 90 frames at 30 fps = 3-second loop.
"""

import bpy
import math
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
OUTPUT_DIR = os.path.join(
    REPO_ROOT,
    "public/library/videos/modifiers/modifier-boolean-exact-hard-surface-trim",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOTAL_FRAMES = 90
FPS = 30
ORBIT_RADIUS = 7.0
ORBIT_HEIGHT = 3.0

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = TOTAL_FRAMES
scene.render.fps = FPS

# ── Render settings: EEVEE Next, moderate quality for viewport preview ─────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── Camera orbit: animate location + track-to target ──────────────────────────
cam = scene.camera
if cam is None:
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    scene.camera = cam

# Empty at origin to track
if "orbit_target" not in bpy.data.objects:
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0.08))
    target = bpy.context.active_object
    target.name = "orbit_target"
else:
    target = bpy.data.objects["orbit_target"]

# Track-To constraint so camera always faces panel centre
if not any(c.type == "TRACK_TO" for c in cam.constraints):
    tc = cam.constraints.new("TRACK_TO")
    tc.target = target
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis = "UP_Y"

# Keyframe camera orbit
cam.animation_data_clear()
for frame in range(1, TOTAL_FRAMES + 1):
    t = (frame - 1) / TOTAL_FRAMES  # 0 → 1
    angle = t * math.tau            # full revolution
    x = math.sin(angle) * ORBIT_RADIUS
    y = -math.cos(angle) * ORBIT_RADIUS
    z = ORBIT_HEIGHT
    cam.location = (x, y, z)
    cam.keyframe_insert(data_path="location", frame=frame)

# Set interpolation to LINEAR for constant orbit speed
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Render ──────────────────────────────────────────────────────────────────
print(f"[record] Rendering {TOTAL_FRAMES} frames → {scene.render.filepath}")
bpy.ops.render.render(animation=True)
print("[record] Done.")
