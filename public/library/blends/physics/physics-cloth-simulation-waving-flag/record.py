"""
record.py — Cloth Simulation Waving Flag: viewport animation render
Blender 5.1 · CC0 · Holoflow Studio

Orbits the camera 360° over 120 frames (5 s at 24 fps) while the cloth
simulation evaluates frame-by-frame in the render pipeline.  No pre-bake
required: EEVEE renders each frame in order, incrementally advancing the
point-cache through implicit Euler integration.

Output: public/library/videos/physics/physics-cloth-simulation-waving-flag/viewport.mp4

Run after blueprint.py has generated waving_flag.blend:
  blender --background waving_flag.blend --python record.py
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FPS          = 24
TOTAL_FRAMES = 120

ORBIT_RADIUS = 5.0
ORBIT_HEIGHT = 2.0
ORBIT_OFFSET = Vector((1.0, 0.0, 0.0))   # orbit around flag mid-point, not mast
LOOK_TARGET  = Vector((1.2, 0.0, 1.85))  # roughly flag centre

OUTPUT_DIR = "//../../videos/physics/physics-cloth-simulation-waving-flag/"


def add_orbit_keyframes() -> None:
    scene = bpy.context.scene
    cam   = scene.camera
    if cam is None:
        raise RuntimeError("No camera in scene — run blueprint.py first.")

    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    for frame in range(1, TOTAL_FRAMES + 1):
        t     = (frame - 1) / (TOTAL_FRAMES - 1)           # 0.0 → 1.0
        angle = -math.pi * 0.5 + t * math.pi * 2.0         # full 360°
        x     = ORBIT_RADIUS * math.cos(angle) + ORBIT_OFFSET.x
        y     = ORBIT_RADIUS * math.sin(angle)
        cam.location = Vector((x, y, ORBIT_HEIGHT))
        direction    = (LOOK_TARGET - cam.location).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # Linear interpolation: avoids ease-in/out wobble on a continuous orbit
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = FPS
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_DIR + "viewport"


if __name__ == '__main__':
    add_orbit_keyframes()
    configure_render()
    bpy.ops.render.render(animation=True)
