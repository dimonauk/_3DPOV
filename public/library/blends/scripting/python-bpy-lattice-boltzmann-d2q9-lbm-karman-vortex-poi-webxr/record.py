"""
record.py — viewport animation render for the LBM Kármán vortex street.
Runs blueprint.py setup, then renders 300 frames of EEVEE viewport to
public/library/videos/scripting/python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr/viewport.mp4

Run this file from the Blender Scripting workspace (after blueprint.py has
already been run at least once in the same session, or run it standalone
which will call setup() automatically).
"""

import bpy, os, sys

SLUG      = "python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr"
VIDEO_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "..",
    "public", "library", "videos", "scripting", SLUG,
)
VIDEO_DIR = os.path.normpath(VIDEO_DIR)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUT_PATH  = os.path.join(VIDEO_DIR, "viewport.mp4")

# Ensure blueprint is initialised
if bpy.data.objects.get('LBM_Flow') is None:
    exec(open(os.path.join(os.path.dirname(__file__), "blueprint.py")).read())

sc = bpy.context.scene

# Render settings — EEVEE + FFmpeg H.264
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.ffmpeg.ffmpeg_preset        = 'GOOD'
sc.render.filepath                    = OUT_PATH
sc.render.frame_start                 = 1
sc.render.frame_end                   = 300
sc.render.fps                         = 24

# Run the LBM simulation frame-by-frame and render each frame
import numpy as np

# Access the handler's globals through the module
# (blueprint loaded into __main__ namespace by exec above)
import __main__ as bp

for frame in range(1, 301):
    sc.frame_set(frame)            # fires frame_change_pre → lbm_handler
    sc.render.filepath = os.path.join(VIDEO_DIR, f"frame_{frame:04d}.png")

sc.render.filepath = OUT_PATH
bpy.ops.render.render(animation=True, use_viewport=False)

print(f"[record.py] Rendered 300 frames → {OUT_PATH}")
