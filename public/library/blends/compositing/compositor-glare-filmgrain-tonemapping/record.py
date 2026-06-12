"""
record.py — Viewport recording for compositor-glare-filmgrain-tonemapping
Run AFTER blueprint.py in the same Blender session.

Outputs 90 frames (3 s at 30 fps) to:
  public/library/videos/compositing/compositor-glare-filmgrain-tonemapping/viewport.mp4

The recording shows a 360° orbit of the chrome sphere + faceted gem scene,
demonstrating the lit subject that feeds the Glare + Grain + Tone Map chain.
To see the fully-composited result, press F12 after recording (uses Cycles).
"""

import bpy
import math

FPS          = 30
TOTAL_FRAMES = 90
ORB_RADIUS   = 4.5
ORB_HEIGHT   = 2.4

OUT_PATH = "//../../public/library/videos/compositing/" \
           "compositor-glare-filmgrain-tonemapping/viewport"

s = bpy.context.scene
s.render.fps              = FPS
s.frame_start             = 1
s.frame_end               = TOTAL_FRAMES
s.render.image_settings.file_format    = "FFMPEG"
s.render.ffmpeg.format                 = "MPEG4"
s.render.ffmpeg.codec                  = "H264"
s.render.ffmpeg.constant_rate_factor   = "HIGH"
s.render.filepath = OUT_PATH

cam_obj = s.camera
if cam_obj is None:
    cd = bpy.data.cameras.new("record_cam")
    cd.lens = 50
    cam_obj = bpy.data.objects.new("record_cam", cd)
    s.collection.objects.link(cam_obj)
    s.camera = cam_obj

cam_obj.animation_data_clear()

for f in range(1, TOTAL_FRAMES + 1):
    angle = 2.0 * math.pi * (f - 1) / TOTAL_FRAMES
    x = ORB_RADIUS * math.sin(angle)
    y = -ORB_RADIUS * math.cos(angle)
    z = ORB_HEIGHT
    cam_obj.location = (x, y, z)
    horiz = math.sqrt(x * x + y * y)
    cam_obj.rotation_euler = (
        math.atan2(horiz, z),
        0.0,
        math.atan2(x, y) + math.pi,
    )
    cam_obj.keyframe_insert(data_path="location",       frame=f)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)

# OpenGL viewport render — fast, shows spec highlights on chrome sphere
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False, view_context=True)

print("[holoflow] record complete → viewport.mp4")
