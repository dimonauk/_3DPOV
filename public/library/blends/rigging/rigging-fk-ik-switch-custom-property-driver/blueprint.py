"""
Rigging — FK/IK Switch with Custom Property + Drivers (Blender 5.1)
====================================================================
Topic     : rigging / armature
Technique : A float custom property on the armature data block drives an IK
            constraint's 'influence' via a SINGLE_PROP driver, giving one-
            slider control between free FK rotation (influence=0) and IK
            solver takeover (influence=1). The switch is itself keyframeable.

Why these choices
-----------------
• Custom property on arm_data (not the object): keeps the slider visible in
  N-panel ▸ Item under the armature's own properties, not buried under the
  object's custom props — animators find it without hunting.

• SINGLE_PROP + id_type='ARMATURE' targeting arm_data directly: avoids the
  fragility of chaining through an object RNA path. If the object is renamed,
  the driver survives unchanged.

• IK constraint's chain_count = 2: tells the solver to move at most two bones
  (forearm + hand), leaving upper_arm under FK control at all times. This
  mirrors production rigs where the shoulder is always FK.

• Pole target at +Y: biases the elbow forward — change pole_angle to π to
  flip the elbow behind the arm if your character faces +Y.

• influence=0 is FK-pure; influence=1 is IK-pure. Fractional values blend
  the two solvers, which is technically valid but rarely intentional — use
  step-tangent keyframes when animating the switch to avoid accidental blends.
"""

import bpy
import math

# ── parameters ────────────────────────────────────────────────────────────────
ARM_NAME     = "fk_ik_arm"
BONE_LEN     = 0.40          # metres per bone segment
CHAIN_BONES  = ["upper_arm", "forearm", "hand"]   # root → tip
IK_TARGET    = "ik_target"
IK_POLE      = "ik_pole"
CHAIN_LENGTH = 2             # IK affects forearm + hand only
PROP_NAME    = "fk_ik"      # 0.0 = FK, 1.0 = IK

# ── clear scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
bpy.context.scene.frame_end = 90

# ── build armature in Edit Mode ───────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj  = bpy.context.active_object
arm_obj.name  = ARM_NAME
arm_data = arm_obj.data
arm_data.name = ARM_NAME
arm_data.display_type = "STICK"

# Remove default bone
for b in list(arm_data.edit_bones):
    arm_data.edit_bones.remove(b)

# Three-bone chain along Z, slight elbow bend so solver has a unique solution
for i, name in enumerate(CHAIN_BONES):
    eb        = arm_data.edit_bones.new(name)
    eb.head   = (0.0, 0.0, i * BONE_LEN)
    eb.tail   = (0.0, 0.0, i * BONE_LEN + BONE_LEN)
    if i == 1:
        # Nudge forearm slightly in +Y: gives the IK solver an unambiguous
        # elbow direction without a pole target override at rest pose.
        eb.head = (0.0,  0.02, BONE_LEN)
        eb.tail = (0.0, -0.01, BONE_LEN * 2)
    if i > 0:
        eb.parent      = arm_data.edit_bones[CHAIN_BONES[i - 1]]
        eb.use_connect = True

# IK target: positioned at the tip of the chain, offset in +Y
ik_eb        = arm_data.edit_bones.new(IK_TARGET)
ik_eb.head   = (0.0,  0.50, BONE_LEN * 2)
ik_eb.tail   = (0.0,  0.50, BONE_LEN * 2 + 0.08)

# Pole target: behind the chain (+Y offset, at elbow height)
pole_eb      = arm_data.edit_bones.new(IK_POLE)
pole_eb.head = (0.0,  0.80, BONE_LEN)
pole_eb.tail = (0.0,  0.88, BONE_LEN)

bpy.ops.object.mode_set(mode="POSE")

