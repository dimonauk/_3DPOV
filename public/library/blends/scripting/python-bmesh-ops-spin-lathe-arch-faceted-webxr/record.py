"""
record.py — viewport animation for python-bmesh-ops-spin-lathe-arch-faceted-webxr
Runs AFTER blueprint.py.  Sets up a camera orbit over 60 frames showing both props,
renders with bpy.ops.render.opengl(animation=True).
Output: public/library/videos/scripting/python-bmesh-ops-spin-lathe-arch-faceted-webxr/viewport.mp4
"""
import math, os
import bpy
from mathutils import Vector

scene = bpy.context.scene
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.fps            = 24
scene.frame_start           = 1
scene.frame_end             = 60

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("RecCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit 90° arc around the toroid prop (centred at origin)
ORBIT_R = 1.6
ORBIT_Z = 0.8
for f in (1, 60):
    frac  = (f - 1) / 59.0
    angle = math.radians(-15 + frac * 90)
    cam_obj.location    = Vector((
        ORBIT_R * math.cos(angle),
        ORBIT_R * math.sin(angle),
        ORBIT_Z,
    ))
    # Point at scene midpoint (between toroid and arch)
    target = Vector((0.55, 0.0, 0.1))
    cam_obj.rotation_mode = 'QUATERNION'
    direction = (target - cam_obj.location).normalized()
    cam_obj.rotation_quaternion = direction.to_track_quat('-Z', 'Y')
    cam_obj.keyframe_insert('location',            frame=f)
    cam_obj.keyframe_insert('rotation_quaternion', frame=f)

for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── LIGHTING ─────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("Sun", 'SUN')
sun_data.energy = 3.5
sun_obj  = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── OUTPUT ───────────────────────────────────────────────────────────────────
vid_dir = os.path.join(
    os.path.dirname(__file__),
    "../../../../../../public/library/videos/scripting"
    "/python-bmesh-ops-spin-lathe-arch-faceted-webxr/",
)
os.makedirs(vid_dir, exist_ok=True)
scene.render.filepath       = os.path.join(vid_dir, "viewport")
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

bpy.ops.render.opengl(animation=True, view_context=False)
print("✓  viewport.mp4 written to", vid_dir)
