"""
record.py — Möbius Ribbon Viewport Animation (Blender 5.1)

Builds the Möbius ribbon scene (by calling blueprint.build_scene),
then animates the object rotating 360° around its Z-axis over 120 frames
so the single-sided nature of the strip is visible as it comes back
to its starting orientation.  Outputs to:

  public/library/videos/geometry-nodes/gn-set-curve-tilt-mobius-ribbon/viewport.mp4
"""

import bpy
import math
import sys
from pathlib import Path

# Locate blueprint alongside this file
sys.path.insert(0, str(Path(__file__).parent))
import blueprint  # noqa: E402

VIDEO_OUT = (
    Path(__file__).parents[4]  # → public/
    / "library" / "videos" / "geometry-nodes"
    / "gn-set-curve-tilt-mobius-ribbon" / "viewport.mp4"
)
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES = 120   # 4 seconds at 30 fps — one full rotation
FPS          = 30


def build_rotation_anim(obj: bpy.types.Object) -> None:
    """Keyframe a full 360° Z-rotation over TOTAL_FRAMES."""
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert(data_path="rotation_euler", frame=1)

    obj.rotation_euler = (0.0, 0.0, 2.0 * math.pi)
    obj.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

    # Switch to LINEAR interpolation so the spin is constant-speed
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = TOTAL_FRAMES

    # FFMPEG H.264 output — matches the studio's tutorial video spec
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec          = 'NONE'
    scene.render.filepath                    = str(VIDEO_OUT)


if __name__ == "__main__":
    obj, _ = blueprint.build_scene()
    build_rotation_anim(obj)
    configure_render()
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] Video written: {VIDEO_OUT}")
