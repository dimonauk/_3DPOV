"""
record.py — Viewport animation for
python-bpy-depsgraph-object-instances-gn-scatter-webxr-export
=============================================================
Loads hf_depsgraph_scatter.blend (produced by blueprint.py), adds a
turntable camera orbiting the merged scatter mesh, and renders 90
frames at 1920×1080 / 30 fps to:

  public/library/videos/scripting/
  python-bpy-depsgraph-object-instances-gn-scatter-webxr-export/
  viewport.mp4

Run:
    blender --background hf_depsgraph_scatter.blend --python record.py
"""

import math
import bpy

# ── parameters ──────────────────────────────────────────────────────────────
VIDEO_OUT   = "//viewport.mp4"
FRAME_START = 1
FRAME_END   = 90
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
CAM_RADIUS  = 9.0
CAM_HEIGHT  = 4.5
# ────────────────────────────────────────────────────────────────────────────


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END

    rd = sc.render
    rd.engine         = "BLENDER_WORKBENCH"
    rd.resolution_x   = RES_X
    rd.resolution_y   = RES_Y
    rd.fps            = FPS
    rd.image_settings.file_format  = "FFMPEG"
    rd.ffmpeg.format               = "MPEG4"
    rd.ffmpeg.codec                = "H264"
    rd.ffmpeg.constant_rate_factor = "MEDIUM"
    rd.filepath       = VIDEO_OUT

    # Matcap gives each copy a clear 3-D read without any lighting setup.
    sc.display.shading.type               = "SOLID"
    sc.display.shading.light              = "MATCAP"
    sc.display.shading.color_type         = "OBJECT"
    sc.display.shading.show_object_outline = True


def _colour_objects() -> None:
    """
    Assign per-object viewport colours. The merged scatter reads as green
    against the dark ground so the transition from GN scatter to resolved
    static mesh is visually legible in the recording.
    """
    merged = bpy.data.objects.get("hf_scatter_merged")
    if merged:
        merged.color = (0.35, 0.85, 0.55, 1.0)

    ground = bpy.data.objects.get("HF_Ground")
    if ground:
        ground.color = (0.16, 0.16, 0.20, 1.0)


def _add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(CAM_RADIUS, 0.0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam

    bpy.ops.object.constraint_add(type="TRACK_TO")
    con = cam.constraints["Track To"]
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis    = "UP_Y"

    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.3))
    target = bpy.context.active_object
    target.name = "record_target"
    con.target   = target
    return cam


def _animate_orbit(cam: bpy.types.Object) -> None:
    """
    Orbit the camera by keyframing the tracking empty's Z rotation.
    Parenting cam to the empty rather than animating cam.location directly
    avoids gimbal lock at the orbit poles.
    """
    target = bpy.data.objects["record_target"]

    for frame, deg in [(FRAME_START, 0.0), (FRAME_END + 1, 360.0)]:
        bpy.context.scene.frame_set(frame)
        target.rotation_euler.z = math.radians(deg)
        target.keyframe_insert("rotation_euler", index=2)

    for fc in target.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    cam.parent   = target
    cam.location = (CAM_RADIUS, 0.0, CAM_HEIGHT)


def main() -> None:
    _setup_render()
    _colour_objects()
    cam = _add_camera()
    _animate_orbit(cam)

    print("[record] rendering orbit …")
    bpy.ops.render.render(animation=True)
    print(f"[record] done → {VIDEO_OUT}")


main()
