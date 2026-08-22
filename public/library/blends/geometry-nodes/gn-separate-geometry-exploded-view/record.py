"""
record.py — viewport animation render for the Separate Geometry dissection.
Run AFTER blueprint.py has already saved dissection_exploded.blend.

Output: public/library/videos/geometry-nodes/gn-separate-geometry-exploded-view/viewport.mp4
Codec:  H.264 via FFMPEG, 1920×1080, 30 fps, 60 frames (~2 s)
Engine: EEVEE Next
"""

import bpy
import os
from pathlib import Path

BLEND_FILE  = Path(bpy.path.abspath("//")) / "dissection_exploded.blend"
OUTPUT_PATH = (
    Path(bpy.path.abspath("//../../../../"))
    / "public/library/videos/geometry-nodes/gn-separate-geometry-exploded-view/viewport"
)

# ── Open the saved blend ──────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_FILE))
scene = bpy.context.scene

# ── Render output settings ────────────────────────────────────────────────────
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.resolution_percentage = 100
scene.render.fps            = 30
scene.render.filepath       = str(OUTPUT_PATH)

# EEVEE quality
scene.eevee.taa_render_samples = 16

# ── Render animation ──────────────────────────────────────────────────────────
os.makedirs(OUTPUT_PATH.parent, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"✓ Video  → {OUTPUT_PATH}.mp4")
