"""
Python — bpy.ops.nla.bake(): IK-Constrained Pose to Clean FK Keyframes
Blender 5.1 | CC0 — Holoflow Studio

TECHNIQUE:
Build a 3-bone IK arm (shoulder → upper_arm → forearm) driven by an Empty
target. Animate the target along a sweeping arc over 60 frames. Call
bpy.ops.nla.bake(visual_keying=True, clear_constraints=True) to walk every
frame, sample the EVALUATED pose (i.e., what the constraint solver computed)
and write explicit rotation + location F-curves on each bone. Push the baked
action to an NLA strip, then export as GLB.

WHY THIS MATTERS:
glTF 2.0 / VRM runtimes (three-vrm, Babylon.js, PlayCanvas) know nothing about
Blender constraints. They only read keyframe channels. An IK constraint that
looks perfect in the Blender viewport produces a completely static pose in GLB
because the constraint computation is never exported. Baking transfers the
visual output of constraint evaluation into plain F-curves that survive export
unchanged. This is the mandatory last step for any rigged animation going to
WebXR or VRM.

Sources:
  - Blender Manual — NLA Bake: https://docs.blender.org/manual/en/latest/
      editors/nla/introduction.html (CC0 / public domain)
  - KhronosGroup glTF-Blender-IO: https://github.com/KhronosGroup/glTF-Blender-IO
      (Apache-2.0)
  - pixiv/three-vrm: https://github.com/pixiv/three-vrm (MIT) — VRM runtime
      that consumes the GLB produced by this pipeline
"""

import bpy
import math
from mathutils import Vector

# ── PARAMETERS ───────────────────────────────────────────────────────────────
BAKE_START   = 1
BAKE_END     = 60
BONE_LEN     = 0.28       # world-unit length per bone segment
IK_CHAIN     = 2          # bones in the IK chain (upper_arm + forearm)
ACTION_NAME  = "arm_ik_baked_fk"
ARM_NAME     = "ik_arm"
TARGET_NAME  = "ik_target"
EXPORT_PATH  = "//ik_arm_baked.glb"


# ── 0. SCENE RESET ────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    bpy.context.scene.frame_start = BAKE_START
    bpy.context.scene.frame_end   = BAKE_END
    bpy.context.scene.frame_set(BAKE_START)


# ── 1. BUILD ARMATURE ─────────────────────────────────────────────────────────
def build_arm() -> bpy.types.Object:
    """
    3-bone chain in Edit Mode.  +Y is forward (Blender convention pre-export).
    Shoulder stays fixed; upper_arm + forearm are solved by IK.
    Bone tails placed so the chain is fully extended at rest — the IK solver
    needs a non-degenerate starting pose to converge without flipping.
    """
    data = bpy.data.armatures.new(ARM_NAME)
    obj  = bpy.data.objects.new(ARM_NAME, data)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.object.mode_set(mode="EDIT")
    eb = data.edit_bones

    shoulder = eb.new("shoulder")
    shoulder.head = Vector((0, 0, 0))
    shoulder.tail = Vector((0, 0, BONE_LEN))

    upper = eb.new("upper_arm")
    upper.head        = Vector((0, 0, BONE_LEN))
    upper.tail        = Vector((0, BONE_LEN, BONE_LEN))
    upper.parent      = shoulder
    upper.use_connect = True

    forearm = eb.new("forearm")
    forearm.head        = Vector((0, BONE_LEN, BONE_LEN))
    forearm.tail        = Vector((0, BONE_LEN * 2, BONE_LEN))
    forearm.parent      = upper
    forearm.use_connect = True

    bpy.ops.object.mode_set(mode="OBJECT")
    return obj


# ── 2. IK TARGET EMPTY ────────────────────────────────────────────────────────
def build_target() -> bpy.types.Object:
    bpy.ops.object.empty_add(
        type="SPHERE",
        location=(0, BONE_LEN * 2, BONE_LEN),   # wrist-tip rest position
    )
    tgt = bpy.context.active_object
    tgt.name = TARGET_NAME
    return tgt


# ── 3. ADD IK CONSTRAINT ──────────────────────────────────────────────────────
def add_ik(arm: bpy.types.Object, tgt: bpy.types.Object) -> None:
    """
    Attach the IK constraint to the forearm bone (tip of chain).
    chain_count=2 → only upper_arm and forearm participate in IK solving;
    shoulder is excluded and remains at its rest rotation.
    """
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones["forearm"]
    c  = pb.constraints.new("IK")
    c.target      = tgt
    c.chain_count = IK_CHAIN
    bpy.ops.object.mode_set(mode="OBJECT")


# ── 4. ANIMATE THE IK TARGET ──────────────────────────────────────────────────
def animate_target(tgt: bpy.types.Object) -> None:
    """
    Five waypoints in a wide arc so the IK solver must produce varying
    shoulder/elbow angles — worth baking, not just a straight-line twitch.
    The loop-back (frame 1 == frame 60) makes the resulting action loop-ready
    for WebXR idle cycles.
    """
    arc = {
        1:  (0,           BONE_LEN * 2,     BONE_LEN),
        15: (BONE_LEN,    BONE_LEN * 1.5,   BONE_LEN * 0.5),
        30: (BONE_LEN,    BONE_LEN,          BONE_LEN * 1.8),
        45: (-BONE_LEN,   BONE_LEN * 1.5,   BONE_LEN * 1.5),
        60: (0,           BONE_LEN * 2,     BONE_LEN),
    }
    for f, pos in arc.items():
        bpy.context.scene.frame_set(f)
        tgt.location = Vector(pos)
        tgt.keyframe_insert("location", frame=f)

    for fc in tgt.animation_data.action.fcurves:
        mod = fc.modifiers.new("CYCLES")
        mod.mode_before = "REPEAT"
        mod.mode_after  = "REPEAT"


