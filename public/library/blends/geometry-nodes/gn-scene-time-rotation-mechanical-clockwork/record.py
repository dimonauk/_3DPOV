"""
record.py — viewport animation capture for the GN Clockwork tutorial.
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run from inside Blender's scripting workspace or via:
  blender --background --python record.py

Output: public/library/videos/geometry-nodes/
            gn-scene-time-rotation-mechanical-clockwork/viewport.mp4

The script:
  1. Calls blueprint.main() to rebuild the scene from scratch.
  2. Configures EEVEE Next for a fast but presentable render.
  3. Uses bpy.ops.render.opengl(animation=True) for the viewport capture.
"""

import bpy
import os
import sys

# ── Locate blueprint.py next to this file ─────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

import blueprint   # noqa: E402


def _configure_eevee(scene):
    scene.render.engine            = 'BLENDER_EEVEE_NEXT'
    scene.eevee.use_bloom          = True
    scene.eevee.bloom_threshold    = 0.8
    scene.eevee.bloom_intensity    = 0.4
    scene.eevee.use_gtao           = True
    scene.eevee.gtao_distance      = 0.5


def _configure_output(scene):
    repo_root = os.path.abspath(os.path.join(_HERE, '..', '..', '..', '..', '..'))
    out_dir   = os.path.join(
        repo_root,
        'public', 'library', 'videos',
        'geometry-nodes', 'gn-scene-time-rotation-mechanical-clockwork',
    )
    os.makedirs(out_dir, exist_ok=True)

    scene.render.filepath          = os.path.join(out_dir, 'viewport')
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format     = 'MPEG4'
    scene.render.ffmpeg.codec      = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.gopsize    = 12
    scene.render.ffmpeg.audio_codec = 'NONE'

    scene.render.resolution_x     = 1920
    scene.render.resolution_y     = 1080
    scene.render.resolution_percentage = 100
    scene.frame_start              = 1
    scene.frame_end                = blueprint.FRAME_END


def main():
    blueprint.main()

    scene = bpy.context.scene
    _configure_eevee(scene)
    _configure_output(scene)

    # Warm GN evaluation: step every frame forward so the viewport cache is hot
    # before the render pass.  Scene Time is evaluated lazily; the first render
    # call at frame N would force evaluate frames 1→N in a single call without
    # this warm-up, causing stuttered first-frame geometry.
    for f in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()

    scene.frame_set(1)
    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f'[record.py] viewport.mp4 written to {scene.render.filepath}..mp4')


if __name__ == '__main__':
    main()
