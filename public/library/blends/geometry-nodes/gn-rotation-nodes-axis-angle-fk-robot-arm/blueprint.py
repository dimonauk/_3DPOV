# blueprint.py — GN Rotation Nodes: Axis-Angle FK Robot Arm
# Blender 5.1 | CC0 | Holoflow Studio Library
# https://holoflow.co.uk/tutorials/blender-tutorial-gn-rotation-nodes-axis-angle-fk-robot-arm
#
# TECHNIQUE — FunctionNodeAxisAngleToRotation + FunctionNodeRotateRotation (LOCAL):
#   Pre-4.2 GN rotated geometry by passing a VECTOR (Euler triplet) to
#   TransformGeometry.Rotation.  Euler composition is order-dependent and
#   gimbal-locked — stacking two Vec→Vec rotations means manually re-computing
#   the combined Euler, which breaks at ±90° pitch.
#
#   Blender 4.2 introduced a first-class ROTATION socket type and a full suite
#   of rotation math nodes.  The FK chain uses two key nodes:
#     • AxisAngleToRotation(axis, angle) → Rotation
#         Constructs a quaternion-backed rotation from an intuitive
#         axis-vector + angle pair.  No gimbal risk; axis can be anything.
#     • RotateRotation(R, ByR, space='LOCAL') → Rotation
#         Composes two rotations.  LOCAL means "apply ByR in the frame
#         established by R", i.e.  R_result = R · ByR (right-multiply).
#         This is exactly the FK rule: each joint rotates in its parent's frame.
#
#   Full FK chain for a 3-joint arm:
#     R_yaw   = AxisAngle(Z, yaw)
#     R_yp    = RotateRotation(R_yaw,  R_pitch, LOCAL)   # shoulder bend
#     R_full  = RotateRotation(R_yp,   R_roll,  LOCAL)   # wrist roll
#
#   Part positions use FunctionNodeRotateVector to transform local offsets
#   into world space — the final piece that makes FK compound-correct.
#
# Outside sources:
#   Blender Manual — Axis Angle to Rotation
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/axis_angle_to_rotation.html
#   Licence: CC BY-SA 4.0 | Author: Blender Foundation
#
#   Blender 4.2 Release Notes — Rotation socket + new function nodes
#   https://www.blender.org/download/releases/4-2/
#   Licence: CC BY-SA 4.0 | Author: Blender Foundation
#
# Outputs:
#   output/fk_robot_arm.blend
#   output/fk_robot_arm.glb  (Draco 6, WebP textures, Y-up, root 'fk_robot_arm')

import bpy
import math
from pathlib import Path

# ── parameters ────────────────────────────────────────────────────────────────
GN_NAME       = "HS_FKArm"
OBJ_NAME      = "fk_robot_arm"
OUT_DIR       = "//output"

DEF_YAW       =  30.0   # base rotation around Z  (degrees)
DEF_PITCH     =  40.0   # shoulder bend around Y  (degrees)
DEF_ROLL      =  20.0   # wrist roll around X     (degrees)

BASE_R        = 0.042   # base column radius  (m)
BASE_H        = 0.300   # shoulder joint height from ground (m)
SHOULDER_D    = 0.030   # shoulder disc thickness
LOWER_ARM_L   = 0.250   # shoulder-to-elbow length (m)
UPPER_ARM_L   = 0.200   # elbow-to-wrist length (m)
GRIPPER_H     = 0.060   # gripper depth along local Z (m)
ARM_W         = 0.040   # arm cross-section side length (m)
JOINT_R       = 0.030   # joint icosphere radius (m)
GRIPPER_W     = 0.100   # gripper paddle width (m)
GRIPPER_D     = 0.014   # gripper paddle thickness (m)
DEG2RAD       = math.pi / 180.0

# ── scene reset ────────────────────────────────────────────────────────────────
Path(bpy.path.abspath(OUT_DIR)).mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system       = "METRIC"
scene.unit_settings.scale_length = 1.0

# ── materials ──────────────────────────────────────────────────────────────────
def make_mat(name, base_col, metallic=0.90, rough=0.20):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_col, 1.0)
    bsdf.inputs["Metallic"].default_value   = metallic
    bsdf.inputs["Roughness"].default_value  = rough
    return mat

