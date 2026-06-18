"""
UDIM Multi-Tile UV — Viewport Recording
Blender 5.1  |  CC0

Animates a slow orbit around the torso so the UDIM tile seams
and the UV overlay are visible in the recording.

Output: public/library/videos/shading/shader-udim-multitile-vrm-character/viewport.mp4
Duration: 10 s at 30 fps = 300 frames
"""

import math
import bpy

OUTPUT = "//../../videos/shading/shader-udim-multitile-vrm-character/viewport.mp4"
FPS    = 30
FRAMES = 300  # 10 seconds


def setup_render() -> None:
    scn = bpy.context.scene
    scn.render.engine        = "BLENDER_EEVEE_NEXT"
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format = "MPEG4"
    scn.render.ffmpeg.codec  = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.resolution_x  = 1920
    scn.render.resolution_y  = 1080
    scn.render.fps            = FPS
    scn.frame_start           = 1
    scn.frame_end             = FRAMES
    scn.render.filepath       = OUTPUT


def animate_camera() -> None:
    cam = bpy.data.objects.get("cam")
    if cam is None:
        print("record.py: no camera named 'cam' — run blueprint.py first")
        return

    # orbit 360° around the torso (origin 0,0,0.7 = mid-torso)
    orbit_height = 0.75
    orbit_radius = 2.6

    cam.animation_data_clear()
    scn = bpy.context.scene

    for f in range(1, FRAMES + 1):
        scn.frame_set(f)
        t = (f - 1) / (FRAMES - 1)  # 0 → 1
        angle = 2 * math.pi * t
        cam.location = (
            orbit_radius * math.sin(angle),
            -orbit_radius * math.cos(angle),
            orbit_height,
        )
        # always look at the torso mid-point
        dx = -cam.location.x
        dy = -cam.location.y
        cam.rotation_euler = (
            1.28,
            0.0,
            math.atan2(dx, -dy),
        )
        cam.keyframe_insert(data_path="location",       frame=f)
        cam.keyframe_insert(data_path="rotation_euler", frame=f)

    # linear interpolation on all F-curves → smooth orbit
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def main() -> None:
    setup_render()
    animate_camera()
    bpy.ops.render.render(animation=True)
    print("record.py: viewport orbit render complete →", OUTPUT)


if __name__ == "__main__":
    main()
