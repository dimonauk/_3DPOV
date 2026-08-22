"""
record.py — Viewport Animation for glTF2ExportUserExtension Tutorial
Renders 120 frames illustrating the facet-tag export hook pipeline.

Output: public/library/videos/scripting/python-gltf-user-extension-export-extras-hook/viewport.mp4
Run from Blender Text Editor → Run Script.

SEQUENCE:
  Frame 1–20   : Three cubes, no tags — all grey Workbench material
  Frame 21–40  : Two cubes tagged; materials switch to green to signal facet=1
  Frame 41–80  : Camera orbits 360° tracking both tagged and untagged objects
  Frame 81–100 : Prop_B untagged (simulates toggle); colour reverts to grey
  Frame 101–120: Camera pulls back; outro hold showing final export-ready scene
"""

import bpy
import mathutils
import math
import os
import subprocess

OUTPUT_DIR  = "//../../videos/scripting/python-gltf-user-extension-export-extras-hook"
FRAME_DIR   = "//../../videos/scripting/python-gltf-user-extension-export-extras-hook/frames"
FRAME_TOTAL = 120
RESOLUTION  = (1920, 1080)
FPS         = 30

COLOR_TAGGED   = (0.05, 0.95, 0.40, 1.0)
COLOR_UNTAGGED = (0.30, 0.30, 0.30, 1.0)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_material(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    return mat


def _apply_mat(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# Scene construction
# ---------------------------------------------------------------------------

def build_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene            = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL
    scene.render.fps  = FPS

    mat_tagged   = _make_material("Holoflow_Tagged",   COLOR_TAGGED)
    mat_untagged = _make_material("Holoflow_Untagged", COLOR_UNTAGGED)

    objects = []
    for pos, name in [((0, 0, 0), "Facet_Prop_A"),
                      ((3, 0, 0), "Facet_Prop_B"),
                      ((-3, 0, 0), "Regular_Prop")]:
        bpy.ops.mesh.primitive_cube_add(size=1.2, location=pos)
        obj      = bpy.context.active_object
        obj.name = name
        _apply_mat(obj, mat_untagged)
        objects.append(obj)

    prop_a, prop_b, regular = objects

    # Material keyframes to show tagging event at frame 21
    for obj, mat_on, mat_off, tag_frame, untag_frame in [
        (prop_a, mat_tagged, mat_untagged, 21, None),
        (prop_b, mat_tagged, mat_untagged, 21, 81),
    ]:
        obj.data.materials[0] = mat_off
        obj.data.keyframe_insert("materials[0].diffuse_color", frame=1)
        obj.data.keyframe_insert("materials[0].diffuse_color", frame=20)
        obj.data.materials[0] = mat_on
        obj.data.keyframe_insert("materials[0].diffuse_color", frame=tag_frame)
        if untag_frame:
            obj.data.keyframe_insert("materials[0].diffuse_color", frame=untag_frame - 1)
            obj.data.materials[0] = mat_off
            obj.data.keyframe_insert("materials[0].diffuse_color", frame=untag_frame)
        obj.data.keyframe_insert("materials[0].diffuse_color", frame=FRAME_TOTAL)

    # Camera on orbit empty
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 1))
    pivot      = bpy.context.active_object
    pivot.name = "CameraOrbit"

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.parent        = pivot
    cam_obj.location      = mathutils.Vector((0, -11, 3))
    cam_obj.rotation_euler = (1.1, 0, 0)
    scene.camera          = cam_obj

    pivot.rotation_euler.z = 0
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=40)
    pivot.rotation_euler.z = math.tau
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=80)
    pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAME_TOTAL)

    if pivot.animation_data and pivot.animation_data.action:
        for fc in pivot.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'

    bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
    bpy.context.active_object.data.energy = 3.0

    return objects, cam_obj


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def render_viewport() -> None:
    scene   = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.image_settings.file_format = 'PNG'

    abs_frame_dir = bpy.path.abspath(FRAME_DIR)
    os.makedirs(abs_frame_dir, exist_ok=True)

    scene.render.filepath         = os.path.join(abs_frame_dir, "frame_")
    scene.render.use_file_extension = True
    scene.render.engine           = 'BLENDER_WORKBENCH'
    scene.display.shading.light   = 'MATCAP'
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
        print(f"viewport.mp4 written to {mp4_path}")
    except FileNotFoundError:
        print("ffmpeg not found — run the printed command manually.")


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------

build_scene()
render_viewport()