mat_arm   = make_mat("arm_metal",    (0.14, 0.17, 0.22))  # anthracite
mat_joint = make_mat("joint_orange", (0.85, 0.33, 0.06))  # safety orange
mat_grip  = make_mat("gripper_alum", (0.56, 0.60, 0.65))  # machined aluminium

# ── GN tree ────────────────────────────────────────────────────────────────────
ng    = bpy.data.node_groups.new(GN_NAME, "GeometryNodeTree")
ni    = ng.interface
nodes = ng.nodes
links = ng.links

ni.new_socket("Geometry",   in_out="OUTPUT", socket_type="NodeSocketGeometry")
sy = ni.new_socket("Yaw",   in_out="INPUT",  socket_type="NodeSocketFloat")
sp = ni.new_socket("Pitch", in_out="INPUT",  socket_type="NodeSocketFloat")
sr = ni.new_socket("Roll",  in_out="INPUT",  socket_type="NodeSocketFloat")
sy.default_value, sy.min_value, sy.max_value = DEF_YAW,   -180.0, 180.0
sp.default_value, sp.min_value, sp.max_value = DEF_PITCH,  -90.0,  90.0
sr.default_value, sr.min_value, sr.max_value = DEF_ROLL,  -180.0, 180.0

def N(t, x, y):
    n = nodes.new(t); n.location = (x, y); return n

def L(a, b):
    links.new(a, b)

g_in  = N("NodeGroupInput",  -1600,   0)
g_out = N("NodeGroupOutput",  1600,   0)

# ── degree → radian ────────────────────────────────────────────────────────────
my = N("ShaderNodeMath", -1200,  200); my.operation = "MULTIPLY"
mp = N("ShaderNodeMath", -1200,    0); mp.operation = "MULTIPLY"
mr = N("ShaderNodeMath", -1200, -200); mr.operation = "MULTIPLY"
my.inputs[1].default_value = DEG2RAD
mp.inputs[1].default_value = DEG2RAD
mr.inputs[1].default_value = DEG2RAD
L(g_in.outputs["Yaw"],   my.inputs[0])
L(g_in.outputs["Pitch"], mp.inputs[0])
L(g_in.outputs["Roll"],  mr.inputs[0])

# ── Axis-Angle → Rotation ──────────────────────────────────────────────────────
aa_y = N("FunctionNodeAxisAngleToRotation", -900,  200)
aa_p = N("FunctionNodeAxisAngleToRotation", -900,    0)
aa_r = N("FunctionNodeAxisAngleToRotation", -900, -200)
aa_y.inputs["Axis"].default_value = (0.0, 0.0, 1.0)  # Z — yaw axis
aa_p.inputs["Axis"].default_value = (0.0, 1.0, 0.0)  # Y — pitch axis
aa_r.inputs["Axis"].default_value = (1.0, 0.0, 0.0)  # X — roll axis
L(my.outputs["Value"], aa_y.inputs["Angle"])
L(mp.outputs["Value"], aa_p.inputs["Angle"])
L(mr.outputs["Value"], aa_r.inputs["Angle"])

# ── Compose rotations (LOCAL = FK right-multiply: R_parent · R_child) ─────────
rr_yp = N("FunctionNodeRotateRotation", -600,  100)
rr_yp.rotation_space = "LOCAL"
L(aa_y.outputs["Rotation"],  rr_yp.inputs["Rotation"])
L(aa_p.outputs["Rotation"],  rr_yp.inputs["Rotate By"])

rr_full = N("FunctionNodeRotateRotation", -600, -100)
rr_full.rotation_space = "LOCAL"
L(rr_yp.outputs["Rotation"],  rr_full.inputs["Rotation"])
L(aa_r.outputs["Rotation"],   rr_full.inputs["Rotate By"])

# ── World-space positions via RotateVector + VectorAdd ─────────────────────────
#   Shoulder = (0, 0, BASE_H) — invariant under Z-rotation
c_sh = N("ShaderNodeCombineXYZ", -400, 400)
c_sh.inputs["Z"].default_value = BASE_H

