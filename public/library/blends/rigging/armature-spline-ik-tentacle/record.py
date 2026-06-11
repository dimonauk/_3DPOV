"""
record.py — Viewport animation render for Spline IK Tentacle Rig
Outputs: public/library/videos/rigging/armature-spline-ik-tentacle/viewport.mp4

Run AFTER blueprint.py has produced tentacle_spline_ik.blend.
Execute inside that .blend file (Text Editor → Run Script).

Renders 60 frames at 24 fps → 2.5 s clip showing the tentacle flexing
through rest → prey-reach → coiled poses.  EEVEE Next for speed.
"""

import bpy
import os

OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "..", "..",
    "public", "library", "videos",
    "rigging", "armature-spline-ik-tentacle",
)
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.resolution_percentage = 100
scene.render.fps                 = 24
scene.frame_start                = 1
scene.frame_end                  = 60

# Use FFMPEG output for .mp4
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath            = os.path.join(OUT_DIR, "viewport")

# EEVEE quality for fast render
scene.eevee.taa_render_samples   = 16
scene.eevee.use_gtao              = True
scene.eevee.gtao_distance         = 0.20
scene.eevee.use_bloom             = True
scene.eevee.bloom_intensity       = 0.04
scene.eevee.bloom_threshold       = 0.85

# Shade smooth the skin mesh
for obj in bpy.data.objects:
    if obj.type == 'MESH' and "tentacle_skin" in obj.name:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_smooth()

bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUT_DIR}/viewport.mp4")
