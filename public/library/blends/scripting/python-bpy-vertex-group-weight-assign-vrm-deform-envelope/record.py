# RECORD: viewport animation render for vertex group weight assignment tutorial
# Output: public/library/videos/scripting/python-bpy-vertex-group-weight-assign-vrm-deform-envelope/viewport.mp4
# Duration: ~10 s at 24 fps (frames 1–240)
# Technique: shows the 3-bone armature deforming the skinned cylinder through
# three distinct poses — neutral, spine bend, spine-and-head tilt — so the
# viewer can see the vertex weight blend regions in action.

import bpy
import bmesh
import math
from mathutils import Vector

ARM_NAME    = "HumanoidRig"
MESH_NAME   = "BodyProxy"
BONE_DEFS   = [
    ("Root",  0.00, 0.40, 0.22),
    ("Spine", 0.40, 1.00, 0.18),
    ("Head",  1.00, 1.30, 0.16),
]
CLEAN_LIMIT = 0.001
OUT_VIDEO   = "//../../videos/scripting/python-bpy-vertex-group-weight-assign-vrm-deform-envelope/viewport"

# ── Scene ─────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine        = 'BLENDER_WORKBENCH'
sc.display.shading.type = 'SOLID'
sc.display.shading.color_type = 'VERTEX'   # show vertex colour weight
sc.render.resolution_x  = 1280
sc.render.resolution_y  = 720
sc.render.fps            = 24
sc.frame_start           = 1
sc.frame_end             = 240
sc.render.filepath       = OUT_VIDEO
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format  = 'MPEG4'
sc.render.ffmpeg.codec   = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'

# ── Armature ──────────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new(ARM_NAME)
arm_ob   = bpy.data.objects.new(ARM_NAME, arm_data)
sc.collection.objects.link(arm_ob)
sc.view_layer.objects.active = arm_ob

with bpy.context.temp_override(active_object=arm_ob):
    bpy.ops.object.mode_set(mode='EDIT')
    ebs = arm_data.edit_bones
    prev = None
    for bname, hz, tz, env_r in BONE_DEFS:
        eb                   = ebs.new(bname)
        eb.head              = Vector((0, 0, hz))
        eb.tail              = Vector((0, 0, tz))
        eb.envelope_distance = env_r
        if prev:
            eb.parent        = prev
            eb.use_connect   = True
        prev = eb
    bpy.ops.object.mode_set(mode='OBJECT')

# ── Mesh ──────────────────────────────────────────────────────────────────────
me = bpy.data.meshes.new(MESH_NAME)
ob = bpy.data.objects.new(MESH_NAME, me)
sc.collection.objects.link(ob)

bm = bmesh.new()
bmesh.ops.create_cone(
    bm, cap_ends=True, cap_tris=False,
    segments=16, radius1=0.12, radius2=0.12,
    depth=1.30, calc_uvs=True,
)
bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((0, 0, 0.65)))
bm.to_mesh(me)
bm.free()
me.update()

# ── Vertex groups ─────────────────────────────────────────────────────────────
def linear_weight(z, hz, tz):
    centre = (hz + tz) * 0.5
    half   = abs(tz - hz) * 0.5 + 1e-6
    return max(0.0, 1.0 - abs(z - centre) / half)

groups = {bname: ob.vertex_groups.new(name=bname) for bname, *_ in BONE_DEFS}
for v in me.vertices:
    z = v.co.z
    for bname, hz, tz, _ in BONE_DEFS:
        w = linear_weight(z, hz, tz)
        if w > CLEAN_LIMIT:
            groups[bname].add([v.index], w, 'REPLACE')

sc.view_layer.objects.active = ob
ob.select_set(True)
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    bpy.ops.object.vertex_group_clean(group_select_mode='ALL', limit=CLEAN_LIMIT, keep_single=False)

mod                   = ob.modifiers.new("Armature", 'ARMATURE')
mod.object            = arm_ob
mod.use_vertex_groups = True

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_ob   = bpy.data.objects.new("Cam", cam_data)
sc.collection.objects.link(cam_ob)
cam_ob.location     = (2.0, -2.5, 0.75)
cam_ob.rotation_euler = (math.radians(82), 0, math.radians(40))
sc.camera           = cam_ob

# ── Pose keyframes ─────────────────────────────────────────────────────────────
# Neutral: all bones at rest — frame 1 & 240
# Spine bent +30° X — frame 80
# Spine bent + Head tilted -25° X — frame 160
def pose_key(frame, spine_x=0.0, head_x=0.0):
    sc.frame_set(frame)
    with bpy.context.temp_override(active_object=arm_ob):
        bpy.ops.object.mode_set(mode='POSE')
        pb_spine = arm_ob.pose.bones["Spine"]
        pb_head  = arm_ob.pose.bones["Head"]
        pb_spine.rotation_mode = 'XYZ'
        pb_head.rotation_mode  = 'XYZ'
        pb_spine.rotation_euler[0] = math.radians(spine_x)
        pb_head.rotation_euler[0]  = math.radians(head_x)
        pb_spine.keyframe_insert(data_path='rotation_euler', frame=frame)
        pb_head.keyframe_insert(data_path='rotation_euler', frame=frame)
        bpy.ops.object.mode_set(mode='OBJECT')

pose_key(1,    spine_x=0,   head_x=0)
pose_key(80,   spine_x=30,  head_x=0)
pose_key(160,  spine_x=30,  head_x=-25)
pose_key(240,  spine_x=0,   head_x=0)

# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[holoflow] viewport.mp4 written")
