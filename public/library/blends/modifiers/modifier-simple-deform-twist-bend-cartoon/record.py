"""
record.py — Simple Deform Twist-Bend viewport animation capture (Blender 5.1)
=============================================================================
Renders a 60-frame EEVEE Next animation of the column winding up from 0° to
360° twist, with a slow 45° camera orbit, then writes an MP4 to:
  public/library/videos/modifiers/modifier-simple-deform-twist-bend-cartoon/viewport.mp4

Run from the blend directory:
  blender twisted_column.blend --background --python record.py

Requires blueprint.py to have been run first (scene + camera set up).
"""

import bpy
import math
import os

_HERE   = os.path.dirname(os.path.abspath(__file__))
_ROOT   = os.path.normpath(os.path.join(_HERE, "..", "..", "..", "..", ".."))
OUT_DIR = os.path.join(
    _ROOT, "public", "library", "videos",
    "modifiers", "modifier-simple-deform-twist-bend-cartoon",
)
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
cam   = scene.camera

if cam is None:
    raise RuntimeError("No camera found — run blueprint.py first.")

scene.frame_start = 1
scene.frame_end   = 60
scene.render.fps  = 24

# Camera orbit: 45° counter-clockwise over 60 frames (constant speed)
for fc in (cam.animation_data.action.fcurves if cam.animation_data else []):
    cam.animation_data.action.fcurves.remove(fc)

cam.rotation_euler.z = math.radians(0)
cam.keyframe_insert(data_path='rotation_euler', index=2, frame=1)
cam.rotation_euler.z = math.radians(45)
cam.keyframe_insert(data_path='rotation_euler', index=2, frame=60)

if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.resolution_percentage = 100
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

bpy.ops.render.render(animation=True)
print(f"[record] wrote → {scene.render.filepath}")
