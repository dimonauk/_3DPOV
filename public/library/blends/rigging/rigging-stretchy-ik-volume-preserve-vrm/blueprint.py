"""
Blender 5.1  —  Rigging: Stretchy IK + Volume Preservation for VRM Elastic Limbs
Slug    : rigging-stretchy-ik-volume-preserve-vrm
Topic   : rigging
Licence : CC0 — no rights reserved

Technique ─────────────────────────────────────────────────────────────────────
  Blender's IK constraint exposes a per-bone `ik_stretch` float ∈ [0, 1].
  When the IK target moves beyond the chain's reach, bones whose ik_stretch
  > 0 may scale their local Y axis (along-bone direction) past 1.0 to close
  the gap.  Without correction the skin looks like a thinning rubber tube.

  The fix is a volume-preservation driver on every stretchy deform bone:
      X_scale = Z_scale = Y_scale ^ (-0.5)
  This expression is derived from conservation of volume:
      X * Y * Z = 1  →  X = Z = Y^(-0.5)
  so as Y doubles, X and Z shrink to ~0.707 — area stays constant.

  A custom property "volume_preserve" ∈ [0, 1] blends from pure tube thinning
  (0) to perfect volume compensation (1), giving animators stylistic control.
  The driver expression:
      (1 - vp) + vp * max(yscale, 0.001) ** -0.5

  Pipeline note: when baking the armature to keyframes for GLB export,
  Blender evaluates all drivers per-frame, so the X/Z scale values land in
  the NLA bake and export correctly as per-bone TRS data.  Three.js and the
  WebXR runtime read bone scale from glTF animation tracks — no custom shader
  needed.

Outside sources ────────────────────────────────────────────────────────────────
  Blender Python API — bpy.types.BoneIKConstraint
  https://docs.blender.org/api/5.1/bpy.types.BoneIKConstraint.html
  CC-BY-SA 4.0, Blender Documentation Team

  Blender Manual — Rigging → IK: Introduction
  https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html
  CC-BY-SA 4.0, Blender Documentation Team
"""

import bpy
from mathutils import Vector

# ── named constants ────────────────────────────────────────────────────────────
UPPER_LEN      = 0.35   # metres, upper arm
FORE_LEN       = 0.30   # metres, forearm
HAND_LEN       = 0.07   # metres, hand stub
IK_CHAIN       = 2      # bones in IK chain: forearm → upper_arm
IK_STRETCH     = 0.80   # per-bone stretch limit (0=rigid, 1=fully stretchy)
VOL_PRESERVE   = 1.0    # initial value of volume_preserve custom prop
GLB_OUT        = "//stretchy_ik_vrm.glb"


# ── scene reset ────────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for orphan in (bpy.data.armatures, bpy.data.meshes, bpy.data.materials,
                   bpy.data.actions):
        for item in list(orphan):
            orphan.remove(item)


reset_scene()

