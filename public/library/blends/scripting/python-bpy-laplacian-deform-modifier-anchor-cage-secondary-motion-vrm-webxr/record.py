"""
record.py — viewport animation render for LaplacianDeform tail tutorial.
Outputs: public/library/videos/scripting/
         python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr/
         viewport.mp4

Duration: frames 1-50 @ 25 fps = 2 s (rest → bent → rest arc).
Resolution: 1280 × 720.
Engine: WORKBENCH (fast, no GPU required, identical look in any environment).
"""

import bpy

OUT_PATH = (
    "//../../../../videos/scripting/"
    "python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr/"
    "viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 50
FPS         = 25


def _configure_render(scene: bpy.types.Scene) -> None:
    scene.render.engine           = "BLENDER_WORKBENCH"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format    = "MPEG4"
    scene.render.ffmpeg.codec     = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x    = 1280
    scene.render.resolution_y    = 720
    scene.render.resolution_percentage = 100
    scene.render.fps              = FPS
    scene.frame_start             = FRAME_START
    scene.frame_end               = FRAME_END
    scene.render.filepath         = bpy.path.abspath(OUT_PATH)

    # Workbench: cavity shading makes the ring topology read clearly
    scene.display.shading.type            = "SOLID"
    scene.display.shading.light           = "MATCAP"
    scene.display.shading.show_cavity     = True
    scene.display.shading.cavity_type     = "BOTH"
    scene.display.shading.cavity_ridge_factor  = 1.0
    scene.display.shading.cavity_valley_factor = 0.6


def _position_camera() -> None:
    """
    Place camera at +X +Y, tilted down, framing the full tail.
    Uses direct data API — no bpy.ops.view3d context needed.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)

    from mathutils import Vector, Euler
    import math
    cam_obj.location = Vector((1.6, -1.6, 1.0))
    cam_obj.rotation_euler = Euler(
        (math.radians(75), 0.0, math.radians(45)), "XYZ"
    )
    cam_data.lens = 50.0
    bpy.context.scene.camera = cam_obj


def record() -> None:
    scene = bpy.context.scene
    _configure_render(scene)
    _position_camera()
    bpy.ops.render.render(animation=True, write_still=False)
    print("[holoflow] record.py — render complete →", bpy.path.abspath(OUT_PATH))


if __name__ == "__main__":
    record()
