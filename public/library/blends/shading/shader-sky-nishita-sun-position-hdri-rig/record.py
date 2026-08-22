"""
record.py — Nishita Sky Texture viewport animation render
Blender 5.1  |  CC0

Runs blueprint.py to build the scene, then renders a 150-frame OpenGL viewport
animation showing the sun rising from dawn (frame 1) through golden hour (frame 30)
to high noon (frame 150).  Output: viewport.mp4 alongside this file.

Run AFTER blueprint.py — or place both in the same Blender session and run this file.
"""

import bpy
import os
import math

OUTPUT_DIR = os.path.join(os.path.dirname(bpy.data.filepath), "..", "..", "..",
                          "videos", "shading",
                          "shader-sky-nishita-sun-position-hdri-rig")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport.mp4")

RECORD_FRAME_START = 1
RECORD_FRAME_END   = 150
RESOLUTION_X       = 1280
RESOLUTION_Y       = 720
FPS                = 30


def ensure_output_dir() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def configure_viewport_render() -> None:
    scene = bpy.context.scene
    scene.render.resolution_x    = RESOLUTION_X
    scene.render.resolution_y    = RESOLUTION_Y
    scene.render.fps              = FPS
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format    = 'MPEG4'
    scene.render.ffmpeg.codec     = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath         = OUTPUT_PATH
    scene.frame_start             = RECORD_FRAME_START
    scene.frame_end               = RECORD_FRAME_END


def set_viewport_shading() -> None:
    """Switch the 3D viewport to Material Preview (LookDev) for the OpenGL render.
    LookDev uses the world shader, so the Nishita sky is visible in the background.
    """
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'
                    space.shading.use_scene_world = True
                    space.shading.use_scene_lights = True


def position_viewport_camera() -> None:
    """Frame the scene from a three-quarter angle: ground + sphere + cube all visible.
    Move the active camera to (4, -3.5, 2.5) looking at the origin with 50 mm lens.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location       = (4.0, -3.5, 2.5)
    cam_obj.rotation_euler = (math.radians(62), 0.0, math.radians(48))
    bpy.context.scene.camera = cam_obj


def run_opengl_render() -> None:
    """bpy.ops.render.opengl renders the 3D viewport (not Cycles/EEVEE offline path),
    which is fast enough for a 150-frame preview animation without GPU baking.
    """
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False,
                          view_context=True)


def main() -> None:
    ensure_output_dir()
    configure_viewport_render()
    set_viewport_shading()
    position_viewport_camera()
    run_opengl_render()
    print(f"✓ Viewport animation rendered → {OUTPUT_PATH}")


main()
