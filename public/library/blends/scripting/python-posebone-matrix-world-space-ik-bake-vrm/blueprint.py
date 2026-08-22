"""
PoseBone Matrix Chain — World-Space Transform Decomposition
& Procedural IK Pose Baking for VRM WebXR

Blender 5.1 | bpy + mathutils | CC0

EXPERT CONTEXT
──────────────
Every pose bone has three distinct matrix properties that are easy to confuse:

  pose_bone.matrix_basis
      The LOCAL delta from rest, in parent-bone space.  This is what you SET
      to drive the pose; it encodes rotation, translation, and scale BEFORE
      any constraints run.  Blender derives it from rotation_quaternion /
      rotation_euler / location / scale when in those rotation modes.

  pose_bone.matrix_channel
      Post-constraint matrix in ARMATURE space (local to the armature object).
      Read-only.  This is the evaluated result after all bone constraints and
      drivers have been applied.

  pose_bone.matrix
      Alias for matrix_channel for most intents.  Writable in Blender 4.x/5.x:
      assigning to it causes Blender to back-compute the required matrix_basis
      from the parent chain.  Use this to set world-targetted poses.

  bone.matrix_local
      The bone's rest pose in armature space.  Static; changes only in Edit Mode.

World-space bone matrix:
  world_mat = arm_obj.matrix_world @ pose_bone.matrix

After writing ANY pose_bone property you MUST call bpy.context.view_layer.update()
before reading any child bone's matrix — the dependency graph is lazy.

This blueprint animates a 3-bone FK arm (Shoulder → UpperArm → Forearm) by
solving a figure-8 IK target analytically (law of cosines), writing the result
to pose_bone.rotation_quaternion each frame, then pushing to an NLA action and
exporting GLB.
"""

import bpy
import math
import mathutils

# ── PARAMETERS ────────────────────────────────────────────────────────────────
ARM_NAME      = "PoseBoneDemo"
ACTION_NAME   = "ArmIKBaked"
GLB_PATH      = "//pose_arm_baked.glb"

BONE_UPPER_LEN = 0.50   # metres — upper arm
BONE_FORE_LEN  = 0.45   # metres — forearm
FRAME_START    = 1
FRAME_END      = 48

# IK target traces a figure-8 (Lissajous) in world XZ
TARGET_X_RADIUS = 0.55
TARGET_Z_RADIUS = 0.35
TARGET_ORIGIN_Z = 0.60  # height above arm root in world Z


# ── 0. SCENE PREP ─────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)


# ── 1. BUILD ARMATURE — 3 bones, rest pointing along +X ──────────────────────
def build_armature():
    bpy.ops.object.armature_add(location=(0, 0, 0))
    arm_obj     = bpy.context.active_object
    arm_obj.name = ARM_NAME
    arm_obj.data.name = ARM_NAME + "_Data"

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_obj.data.edit_bones

    # Shoulder: a short stub at the root so UpperArm has a parent in the chain.
    shoulder      = eb[0]                   # armature_add provides one default bone
    shoulder.name = "Shoulder"
    shoulder.head  = mathutils.Vector((0, 0, 0))
    shoulder.tail  = mathutils.Vector((0.12, 0, 0))

    upper      = eb.new("UpperArm")
    upper.head = mathutils.Vector((0.12, 0, 0))
    upper.tail = mathutils.Vector((0.12 + BONE_UPPER_LEN, 0, 0))
    upper.parent      = shoulder
    upper.use_connect = True     # head snaps to parent tail — no IK gap artefacts

    fore      = eb.new("Forearm")
    fore.head = upper.tail.copy()
    fore.tail = fore.head + mathutils.Vector((BONE_FORE_LEN, 0, 0))
    fore.parent      = upper
    fore.use_connect = True

    bpy.ops.object.mode_set(mode='POSE')
    # QUATERNION mode is required for GLB animation export (no gimbal lock risk).
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'QUATERNION'

    return arm_obj


# ── 2. TWO-BONE IK SOLVER — law of cosines + law of sines ────────────────────
def solve_two_bone_ik(origin: mathutils.Vector,
                      target: mathutils.Vector,
                      l1: float, l2: float):
    """
    Solve a 2-bone chain (l1 = upper arm, l2 = forearm) in the XZ plane.

    Returns (shoulder_global_angle, bend_angle) in radians where:
      shoulder_global_angle — angle of the upper arm from world +X (atan2 convention)
      bend_angle            — forearm local rotation around Y from rest;
                              0 = straight, positive = elbow bends toward +Z

    Law of cosines for angle C at the elbow:
      l1² + l2² − 2·l1·l2·cos(C) = d²   →   cos(C) = (l1²+l2²−d²)/(2·l1·l2)
    When C = π: arm fully extended (d = l1+l2).
    When C → 0: forearm folds back against upper arm.

    bend = π − C  (the local rotation: 0 when straight, π when folded).

    Law of sines for angle B at the shoulder:
      sin(B)/l2 = sin(C)/d   →   B = asin(l2·sin(C)/d)
    Upper arm global angle = atan2(diff.z, diff.x) + B (elbow bends +Z).
    """
    diff = target - origin
    d    = diff.length
    # Clamp to reachable range to keep cos(C) in [−1, 1].
    d = max(0.001, min(d, l1 + l2 - 0.001))

    cos_C = (l1*l1 + l2*l2 - d*d) / (2 * l1 * l2)
    cos_C = max(-1.0, min(1.0, cos_C))
    angle_C = math.acos(cos_C)          # π = extended, 0 = fully bent at elbow
    bend    = math.pi - angle_C         # local rotation for Forearm bone

    # Angle B at shoulder — how far upper arm tilts off the shoulder→target line.
    sin_B = l2 * math.sin(angle_C) / d
    sin_B = max(-1.0, min(1.0, sin_B))
    angle_B = math.asin(sin_B)          # 0 when extended, positive when bent

    shoulder_global = math.atan2(diff.z, diff.x) + angle_B
    return shoulder_global, bend


