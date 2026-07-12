"""
record.py — Viewport morph animation for screen recording.
Sequences VRM expression shape keys one-by-one with ramp-in / hold / ramp-out.
Run after blueprint.py has created vrm_morph_proxy.blend:
  blender vrm_morph_proxy.blend --background --python record.py
"""
import bpy, math

SLUG         = "python-bpy-shape-key-data-block-morph-target-vrm-webxr"
VIDEO_DIR    = "public/library/videos/scripting/" + SLUG + "/"
VIDEO_PATH   = "//" + "../../" * 4 + VIDEO_DIR + "viewport.mp4"
FPS          = 24
RAMP         = 6     # frames to ramp from 0 → 1
HOLD         = 14    # frames at full weight
GAP          = 4     # silent frames between expressions

EXPRESSIONS  = ["happy", "angry", "sad", "surprised", "blink", "aa"]

sc  = bpy.context.scene
ob  = bpy.data.objects[next(n for n in bpy.data.objects.keys() if "proxy" in n)]
key = ob.data.shape_keys

# Zero all weights and clear existing keyframes
for kb in key.key_blocks:
    kb.value = 0.0
    kb.animation_data_clear()

# Sequence: ramp-in → hold → ramp-out → gap
frame = 1
for name in EXPRESSIONS:
    kb = key.key_blocks.get(name)
    if kb is None:
        continue
    kb.value = 0.0;  kb.keyframe_insert('value', frame=frame)
    frame += RAMP
    kb.value = 1.0;  kb.keyframe_insert('value', frame=frame)
    frame += HOLD
    kb.keyframe_insert('value', frame=frame)
    frame += RAMP
    kb.value = 0.0;  kb.keyframe_insert('value', frame=frame)
    frame += GAP

# Smooth all fcurve interpolation
if key.animation_data and key.animation_data.action:
    for fc in key.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

sc.frame_start = 1
sc.frame_end   = frame + RAMP

# Camera — front-view portrait
cam_d        = bpy.data.cameras.new("rec_cam")
cam_ob       = bpy.data.objects.new("rec_cam", cam_d)
sc.collection.objects.link(cam_ob)
cam_ob.location       = (0.0, -3.8, 0.15)
cam_ob.rotation_euler = (math.radians(87), 0.0, 0.0)
cam_d.lens            = 85.0
sc.camera             = cam_ob

# Key + fill light
def add_light(name, type_, loc, energy, colour=(1.0, 1.0, 1.0)):
    ld  = bpy.data.lights.new(name, type_)
    lo  = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = loc
    ld.energy   = energy
    ld.color    = colour
    return lo

add_light("key_light",  'AREA', (-1.5, -2.0,  2.0), 120.0, (1.00, 0.97, 0.92))
add_light("fill_light", 'AREA', ( 1.5, -1.5,  1.0),  50.0, (0.80, 0.88, 1.00))
add_light("rim_light",  'SPOT', ( 0.0,  2.5,  2.5),  80.0, (1.00, 0.95, 0.85))

# Neutral world
world           = bpy.data.worlds.new("rec_world")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
sc.world        = world

# EEVEE Next render settings
sc.render.engine                        = 'BLENDER_EEVEE_NEXT'
sc.render.image_settings.file_format    = 'FFMPEG'
sc.render.ffmpeg.format                 = 'MPEG4'
sc.render.ffmpeg.codec                  = 'H264'
sc.render.ffmpeg.constant_rate_factor   = 'HIGH'
sc.render.fps                           = FPS
sc.render.resolution_x                  = 1280
sc.render.resolution_y                  = 720
sc.render.filepath                      = bpy.path.abspath(VIDEO_PATH)

import os
os.makedirs(bpy.path.abspath("//" + "../../" * 4 + VIDEO_DIR), exist_ok=True)

bpy.ops.render.render(animation=True)
print(f"[{SLUG}] viewport animation → {VIDEO_PATH}")
