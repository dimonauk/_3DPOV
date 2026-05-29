"""
record.py — Viewport recording for curves-hair-grooming
Holoflow Studio | CC0

Expected output:
  public/library/videos/rigging/curves-hair-grooming/viewport.mp4

Run (from the directory containing hair_grooming_head.blend):
  blender --background hair_grooming_head.blend --python record.py

The camera completes a 270° orbit around the head, revealing the seeded
hair strands from every angle.  Rendered in EEVEE Next at 1920×1080 30 fps.
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/rigging/curves-hair-grooming/viewport.mp4"
TOTAL_FRAMES = 90   # 3 s at 30 fps
ORBIT_DEG    = 270  # degrees of arc the camera travels
CAM_RADIUS   = 0.55
CAM_HEIGHT   = 0.06
LOOK_AT_Z    = 0.04  # target slightly above centre of head

scene = bpy.context.scene
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.fps           = 30
scene.frame_start          = 1
scene.frame_end            = TOTAL_FRAMES
scene.render.engine        = 'BLENDER_EEVEE_NEXT'

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = OUTPUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85          # portrait focal length compresses the scene depth
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

import mathutils

for f in range(1, TOTAL_FRAMES + 1):
    t     = (f - 1) / (TOTAL_FRAMES - 1)
    angle = math.radians(ORBIT_DEG) * t

    cam_obj.location = (
        CAM_RADIUS * math.sin(angle),
        -CAM_RADIUS * math.cos(angle),
        CAM_HEIGHT + 0.05 * math.sin(t * math.pi),  # gentle arc up/down
    )
    # Point camera toward the head centre
    to_target = mathutils.Vector((
        -cam_obj.location[0],
        -cam_obj.location[1],
        LOOK_AT_Z - cam_obj.location[2],
    ))
    cam_obj.rotation_euler = (
        to_target.to_track_quat('-Z', 'Y').to_euler()
    )
    cam_obj.keyframe_insert(data_path='location',       frame=f)
    cam_obj.keyframe_insert(data_path='rotation_euler', frame=f)

# ── Key light ─────────────────────────────────────────────────────────────────
light_data          = bpy.data.lights.new("KeyLight", 'AREA')
light_data.energy   = 90
light_data.size     = 0.5
light_obj           = bpy.data.objects.new("KeyLight", light_data)
light_obj.location  = (0.40, -0.30, 0.55)
light_obj.rotation_euler = (
    math.radians(52), 0.0, math.radians(30))
bpy.context.scene.collection.objects.link(light_obj)

# Rim light from behind to separate hair from background
rim_data         = bpy.data.lights.new("RimLight", 'AREA')
rim_data.energy  = 40
rim_data.size    = 0.3
rim_obj          = bpy.data.objects.new("RimLight", rim_data)
rim_obj.location = (-0.35, 0.25, 0.30)
rim_obj.rotation_euler = (
    math.radians(30), 0.0, math.radians(-120))
bpy.context.scene.collection.objects.link(rim_obj)

bpy.ops.render.render(animation=True)
print("viewport.mp4 rendered")
