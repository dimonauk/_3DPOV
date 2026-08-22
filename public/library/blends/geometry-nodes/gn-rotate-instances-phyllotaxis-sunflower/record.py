"""
record.py — OpenGL viewport animation render for gn-rotate-instances-phyllotaxis-sunflower
Outputs: public/library/videos/geometry-nodes/gn-rotate-instances-phyllotaxis-sunflower/viewport.mp4

Run AFTER blueprint.py has saved phyllotaxis_sunflower.blend in the same directory:
  blender phyllotaxis_sunflower.blend --background --python record.py

The 72-frame clip (3 s at 24 fps) orbits the camera 360° above the sunflower
disc so the viewer can follow the 89 clockwise and 55 counter-clockwise
Fibonacci spirals that emerge from the 144-seed Golden Angle packing.

EEVEE Next renders each frame in ~0.08–0.3 s on a mid-range GPU.
Total render time: approximately 20–40 seconds.
"""

import bpy
import os

_here   = os.path.dirname(bpy.data.filepath)
OUT_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-rotate-instances-phyllotaxis-sunflower",
))
os.makedirs(OUT_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 72
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
