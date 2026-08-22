"""
record.py — viewport animation for physics-rigid-body-constraints-hinge-spring-motor
Outputs: public/library/videos/physics/physics-rigid-body-constraints-hinge-spring-motor/viewport.mp4

Run AFTER blueprint.py has created constraints_demo.blend.
The rigid body simulation is driven live by EEVEE's dependency evaluation;
no explicit bake step is required for rendering (unlike GLB export).
"""

import bpy
import os

BLEND_FILE   = bpy.path.abspath("//constraints_demo.blend")
OUTPUT_PATH  = bpy.path.abspath(
    "//../../../../videos/physics/"
    "physics-rigid-body-constraints-hinge-spring-motor/viewport"
)
FRAME_START  = 1
FRAME_END    = 120
FPS          = 24
RESOLUTION_X = 1280
RESOLUTION_Y = 720


def setup_render():
    bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)

    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.fps             = FPS
    scene.render.resolution_x    = RESOLUTION_X
    scene.render.resolution_y    = RESOLUTION_Y
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath        = OUTPUT_PATH
    scene.frame_start            = FRAME_START
    scene.frame_end              = FRAME_END

    # EEVEE settings for fast preview render
    scene.eevee.taa_render_samples = 16

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    bpy.ops.render.render(animation=True)
    print(f"✓ viewport.mp4 written → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    setup_render()
