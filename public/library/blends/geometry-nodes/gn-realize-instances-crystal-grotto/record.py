"""
record.py — viewport animation render for gn-realize-instances-crystal-grotto
Output: public/library/videos/geometry-nodes/gn-realize-instances-crystal-grotto/viewport.mp4

Run after blueprint.py has saved crystal_grotto.blend in the same directory:
  blender crystal_grotto.blend --background --python record.py

120 frames (5 s at 24 fps): the grotto sphere rotates 360° to reveal all crystal
colours.  EEVEE Next renders each frame in ~0.3 s; full clip under 45 seconds.
"""

import bpy, os

_here = os.path.dirname(bpy.data.filepath)
VIDEO_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../videos/geometry-nodes/gn-realize-instances-crystal-grotto",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 120
sc.render.fps  = 24

sc.render.resolution_x           = 1280
sc.render.resolution_y           = 720
sc.render.resolution_percentage  = 100
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec         = 'NONE'
sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")

# OpenGL viewport render — uses active camera, EEVEE shading
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
