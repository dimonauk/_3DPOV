"""
VRM Eye Look-At Rig — Damped Track + Limit Rotation Bone Constraints
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE OVERVIEW
------------------
Track To and Damped Track are the two "look-at" bone constraints in Blender.
Track To solves in Euler space and can gimbal-lock when the tracked object
crosses the 90° pole — in practice this means an eye can suddenly flip 180°
as the camera or target crosses centre. Damped Track solves as a quaternion
differential: it finds the minimal rotation from the bone's rest direction to
the target direction, which is always unique and continuous. For real-time
WebXR avatars this matters: the rig must never produce a discontinuous jump.

Constraint chain (order matters):
  1. Damped Track   — minimum-rotation orient toward look_target bone
  2. Limit Rotation — clamp yaw ±40° and pitch ±30° in Pose space
  3. Copy Rotation  — right eye mirrors left eye's Y (yaw) sign, preserving
                      bilateral symmetry when the look_target is at centre

VRM naming convention used throughout — vrm-format add-on reads these names
to auto-assign bone roles. The root empty is positioned at Head centre so
the look_target bone offset equals visual eye direction in world space.
"""

import bpy
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
ARM_NAME      = "vrm_eye_rig"
YAW_LIMIT_DEG = 40.0   # horizontal travel each side
PITCH_MIN_DEG = -30.0  # up (negative in local)
PITCH_MAX_DEG =  30.0  # down
EYE_OFFSET_X  = 0.032  # half inter-pupillary distance (metres)
EYE_OFFSET_Z  = 0.015  # eye sits slightly above head bone tip

# ── Helpers ───────────────────────────────────────────────────────────────────
def deg(d: float) -> float:
    import math
    return math.radians(d)


