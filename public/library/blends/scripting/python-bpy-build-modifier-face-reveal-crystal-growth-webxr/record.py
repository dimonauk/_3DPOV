"""
record.py — viewport animation render for BuildModifier crystal growth
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py has saved hf_crystal_geode.blend:
    blender --background hf_crystal_geode.blend --python record.py

Renders 80 frames of the crystal growing bottom-to-top in EEVEE Next,
outputs to public/library/videos/scripting/
python-bpy-build-modifier-face-reveal-crystal-growth-webxr/viewport.mp4
"""

import bpy, math, os

_here    = os.path.dirname(bpy.data.filepath)
OUT_DIR  = os.path.normpath(os.path.join(
    _here, "..", "..", "..", "..", "videos", "scripting",
    "python-bpy-build-modifier-face-reveal-crystal-growth-webxr",
))
os.makedirs(OUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.engine          = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x    = 1080
scene.render.resolution_y    = 1080
scene.render.fps             = 24
scene.frame_start            = 1
scene.frame_end              = 90     # build (80) + 10 frames held at full

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# Slow 90° orbit alongside the build — camera sweeps +X → +Y
ob = scene.objects.get("hf_crystal_geode")
if ob:
    ob.animation_data_clear()

cam = scene.camera
if cam:
    cam.animation_data_clear()
    radius = 3.8
    height = 1.6
    for f in range(1, 91):
        t      = (f - 1) / 89.0
        angle  = math.radians(-5 + t * 90)    # sweep +5° to +95° around Z
        cam.location = (
            radius * math.cos(angle),
            radius * math.sin(angle),
            height,
        )
        # Always point at the geode base
        target = __import__("mathutils").Vector((0, 0, 0.5))
        direction = target - cam.location
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

# EEVEE settings for smooth crystal render
scene.eevee.use_bloom            = True
scene.eevee.bloom_threshold      = 0.65
scene.eevee.bloom_intensity      = 0.28
scene.eevee.taa_render_samples   = 64

bpy.ops.render.render(animation=True)
print(f"Record complete → {scene.render.filepath}")
