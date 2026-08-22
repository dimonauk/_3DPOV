"""
record.py — Viewport animation for python-bpy-curves-hair-data-block-strand-sculpt-webxr
Blender 5.1 | Holoflow Studio | CC0

Renders a 10-second (240-frame @ 24fps) OpenGL viewport animation showing:
  Frame   1-60:   Static front view — full hair strand system visible on sphere.
  Frame  61-120:  Camera orbits 90° left, revealing the hemisphere coverage.
  Frame 121-180:  Camera continues orbit — rear view showing gravity droop shape.
  Frame 181-240:  Camera returns to front; hair Curves object highlighted in orange.

Output:
  public/library/videos/scripting/
  python-bpy-curves-hair-data-block-strand-sculpt-webxr/viewport.mp4

Run from the Blender Text Editor (Scripting workspace) AFTER blueprint.py
has already populated the scene, or use:
  blender --background scene.blend --python record.py
"""

import bpy
import os
import math

OUTPUT_VIDEO = bpy.path.abspath(
    "//../../../../videos/scripting/"
    "python-bpy-curves-hair-data-block-strand-sculpt-webxr/viewport.mp4"
)
FPS          = 24
TOTAL_FRAMES = 240


def _ensure_scene_populated() -> None:
    if bpy.data.objects.get("HF_HairStrands") is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        bp_path = os.path.join(script_dir, "blueprint.py")
        with open(bp_path) as fh:
            exec(compile(fh.read(), bp_path, "exec"), {})  # noqa: S102


def _setup_camera() -> tuple[bpy.types.Object, bpy.types.Object]:
    """Orbit camera on an Empty pivot for turntable animation."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.15))
    pivot = bpy.context.active_object
    pivot.name = "HF_RecordPivot"

    bpy.ops.object.camera_add(location=(0, -2.4, 0.5))
    cam = bpy.context.active_object
    cam.name = "HF_RecordCam"
    cam.data.lens = 60

    # Point camera at origin
    bpy.ops.object.constraint_add(type='TRACK_TO')
    cam.constraints['Track To'].target = pivot
    cam.constraints['Track To'].track_axis = 'TRACK_NEGATIVE_Z'
    cam.constraints['Track To'].up_axis = 'UP_Y'

    cam.parent = pivot
    bpy.context.scene.camera = cam
    return pivot, cam


def _key(ob: bpy.types.Object, attr: str, frame: int, value) -> None:
    setattr(ob, attr, value)
    ob.keyframe_insert(data_path=attr, frame=frame)


def _animate_orbit(pivot: bpy.types.Object) -> None:
    """Orbit from 0° → 180° over frames 1-240 (half revolution)."""
    _key(pivot, 'rotation_euler', 1,   (0, 0, 0))
    _key(pivot, 'rotation_euler', 240, (0, 0, math.radians(180)))

    # Ease in/out with bezier interpolation
    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.resolution_percentage = 100
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = TOTAL_FRAMES
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format   = 'MPEG4'
    sc.render.ffmpeg.codec    = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath        = OUTPUT_VIDEO

    sc.eevee.taa_render_samples = 16

    # Soft orange tint on hair object for visibility
    hair_ob = bpy.data.objects.get("HF_HairStrands")
    if hair_ob:
        hair_ob.color = (1.0, 0.55, 0.1, 1.0)
        hair_ob.show_instancer_for_viewport = True


def run() -> None:
    _ensure_scene_populated()

    # Remove any old record camera/pivot
    for name in ("HF_RecordPivot", "HF_RecordCam"):
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)

    os.makedirs(os.path.dirname(OUTPUT_VIDEO), exist_ok=True)

    pivot, _cam = _setup_camera()
    _animate_orbit(pivot)
    _setup_render()

    bpy.ops.render.render(animation=True)
    print(f"[HF] Viewport animation → {OUTPUT_VIDEO}")


run()
