"""
record.py — Freestyle NPR Line Rendering, turntable animation.

Renders a 150-frame Cycles turntable with Freestyle lines active,
outputting to:
  public/library/videos/rendering/freestyle-npr-line-rendering/viewport.mp4

The gem rotates 360° over frames 1–120; frames 121–150 hold the final pose
so viewers can read the Freestyle line detail before the video loops.

Run after blueprint.py has been executed:
  blender --background freestyle_npr_lines.blend --python record.py

Or headlessly from scratch (slower, blueprint rebuilds the scene first):
  blender --background --python blueprint.py --python record.py

Freestyle lines appear only in the final Cycles render, not the OpenGL
viewport preview, so this record uses bpy.ops.render.render(animation=True)
rather than the opengl shortcut used in EEVEE-only tutorials.
Sample count is halved for render speed without visible quality loss at
the target 960×540 resolution.
"""

import bpy
import math
import os

VIDEO_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../../../../public/library/videos/"
    "rendering/freestyle-npr-line-rendering/viewport.mp4",
)

FPS         = 30
FRAME_END   = 150
ROT_FRAMES  = 120    # full 360° rotation
HOLD_FRAMES = 30     # hold final frame so viewers can read the lines


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END

    # Halved samples for recording speed — Freestyle pass is cheap per frame,
    # main render cost is the Cycles path tracing.
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True

    # Output settings for MP4
    scene.render.filepath = VIDEO_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format     = 'MPEG4'
    scene.render.ffmpeg.codec      = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.fps = FPS

    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100

    gem = bpy.data.objects.get("gem_prism")
    if gem is None:
        raise RuntimeError("gem_prism not found — run blueprint.py first")

    # Keyframe 1: gem at 0° rotation
    gem.rotation_euler.z = 0.0
    gem.keyframe_insert("rotation_euler", frame=1, index=2)

    # Keyframe ROT_FRAMES: gem has completed one full turn
    gem.rotation_euler.z = math.tau
    gem.keyframe_insert("rotation_euler", frame=ROT_FRAMES, index=2)

    # Keyframe FRAME_END: hold position for the tail hold
    gem.keyframe_insert("rotation_euler", frame=FRAME_END, index=2)

    # Linear interpolation on the Z rotation channel for constant speed
    if gem.animation_data and gem.animation_data.action:
        for fc in gem.animation_data.action.fcurves:
            if fc.data_path == "rotation_euler" and fc.array_index == 2:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def render_animation():
    os.makedirs(os.path.dirname(VIDEO_PATH), exist_ok=True)
    # Full Cycles render with Freestyle — this is the only way to see
    # Freestyle strokes in the output.
    bpy.ops.render.render(animation=True)


def main():
    setup_animation()
    render_animation()
    print(f"Freestyle turntable written → {VIDEO_PATH}")


if __name__ == "__main__":
    main()
