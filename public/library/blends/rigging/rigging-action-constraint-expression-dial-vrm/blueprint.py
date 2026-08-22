"""
Rigging — Action Constraint: Expression Dial VRM Face Rig
Blender 5.1  |  Holoflow Studio Library
=======================================================
The Action Constraint maps a single bone's transform channel to frames of a
stored Action, turning pose into a playhead scrub over any pre-recorded set of
animated properties.  One "expression dial" bone drives:
  • secondary bone rotations  (brow tilt, lip-corner lift)
  • shape-key blendshapes     (via RNA drivers — reason below)

Why not just use drivers?
  Drivers link ONE output to ONE input.  An Action Constraint links ONE input to
  an arbitrary number of animated channels in a single Action block — the correct
  primitive when a single expression must move 10+ targets simultaneously.

Why shape keys are separate:
  The Action Constraint runs during POSE depsgraph evaluation on the armature.
  Shape-key data lives on the mesh object.  An armature-side Action cannot write
  mesh-object property values during the same depsgraph pass.  Clean split:
    • Bone pose → Action Constraint (frame scrub over bone fcurves)
    • Shape key values → RNA drivers reading the same CTRL bone rotation
"""

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────────
MESH_NAME        = "head_low"
ARMATURE_NAME    = "rig_face_expr"
ACTION_NAME      = "happy_expression"

CTRL_BONE        = "CTRL_expression"
DEF_BROW_L       = "DEF_brow_L"
DEF_CORNER_L     = "DEF_mouth_corner_L"
DEF_CORNER_R     = "DEF_mouth_corner_R"

SK_BASIS         = "Basis"
SK_BROW          = "brow_raise"
SK_SMILE         = "mouth_smile"

ACTION_F_START   = 0      # frame 0 = neutral pose
ACTION_F_PEAK    = 30     # frame 30 = full happy expression

CTRL_ROT_NEUTRAL = 0.0
CTRL_ROT_PEAK    = math.radians(45)   # 45° Y-rotation = full expression


# ── Helpers ──────────────────────────────────────────────────────────────────

def _clean():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def _add_linear_fcurve(action, data_path, index, kfs):
    """Insert a linear fcurve; kfs = [(frame, value), ...]."""
    fc = action.fcurves.new(data_path=data_path, index=index)
    fc.keyframe_points.add(len(kfs))
    for i, (f, v) in enumerate(kfs):
        fc.keyframe_points[i].co = (float(f), float(v))
        fc.keyframe_points[i].interpolation = "LINEAR"
    return fc


# ── 1. Head mesh with shape keys ─────────────────────────────────────────────

def _make_head():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.5, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = obj.data.name = MESH_NAME
    obj["holoflow:facet"] = True

    # Basis key — must exist before adding morphs
    obj.shape_key_add(name=SK_BASIS, from_mix=False).interpolation = "KEY_LINEAR"

    # brow_raise: elevate top-front vertices (forehead / brow zone)
    sk_b = obj.shape_key_add(name=SK_BROW, from_mix=False)
    sk_b.interpolation = "KEY_LINEAR"
    sk_b.value = 0.0
    for v in obj.data.vertices:
        if v.co.z > 0.2 and v.co.y < 0:
            sk_b.data[v.index].co = v.co.copy()
            sk_b.data[v.index].co.z += 0.12
            sk_b.data[v.index].co.y -= 0.04

    # mouth_smile: flare lateral-low verts outward and slightly up
    sk_s = obj.shape_key_add(name=SK_SMILE, from_mix=False)
    sk_s.interpolation = "KEY_LINEAR"
    sk_s.value = 0.0
    for v in obj.data.vertices:
        if abs(v.co.x) > 0.25 and v.co.z < -0.1 and v.co.y < 0:
            sign = 1.0 if v.co.x > 0 else -1.0
            sk_s.data[v.index].co = v.co.copy()
            sk_s.data[v.index].co.x += sign * 0.06
            sk_s.data[v.index].co.z += 0.04

    return obj


# ── 2. Armature ───────────────────────────────────────────────────────────────

