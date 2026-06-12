"""
record.py — Viewport MP4 for physics-soft-body-jelly-squash-stretch
====================================================================
Renders a 5-second viewport animation (80 frames at 24fps, sped up 40%)
showing the jelly blob falling, squashing on impact, stretching on rebound,
and settling.  Output: public/library/videos/physics/
physics-soft-body-jelly-squash-stretch/viewport.mp4

Run AFTER blueprint.py has been executed AND the soft body cache has been
fully baked (Properties → Physics → Soft Body Cache → Bake All Dynamics).
"""

import bpy
import os

# ── Output path ───────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "..", "..", "..", "..",
    "public", "library", "videos",
    "physics", "physics-soft-body-jelly-squash-stretch",
)
OUTPUT_DIR = os.path.normpath(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene

# ── Render settings ───────────────────────────────────────────────────────────
scene.render.engine             = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x       = 1280
scene.render.resolution_y       = 720
scene.render.fps                = 24
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath           = os.path.join(OUTPUT_DIR, "viewport.mp4")

scene.frame_start = 1
scene.frame_end   = 80

# ── Camera ────────────────────────────────────────────────────────────────────
import math
cam_obj = bpy.data.objects.get("Camera")
if cam_obj:
    cam_obj.location       = (3.2, -4.5, 2.0)
    cam_obj.rotation_euler = (math.radians(72), 0.0, math.radians(36))

# ── EEVEE-Next settings ───────────────────────────────────────────────────────
eevee = scene.eevee
eevee.use_shadows   = True
eevee.use_bloom     = True
eevee.bloom_threshold   = 0.9
eevee.bloom_intensity   = 0.15

# ── Lighting ─────────────────────────────────────────────────────────────────
if "Light" in bpy.data.objects:
    light = bpy.data.objects["Light"]
    light.location = (2.0, -2.0, 4.5)
    light.data.energy = 800
    light.data.type   = 'AREA'

# ── Render ────────────────────────────────────────────────────────────────────
print(f"Recording to {scene.render.filepath}")
bpy.ops.render.render(animation=True)
print("viewport.mp4 done.")
