"""
record.py — Viewport animation render for eevee-next-bloom-emission-glow-cel-shade
Outputs: public/library/videos/rendering/eevee-next-bloom-emission-glow-cel-shade/viewport.mp4

Run AFTER blueprint.py (assumes scene is populated).
Renders frames 1-60 at 1280×720, compositing active, then encodes via ffmpeg.
"""

import bpy
import os
import subprocess

scene = bpy.context.scene

# ─── Render settings for recording ──────────────────────────────────────────────
scene.render.engine           = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x     = 1280
scene.render.resolution_y     = 720
scene.render.resolution_percentage = 100
scene.render.fps              = 30
scene.frame_start             = 1
scene.frame_end               = 60

VIDEO_DIR  = bpy.path.abspath("//public/library/videos/rendering/eevee-next-bloom-emission-glow-cel-shade")
FRAMES_DIR = os.path.join(VIDEO_DIR, "frames")
OUTPUT_MP4 = os.path.join(VIDEO_DIR, "viewport.mp4")

os.makedirs(FRAMES_DIR, exist_ok=True)

# ─── Render PNG sequence ─────────────────────────────────────────────────────────
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.join(FRAMES_DIR, "frame_")

# Compositor must be active — already configured by blueprint.py
scene.use_nodes = True

bpy.ops.render.render(animation=True)

# ─── Encode to MP4 via ffmpeg ────────────────────────────────────────────────────
cmd = [
    "ffmpeg", "-y",
    "-framerate", "30",
    "-i", os.path.join(FRAMES_DIR, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "20",
    OUTPUT_MP4,
]
try:
    subprocess.run(cmd, check=True)
    print(f"[record] viewport.mp4 → {OUTPUT_MP4}")
except FileNotFoundError:
    print("[record] ffmpeg not found — PNG frames are in:", FRAMES_DIR)
