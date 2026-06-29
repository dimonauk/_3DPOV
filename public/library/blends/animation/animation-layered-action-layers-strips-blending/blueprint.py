"""
Blender 5.1 — Action Layers & Strips: Additive Layer Blending for VRM Idle Animation
Slug: animation-layered-action-layers-strips-blending

Technique:
  Blender 5.0 restructured the Action data-block with a hierarchy of
  Layers → Strips → ChannelBags → FCurves.  A Layer's blend_mode controls
  how its FCurves combine with layers below it: REPLACE overwrites, ADD
  accumulates on top.  This blueprint builds a three-layer idle performance —
  base sway (REPLACE), chest breathing (ADD), face blink (ADD) — all inside
  one Action, exported as a single baked animation track in the GLB.

Requirements: Blender 5.1+  (Action.layers absent in 4.x)
Output: //output/vrm_layered_idle.glb  (animated character, ~120 frames)
"""

import bpy
import math
import os

# ── constants ────────────────────────────────────────────────────────────────
TOTAL_FRAMES  = 120        # 5 s at 24 fps
SWAY_FREQ     = 60         # frames for one idle sway cycle
BREATHE_FREQ  = 12         # frames for one breath cycle
BLINK_FRAME   = 60         # single blink mid-clip
OUTPUT_GLB    = "//output/vrm_layered_idle.glb"


# ── scene reset ──────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in (*bpy.data.armatures, *bpy.data.actions, *bpy.data.meshes):
        type(blk).bl_rna  # avoid removal-during-iteration; collect first
    for arm in list(bpy.data.armatures): bpy.data.armatures.remove(arm)
    for act in list(bpy.data.actions):   bpy.data.actions.remove(act)


# ── build stand-in character ─────────────────────────────────────────────────
def build_character():
    """Minimal armature + face mesh stand-in for a VRM character."""

    # ── armature: root + ribcage ─────────────────────────────────────────────
    bpy.ops.object.armature_add(enter_editmode=False, location=(0, 0, 0))
    arm_obj = bpy.context.object
    arm_obj.name = "character_body"
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_obj.data.edit_bones
    eb[0].name = "root"
    eb[0].head, eb[0].tail = (0, 0, 0), (0, 0, 1.0)
    rib = eb.new("ribcage")
    rib.head   = (0, 0, 0.45)
    rib.tail   = (0, 0, 0.85)
    rib.parent = eb["root"]
    rib.use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    # Bones default to EULER rotation mode; confirm for FCurve path compatibility
    bpy.ops.object.mode_set(mode="POSE")
    for bone in arm_obj.pose.bones:
        bone.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")

    # ── face sphere with blink shape key ─────────────────────────────────────
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0, 0, 1.12))
    face_obj = bpy.context.object
    face_obj.name = "face_sphere"
    face_obj.shape_key_add(name="Basis")
    blink_sk = face_obj.shape_key_add(name="blink")
    # Flatten eyelid-band vertices for a simple blink silhouette
    for v in face_obj.data.vertices:
        blink_sk.data[v.index].co = v.co.copy()
        if 0.06 < v.co.z < 0.14:
            blink_sk.data[v.index].co.z *= 0.15

    return arm_obj, face_obj


# ── ChannelBag helper ────────────────────────────────────────────────────────
def get_or_create_bag(strip, slot):
    """Return the ChannelBag for *slot* in *strip*, creating one if absent.

    channelbag_for_slot() returns None on a freshly-created strip in some
    5.x builds; fall back to channelbags.new() in that case.
    """
    bag = strip.channelbag_for_slot(slot)
    if bag is None:
        bag = strip.channelbags.new(slot=slot)
    return bag


