"""
record.py — viewport animation for Shader AOV tutorial.

Renders a 150-frame turntable of the sapphire amulet to
  public/library/videos/rendering/shader-aov-custom-render-passes/viewport.mp4

The gem rotates 360° (frames 1–120); frames 121–150 hold at 0° to
show the final composited still. The Compositor recombines beauty
with GlowMask-gated Glare and RimMask-graded blues on every frame.

Run AFTER blueprint.py has been executed in the same Blender session:
  blender --background aov_amulet.blend --python record.py

Or headlessly from scratch:
  blender --background --python blueprint.py --python record.py
"""

import bpy
import math
import os

VIDEO_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../../../public/library/videos/"
    "rendering/shader-aov-custom-render-passes/viewport.mp4",
)
FPS         = 30
FRAME_END   = 150
ROT_FRAMES  = 120       # frames for 360° rotation
HOLD_FRAMES = 30        # hold final frame

RENDER_SAMPLES = 32     # lower than blueprint for speed


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END

    # Shorter render for the video — reduce noise budget
    scene.cycles.samples = RENDER_SAMPLES

    # FFmpeg output for mp4
    scene.render.filepath          = VIDEO_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format     = 'MPEG4'
    scene.render.ffmpeg.codec      = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.fps               = FPS

    # Resolution — halved for faster render
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100

    obj = bpy.data.objects.get("amulet_gem")
    if obj is None:
        raise RuntimeError("amulet_gem not found — run blueprint.py first")

    obj.rotation_euler = (0, 0, 0)

    # 360° Z rotation over ROT_FRAMES
    obj.rotation_euler.z = 0.0
    obj.keyframe_insert("rotation_euler", frame=1, index=2)

    obj.rotation_euler.z = math.tau     # 2π = full rotation
    obj.keyframe_insert("rotation_euler", frame=ROT_FRAMES, index=2)

    # Hold after rotation
    obj.rotation_euler.z = math.tau
    obj.keyframe_insert("rotation_euler", frame=FRAME_END, index=2)

    # Linear interpolation for constant-speed spin
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            if fc.data_path == "rotation_euler" and fc.array_index == 2:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def render_animation():
    # Make sure compositor is active
    bpy.context.scene.use_nodes = True
    bpy.ops.render.render(animation=True)


def main():
    setup_animation()
    render_animation()
    print(f"viewport.mp4 written to: {VIDEO_PATH}")


if __name__ == "__main__":
    main()
