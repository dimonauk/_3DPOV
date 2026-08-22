"""
record.py — Cahn-Hilliard Viewport Orbit Render (Blender 5.1)
=============================================================
Run AFTER blueprint.py in the same Blender session.
Renders the 240-frame camera orbit to an MP4.

Output: public/library/videos/scripting/
        python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr/
        viewport.mp4
"""
import bpy
import os

SLUG      = "python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
VIDEO_DIR = bpy.path.abspath(
    f"//../../../../../../videos/scripting/{SLUG}/"
)
OUT_FILE  = os.path.join(VIDEO_DIR, "viewport.mp4")

os.makedirs(VIDEO_DIR, exist_ok=True)

scn = bpy.context.scene
scn.render.engine                      = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x                = 1920
scn.render.resolution_y                = 1080
scn.render.resolution_percentage       = 100
scn.render.fps                         = 30
scn.render.image_settings.file_format  = 'FFMPEG'
scn.render.ffmpeg.format               = 'MPEG4'
scn.render.ffmpeg.codec                = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath                    = OUT_FILE
scn.render.use_overwrite               = True

bpy.ops.render.render(animation=True)
print(f"[record] Cahn-Hilliard orbit render → {OUT_FILE}")
