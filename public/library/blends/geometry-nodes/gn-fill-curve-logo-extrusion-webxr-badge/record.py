"""
record.py — Viewport animation for GN Fill Curve / Hexagonal Badge
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py has built the scene. Renders 90 frames (3 s at 30 fps):
  frames 1–30  : static front-face view (gold emission face visible)
  frames 31–60 : slow orbit 90° to reveal side walls and depth
  frames 61–90 : orbit continues to near-back view (back cap + metallic sides)

Output: public/library/videos/geometry-nodes/
                gn-fill-curve-logo-extrusion-webxr-badge/viewport.mp4
"""

import bpy
import os
import math

OUTPUT_PATH = "//../../../../../../public/library/videos/geometry-nodes/" \
              "gn-fill-curve-logo-extrusion-webxr-badge/viewport"
FPS        = 30
FRAME_END  = 90
CAM_DIST   = 3.5
CAM_HEIGHT = 0.8
RESOLUTION = (1280, 720)


def add_lights():
    bpy.ops.object.light_add(type='AREA', location=(2, -2, 3))
    key = bpy.context.active_object
    key.data.energy = 400.0
    key.data.size   = 2.0

    bpy.ops.object.light_add(type='AREA', location=(-3, 1, 2))
    fill = bpy.context.active_object
    fill.data.energy = 120.0
    fill.data.size   = 3.0


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.empty_add(location=(0, 0, 0))
    target = bpy.context.active_object
    target.name = "BadgeTarget"

    bpy.ops.object.camera_add(location=(0, -CAM_DIST, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "BadgeCam"

    bpy.ops.object.constraint_add(type='TRACK_TO')
    cam.constraints['Track To'].target    = target
    cam.constraints['Track To'].track_axis  = 'TRACK_NEGATIVE_Z'
    cam.constraints['Track To'].up_axis     = 'UP_Y'

    bpy.context.scene.camera = cam
    return cam


def keyframe_orbit(cam: bpy.types.Object):
    """
    Keyframes for three phases:
      1–30   : front-face angle (badge directly facing camera — gold glow visible)
      31–60  : orbit 0° → 90° (swing around to reveal side walls)
      61–90  : orbit 90° → 180° (behind badge — dark back cap + metallic sides)
    """
    angle_start = -math.pi / 2          # start directly in front

    phases = [
        (1,  30, 0.0,         0.0),    # hold front view
        (31, 60, 0.0,         0.5),    # swing right 90°
        (61, 90, 0.5,         1.0),    # continue to rear
    ]

    for f_start, f_end, t_start, t_end in phases:
        for frame in range(f_start, f_end + 1):
            t = (frame - f_start) / max(f_end - f_start, 1)
            blend = t_start + (t_end - t_start) * t
            angle = angle_start + blend * math.pi       # 0 → π total arc
            cam.location.x = math.cos(angle) * CAM_DIST
            cam.location.y = math.sin(angle) * CAM_DIST
            cam.location.z = CAM_HEIGHT
            cam.keyframe_insert(data_path='location', frame=frame)

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
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath       = OUTPUT_PATH
    scene.eevee.use_bloom       = True
    scene.eevee.taa_render_samples = 4


def main():
    add_lights()
    cam = setup_camera()
    keyframe_orbit(cam)
    configure_render()

    os.makedirs(
        bpy.path.abspath(
            "//../../../../../../public/library/videos/geometry-nodes/"
            "gn-fill-curve-logo-extrusion-webxr-badge/"
        ),
        exist_ok=True,
    )
    bpy.ops.render.render(animation=True)
    print("Record complete → viewport.mp4")


if __name__ == "__main__":
    main()
