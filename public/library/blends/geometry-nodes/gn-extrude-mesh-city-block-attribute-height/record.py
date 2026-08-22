"""
record.py — Viewport Animation Recorder
GN Extrude Mesh — City Block: Per-Face Noise-Height Tower Extrusion
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py (city_block.blend must be open).
Renders a 150-frame camera orbit around the city block starting from a
high oblique angle above one corner, sweeping 360° at steady elevation to
reveal the varied tower heights from all azimuths.

Usage:
  blender --background city_block.blend --python record.py
"""

import bpy
import math
import os

REPO_ROOT  = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
VIDEO_DIR  = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "geometry-nodes", "gn-extrude-mesh-city-block-attribute-height",
)
VIDEO_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

FRAME_START = 1
FRAME_END   = 150
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
# Orbit at 38° elevation — high enough to read tower heights, low enough to feel
# like a building survey drone rather than a map view.
CAM_DIST    = 16.0
CAM_ELEV    = math.radians(38)


def _setup_orbit_camera():
    cam_data      = bpy.data.cameras.new("CB_RecordCam")
    cam_data.type = 'PERSP'
    cam_data.lens = 40.0
    cam_ob        = bpy.data.objects.new("CB_RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    for f in (FRAME_START, FRAME_END + 1):
        frac  = (f - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = frac * 2.0 * math.pi
        cam_ob.location = (
            math.sin(angle) * CAM_DIST * math.cos(CAM_ELEV),
            -math.cos(angle) * CAM_DIST * math.cos(CAM_ELEV),
            CAM_DIST * math.sin(CAM_ELEV),
        )
        # Point camera at origin (city block centre).
        dx = -cam_ob.location.x
        dy = -cam_ob.location.y
        dz = -cam_ob.location.z
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
