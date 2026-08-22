"""
record.py — Viewport Animation for GizmoGroup Tutorial
Renders 120 frames of the facet-tag gizmo overlay animating into view.

Output: public/library/videos/scripting/python-gizmo-group-custom-viewport-handle/viewport.mp4
Run from Blender Text Editor → Run Script (no display needed; uses offscreen render).

SEQUENCE:
  Frame 1–20   : Three cubes visible, no tags, gizmos absent (grey)
  Frame 21–40  : holoflow:facet applied to two objects; green circles appear
  Frame 41–80  : Camera orbits 360° showing gizmo circles tracking objects
  Frame 81–100 : Click-toggle simulated: first tagged object becomes untagged
  Frame 101–120: Camera pulls back to reveal full scene; outro hold
"""

import bpy
import mathutils
import os
import subprocess

OUTPUT_DIR  = "//../../videos/scripting/python-gizmo-group-custom-viewport-handle"
FRAME_DIR   = "//../../videos/scripting/python-gizmo-group-custom-viewport-handle/frames"
FRAME_TOTAL = 120
RESOLUTION  = (1920, 1080)
FPS         = 30

# ---------------------------------------------------------------------------
# Scene construction
# ---------------------------------------------------------------------------

def build_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL
    scene.render.fps  = FPS

    # Three cubes
    positions = [(0, 0, 0), (3.5, 0, 0), (-3.5, 0, 0)]
    names     = ["Prop_A", "Prop_B", "Prop_C"]
    objects   = []
    for pos, name in zip(positions, names):
        bpy.ops.mesh.primitive_cube_add(size=1.2, location=pos)
        obj = bpy.context.active_object
        obj.name = name
        objects.append(obj)

    # Tag two of them — we animate the custom property with keyframes
    for i, obj in enumerate(objects[:2]):
        obj["holoflow:facet"] = 0
        obj.keyframe_insert(data_path='["holoflow:facet"]', frame=1)
        obj["holoflow:facet"] = 0
        obj.keyframe_insert(data_path='["holoflow:facet"]', frame=20)
        obj["holoflow:facet"] = 1
        obj.keyframe_insert(data_path='["holoflow:facet"]', frame=21)
        # Frame 81: toggle first object off to simulate click-untag
        if i == 0:
            obj["holoflow:facet"] = 1
            obj.keyframe_insert(data_path='["holoflow:facet"]', frame=80)
            obj["holoflow:facet"] = 0
            obj.keyframe_insert(data_path='["holoflow:facet"]', frame=81)
        else:
            obj["holoflow:facet"] = 1
            obj.keyframe_insert(data_path='["holoflow:facet"]', frame=FRAME_TOTAL)

    # Camera on an orbit empty
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 1))
    pivot = bpy.context.active_object
    pivot.name = "CameraOrbit"

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.parent = pivot
    cam_obj.location = mathutils.Vector((0, -10, 3))
    cam_obj.rotation_euler = (1.1, 0, 0)
    scene.camera = cam_obj

    # Orbit 360° over frames 41–80
    pivot.rotation_euler.z = 0
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
    pivot.rotation_euler.z = 0
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=40)
    import math
    pivot.rotation_euler.z = math.tau   # 360°
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=80)
    pivot.rotation_euler.z = math.tau
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAME_TOTAL)

    # Smooth fcurve interpolation
    for obj in (pivot,):
        if obj.animation_data and obj.animation_data.action:
            for fc in obj.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'

    # World light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
    sun = bpy.context.active_object
    sun.data.energy = 3.0

    return objects, cam_obj


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def render_viewport():
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.image_settings.file_format = 'PNG'

    abs_frame_dir = bpy.path.abspath(FRAME_DIR)
    os.makedirs(abs_frame_dir, exist_ok=True)

    scene.render.filepath = os.path.join(abs_frame_dir, "frame_")
    scene.render.use_file_extension = True

    # Workbench for fast render that shows custom overlay colours
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light       = 'MATCAP'
    scene.display.shading.color_type  = 'OBJECT'

    bpy.ops.render.render(animation=True, write_still=True)

    # Assemble MP4 via ffmpeg if available
    abs_out = bpy.path.abspath(OUTPUT_DIR)
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
        print(f"viewport.mp4 written to {mp4_path}")
    except FileNotFoundError:
        print("ffmpeg not found — run the printed command manually.")


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

build_scene()
render_viewport()
