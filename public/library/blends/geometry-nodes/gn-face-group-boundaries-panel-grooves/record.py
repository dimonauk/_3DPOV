"""
record.py — OpenGL viewport animation render for gn-face-group-boundaries-panel-grooves
Outputs: public/library/videos/geometry-nodes/gn-face-group-boundaries-panel-grooves/viewport.mp4

Run AFTER blueprint.py has saved panel_grooves.blend in the same directory:
  blender panel_grooves.blend --background --python record.py

The 80-frame clip (3.3 s at 24 fps) rotates the cube a full 360° so the
viewer can see all six faces and observe how the noise-driven panel zones
shift across each face, with groove tube weld-seam lines tracing the
Voronoi-like boundaries between zones.

EEVEE Next renders each frame in ~0.1–0.3 s on a mid-range GPU.
Total render time: under 40 seconds.
"""

import bpy
import os

_here = os.path.dirname(bpy.data.filepath)
VIDEO_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-face-group-boundaries-panel-grooves",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start, sc.frame_end          = 1, 80
sc.render.fps                         = 24
sc.render.resolution_x                = 1280
sc.render.resolution_y                = 720
sc.render.resolution_percentage       = 100
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec          = 'NONE'
sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
