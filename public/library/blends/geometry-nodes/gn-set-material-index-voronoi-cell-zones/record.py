"""
record.py — viewport rotation animation for gn-set-material-index-voronoi-cell-zones
Blender 5.1  |  CC0  |  Holoflow Studio

Renders 5 seconds (150 frames @ 30 fps) of the gem spinning on its Z-axis.
The camera holds still so Voronoi cell colouring is clearly legible throughout.

Run from Blender's Text Editor after blueprint.py has created the scene:
    exec(open(bpy.path.abspath("//record.py")).read())

Output:
    public/library/videos/geometry-nodes/gn-set-material-index-voronoi-cell-zones/viewport.mp4
"""

import bpy
import math

OUT_PATH = "//../../../../public/library/videos/geometry-nodes/gn-set-material-index-voronoi-cell-zones/viewport"
FRAMES   = 150    # 5 s at 30 fps
FPS      = 30


def main() -> None:
    scene = bpy.context.scene
    scene.render.fps         = FPS
    scene.frame_start        = 1
    scene.frame_end          = FRAMES
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath     = OUT_PATH

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec         = 'NONE'

    # Use EEVEE Next for fast material preview (Cycles not needed for viewport render)
    scene.render.engine = 'BLENDER_EEVEE_NEXT'

    gem = bpy.data.objects.get("voronoi_gem")
    if gem is None:
        print("ERROR: voronoi_gem not found — run blueprint.py first")
        return

    # Clear existing animation on the gem
    gem.animation_data_clear()

    # Keyframe full 360° Z rotation — linear interpolation for constant spin rate
    gem.rotation_euler = (0.0, 0.0, 0.0)
    gem.keyframe_insert("rotation_euler", frame=1)
    gem.rotation_euler = (0.0, 0.0, math.radians(360.0))
    gem.keyframe_insert("rotation_euler", frame=FRAMES)

    if gem.animation_data and gem.animation_data.action:
        for fc in gem.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    bpy.ops.render.render(animation=True)
    print(f"✓ viewport animation rendered → {OUT_PATH}.mp4")


main()
