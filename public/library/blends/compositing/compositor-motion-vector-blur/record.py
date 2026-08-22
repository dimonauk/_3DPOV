"""
record.py — Viewport animation render for compositor-motion-vector-blur
Blender 5.1 | Holoflow Studio | CC0

Produces: public/library/videos/compositing/compositor-motion-vector-blur/viewport.mp4

Strategy: render 60 frames as PNG then encode to MP4.
  First 30 frames: the gem spinning with NO compositor VecBlur (muted node)
  → shows the raw render at 10°/frame.
  Last 30 frames: the same animation WITH VecBlur active.
  → shows the smear effect side-by-side in one clip.

The split approach is more informative than a straight playback because
the viewer sees exactly what the Vector Blur node adds.
"""

import bpy
import math
import os
import subprocess

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..",
    "..",
    "..",
    "..",
    "public",
    "library",
    "videos",
    "compositing",
    "compositor-motion-vector-blur",
)
FRAMES_SHARP  = 30
FRAMES_BLURED = 30
TOTAL_FRAMES  = FRAMES_SHARP + FRAMES_BLURED

os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps = 24
scene.render.image_settings.file_format = "PNG"

# Find the VecBlur node
vblur_node = None
if scene.use_nodes:
    for n in scene.node_tree.nodes:
        if n.type == "VECBLUR":
            vblur_node = n
            break

frames_dir = os.path.join(OUTPUT_DIR, "_frames")
os.makedirs(frames_dir, exist_ok=True)

print("[record] Rendering comparison sequence ...")

for i in range(TOTAL_FRAMES):
    # Cycle through the 36-frame animation
    scene.frame_set((i % 36) + 1)

    # Toggle VecBlur: off for first half, on for second half
    if vblur_node:
        vblur_node.mute = (i < FRAMES_SHARP)

    pad = str(i + 1).zfill(4)
    scene.render.filepath = os.path.join(frames_dir, f"frame_{pad}.png")
    bpy.ops.render.render(write_still=True)

# Encode with ffmpeg if available
out_mp4 = os.path.join(OUTPUT_DIR, "viewport.mp4")
ffmpeg_cmd = [
    "ffmpeg", "-y", "-r", "24",
    "-i", os.path.join(frames_dir, "frame_%04d.png"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p",
    out_mp4,
]
try:
    subprocess.run(ffmpeg_cmd, check=True)
    print(f"[record] Encoded → {out_mp4}")
except (FileNotFoundError, subprocess.CalledProcessError) as e:
    print(f"[record] ffmpeg not available or failed: {e}")
    print(f"[record] PNG frames are in {frames_dir} — encode manually.")

print("[record] Done.")