#   Elbow = RotVec((0,0,LOWER_ARM_L), R_yp) + shoulder
c_la = N("ShaderNodeCombineXYZ", -400, 250)
c_la.inputs["Z"].default_value = LOWER_ARM_L
rv_el = N("FunctionNodeRotateVector", -200, 250)
vm_el = N("ShaderNodeVectorMath",       0, 250); vm_el.operation = "ADD"
L(c_la.outputs["Vector"],          rv_el.inputs["Vector"])
L(rr_yp.outputs["Rotation"],       rv_el.inputs["Rotation"])
L(rv_el.outputs["Vector"],         vm_el.inputs[0])
L(c_sh.outputs["Vector"],          vm_el.inputs[1])

#   Lower arm centre = RotVec((0,0,LOWER_ARM_L/2), R_yp) + shoulder
c_la2 = N("ShaderNodeCombineXYZ", -400, 400)
c_la2.inputs["Z"].default_value = LOWER_ARM_L / 2.0
rv_la = N("FunctionNodeRotateVector", -200, 380)
vm_la = N("ShaderNodeVectorMath",       0, 380); vm_la.operation = "ADD"
L(c_la2.outputs["Vector"],         rv_la.inputs["Vector"])
L(rr_yp.outputs["Rotation"],       rv_la.inputs["Rotation"])
L(rv_la.outputs["Vector"],         vm_la.inputs[0])
L(c_sh.outputs["Vector"],          vm_la.inputs[1])

#   Wrist = RotVec((0,0,UPPER_ARM_L), R_full) + elbow
c_ua = N("ShaderNodeCombineXYZ", -400, 100)
c_ua.inputs["Z"].default_value = UPPER_ARM_L
rv_wr = N("FunctionNodeRotateVector", -200, 100)
vm_wr = N("ShaderNodeVectorMath",       0, 100); vm_wr.operation = "ADD"
L(c_ua.outputs["Vector"],          rv_wr.inputs["Vector"])
L(rr_full.outputs["Rotation"],     rv_wr.inputs["Rotation"])
L(rv_wr.outputs["Vector"],         vm_wr.inputs[0])
L(vm_el.outputs["Vector"],         vm_wr.inputs[1])

#   Upper arm centre = RotVec((0,0,UPPER_ARM_L/2), R_full) + elbow
c_ua2 = N("ShaderNodeCombineXYZ", -400,   0)
c_ua2.inputs["Z"].default_value = UPPER_ARM_L / 2.0
rv_ua = N("FunctionNodeRotateVector", -200, 0)
vm_ua = N("ShaderNodeVectorMath",       0,  0); vm_ua.operation = "ADD"
L(c_ua2.outputs["Vector"],         rv_ua.inputs["Vector"])
L(rr_full.outputs["Rotation"],     rv_ua.inputs["Rotation"])
L(rv_ua.outputs["Vector"],         vm_ua.inputs[0])
L(vm_el.outputs["Vector"],         vm_ua.inputs[1])

#   Gripper centre = RotVec((0,0,GRIPPER_H/2), R_full) + wrist
c_gr = N("ShaderNodeCombineXYZ", -400, -150)
c_gr.inputs["Z"].default_value = GRIPPER_H / 2.0
rv_gr = N("FunctionNodeRotateVector", -200, -150)
vm_gr = N("ShaderNodeVectorMath",       0, -150); vm_gr.operation = "ADD"
L(c_gr.outputs["Vector"],          rv_gr.inputs["Vector"])
L(rr_full.outputs["Rotation"],     rv_gr.inputs["Rotation"])
L(rv_gr.outputs["Vector"],         vm_gr.inputs[0])
L(vm_wr.outputs["Vector"],         vm_gr.inputs[1])

# ── Geometry primitives + TransformGeometry ────────────────────────────────────
def mesh_and_tform(mesh_nd, tform_x, tform_y, pos_out, rot_out):
    tf = N("GeometryNodeTransformGeometry", tform_x, tform_y)
    L(mesh_nd.outputs[0],  tf.inputs["Geometry"])
    L(pos_out,             tf.inputs["Translation"])
    if rot_out is not None:
        L(rot_out, tf.inputs["Rotation"])
    return tf

