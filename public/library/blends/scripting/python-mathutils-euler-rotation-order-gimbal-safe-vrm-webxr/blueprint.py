"""
mathutils.Euler — Rotation Order, Gimbal Detection & VRM Rig Mode Audit
========================================================================
mathutils.Euler(angles, order) stores three radian angles plus a letter-pair
sequence that controls the order in which those angles compose into a rotation
matrix.  That sequence is not cosmetic: it determines WHICH axis configuration
collapses two rotation degrees of freedom into one — gimbal lock.  Choosing the
wrong order for a given bone produces animations that look correct in Blender's
viewport but exhibit axis-flip artefacts on export or when the FCurve channels
do not match the declared rotation_mode.

The script builds a minimal VRM-style armature (Hips→Spine→Chest→Neck→Head,
UpperArm→LowerArm→Hand), assigns the anatomically optimal rotation mode to each
bone, animates an arm raise to 90° first in XYZ (triggering gimbal) then in YXZ
(clean), logs gimbal severity for every bone, and exports the corrected rig as
a GLB whose quaternion channels are fully populated for WebXR.

WHY THIS MATTERS FOR GLB EXPORT
  The GLTF exporter samples bpy.types.FCurve data paths from the evaluated
  action.  If a bone's rotation_mode is 'QUATERNION' but the action only has
  rotation_euler channels (or vice versa), the exporter finds an empty track and
  emits no animation keyframes for that bone.  The result animates correctly in
  Blender but is frozen at the rest pose in Three.js and Babylon.js.

MIDDLE-AXIS RULE
  For every Euler order XY'Z', the MIDDLE letter (Y' below) is the danger axis:
    XYZ → middle Y   gimbal when Y ≈ ±90°   classic arm-raise freeze
    XZY → middle Z   gimbal when Z ≈ ±90°
    YXZ → middle X   gimbal when X ≈ ±90°   safe for arm raise on Y
    YZX → middle Z   gimbal when Z ≈ ±90°
    ZXY → middle X   gimbal when X ≈ ±90°
    ZYX → middle Y   gimbal when Y ≈ ±90°

Blender 5.1 notes
  - PoseBone.rotation_mode: 'QUATERNION', 'AXIS_ANGLE', or one of the six
    Euler order strings.  Switching mode mid-animation does NOT auto-convert
    existing keyframe channels — old channels persist (silently unused).
  - mathutils.Euler(angles, order): angles is a 3-tuple of radians; order is
    a 3-char string, e.g. 'YXZ'.
  - Euler.to_quaternion() is always available; reverse: Quaternion.to_euler(order).
  - Euler.to_matrix() returns a 3×3 mathutils.Matrix; combine with
    Matrix.to_euler(order) to reorder without going through quaternion.
  - bpy.context.view_layer.update() after frame_set() flushes constraint chains
    before reading bone world transforms.
"""

import math
import bpy
import mathutils

# ── Parameters ─────────────────────────────────────────────────────────────────
BLEND_PATH    = "//vrm_euler_audit.blend"
GLB_PATH      = "//vrm_euler_audit.glb"
TOTAL_FRAMES  = 90
BONE_LENGTH   = 0.35
GIMBAL_THRESHOLD = 0.95   # sin(~71.8°) — approaching ±90° middle axis

# Optimal rotation mode per VRM bone group
ROTATION_MODES: dict[str, str] = {
    "Hips":     "QUATERNION",   # full 360° freedom, all axes simultaneously
    "Spine":    "QUATERNION",
    "Chest":    "QUATERNION",
    "Neck":     "QUATERNION",
    "Head":     "QUATERNION",
    "UpperArm": "YXZ",          # primary raise is Y — NOT the middle axis in YXZ
    "LowerArm": "XYZ",          # hinge joint, bends only on X; Y/Z rarely ≥90°
    "Hand":     "YXZ",          # wrist curl primary Y, avoids XYZ gimbal
}

# Index of the middle (gimbal-prone) axis for each Euler order
_MIDDLE: dict[str, int] = {
    "XYZ": 1, "XZY": 2, "YXZ": 0, "YZX": 2, "ZXY": 0, "ZYX": 1,
}


# ── Gimbal detection ────────────────────────────────────────────────────────────
def gimbal_severity(pb: bpy.types.PoseBone) -> float:
    """
    Returns 0–1 measuring how close the current pose is to gimbal lock.
    sin(middle_angle) → 1 as that angle approaches ±π/2.
    Always 0 for QUATERNION or AXIS_ANGLE modes.
    """
    mode = pb.rotation_mode
    if mode in {"QUATERNION", "AXIS_ANGLE"}:
        return 0.0
    return abs(math.sin(pb.rotation_euler[_MIDDLE[mode]]))


def audit_rig(arm_obj: bpy.types.Object) -> None:
    rows = [(pb.name, pb.rotation_mode, gimbal_severity(pb))
            for pb in arm_obj.pose.bones]
    rows.sort(key=lambda r: r[2], reverse=True)
    print(f"\n{'Bone':<16} {'Mode':<12} {'Gimbal severity'}")
    print("─" * 45)
    for name, mode, sev in rows:
        tag = " ⚠" if sev > GIMBAL_THRESHOLD else ""
        print(f"  {name:<14} {mode:<12} {sev:.3f}{tag}")


