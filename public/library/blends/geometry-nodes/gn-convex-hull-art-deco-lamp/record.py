"""
record.py — OpenGL viewport animation render for gn-convex-hull-art-deco-lamp
Outputs: public/library/videos/geometry-nodes/gn-convex-hull-art-deco-lamp/viewport.mp4

Run this AFTER blueprint.py has saved convex_hull_lamp.blend in the same directory:
  blender convex_hull_lamp.blend --background --python record.py

The render shows the lamp rotating a full 360° while the convex hull morphs through
two complete facet configurations (W_ANIM_START → W_ANIM_END over 48 frames).
Each frame takes ~0.3–0.8 s on a mid-range GPU; the full 48-frame clip renders in
under a minute via EEVEE Next.
"""

import bpy
import os

# Resolve output path relative to this blend file's location
_here = os.path.dirname(bpy.data.filepath)
VIDEO_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-convex-hull-art-deco-lamp",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, 48
sc.render.fps              = 24
sc.render.resolution_x     = 1280
sc.render.resolution_y     = 720
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format             = 'MPEG4'
sc.render.ffmpeg.codec              = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec        = 'NONE'
sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")

# OpenGL viewport render: uses the active camera and EEVEE shading
# Faster than full Cycles render; sufficient for a technique-preview clip
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
