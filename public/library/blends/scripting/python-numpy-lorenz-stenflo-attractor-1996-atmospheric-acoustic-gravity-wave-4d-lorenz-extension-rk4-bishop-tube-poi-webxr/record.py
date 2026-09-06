"""
Viewport Animation Recorder — Lorenz-Stenflo 4D Attractor
==========================================================
Run this script AFTER blueprint.py has built the scene.
It animates the shape-key values and triggers an OpenGL viewport render,
outputting frames to:
    public/library/videos/scripting/
    python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr/
    viewport.mp4

Duration: 10 seconds at 24 fps = 240 frames.
Sequence:
  Frame   1– 60  Basis (canonical: s=1.5, r=26, σ=0.7)
  Frame  61–120  Crossfade → SK_WeakS (s=0.5, orbit contracts toward Lorenz)
  Frame 121–180  Crossfade → SK_StrongS (s=3.0, acoustic distortion deepens)
  Frame 181–240  Crossfade back → Basis (full Stenflo topology)
"""

import bpy
import os

OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-lorenz-stenflo-attractor-1996-atmospheric-acoustic-gravity-wave-4d-lorenz-extension-rk4-bishop-tube-poi-webxr/"
)
FPS        = 24
TOTAL_FRM  = 240
OBJ_NAME   = "LS_Stenflo_Poi"


def set_keyframe(obj, sk_name: str, val: float, frame: int):
    sk = obj.data.shape_keys.key_blocks[sk_name]
    sk.value = val
    sk.keyframe_insert(data_path="value", frame=frame)


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRM
    scene.render.fps  = FPS

    scene.render.image_settings.file_format       = "FFMPEG"
    scene.render.ffmpeg.format                    = "MPEG4"
    scene.render.ffmpeg.codec                     = "H264"
    scene.render.ffmpeg.constant_rate_factor      = "MEDIUM"
    scene.render.filepath                         = OUTPUT_DIR
    scene.render.resolution_x                    = 1280
    scene.render.resolution_y                    = 720
    scene.render.resolution_percentage           = 100

    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first")

    for sk in obj.data.shape_keys.key_blocks:
        if sk.name != "Basis":
            sk.value = 0.0
            sk.keyframe_insert(data_path="value", frame=1)

    # ── Basis hold (1–60) ────────────────────────────────────────────────────
    set_keyframe(obj, "SK_WeakS",   0.0,  1)
    set_keyframe(obj, "SK_StrongS", 0.0,  1)

    # ── Crossfade to SK_WeakS (61–120) ───────────────────────────────────────
    set_keyframe(obj, "SK_WeakS",   0.0,  60)
    set_keyframe(obj, "SK_WeakS",   1.0, 120)
    set_keyframe(obj, "SK_StrongS", 0.0,  60)
    set_keyframe(obj, "SK_StrongS", 0.0, 120)

    # ── Crossfade to SK_StrongS (121–180) ────────────────────────────────────
    set_keyframe(obj, "SK_WeakS",   1.0, 120)
    set_keyframe(obj, "SK_WeakS",   0.0, 180)
    set_keyframe(obj, "SK_StrongS", 0.0, 120)
    set_keyframe(obj, "SK_StrongS", 1.0, 180)

    # ── Crossfade back to Basis (181–240) ────────────────────────────────────
    set_keyframe(obj, "SK_WeakS",   0.0, 240)
    set_keyframe(obj, "SK_StrongS", 0.0, 240)

    # Smooth interpolation on all fcurves
    if obj.data.shape_keys.animation_data:
        for fc in obj.data.shape_keys.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO"
                kp.handle_right_type = "AUTO"

    print("[Stenflo record] Animation keyframes set.")


def render():
    os.makedirs(
        bpy.path.abspath(OUTPUT_DIR), exist_ok=True
    )
    # Orbit camera slowly around the attractor
    cam_data = bpy.data.cameras.new("StenfloCamera")
    cam_obj  = bpy.data.objects.new("StenfloCamera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    cam_obj.location  = (35.0, -20.0, 12.0)
    cam_obj.rotation_euler = (1.22, 0.0, 1.05)  # ~70° tilt, ~60° yaw

    # Slow orbit: 360° / 240 frames
    import math
    for f in range(1, TOTAL_FRM + 1):
        angle = math.radians(f * 360.0 / TOTAL_FRM)
        cam_obj.location.x = 35.0 * math.cos(angle)
        cam_obj.location.y = 35.0 * math.sin(angle)
        cam_obj.keyframe_insert(data_path="location", frame=f)

    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"[Stenflo record] Frames written to {OUTPUT_DIR}")


def main():
    setup_animation()
    render()


main()
