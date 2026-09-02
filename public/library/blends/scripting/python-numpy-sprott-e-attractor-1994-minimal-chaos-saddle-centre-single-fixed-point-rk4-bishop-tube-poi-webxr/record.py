"""
record.py — Sprott E Attractor · Blender 5.1 viewport render
=============================================================
Run AFTER blueprint.py.  Outputs:
  public/library/videos/scripting/
    python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr/
      viewport.mp4

Timeline (10 s · 24 fps · 240 frames):
  Fr   0– 59  Orbit, Basis (α=4)  — canonical attractor, full 360° rotation
  Fr  60–119  Morph Basis → SK_Loose (α=3) — watch loops widen
  Fr 120–179  Morph SK_Loose → SK_Tight (α=5) — loops compress
  Fr 180–239  Orbit, SK_Wide (α=2.5) — near-onset geometry

To render headless:
  blender --background scene.blend --python record.py
"""

import bpy
import math
import os

OBJ_NAME = "SprottE_Poi"
FPS      = 24
N_FRAMES = 240
OUT_SLUG = (
    "python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre"
    "-single-fixed-point-rk4-bishop-tube-poi-webxr"
)
OUT_DIR  = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/scripting",
    OUT_SLUG,
)


def ensure_camera():
    if "RecCam" not in bpy.data.objects:
        cd  = bpy.data.cameras.new("RecCam")
        cd.lens = 90.0
        co  = bpy.data.objects.new("RecCam", cd)
        bpy.context.scene.collection.objects.link(co)
    cam = bpy.data.objects["RecCam"]
    bpy.context.scene.camera = cam
    return cam


def ensure_light():
    if "RecLight" not in bpy.data.objects:
        ld = bpy.data.lights.new("RecLight", type="AREA")
        ld.energy = 130.0
        lo = bpy.data.objects.new("RecLight", ld)
        bpy.context.scene.collection.objects.link(lo)
        lo.location = (0.28, -0.20, 0.22)
    return bpy.data.objects["RecLight"]


def configure_render():
    sc = bpy.context.scene
    sc.render.engine               = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x         = 1920
    sc.render.resolution_y         = 1080
    sc.render.fps                  = FPS
    sc.frame_start                 = 0
    sc.frame_end                   = N_FRAMES - 1
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format        = "MPEG4"
    sc.render.ffmpeg.codec         = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    os.makedirs(OUT_DIR, exist_ok=True)
    sc.render.filepath             = os.path.join(OUT_DIR, "viewport.mp4")
    if hasattr(sc.eevee, "bloom_threshold"):
        sc.eevee.bloom_threshold   = 0.28
        sc.eevee.bloom_intensity   = 0.20
        sc.eevee.use_bloom         = True


def keyframe_shape_keys(obj, sk_from, sk_to, fr_start, fr_end):
    """Animate shape key influence: sk_from 1→0, sk_to 0→1."""
    kb = obj.data.shape_keys.key_blocks
    kb[sk_from].value = 1.0;  kb[sk_from].keyframe_insert("value", frame=fr_start)
    kb[sk_from].value = 0.0;  kb[sk_from].keyframe_insert("value", frame=fr_end)
    kb[sk_to].value   = 0.0;  kb[sk_to].keyframe_insert("value", frame=fr_start)
    kb[sk_to].value   = 1.0;  kb[sk_to].keyframe_insert("value", frame=fr_end)


def animate_camera(cam):
    """Smooth 360° orbit at constant elevation."""
    R, elev = 0.30, 0.08
    for fr in range(N_FRAMES):
        frac   = fr / N_FRAMES
        theta  = 2.0 * math.pi * frac
        cam.location = (R * math.cos(theta), R * math.sin(theta), elev)
        cam.rotation_euler = (
            math.pi / 2.0 - math.atan2(elev, R),
            0.0,
            theta + math.pi / 2.0,
        )
        cam.keyframe_insert("location",        frame=fr)
        cam.keyframe_insert("rotation_euler",  frame=fr)


def main():
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

    cam = ensure_camera()
    ensure_light()
    configure_render()
    animate_camera(cam)

    # Initialise all shape key values to 0
    kb = obj.data.shape_keys.key_blocks
    for k in kb:
        k.value = 0.0
    kb["Basis"].value = 1.0

    # Morph segments
    keyframe_shape_keys(obj, "Basis",    "SK_Loose", 60, 119)
    keyframe_shape_keys(obj, "SK_Loose", "SK_Tight", 120, 179)
    keyframe_shape_keys(obj, "SK_Tight", "SK_Wide",  180, 239)

    bpy.ops.render.render(animation=True)
    print(f"[SprottE] Viewport render → {OUT_DIR}/viewport.mp4")


if __name__ == "__main__":
    main()
