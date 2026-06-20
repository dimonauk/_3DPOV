"""
record.py — Viewport animation for GN Index Switch tutorial
Blender 5.1 | CC0 | Holoflow Studio

Runs blueprint.py first, then animates the camera orbiting the colonnade
and writes an OpenGL viewport capture to:
  public/library/videos/geometry-nodes/gn-index-switch-per-instance-geometry-variant/viewport.mp4

Duration: 10 s at 24 fps = 240 frames.
"""

import bpy
import math
import os
import sys

# Run blueprint to ensure scene is populated
_bp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blueprint.py")
exec(compile(open(_bp).read(), _bp, "exec"))

FRAME_START = 1
FRAME_END   = 240
FPS         = 24
ORBIT_DIST  = 14.0
ORBIT_HEIGHT = 7.0
OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..", "videos",
    "geometry-nodes", "gn-index-switch-per-instance-geometry-variant",
    "viewport.mp4",
)

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS

# Animate camera orbit
cam = scene.camera
cam.animation_data_create()
cam.data.animation_data_create()

for frame in range(FRAME_START, FRAME_END + 1):
    t = (frame - FRAME_START) / (FRAME_END - FRAME_START)
    angle = t * math.tau                          # full 360° orbit
    x = math.cos(angle) * ORBIT_DIST
    y = math.sin(angle) * ORBIT_DIST
    cam.location = (x, y, ORBIT_HEIGHT)
    # point camera at origin
    dx, dy, dz = -x, -y, -ORBIT_HEIGHT
    length = math.sqrt(dx*dx + dy*dy + dz*dz)
    # rotation_euler approach: tilt + z-spin
    cam.rotation_euler[2] = angle + math.pi       # face centre
    cam.rotation_euler[0] = math.radians(65)
    cam.rotation_euler[1] = 0
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# Configure viewport render
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.ffmpeg.audio_codec          = "NONE"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUTPUT_PATH

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
bpy.ops.render.opengl(animation=True, write_still=False)
print(f"Viewport recording written to {OUTPUT_PATH}")