# ── 5. SELECT ALL BONES FOR BAKING ───────────────────────────────────────────
def select_pose_bones(arm: bpy.types.Object) -> None:
    """
    nla.bake(only_selected=True) reads which bones are selected in Pose Mode.
    Switch to Pose Mode and select all here.  The function leaves the object
    in Pose Mode because nla.bake requires it as the active context.
    """
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")


# ── 6. BAKE IK → FK ───────────────────────────────────────────────────────────
def bake_ik_to_fk(arm: bpy.types.Object) -> bpy.types.Action:
    """
    PARAMETER BREAKDOWN — every flag matters:

    visual_keying=True  ← THE critical flag.
        Samples arm.evaluated_get(depsgraph) at each frame, reading the FINAL
        world transform AFTER the IK constraint has run.  False reads raw bone
        channel values before constraint evaluation — useless for IK baking.

    clear_constraints=True
        Removes the IK constraint from every baked bone after the loop.
        Without this, playback re-applies the IK constraint on top of the new
        FK keyframes, causing double-transformation (the pose moves twice).
        Set False only when you want to KEEP the rig interactive after baking
        (rare; only for iterative workflows where you bake + re-rig repeatedly).

    clear_parents=False
        Preserves the bone parent chain.  True would detach bones, destroying
        the skeleton hierarchy required by glTF skins and VRM HumanoidBones.

    use_current_action=False
        Creates a NEW action instead of writing into the object's current action.
        The IK target's keyframe action and the baked FK action stay separate.

    only_selected=True
        Restricts baking to the bones selected in step 5.  In a full character
        rig, you often only want to bake the IK-driven limb, leaving facial
        bones on their original drivers untouched.

    bake_types={'POSE'}
        Bakes armature pose channels (bone rotations, locations, scales).
        'OBJECT' bakes the object's own transforms instead — wrong for rigs.
    """
    bpy.context.view_layer.objects.active = arm

    with bpy.context.temp_override(
        active_object    = arm,
        selected_objects = [arm],
        mode             = "POSE",
    ):
        bpy.ops.nla.bake(
            frame_start        = BAKE_START,
            frame_end          = BAKE_END,
            only_selected      = True,
            visual_keying      = True,
            clear_constraints  = True,
            clear_parents      = False,
            use_current_action = False,
            bake_types         = {"POSE"},
        )

    act = arm.animation_data.action
    if act is None:
        raise RuntimeError("[HOLOFLOW] bake produced no action. "
                           "Ensure bones are selected in Pose Mode.")
    act.name = ACTION_NAME
    print(f"[HOLOFLOW] Baked {len(act.fcurves)} F-curves → '{act.name}'")
    return act


# ── 7. PUSH TO NLA STRIP ──────────────────────────────────────────────────────
def push_to_nla(arm: bpy.types.Object, act: bpy.types.Action) -> None:
    """
    Pushing the action to an NLA strip is the correct VRM/GLB workflow:
      - arm.animation_data.action → active action slot (only one at a time)
      - NLA tracks  → stack of named strips, each holding an Action reference

    After push-down the active slot (animation_data.action) becomes None; the
    action lives at animation_data.nla_tracks[0].strips[0].action.
    Exporting with export_nla_strips=True turns each strip into a separate glTF
    animation clip — three-vrm's AnimationClip system can then play them by name.
    """
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    arm.animation_data.action = act      # re-attach so pushdown sees it

    with bpy.context.temp_override(
        active_object    = arm,
        selected_objects = [arm],
    ):
        bpy.ops.nla.action_pushdown(channel_index=0)

    track = arm.animation_data.nla_tracks[0]
    strip = track.strips[0]
    strip.name        = ACTION_NAME
    strip.use_cyclic  = True    # loop flag propagates to glTF animation.extras


# ── 8. GLB EXPORT ─────────────────────────────────────────────────────────────
def export_glb(arm: bpy.types.Object) -> None:
    """
    export_animations=True    → include glTF animations
    export_nla_strips=True    → each NLA strip → separate glTF animation
    export_apply=False        → MUST be False for skinned rigs; True would
                                flatten the skeleton into a static mesh,
                                destroying bone hierarchy and vertex weights
    export_skins=True         → skeleton hierarchy → glTF skin (required for
                                runtime deformation by three-vrm / Babylon.js)
    """
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath                            = bpy.path.abspath(EXPORT_PATH),
        use_selection                       = True,
        export_format                       = "GLB",
        export_animations                   = True,
        export_nla_strips                   = True,
        export_apply                        = False,
        export_skins                        = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                 = "WEBP",
        export_yup                          = True,
    )
    print(f"[HOLOFLOW] GLB → {bpy.path.abspath(EXPORT_PATH)}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    arm = build_arm()
    tgt = build_target()
    add_ik(arm, tgt)
    animate_target(tgt)
    select_pose_bones(arm)          # leaves arm in Pose Mode
    act = bake_ik_to_fk(arm)
    push_to_nla(arm, act)
    export_glb(arm)
    bpy.ops.wm.save_as_mainfile(
        filepath=bpy.path.abspath("//ik_arm_baked.blend")
    )
    print("[HOLOFLOW] Complete. IK baked to FK, NLA strip created, GLB exported.")


if __name__ == "__main__":
    main()
