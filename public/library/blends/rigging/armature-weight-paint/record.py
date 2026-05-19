# record.py — Armature pose animation for the weight paint demo.
#
# Builds the same rigged character as blueprint.py, keyframes the arm
# raising from rest to 90° (frames 1–30) and lowering back (frames 30–60),
# and renders to:
#   public/library/videos/rigging/armature-weight-paint/viewport.mp4
#
# The animation shows whether the shoulder deformation is clean — the
# primary quality check for weight painting.
# 60 frames, 30 fps = 2 seconds.

import bpy
import bmesh
import mathutils
import math
import os

# ── Parameters ─────────────────────────────────────────────────────────────
MESH_NAME    = "character_mesh"
RIG_NAME     = "character_rig"
OUTPUT_PATH  = "//../../videos/rigging/armature-weight-paint/viewport"
FRAME_START  = 1
FRAME_END    = 60
FPS          = 30
CAMERA_DIST  = 2.2

# ── 1. Clean ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ── 2. Mesh ─────────────────────────────────────────────────────────────────
me = bpy.data.meshes.new(MESH_NAME)
bm = bmesh.new()
torso_verts = [
    bm.verts.new(( 0.25,  0.15,  0.0)), bm.verts.new((-0.25,  0.15,  0.0)),
    bm.verts.new((-0.25, -0.15,  0.0)), bm.verts.new(( 0.25, -0.15,  0.0)),
    bm.verts.new(( 0.25,  0.15,  1.0)), bm.verts.new((-0.25,  0.15,  1.0)),
    bm.verts.new((-0.25, -0.15,  1.0)), bm.verts.new(( 0.25, -0.15,  1.0)),
]
bm.faces.new([torso_verts[0], torso_verts[1], torso_verts[2], torso_verts[3]])
bm.faces.new([torso_verts[4], torso_verts[7], torso_verts[6], torso_verts[5]])
bm.faces.new([torso_verts[0], torso_verts[4], torso_verts[5], torso_verts[1]])
bm.faces.new([torso_verts[2], torso_verts[6], torso_verts[7], torso_verts[3]])
bm.faces.new([torso_verts[0], torso_verts[3], torso_verts[7], torso_verts[4]])
bm.faces.new([torso_verts[1], torso_verts[5], torso_verts[6], torso_verts[2]])
arm_verts = [
    bm.verts.new((0.25,  0.12, 0.80)), bm.verts.new((0.25, -0.12, 0.80)),
    bm.verts.new((0.25,  0.12, 0.90)), bm.verts.new((0.25, -0.12, 0.90)),
    bm.verts.new((0.75,  0.10, 0.80)), bm.verts.new((0.75, -0.10, 0.80)),
    bm.verts.new((0.75,  0.10, 0.90)), bm.verts.new((0.75, -0.10, 0.90)),
]
bm.faces.new([arm_verts[0], arm_verts[2], arm_verts[3], arm_verts[1]])
bm.faces.new([arm_verts[4], arm_verts[5], arm_verts[7], arm_verts[6]])
bm.faces.new([arm_verts[0], arm_verts[4], arm_verts[6], arm_verts[2]])
bm.faces.new([arm_verts[1], arm_verts[3], arm_verts[7], arm_verts[5]])
bm.normal_update()
bm.to_mesh(me)
bm.free()
obj = bpy.data.objects.new(MESH_NAME, me)
bpy.context.scene.collection.objects.link(obj)

# ── 3. Armature ─────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new(RIG_NAME)
rig = bpy.data.objects.new(RIG_NAME, arm_data)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.editmode_toggle()
bones = arm_data.edit_bones
hips = bones.new("Hips")
hips.head, hips.tail = mathutils.Vector((0,0,0)), mathutils.Vector((0,0,0.5))
spine = bones.new("Spine")
spine.head, spine.tail = mathutils.Vector((0,0,0.5)), mathutils.Vector((0,0,0.85))
spine.parent = hips; spine.use_connect = True
chest = bones.new("Chest")
chest.head, chest.tail = mathutils.Vector((0,0,0.85)), mathutils.Vector((0,0,1.05))
chest.parent = spine; chest.use_connect = True
ua = bones.new("UpperArm.R")
ua.head, ua.tail = mathutils.Vector((0.25,0,0.875)), mathutils.Vector((0.75,0,0.875))
ua.parent = chest; ua.use_connect = False
bpy.ops.object.editmode_toggle()

# Parent with auto-weights
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True); rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
arm_mod = obj.modifiers.get("Armature")
if arm_mod:
    arm_mod.use_bone_envelopes = False
    arm_mod.use_vertex_groups  = True

# ── 4. Pose animation — arm raises to 90° then returns ─────────────────────
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.posemode_toggle()

bone = rig.pose.bones["UpperArm.R"]
# Rest pose at frame 1
bpy.context.scene.frame_set(1)
bone.rotation_euler = (0, 0, 0)
bone.rotation_mode = 'XYZ'
bone.keyframe_insert(data_path="rotation_euler", frame=1)
# Arm raised 90° (rotating forward/down in local Y) at frame 30
bpy.context.scene.frame_set(30)
bone.rotation_euler = (0, 0, math.radians(-90))
bone.keyframe_insert(data_path="rotation_euler", frame=30)
# Back to rest at frame 60
bpy.context.scene.frame_set(60)
bone.rotation_euler = (0, 0, 0)
bone.keyframe_insert(data_path="rotation_euler", frame=60)

bpy.ops.object.posemode_toggle()

# ── 5. Camera ──────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("record_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location     = (CAMERA_DIST, -CAMERA_DIST, 0.7)
cam_obj.rotation_euler = (math.radians(75), 0, math.radians(45))
bpy.context.scene.camera = cam_obj

# ── 6. Lights ──────────────────────────────────────────────────────────────
for lname, lloc, lenergy in [
    ("key",  ( 1.5, -2.0, 2.0), 5.0),
    ("fill", (-2.0, -1.0, 1.5), 2.0),
    ("rim",  ( 0.0,  2.0, 3.0), 3.0),
]:
    ld = bpy.data.lights.new(lname, 'SUN')
    ld.energy = lenergy
    lo = bpy.data.objects.new(lname, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = lloc

# ── 7. Render settings ─────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = FRAME_START; scene.frame_end = FRAME_END; scene.render.fps = FPS
scene.render.resolution_x = 1920; scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)

print("[record] Scene ready. Ctrl+F12 to render viewport.mp4")
# Uncomment for headless render:
# bpy.ops.render.render(animation=True, write_still=False)