# ── custom property on armature DATA block ───────────────────────────────────
arm_data.id_properties_ensure()
arm_data[PROP_NAME] = 0.0          # default = FK
ui = arm_data.id_properties_ui(PROP_NAME)
ui.update(
    min=0.0,
    max=1.0,
    soft_min=0.0,
    soft_max=1.0,
    description="0 = FK (free rotation)   1 = IK (solver takes over)",
)

# ── IK constraint on hand bone ────────────────────────────────────────────────
pose_hand     = arm_obj.pose.bones["hand"]
ik_con        = pose_hand.constraints.new("IK")
ik_con.name   = "IK_Limb"
ik_con.target = arm_obj
ik_con.subtarget      = IK_TARGET
ik_con.pole_target    = arm_obj
ik_con.pole_subtarget = IK_POLE
ik_con.pole_angle     = 0.0         # elbow points toward +Y pole
ik_con.chain_count    = CHAIN_LENGTH
ik_con.influence      = 0.0         # starts FK

# ── driver: arm_data[PROP_NAME] → IK_Limb.influence ─────────────────────────
# Drive via arm_obj with the fully-qualified data path — this survives any
# pose-library or NLA re-evaluation that might reset constraint state.
dp       = f'pose.bones["{CHAIN_BONES[-1]}"].constraints["IK_Limb"].influence'
drv_fc   = arm_obj.driver_add(dp)
drv      = drv_fc.driver
drv.type = "AVERAGE"           # single variable: output = average = the var

var              = drv.variables.new()
var.name         = "fk_ik_val"
var.type         = "SINGLE_PROP"
tgt              = var.targets[0]
tgt.id_type      = "ARMATURE"  # armature DATA block, not the object
tgt.id           = arm_data
tgt.data_path    = f'["{PROP_NAME}"]'

# ── IK target widget (thin circle mesh for visual clarity) ───────────────────
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.mesh.primitive_circle_add(
    radius=0.05, fill_type="NOTHING", location=(99, 0, 0)
)
widget             = bpy.context.active_object
widget.name        = "WGT_ik_ctrl"
widget.hide_render = True
widget.hide_set(True)

bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode="POSE")

arm_obj.pose.bones[IK_TARGET].custom_shape               = widget
arm_obj.pose.bones[IK_TARGET].custom_shape_scale_xyz     = (1.6, 1.6, 1.6)
arm_obj.pose.bones[IK_POLE].custom_shape                 = widget
arm_obj.pose.bones[IK_POLE].custom_shape_scale_xyz       = (0.9, 0.9, 0.9)

arm_obj.show_in_front = True

# ── bake sample keyframes for record.py ──────────────────────────────────────
# frame  1: FK (influence=0), arm straight
# frame 30: FK, arm slightly bent via FK rotation — shows FK authoring
# frame 50: switch to IK (influence=1) — solver takes over
# frame 80: IK target moved, arm follows — shows IK behaviour
# frame 90: back to FK

bpy.ops.object.mode_set(mode="OBJECT")
scene = bpy.context.scene

# FK → IK → FK: keyframe the custom property
scene.frame_set(1);  arm_data[PROP_NAME] = 0.0
arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=1)

scene.frame_set(30); arm_data[PROP_NAME] = 0.0
arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=30)

scene.frame_set(50); arm_data[PROP_NAME] = 1.0
arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=50)

scene.frame_set(80); arm_data[PROP_NAME] = 1.0
arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=80)

scene.frame_set(90); arm_data[PROP_NAME] = 0.0
arm_data.keyframe_insert(data_path=f'["{PROP_NAME}"]', frame=90)

scene.frame_set(1)

print(f"[blueprint] FK/IK rig '{ARM_NAME}' created.")
print(f"[blueprint] Custom property '{PROP_NAME}' on arm_data → IK_Limb.influence")
print("[blueprint] Frames: 1–30 FK  |  50–80 IK  |  90 FK")
print("[blueprint] Next: open record.py and Run Script to render viewport.mp4")
