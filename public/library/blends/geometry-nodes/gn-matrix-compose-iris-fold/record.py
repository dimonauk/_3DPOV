"""
record.py — viewport animation recorder for gn-matrix-compose-iris-fold
Outputs: public/library/videos/geometry-nodes/gn-matrix-compose-iris-fold/viewport.mp4

Run AFTER blueprint.py has written iris_fold.blend.
  blender iris_fold.blend --background --python record.py

The script sets an orthographic camera looking down the −Z axis at the iris,
renders ANIM_FRAMES as an H.264 mp4 at 30 fps, 1280×720.

WHY orthographic from above?
  The iris fold from above shows the rotational symmetry closing — each petal
  sweeps through the XY plane as FOLD_ANGLE rises.  A perspective camera would
  add foreshortening that obscures the equal-angle spacing; orthographic makes
  the N-fold symmetry legible at a glance.
"""

import bpy
import math

OUTPUT_PATH  = "//../../videos/geometry-nodes/gn-matrix-compose-iris-fold/viewport"
ANIM_FRAMES  = 60
FPS          = 24
RES_X, RES_Y = 1280, 720
CAM_HEIGHT   = 1.8   # m above XY plane for a 0.50 m radius iris


def setup_camera() -> None:
    bpy.ops.object.camera_add(location=(0, 0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 1.4   # fits N=8 panels × 0.50 m length
    # Point −Z axis down (default for camera add at positive Z looking at origin)
    cam.rotation_euler = (0, 0, 0)
    bpy.context.scene.camera = cam


def setup_lighting() -> None:
    # Single overhead area light — reveals the fold depth when petals tilt.
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 2.0))
    light = bpy.context.active_object
    light.data.energy = 400
    light.data.size   = 2.0


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.filepath        = OUTPUT_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x    = RES_X
    scene.render.resolution_y    = RES_Y
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = ANIM_FRAMES
    # Transparent background so the mp4 composites cleanly in the tutorial page.
    scene.render.film_transparent = True


def main() -> None:
    setup_camera()
    setup_lighting()
    setup_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"✓ viewport.mp4 written to {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
