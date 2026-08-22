"""
record.py — Viewport animation render for python-bpy-bmesh-dodecahedron
Outputs: public/library/videos/scripting/python-bpy-bmesh-dodecahedron/viewport.mp4

Run AFTER blueprint.py has been executed (the .blend must already exist).
Open the .blend, then: Scripting workspace → Open record.py → Run Script.

Renders 120 frames of the dodecahedron spin at 24 fps using EEVEE Next,
producing a 5-second MP4 preview.  The script writes the output path into
the scene, renders, then restores the original output path so the .blend is
not permanently dirtied.
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR    = os.path.normpath(
    os.path.join(SCRIPT_DIR,
                 "../../videos/scripting/python-bpy-bmesh-dodecahedron")
)
OUT_PATH   = os.path.join(OUT_DIR, "viewport")  # Blender appends frame range

os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
prev_path   = scene.render.filepath
prev_format = scene.render.image_settings.file_format

# ── render settings ───────────────────────────────────────────────────────────
scene.render.engine                    = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x             = 1920
scene.render.resolution_y             = 1080
scene.render.resolution_percentage    = 100
scene.render.fps                       = 24
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format            = "MPEG4"
scene.render.ffmpeg.codec             = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.ffmpeg.ffmpeg_preset     = "GOOD"
scene.render.filepath                 = OUT_PATH

# world: dark grey so the gold facets read clearly
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.05, 0.05, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.4
scene.world = world

# ── EEVEE quality ─────────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.taa_render_samples  = 64
eevee.use_bloom           = True

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

# restore
scene.render.filepath                    = prev_path
scene.render.image_settings.file_format  = prev_format

print(f"[holoflow] viewport.mp4 → {OUT_PATH}.mp4")
