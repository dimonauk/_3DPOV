"""
record.py — Viewport animation for Cycles Light Path Glass Fireflies
Output: public/library/videos/rendering/cycles-light-path-glass-fireflies/viewport.mp4
Duration: 8 seconds at 24 fps (192 frames)

Requires: scene built by blueprint.py in the same .blend session.

Animation plan:
  Frames   1–48   Camera orbits 0→90° around the prism — glass edge refraction visible.
  Frames  49–96   Camera descends to low angle — elongated shadow on floor comes into view.
  Frames  97–144  Slow push-in to close-up of prism top bevel — facet refraction detail.
  Frames 145–192  Orbit completes to original angle — loop-ready cut point.

Renders with EEVEE Next for speed.  Transmission in EEVEE reproduces the
KHR_materials_transmission look (the same material exported to WebXR).
"""

import math
import bpy
from mathutils import Vector

OUTPUT_PATH = "//../../videos/rendering/cycles-light-path-glass-fireflies/viewport.mp4"
FRAME_END   = 192
FPS         = 24


def setup_render() -> None:
    sce = bpy.context.scene
    sce.frame_start = 1
    sce.frame_end   = FRAME_END
    sce.render.fps  = FPS

    sce.render.image_settings.file_format          = "FFMPEG"
    sce.render.ffmpeg.format                        = "MPEG4"
    sce.render.ffmpeg.codec                         = "H264"
    sce.render.ffmpeg.constant_rate_factor          = "MEDIUM"
    sce.render.filepath                             = OUTPUT_PATH
    sce.render.resolution_x                        = 1920
    sce.render.resolution_y                        = 1080
    sce.render.resolution_percentage               = 100

    # EEVEE Next: fast glass without Cycles ray budget
    sce.render.engine              = "BLENDER_EEVEE_NEXT"
    sce.eevee.use_gtao             = True
    sce.eevee.use_bloom            = True
    sce.eevee.bloom_threshold      = 1.0
    sce.eevee.bloom_intensity      = 0.3


def keyframe_camera_orbit() -> None:
    cam = bpy.data.objects.get("camera")
    if not cam:
        return

    target = Vector((0.0, 0.0, 0.0))
    BASE_R = 2.8

    # (frame, azimuth_deg, elevation_deg)
    keys = [
        (  1,  90, 22),
        ( 48, 180, 22),
        ( 96, 180,  8),
        (144, 220, 20),
        (192,  90, 22),
    ]

    for frame, azi_deg, elev_deg in keys:
        az   = math.radians(azi_deg)
        elev = math.radians(elev_deg)
        cam.location = Vector((
            BASE_R * math.cos(az) * math.cos(elev),
            BASE_R * math.sin(az) * math.cos(elev),
            BASE_R * math.sin(elev),
        ))
        direction  = target - cam.location
        rot_quat   = direction.to_track_quat("-Z", "Y")
        cam.rotation_euler = rot_quat.to_euler()

        bpy.context.scene.frame_set(frame)
        cam.keyframe_insert(data_path="location")
        cam.keyframe_insert(data_path="rotation_euler")

    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"


def main() -> None:
    setup_render()
    keyframe_camera_orbit()
    bpy.context.scene.frame_set(1)
    bpy.ops.render.render(animation=True)
    print(f"[record] Wrote {OUTPUT_PATH}")


main()