def _make_armature(head):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    arm = bpy.context.active_object
    arm.name = arm.data.name = ARMATURE_NAME
    ebs = arm.data.edit_bones
    ebs.remove(ebs[0])                # remove Blender's default bone

    def _eb(name, h, t, parent=None, deform=True):
        b = ebs.new(name)
        b.head, b.tail = h, t
        if parent:
            b.parent = ebs[parent]
        b.use_deform = deform
        return b

    _eb("root",       (0,    0,     -0.6), (0,    0,     -0.4), deform=False)
    _eb(DEF_BROW_L,   (-0.18, -0.38, 0.22), (-0.18, -0.38, 0.32), parent="root")
    _eb(DEF_CORNER_L, (-0.28, -0.40, -0.15), (-0.28, -0.40, -0.05), parent="root")
    _eb(DEF_CORNER_R, ( 0.28, -0.40, -0.15), ( 0.28, -0.40, -0.05), parent="root")
    # CTRL bone sits visibly above the head — easy to grab in the viewport
    _eb(CTRL_BONE,    (0, -0.6, 0.7), (0, -0.6, 0.9), parent="root", deform=False)

    bpy.ops.object.mode_set(mode="OBJECT")

    head.parent = arm
    mod = head.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    return arm


# ── 3. Expression Action ──────────────────────────────────────────────────────

def _make_action():
    """
    Bone rotation fcurves only — the Action Constraint evaluates these on the
    armature at pose-eval time.  Frame 0 = neutral, frame 30 = full expression.
    Rotation order for DEF bones: Euler XYZ.
    """
    action = bpy.data.actions.new(ACTION_NAME)

    brow_dp = f'pose.bones["{DEF_BROW_L}"].rotation_euler'
    cl_dp   = f'pose.bones["{DEF_CORNER_L}"].rotation_euler'
    cr_dp   = f'pose.bones["{DEF_CORNER_R}"].rotation_euler'

    # Brow tilts backward (negative X = tip of brow rises)
    _add_linear_fcurve(action, brow_dp, 0, [(ACTION_F_START, 0.0),
                                             (ACTION_F_PEAK, math.radians(-15))])
    # Mouth corners lift (positive Z = upward arc)
    _add_linear_fcurve(action, cl_dp,   2, [(ACTION_F_START, 0.0),
                                             (ACTION_F_PEAK, math.radians(20))])
    _add_linear_fcurve(action, cr_dp,   2, [(ACTION_F_START, 0.0),
                                             (ACTION_F_PEAK, math.radians(20))])
    return action


# ── 4. Shape-key RNA drivers ─────────────────────────────────────────────────

def _wire_shape_key_drivers(arm, head):
    """
    Map CTRL bone Y-rotation [0, CTRL_ROT_PEAK] → shape key value [0, 1].
    Expression: clamp(rot / peak, 0, 1) where rot = local Y rotation in radians.
    This mirrors exactly what the Action Constraint does for bones, but
    evaluated on the mesh object's shape_keys data block instead.
    """
    for sk_name in (SK_BROW, SK_SMILE):
        sk  = head.data.shape_keys.key_blocks[sk_name]
        drv = sk.driver_add("value").driver
        drv.type       = "SCRIPTED"
        drv.expression = f"min(max(rot / {CTRL_ROT_PEAK:.6f}, 0.0), 1.0)"

        var = drv.variables.new()
        var.name                       = "rot"
        var.type                       = "TRANSFORMS"
        var.targets[0].id              = arm
        var.targets[0].bone_target     = CTRL_BONE
        var.targets[0].transform_type  = "ROT_Y"
        var.targets[0].transform_space = "LOCAL_SPACE"


# ── 5. Action Constraint ──────────────────────────────────────────────────────

def _apply_constraint(arm, action):
    """
    Attach the Action Constraint to the root bone.
      target=arm, subtarget=CTRL_BONE reads CTRL_BONE's ROT_Y.
      Range: [CTRL_ROT_NEUTRAL, CTRL_ROT_PEAK] maps to [ACTION_F_START, ACTION_F_PEAK].
      mix_mode='ADD' layers additively — allows stacking multiple expressions
      (happy + surprised) without one overriding the other.
    """
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")

    con = arm.pose.bones["root"].constraints.new("ACTION")
    con.name              = "happy_expression_dial"
    con.action            = action
    con.frame_start       = ACTION_F_START
    con.frame_end         = ACTION_F_PEAK
    con.target            = arm
    con.subtarget         = CTRL_BONE
    con.transform_channel = "ROTATION_Y"
    con.min               = CTRL_ROT_NEUTRAL
    con.max               = CTRL_ROT_PEAK
    con.mix_mode          = "ADD"

    bpy.ops.object.mode_set(mode="OBJECT")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    _clean()
    head   = _make_head()
    arm    = _make_armature(head)
    action = _make_action()
    _apply_constraint(arm, action)
    _wire_shape_key_drivers(arm, head)
    bpy.context.scene.frame_set(1)
    print(f"Rig ready. Select '{CTRL_BONE}', enter Pose Mode, "
          f"rotate Y: 0° = neutral, 45° = full happy.")


main()
