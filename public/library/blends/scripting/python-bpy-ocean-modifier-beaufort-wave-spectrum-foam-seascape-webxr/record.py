"""
record.py — viewport animation render for OceanModifier tutorial
Outputs: public/library/videos/scripting/
           python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr/
           viewport.mp4

Run from Blender's Script Editor AFTER blueprint.py has been executed in
the same session (ocean_obj and the driver are already live).
Duration: 5 seconds (frames 1–120 at 24 fps).
"""

import bpy
import os
import math
from mathutils import Vector

# ── output path ────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(
    SCRIPT_DIR,
    "..", "..", "..", "..",
    "videos", "scripting",
    "python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── render settings ────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.resolution_percentage = 100
scene.render.fps             = 24
scene.frame_start            = 1
scene.frame_end              = 120   # 5 s

# EEVEE Next for fast preview render; swap to CYCLES for production
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# H.264 container
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.audio_codec          = 'NONE'

scene.render.filepath = OUTPUT_PATH

# ── camera (re-use from blueprint or create fresh) ─────────────────────────
if "Camera" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 28.0
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
else:
    scene.camera = bpy.data.objects["Camera"]

scene.camera.location       = Vector((0.0, -14.0, 10.0))
scene.camera.rotation_euler = (math.radians(52), 0.0, 0.0)

# ── world background (avoid pure black) ────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.4, 0.7, 0.9, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.4
scene.world = world

# ── render animation ───────────────────────────────────────────────────────
print(f"[record] rendering frames 1–120 → {OUTPUT_PATH}")
bpy.ops.render.render(animation=True, write_still=False)
print("[record] done.")
