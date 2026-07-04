"""
Viewport recorder for:
  python-fcurve-keyframe-insert-procedural-animation-turntable

Output: public/library/videos/scripting/
        python-fcurve-keyframe-insert-procedural-animation-turntable/viewport.mp4

Renders 120 frames via EEVEE OpenGL — shows the gem rotating, hovering,
and scaling in. Run AFTER blueprint.py has populated the scene.
"""

import bpy

OUTPUT_DIR   = (
    "//../../../../public/library/videos/scripting/"
    "python-fcurve-keyframe-insert-procedural-animation-turntable/"
)
FRAME_START  = 1
FRAME_END    = 120
FPS          = 24


def setup() -> None:
    sc  = bpy.context.scene
    rd  = sc.render

    rd.engine                        = 'BLENDER_EEVEE'
    rd.resolution_x                  = 1920
    rd.resolution_y                  = 1080
    rd.resolution_percentage         = 100
    rd.fps                           = FPS
    rd.image_settings.file_format    = 'FFMPEG'
    rd.ffmpeg.format                 = 'MPEG4'
    rd.ffmpeg.codec                  = 'H264'
    rd.ffmpeg.constant_rate_factor   = 'MEDIUM'
    rd.filepath                      = OUTPUT_DIR + "viewport"
    sc.frame_start                   = FRAME_START
    sc.frame_end                     = FRAME_END


def main() -> None:
    setup()
    bpy.ops.render.opengl(animation=True)
    print("[record] viewport.mp4 written.")


if __name__ == "__main__":
    main()
