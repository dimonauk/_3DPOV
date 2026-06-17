"""
record.py — Viewport recording for compositor-kuwahara-painterly-stylisation
Run AFTER blueprint.py has been executed in the same Blender session.

Outputs 90 frames (3 s at 30 fps) to:
  public/library/videos/compositing/compositor-kuwahara-painterly-stylisation/viewport.mp4

The animation orbits the ceramic vessel to show the faceted silhouette and
emissive trim ring that feed the Kuwahara pipeline.

To see the fully composited, oil-painted result: F12 (single frame render)
after this viewport recording, then switch to the Compositor workspace and
examine the Viewer node.

NOTE: This record.py captures the 3D viewport (OpenGL) — fast, no denoising.
The full Cycles + Kuwahara pipeline runs only via F12 or bpy.ops.render.render().
"""

import bpy
import math

FPS          = 30
TOTAL_FRAMES = 90          # 3 seconds
ORB_RADIUS   = 3.8
ORB_HEIGHT   = 1.4
ORB_START_Y  = math.pi     # start at front (negative Y)

OUT_PATH = "//../../public/library/videos/compositing/" \
           "compositor-kuwahara-painterly-stylisation/viewport"

s = bpy.context.scene
s.render.fps            = FPS
s.frame_start           = 1
s.frame_end             = TOTAL_FRAMES
s.render.resolution_x   = 1280
s.render.resolution_y   = 720
s.render.filepath        = OUT_PATH

s.render.image_settings.file_format   = "FFMPEG"
s.render.ffmpeg.format                = "MPEG4"
s.render.ffmpeg.codec                 = "H264"
s.render.ffmpeg.constant_rate_factor  = "HIGH"
s.render.ffmpeg.audio_codec           = "NONE"

# Use existing scene camera or create one for the record pass
cam_obj = s.camera
if cam_obj is None:
    cd = bpy.data.cameras.new("RecordCam")
    cd.lens = 85
    cam_obj = bpy.data.objects.new("RecordCam", cd)
    s.collection.objects.link(cam_obj)
    s.camera = cam_obj

cam_obj.animation_data_clear()

for f in range(1, TOTAL_FRAMES + 1):
    t = (f - 1) / TOTAL_FRAMES
    angle = 2.0 * math.pi * t + ORB_START_Y
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

# OpenGL viewport render — EEVEE shading, fast
bpy.ops.render.opengl(
    animation=True,
    sequencer=False,
    write_still=False,
    view_context=True,
)

print("[holoflow] record complete →", OUT_PATH + ".mp4")
print("  For the oil-paint frame: F12 (Cycles render) + check Compositor Viewer.")
