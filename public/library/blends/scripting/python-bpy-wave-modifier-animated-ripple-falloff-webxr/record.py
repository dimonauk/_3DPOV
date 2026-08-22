"""
record.py — viewport animation render for WaveModifier tutorial
Outputs: public/library/videos/scripting/
           python-bpy-wave-modifier-animated-ripple-falloff-webxr/
           viewport.mp4

Run from Blender's Script Editor AFTER blueprint.py has been executed in
the same session (the ripple plane and wave modifier are already live).
Duration: 6 seconds (frames 1–144 at 24 fps) — enough to show one full
wave transit across the grid.
"""

import bpy
import os
import math
from mathutils import Vector

# ── output path ───────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(
    SCRIPT_DIR,
    "..", "..", "..", "..",
    "videos", "scripting",
    "python-bpy-wave-modifier-animated-ripple-falloff-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.resolution_x         = 1280
scene.render.resolution_y         = 720
scene.render.resolution_percentage = 100
scene.render.fps                   = 24
scene.frame_start                  = 1
scene.frame_end                    = 144   # 6 s

# EEVEE Next for fast preview render
scene.render.engine = 'BLENDER_EEVEE_NEXT'

scene.render.image_settings.file_format    = 'FFMPEG'
scene.render.ffmpeg.format                  = 'MPEG4'
scene.render.ffmpeg.codec                   = 'H264'
scene.render.ffmpeg.constant_rate_factor    = 'MEDIUM'
scene.render.ffmpeg.audio_codec             = 'NONE'

scene.render.filepath = OUTPUT_PATH

# ── camera ────────────────────────────────────────────────────────────────────
if "Camera" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 35.0
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
else:
    scene.camera = bpy.data.objects["Camera"]

# Slightly above and behind, tilted down to show the wave travelling left→right
scene.camera.location       = Vector((0.0, -3.2, 2.8))
scene.camera.rotation_euler = (math.radians(48), 0.0, 0.0)

# ── rim light ─────────────────────────────────────────────────────────────────
light_data = bpy.data.lights.new("Rim", "SUN")
light_data.energy = 3.0
light_ob   = bpy.data.objects.new("Rim", light_data)
scene.collection.objects.link(light_ob)
light_ob.rotation_euler = (math.radians(55), math.radians(-30), 0.0)

# ── world background ──────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg_node = world.node_tree.nodes["Background"]
bg_node.inputs[0].default_value = (0.05, 0.12, 0.25, 1.0)  # deep blue
bg_node.inputs[1].default_value = 0.3
scene.world = world

# ── render ────────────────────────────────────────────────────────────────────
print(f"[record] rendering frames 1–144 → {OUTPUT_PATH}")
bpy.ops.render.render(animation=True, write_still=False)
print("[record] done.")
