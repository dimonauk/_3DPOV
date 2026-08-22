"""
record.py — Viewport Animation Recorder
GN Sample Grid — Volume Field Probe: Lattice Sensor Constellation
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py (field_probe.blend must be open).
Renders a 150-frame camera orbit around the sensor constellation.
At frame 1 the camera sits at the front; by frame 150 it has completed
a full 360° loop at 28° elevation, revealing the internal cloud clusters
from every angle.

Usage:
  blender --background field_probe.blend --python record.py
"""

import bpy
import math
import os

REPO_ROOT  = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
VIDEO_DIR  = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "geometry-nodes", "gn-sample-grid-volume-field-probe-lattice",
)
VIDEO_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

FRAME_START = 1
FRAME_END   = 150
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
CAM_DIST    = 5.2    # distance from origin (m)
CAM_ELEV    = 0.50   # elevation (radians, ≈ 28.6°)


def _setup_orbit_camera():
    cam_data      = bpy.data.cameras.new("SG_RecordCam")
    cam_data.type = 'PERSP'
    cam_data.lens = 50.0
    cam_ob        = bpy.data.objects.new("SG_RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    for f in (FRAME_START, FRAME_END + 1):
        frac  = (f - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = frac * 2.0 * math.pi
        cam_ob.location = (
            math.sin(angle) * CAM_DIST,
            -math.cos(angle) * CAM_DIST,
            CAM_DIST * math.tan(CAM_ELEV),
        )
        dx, dy, dz = -cam_ob.location.x, -cam_ob.location.y, -cam_ob.location.z
        cam_ob.rotation_euler = (
            math.atan2(math.sqrt(dx**2 + dy**2), -dz) + math.pi,
            0.0,
            math.atan2(dx, dy),
        )
        cam_ob.keyframe_insert("location",       frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)

    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def _configure_render():
    sc = bpy.context.scene
    sc.render.engine                      = 'BLENDER_EEVEE_NEXT'
    sc.frame_start                        = FRAME_START
    sc.frame_end                          = FRAME_END
    sc.render.fps                         = FPS
    sc.render.resolution_x                = RES_X
    sc.render.resolution_y                = RES_Y
    sc.render.resolution_percentage       = 100
    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format               = 'MPEG4'
    sc.render.ffmpeg.codec                = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.ffmpeg.audio_codec          = 'NONE'
    os.makedirs(VIDEO_DIR, exist_ok=True)
    sc.render.filepath = VIDEO_PATH


def main():
    _setup_orbit_camera()
    _configure_render()
    print(f"[record] rendering {FRAME_START}–{FRAME_END} → {VIDEO_PATH}")
    bpy.ops.render.render(animation=True, write_still=False)
    print("[record] done")


main()
