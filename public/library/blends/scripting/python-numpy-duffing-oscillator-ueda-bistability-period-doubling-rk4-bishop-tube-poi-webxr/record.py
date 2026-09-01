"""
record.py — Duffing Oscillator viewport animation render.
Run from Blender's Scripting editor AFTER blueprint.py has built hf_duffing_poi.

Output: public/library/videos/scripting/
  python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr/
  viewport.mp4

Duration: 12 s at 30 fps = 360 frames.
Shape-key cycle (90 frames each):
  1–90   Basis     Holmes cross-well chaos (cobalt–amber cross-well attractor)
  91–180 SK_Ueda   Ueda single-well chaos (large amplitude, wild twisting)
  181–270 SK_Period2 Period-2 orbit (clean two-lobed figure)
  271–360 SK_Locked  Period-1 lock (near-elliptical sinusoidal oscillation)
Camera orbits 360° around Y over the full 360 frames.
"""

import bpy
import math

FPS        = 30
DURATION_S = 12
FRAMES     = FPS * DURATION_S  # 360

OUTPUT = ("//../../../../videos/scripting/"
          "python-numpy-duffing-oscillator-ueda-bistability-"
          "period-doubling-rk4-bishop-tube-poi-webxr/viewport")

SK_NAMES = ["Basis", "SK_Ueda", "SK_Period2", "SK_Locked"]
SEG      = FRAMES // len(SK_NAMES)  # 90 frames per segment


def _setup_scene():
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = FRAMES
    scn.render.fps  = FPS

    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format              = 'MPEG4'
    scn.render.ffmpeg.codec               = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'HIGH'
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.filepath      = OUTPUT

    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 0.5
    scn.world = world


def _setup_camera():
    cam_d = bpy.data.cameras.new("RecordCam")
    cam_d.lens = 85.0
    cam_o = bpy.data.objects.new("RecordCam", cam_d)
    bpy.context.collection.objects.link(cam_o)
    bpy.context.scene.camera = cam_o
    cam_o.location       = (0.0, -0.30, 0.0)
    cam_o.rotation_euler = (math.radians(90), 0.0, 0.0)


def _animate():
    obj = bpy.data.objects.get("hf_duffing_poi")
    if obj is None or obj.data.shape_keys is None:
        raise RuntimeError("hf_duffing_poi not found — run blueprint.py first.")
    kb = obj.data.shape_keys.key_blocks

    # zero all shape keys at frame 1
    for nm in SK_NAMES:
        kb[nm].value = 0.0
        kb[nm].keyframe_insert("value", frame=1)

    # one segment per SK: ramp up, hold, ramp down
    for idx, nm in enumerate(SK_NAMES):
        f0   = idx * SEG + 1
        fpk  = f0 + SEG // 3
        fdn  = f0 + SEG - 5
        fend = f0 + SEG

        kb[nm].value = 0.0; kb[nm].keyframe_insert("value", frame=f0)
        kb[nm].value = 1.0; kb[nm].keyframe_insert("value", frame=fpk)
        kb[nm].value = 1.0; kb[nm].keyframe_insert("value", frame=fdn)
        kb[nm].value = 0.0; kb[nm].keyframe_insert("value", frame=fend)

    # 360° Y-axis turntable over full animation
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0.0, math.radians(360), 0.0)
    obj.keyframe_insert("rotation_euler", frame=FRAMES)
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


_setup_scene()
_setup_camera()
_animate()
bpy.ops.render.render(animation=True)
print(f"Duffing record.py: viewport.mp4 written to {OUTPUT}")
