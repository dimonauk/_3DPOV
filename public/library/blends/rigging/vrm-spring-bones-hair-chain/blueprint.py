"""
VRM Spring Bones — Bone Collections + Hair-Chain Physics
public/library/blends/rigging/vrm-spring-bones-hair-chain/blueprint.py
Blender 5.1 · CC0

WHY bone collections, not bone layers:
  Bone layers (32 bit flags on each bone) were deprecated in Blender 4.0 and
  removed in 4.1. Bone collections are named groups with full Python API:
    arm.collections.new('name')  → BoneCollection
    coll.assign(bone)            → links a Bone, EditBone, or PoseBone
  This is not just a rename — it enables per-collection visibility toggles,
  colour themes, and arbitrary nesting, all of which the VRM Addon reads
  to identify which bones belong to the spring-bone simulation chain.

WHY spring bones, not Cloth/SoftBody:
  Cloth and SoftBody bake their physics to vertex positions.  The baked cache
  cannot travel in a GLB — it is Blender-internal.  VRM 1.0's
  VRMC_springBone extension instead stores spring parameters (stiffness, drag,
  collision radius) as JSON metadata.  The runtime (e.g. @pixiv/three-vrm)
  runs a sub-millisecond Verlet integration each animation frame, producing
  dynamic hair sway at negligible GPU cost.  Zero bake, zero extra geometry.

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from mathutils import Vector, Euler
from pathlib import Path

# ── Output paths ───────────────────────────────────────────────────────────────
OUT_DIR   = Path(__file__).parent
BLEND_OUT = OUT_DIR / "vrm_spring_bones.blend"
GLB_OUT   = OUT_DIR / "vrm_spring_bones.glb"

# ── Character proportions (Y-up; 1 Blender unit = 1 metre, VRM 1.0 scale) ─────
HEAD_R     = 0.12
HEAD_Z     = 1.45
BODY_R_BOT = 0.13
BODY_R_TOP = 0.10
BODY_H     = 0.55
BODY_Z     = 0.92

# ── Spring chain topology ──────────────────────────────────────────────────────
# Four joints after the Head bone.  Each joint is NOT connected (use_connect=False)
# so the spring solver has a free-pivot attachment point at the joint head.
HAIR_JOINTS  = 4
JOINT_LEN    = 0.08   # metres per joint
JOINT_ARC_Y  = 0.025  # each joint drifts slightly backward (resting arc)
HAIR_BEAD_R  = 0.05   # display-sphere radius for the hair mesh

# ── VRMC_springBone joint parameters ──────────────────────────────────────────
# These mirror the VRMC_springBone-1.0 spec JSON fields (vrm-c/vrm-spec, MIT).
# The VRM Addon for Blender maps them to its own property panel — these raw
# custom props serve as readable documentation on the bone data block.
SPRING_STIFFNESS  = 4.0   # 0–4; higher = stiffer (short hair, antennae)
SPRING_DRAG       = 0.4   # 0–1; higher = heavier damping (no oscillation)
SPRING_HIT_RADIUS = 0.04  # metres; point-sphere collision influence per joint

# ── Colours ───────────────────────────────────────────────────────────────────
SKIN_COL = (0.88, 0.74, 0.62, 1.0)
HAIR_COL = (0.11, 0.08, 0.07, 1.0)


# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.armatures):
    try: bpy.data.batch_remove([blk])
    except Exception: pass


# ── Materials ──────────────────────────────────────────────────────────────────
def make_mat(name, color, roughness=0.75):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value  = roughness
    return mat

mat_skin = make_mat('skin', SKIN_COL)
mat_hair = make_mat('hair', HAIR_COL, roughness=0.85)


# ── Head sphere ────────────────────────────────────────────────────────────────
head_mesh = bpy.data.meshes.new('head')
head_obj  = bpy.data.objects.new('head', head_mesh)
bpy.context.collection.objects.link(head_obj)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=HEAD_R)
for f in bm.faces: f.smooth = False   # faceted — no auto-smooth in 5.x
bm.to_mesh(head_mesh); bm.free()
head_obj.location = (0.0, 0.0, HEAD_Z)
head_mesh.materials.append(mat_skin)


# ── Body cylinder ──────────────────────────────────────────────────────────────
body_mesh = bpy.data.meshes.new('body')
body_obj  = bpy.data.objects.new('body', body_mesh)
bpy.context.collection.objects.link(body_obj)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=8,
                       radius1=BODY_R_BOT, radius2=BODY_R_TOP, depth=BODY_H)
for f in bm.faces: f.smooth = False
bm.to_mesh(body_mesh); bm.free()
body_obj.location = (0.0, 0.0, BODY_Z)
body_mesh.materials.append(mat_skin)


# ── Hair bead (the geometry the spring chain will deform) ──────────────────────
hair_mesh = bpy.data.meshes.new('hair_bead')
hair_obj  = bpy.data.objects.new('hair_bead', hair_mesh)
bpy.context.collection.objects.link(hair_obj)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=HAIR_BEAD_R)
for v in bm.verts: v.co.z *= 2.2   # elongate into a teardrop-like strand
for f in bm.faces: f.smooth = False
bm.to_mesh(hair_mesh); bm.free()
# Position: just behind and above the head — resting at Hair_1 joint head
hair_obj.location = (0.0, -HEAD_R * 0.9, HEAD_Z + HEAD_R + 0.02)
hair_mesh.materials.append(mat_hair)


# ── Armature ───────────────────────────────────────────────────────────────────
arm_data = bpy.data.armatures.new('char_arm')
arm_data.display_type = 'STICK'   # readable without obscuring the mesh
arm_obj  = bpy.data.objects.new('char_arm', arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')

eb = arm_data.edit_bones

# ── Humanoid chain ─────────────────────────────────────────────────────────────
root  = eb.new('Root')
root.head  = Vector((0, 0, 0))
root.tail  = Vector((0, 0, 0.55))

spine = eb.new('Spine')
spine.head        = root.tail.copy()
spine.tail        = Vector((0, 0, 1.1))
spine.parent      = root
spine.use_connect = True

head_b = eb.new('Head')
head_b.head        = spine.tail.copy()
head_b.tail        = Vector((0, 0, HEAD_Z + HEAD_R))
head_b.parent      = spine
head_b.use_connect = True

# ── Spring bone hair chain ─────────────────────────────────────────────────────
# use_connect = False on every spring bone: the gap allows a free-pivot attachment.
# Without this, the spring solver would be forced to keep the joint root fixed
# at the parent tail, suppressing rotational freedom entirely.
HAIR_START = Vector((0.0, -HEAD_R * 0.85, HEAD_Z + HEAD_R + 0.01))
prev_b = head_b
for i in range(1, HAIR_JOINTS + 1):
    b = eb.new(f'Hair_{i}')
    drift = Vector((0.0, -JOINT_ARC_Y * (i - 1), 0.0))
    b.head        = HAIR_START + drift + Vector((0, 0, -(i - 1) * JOINT_LEN))
    b.tail        = b.head + Vector((0.0, -JOINT_ARC_Y, -JOINT_LEN))
    b.parent      = prev_b
    b.use_connect = False
    prev_b = b

bpy.ops.object.mode_set(mode='OBJECT')


# ── Bone collections (Blender 4.0+ API) ───────────────────────────────────────
# BoneCollection.assign(bone) works with Bone (OBJECT mode) — not EditBone
coll_human  = arm_data.collections.new('Humanoid')
coll_spring = arm_data.collections.new('SpringBone_Hair')

for name in ('Root', 'Spine', 'Head'):
    coll_human.assign(arm_data.bones[name])

hair_names = [f'Hair_{i}' for i in range(1, HAIR_JOINTS + 1)]
for name in hair_names:
    coll_spring.assign(arm_data.bones[name])

# Visual differentiation: light-blue theme on the spring collection
coll_spring.color_set = 'THEME08'


# ── Spring bone custom properties ──────────────────────────────────────────────
# Stiffness tapers toward the tip: tip joints are lighter and move more freely.
for i, name in enumerate(hair_names):
    bone = arm_data.bones[name]
    bone['vrm_spring_stiffness']  = round(SPRING_STIFFNESS * (1.0 - i * 0.15), 2)
    bone['vrm_spring_drag_force'] = SPRING_DRAG
    bone['vrm_spring_hit_radius'] = SPRING_HIT_RADIUS


# ── Parent meshes to armature (Automatic Weights) ─────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
for mo in (head_obj, body_obj, hair_obj):
    mo.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
# ARMATURE_AUTO: geodesic distance weighting, then normalises in-place.
# Produces glTF-compliant weights (max 4 per vertex) after the limit_total call.
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# Enforce glTF 4-influence-per-vertex spec requirement
bpy.ops.object.select_all(action='DESELECT')
for mo in (head_obj, body_obj, hair_obj):
    bpy.context.view_layer.objects.active = mo
    mo.select_set(True)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    mo.select_set(False)


# ── Lighting ───────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new('Sun', 'SUN')
sun_data.energy = 3.5
sun_data.angle  = 0.18
sun_obj  = bpy.data.objects.new('Sun', sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = Euler((1.1, 0.2, -0.5))


# ── Save + export ──────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_skins=True,
    export_morph=False,
    export_normals=True,
    export_materials='EXPORT',
    export_image_format='WEBP',
    # Draco disabled: KHR_draco_mesh_compression + skins is not addressed in
    # glTF 2.0 §9.5; several loaders (three-vrm, Babylon) reject the combination.
)

print(f'[holoflow] Saved  : {BLEND_OUT}')
print(f'[holoflow] Exported: {GLB_OUT}')
print('[holoflow] Next step: open in Blender, install VRM Addon for Blender')
print('[holoflow] (saturday06/VRM-Addon-for-Blender, MIT), then re-export as .vrm')
print('[holoflow] to embed the VRMC_springBone JSON extension.')
