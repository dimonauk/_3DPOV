"""
Viewport Animation Recorder — Hyperchaotic Rössler 4D
======================================================
Run this script AFTER blueprint.py has built the scene.
It animates the shape-key values and triggers an OpenGL viewport render,
outputting frames to:
    public/library/videos/scripting/
    python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr/
    viewport.mp4

Duration: ~10 seconds at 24 fps = 240 frames.
Sequence:
  Frame   1–48   Basis (canonical hyperchaos a=0.25 d=0.05)
  Frame  49–96   Crossfade → SK_LoD  (d=0.01, near-periodic)
  Frame  97–144  Hold SK_LoD
  Frame 145–192  Crossfade → SK_HiD  (d=0.10, stronger 4th-dim coupling)
  Frame 193–240  Crossfade back → Basis (full hyperchaos)
"""

import bpy
import os

OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr/"
)
FPS        = 24
TOTAL_FRM  = 240
OBJ_NAME   = "HC_Rossler_Poi"


def set_keyframe(obj, sk_name: str, val: float, frame: int):
    sk = obj.data.shape_keys.key_blocks[sk_name]
    sk.value = val
    sk.keyframe_insert(data_path="value", frame=frame)


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRM
    scene.render.fps  = FPS

    # Render settings for OpenGL viewport render
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath                   = OUTPUT_DIR
    scene.render.resolution_x              = 1280
    scene.render.resolution_y              = 720
    scene.render.resolution_percentage     = 100

    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first")

    # Ensure shape key values start at zero
    for sk in obj.data.shape_keys.key_blocks:
        if sk.name != "Basis":
            sk.value = 0.0

    # -- Keyframe schedule --
    # Frame 1: Basis dominant
    set_keyframe(obj, "SK_LoD", 0.0, 1)
    set_keyframe(obj, "SK_HiD", 0.0, 1)

    # Frame 49–96: crossfade to SK_LoD
    set_keyframe(obj, "SK_LoD", 0.0, 48)
    set_keyframe(obj, "SK_LoD", 1.0, 96)

    # Frame 97–144: hold SK_LoD
    set_keyframe(obj, "SK_LoD", 1.0, 144)

    # Frame 145–192: crossfade SK_LoD → SK_HiD
    set_keyframe(obj, "SK_LoD", 0.0, 192)
    set_keyframe(obj, "SK_HiD", 0.0, 144)
    set_keyframe(obj, "SK_HiD", 1.0, 192)

    # Frame 193–240: crossfade back to Basis
    set_keyframe(obj, "SK_HiD", 0.0, 240)

    # Smooth interpolation
    if obj.data.shape_keys.animation_data:
        for fc in obj.data.shape_keys.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "SINUSOIDAL"

    print(f"✓ Animation keyframes set: {TOTAL_FRM} frames at {FPS} fps")


def render_viewport():
    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
    bpy.ops.render.opengl(animation=True, sequencer=False)
    print("✓ Viewport render complete →", OUTPUT_DIR)


if __name__ == "__main__":
    setup_animation()
    render_viewport()
