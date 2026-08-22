"""
record.py — Viewport animation render for FFT Epicycles blueprint.
Outputs:  public/library/videos/scripting/python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr/viewport.mp4
Duration: 256 frames at 30 fps ≈ 8.5 seconds — one complete phasor period.

Run AFTER blueprint.py so the scene is already built.
The camera does a slow 30° arc to show the 3-D phasor chain depth.
"""

import bpy, math

scene = bpy.context.scene

# ─── RENDER SETTINGS ─────────────────────────────────────────────────────────
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x  = 1920
scene.render.resolution_y  = 1080
scene.render.fps           = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_bitrate    = 8000

import os
out_dir = os.path.join(
    os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp",
    "../../../../videos/scripting/python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
)
os.makedirs(out_dir, exist_ok=True)
scene.render.filepath = os.path.join(out_dir, "viewport.mp4")

# ─── CAMERA ARC KEYFRAMES ────────────────────────────────────────────────────
cam = scene.camera
if cam is None:
    raise RuntimeError("Run blueprint.py first to create the camera.")

# Start: slightly above, looking down at the chain
cam.location = (0, -4.5, 2.2)
cam.rotation_euler = (math.radians(70), 0, 0)
cam.keyframe_insert("location", frame=1)
cam.keyframe_insert("rotation_euler", frame=1)

# End: arc 30° around the chain on the XZ plane
import mathutils
end_loc = mathutils.Matrix.Rotation(math.radians(30), 4, 'Z') @ mathutils.Vector((0, -4.5, 2.2))
cam.location = end_loc
cam.rotation_euler = (math.radians(70), 0, math.radians(30))
cam.keyframe_insert("location", frame=scene.frame_end)
cam.keyframe_insert("rotation_euler", frame=scene.frame_end)

# Smooth arc interpolation
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ─── RENDER ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("viewport.mp4 written to:", scene.render.filepath)
