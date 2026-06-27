"""
record.py — Viewport Animation Recorder
GN Sort Elements — Sequential Face Reveal
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py has executed (sequential_face_reveal.blend must be open).
Renders frames 1–130 to viewport MP4 showing the full bottom-to-top face unfurl.

Usage:
  blender --background sequential_face_reveal.blend --python record.py
"""

import bpy
import os

REPO_ROOT  = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
VIDEO_DIR  = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "geometry-nodes", "gn-sort-elements-sequential-face-reveal"
)
VIDEO_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

FRAME_START = 1
FRAME_END   = 130
FPS         = 24
RES_X       = 1920
RES_Y       = 1080


def _setup_camera() -> None:
    cam_data = bpy.data.cameras.new("SR_RecordCam")
    cam_data.type        = 'PERSP'
    cam_data.lens        = 50.0
    cam_ob = bpy.data.objects.new("SR_RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    # Slightly elevated front-right view — shows sphere volume and bottom-to-top reveal
    cam_ob.location       = (3.5, -3.5, 1.8)
    cam_ob.rotation_euler = (1.24, 0.0, 0.785)
    bpy.context.scene.camera = cam_ob


def _configure_render() -> None:
    sc = bpy.context.scene
    sc.render.engine           = 'BLENDER_EEVEE_NEXT'
    sc.frame_start             = FRAME_START
    sc.frame_end               = FRAME_END
    sc.render.fps              = FPS
    sc.render.resolution_x     = RES_X
    sc.render.resolution_y     = RES_Y
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.ffmpeg.audio_codec         = 'NONE'
    os.makedirs(VIDEO_DIR, exist_ok=True)
    sc.render.filepath = VIDEO_PATH


def main() -> None:
    _setup_camera()
    _configure_render()
    print(f"[record] rendering frames {FRAME_START}–{FRAME_END} → {VIDEO_PATH}")
    bpy.ops.render.render(animation=True, write_still=False)
    print("[record] done")


main()
