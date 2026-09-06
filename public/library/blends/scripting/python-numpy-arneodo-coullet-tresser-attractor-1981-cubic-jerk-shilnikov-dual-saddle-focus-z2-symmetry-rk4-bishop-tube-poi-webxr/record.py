"""
record.py — Arneodo–Coullet–Tresser Attractor  ·  Blender 5.1 viewport animation
==================================================================================
Run AFTER blueprint.py has built the scene.  Outputs:
  public/library/videos/scripting/
    python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-
      dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr/
        viewport.mp4

Sequence (10 s at 24 fps = 240 frames):
  0–59   fr : full 360° orbit, Basis (α=0.2, β=−1.4, γ=7.5) — canonical double-scroll
  60–119 fr : morph Basis → SK_LowG  — scrolls contract as γ↓ from 7.5 → 5.5
  120–179 fr : morph Basis → SK_HighG — scrolls widen as γ↑ from 7.5 → 9.5
  180–239 fr : morph Basis → SK_LowAlp — orbit broadens as dissipation α↓

Headless run:
  blender --background --python blueprint.py && blender hf_act_poi.blend --python record.py
"""

import bpy
import math
import os

NAME    = "hf_act_poi"
FPS     = 24
N_FR    = 240
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/scripting",
    "python-numpy-arneodo-coullet-tresser-attractor-1981-cubic-jerk-shilnikov-"
    "dual-saddle-focus-z2-symmetry-rk4-bishop-tube-poi-webxr"
)


def _ensure_camera():
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 80.0
    cam_obj  = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def _ensure_light():
    ld = bpy.data.lights.new("RecLight", type="AREA")
    ld.energy = 120.0
    lo = bpy.data.objects.new("RecLight", ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = (0.22, -0.18, 0.20)
    return lo


def configure_render():
    sc  = bpy.context.scene
    sc.render.engine             = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x       = 1920
    sc.render.resolution_y       = 1080
    sc.render.fps                = FPS
    sc.frame_start               = 1
    sc.frame_end                 = N_FR
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format      = "MPEG4"
    sc.render.ffmpeg.codec       = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath           = os.path.join(OUT_DIR, "viewport.mp4")
    os.makedirs(OUT_DIR, exist_ok=True)


def set_shading():
    for space in (a.spaces.active for a in bpy.context.screen.areas
                  if a.type == "VIEW_3D"):
        space.shading.type = "RENDERED"
        space.overlay.show_overlays = False


def keyframe_camera(cam, fr, radius, elevation, angle):
    x = radius * math.cos(angle)
    y = radius * math.sin(angle)
    z = elevation
    cam.location = (x, y, z)
    dx, dy, dz = -x, -y, -z
    cam.rotation_euler = (
        math.atan2(math.sqrt(dx**2+dy**2), -dz),
        0.0,
        math.atan2(dy, dx) + math.pi/2
    )
    cam.keyframe_insert("location", frame=fr)
    cam.keyframe_insert("rotation_euler", frame=fr)


def keyframe_shape(ob, sk_name, value, fr):
    ob.data.shape_keys.key_blocks[sk_name].value = value
    ob.data.shape_keys.key_blocks[sk_name].keyframe_insert("value", frame=fr)


def main():
    configure_render()
    _ensure_light()
    cam = _ensure_camera()

    ob = bpy.data.objects.get(NAME)
    if ob is None:
        raise RuntimeError(f"Object '{NAME}' not found — run blueprint.py first.")

    CAM_R  = 0.30
    CAM_EL = 0.08

    # Segment 0–59: orbit Basis
    for fr in (1, 60):
        ang = (fr - 1) / 59 * 2 * math.pi
        keyframe_camera(cam, fr, CAM_R, CAM_EL, ang)

    # Segment 60–119: morph → SK_LowG
    keyframe_shape(ob, "SK_LowG", 0.0, 60)
    keyframe_shape(ob, "SK_LowG", 1.0, 119)
    for fr in (60, 119):
        ang = 2*math.pi + (fr-60)/59 * 2*math.pi
        keyframe_camera(cam, fr, CAM_R, CAM_EL + 0.03, ang)

    # Segment 120–179: morph → SK_HighG (reset LowG)
    keyframe_shape(ob, "SK_LowG", 0.0, 120)
    keyframe_shape(ob, "SK_HighG", 0.0, 120)
    keyframe_shape(ob, "SK_HighG", 1.0, 179)
    for fr in (120, 179):
        ang = 4*math.pi + (fr-120)/59 * 2*math.pi
        keyframe_camera(cam, fr, CAM_R, CAM_EL - 0.04, ang)

    # Segment 180–239: morph → SK_LowAlp (reset HighG)
    keyframe_shape(ob, "SK_HighG", 0.0, 180)
    keyframe_shape(ob, "SK_LowAlp", 0.0, 180)
    keyframe_shape(ob, "SK_LowAlp", 1.0, 239)
    for fr in (180, 240):
        ang = 6*math.pi + (fr-180)/60 * 2*math.pi
        keyframe_camera(cam, fr, CAM_R + 0.04, CAM_EL + 0.05, ang)

    bpy.ops.render.render(animation=True)
    print(f"Rendered → {bpy.context.scene.render.filepath}")


main()