# ── armature ───────────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new("ElasticArm")
arm_obj  = bpy.data.objects.new("ElasticArm", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.object.mode_set(mode="EDIT")
eb = arm_data.edit_bones


def add_bone(name, head, tail, parent=None, connected=False, deform=True):
    b = eb.new(name)
    b.head       = Vector(head)
    b.tail       = Vector(tail)
    b.use_deform = deform
    if parent:
        b.parent      = eb[parent]
        b.use_connect = connected
    return b


# deform chain — all pointing +Z (vertical arm for clear viewport view)
add_bone("upper_arm.DEF",
         (0, 0, 0),
         (0, 0, UPPER_LEN))

add_bone("forearm.DEF",
         (0, 0, UPPER_LEN),
         (0, 0, UPPER_LEN + FORE_LEN),
         parent="upper_arm.DEF", connected=True)

add_bone("hand.DEF",
         (0, 0, UPPER_LEN + FORE_LEN),
         (0, 0, UPPER_LEN + FORE_LEN + HAND_LEN),
         parent="forearm.DEF", connected=True)

# IK control — non-deforming, no parent, starts at forearm tip
# Offset in X so the initial IK solve is non-trivial and stretch is visible
IK_HEAD = (0.04, 0, UPPER_LEN + FORE_LEN)
add_bone("hand.IK",
         IK_HEAD,
         (IK_HEAD[0], IK_HEAD[1], IK_HEAD[2] + HAND_LEN),
         deform=False)

# shoulder root — non-deforming, visual anchor
add_bone("shoulder.CTRL",
         (0, 0, -0.12),
         (0, 0, 0.0),
         deform=False)

bpy.ops.object.mode_set(mode="POSE")
pb = arm_obj.pose.bones


# ── IK constraint ──────────────────────────────────────────────────────────────
ik_con             = pb["forearm.DEF"].constraints.new("IK")
ik_con.target      = arm_obj
ik_con.subtarget   = "hand.IK"
ik_con.chain_count = IK_CHAIN
ik_con.use_stretch = True   # MUST be True for ik_stretch to have any effect

# Per-bone stretch weight: 0.8 lets the chain extend 80 % of what is needed
# to reach the target.  0 = rigid; 1 = unlimited stretch.
pb["upper_arm.DEF"].ik_stretch = IK_STRETCH
pb["forearm.DEF"].ik_stretch   = IK_STRETCH


# ── custom property: volume_preserve ──────────────────────────────────────────
# Stored on the object so the property shows in Properties → Object.
arm_obj["volume_preserve"] = VOL_PRESERVE
ui = arm_obj.id_properties_ui("volume_preserve")
ui.update(
    min=0.0, max=1.0,
    description="Blend between tube-thinning (0) and volume-compensating (1) stretch",
)


# ── volume-preservation drivers ───────────────────────────────────────────────
def add_volume_driver(obj, bone_name: str, axis: int) -> None:
    """
    Drive pose_bone.scale[axis] (0=X, 2=Z) with the volume formula.
    Expression: (1-vp) + vp * max(yscale, 0.001)^-0.5
    The max(...) guard prevents ZeroDivisionError when the bone collapses.
    """
    data_path = f'pose.bones["{bone_name}"].scale'
    fcurve    = obj.driver_add(data_path, axis)
    drv       = fcurve.driver
    drv.type  = "SCRIPTED"

    # Variable 1: the same bone's Y scale (along-bone stretch factor)
    v_y = drv.variables.new()
    v_y.name            = "yscale"
    v_y.type            = "SINGLE_PROP"
    v_y.targets[0].id        = obj
    v_y.targets[0].data_path = f'pose.bones["{bone_name}"].scale[1]'

    # Variable 2: the volume_preserve custom prop on the armature object
    v_vp = drv.variables.new()
    v_vp.name            = "vp"
    v_vp.type            = "SINGLE_PROP"
    v_vp.targets[0].id        = obj
    v_vp.targets[0].data_path = '["volume_preserve"]'

    drv.expression = "(1-vp) + vp * max(yscale, 0.001)**-0.5"


for bone_name in ("upper_arm.DEF", "forearm.DEF"):
    add_volume_driver(arm_obj, bone_name, 0)   # X
    add_volume_driver(arm_obj, bone_name, 2)   # Z


# ── simple arm mesh (cylinder) ─────────────────────────────────────────────────
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.04,
    depth=UPPER_LEN + FORE_LEN,
    location=(0, 0, (UPPER_LEN + FORE_LEN) / 2),
)
cyl          = bpy.context.active_object
cyl.name     = "arm_mesh"

# Parent to armature with automatic weights
bpy.ops.object.select_all(action="DESELECT")
cyl.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")


# ── quick keyframe animation (rest → stretch → rest) ──────────────────────────
bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode="POSE")

scene         = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 60

# Frame 1 — rest: IK target at default position (no stretch needed)
scene.frame_set(1)
ik_bone = pb["hand.IK"]
ik_bone.location = (0, 0, 0)
ik_bone.keyframe_insert("location", frame=1)

# Frame 30 — fully stretched: move IK target 0.22 m above chain's total reach
REACH = UPPER_LEN + FORE_LEN
scene.frame_set(30)
ik_bone.location = (0, 0, REACH * 0.28)   # pushes chain past its natural reach
ik_bone.keyframe_insert("location", frame=30)

# Frame 60 — return to rest
scene.frame_set(60)
ik_bone.location = (0, 0, 0)
ik_bone.keyframe_insert("location", frame=60)


# ── studio tags ───────────────────────────────────────────────────────────────
bpy.ops.object.mode_set(mode="OBJECT")
arm_obj["holoflow:facet"]    = False
arm_obj["holoflow:rig_type"] = "vrm_arm_stretchy"


# ── GLB export (baked skins + animation) ──────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
arm_obj.select_set(True)
cyl.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    use_selection=True,
    export_format="GLB",
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_yup=True,
    export_skins=True,
    export_animations=True,
    export_force_sampling=True,   # bakes all drivers to keyframes per-frame
    export_bake_animation=True,
)
print(f"Exported → {GLB_OUT}")
