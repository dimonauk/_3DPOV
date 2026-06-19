"""
record.py  —  compositor-color-grading-rgb-curves-cdl
Run AFTER blueprint.py in the same Blender session.

Outputs 90 frames (3 s at 30 fps) to:
  public/library/videos/compositing/compositor-color-grading-rgb-curves-cdl/viewport.mp4

The viewport animation orbits the faceted pillar and emissive ring so the
viewer sees specular highlights travelling across each flat facet — these are
the regions most visibly transformed by the warm-toned CDL grade.

NOTE: This record.py captures the 3-D viewport via OpenGL (fast, EEVEE shading).
The full Cycles + compositor colour-grading pipeline runs only via F12 (or
bpy.ops.render.render()). After the viewport recording, do F12 to see the
graded result with the complete Exposure → Curves → CDL → HSV → Vignette chain.
"""

import bpy
import math

FPS          = 30
TOTAL_FRAMES = 90           # 3 seconds
ORB_RADIUS   = 5.8
ORB_HEIGHT   = 2.8
ORB_START    = math.pi      # start facing front (negative-Y axis)

OUT_PATH = "//../../public/library/videos/compositing/" \
           "compositor-color-grading-rgb-curves-cdl/viewport"

s = bpy.context.scene
s.render.fps           = FPS
s.frame_start          = 1
s.frame_end            = TOTAL_FRAMES
s.render.resolution_x  = 1280
s.render.resolution_y  = 720
s.render.filepath      = OUT_PATH

s.render.image_settings.file_format  = "FFMPEG"
s.render.ffmpeg.format               = "MPEG4"
s.render.ffmpeg.codec                = "H264"
s.render.ffmpeg.constant_rate_factor = "HIGH"
s.render.ffmpeg.audio_codec          = "NONE"

cam_obj = s.camera
if cam_obj is None:
    cd      = bpy.data.cameras.new("RecordCam")
    cd.lens = 50
    cam_obj = bpy.data.objects.new("RecordCam", cd)
    s.collection.objects.link(cam_obj)
    s.camera = cam_obj

cam_obj.animation_data_clear()

for f in range(1, TOTAL_FRAMES + 1):
    t     = (f - 1) / TOTAL_FRAMES
    angle = 2.0 * math.pi * t + ORB_START
    x = ORB_RADIUS * math.sin(angle)
    y = -ORB_RADIUS * math.cos(angle)
    z = ORB_HEIGHT
    cam_obj.location = (x, y, z)
    # Point camera at world origin (pillar base-centre)
    horiz = math.sqrt(x * x + y * y)
    cam_obj.rotation_euler = (
        math.atan2(horiz, z),
        0.0,
        math.atan2(x, y) + math.pi,
    )
    cam_obj.keyframe_insert(data_path="location",       frame=f)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)

bpy.ops.render.opengl(
    animation=True,
    sequencer=False,
    write_still=False,
    view_context=True,
)

print("[holoflow] viewport record complete →", OUT_PATH + ".mp4")
print("  For the graded frame: F12 (Cycles) then check Compositor Viewer node.")
