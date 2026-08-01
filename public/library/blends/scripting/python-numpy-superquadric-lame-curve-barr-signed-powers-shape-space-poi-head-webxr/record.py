"""
record.py — viewport animation for the superquadric poi head tutorial.

Run AFTER blueprint.py has built the object "HF_SuperQ_Poi".
Keyframes the shape key values to animate through the shape-space:
  F1–60:   sphere → cube
  F61–120: cube → star
  F121–180: star → pillow
  F181–240: pillow → sphere (cycle)

Renders a 240-frame OpenGL viewport animation to
  public/library/videos/scripting/python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr/viewport.mp4
"""

import math
import bpy

OUTPUT_PATH = (
    "//../../../../videos/scripting/"
    "python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr/"
    "viewport.mp4"
)
FRAME_END   = 240
FPS         = 30

# sequence of (frame_start, key_from, val_from, key_to, val_to)
SEGMENTS = [
    (1,   "cube",   0.0, "cube",   1.0),   # sphere → cube  (F1-60)
    (60,  "cube",   1.0, "star",   0.0),   # cross-fade
    (61,  "star",   0.0, "star",   1.0),   # cube → star    (F61-120)
    (120, "star",   1.0, "pillow", 0.0),
    (121, "pillow", 0.0, "pillow", 1.0),   # star → pillow  (F121-180)
    (180, "pillow", 1.0),                  # hold pillow
    (240, "pillow", 0.0),                  # pillow → sphere (fade out)
]

OBJ_NAME = "HF_SuperQ_Poi"


def _setup_render():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUTPUT_PATH
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720


def _set_key(obj, frame, key_name, val):
    sk = obj.data.shape_keys.key_blocks.get(key_name)
    if sk is None:
        return
    bpy.context.scene.frame_set(frame)
    sk.value = val
    sk.keyframe_insert(data_path="value", frame=frame)


def _clear_all_keys(obj, key_names, frame):
    for kn in key_names:
        sk = obj.data.shape_keys.key_blocks.get(kn)
        if sk:
            sk.value = 0.0
            sk.keyframe_insert(data_path="value", frame=frame)


def main():
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

    _setup_render()
    key_names = ["cube", "star", "pillow", "cylinder", "discus"]

    # zero all keys at frame 1
    _clear_all_keys(obj, key_names, frame=1)

    # sphere → cube: F1-60
    _set_key(obj, 1,  "cube", 0.0)
    _set_key(obj, 60, "cube", 1.0)

    # cube → star: F61-120
    _set_key(obj, 60,  "cube", 1.0)
    _set_key(obj, 90,  "cube", 0.0)
    _set_key(obj, 61,  "star", 0.0)
    _set_key(obj, 120, "star", 1.0)

    # star → pillow: F121-180
    _set_key(obj, 120, "star",   1.0)
    _set_key(obj, 150, "star",   0.0)
    _set_key(obj, 121, "pillow", 0.0)
    _set_key(obj, 180, "pillow", 1.0)

    # pillow → sphere: F181-240
    _set_key(obj, 180, "pillow", 1.0)
    _set_key(obj, 240, "pillow", 0.0)

    # slow orbit: rotate object 360° over full animation
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path="rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.radians(360))
    obj.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)
    # linear interpolation so rotation doesn't ease
    for fc in obj.animation_data.action.fcurves:
        if "rotation" in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

    # render OpenGL viewport animation
    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"[record] viewport render → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
