"""
record.py — Viewport animation for the Asset Library tutorial
Blender 5.1 | CC0 | Holoflow Studio

Renders a 90-frame (3 s @ 30 fps) turntable animation of the four material-preview
spheres.  Each sphere shows one studio-standard asset material.

Output: public/library/videos/scripting/python-asset-library-mark-catalogue/viewport.mp4
Run via: blender --background --python record.py
"""

import bpy
import math
import os
import sys

# ── Output path ──────────────────────────────────────────────────────────────────
REPO_ROOT  = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
OUTPUT_DIR = os.path.join(REPO_ROOT, "public", "library", "videos",
                          "scripting", "python-asset-library-mark-catalogue")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Run blueprint first to populate the scene
exec(open(os.path.join(os.path.dirname(__file__), "blueprint.py")).read())

scene = bpy.context.scene
scene.render.engine          = "CYCLES"
scene.cycles.samples         = 32           # low for fast preview render
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.fps             = 30
scene.frame_start            = 1
scene.frame_end              = 90           # 3 seconds

# ── Keyframe the camera for a slow orbital arc ───────────────────────────────────
cam = scene.camera
cam.animation_data_create()
cam.data.animation_data_create()

# Orbit the camera 60 degrees around the row of spheres
RADIUS   = 4.5
ELEVATION = 1.2
ANGLE_START = math.radians(-30)
ANGLE_END   = math.radians(30)

for frame, angle in [(1, ANGLE_START), (90, ANGLE_END)]:
    scene.frame_set(frame)
    cam.location = (
        RADIUS * math.sin(angle),
        -RADIUS * math.cos(angle),
        ELEVATION,
    )
    # Point camera at origin
    dx = -cam.location.x
    dy = -cam.location.y
    dz = -cam.location.z
    yaw   = math.atan2(dx, -dy)
    pitch = math.atan2(dz, math.hypot(dx, dy))
    cam.rotation_euler = (math.pi / 2 - pitch, 0.0, yaw)
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# Linear interpolation between keyframes
for fcurve in cam.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Render to MP4 ───────────────────────────────────────────────────────────────
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")

bpy.ops.render.render(animation=True)
print(f"[record] Written: {scene.render.filepath}")
