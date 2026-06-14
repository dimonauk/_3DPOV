"""
record.py — Viewport animation render for modifier-ocean-fourier-water-shader
Blender 5.1  |  CC0

Run AFTER blueprint.py has built the scene in the same .blend session.
Renders 300 frames (12 s at 25 fps) of the animated ocean to:
  public/library/videos/modifiers/modifier-ocean-fourier-water-shader/viewport.mp4

The time driver on the Ocean modifier advances wave_time = frame/25, so the
rendered sequence shows several full wave-period cycles, foam crests cycling
at wave crests, and the EEVEE Next SSR reflections animating naturally.
"""

import bpy
import os

OUTPUT_DIR   = "//../../../../public/library/videos/modifiers/modifier-ocean-fourier-water-shader/"
ANIM_END     = 300    # 12 s at 25 fps — covers ~3 full wave cycles for WAVE_SCALE=1.5
RES_X        = 1920
RES_Y        = 1080
FPS          = 25

sc = bpy.context.scene
sc.render.resolution_x                   = RES_X
sc.render.resolution_y                   = RES_Y
sc.render.fps                            = FPS
sc.frame_start                           = 1
sc.frame_end                             = ANIM_END
sc.render.engine                         = 'BLENDER_EEVEE_NEXT'
sc.render.image_settings.file_format     = 'FFMPEG'
sc.render.ffmpeg.format                  = 'MPEG4'
sc.render.ffmpeg.codec                   = 'H264'
sc.render.ffmpeg.constant_rate_factor    = 'MEDIUM'   # ~8 Mbit/s — good for review
sc.render.filepath = OUTPUT_DIR + "viewport.mp4"

os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)

bpy.ops.render.render(animation=True, use_viewport=False)
print("record.py: viewport render complete → viewport.mp4")
