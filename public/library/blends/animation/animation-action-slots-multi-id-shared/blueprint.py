"""
Action Slots — Multi-ID Shared Action  (Blender 5.1)
=====================================================

TECHNIQUE
---------
Blender 5.0 redesigned the Action data-block with a "slot" system.
Previously each Action held FCurves for exactly one ID type; sharing
an Action across objects caused all objects to receive all channels,
requiring careful data-path filtering to avoid cross-contamination.

Now a single Action carries multiple *slots*.  Each slot is an
ActionSlot — a named, typed container tagged to one animatable ID
(OBJECT, KEY, MATERIAL …).  An object's AnimData.action_slot pointer
decides which slot that ID reads.  FCurves are stored per-slot in
ChannelBag objects within the Action's layer/strip structure.

Practical payoff: one Action = one NLA strip = one export unit.
A character performance — armature, facial shape keys, handheld prop
— lives in THREE slots of a SINGLE Action, so:
  • the NLA strip is one bar, not three;
  • solo/mute, time-scale, and blend-mode apply to everything at once;
  • .blend export bundles the whole performance as one datablock.

This blueprint builds the demonstration scene:
  body_rig    2-bone forearm armature (shoulder → forearm)
  sword_prop  cube stand-in for a handheld prop
  face_mesh   plane with jaw_open + brow_raise shape keys

All three are keyframed inside ONE Action ("perf_01") using THREE
slots routed via AnimData.action_slot.

API NOTE
--------
Action.slots was introduced in Blender 5.0.  If running on an earlier
build, AnimData.action_slot does not exist — assign action only and
all fcurves land in a single default slot (backward-compatible mode).
Verify the exact channelbag-level API with:
    bpy.data.actions["perf_01"].slots
in the Python Console; slot.handle, slot.name, and slot.identifier
are the stable properties across 5.0 → 5.1.
"""

import bpy
import math

# ─────────────────────────────────────────────────────────────
#  CONSTANTS — edit these before running
# ─────────────────────────────────────────────────────────────
ACTION_NAME    = "perf_01"
ARM_NAME       = "body_rig"
PROP_NAME      = "sword_prop"
FACE_NAME      = "face_mesh"
ANIM_END       = 60    # total frames
PROP_RISE_F    = 20    # frame the prop rises to peak
PROP_LOWER_F   = 50    # frame the prop begins returning
JAW_PEAK_F     = 25
BROW_PEAK_F    = 45


# ─────────────────────────────────────────────────────────────
#  SCENE SETUP
# ─────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    # Purge orphaned data-blocks left from previous runs
    for blk in (
        list(bpy.data.actions)
        + list(bpy.data.armatures)
        + list(bpy.data.meshes)
    ):
        try:
            bpy.data.batch_remove([blk])
        except Exception:
            pass  # already removed transitively


def build_armature() -> bpy.types.Object:
    """
    2-bone forearm rig.  Root bone (shoulder) at origin, forearm child
    connected at the tip.  Kept minimal so the slot routing is the
    focus, not armature complexity.
    """
    bpy.ops.object.armature_add(enter_editmode=True)
    arm_obj = bpy.context.active_object
    arm_obj.name = ARM_NAME
    arm_obj.data.name = ARM_NAME

    eb = arm_obj.data.edit_bones
    shoulder = eb[0]
    shoulder.name = "shoulder"
    shoulder.head = (0.0, 0.0, 0.0)
    shoulder.tail = (0.0, 0.0, 0.4)

    forearm = eb.new("forearm")
    forearm.head = (0.0, 0.0, 0.4)
    forearm.tail = (0.0, 0.0, 0.8)
    forearm.parent = shoulder
    forearm.use_connect = True

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def build_prop() -> bpy.types.Object:
    """Cube stand-in for a sword or wand prop at the hand position."""
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0.15, 0.0, 0.8))
    prop = bpy.context.active_object
    prop.name = PROP_NAME
    return prop


def build_face_mesh() -> bpy.types.Object:
    """
    Plane with two shape keys.  In a real VRM character this would be
    the head mesh; here a quad plane demonstrates the KEY slot type
    without needing a full character.
    """
    bpy.ops.mesh.primitive_plane_add(size=0.4, location=(0.0, -0.6, 0.4))
    face = bpy.context.active_object
    face.name = FACE_NAME

    # Basis shape — always required as the first key
    face.shape_key_add(name="Basis")

    jaw = face.shape_key_add(name="jaw_open")
    for v in jaw.data:
        v.co.z -= 0.08      # lower jaw vertices

    brow = face.shape_key_add(name="brow_raise")
    for v in brow.data:
        v.co.z += 0.05      # raise brow vertices

    return face


