"""
record.py — OpenGL viewport animation render for gn-accumulate-field-spiral-staircase
Outputs: public/library/videos/geometry-nodes/gn-accumulate-field-spiral-staircase/viewport.mp4

Run AFTER blueprint.py has saved spiral_staircase.blend in the same directory:
  blender spiral_staircase.blend --background --python record.py

The 96-frame clip (4 s at 24 fps) orbits the camera 360° around the staircase
so the viewer sees every tread from every angle and can follow the helical rise
from floor (step 0, angle 0°) to the top (step 15, angle 337.5°, height 2.25 m).

EEVEE Next renders each frame in ~0.1–0.4 s on a mid-range GPU.
Total render time: approximately 30–60 seconds.
"""

import bpy
import os

_here   = os.path.dirname(bpy.data.filepath)
OUT_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-accumulate-field-spiral-staircase",
))
os.makedirs(OUT_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 96
sc.render.fps                         = 24
sc.render.resolution_x                = 1280
sc.render.resolution_y                = 720
sc.render.resolution_percentage       = 100
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec          = 'NONE'
sc.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