# ── build layered action ─────────────────────────────────────────────────────
def build_layered_action(arm_obj, face_obj):
    """
    Action structure:
      Layer 0 "base_idle_sway"    REPLACE  → root  rotation_euler[1]  (sway)
      Layer 1 "additive_breath"   ADD      → rib   scale[2]           (chest)
      Layer 2 "additive_blink"    ADD      → face  key_blocks['blink'] (eye)

    ADD layers accumulate on top of REPLACE without clobbering un-keyed channels.
    """
    action = bpy.data.actions.new("char_idle_layered")

    # ── Slots (5.0+ API) ─────────────────────────────────────────────────────
    slot_arm = action.slots.new("OBJECT", "character_body")
    # Shape-key FCurves live on the Key data-block, requiring id_type="KEY"
    slot_key = action.slots.new("KEY",    "face_keys")

    # ── Layer 0: base idle sway (REPLACE) ────────────────────────────────────
    layer_base = action.layers.new(name="base_idle_sway")
    layer_base.blend_mode = "REPLACE"
    layer_base.influence   = 1.0
    strip_base = layer_base.strips.new(type="KEYFRAME")
    bag_base   = get_or_create_bag(strip_base, slot_arm)

    fc_sway = bag_base.fcurves.new(
        data_path='pose.bones["root"].rotation_euler', index=1)
    for f in range(0, TOTAL_FRAMES + 1, 3):
        val = math.sin(f / SWAY_FREQ * math.tau) * 0.08
        kp = fc_sway.keyframe_points.insert(frame=float(f), value=val)
        kp.interpolation = "BEZIER"
    fc_sway.update()

    # ── Layer 1: additive chest breathing (ADD) ───────────────────────────────
    # ADD: value 0.0 = no contribution; positive = adds to base chest scale
    layer_breathe = action.layers.new(name="additive_breath")
    layer_breathe.blend_mode = "ADD"
    layer_breathe.influence   = 0.8
    strip_breathe = layer_breathe.strips.new(type="KEYFRAME")
    bag_breathe   = get_or_create_bag(strip_breathe, slot_arm)

    fc_breathe = bag_breathe.fcurves.new(
        data_path='pose.bones["ribcage"].scale', index=2)
    for f in range(0, TOTAL_FRAMES + 1, 2):
        val = math.sin(f / BREATHE_FREQ * math.tau) * 0.04
        kp = fc_breathe.keyframe_points.insert(frame=float(f), value=val)
        kp.interpolation = "BEZIER"
    fc_breathe.update()

    # ── Layer 2: additive blink (ADD on KEY slot) ─────────────────────────────
    # KEY slot must be the Key data-block's slot — assign to face_obj.data.shape_keys
    layer_blink = action.layers.new(name="additive_blink")
    layer_blink.blend_mode = "ADD"
    layer_blink.influence   = 1.0
    strip_blink = layer_blink.strips.new(type="KEYFRAME")
    bag_blink   = get_or_create_bag(strip_blink, slot_key)

    fc_blink = bag_blink.fcurves.new(
        data_path='key_blocks["blink"].value', index=0)
    for f, val in [(BLINK_FRAME - 2, 0.0), (BLINK_FRAME, 1.0),
                   (BLINK_FRAME + 2, 0.0)]:
        kp = fc_blink.keyframe_points.insert(frame=float(f), value=val)
        kp.interpolation = "BEZIER"
    fc_blink.update()

    return action, slot_arm, slot_key


# ── assign animation data ─────────────────────────────────────────────────────
def assign_action(arm_obj, face_obj, action, slot_arm, slot_key) -> None:
    """Route each ID to its slot so the evaluator reads the correct ChannelBag."""
    arm_obj.animation_data_create()
    arm_obj.animation_data.action      = action
    arm_obj.animation_data.action_slot = slot_arm

    # Shape-key animation lives on the Key data-block, not the mesh object
    key_block = face_obj.data.shape_keys
    key_block.animation_data_create()
    key_block.animation_data.action      = action
    key_block.animation_data.action_slot = slot_key


# ── GLB export ───────────────────────────────────────────────────────────────
def export_glb(arm_obj, face_obj) -> None:
    """The Blender GLTF exporter bakes the evaluated (fully composited)
    animation — all layers merged — into a single AnimationClip.  Three.js
    AnimationMixer will play this as one continuous idle action."""
    os.makedirs(bpy.path.abspath("//output"), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    face_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        use_selection=True,
        export_animations=True,
        export_nla_strips=False,        # direct action, not NLA bake
        export_yup=True,
        export_apply=False,             # keep armature deformation live
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"✓ Exported → {OUTPUT_GLB}")


# ── main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end   = TOTAL_FRAMES
    bpy.context.scene.render.fps  = 24

    reset_scene()
    arm_obj, face_obj           = build_character()
    action, slot_arm, slot_key  = build_layered_action(arm_obj, face_obj)
    assign_action(arm_obj, face_obj, action, slot_arm, slot_key)
    export_glb(arm_obj, face_obj)

    print("Blueprint complete.")
    print(f"  Action layers: {[l.name for l in action.layers]}")
    print(f"  Blend modes:   {[l.blend_mode for l in action.layers]}")
