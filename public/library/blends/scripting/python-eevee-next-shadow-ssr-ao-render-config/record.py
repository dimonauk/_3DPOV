# record.py — Viewport render animation: EEVEE Next calibration grid
# Run AFTER blueprint.py in the same Blender session.
# Orbits the camera 180° around the six-sphere grid so SSR reflections
# visibly slide across the floor plane.  GTAO contact shadow is clearest
# on the chalk sphere at the far right — watch the ground crease deepen.
# Output: public/library/videos/scripting/
#         python-eevee-next-shadow-ssr-ao-render-config/viewport.mp4

import bpy
import math

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 60   # 2.5 s at 24 fps
scene.render.fps  = 24

cam = bpy.data.objects.get("EEVEECalibCam")
if not cam:
    raise RuntimeError("Run blueprint.py first — EEVEECalibCam not found.")

# Orbit from -90° to +90° around Z, keeping the camera at a fixed radius and tilt
CAM_RADIUS = 11.0
CAM_HEIGHT = 2.5
CAM_TILT   = math.radians(80)

cam.animation_data_create()
action = bpy.data.actions.new("eevee_calib_orbit")
cam.animation_data.action = action

ORBIT_FRAMES = [
    (1,  -math.pi / 2),
    (60,  math.pi / 2),
]
for frame, angle in ORBIT_FRAMES:
    cam.location = (
        math.sin(angle) * CAM_RADIUS,
        -math.cos(angle) * CAM_RADIUS,
        CAM_HEIGHT,
    )
    cam.rotation_euler = (CAM_TILT, 0, angle + math.pi)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# Rendered shading with viewport compositor so SSR floor reflections are live
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        space = area.spaces.active
        space.shading.type              = "RENDERED"
        space.shading.use_scene_lights  = True
        break

scene.render.filepath = (
    "//../../videos/scripting/"
    "python-eevee-next-shadow-ssr-ao-render-config/viewport"
)
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.ffmpeg.audio_codec          = "NONE"
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.resolution_percentage       = 100

bpy.ops.render.opengl(animation=True, write_still=False)
print("viewport.mp4 written.")