# ── Scene helpers ───────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def build_rig() -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "VRM_Skeleton"
    arm_obj.data.display_type = "STICK"
    arm_obj.show_in_front = True
    arm = arm_obj.data

    for b in list(arm.edit_bones):
        arm.edit_bones.remove(b)

    BL = BONE_LENGTH

    def eb(name, head, tail, parent=None, connect=True):
        bone = arm.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent:
            bone.parent = arm.edit_bones[parent]
            bone.use_connect = connect
        return bone

    # Spine chain (+Z up, in line)
    eb("Hips",     (0,0,BL*0), (0,0,BL*1))
    eb("Spine",    (0,0,BL*1), (0,0,BL*2),   "Hips")
    eb("Chest",    (0,0,BL*2), (0,0,BL*3),   "Spine")
    eb("Neck",     (0,0,BL*3), (0,0,BL*3.6), "Chest")
    eb("Head",     (0,0,BL*3.6),(0,0,BL*4.4),"Neck")

    # Left arm chain (extends +X from Chest shoulder)
    eb("UpperArm", (0,0,BL*3),   (BL,0,BL*3),      connect=False)
    eb("LowerArm", (BL,0,BL*3),  (BL*2,0,BL*3),    "UpperArm")
    eb("Hand",     (BL*2,0,BL*3),(BL*2.6,0,BL*3),  "LowerArm")

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


# ── Rotation mode assignment ────────────────────────────────────────────────────
def assign_modes(arm_obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    for pb in arm_obj.pose.bones:
        if pb.name in ROTATION_MODES:
            pb.rotation_mode = ROTATION_MODES[pb.name]
    bpy.ops.object.mode_set(mode="OBJECT")


# ── Animation demos ─────────────────────────────────────────────────────────────
def _kf_euler(pb, euler, frame):
    pb.rotation_euler = euler
    pb.keyframe_insert("rotation_euler", frame=frame)


def _kf_quat(pb, quat, frame):
    pb.rotation_quaternion = quat
    pb.keyframe_insert("rotation_quaternion", frame=frame)


def animate_xyz_vs_yxz(arm_obj: bpy.types.Object) -> None:
    """
    Frames 1–45:  UpperArm in XYZ, raises Y→90° then adds Z twist.
                  At Y=90° the Z channel becomes coplanar with X — gimbal lock.
    Frames 46–90: UpperArm switched to YXZ, same motions — Y=90° is safe
                  because Y is the FIRST axis in YXZ, not the MIDDLE.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm_obj.pose.bones["UpperArm"]

    # Phase 1 — XYZ (gimbal-prone)
    pb.rotation_mode = "XYZ"
    _kf_euler(pb, mathutils.Euler((0,0,0), "XYZ"), 1)
    _kf_euler(pb, mathutils.Euler((0, math.radians(90), 0), "XYZ"), 22)
    # Adding Z twist at Y=90° lands in same plane as X → gimbal
    _kf_euler(pb, mathutils.Euler((0, math.radians(90), math.radians(45)), "XYZ"), 45)
    print(f"XYZ gimbal severity at Y=90°: "
          f"{gimbal_severity(pb):.3f}  (middle=Y, fully locked)")

    # Phase 2 — YXZ (safe)
    pb.rotation_mode = "YXZ"
    _kf_euler(pb, mathutils.Euler((0,0,0), "YXZ"), 46)
    _kf_euler(pb, mathutils.Euler((0, math.radians(90), 0), "YXZ"), 67)
    # Y=90° in YXZ: middle is X (not Y), no axis collapse
    _kf_euler(pb, mathutils.Euler((math.radians(15), math.radians(90), math.radians(45)), "YXZ"), 90)
    print(f"YXZ gimbal severity at Y=90°: "
          f"{gimbal_severity(pb):.3f}  (middle=X, Y is outer — safe)")

    bpy.ops.object.mode_set(mode="OBJECT")


def animate_spine_quat(arm_obj: bpy.types.Object) -> None:
    """Chest simultaneous tilt+twist via quaternion — zero gimbal risk."""
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm_obj.pose.bones["Chest"]
    _kf_quat(pb, mathutils.Quaternion((1,0,0,0)), 1)
    # 40° Y-tilt + 25° Z-twist: trivially representable, no order dependency
    target = mathutils.Euler((0, math.radians(40), math.radians(25)), "XYZ").to_quaternion()
    _kf_quat(pb, target, 45)
    _kf_quat(pb, mathutils.Quaternion((1,0,0,0)), 90)
    bpy.ops.object.mode_set(mode="OBJECT")


# ── Export ──────────────────────────────────────────────────────────────────────
def export_glb(arm_obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_animations=True,
        export_anim_slide_to_zero=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        use_selection=True,
    )
    print(f"GLB exported → {GLB_PATH}")


# ── Main ────────────────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = TOTAL_FRAMES

clear_scene()
arm_obj = build_rig()
assign_modes(arm_obj)

animate_xyz_vs_yxz(arm_obj)
animate_spine_quat(arm_obj)

bpy.context.view_layer.update()
audit_rig(arm_obj)

bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
export_glb(arm_obj)
