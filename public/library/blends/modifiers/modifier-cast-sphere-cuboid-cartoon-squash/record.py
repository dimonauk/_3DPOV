"""
record.py — Cast Squash-Stretch viewport animation capture (Blender 5.1)
=========================================================================
Renders a 42-frame EEVEE Next animation of the squash-and-stretch cycle
with a 60° camera orbit, then writes an MP4 to:
  public/library/videos/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/viewport.mp4

Run from the blend directory:
  blender cartoon_blob.blend --background --python record.py

Frame timeline:
  1–11  : blob at rest, camera orbiting 0→15°
  12–21 : squash impact (CuboidCast peaks at frame 12)
  22–29 : recovery
  30–41 : stretch overshoot (SphereCast peaks at frame 30)
  42    : settled back to natural shape, orbit complete at 60°
"""

import bpy
import math
import os

# Resolve output path relative to this script's location
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.normpath(os.path.join(_HERE, "..", "..", "..", "..", ".."))
OUT_DIR = os.path.join(
    _ROOT, "public", "library", "videos",
    "modifiers", "modifier-cast-sphere-cuboid-cartoon-squash"
)
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
cam   = scene.camera

if cam is None:
    raise RuntimeError("No camera found — run blueprint.py first to set up the scene.")

scene.frame_start = 1
scene.frame_end   = 42
scene.render.fps  = 24

# Camera orbit: 60° counter-clockwise over the full animation
cam.rotation_euler.z = 0.0
cam.keyframe_insert(data_path='rotation_euler', index=2, frame=1)
cam.rotation_euler.z = math.radians(60)
cam.keyframe_insert(data_path='rotation_euler', index=2, frame=42)
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'   # constant orbit speed

# Render settings
scene.render.engine                         = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                   = 1920
scene.render.resolution_y                   = 1080
scene.render.image_settings.file_format     = 'FFMPEG'
scene.render.ffmpeg.format                  = 'MPEG4'
scene.render.ffmpeg.codec                   = 'H264'
scene.render.ffmpeg.constant_rate_factor    = 'MEDIUM'
scene.render.filepath                       = os.path.join(OUT_DIR, "viewport.mp4")

print(f"[HS] Recording to: {scene.render.filepath}")
bpy.ops.render.render(animation=True)
print("[HS] Record complete.")
