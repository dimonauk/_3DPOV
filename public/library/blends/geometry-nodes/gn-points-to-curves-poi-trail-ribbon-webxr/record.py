"""
Viewport animation recorder — GN Points to Curves: Poi Trail Ribbons
Outputs: public/library/videos/geometry-nodes/
         gn-points-to-curves-poi-trail-ribbon-webxr/viewport.mp4

Run AFTER blueprint.py so the baked ribbon object exists in the scene.
Renders a 90-frame (3 s) turntable orbit around the five ribbon strands.
"""

import bpy
import math
import os

OUTPUT_DIR  = ("//../../../../videos/geometry-nodes/"
               "gn-points-to-curves-poi-trail-ribbon-webxr/")
FRAME_START = 1
FRAME_END   = 90
FPS         = 30
RES_X       = 1280
RES_Y       = 720

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = bpy.path.abspath(OUTPUT_DIR) + "viewport"

os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)

# Camera on a 4 m orbit, 1.5 m high, pointing at origin
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

RADIUS = 4.0
HEIGHT = 1.5
for f in range(FRAME_START, FRAME_END + 1):
    t     = (f - FRAME_START) / (FRAME_END - FRAME_START)
    angle = 2 * math.pi * t
    cam_obj.location.x = RADIUS * math.sin(angle)
    cam_obj.location.y = -RADIUS * math.cos(angle)
    cam_obj.location.z = HEIGHT
    from mathutils import Vector
    target = Vector((0, 0, 0.3))
    direction = cam_obj.location - target
    rot_quat = direction.to_track_quat('Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# Soft fill light from above
sun_data = bpy.data.lights.new("RecordSun", 'SUN')
sun_data.energy = 2.0
sun_obj = bpy.data.objects.new("RecordSun", sun_data)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(20))
scene.collection.objects.link(sun_obj)

# Workbench render — fast, no GPU required
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'MATCAP'
scene.display.shading.show_shadows = False

bpy.ops.render.opengl(animation=True)
print("[HF] Record done →", scene.render.filepath)
