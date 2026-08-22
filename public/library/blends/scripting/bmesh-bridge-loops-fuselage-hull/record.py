"""
record.py — bmesh-bridge-loops-fuselage-hull
Blender 5.1 | CC0

Renders a 60-frame EEVEE viewport animation of the fuselage hull rotating
360°.  Run AFTER blueprint.py (needs fuselage_hull.blend to exist).

How to run:
  1. Open fuselage_hull.blend in Blender 5.1.
  2. Switch to the Scripting workspace.
  3. Open this file → Run Script.

Output: public/library/videos/scripting/bmesh-bridge-loops-fuselage-hull/viewport.mp4
"""

import os
import bpy

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
LIBRARY_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../.."))
OUTPUT_DIR   = os.path.join(
    LIBRARY_ROOT, "videos", "scripting",
    "bmesh-bridge-loops-fuselage-hull",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH  = os.path.join(OUTPUT_DIR, "viewport")   # Blender appends frame suffix

scene        = bpy.context.scene
_prev_path   = scene.render.filepath
_prev_format = scene.render.image_settings.file_format

# ── render settings ───────────────────────────────────────────────────────────
scene.render.engine                       = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                 = 1920
scene.render.resolution_y                 = 1080
scene.render.resolution_percentage        = 100
scene.render.fps                          = 24
scene.frame_start                         = 1
scene.frame_end                           = 60
scene.render.image_settings.file_format   = "FFMPEG"
scene.render.ffmpeg.format                = "MPEG4"
scene.render.ffmpeg.codec                 = "H264"
scene.render.ffmpeg.constant_rate_factor  = "HIGH"
scene.render.ffmpeg.ffmpeg_preset         = "GOOD"
scene.render.filepath                     = OUTPUT_PATH

# Space-black background so hull edge-lit panels read clearly
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.01, 0.02, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.12
scene.world = world

# ── EEVEE quality ─────────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.taa_render_samples = 64
eevee.use_bloom          = True   # mild bloom on the engine-glow emission

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

scene.render.filepath                    = _prev_path
scene.render.image_settings.file_format  = _prev_format
print(f"[holoflow] viewport.mp4 → {OUTPUT_PATH}.mp4")
