"""
record.py — Viewport animation for python-bpy-asset-metadata-mark-tag-batch-glb-webxr
======================================================================================
Loads asset_library_demo.blend (produced by blueprint.py), sets up a
camera and three-point lights, then renders a 90-frame turntable that
orbits the three WebXR-tagged assets while the render-only cube fades
to a ghosted display-type. Output: public/library/videos/scripting/
python-bpy-asset-metadata-mark-tag-batch-glb-webxr/viewport.mp4

Run:
    blender --background asset_library_demo.blend --python record.py
"""

import math
import bpy

# ── parameters ──────────────────────────────────────────────────────────────
BLEND_IN    = "//asset_library_demo.blend"
VIDEO_OUT   = "//viewport.mp4"
FRAME_START = 1
FRAME_END   = 90
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
CAM_RADIUS  = 7.5
CAM_HEIGHT  = 2.8
# ────────────────────────────────────────────────────────────────────────────


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END

    rd = sc.render
    rd.engine          = 'BLENDER_WORKBENCH'
    rd.resolution_x    = RES_X
    rd.resolution_y    = RES_Y
    rd.fps             = FPS
    rd.image_settings.file_format  = 'FFMPEG'
    rd.ffmpeg.format               = 'MPEG4'
    rd.ffmpeg.codec                = 'H264'
    rd.ffmpeg.constant_rate_factor = 'MEDIUM'
    rd.filepath        = VIDEO_OUT

    # Workbench: solid + cavity + studio lighting reads the material colours
    sc.display.shading.type               = 'SOLID'
    sc.display.shading.light              = 'STUDIO'
    sc.display.shading.show_cavity        = True
    sc.display.shading.color_type         = 'MATERIAL'
    sc.display.shading.show_object_outline = True


def _ghost_render_only() -> None:
    """
    Objects without the 'webxr' tag are set to WIRE display so the
    turntable makes the distinction visually obvious.
    """
    for ob in bpy.data.objects:
        if ob.type != 'MESH':
            continue
        ad = ob.asset_data
        is_webxr = ad and any(t.name == "webxr" for t in ad.tags)
        if not is_webxr:
            ob.display_type = 'WIRE'


def _add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(CAM_RADIUS, 0.0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam

    # Point at centroid of the three webxr props (x≈2.2)
    bpy.ops.object.constraint_add(type='TRACK_TO')
    con = cam.constraints["Track To"]
    con.track_axis  = 'TRACK_NEGATIVE_Z'
    con.up_axis     = 'UP_Y'

    # Empty at scene centre for tracking
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(2.2, 0.0, 0.6))
    target = bpy.context.active_object
    target.name = "record_target"
    con.target  = target

    return cam


def _animate_turntable(cam: bpy.types.Object) -> None:
    """
    Orbit the camera around Z using a rotation keyframe on the empty
    rather than animating the camera object directly — cleaner and
    avoids gimbal lock.
    """
    target = bpy.data.objects["record_target"]

    for frame, angle_deg in [(FRAME_START, 0.0), (FRAME_END + 1, 360.0)]:
        bpy.context.scene.frame_set(frame)
        target.rotation_euler.z = math.radians(angle_deg)
        target.keyframe_insert("rotation_euler", index=2)

    # Linear interpolation for a constant orbit speed
    for fcurve in target.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'

    # Reparent cam so it orbits with the empty
    cam.parent = target
    cam.location = (CAM_RADIUS, 0.0, CAM_HEIGHT)


def main() -> None:
    _setup_render()
    _ghost_render_only()
    cam = _add_camera()
    _animate_turntable(cam)

    print("[record] rendering turntable …")
    bpy.ops.render.render(animation=True)
    print(f"[record] done → {VIDEO_OUT}")


main()
