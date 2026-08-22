"""
record.py — Viewport animation capture for constraint management tutorial.
Blender 5.1 | CC0 2026

Builds the two-bone rig + animated target, renders 60 frames of
the Child bone tracking the Empty, outputs an MP4.

Output:
  public/library/videos/scripting/
    python-pose-bone-constraint-management-export-bake/viewport.mp4
"""

import bpy
import mathutils
import os

# ─── Output path ──────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../../.."))
VIDEO_DIR   = os.path.join(
    PROJECT_ROOT,
    "public", "library", "videos", "scripting",
    "python-pose-bone-constraint-management-export-bake",
)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")


# ─── Scene constants ──────────────────────────────────────────────────────────
ARM_NAME       = "ConstraintRig_Rec"
TARGET_NAME    = "LookTarget_Rec"
BONE_ROOT_LEN  = 0.5
BONE_CHILD_LEN = 0.4
FRAME_START    = 1
FRAME_END      = 60


def purge():
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def build_arm():
    arm_data = bpy.data.armatures.new(ARM_NAME)
    arm_obj  = bpy.data.objects.new(ARM_NAME, arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root       = eb.new("Root")
    root.head  = (0.0, 0.0, 0.0)
    root.tail  = (0.0, 0.0, BONE_ROOT_LEN)

    child            = eb.new("Child")
    child.head       = root.tail.copy()
    child.tail       = child.head + mathutils.Vector((0.0, 0.0, BONE_CHILD_LEN))
    child.parent     = root
    child.use_connect = True

    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


def build_target():
    bpy.ops.object.empty_add(type='SPHERE', location=(1.0, 0.0, 0.5))
    tgt      = bpy.context.active_object
    tgt.name = TARGET_NAME

    for frame, loc in [
        (1,  (1.0,  0.0, 0.5)),
        (20, (0.0,  1.5, 0.8)),
        (40, (-1.0, 0.0, 0.3)),
        (60, (1.0,  0.0, 0.5)),
    ]:
        tgt.location = loc
        tgt.keyframe_insert("location", frame=frame)
    return tgt


def add_damped_track(arm_obj, target):
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    con            = arm_obj.pose.bones["Child"].constraints.new('DAMPED_TRACK')
    con.target     = target
    con.track_axis = 'TRACK_Y'
    bpy.ops.object.mode_set(mode='OBJECT')


def setup_camera_and_light():
    # Camera at a three-quarter angle above the rig
    bpy.ops.object.camera_add(location=(2.5, -2.5, 1.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.1, 0.0, 0.78)
    bpy.context.scene.camera = cam

    # Area light for clean visibility
    bpy.ops.object.light_add(type='AREA', location=(2.0, 1.0, 3.0))
    light            = bpy.context.active_object
    light.data.energy = 800
    light.data.size   = 2.0


def configure_render():
    scn = bpy.context.scene
    scn.frame_start = FRAME_START
    scn.frame_end   = FRAME_END

    scn.render.engine         = 'BLENDER_EEVEE_NEXT'
    scn.render.resolution_x   = 1920
    scn.render.resolution_y   = 1080
    scn.render.resolution_percentage = 100
    scn.render.fps            = 30

    scn.render.image_settings.file_format  = 'FFMPEG'
    scn.render.ffmpeg.format               = 'MPEG4'
    scn.render.ffmpeg.codec                = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    # Turn on viewport overlays for bone visibility in render
    scn.render.film_transparent = False
    scn.render.filepath = OUTPUT_PATH


def main():
    purge()

    # Clear default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    arm_obj = build_arm()
    target  = build_target()
    add_damped_track(arm_obj, target)
    setup_camera_and_light()
    configure_render()

    # Show bone display in solid mode
    arm_obj.data.display_type = 'STICK'
    arm_obj.show_in_front     = True

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"\nViewport MP4 written: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
