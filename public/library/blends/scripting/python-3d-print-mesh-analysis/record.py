"""
record.py — Viewport animation render for python-3d-print-mesh-analysis
Outputs: public/library/videos/scripting/python-3d-print-mesh-analysis/viewport.mp4

Run AFTER blueprint.py has executed (pawn_print_ready.blend must already exist).
Open the .blend, then: Scripting workspace → Open record.py → Run Script.

Renders 360 frames of the pawn spin (15 s @ 24 fps) using EEVEE Next.
The overhang heat-map material is already embedded in the scene, so the
video shows the green-to-red coverage rotating in context.
"""

import os
import bpy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR    = os.path.normpath(
    os.path.join(SCRIPT_DIR,
                 "../../videos/scripting/python-3d-print-mesh-analysis")
)
OUT_PATH   = os.path.join(OUT_DIR, "viewport")  # Blender appends frame number

os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
prev_path   = scene.render.filepath
prev_format = scene.render.image_settings.file_format

# ── render settings ───────────────────────────────────────────────────────────
scene.render.engine                     = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x              = 1920
scene.render.resolution_y              = 1080
scene.render.resolution_percentage     = 100
scene.render.fps                        = 24
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format             = "MPEG4"
scene.render.ffmpeg.codec              = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.ffmpeg.ffmpeg_preset      = "GOOD"
scene.render.filepath                  = OUT_PATH

# neutral dark background so the heat-map colours read clearly
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.3
scene.world = world

# ── EEVEE quality ─────────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.taa_render_samples = 64
eevee.use_bloom          = False   # no bloom — heat-map saturation reads better without

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

# restore
scene.render.filepath                    = prev_path
scene.render.image_settings.file_format  = prev_format

print(f"[holoflow] viewport.mp4 → {OUT_PATH}.mp4")
