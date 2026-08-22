"""
record.py — Viewport animation for the Ince–Strutt stage floor.

Run this in the same Blender session immediately after blueprint.py.
It authors a 150-frame turntable that shows:
  0–49   Bird's-eye view rotating 180°, reading the diagram as a map.
  50–99  Camera descends to floor level, revealing the 3-D ridge landscape.
  100–149 SK_Exaggerated morphs in (ridges 2.5× taller) then back out.

Output: public/library/videos/<topic>/<slug>/viewport.mp4
"""

import bpy
import math

# ── CAMERA & SCENE SETUP ──────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine          = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.fps             = 30
scene.frame_start            = 1
scene.frame_end              = 150
scene.render.filepath        = "//../../videos/scripting/python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr/viewport.mp4"
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Sun lamp
bpy.ops.object.light_add(type='SUN', location=(3, 2, 8))
sun = bpy.context.active_object
sun.data.energy  = 4.0
sun.data.angle   = math.radians(5)

# Fill light
bpy.ops.object.light_add(type='AREA', location=(-2, -3, 5))
fill = bpy.context.active_object
fill.data.energy = 1.5

# Camera parent empty (rig origin at floor centre)
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(2.5, 2.0, 0.0))
rig = bpy.context.active_object
rig.name = "CamRig"

# Camera
bpy.ops.object.camera_add(location=(0, -8, 6))
cam = bpy.context.active_object
cam.name = "RecCam"
cam.data.lens = 35.0
cam.parent    = rig

# ── KEYFRAME HELPERS ─────────────────────────────────────────────────────────

def kf(obj, attr, frame, value):
    setattr(obj, attr, value)
    obj.keyframe_insert(attr, frame=frame)

def kf_d(obj, attr, frame, value):
    """Keyframe on object.data."""
    setattr(obj.data, attr, value)
    obj.data.keyframe_insert(attr, frame=frame)

# ── PHASE 1 (frames 1–49): Bird's-eye 180° pan ────────────────────────────────
# Camera high above, looking straight down, rig rotates slowly.
kf(rig, "rotation_euler", 1,   (0.0, 0.0, 0.0))
kf(rig, "rotation_euler", 50,  (0.0, 0.0, math.radians(180)))

cam.location = (0.0, -10.0, 9.0)
cam.rotation_euler = (math.radians(55), 0.0, 0.0)
cam.keyframe_insert("location", frame=1)
cam.keyframe_insert("rotation_euler", frame=1)
cam.keyframe_insert("location", frame=50)
cam.keyframe_insert("rotation_euler", frame=50)

# ── PHASE 2 (frames 50–99): Descend to ridge level ──────────────────────────
cam.location = (0.0, -7.5, 2.5)
cam.rotation_euler = (math.radians(72), 0.0, 0.0)
cam.keyframe_insert("location", frame=100)
cam.keyframe_insert("rotation_euler", frame=100)

kf(rig, "rotation_euler", 100, (0.0, 0.0, math.radians(200)))

# ── PHASE 3 (frames 100–150): SK_Exaggerated morph ──────────────────────────
floor_obj = bpy.data.objects.get("hf_ince_strutt_floor")
if floor_obj and floor_obj.data.shape_keys:
    keys = floor_obj.data.shape_keys.key_blocks
    sk_ex = keys.get("SK_Exaggerated")
    if sk_ex:
        # Start from 0, ramp to 1 at frame 125, back to 0 at frame 150
        sk_ex.value = 0.0
        sk_ex.keyframe_insert("value", frame=100)
        sk_ex.value = 1.0
        sk_ex.keyframe_insert("value", frame=125)
        sk_ex.value = 0.0
        sk_ex.keyframe_insert("value", frame=150)

# Smooth all fcurves
for action in bpy.data.actions:
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'

scene.camera = cam
print("record.py: keyframes authored — render via Render > Render Animation.")
