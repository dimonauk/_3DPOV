"""
record.py — Viewport animation render for BVH→VRM retarget tutorial.
Runs in Blender 5.1 (bpy).  Output: viewport.mp4 (120 frames, 24 fps, 5 s).

No external BVH file required: builds a synthetic two-armature scene
(source BVH-style skeleton + target VRM-style skeleton side by side)
and drives the target via COPY_ROTATION constraints, visualising the
retarget in action before baking.
"""

import bpy
import math
import mathutils

OUT = bpy.path.abspath(
    "//../../../../videos/scripting/"
    "python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget/viewport.mp4"
)

FRAMES   = 120
FPS      = 24
BONE_LEN = 0.18   # metres


# ── helpers ─────────────────────────────────────────────────────────────────

def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.armatures) \
               + list(bpy.data.actions) + list(bpy.data.cameras) \
               + list(bpy.data.lights):
        if block.users == 0:
            bpy.data.batch_remove([block])


def add_armature(name: str, x_offset: float) -> bpy.types.Object:
    bpy.ops.object.armature_add(enter_editmode=True, location=(x_offset, 0, 0))
    arm_obj = bpy.context.object
    arm_obj.name = name
    arm_obj.data.name = name

    eb = arm_obj.data.edit_bones
    # Clear default bone
    for b in list(eb):
        eb.remove(b)

    def bone(bname, head, tail, parent=None):
        b = eb.new(bname)
        b.head = head
        b.tail = tail
        if parent:
            b.parent = eb[parent]
            b.use_connect = False
        return b

    bone("hips",         (0, 0, 0.90), (0, 0, 1.00))
    bone("spine",        (0, 0, 1.00), (0, 0, 1.20), "hips")
    bone("leftUpperArm", (0.20, 0, 1.40), (0.42, 0, 1.40))
    bone("leftLowerArm", (0.42, 0, 1.40), (0.64, 0, 1.40), "leftUpperArm")

    bpy.ops.object.mode_set(mode='OBJECT')
    arm_obj.location.x = x_offset
    return arm_obj


# ── scene setup ──────────────────────────────────────────────────────────────

purge()
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAMES
scn.render.fps  = FPS

# Camera
cam_data = bpy.data.cameras.new("cam")
cam_obj  = bpy.data.objects.new("cam", cam_data)
scn.collection.objects.link(cam_obj)
cam_obj.location    = (0, -3.8, 1.2)
cam_obj.rotation_euler = (math.radians(82), 0, 0)
scn.camera = cam_obj

# Light
light_data = bpy.data.lights.new("sun", type='SUN')
light_data.energy = 3.0
light_obj = bpy.data.objects.new("sun", light_data)
scn.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(50), 0, math.radians(30))

# Source (BVH-style) on the left, target (VRM-style) on the right
src_obj = add_armature("src_bvh",  -0.55)
tgt_obj = add_armature("tgt_vrm",   0.55)

# Display both as B-Bone sticks for visual clarity
for obj in (src_obj, tgt_obj):
    obj.data.display_type = 'BBONE'
    obj.show_in_front = True

# Colour: source = orange, target = cyan
src_obj.color = (1.0, 0.45, 0.0, 1.0)
tgt_obj.color = (0.0, 0.75, 1.0, 1.0)

# ── animate source skeleton ───────────────────────────────────────────────────

src_obj.animation_data_create()
src_action = bpy.data.actions.new("src_anim")
src_obj.animation_data.action = src_action

bpy.context.view_layer.objects.active = src_obj
bpy.ops.object.mode_set(mode='POSE')

for frame in range(1, FRAMES + 1):
    t = (frame - 1) / FRAMES  # 0..1
    angle = math.radians(90 * math.sin(2 * math.pi * t * 2))

    src_obj.pose.bones["leftUpperArm"].rotation_quaternion = \
        mathutils.Quaternion((1, 0, 0, 0)).slerp(
            mathutils.Euler((0, 0, angle)).to_quaternion(), 1.0)
    src_obj.pose.bones["leftUpperArm"].keyframe_insert(
        "rotation_quaternion", frame=frame)

    src_obj.pose.bones["leftLowerArm"].rotation_quaternion = \
        mathutils.Euler((0, 0, angle * 0.5)).to_quaternion()
    src_obj.pose.bones["leftLowerArm"].keyframe_insert(
        "rotation_quaternion", frame=frame)

bpy.ops.object.mode_set(mode='OBJECT')

# Linearise source fcurves
for fc in src_action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── apply retarget constraints on target ─────────────────────────────────────

bpy.context.view_layer.objects.active = tgt_obj
bpy.ops.object.mode_set(mode='POSE')

for bone_name in ("leftUpperArm", "leftLowerArm"):
    pbone = tgt_obj.pose.bones[bone_name]
    c = pbone.constraints.new('COPY_ROTATION')
    c.name         = "HF_RETARGET_rot"
    c.target       = src_obj
    c.subtarget    = bone_name
    c.space        = 'LOCAL'
    c.target_space = 'LOCAL'
    c.mix_mode     = 'REPLACE'

bpy.ops.object.mode_set(mode='OBJECT')

# ── render ────────────────────────────────────────────────────────────────────

import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)

scn.render.engine              = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x        = 1920
scn.render.resolution_y        = 1080
scn.render.resolution_percentage = 100
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format       = 'MPEG4'
scn.render.ffmpeg.codec        = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath            = OUT

bpy.ops.render.render(animation=True, write_still=False)
print(f"[HF] Rendered → {OUT}")
