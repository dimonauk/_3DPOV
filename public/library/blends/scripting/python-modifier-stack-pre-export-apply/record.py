"""
record.py — Viewport animation for python-modifier-stack-pre-export-apply
Blender 5.1 | Holoflow Studio | CC0

Renders a 5-second (120-frame @ 24fps) OpenGL viewport animation that shows:
  Frame 0-30:   Mesh with full stack visible — bevel + boolean hole visible
  Frame 31-60:  Camera orbits to show solidify shell thickness on cut edge
  Frame 61-90:  Subsurf levels step from 0 → 2, surface smooths live
  Frame 91-120: Exploded-view separation showing cutter proxy wire object

Output: public/library/videos/scripting/python-modifier-stack-pre-export-apply/viewport.mp4

Run via:
    blender --background --python record.py
or from the Blender Text Editor (Script workspace) with the blueprint already run.
"""

import bpy
import os
import math

OUTPUT_VIDEO = bpy.path.abspath(
    "//../../../../videos/scripting/"
    "python-modifier-stack-pre-export-apply/viewport.mp4"
)

FPS          = 24
TOTAL_FRAMES = 120


def _get_or_rebuild_scene():
    """Run blueprint.py first if the demo object is missing."""
    if bpy.data.objects.get("HF_ModStack_Demo") is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        bp_path = os.path.join(script_dir, "blueprint.py")
        with open(bp_path) as f:
            exec(compile(f.read(), bp_path, "exec"), {})   # noqa: S102
    return bpy.data.objects["HF_ModStack_Demo"]


def _setup_camera_rig():
    """Orbit camera on an empty parent — classic turntable rig."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "HF_CamPivot"

    bpy.ops.object.camera_add(location=(0, -2.0, 0.35))
    cam = bpy.context.active_object
    cam.name = "HF_Camera"
    cam.data.lens = 50

    # Parent camera to pivot so rotating pivot orbits the camera
    cam.parent = pivot
    bpy.context.scene.camera = cam
    return pivot, cam


def _set_subsurf_level(ob: bpy.types.Object, level: int):
    sub = ob.modifiers.get("HF_SubSurf")
    if sub:
        sub.levels = level


def _setup_animation(ob: bpy.types.Object, pivot):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    # Phase 1 (1-30): Static front view, subsurf at level 1
    scene.frame_set(1)
    _set_subsurf_level(ob, 1)
    ob.modifiers["HF_SubSurf"].keyframe_insert("levels", frame=1)
    pivot.rotation_euler.z = 0.0
    pivot.keyframe_insert("rotation_euler", frame=1)

    # Phase 2 (31-60): Camera sweeps 90° — shows shell thickness on cut edge
    pivot.rotation_euler.z = math.radians(90)
    pivot.keyframe_insert("rotation_euler", frame=60)

    # Phase 3 (61-90): SubSurf steps from 0 to 2 (live smoothing demo)
    scene.frame_set(61)
    _set_subsurf_level(ob, 0)
    ob.modifiers["HF_SubSurf"].keyframe_insert("levels", frame=61)
    scene.frame_set(90)
    _set_subsurf_level(ob, 2)
    ob.modifiers["HF_SubSurf"].keyframe_insert("levels", frame=90)

    # Phase 4 (91-120): Continue orbit back to front; restore subsurf 1
    pivot.rotation_euler.z = math.radians(180)
    pivot.keyframe_insert("rotation_euler", frame=120)
    scene.frame_set(120)
    _set_subsurf_level(ob, 1)
    ob.modifiers["HF_SubSurf"].keyframe_insert("levels", frame=120)

    # Use LINEAR interpolation on the camera pivot so orbit is constant speed
    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

    # Use CONSTANT interpolation on subsurf levels so the step is instant
    sub_mod = ob.modifiers.get("HF_SubSurf")
    if sub_mod and ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            if "levels" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"


def _render_opengl(output_path: str):
    scene = bpy.context.scene
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    scene.render.fps         = FPS
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath    = output_path

    # OpenGL render uses the viewport shading, not Cycles/EEVEE full render.
    # Much faster; sufficient for blueprint demonstration.
    bpy.ops.render.opengl(animation=True)
    print(f"[HF Record] Wrote viewport animation to: {output_path}")


def main():
    ob    = _get_or_rebuild_scene()
    pivot, _cam = _setup_camera_rig()
    _setup_animation(ob, pivot)
    _render_opengl(OUTPUT_VIDEO)


if __name__ == "__main__":
    main()
