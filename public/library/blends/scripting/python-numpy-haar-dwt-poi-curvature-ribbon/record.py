"""
record.py — viewport animation for the Haar DWT Poi Curvature Ribbon scene.
Run AFTER blueprint.py. Outputs:
  public/library/videos/scripting/python-numpy-haar-dwt-poi-curvature-ribbon/viewport.mp4
"""

import bpy, math

FRAMES      = 120          # 4 s @ 30 fps
ORBIT_DEG   = 270.0        # camera sweeps 270° around the scene
OUT_PATH    = "//../../../../../../videos/scripting/python-numpy-haar-dwt-poi-curvature-ribbon/viewport.mp4"
RESOLUTION  = (1920, 1080)

scene  = bpy.context.scene
cam    = scene.camera
if cam is None:
    raise RuntimeError("No camera in scene — run blueprint.py first.")

# Animation: orbit camera around world Z-axis while looking inward
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = 30

# Place an Empty at scene centre that the camera tracks
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.4))
target = bpy.context.active_object
target.name = "cam_target"

# Track-To constraint on camera
ct = cam.constraints.new(type='TRACK_TO')
ct.target     = target
ct.track_axis = 'TRACK_NEGATIVE_Z'
ct.up_axis    = 'UP_Y'

# Keyframe camera orbit: start angle and end angle
START_ANG = math.radians(-90.0)
END_ANG   = START_ANG + math.radians(ORBIT_DEG)
CAM_DIST  = 6.5
CAM_Z     = 0.6

def _cam_pos(angle):
    return (CAM_DIST * math.cos(angle),
            CAM_DIST * math.sin(angle),
            CAM_Z)

cam.location = _cam_pos(START_ANG)
cam.keyframe_insert("location", frame=1)

cam.location = _cam_pos(END_ANG)
cam.keyframe_insert("location", frame=FRAMES)

# Linear interpolation on both keyframes
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# Render settings
scene.render.resolution_x      = RESOLUTION[0]
scene.render.resolution_y      = RESOLUTION[1]
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format      = 'MPEG4'
scene.render.ffmpeg.codec       = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath           = OUT_PATH

bpy.ops.render.opengl(animation=True, write_still=False)
print("viewport.mp4 rendered to", OUT_PATH)
