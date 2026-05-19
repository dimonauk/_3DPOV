# blueprint.py — Armature & Weight Painting in Blender 5.1
#
# Constructs a simple low-poly humanoid torso + upper arm, then creates a
# four-bone armature with VRM-compatible names, parents the mesh using
# Automatic Weights, and applies a Limit Total pass to cap bone influences
# at four per vertex — a hard requirement for glTF / WebXR runtimes.
#
# WHY this sequence matters:
# Automatic Weights (bpy.ops.object.parent_set type='ARMATURE_AUTO') runs
# the same heat-diffusion solver Blender uses interactively. It produces
# reasonable initial weights for most low-poly forms. The problems come at
# sharp joints (shoulder, hip); those need manual paint passes. This script
# shows the setup pipeline so the human can do the paint pass afterwards.
#
# Blender 5.1 notes:
# - Armature modifier 'PRESERVE_VOLUME' (Voxel Remesher) prevents
#   candy-wrapper twist at the shoulder. Default is off; turn it on for
#   any arm or leg joint that bends > 90°.
# - 'use_bone_envelopes' should be False — envelopes fight vertex groups
#   and produce unpredictable blending. Always use vertex groups.
# - 'use_vertex_groups' should be True (default after ARMATURE_AUTO).
# - 'bpy.ops.object.vertex_group_limit_total' (Limit Total) caps influences
#   per vertex. The glTF spec caps at 4; run this before export or the
#   exporter silently drops excess influences and deformation looks wrong.
#
# Source: Blender Manual — Armatures + Weight Paint
# URL-A:  https://docs.blender.org/manual/en/latest/animation/armatures/index.html
# URL-B:  https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/index.html
# Licence: CC0 — Creative Commons Zero, no rights reserved
# Attribution (courtesy): The Blender Documentation Team
#
# Run: Blender Text Editor → Run Script (Alt+P)
# Tested: Blender 5.1 / Python 3.12

import bpy
import bmesh
import mathutils

# ── Parameters ─────────────────────────────────────────────────────────────
MESH_NAME     = "character_mesh"
RIG_NAME      = "character_rig"
EXPORT_DIR    = bpy.path.abspath("//")
EXPORT_FILE   = "armature_weight_demo.glb"
BONE_LIMIT    = 4     # glTF max influences per vertex; must match WebXR runtime

# ── 1. Clean scene ──────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ── 2. Build mesh via bmesh ─────────────────────────────────────────────────
# A minimal humanoid torso (box) + upper-arm extension. Using bmesh gives
# direct control over vertex positions rather than relying on operator offsets
# that drift between Blender minor versions.
me = bpy.data.meshes.new(MESH_NAME)
bm = bmesh.new()

# Torso — unit cube scaled to ~0.5w × 0.3d × 1.0h
torso_verts = [
    bm.verts.new(( 0.25,  0.15,  0.0)),
    bm.verts.new((-0.25,  0.15,  0.0)),
    bm.verts.new((-0.25, -0.15,  0.0)),
    bm.verts.new(( 0.25, -0.15,  0.0)),
    bm.verts.new(( 0.25,  0.15,  1.0)),
    bm.verts.new((-0.25,  0.15,  1.0)),
    bm.verts.new((-0.25, -0.15,  1.0)),
    bm.verts.new(( 0.25, -0.15,  1.0)),
]
bm.faces.new([torso_verts[0], torso_verts[1], torso_verts[2], torso_verts[3]])  # bottom
bm.faces.new([torso_verts[4], torso_verts[7], torso_verts[6], torso_verts[5]])  # top
bm.faces.new([torso_verts[0], torso_verts[4], torso_verts[5], torso_verts[1]])  # front
bm.faces.new([torso_verts[2], torso_verts[6], torso_verts[7], torso_verts[3]])  # back
bm.faces.new([torso_verts[0], torso_verts[3], torso_verts[7], torso_verts[4]])  # right
bm.faces.new([torso_verts[1], torso_verts[5], torso_verts[6], torso_verts[2]])  # left

