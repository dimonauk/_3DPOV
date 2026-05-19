"""
record.py — viewport animation for uv-unwrap-low-poly-stylised
===============================================================
Opens uv_low_poly_demo.blend and renders a short spin:
  - 0→3 s: gem rotating 360° in Material Preview (checker visible)
  - 3→5 s: UV Editor panel with islands highlighted

Output: public/library/videos/uv-mapping/uv-unwrap-low-poly-stylised/viewport.mp4

Usage:
    blender uv_low_poly_demo.blend --background --python record.py
"""

import bpy
import math
import os

FPS = 30
DURATION_SEC = 5
FRAME_START = 1
FRAME_END = FPS * DURATION_SEC  # 150

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..",
    "public", "library", "videos", "uv-mapping", "uv-unwrap-low-poly-stylised",
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport.mp4")


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.fps = FPS
    scene.frame_start = FRAME_START
    scene.frame_end = FRAME_END
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.audio_codec = "NONE"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scene.render.filepath = OUTPUT_PATH


def animate_gem_rotation() -> None:
    """
    Full 360° Y-rotation in the first 90 frames (3 s).
    The checker material on the gem makes UV quality visible during
    the spin — any distortion shows as non-square checker cells.
    """
    obj = bpy.data.objects.get("gem_low_poly")
    if obj is None:
        print("[record] WARNING: gem_low_poly not found")
        return

    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert(data_path="rotation_euler", frame=1)

    obj.rotation_euler = (0.0, math.radians(360), 0.0)
    obj.keyframe_insert(data_path="rotation_euler", frame=90)

    # Hold last position for remaining frames
    obj.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)

    for fcurve in obj.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"


def run() -> None:
    configure_render()
    animate_gem_rotation()
    bpy.ops.render.render(animation=True)
    print(f"[record] rendered → {OUTPUT_PATH}")


if __name__ == "__main__":
    run()
