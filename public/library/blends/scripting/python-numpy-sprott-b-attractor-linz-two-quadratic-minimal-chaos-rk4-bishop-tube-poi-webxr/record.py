"""
record.py — Sprott B Attractor  ·  Blender 5.1 viewport animation
==================================================================
Run AFTER blueprint.py has built the scene.  Outputs:
  public/library/videos/scripting/
    python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr/
      viewport.mp4

Technique: 10-second orbit + morphing sequence.
  0–2.5 s  (fr 0–59):   full 360° orbit, Basis (c=1.0) — show canonical attractor
  2.5–5 s  (fr 60–119): morph Basis→SK_cLow (c=0.7)    — watch attractor contract
  5–7.5 s  (fr 120–179): morph SK_cLow→SK_cHigh (c=1.4)  — attractor expands
  7.5–10 s (fr 180–239): orbit, SK_cWide (c=2.0)        — near-bifurcation landscape

To render headless:
  blender --background --python blueprint.py -- && blender --background file.blend --python record.py
"""

import bpy
import math
import os

# ── scene references ─────────────────────────────────────────────────────────
NAME     = "hf_sprott_b_poi"
FPS      = 24
N_FR     = 240            # 10 s at 24 fps
OUT_DIR  = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/scripting",
    "python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr"
)

# ── camera ───────────────────────────────────────────────────────────────────
CAM_RADIUS = 0.26   # distance from origin (poi head is ~0.08 m radius)
CAM_ELEV   = 0.06   # slight upward tilt in metres

def _ensure_camera():
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 85.0            # telephoto to compress the tube perspective
    cam_obj  = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def _ensure_light():
    ld  = bpy.data.lights.new("RecLight", type="AREA")
    ld.energy = 120.0
    lo  = bpy.data.objects.new("RecLight", ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = (0.25, -0.18, 0.20)
    return lo


# ── render settings ───────────────────────────────────────────────────────────

def configure_render():
    sc  = bpy.context.scene
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
    sc.render.filepath       = os.path.join(OUT_DIR, "viewport.mp4")

    # Eevee bloom — emphasises the emission glow on the tube
    if hasattr(sc.eevee, "bloom_threshold"):
        sc.eevee.bloom_threshold  = 0.30
        sc.eevee.bloom_intensity  = 0.22
        sc.eevee.use_bloom        = True


# ── keyframe animation ────────────────────────────────────────────────────────

def animate(cam, obj):
    sc = bpy.context.scene
    sk = obj.data.shape_keys

    # helper — set a shape key value at a frame
    def set_sk(fr, key_name, val):
        kb = sk.key_blocks[key_name]
        kb.value = val
        kb.keyframe_insert("value", frame=fr)

    # helper — position camera on orbit
    def set_cam(fr, angle_deg):
        angle = math.radians(angle_deg)
        cam.location = (
            CAM_RADIUS * math.sin(angle),
            -CAM_RADIUS * math.cos(angle),
            CAM_ELEV,
        )
        # track_to_constraint keeps camera pointed at origin
        cam.keyframe_insert("location", frame=fr)

    # ── phase 0 – 59: full 360° orbit, Basis ─────────────────────────────
    for fr in range(0, 60):
        set_cam(fr, fr * 6.0)           # 6°/frame × 60 fr = 360°
    # shape keys: all at Basis=1, others=0
    for key_name in ["Basis", "SK_cLow", "SK_cHigh", "SK_cWide"]:
        val = 1.0 if key_name == "Basis" else 0.0
        set_sk(0, key_name, val)
        set_sk(59, key_name, val)

    # ── phase 60 – 119: morph Basis→SK_cLow ──────────────────────────────
    for fr in range(60, 120):
        set_cam(fr, 0.0 + (fr - 60) * 1.5)   # slow drift
    set_sk(60,  "Basis",   1.0); set_sk(119, "Basis",   0.0)
    set_sk(60,  "SK_cLow", 0.0); set_sk(119, "SK_cLow", 1.0)
    set_sk(60,  "SK_cHigh",0.0); set_sk(119, "SK_cHigh",0.0)
    set_sk(60,  "SK_cWide",0.0); set_sk(119, "SK_cWide",0.0)

    # ── phase 120 – 179: morph SK_cLow→SK_cHigh ──────────────────────────
    for fr in range(120, 180):
        set_cam(fr, 90.0 + (fr - 120) * 1.5)
    set_sk(120, "Basis",   0.0); set_sk(179, "Basis",   0.0)
    set_sk(120, "SK_cLow", 1.0); set_sk(179, "SK_cLow", 0.0)
    set_sk(120, "SK_cHigh",0.0); set_sk(179, "SK_cHigh",1.0)
    set_sk(120, "SK_cWide",0.0); set_sk(179, "SK_cWide",0.0)

    # ── phase 180 – 239: orbit SK_cWide ──────────────────────────────────
    for fr in range(180, 240):
        set_cam(fr, 180.0 + (fr - 180) * 6.0)   # full 360°
    set_sk(180, "Basis",   0.0); set_sk(239, "Basis",   0.0)
    set_sk(180, "SK_cLow", 0.0); set_sk(239, "SK_cLow", 0.0)
    set_sk(180, "SK_cHigh",0.0); set_sk(239, "SK_cHigh",0.0)
    set_sk(180, "SK_cWide",1.0); set_sk(239, "SK_cWide",1.0)

    # track-to constraint on camera
    tc = cam.constraints.new(type="TRACK_TO")
    tc.target    = obj
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"


def main():
    obj = bpy.data.objects.get(NAME)
    if obj is None:
        raise RuntimeError(f"Object '{NAME}' not found — run blueprint.py first")

    configure_render()
    cam   = _ensure_camera()
    _ensure_light()
    animate(cam, obj)
    bpy.ops.render.render(animation=True)
    print(f"[record.py] Rendered → {bpy.context.scene.render.filepath}")


main()
