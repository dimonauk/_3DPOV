"""
record.py — Viewport animation for weight-paint-vrm-deformation-envelope
Blender 5.1 | CC0 | Holoflow Studio

Sequence (90 frames @ 24 fps ≈ 3.75 s):
  0–30   T-pose hold — shows weight-paint heat map on torso
  30–60  upper_arm.L raises 60° — elbow-lift deformation test
  60–90  spine.001 leans forward 20° — trunk-flex deformation test

Output: public/library/videos/rigging/weight-paint-vrm-deformation-envelope/viewport.mp4
"""

import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

OUTPUT_PATH = "//../../../../../../public/library/videos/rigging/weight-paint-vrm-deformation-envelope/viewport.mp4"
FPS         = 24
FRAME_END   = 90


def _run_blueprint() -> None:
    """Execute blueprint.py relative to this script's directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else bpy.path.abspath("//")
    bp = os.path.join(script_dir, "blueprint.py")
    with open(bp) as fh:
        exec(compile(fh.read(), bp, 'exec'), {"__file__": bp})


def _setup_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # Three-quarter front view of the torso rig
    cam_obj.location = (1.8, -2.6, 0.9)
    target = Vector((0.0, 0.0, 0.7))
    direction = target - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    bpy.context.scene.camera = cam_obj


def _setup_light() -> None:
    sun = bpy.data.lights.new("Sun", type='SUN')
    sun.energy = 4.0
    sun_obj = bpy.data.objects.new("Sun", sun)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(50), 0, math.radians(25))


def _key(arm_obj: bpy.types.Object, bone: str, frame: int,
         rx: float = 0, ry: float = 0, rz: float = 0) -> None:
    """Insert XYZ Euler rotation keyframe on a pose bone."""
    pb = arm_obj.pose.bones[bone]
    pb.rotation_mode = 'XYZ'
    pb.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
    pb.keyframe_insert(data_path='rotation_euler', frame=frame)


def _animate(arm_obj: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = FRAME_END

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')

    # T-pose hold
    for bone in ("upper_arm.L", "spine.001"):
        _key(arm_obj, bone, 0)
        _key(arm_obj, bone, 30)

    # arm raises: upper_arm.L rotates on local Y
    _key(arm_obj, "upper_arm.L", 60, ry=-60)

    # spine leans forward: spine.001 rotates on local X
    _key(arm_obj, "spine.001",   60)
    _key(arm_obj, "spine.001",   90, rx=20)

    bpy.ops.object.mode_set(mode='OBJECT')


def _configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine              = 'BLENDER_EEVEE_NEXT'
    scene.render.fps                 = FPS
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.image_settings.file_format   = 'FFMPEG'
    scene.render.ffmpeg.format                = 'MPEG4'
    scene.render.ffmpeg.codec                 = 'H264'
    scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
    scene.render.filepath            = OUTPUT_PATH

    # Show solid shading with vertex-group colour so weight gradient is visible
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type       = 'SOLID'
                    space.shading.color_type = 'VERTEX'


def run() -> None:
    _run_blueprint()

    arm_obj  = bpy.data.objects["vrm_rig"]
    mesh_obj = bpy.data.objects["vrm_torso"]

    # switch mesh to Weight Paint display for the render
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
    bpy.ops.object.mode_set(mode='OBJECT')

    _setup_camera()
    _setup_light()
    _animate(arm_obj)
    _configure_render()

    Path(bpy.path.abspath(OUTPUT_PATH)).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(animation=True)
    print(f"✓ viewport.mp4 rendered → {OUTPUT_PATH}")


run()