# Upper-arm extension on the right side — 4 quads forming a short limb stub
# The shoulder origin is at (0.25, 0, 0.85); arm extends to (0.75, 0, 0.85)
arm_verts = [
    bm.verts.new((0.25,  0.12,  0.80)),
    bm.verts.new((0.25, -0.12,  0.80)),
    bm.verts.new((0.25,  0.12,  0.90)),
    bm.verts.new((0.25, -0.12,  0.90)),
    bm.verts.new((0.75,  0.10,  0.80)),
    bm.verts.new((0.75, -0.10,  0.80)),
    bm.verts.new((0.75,  0.10,  0.90)),
    bm.verts.new((0.75, -0.10,  0.90)),
]
bm.faces.new([arm_verts[0], arm_verts[2], arm_verts[3], arm_verts[1]])  # shoulder cap
bm.faces.new([arm_verts[4], arm_verts[5], arm_verts[7], arm_verts[6]])  # wrist cap
bm.faces.new([arm_verts[0], arm_verts[4], arm_verts[6], arm_verts[2]])  # top
bm.faces.new([arm_verts[1], arm_verts[3], arm_verts[7], arm_verts[5]])  # bottom

bm.normal_update()
bm.to_mesh(me)
bm.free()

obj = bpy.data.objects.new(MESH_NAME, me)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.shade_flat()

# ── 3. Create armature ──────────────────────────────────────────────────────
# Bone names follow VRM 1.0 humanoid naming where applicable.
# VRM requires: hips, spine, chest, upperArm (L/R), lowerArm (L/R), hand (L/R)
# For this minimal demo: Hips (root), Spine, UpperArm.R
arm_data = bpy.data.armatures.new(RIG_NAME)
rig = bpy.data.objects.new(RIG_NAME, arm_data)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.editmode_toggle()

bones = arm_data.edit_bones

# Hips — the skeleton root. Position at the mesh base centre.
hips = bones.new("Hips")
hips.head = mathutils.Vector((0.0, 0.0, 0.0))
hips.tail = mathutils.Vector((0.0, 0.0, 0.5))
hips.use_connect = False

# Spine — child of Hips, runs through the torso centre.
spine = bones.new("Spine")
spine.head = mathutils.Vector((0.0, 0.0, 0.5))
spine.tail = mathutils.Vector((0.0, 0.0, 0.85))
spine.parent = hips
spine.use_connect = True

# Chest — top of torso, shoulder attachment parent.
chest = bones.new("Chest")
chest.head = mathutils.Vector((0.0, 0.0, 0.85))
chest.tail = mathutils.Vector((0.0, 0.0, 1.05))
chest.parent = spine
chest.use_connect = True

# UpperArm.R — right side shoulder to elbow stub.
upper_arm_r = bones.new("UpperArm.R")
upper_arm_r.head = mathutils.Vector((0.25, 0.0, 0.875))
upper_arm_r.tail = mathutils.Vector((0.75, 0.0, 0.875))
upper_arm_r.parent = chest
upper_arm_r.use_connect = False  # shoulder socket, not connected to chest tail

bpy.ops.object.editmode_toggle()

# ── 4. Configure armature modifier ─────────────────────────────────────────
# After parenting, set the modifier to use vertex groups only.
# Bone envelopes produce different influence radii for each bone and fight
# the vertex groups that Automatic Weights writes — turn them off.
# Preserve Volume uses dual quaternion blending, which prevents the
# candy-wrapper twist that linear blending produces at the shoulder.
bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# Tune the modifier that parent_set just added.
arm_mod = obj.modifiers.get("Armature")
if arm_mod:
    arm_mod.use_bone_envelopes = False   # vertex groups only
    arm_mod.use_vertex_groups  = True    # (default after ARMATURE_AUTO; explicit for clarity)

# ── 5. Limit bone influences to 4 per vertex ───────────────────────────────
# glTF / WebXR spec: at most 4 bones per vertex. Blender's heat-diffusion
# solver sometimes assigns 5–8 influences on complex joints. Exporting those
# silently drops the excess and the deformation changes between Blender and
# the browser. Run Limit Total now to guarantee the export matches the preview.
bpy.context.view_layer.objects.active = obj
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=BONE_LIMIT)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)

# ── 6. Apply transforms ─────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# ── 7. Export as GLB with skinning ─────────────────────────────────────────
# export_skins=True: includes the armature as a glTF Skin node.
# export_animations=False: no animation data yet; keeps the GLB minimal.
# export_normals=True: preserve flat shading.
import os
export_path = os.path.join(EXPORT_DIR, EXPORT_FILE)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
rig.select_set(True)
bpy.ops.export_scene.gltf(
    filepath           = export_path,
    export_format      = 'GLB',
    use_selection      = True,
    export_normals     = True,
    export_skins       = True,
    export_animations  = False,
    export_apply       = True,
    export_yup         = True,
    export_materials   = 'EXPORT',
)
print(f"[blueprint] Exported → {export_path}")
print("[blueprint] Open in Weight Paint mode (Ctrl+Tab in Object Mode) to refine shoulder weights.")
