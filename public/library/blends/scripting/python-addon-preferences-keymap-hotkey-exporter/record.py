"""
record.py — Viewport Animation for AddonPreferences + KeyMap Tutorial
Renders 90 frames showing the preference lifecycle and hotkey activation.

Output: public/library/videos/scripting/python-addon-preferences-keymap-hotkey-exporter/viewport.mp4
Run from Blender Text Editor → Run Script.

SEQUENCE:
  Frame 1–20  : Three HoloProp cubes idle — Workbench, object colour mode
  Frame 21–50 : Camera slow orbit — simulates 'user reviewing the scene'
  Frame 51–70 : All cubes flash from grey → teal (simulating export triggered)
  Frame 71–90 : Hold on final teal state, camera pulls back to wide shot
"""

import bpy
import math
import os
import subprocess
import mathutils

SLUG        = "python-addon-preferences-keymap-hotkey-exporter"
OUTPUT_DIR  = f"//../../videos/scripting/{SLUG}"
FRAME_DIR   = f"//../../videos/scripting/{SLUG}/frames"
FRAME_TOTAL = 90
FPS         = 30
RESOLUTION  = (1920, 1080)

COL_IDLE    = (0.25, 0.25, 0.30, 1.0)
COL_EXPORT  = (0.05, 0.82, 0.72, 1.0)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mat(name: str, rgba: tuple) -> bpy.types.Material:
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    return m


# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------

def build_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene             = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL
    scene.render.fps  = FPS

    mat_idle   = _mat("Pref_Idle",   COL_IDLE)
    mat_export = _mat("Pref_Export", COL_EXPORT)

    props = []
    for i, pos in enumerate([(-2.2, 0, 0), (0, 0, 0), (2.2, 0, 0)]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=pos)
        obj = bpy.context.active_object
        obj.name = f"HoloProp_{i:02d}"
        obj.data.materials.append(mat_idle)
        props.append(obj)

    # Colour keyframes: idle 1-50, flash to export at 51, hold 71-90
    for obj in props:
        obj.color = (*COL_IDLE[:3], 1.0)
        obj.keyframe_insert(data_path="color", frame=1)
        obj.keyframe_insert(data_path="color", frame=50)
        obj.color = (*COL_EXPORT[:3], 1.0)
        obj.keyframe_insert(data_path="color", frame=51)
        obj.keyframe_insert(data_path="color", frame=FRAME_TOTAL)

    # Camera on orbit pivot
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.5))
    pivot = bpy.context.active_object
    pivot.name = "OrbitPivot"

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 40
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.parent        = pivot
    cam_obj.location      = mathutils.Vector((0, -9, 2.5))
    cam_obj.rotation_euler = (1.2, 0, 0)
    scene.camera           = cam_obj

    # Orbit: frames 21-50 sweep 90°; frames 71-90 pull back via lens
    pivot.rotation_euler.z = 0.0
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=20)
    pivot.rotation_euler.z = math.radians(90)
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=50)
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAME_TOTAL)

    cam_data.lens = 40
    cam_data.keyframe_insert(data_path="lens", frame=1)
    cam_data.keyframe_insert(data_path="lens", frame=70)
    cam_data.lens = 28          # wider at pull-back
    cam_data.keyframe_insert(data_path="lens", frame=FRAME_TOTAL)

    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    bpy.context.active_object.data.energy = 2.5


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def render_viewport() -> None:
    scene   = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.image_settings.file_format = 'PNG'

    abs_frame_dir = bpy.path.abspath(FRAME_DIR)
    os.makedirs(abs_frame_dir, exist_ok=True)

    scene.render.filepath           = os.path.join(abs_frame_dir, "frame_")
    scene.render.use_file_extension = True
    scene.render.engine             = 'BLENDER_WORKBENCH'
    scene.display.shading.light     = 'STUDIO'
    scene.display.shading.color_type = 'OBJECT'

    bpy.ops.render.render(animation=True, write_still=True)

    abs_out  = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(abs_out, exist_ok=True)
    mp4_path = os.path.join(abs_out, "viewport.mp4")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(abs_frame_dir, "frame_%04d.png"),
        "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
        mp4_path,
    ]
    print("ffmpeg command:\n  " + " ".join(cmd))
    try:
        subprocess.run(cmd, check=True)
        print(f"viewport.mp4 written → {mp4_path}")
    except FileNotFoundError:
        print("ffmpeg not found — run the printed command manually.")


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

build_scene()
render_viewport()
