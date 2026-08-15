"""
record.py — viewport animation for the Riemann Zeta stage floor.
Run AFTER blueprint.py has written hf_riemann_zeta.blend.

Sequence (240 frames, 8 s at 30 fps):
  0–60   : wide aerial shot, camera descends to reveal full floor
  60–180 : slow orbit 180° around the floor, pausing over each zero marker
  180–240: pull back to full-floor view, tilt to near-top-down

Output → public/library/videos/scripting/
           python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr/
             viewport.mp4
"""

import bpy
import math
from pathlib import Path

HERE    = Path(__file__).parent
BLEND   = HERE / "hf_riemann_zeta.blend"
OUT_DIR = (
    Path(__file__).parents[4]
    / "videos/scripting"
    / "python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = str(OUT_DIR / "viewport")

FPS          = 30
TOTAL_FRAMES = 240   # 8 s
CAM_DIST     = 1.35  # orbit radius in metres
CAM_ELEV_START = math.radians(62)   # steep aerial at frame 0
CAM_ELEV_MID   = math.radians(38)   # low flypast during orbit
CAM_ELEV_END   = math.radians(78)   # near-top-down at end


def _ease(t: float) -> float:
    """Smoothstep easing."""
    return t * t * (3.0 - 2.0 * t)


def _set_cam_polar(cam_ob, scene, frame, azimuth, elevation, dist):
    """Position cam_ob at polar coords and key its location."""
    x = dist * math.cos(elevation) * math.sin(azimuth)
    z = dist * math.cos(elevation) * math.cos(azimuth)
    y = dist * math.sin(elevation)
    cam_ob.location = (x, y, z)
    # Always face origin
    dx, dy, dz = -x, -y, -z
    pitch  = math.atan2(dy, math.hypot(dx, dz))
    yaw    = math.atan2(dx, dz) + math.pi
    cam_ob.rotation_euler = (pitch, 0.0, yaw)
    scene.frame_set(frame)
    cam_ob.keyframe_insert("location")
    cam_ob.keyframe_insert("rotation_euler")


def build_anim():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES - 1

    # Workbench renderer: vertex colours, no shadow
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light       = "FLAT"
    scene.display.shading.color_type  = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.fps             = FPS
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_FILE

    # Replace camera with a fresh orbital camera
    for ob in list(scene.objects):
        if ob.type == "CAMERA":
            bpy.data.objects.remove(ob, do_unlink=True)
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 40.0
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_ob)
    scene.camera = cam_ob

    # Phase 1 (0–60): aerial descent, azimuth = 45°
    _set_cam_polar(cam_ob, scene, 0,   math.radians(45),  CAM_ELEV_START, CAM_DIST * 1.15)
    _set_cam_polar(cam_ob, scene, 60,  math.radians(45),  CAM_ELEV_MID,   CAM_DIST)

    # Phase 2 (60–180): half-orbit — swing from 45° to 225°, dipping low
    for i, frac in enumerate([(f / 9.0) for f in range(10)]):
        fr     = 60 + int(frac * 120)
        az     = math.radians(45 + frac * 180)
        elev   = CAM_ELEV_MID + (CAM_ELEV_START - CAM_ELEV_MID) * _ease(frac)
        _set_cam_polar(cam_ob, scene, fr, az, elev, CAM_DIST)

    # Phase 3 (180–240): pull back, tilt near top-down
    _set_cam_polar(cam_ob, scene, 180, math.radians(225), CAM_ELEV_START, CAM_DIST)
    _set_cam_polar(cam_ob, scene, 240, math.radians(225), CAM_ELEV_END,   CAM_DIST * 1.25)

    # Smooth all f-curves
    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

    bpy.ops.render.render(animation=True)
    print(f"[holoflow] Rendered → {OUT_FILE}.mp4")


if __name__ == "__main__":
    build_anim()
