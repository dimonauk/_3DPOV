"""
record.py — Viewport render: hair spring dynamics 30-frame swing sequence.
Outputs:  public/library/videos/geometry-nodes/
            gn-simulation-zone-hair-curves-spring-dynamics-vrm/viewport.mp4

Run inside Blender after blueprint.py has populated the scene:
  bpy.ops.script.python_file_run(filepath="record.py")

Technique: renders 30 frames of the simulation zone advancing, showing
the hair strands swinging from upright rest pose under gravity + wind gust,
then springing back as the damping settles. The viewport is set to Solid mode
with Matcap + Outline so strands read clearly without any material setup.
"""

import bpy
import os

OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..",
    "public", "library", "videos",
    "geometry-nodes",
    "gn-simulation-zone-hair-curves-spring-dynamics-vrm"
)
OUT_DIR  = os.path.normpath(OUT_DIR)
OUT_PATH = os.path.join(OUT_DIR, "viewport.mp4")

FRAME_START = 1
FRAME_END   = 30
FPS         = 24


def configure_viewport():
    """Switch to Solid + Matcap to show strand silhouettes clearly."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type          = 'SOLID'
                    space.shading.light         = 'MATCAP'
                    space.shading.color_type    = 'OBJECT'
                    space.shading.show_shadows  = False
                    space.shading.show_object_outline = True
                    # Frame all strands
                    bpy.ops.view3d.view_all({'area': area, 'region': area.regions[-1]})
                    break


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    os.makedirs(OUT_DIR, exist_ok=True)

    # OpenGL viewport render to MP4
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath     = OUT_PATH


def render():
    # Warm simulation cache frame by frame first
    scene = bpy.context.scene
    for f in range(FRAME_START, FRAME_END + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()

    # Reset to start and render viewport animation
    scene.frame_set(FRAME_START)
    bpy.ops.render.opengl(animation=True, view_context=True)
    print(f"[record] Saved viewport animation → {OUT_PATH}")


def main():
    configure_viewport()
    setup_render()
    render()


if __name__ == '__main__':
    main()
