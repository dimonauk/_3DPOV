"""record.py — viewport animation render for Euler rigid body poi staff
Run AFTER blueprint.py. Orbits the camera around the spinning staff and
renders 240 frames to:
  public/library/videos/scripting/
    python-numpy-euler-rigid-body-spinning-top-precession-poi-staff/
      viewport.mp4
"""
import bpy, math, os

OUT_DIR = (
    "//../../../../public/library/videos/scripting/"
    "python-numpy-euler-rigid-body-spinning-top-precession-poi-staff/"
)

scn = bpy.context.scene

# Remove any stale record camera
for name in ("HF_RecordCamera", "HF_RecordTarget"):
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

# Aim target at origin (staff pivots around world centre)
bpy.ops.object.empty_add(location=(0.0, 0.0, 0.15))
target      = bpy.context.active_object
target.name = "HF_RecordTarget"

# Camera start position — oblique to see both staff spin and polhode trail
bpy.ops.object.camera_add(location=(2.2, -1.6, 0.8))
cam = bpy.context.active_object
cam.name = "HF_RecordCamera"
bpy.context.scene.camera = cam

# Track-To so camera always faces the target
tt = cam.constraints.new("TRACK_TO")
tt.target    = target
tt.track_axis  = "TRACK_NEGATIVE_Z"
tt.up_axis     = "UP_Y"

# Gentle 40° orbit over the animation length
cam.animation_data_create()
action = bpy.data.actions.new("HF_RecordCam_Action")
cam.animation_data.action = action

R = 2.8   # orbit radius [m]
for frame, angle in [(1, 0.0), (scn.frame_end, math.radians(40))]:
    cam.location = (
        R * math.cos(angle - math.pi * 0.4),
        R * math.sin(angle - math.pi * 0.4),
        0.80,
    )
    cam.keyframe_insert("location", frame=frame)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# Render settings
scn.render.resolution_x = 1280
scn.render.resolution_y = 720
scn.render.fps = 24
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format              = "MPEG4"
scn.render.ffmpeg.codec               = "H264"
scn.render.ffmpeg.constant_rate_factor = "HIGH"

os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)
scn.render.filepath = OUT_DIR + "viewport.mp4"
bpy.ops.render.render(animation=True, use_viewport=True)
print(f"Rendered viewport.mp4 → {bpy.path.abspath(scn.render.filepath)}")
