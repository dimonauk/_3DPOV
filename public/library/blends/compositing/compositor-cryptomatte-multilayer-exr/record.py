"""
record.py — Viewport recording for compositor-cryptomatte-multilayer-exr
Run AFTER blueprint.py in the same Blender session.

Outputs 90 frames (3 s at 30 fps) to:
  public/library/videos/compositing/compositor-cryptomatte-multilayer-exr/viewport.mp4

Uses OpenGL viewport render (fast) sweeping a 360° orbit camera.
The compositor overlay is visible in the UV/Image Editor during recording;
for a true compositor-output render, use bpy.ops.render.render(animation=True)
with Cycles — expect ~10 minutes per frame at 64 samples on a modern GPU.
"""

import bpy
import math

FPS          = 30
TOTAL_FRAMES = 90          # 3-second orbit
ORB_RADIUS   = 4.5         # metres from world origin
ORB_HEIGHT   = 2.4

OUT_PATH = "//../../public/library/videos/compositing/" \
           "compositor-cryptomatte-multilayer-exr/viewport"

scene = bpy.context.scene
scene.render.fps          = FPS
scene.frame_start         = 1
scene.frame_end           = TOTAL_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUT_PATH

# Reuse the scene camera created by blueprint.py
cam_obj = scene.camera
if cam_obj is None:
    cam_data = bpy.data.cameras.new("record_cam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("record_cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

cam_obj.animation_data_clear()

# Keyframe 360° orbit — one key per frame for smooth OpenGL playback
for f in range(1, TOTAL_FRAMES + 1):
    angle = 2.0 * math.pi * (f - 1) / TOTAL_FRAMES
    x = ORB_RADIUS * math.sin(angle)
    y = -ORB_RADIUS * math.cos(angle)
    z = ORB_HEIGHT
    cam_obj.location = (x, y, z)

    # Point toward origin: tilt = atan2(horizontal_dist, vertical_drop), spin = angle + π
    horiz = math.sqrt(x * x + y * y)
    cam_obj.rotation_euler = (
        math.atan2(horiz, z),           # tilt down toward origin
        0.0,
        math.atan2(x, y) + math.pi,    # face inward around +Z orbit
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# Linear interpolation — constant angular velocity, no ease-in/out
if cam_obj.animation_data and cam_obj.animation_data.action:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# Render OpenGL viewport animation
bpy.ops.render.opengl(animation=True)