# Base column — fixed to world; no rotation socket needed
n_base = N("GeometryNodeMeshCylinder", 200, 600)
n_base.inputs["Vertices"].default_value = 24
n_base.inputs["Radius"].default_value   = BASE_R
n_base.inputs["Depth"].default_value    = BASE_H
c_base_pos = N("ShaderNodeCombineXYZ", 200, 680)
c_base_pos.inputs["Z"].default_value    = BASE_H / 2.0
tf_base = mesh_and_tform(n_base, 400, 600, c_base_pos.outputs["Vector"], None)

# Shoulder disc — rotates with YAW
n_sh = N("GeometryNodeMeshCylinder", 200, 450)
n_sh.inputs["Vertices"].default_value = 32
n_sh.inputs["Radius"].default_value   = BASE_R * 1.6
n_sh.inputs["Depth"].default_value    = SHOULDER_D
tf_sh = mesh_and_tform(n_sh, 400, 450, c_sh.outputs["Vector"],
                        aa_y.outputs["Rotation"])

# Lower arm — rotates with R_yp, centred at lower-arm midpoint
n_la = N("GeometryNodeMeshCube", 200, 300)
n_la.inputs["Size"].default_value = (ARM_W, ARM_W, LOWER_ARM_L)
tf_la = mesh_and_tform(n_la, 400, 300, vm_la.outputs["Vector"],
                        rr_yp.outputs["Rotation"])

# Elbow joint
n_el = N("GeometryNodeMeshIcoSphere", 200, 150)
n_el.inputs["Radius"].default_value       = JOINT_R
n_el.inputs["Subdivisions"].default_value = 2
tf_el = mesh_and_tform(n_el, 400, 150, vm_el.outputs["Vector"],
                        rr_yp.outputs["Rotation"])

# Upper arm — rotates with R_full
n_ua = N("GeometryNodeMeshCube", 200, 0)
n_ua.inputs["Size"].default_value = (ARM_W * 0.80, ARM_W * 0.80, UPPER_ARM_L)
tf_ua = mesh_and_tform(n_ua, 400, 0, vm_ua.outputs["Vector"],
                        rr_full.outputs["Rotation"])

# Wrist joint
n_wr = N("GeometryNodeMeshIcoSphere", 200, -150)
n_wr.inputs["Radius"].default_value       = JOINT_R * 0.80
n_wr.inputs["Subdivisions"].default_value = 2
tf_wr = mesh_and_tform(n_wr, 400, -150, vm_wr.outputs["Vector"],
                        rr_full.outputs["Rotation"])

# Gripper paddle
n_gr = N("GeometryNodeMeshCube", 200, -300)
n_gr.inputs["Size"].default_value = (GRIPPER_W, GRIPPER_D, GRIPPER_H)
tf_gr = mesh_and_tform(n_gr, 400, -300, vm_gr.outputs["Vector"],
                        rr_full.outputs["Rotation"])

# ── Set materials ──────────────────────────────────────────────────────────────
def set_m(tf_nd, mat, x, y):
    sm = N("GeometryNodeSetMaterial", x, y)
    sm.inputs["Material"].default_value = mat
    L(tf_nd.outputs["Geometry"], sm.inputs["Geometry"])
    return sm

sm_base = set_m(tf_base, mat_arm,   650, 600)
sm_sh   = set_m(tf_sh,   mat_joint, 650, 450)
sm_la   = set_m(tf_la,   mat_arm,   650, 300)
sm_el   = set_m(tf_el,   mat_joint, 650, 150)
sm_ua   = set_m(tf_ua,   mat_arm,   650,   0)
sm_wr   = set_m(tf_wr,   mat_joint, 650, -150)
sm_gr   = set_m(tf_gr,   mat_grip,  650, -300)

# ── Join + output ──────────────────────────────────────────────────────────────
join = N("GeometryNodeJoinGeometry", 950, 0)
for sm in (sm_base, sm_sh, sm_la, sm_el, sm_ua, sm_wr, sm_gr):
    L(sm.outputs["Geometry"], join.inputs["Geometry"])
L(join.outputs["Geometry"], g_out.inputs["Geometry"])

# ── Object + modifier ──────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new(OBJ_NAME)
obj  = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
mod            = obj.modifiers.new(GN_NAME, "NODES")
mod.node_group = ng

# ── Export ─────────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//output/fk_robot_arm.glb"),
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
    export_apply=True,
    export_format="GLB",
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//output/fk_robot_arm.blend"))
