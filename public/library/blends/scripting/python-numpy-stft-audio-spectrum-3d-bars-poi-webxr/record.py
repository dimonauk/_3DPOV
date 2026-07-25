"""
record.py — Viewport OpenGL render to viewport.mp4
Python + numpy STFT — Audio Spectrum 3D Bar Visualiser (Blender 5.1)

Run AFTER blueprint.py has built and saved hf_spectrum.blend.
Opens that blend (or runs inside it) and renders frames 1–120 to
public/library/videos/scripting/python-numpy-stft-audio-spectrum-3d-bars-poi-webxr/viewport.mp4

Invoke: blender hf_spectrum.blend --background --python record.py
"""

import os
import bpy

SLUG     = "python-numpy-stft-audio-spectrum-3d-bars-poi-webxr"
OUT_DIR  = bpy.path.abspath(
    f"//../../../../public/library/videos/scripting/{SLUG}/"
)
OUT_PATH = os.path.join(OUT_DIR, "viewport")  # FFmpeg appends .mp4

scene = bpy.context.scene

# ── Render settings ────────────────────────────────────────────────────────────
scene.render.engine           = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format    = "MPEG4"
scene.render.ffmpeg.codec     = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.fps               = 24
scene.render.frame_map_old     = 1
scene.render.frame_map_new     = 1
scene.frame_start              = 1
scene.frame_end                = 120
scene.render.filepath          = OUT_PATH

# ── EEVEE Next lighting ────────────────────────────────────────────────────────
eevee = scene.eevee
eevee.use_bloom                = True
eevee.bloom_threshold          = 0.6
eevee.bloom_intensity          = 1.2
eevee.use_gtao                 = False

# black world background (emission-only materials pop against it)
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background") or \
          world.node_tree.nodes.new("ShaderNodeBackground")
bg_node.inputs["Color"].default_value    = (0.005, 0.005, 0.012, 1.0)
bg_node.inputs["Strength"].default_value = 1.0
scene.world = world

# ── Camera position ────────────────────────────────────────────────────────────
import mathutils

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)

# look at origin from slightly above-front
cam_obj.location = mathutils.Vector((0.0, -8.0, 2.5))
direction        = mathutils.Vector((0, 0, 1.5)) - cam_obj.location
rot_quat         = direction.to_track_quat("-Z", "Y")
cam_obj.rotation_euler = rot_quat.to_euler()
scene.camera = cam_obj

# ── Motion blur (trails the poi) ───────────────────────────────────────────────
scene.render.use_motion_blur  = True
scene.render.motion_blur_shutter = 0.5

os.makedirs(OUT_DIR, exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record] rendered → {OUT_PATH}.mp4")
