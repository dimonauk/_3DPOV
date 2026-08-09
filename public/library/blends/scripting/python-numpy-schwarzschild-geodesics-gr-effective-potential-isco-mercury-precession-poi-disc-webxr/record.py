"""
record.py — Viewport animation for Schwarzschild Geodesics poi disc
Blender 5.1 | Holoflow Studio | CC0

Run in the Blender Scripting workspace AFTER blueprint.py has built the scene.
Output: public/library/videos/scripting/
        python-numpy-schwarzschild-geodesics-.../viewport.mp4

Animation plan (240 frames @ 24 fps = 10 seconds):
  F001–060  Camera overhead; disc rotates 60° (slow reveal of rosette pattern)
  F061–120  Camera sweeps to 40° elevation; morph to SK_NearISCO (tight orbits)
  F121–180  Morph back to Basis; disc accelerates to 240° total rotation
  F181–240  Camera returns overhead; morph to SK_Keplerian; reveal wide orbits
"""

import bpy
import math
import os

FPS      = 24
N_FRAMES = 240

SLUG     = ("python-numpy-schwarzschild-geodesics-gr-effective-potential"
            "-isco-mercury-precession-poi-disc-webxr")
OUT_DIR  = f"//../../videos/scripting/{SLUG}/"
OUT_FILE = OUT_DIR + "viewport"

OBJ_NAME = "hf_schwarzschild_poi"
CAM_NAME = "Camera"


def ease(t: float) -> float:
    """Smooth-step: 3t² − 2t³"""
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def kf_rot(obj, frame, angle_z):
    obj.rotation_euler = (math.pi / 2, 0.0, angle_z)
    obj.keyframe_insert("rotation_euler", frame=frame)


def kf_cam(cam, frame, elev_deg, dist=2.8):
    elev = math.radians(elev_deg)
    cam.location        = (0.0, -dist * math.cos(elev), dist * math.sin(elev))
    cam.rotation_euler  = (math.pi/2 - elev, 0.0, 0.0)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


def kf_sk(keys, name, frame, value):
    sk = keys.get(name)
    if sk:
        sk.value = value
        sk.keyframe_insert("value", frame=frame)


def main():
    scene = bpy.context.scene
    scene.render.fps   = FPS
    scene.frame_start  = 1
    scene.frame_end    = N_FRAMES

    # Workbench in Vertex Colour mode for clean fast render
    scene.render.engine                       = "BLENDER_WORKBENCH"
    scene.display.shading.light               = "MATCAP"
    scene.display.shading.color_type          = "VERTEX"
    scene.render.resolution_x                 = 1920
    scene.render.resolution_y                 = 1080
    scene.render.image_settings.file_format   = "FFMPEG"
    scene.render.ffmpeg.format                = "MPEG4"
    scene.render.ffmpeg.codec                 = "H264"
    scene.render.ffmpeg.constant_rate_factor  = "HIGH"

    abs_out = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_out, exist_ok=True)
    scene.render.filepath = OUT_FILE

    obj = bpy.data.objects.get(OBJ_NAME)
    cam = bpy.data.objects.get(CAM_NAME)
    if obj is None or cam is None:
        raise RuntimeError("Run blueprint.py first to build the scene.")

    keys = obj.data.shape_keys.key_blocks

    # ── Keyframes ────────────────────────────────────────────────────────────
    # F001: overhead, Basis
    kf_cam(cam, 1,   90.0, dist=2.8)
    kf_rot(obj, 1,   0.0)
    kf_sk(keys, "SK_NearISCO", 1,   0.0)
    kf_sk(keys, "SK_Keplerian", 1,  0.0)

    # F060: still overhead, rotated 60°
    kf_cam(cam, 60,  90.0, dist=2.8)
    kf_rot(obj, 60,  math.radians(60))

    # F120: 40° elevation; peak SK_NearISCO
    kf_cam(cam, 120, 40.0, dist=2.5)
    kf_rot(obj, 120, math.radians(120))
    kf_sk(keys, "SK_NearISCO", 120, 1.0)
    kf_sk(keys, "SK_Keplerian", 120, 0.0)

    # F180: back to Basis; 240° rotation; still at 40° elevation
    kf_cam(cam, 180, 40.0, dist=2.5)
    kf_rot(obj, 180, math.radians(240))
    kf_sk(keys, "SK_NearISCO", 180, 0.0)
    kf_sk(keys, "SK_Keplerian", 180, 0.0)

    # F240: overhead; full rotation; peak SK_Keplerian (wide, sparse orbits)
    kf_cam(cam, 240, 90.0, dist=3.2)
    kf_rot(obj, 240, math.radians(360))
    kf_sk(keys, "SK_NearISCO", 240, 0.0)
    kf_sk(keys, "SK_Keplerian", 240, 1.0)

    # Smooth interpolation
    for ac in bpy.data.actions:
        for fc in ac.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"

    bpy.ops.render.render(animation=True)
    print("✓ Rendered:", bpy.path.abspath(OUT_FILE))


if __name__ == "__main__":
    main()
