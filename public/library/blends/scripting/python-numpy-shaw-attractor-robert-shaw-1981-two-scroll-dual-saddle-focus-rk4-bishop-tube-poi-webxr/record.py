"""
record.py — Shaw Attractor  ·  Blender 5.1 viewport animation
==============================================================
Run AFTER blueprint.py has built the scene.  Outputs:
  public/library/videos/scripting/
    python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr/
      viewport.mp4

Sequence (10 s at 24 fps = 240 frames):
  0–59   fr  : full 360° orbit, Basis (a=10, b=4.272) — canonical 2-scroll
  60–119 fr  : morph Basis → SK_LoA  — attractor broadens as coupling drops
  120–179 fr : morph SK_LoA → SK_HiA — attractor tightens as coupling rises
  180–239 fr : orbit SK_HiB — larger basin from increased forcing

Headless:
  blender --background --python blueprint.py -- && blender file.blend --python record.py
"""

import bpy
import math
import os

# ── scene references ──────────────────────────────────────────────────────────
NAME    = "hf_shaw_poi"
FPS     = 24
N_FR    = 240
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/scripting",
    "python-numpy-shaw-attractor-robert-shaw-1981-two-scroll-dual-saddle-focus-rk4-bishop-tube-poi-webxr"
)

# ── camera ────────────────────────────────────────────────────────────────────
CAM_RADIUS = 0.28    # distance from origin (poi head ≈ 0.085 m radius)
CAM_ELEV   = 0.07    # slight upward tilt to show both scrolls


def _ensure_camera():
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 85.0
    cam_obj  = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def _ensure_light():
    ld = bpy.data.lights.new("RecLight", type="AREA")
    ld.energy = 130.0
    lo = bpy.data.objects.new("RecLight", ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = (0.25, -0.20, 0.22)
    return lo


# ── render settings ───────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine         = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x   = 1920
    sc.render.resolution_y   = 1080
    sc.render.fps            = FPS
    sc.frame_start           = 0
    sc.frame_end             = N_FR - 1
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format  = "MPEG4"
    sc.render.ffmpeg.codec   = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    os.makedirs(OUT_DIR, exist_ok=True)
    sc.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

    if hasattr(sc.eevee, "bloom_threshold"):
        sc.eevee.bloom_threshold = 0.30
        sc.eevee.bloom_intensity = 0.22
        sc.eevee.use_bloom       = True


# ── keyframe animation ────────────────────────────────────────────────────────

def animate(cam, obj):
    sc = bpy.context.scene
    sk = obj.data.shape_keys

    def set_sk(fr, key_name, val):
        kb = sk.key_blocks[key_name]
        kb.value = val
        kb.keyframe_insert("value", frame=fr)

    def set_cam(fr, angle_deg):
        angle = math.radians(angle_deg)
        cam.location = (
            CAM_RADIUS * math.sin(angle),
            -CAM_RADIUS * math.cos(angle),
            CAM_ELEV,
        )
        cam.keyframe_insert("location", frame=fr)

    # ── phase 0–59: 360° orbit, Basis ────────────────────────────────────
    for fr in range(0, 60):
        set_cam(fr, fr * 6.0)                 # 6°/frame × 60 = 360°
    for kn in ["Basis", "SK_LoA", "SK_HiA", "SK_HiB"]:
        val = 1.0 if kn == "Basis" else 0.0
        set_sk(0, kn, val)
        set_sk(59, kn, val)

    # ── phase 60–119: morph Basis → SK_LoA ───────────────────────────────
    for fr in range(60, 120):
        set_cam(fr, (fr - 60) * 2.0)          # slow drift 120° total
    set_sk(60,  "Basis", 1.0);  set_sk(119, "Basis", 0.0)
    set_sk(60,  "SK_LoA", 0.0); set_sk(119, "SK_LoA", 1.0)
    set_sk(60,  "SK_HiA", 0.0); set_sk(119, "SK_HiA", 0.0)
    set_sk(60,  "SK_HiB", 0.0); set_sk(119, "SK_HiB", 0.0)

    # ── phase 120–179: morph SK_LoA → SK_HiA ─────────────────────────────
    for fr in range(120, 180):
        set_cam(fr, 120.0 + (fr - 120) * 2.0)
    set_sk(120, "Basis", 0.0);  set_sk(179, "Basis", 0.0)
    set_sk(120, "SK_LoA", 1.0); set_sk(179, "SK_LoA", 0.0)
    set_sk(120, "SK_HiA", 0.0); set_sk(179, "SK_HiA", 1.0)
    set_sk(120, "SK_HiB", 0.0); set_sk(179, "SK_HiB", 0.0)

    # ── phase 180–239: 360° orbit, SK_HiB ────────────────────────────────
    for fr in range(180, 240):
        set_cam(fr, 240.0 + (fr - 180) * 6.0)
    set_sk(180, "Basis", 0.0);  set_sk(239, "Basis", 0.0)
    set_sk(180, "SK_LoA", 0.0); set_sk(239, "SK_LoA", 0.0)
    set_sk(180, "SK_HiA", 1.0); set_sk(239, "SK_HiA", 0.0)
    set_sk(180, "SK_HiB", 0.0); set_sk(239, "SK_HiB", 1.0)

    # track-to constraint
    tc = cam.constraints.new(type="TRACK_TO")
    tc.target     = obj
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"


def main():
    obj = bpy.data.objects.get(NAME)
    if obj is None:
        raise RuntimeError(f"Object '{NAME}' not found — run blueprint.py first")

    configure_render()
    cam = _ensure_camera()
    _ensure_light()
    animate(cam, obj)
    bpy.ops.render.render(animation=True)
    print(f"[record.py] Rendered → {bpy.context.scene.render.filepath}")


main()
