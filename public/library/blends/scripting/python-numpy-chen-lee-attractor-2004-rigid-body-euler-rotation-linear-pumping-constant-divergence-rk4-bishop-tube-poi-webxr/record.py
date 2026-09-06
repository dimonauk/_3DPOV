"""
Viewport Animation Recorder — Chen-Lee Attractor 2004
======================================================
Run this script AFTER blueprint.py has built the scene.
Animates shape-key values and triggers an OpenGL viewport render, outputting
frames to:
    public/library/videos/scripting/
    python-numpy-chen-lee-attractor-2004-rigid-body-euler-rotation-linear-pumping-constant-divergence-rk4-bishop-tube-poi-webxr/
    viewport.mp4

Duration: 10 seconds at 24 fps = 240 frames.

Sequence
--------
  Frame   1– 60   Basis (canonical chaos, a=5 b=-10 c=-0.38)
  Frame  61–120   Crossfade → SK_LowA (weaker x-pump, orbit tightens)
  Frame 121–180   Crossfade → SK_HighC (weaker z-damp, orbit elongates in z)
  Frame 181–240   Crossfade back → Basis (full canonical topology)
"""

import bpy
import os

OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-chen-lee-attractor-2004-rigid-body-euler-rotation-linear-pumping-constant-divergence-rk4-bishop-tube-poi-webxr/"
)
FPS        = 24
TOTAL_FRM  = 240
OBJ_NAME   = "CL_Poi"


def kf(obj, sk_name: str, val: float, frame: int):
    """Insert a shape-key keyframe at the given frame."""
    sk = obj.data.shape_keys.key_blocks[sk_name]
    sk.value = val
    sk.keyframe_insert(data_path="value", frame=frame)


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRM
    scene.render.fps  = FPS

    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath                    = OUTPUT_DIR
    scene.render.resolution_x               = 1280
    scene.render.resolution_y               = 720
    scene.render.resolution_percentage      = 100

    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"'{OBJ_NAME}' not found — run blueprint.py first")

    SK_NAMES = ["SK_LowA", "SK_HighC", "SK_WeakB"]

    # ── Zero all SK at frame 1 ────────────────────────────────────────────────
    for name in SK_NAMES:
        kf(obj, name, 0.0, 1)

    # ── Basis hold  (frames 1–60) ─────────────────────────────────────────────
    for name in SK_NAMES:
        kf(obj, name, 0.0, 60)

    # ── Crossfade → SK_LowA  (frames 61–120) ─────────────────────────────────
    kf(obj, "SK_LowA",  0.0,  60)
    kf(obj, "SK_LowA",  1.0, 120)
    kf(obj, "SK_HighC", 0.0,  60)
    kf(obj, "SK_HighC", 0.0, 120)
    kf(obj, "SK_WeakB", 0.0,  60)
    kf(obj, "SK_WeakB", 0.0, 120)

    # ── Crossfade → SK_HighC  (frames 121–180) ───────────────────────────────
    kf(obj, "SK_LowA",  1.0, 120)
    kf(obj, "SK_LowA",  0.0, 180)
    kf(obj, "SK_HighC", 0.0, 120)
    kf(obj, "SK_HighC", 1.0, 180)
    kf(obj, "SK_WeakB", 0.0, 120)
    kf(obj, "SK_WeakB", 0.0, 180)

    # ── Crossfade back → Basis  (frames 181–240) ─────────────────────────────
    kf(obj, "SK_LowA",  0.0, 240)
    kf(obj, "SK_HighC", 0.0, 240)
    kf(obj, "SK_WeakB", 0.0, 240)

    print("Animation keyframes set.")


def render():
    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)
    bpy.ops.render.opengl(animation=True, write_still=False)
    print("Viewport render complete → viewport.mp4")


setup_animation()
render()
