"""
record.py — Viewport animation for EEVEE Next Irradiance Volume + Sphere Probe
Output: public/library/videos/lighting/eevee-next-irradiance-sphere-probe/viewport.mp4
Duration: 10 seconds at 24 fps (240 frames)
Requires: scene built by blueprint.py, probes already baked (cache stored in .blend)

Animation plan:
  Frames   1-40   Camera orbits 0→30° around chrome sphere — probe influence boundary crosses.
  Frames  41-80   Camera pushes in; probe data fills chrome sphere reflection with room walls.
  Frames  81-140  Wide shot rotates to show red wall, green corner, colour bleeding on chrome.
  Frames 141-200  Irradiance Volume influence toggle: sphere probe disabled → re-enabled to
                  show before/after. Done via keyframing probe.hide_render.
  Frames 201-240  Return to hero angle: chrome sphere, warm reflection, room geometry.
"""

import bpy
import math
from mathutils import Vector

OUTPUT_PATH = "//../../videos/lighting/eevee-next-irradiance-sphere-probe/viewport.mp4"
FRAME_END   = 240
FPS         = 24


def setup_render() -> None:
    sce = bpy.context.scene
    sce.frame_start = 1
    sce.frame_end   = FRAME_END
    sce.render.fps  = FPS

    sce.render.image_settings.file_format = 'FFMPEG'
    sce.render.ffmpeg.format              = 'MPEG4'
    sce.render.ffmpeg.codec               = 'H264'
    sce.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    sce.render.filepath      = OUTPUT_PATH
    sce.render.resolution_x  = 1920
    sce.render.resolution_y  = 1080
    sce.render.resolution_percentage = 100

    sce.render.engine = 'BLENDER_EEVEE_NEXT'


def keyframe_camera_orbit() -> None:
    cam = bpy.data.objects.get("camera_main")
    if not cam:
        return

    target = Vector((0.0, 0.0, 0.30))   # chrome sphere centre
    base_radius = 3.8
    base_height = 1.4

    orbit_keys = [
        ( 1,   42.0, 1.40),
        ( 40,  72.0, 1.30),
        ( 80,  55.0, 0.90),
        (140,  20.0, 1.10),
        (200,  42.0, 1.40),
        (240,  42.0, 1.40),
    ]

    for frame, azimuth_deg, height in orbit_keys:
        az = math.radians(azimuth_deg)
        cam.location = Vector((
            math.cos(az) * base_radius,
            math.sin(az) * base_radius,
            height,
        ))
        # Point camera toward target
        direction = target - cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()

        bpy.context.scene.frame_set(frame)
        cam.keyframe_insert(data_path="location")
        cam.keyframe_insert(data_path="rotation_euler")

    # Smooth interpolation
    for fcurve in (cam.animation_data.action.fcurves if cam.animation_data else []):
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type  = 'AUTO'
            kp.handle_right_type = 'AUTO'


def keyframe_probe_toggle() -> None:
    """
    Frames 141-165: disable sphere probe to show unlit chrome (world env only).
    Frames 166-200: re-enable — probe reflections snap back on next EEVEE redraw.
    This is the most instructive part: the before/after makes the probe contribution
    unmistakably visible.
    """
    sp = bpy.data.objects.get("sphere_probe_chrome")
    if not sp:
        return

    sce = bpy.context.scene

    sce.frame_set(140)
    sp.hide_render = False
    sp.keyframe_insert(data_path="hide_render")

    sce.frame_set(141)
    sp.hide_render = True
    sp.keyframe_insert(data_path="hide_render")

    sce.frame_set(165)
    sp.hide_render = True
    sp.keyframe_insert(data_path="hide_render")

    sce.frame_set(166)
    sp.hide_render = False
    sp.keyframe_insert(data_path="hide_render")


def main() -> None:
    setup_render()
    keyframe_camera_orbit()
    keyframe_probe_toggle()

    print("record.py configured.  Run bpy.ops.render.render(animation=True) to produce")
    print(f"  {OUTPUT_PATH}")
    print("Ensure probes are baked in the .blend before rendering — unbaked probes")
    print("render as world-only indirect lighting (flat, no colour bleed).")


if __name__ == "__main__":
    main()
