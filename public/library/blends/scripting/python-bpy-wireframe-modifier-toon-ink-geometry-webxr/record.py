"""
record.py — Viewport animation for WireframeModifier toon ink tutorial.
Runs after blueprint.py.  Camera orbits the fill+wire icosphere 360°.
Output: public/library/videos/scripting/python-bpy-wireframe-modifier-toon-ink-geometry-webxr/viewport.mp4
"""

import bpy
import math
import os

FRAMES      = 60    # 2 s at 30 fps — enough to read the ink line technique
ORBIT_R     = 2.2
ORBIT_Z     = 0.5
ANIM_SLUG   = "python-bpy-wireframe-modifier-toon-ink-geometry-webxr"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = 30

# ─── Camera ────────────────────────────────────────────────────────────────
if "RecordCam" in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects["RecordCam"], do_unlink=True)

bpy.ops.object.camera_add()
cam = bpy.context.active_object
cam.name = "RecordCam"
scene.camera = cam
cam.data.lens = 50

# Track-To constraint keeps icosphere centred
fill_obj = bpy.data.objects.get("hf_fill") or next(
    (o for o in bpy.data.objects if "fill" in o.name.lower()), None
)
if fill_obj:
    ct = cam.constraints.new('TRACK_TO')
    ct.target     = fill_obj
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

# Keyframe orbit
cam.animation_data_create()
for f in range(1, FRAMES + 1):
    t = (f - 1) / (FRAMES - 1)
    angle = 2 * math.pi * t
    cam.location = (
        ORBIT_R * math.sin(angle),
        -ORBIT_R * math.cos(angle),
        ORBIT_Z,
    )
    cam.keyframe_insert("location", frame=f)

# LINEAR interpolation — no ease
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── Render settings ─────────────────────────────────────────────────────
scene.render.engine           = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x     = 1280
scene.render.resolution_y     = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format    = 'MPEG4'
scene.render.ffmpeg.codec     = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Output path
root = os.path.dirname(os.path.abspath(__file__))
out  = os.path.join(
    root, "..", "..", "..", "..", "videos", "scripting", ANIM_SLUG, "viewport.mp4"
)
scene.render.filepath = os.path.normpath(out)
os.makedirs(os.path.dirname(scene.render.filepath), exist_ok=True)

bpy.ops.render.render(animation=True)
print(f"[record] → {scene.render.filepath}")
