"""
record.py — Viewport animation for Geometry to Instance prop scatter
Blender 5.1 | CC0 | Holoflow Studio

90-frame orbit showing the scatter field with 4 boulder variants.
Run AFTER blueprint.py.

Output: public/library/videos/geometry-nodes/gn-geometry-to-instance-multi-variant-prop-scatter/viewport.mp4
"""

import bpy
import math
from mathutils import Vector, Euler

OUT_PATH  = "//../../videos/geometry-nodes/gn-geometry-to-instance-multi-variant-prop-scatter/viewport"
FRAME_END = 90
FPS       = 30

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = OUT_PATH
scene.render.engine   = 'BLENDER_EEVEE_NEXT'

# Camera
for obj in list(bpy.data.objects):
    if obj.type == 'CAMERA':
        bpy.data.objects.remove(obj, do_unlink=True)

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 28
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj


def cam_at(frame, angle_deg, radius=13.0, height=8.0):
    rad = math.radians(angle_deg)
    cam_obj.location = Vector((math.cos(rad) * radius, math.sin(rad) * radius, height))
    cam_obj.rotation_euler = (-cam_obj.location.normalized()).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)


cam_at(1,  0)
cam_at(30, 45,  radius=11, height=6)
cam_at(60, 100, radius=13, height=9)
cam_at(90, 150)

# Lighting
for obj in list(bpy.data.objects):
    if obj.type == 'LIGHT':
        bpy.data.objects.remove(obj, do_unlink=True)

sun = bpy.data.lights.new("Sun", 'SUN')
sun.energy = 4.0
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = Euler((math.radians(60), 0.0, math.radians(40)), 'XYZ')

world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs['Color'].default_value   = (0.15, 0.20, 0.38, 1.0)
    bg.inputs['Strength'].default_value = 0.35

bpy.ops.render.render(animation=True)
print(f"[record] rendered {FRAME_END} frames → {OUT_PATH}")
