"""
record.py — viewport render for Mackey-Glass DDE tutorial
==========================================================
Run AFTER blueprint.py.  Outputs viewport.mp4 to the videos directory.

Usage:  blender --python record.py --background
"""

import math
import bpy

FPS        = 24
N_FRAMES   = 240   # 10 s
OUTPUT     = "//../../videos/scripting/python-numpy-mackey-glass-dde-delay-differential-infinite-dimensional-chaos-takens-embedding-bishop-tube-poi-webxr/viewport"
CAM_R      = 2.8
CAM_ELEV   = 0.8

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.fps    = FPS
scene.frame_start   = 1
scene.frame_end     = N_FRAMES
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath       = OUTPUT
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.eevee.use_bloom        = True
scene.eevee.bloom_threshold  = 0.5
scene.eevee.bloom_intensity  = 0.4

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value  = (0.01, 0.01, 0.02, 1.0)
bg.inputs["Strength"].default_value = 0.3

cam_data = bpy.data.cameras.new("RC"); cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RC", cam_data)
scene.collection.objects.link(cam_obj); scene.camera = cam_obj
empty = bpy.data.objects.new("CT", None)
scene.collection.objects.link(empty)
trk = cam_obj.constraints.new('TRACK_TO')
trk.target = empty; trk.track_axis = 'TRACK_NEGATIVE_Z'; trk.up_axis = 'UP_Y'

for f in range(1, N_FRAMES + 1):
    a = 2 * math.pi * (f - 1) / N_FRAMES
    cam_obj.location = (CAM_R * math.sin(a), -CAM_R * math.cos(a), CAM_ELEV)
    cam_obj.keyframe_insert("location", frame=f)

sun = bpy.data.lights.new("S", 'SUN'); sun.energy = 2.0
so  = bpy.data.objects.new("S", sun); scene.collection.objects.link(so)
so.rotation_euler = (math.radians(45), 0, math.radians(30))

obj = bpy.data.objects.get("MackeyGlass_Poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    peaks = [(1,"Basis"),(60,"SK_Med"),(120,"SK_Limit"),(180,"SK_Strong"),(240,"Basis")]
    for f, name in peaks:
        for b in kb:
            b.value = 0.0; b.keyframe_insert("value", frame=f)
        if name in [b.name for b in kb]:
            kb[name].value = 1.0; kb[name].keyframe_insert("value", frame=f)

bpy.ops.render.render(animation=True)