def new_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def make_armature() -> tuple[bpy.types.Object, bpy.types.Armature]:
    arm_data = bpy.data.armatures.new(ARM_NAME)
    arm_obj  = bpy.data.objects.new(ARM_NAME, arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    return arm_obj, arm_data


def enter_edit(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")


def exit_edit() -> None:
    bpy.ops.object.mode_set(mode="OBJECT")


def enter_pose(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="POSE")


def exit_pose() -> None:
    bpy.ops.object.mode_set(mode="OBJECT")


def add_bone(
    arm: bpy.types.Armature,
    name: str,
    head: tuple,
    tail: tuple,
    parent: str | None = None,
    connected: bool = False,
) -> bpy.types.EditBone:
    eb = arm.edit_bones.new(name)
    eb.head = mathutils.Vector(head)
    eb.tail = mathutils.Vector(tail)
    eb.use_deform = True
    if parent:
        eb.parent = arm.edit_bones[parent]
        eb.use_connect = connected
    return eb

# ── Build skeleton ─────────────────────────────────────────────────────────────

new_scene()
arm_obj, arm_data = make_armature()
enter_edit(arm_obj)

# Spine chain (minimal — enough for a VRM hierarchy read by the importer)
add_bone(arm_data, "Root",  (0, 0, 0),     (0, 0, 0.10))
add_bone(arm_data, "Hips",  (0, 0, 0.10),  (0, 0, 0.20), parent="Root", connected=True)
add_bone(arm_data, "Spine", (0, 0, 0.20),  (0, 0, 0.38), parent="Hips", connected=True)
add_bone(arm_data, "Chest", (0, 0, 0.38),  (0, 0, 0.54), parent="Spine", connected=True)
add_bone(arm_data, "Neck",  (0, 0, 0.54),  (0, 0, 0.64), parent="Chest", connected=True)
add_bone(arm_data, "Head",  (0, 0, 0.64),  (0, 0, 0.74), parent="Neck", connected=True)

# Eyes — NOT connected so they can rotate freely around their own origin
#   Head tail is 0.74; eye bones sit at ~0.73 (approximating eye socket depth)
EYE_Z = 0.73
add_bone(arm_data, "LeftEye",
         (-EYE_OFFSET_X, 0, EYE_Z),
         (-EYE_OFFSET_X, -0.03, EYE_Z + EYE_OFFSET_Z),
         parent="Head")
add_bone(arm_data, "RightEye",
         ( EYE_OFFSET_X, 0, EYE_Z),
         ( EYE_OFFSET_X, -0.03, EYE_Z + EYE_OFFSET_Z),
         parent="Head")

# Look-target control bone — user animates THIS
#   Placed 0.5 m forward from head centre; driving it sweeps both eyes
add_bone(arm_data, "LookTarget",
         (0, -0.50, EYE_Z),
         (0, -0.55, EYE_Z),
         parent="Head")

# Mark look-target as non-deforming — it's a control, not a mesh driver
arm_data.edit_bones["LookTarget"].use_deform = False

exit_edit()

# ── Pose constraints ───────────────────────────────────────────────────────────
enter_pose(arm_obj)

pbs = arm_obj.pose.bones

def add_damped_track(pb, subtarget: str) -> bpy.types.Constraint:
    c = pb.constraints.new("DAMPED_TRACK")
    c.name = "DampedTrack_LookAt"
    c.target    = arm_obj      # self-targeting: constraint points at bone in own rig
    c.subtarget = subtarget    # name of the control bone
    # track_axis: -Y because Blender bones point in +Y; the eye mesh faces -Y
    c.track_axis = "TRACK_NEGATIVE_Y"
    return c

def add_limit_rotation(pb) -> bpy.types.Constraint:
    c = pb.constraints.new("LIMIT_ROTATION")
    c.name = "LimitRot_EyeClamp"
    c.owner_space = "POSE"          # limits in pose-space not world — intuitive angle ranges
    c.use_limit_x = True
    c.min_x = deg(PITCH_MIN_DEG)    # look up
    c.max_x = deg(PITCH_MAX_DEG)    # look down
    c.use_limit_y = False            # roll around gaze axis: never clamped
    c.use_limit_z = True
    c.min_z = deg(-YAW_LIMIT_DEG)
    c.max_z = deg( YAW_LIMIT_DEG)
    c.use_transform_limit = True    # apply even without influence at 1.0 — safe fallback
    return c

# Left eye — Damped Track then Limit Rotation
pb_l = pbs["LeftEye"]
add_damped_track(pb_l, "LookTarget")
add_limit_rotation(pb_l)

# Right eye — same, but Copy Rotation from LeftEye inverts Z (yaw) for bilateral symmetry
#   We do NOT use a separate Damped Track to avoid double tracking.
#   RightEye copies LeftEye rotation, then the Limit Rotation reapplies the clamp.
pb_r = pbs["RightEye"]

cr = pb_r.constraints.new("COPY_ROTATION")
cr.name     = "CopyRot_FromLeft"
cr.target   = arm_obj
cr.subtarget = "LeftEye"
cr.owner_space  = "LOCAL"
cr.target_space = "LOCAL"
# Bilateral symmetry: X (pitch) copies directly; Z (yaw) inverts because the
# eyes are mirrored across the YZ plane — positive Z yaw on left = negative Z on right
cr.invert_x = False
cr.invert_z = True
cr.mix_mode = "REPLACE"

add_limit_rotation(pb_r)

# ── Custom bone shape (widget) ─────────────────────────────────────────────────
# Create a simple circle mesh as display shape for the look-target
bpy.ops.mesh.primitive_circle_add(vertices=16, radius=0.02)
circle_obj = bpy.context.active_object
circle_obj.name = "WGT_LookTarget"
circle_obj.hide_render = True
# Unlink from scene — shape objects live in scene collection but should not render
bpy.context.scene.collection.objects.unlink(circle_obj)
bpy.context.scene.collection.objects.link(circle_obj)

pbs["LookTarget"].custom_shape = circle_obj
pbs["LookTarget"].use_custom_shape_bone_size = False

exit_pose()

# ── Viewport display ───────────────────────────────────────────────────────────
arm_data.display_type = "OCTAHEDRAL"
arm_obj.show_in_front  = True

# ── Save ──────────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath="//vrm_eye_lookat_rig.blend")

print(
    "VRM Eye Look-At Rig built:\n"
    "  Bones: Root > Hips > Spine > Chest > Neck > Head > LeftEye / RightEye\n"
    "  Control: LookTarget (child of Head, non-deforming)\n"
    "  LeftEye  constraints: DampedTrack → LimitRotation\n"
    "  RightEye constraints: CopyRotation(LeftEye, invertZ) → LimitRotation\n"
    "  Saved: vrm_eye_lookat_rig.blend"
)
