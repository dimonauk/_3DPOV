"""
record.py — OpenGL viewport animation render for gn-string-to-curves-3d-text
Output: public/library/videos/geometry-nodes/gn-string-to-curves-3d-text/viewport.mp4

Run AFTER blueprint.py has saved procedural_text.blend in the same directory:
  blender procedural_text.blend --background --python record.py

The 60-frame clip (2.5 s at 24 fps) lifts the camera from near-baseline to a
three-quarter view so the bevel-chamfer specular highlight is visible on the
letter edges as the angle changes.

EEVEE Next renders each frame in ~0.05–0.2 s on a mid-range GPU.
Total render time: approximately 5–15 seconds.
"""

import bpy
import os

_here   = os.path.dirname(bpy.data.filepath)
OUT_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-string-to-curves-3d-text",
))
os.makedirs(OUT_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 60
sc.render.fps                         = 24
sc.render.resolution_x                = 1280
sc.render.resolution_y                = 720
sc.render.resolution_percentage       = 100
sc.render.image_settings.file_format  = "FFMPEG"
sc.render.ffmpeg.format               = "MPEG4"
sc.render.ffmpeg.codec                = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.ffmpeg.audio_codec          = "NONE"
sc.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
