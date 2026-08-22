"""
record.py — viewport animation for bmesh.ops.inset_faces tutorial
══════════════════════════════════════════════════════════════════
Runs blueprint.py then animates a camera orbit around the finished
console panel, rendering 90 frames to:
  public/library/videos/scripting/python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr/viewport.mp4

Run from the Blender Python console or headless:
  blender --background --python record.py

The render simulates what Dimona will see when screen-recording:
the camera sweeps around the prop highlighting the three inset zones.
"""

import math
import os
import sys
import bpy
from mathutils import Vector

# ── EXEC BLUEPRINT ────────────────────────────────────────────────────────────
# Resolve path relative to this file so it works from any cwd.
_here = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_here, "blueprint.py")).read())

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
TOTAL_FRAMES = 90    # 3 seconds at 30 fps
FRAME_START  = 1
FRAME_END    = TOTAL_FRAMES
ORBIT_RADIUS = 3.2
ORBIT_HEIGHT = 1.6
ORBIT_DEG    = 180.0  # pan 180° (side view → front → other side)

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps   = 30

# ── OUTPUT ────────────────────────────────────────────────────────────────────
out_dir = os.path.join(
    _here,
    "..", "..", "..", "..",  # public/library root
    "videos", "scripting",
    "python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr",
)
os.makedirs(out_dir, exist_ok=True)

scene.render.filepath        = os.path.join(out_dir, "viewport")
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.resolution_percentage = 100

# ── LIGHTING ─────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("sun", sun)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(55), 0, math.radians(25))

scene.render.engine = "BLENDER_EEVEE_NEXT"

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam)
scene.camera = cam

# Animate camera orbiting around origin, angled down to show top-face detail.
for frame in range(FRAME_START, FRAME_END + 1):
    t = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
    angle = math.radians(-90 + ORBIT_DEG * t)   # start at -90° (side), end at +90°
    x = ORBIT_RADIUS * math.cos(angle)
    y = ORBIT_RADIUS * math.sin(angle)
    z = ORBIT_HEIGHT
    cam.location = (x, y, z)

    # Point camera at the panel centre with a slight downward tilt.
    target = Vector((0.0, 0.0, 0.0))
    direction = (target - cam.location).normalized()
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    cam.keyframe_insert("location",        frame=frame)
    cam.keyframe_insert("rotation_euler",  frame=frame)

# Make all f-curves constant so there is no interpolation overshooting.
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport recording saved → {scene.render.filepath}0001-{FRAME_END:04d}.mp4")
