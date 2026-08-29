"""
record.py — Viewport animation render for Lorenz-96 Poi Head
Blender 5.1  |  Run AFTER blueprint.py has built the scene
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outputs: public/library/videos/scripting/
           python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr/
           viewport.mp4   (H.264, 1920×1080, 30 fps, 300 frames = 10 s)

Strategy:
  Frame 1-60   : shape key Basis (F=8, canonical chaos) — full attractor
  Frame 61-120 : cross-fade to SK_Hopf (F=5, near-Hopf loops)
  Frame 121-180: cross-fade to SK_Onset (F=5.76, bifurcation threshold)
  Frame 181-240: cross-fade to SK_Strong (F=16, dense turbulence)
  Frame 241-300: return to Basis + slow Y-axis tumble

The object rotates 360° over the full 300 frames so the viewer sees every
face of the strange attractor tube.
"""

import bpy, math

OUTDIR = "//../../videos/scripting/" \
         "python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr/"
FPS     = 30
FRAMES  = 300   # 10 s clip

scene = bpy.context.scene
scene.render.engine         = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps             = FPS
scene.frame_start            = 1
scene.frame_end              = FRAMES
scene.render.filepath        = OUTDIR + "viewport"
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format   = 'MPEG4'
scene.render.ffmpeg.codec    = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

obj = bpy.data.objects.get("Lorenz96_Poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create Lorenz96_Poi")

keys = obj.data.shape_keys.key_blocks
KEY_ORDER = ["Basis", "SK_Hopf", "SK_Onset", "SK_Strong"]

def zero_all_keys(frame: int) -> None:
    for k in KEY_ORDER:
        keys[k].value = 0.0
        keys[k].keyframe_insert("value", frame=frame)

def set_key(name: str, val: float, frame: int) -> None:
    keys[name].value = val
    keys[name].keyframe_insert("value", frame=frame)

# clear existing animation
if obj.data.shape_keys.animation_data:
    obj.data.shape_keys.animation_data_clear()
obj.animation_data_clear()

# shape-key timeline
zero_all_keys(1)
set_key("Basis",     1.0, 1)
set_key("Basis",     1.0, 60)

zero_all_keys(61)
set_key("SK_Hopf",   1.0, 61)
set_key("SK_Hopf",   1.0, 120)

zero_all_keys(121)
set_key("SK_Onset",  1.0, 121)
set_key("SK_Onset",  1.0, 180)

zero_all_keys(181)
set_key("SK_Strong", 1.0, 181)
set_key("SK_Strong", 1.0, 240)

zero_all_keys(241)
set_key("Basis",     1.0, 241)
set_key("Basis",     1.0, FRAMES)

# rotation — 360° around Y over full clip
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0, math.radians(360), 0)
obj.keyframe_insert("rotation_euler", frame=FRAMES)
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# camera
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 85
cam_obj = bpy.data.objects.new("RecCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -0.30, 0.0)
cam_obj.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam_obj

# world / ambient
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.5
scene.world = world

bpy.ops.render.render(animation=True, write_still=False)
print("[L96 record] Done →", OUTDIR)
