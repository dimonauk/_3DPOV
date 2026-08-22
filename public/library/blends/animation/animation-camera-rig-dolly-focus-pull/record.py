"""
record.py — Viewport animation render for camera_dolly_rig.blend
Blender 5.1  |  CC0 1.0  |  Holoflow Studio

Run AFTER blueprint.py has created camera_dolly_rig.blend:
  blender camera_dolly_rig.blend --background --python record.py

Renders frames 1–120 from the scene camera (85 mm, f/1.8 DOF).
Output: public/library/videos/animation/animation-camera-rig-dolly-focus-pull/viewport.mp4

The script deliberately renders via EEVEE Next (fast) rather than Cycles
so the preview video is producible in under a minute on a mid-range GPU.
The DOF is EEVEE's ray-traced approximation — visually accurate for a preview,
even if it lacks Cycles' bokeh aberrations.
"""

import bpy
import os

OUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "..", "..", "..", "..", "..", "..", "..",
    "public", "library", "videos",
    "animation", "animation-camera-rig-dolly-focus-pull",
)
OUT_DIR = os.path.normpath(os.path.join(bpy.data.filepath,
    "../../../../../../public/library/videos/"
    "animation/animation-camera-rig-dolly-focus-pull"))

os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene

# Render settings for preview video
scene.render.engine       = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps          = 24
scene.frame_start         = 1
scene.frame_end           = 120

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# EEVEE Next DOF — ensure it's on
scene.eevee.use_raytracing = True

bpy.ops.render.render(animation=True)
print(f"Rendered → {scene.render.filepath}")
