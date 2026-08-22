"""
record.py — Viewport animation recorder for python-geonodes-tree-build-bpy
Blender 5.1 | Holoflow Studio | CC0

Run blueprint.py first to build the scene, then run this script from within
the same Blender session to render a 60-frame viewport animation to:
  public/library/videos/scripting/python-geonodes-tree-build-bpy/viewport.mp4

The animation shows the Noise displacement growing from flat sphere (frame 1)
to fully displaced organic blob (frame 60), demonstrating the scripted GN tree
live in the viewport without a single UI interaction.
"""

import bpy
import os

VIDEO_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)
    )))),
    "videos", "scripting", "python-geonodes-tree-build-bpy"
)
os.makedirs(VIDEO_DIR, exist_ok=True)

OUTPUT_PATH = os.path.join(VIDEO_DIR, "viewport")   # Blender appends 0001.png etc.

scene = bpy.context.scene

# Render to individual PNG frames, then encode via ffmpeg post (or Blender VSE)
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = OUTPUT_PATH
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 60

# Ensure EEVEE Next with quick settings for viewport-style output
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 16    # fast render; motion-blur off

# Render all frames
bpy.ops.render.render(animation=True, write_still=False)

print(f"[holoflow] Frames rendered to: {OUTPUT_PATH}####.png")
print("[holoflow] Encode with: ffmpeg -r 24 -i viewport%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4")
