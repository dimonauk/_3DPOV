"""
record.py — Viewport animation for GN Accumulate Field / Weighted Stripe Tube
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py has built the scene. Renders 72 frames (2.4 s at 30 fps)
of the camera orbiting the tube, showing the variable-width stripe pattern from
all angles. Output: public/library/videos/geometry-nodes/
                            gn-accumulate-field-weighted-stripe-tube/viewport.mp4
"""

import bpy
import os
import math

OUTPUT_PATH = "//../../../../../../public/library/videos/geometry-nodes/" \
              "gn-accumulate-field-weighted-stripe-tube/viewport"
FPS         = 30
FRAME_END   = 72      # 2.4 s orbit
ORBIT_Z     = 0.6     # camera height above origin
ORBIT_R     = 5.5     # orbit radius in metres
RESOLUTION  = (1280, 720)


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(ORBIT_R, 0.0, ORBIT_Z))
    cam = bpy.context.active_object
    cam.name = "OrbitCam"
    # Point at scene centre
    bpy.ops.object.constraint_add(type='TRACK_TO')
    cam.constraints['Track To'].target = None
    # Use an empty at origin as track target instead
    bpy.ops.object.empty_add(location=(0, 0, 0))
    target = bpy.context.active_object
    target.name = "CamTarget"
    bpy.context.view_layer.objects.active = cam
    cam.constraints['Track To'].target   = target
    cam.constraints['Track To'].track_axis  = 'TRACK_NEGATIVE_Z'
    cam.constraints['Track To'].up_axis     = 'UP_Y'
    bpy.context.scene.camera = cam
    return cam


def keyframe_orbit(cam: bpy.types.Object):
    """
    Keyframe camera position on a full orbit around the tube.
    The tube runs along X, so we orbit in the XY plane at fixed Z.
    """
    scene = bpy.context.scene
    for frame in range(1, FRAME_END + 1):
        t = (frame - 1) / FRAME_END          # 0..1, full rotation
        angle = t * math.tau
        cam.location.x = math.cos(angle) * ORBIT_R
        cam.location.y = math.sin(angle) * ORBIT_R
        cam.location.z = ORBIT_Z
        cam.keyframe_insert(data_path='location', frame=frame)
    # Smooth interpolation for orbit
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def configure_render():
    scene = bpy.context.scene
    scene.render.engine         = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x   = RESOLUTION[0]
    scene.render.resolution_y   = RESOLUTION[1]
    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = FRAME_END
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format          = 'MPEG4'
    scene.render.ffmpeg.codec           = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_PATH
    scene.eevee.use_bloom = True
    # 2 samples — fast enough for viewport demo quality
    scene.eevee.taa_render_samples = 2


def add_light():
    bpy.ops.object.light_add(type='SUN', location=(3, 3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(5)
    bpy.ops.object.light_add(type='AREA', location=(-2, -2, 4))
    fill = bpy.context.active_object
    fill.data.energy = 1.0
    fill.data.size   = 3.0


def main():
    add_light()
    cam = setup_camera()
    keyframe_orbit(cam)
    configure_render()
    os.makedirs(
        bpy.path.abspath("//../../../../../../public/library/videos/geometry-nodes/"
                         "gn-accumulate-field-weighted-stripe-tube/"),
        exist_ok=True
    )
    bpy.ops.render.render(animation=True)
    print("Record complete → viewport.mp4")


if __name__ == "__main__":
    main()