# ─────────────────────────────────────────────────────────────
#  ACTION + SLOT CONSTRUCTION  (Blender 5.0+ API)
# ─────────────────────────────────────────────────────────────
def build_multi_slot_action(
    arm_obj:  bpy.types.Object,
    prop_obj: bpy.types.Object,
    face_obj: bpy.types.Object,
) -> tuple:
    """
    Create one Action, three slots, route each ID to its slot.

    The slot id_type argument is an RNA short name:
        "OBJECT"   for bpy.types.Object (armature wrapper, prop …)
        "KEY"      for bpy.types.Key (the shape-key data-block)
        "MATERIAL" for bpy.types.Material (shader animation)
    The name argument is a human label — it does not need to match
    the object's Blender name, but matching it makes the Dope Sheet
    readable.

    AnimData.action_slot routes the ID to one slot so that
    keyframe_insert() calls on that ID write FCurves only into
    that slot's ChannelBag.  Objects sharing the same Action but
    assigned to different slots never see each other's channels.
    """
    action = bpy.data.actions.new(ACTION_NAME)

    # ── Armature object slot ─────────────────────────────────
    slot_arm = action.slots.new("OBJECT", ARM_NAME)
    arm_obj.animation_data_create()
    arm_obj.animation_data.action      = action
    arm_obj.animation_data.action_slot = slot_arm

    # ── Prop object slot ─────────────────────────────────────
    slot_prop = action.slots.new("OBJECT", PROP_NAME)
    prop_obj.animation_data_create()
    prop_obj.animation_data.action      = action
    prop_obj.animation_data.action_slot = slot_prop

    # ── Shape-key slot  ──────────────────────────────────────
    # Shape keys animate on the Key data-block (face_obj.data.shape_keys),
    # NOT on the mesh object.  Assigning the action here means the Dope
    # Sheet shows shape-key curves under the "Key" icon, not the mesh icon.
    slot_key = action.slots.new("KEY", FACE_NAME + "_keys")
    key_block = face_obj.data.shape_keys
    key_block.animation_data_create()
    key_block.animation_data.action      = action
    key_block.animation_data.action_slot = slot_key

    return action, slot_arm, slot_prop, slot_key


# ─────────────────────────────────────────────────────────────
#  KEYFRAME INSERTION
# ─────────────────────────────────────────────────────────────
def key_armature(arm_obj: bpy.types.Object) -> None:
    """
    Rotate the forearm bone 0 → 60° → 0° over 60 frames.

    keyframe_insert() resolves the target slot from
    animation_data.action_slot — no extra argument is needed.
    The FCurve data path 'pose.bones["forearm"].rotation_euler'
    is written into slot_arm's ChannelBag, invisible to other slots.
    """
    sc = bpy.context.scene
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")
    bone = arm_obj.pose.bones["forearm"]
    bone.rotation_mode = "XYZ"

    for frame, angle_deg in [(1, 0.0), (30, 60.0), (ANIM_END, 0.0)]:
        sc.frame_set(frame)
        bone.rotation_euler[2] = math.radians(angle_deg)
        bone.keyframe_insert("rotation_euler", frame=frame)

    bpy.ops.object.mode_set(mode="OBJECT")


def key_prop(prop_obj: bpy.types.Object) -> None:
    """
    Prop rises 0.4 m on frame PROP_RISE_F, holds, returns on PROP_LOWER_F.
    The 'hold' is implicit: same keyframe value at PROP_RISE_F and
    PROP_LOWER_F produces a constant plateau with the default bezier handles.
    """
    base_z = prop_obj.location.z

    for frame, z_offset in [
        (1, 0.0),
        (PROP_RISE_F, 0.4),
        (PROP_LOWER_F, 0.4),   # hold
        (ANIM_END, 0.0),
    ]:
        bpy.context.scene.frame_set(frame)
        prop_obj.location.z = base_z + z_offset
        prop_obj.keyframe_insert("location", frame=frame)


def key_shape_keys(face_obj: bpy.types.Object) -> None:
    """
    jaw_open: peaks on JAW_PEAK_F, fully closed by frame 40.
    brow_raise: peaks on BROW_PEAK_F, returns to 0 at end.
    Both write into slot_key's ChannelBag because the Key data-block
    has action_slot pointing at slot_key.
    """
    kb = face_obj.data.shape_keys.key_blocks

    def kf(key_name: str, frame: int, value: float) -> None:
        kb[key_name].value = value
        kb[key_name].keyframe_insert("value", frame=frame)

    kf("jaw_open",  1,            0.0)
    kf("jaw_open",  JAW_PEAK_F,   1.0)
    kf("jaw_open",  40,           0.0)

    kf("brow_raise", 1,           0.0)
    kf("brow_raise", BROW_PEAK_F, 1.0)
    kf("brow_raise", ANIM_END,    0.0)


# ─────────────────────────────────────────────────────────────
#  GLB EXPORT  (prop with baked location animation)
# ─────────────────────────────────────────────────────────────
def export_prop(prop_obj: bpy.types.Object) -> None:
    """
    Export the prop as a standalone GLB.  The armature and face mesh
    remain .blend-resident; this GLB carries only the prop's location
    animation so it can be loaded independently in Three.js / WebXR.
    """
    bpy.ops.object.select_all(action="DESELECT")
    prop_obj.select_set(True)
    bpy.context.view_layer.objects.active = prop_obj
    bpy.ops.export_scene.gltf(
        filepath          = "//output/sword_prop_anim.glb",
        use_selection     = True,
        export_apply      = True,
        export_yup        = True,
        export_animations = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print("Exported: //output/sword_prop_anim.glb")


# ─────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    arm_obj  = build_armature()
    prop_obj = build_prop()
    face_obj = build_face_mesh()

    action, slot_arm, slot_prop, slot_key = build_multi_slot_action(
        arm_obj, prop_obj, face_obj
    )

    key_armature(arm_obj)
    key_prop(prop_obj)
    key_shape_keys(face_obj)

    bpy.context.scene.frame_end = ANIM_END
    bpy.context.scene.frame_set(1)

    export_prop(prop_obj)

    # Inspect the result in the Python Console
    print("\n=== Action Slots Summary ===")
    print(f"Action : {action.name}")
    for sl in action.slots:
        print(f"  slot '{sl.name}' | handle={sl.handle} | id_type={sl.identifier[:2]}")
    print("============================\n")


main()