# ── 3. APPLY POSE — write rotation_quaternion, update depsgraph ──────────────
def apply_pose(arm_obj, shoulder_global: float, bend: float):
    """
    Set UpperArm and Forearm rotations for the given IK solution.

    WHY rotation_quaternion rather than matrix_basis directly:
      Writing to rotation_quaternion is clean when the bone rest pose is
      axis-aligned (+X).  Blender computes matrix_basis automatically.
      Writing matrix_basis directly requires accounting for bone.matrix_local
      (the rest transform in armature space) — more error-prone.

    WHY view_layer.update() is mandatory:
      Blender's dependency graph is lazy.  After writing UpperArm's rotation,
      Forearm's matrix still reflects the OLD parent matrix until the graph
      re-evaluates.  Calling update() flushes the evaluation in topological
      order so subsequent reads of child matrices are correct.
    """
    # Upper arm rotates around −Y to tilt the tip toward +Z.
    arm_obj.pose.bones["UpperArm"].rotation_quaternion = (
        mathutils.Euler((0, -shoulder_global, 0), 'XYZ').to_quaternion()
    )
    # Forearm bends relative to upper arm: 0 = straight, π = folded.
    arm_obj.pose.bones["Forearm"].rotation_quaternion = (
        mathutils.Euler((0, -bend, 0), 'XYZ').to_quaternion()
    )
    # Without this call, Forearm.matrix still caches stale parent data.
    bpy.context.view_layer.update()


# ── 4. MATRIX READ-BACK — world-space decomposition ──────────────────────────
def world_mat_decomposed(arm_obj, bone_name: str):
    """
    Returns (loc, rot, scl) of a bone's world-space transform.

      pose_bone.matrix       — armature-space 4×4 (post-constraint)
      arm_obj.matrix_world   — armature object's world transform
      world_mat              — product = bone world transform

    Matrix4x4.decompose() returns (Vector3, Quaternion, Vector3).
    Prefer decompose() over separate to_translation()/to_quaternion()/to_scale()
    for matrices that may have non-uniform scale: chaining three separate calls
    can produce inconsistent results because each ignores the other components.
    """
    pb        = arm_obj.pose.bones[bone_name]
    arm_mat   = pb.matrix                        # armature-local 4×4
    world_mat = arm_obj.matrix_world @ arm_mat   # world-space 4×4
    return world_mat.decompose()                 # (loc, quat, scale)


# ── 5. ANIMATE — frame loop, IK, keyframe_insert, NLA push ───────────────────
def animate_arm(arm_obj):
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    # Create a fresh Action and bind it.
    arm_obj.animation_data_create()
    action = bpy.data.actions.new(ACTION_NAME)
    arm_obj.animation_data.action = action

    # IK chain origin = UpperArm head in world space.
    bpy.context.view_layer.update()
    ua_head_arma   = arm_obj.pose.bones["UpperArm"].head  # armature-local Vector
    origin_world   = arm_obj.matrix_world @ ua_head_arma

    for frame in range(FRAME_START, FRAME_END + 1):
        scene.frame_set(frame)
        t  = (frame - FRAME_START) / max(1, FRAME_END - FRAME_START)
        # Figure-8: cos for X (one cycle), sin(2·) for Z (two cycles).
        tx = origin_world.x + TARGET_X_RADIUS * math.cos(2 * math.pi * t)
        tz = TARGET_ORIGIN_Z + TARGET_Z_RADIUS * math.sin(4 * math.pi * t)
        target_world = mathutils.Vector((tx, origin_world.y, tz))

        sg, bend = solve_two_bone_ik(origin_world, target_world,
                                     BONE_UPPER_LEN, BONE_FORE_LEN)
        apply_pose(arm_obj, sg, bend)

        arm_obj.pose.bones["UpperArm"].keyframe_insert(
            data_path='rotation_quaternion', frame=frame)
        arm_obj.pose.bones["Forearm"].keyframe_insert(
            data_path='rotation_quaternion', frame=frame)

    # Push baked action to NLA so GLB exporter sees it as a named animation clip.
    tracks = arm_obj.animation_data.nla_tracks
    track  = tracks.new()
    track.name = "IK_Baked"
    strip  = track.strips.new(ACTION_NAME, FRAME_START, action)
    strip.action_frame_start = FRAME_START
    strip.action_frame_end   = FRAME_END

    # Detach the active action slot; NLA strips now drive the animation.
    arm_obj.animation_data.action = None

    return action


# ── 6. GLB EXPORT ─────────────────────────────────────────────────────────────
def export_glb():
    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(GLB_PATH),
        export_format                        = 'GLB',
        use_selection                        = False,
        export_animations                    = True,
        export_bake_animation                = False,  # keyframes already explicit
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
    )


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clear_scene()
    arm_obj = build_armature()
    bpy.context.view_layer.update()

    animate_arm(arm_obj)

    # Read-back world matrices at mid-animation for verification.
    bpy.context.scene.frame_set(24)
    bpy.context.view_layer.update()
    for bn in ("Shoulder", "UpperArm", "Forearm"):
        loc, rot, scl = world_mat_decomposed(arm_obj, bn)
        print(f"{bn:10s}  loc=({loc.x:.3f}, {loc.y:.3f}, {loc.z:.3f})"
              f"  quat=({rot.w:.3f}, {rot.x:.3f}, {rot.y:.3f}, {rot.z:.3f})")

    export_glb()
    print("Exported:", bpy.path.abspath(GLB_PATH))
