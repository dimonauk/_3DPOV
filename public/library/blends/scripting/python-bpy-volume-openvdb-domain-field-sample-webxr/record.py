"""
record.py — Viewport animation render
python-bpy-volume-openvdb-domain-field-sample-webxr
Blender 5.1  ·  Holoflow Studio  ·  CC0

Run AFTER blueprint.py.  Orbits a camera around both the density_field
Volume object and the density_cloud point-cloud mesh for 90 frames (3 s at
30 fps) in EEVEE Next rendered mode.

Output: public/library/videos/scripting/
        python-bpy-volume-openvdb-domain-field-sample-webxr/viewport.mp4
"""

import bpy
import math
from mathutils import Vector

OUT_DIR      = ("//../../../../public/library/videos/scripting/"
                "python-bpy-volume-openvdb-domain-field-sample-webxr/")
TOTAL_FRAMES = 90
FPS          = 30
ORBIT_RADIUS = 3.8
ORBIT_HEIGHT = 1.5


def setup_camera():
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_obj  = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_data.lens = 35.0
    return cam_obj


def setup_lighting():
    for obj in list(bpy.data.objects):
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
    sun_data            = bpy.data.lights.new("rec_sun", 'SUN')
    sun_data.energy     = 4.0
    sun_data.angle      = math.radians(5)
    sun_obj             = bpy.data.objects.new("rec_sun", sun_data)
    sun_obj.location    = (4, -4, 6)
    sun_obj.rotation_euler = (math.radians(40), 0, math.radians(40))
    bpy.context.scene.collection.objects.link(sun_obj)


def keyframe_orbit(cam_obj):
    for frame in range(1, TOTAL_FRAMES + 1):
        angle = (frame - 1) / TOTAL_FRAMES * math.tau
        x     = ORBIT_RADIUS * math.cos(angle)
        y     = ORBIT_RADIUS * math.sin(angle)
        cam_obj.location = Vector((x, y, ORBIT_HEIGHT))
        fwd = (-Vector((x, y, ORBIT_HEIGHT))).normalized()
        cam_obj.rotation_mode       = 'QUATERNION'
        cam_obj.rotation_quaternion = fwd.to_track_quat('-Z', 'Y')
        cam_obj.keyframe_insert("location",            frame=frame)
        cam_obj.keyframe_insert("rotation_quaternion", frame=frame)


def render():
    import os
    sc = bpy.context.scene
    sc.render.engine                       = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x                 = 1920
    sc.render.resolution_y                 = 1080
    sc.render.resolution_percentage        = 100
    sc.render.fps                          = FPS
    sc.frame_start                         = 1
    sc.frame_end                           = TOTAL_FRAMES
    sc.render.image_settings.file_format   = 'FFMPEG'
    sc.render.ffmpeg.format                = 'MPEG4'
    sc.render.ffmpeg.codec                 = 'H264'
    sc.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
    sc.render.filepath                     = OUT_DIR
    os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[holoflow] render complete → {OUT_DIR}viewport.mp4")


def main():
    cam = setup_camera()
    setup_lighting()
    keyframe_orbit(cam)
    render()

main()
