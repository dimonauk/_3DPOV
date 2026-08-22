"""
record.py — Viewport animation render for CorrectiveSmoothModifier tutorial
Blender 5.1

Animates the Forearm bone from 0° to ELBOW_BEND_DEG over 60 frames so the
viewer can see the elbow volume recovery in motion. Output: viewport.mp4.

Run after blueprint.py (relies on HF_ArmMesh + HF_ArmRig already in the scene).
blender --background hf_corrective_smooth_arm.blend --python record.py
"""

import bpy
import math
import pathlib

OUT_PATH       = "//public/library/videos/scripting/python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr/viewport.mp4"
FRAME_START    = 1
FRAME_END      = 60
BEND_START_DEG = 0.0
BEND_END_DEG   = 90.0


def setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # Position to show the arm from the right side at elbow height
    cam_obj.location = (2.0, 0.6, 0.8)
    cam_obj.rotation_euler = (math.radians(70), 0, math.radians(70))
    bpy.context.scene.camera = cam_obj
    return cam_obj


def keyframe_elbow_bend() -> None:
    arm_obj = bpy.data.objects.get("HF_ArmRig")
    if arm_obj is None:
        raise RuntimeError("HF_ArmRig not found — run blueprint.py first")

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")

    pb = arm_obj.pose.bones["Forearm"]
    pb.rotation_mode = "XYZ"

    # Frame 1: straight arm
    bpy.context.scene.frame_set(FRAME_START)
    pb.rotation_euler.x = math.radians(BEND_START_DEG)
    pb.keyframe_insert(data_path="rotation_euler", index=0, frame=FRAME_START)

    # Frame 60: fully bent elbow
    bpy.context.scene.frame_set(FRAME_END)
    pb.rotation_euler.x = math.radians(BEND_END_DEG)
    pb.keyframe_insert(data_path="rotation_euler", index=0, frame=FRAME_END)

    bpy.ops.object.mode_set(mode="OBJECT")


def configure_render() -> None:
    scn = bpy.context.scene
    scn.frame_start = FRAME_START
    scn.frame_end   = FRAME_END

    rd = scn.render
    rd.engine          = "BLENDER_EEVEE_NEXT"
    rd.resolution_x    = 1280
    rd.resolution_y    = 720
    rd.fps             = 30
    rd.image_settings.file_format  = "FFMPEG"
    rd.ffmpeg.format               = "MPEG4"
    rd.ffmpeg.codec                = "H264"
    rd.ffmpeg.constant_rate_factor = "MEDIUM"

    scn.eevee.use_bloom = True

    # Output path — videos directory (directory is committed; .mp4 binary is not)
    pathlib.Path(bpy.path.abspath("//public/library/videos/scripting/python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr")).mkdir(
        parents=True, exist_ok=True
    )
    rd.filepath = OUT_PATH


def main() -> None:
    setup_camera()
    keyframe_elbow_bend()
    configure_render()
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py done → viewport.mp4")


if __name__ == "__main__":
    main()
