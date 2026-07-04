"""
Python bpy.types.Armature — EditBone Chain: Procedural VRM Spine Skeleton
Blender 5.1 | CC0 | Holoflow Studio

WHY: The EditBone API is the sole mechanism for setting bone head/tail/roll in
Python. bpy.types.Bone (data bone, read-only geometry) and bpy.types.PoseBone
(pose-space transforms) cannot redefine geometry after creation. Switching to
EDIT mode, building the hierarchy, and exiting is therefore the mandatory pattern
for any Python rig-builder: import pipeline, procedural rig generator, or BVH/
FBX → Blender armature converter. This edit-mode constraint is the central
gotcha that catches every scripter the first time.

VRM bone names follow the VRM 1.0 humanoid specification. The build produces
a 9-bone torso skeleton (hips → head + both shoulders), a cylinder body proxy,
automatic envelope weighting via Ctrl+P, and a GLB export with skinning data
that a Three.js / WebXR runtime can bind to.

External sources:
  Blender API bpy.types.Armature CC-BY-SA-4.0 Blender Foundation
  https://docs.blender.org/api/5.1/bpy.types.Armature.html
  sibling: https://docs.blender.org/api/5.1/bpy.types.EditBone.html

  VRM 1.0 Humanoid Bone Specification MIT vrm-c
  https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md
  sibling: https://github.com/vrm-c/UniVRM
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Named constants ──────────────────────────────────────────────────────────
# VRM 1.0 humanoid camelCase bone names, positioned for a 1.68 m figure.
# X-right, Y-forward, Z-up (Blender native; holoflow_webxr_exporter applies
# the +Y-up → -Z-up conversion at export time).

BONE_CHAIN = [
    # (name,          head_XYZ,                   tail_XYZ)
    ("hips",          (0.000, 0.000, 0.978),      (0.000, 0.000, 1.100)),
    ("spine",         (0.000, 0.000, 1.100),      (0.000, 0.000, 1.300)),
    ("chest",         (0.000, 0.000, 1.300),      (0.000, 0.000, 1.470)),
    ("upperChest",    (0.000, 0.000, 1.470),      (0.000, 0.000, 1.600)),
    ("neck",          (0.000, 0.000, 1.600),      (0.000, 0.000, 1.680)),
    ("head",          (0.000, 0.000, 1.680),      (0.000, 0.000, 1.840)),
]

# Spine chain parent mapping (child → parent name).
SPINE_PARENTS = {
    "spine":      "hips",
    "chest":      "spine",
    "upperChest": "chest",
    "neck":       "upperChest",
    "head":       "neck",
}

# Shoulder bones branch from upperChest but do not connect (different X).
SHOULDER_DEFS = [
    ("leftShoulder",  (-0.100, 0.000, 1.540), (-0.250, 0.000, 1.540)),
    ("rightShoulder", ( 0.100, 0.000, 1.540), ( 0.250, 0.000, 1.540)),
]

ARM_NAME     = "vrm_spine"
MESH_NAME    = "body_proxy"
EXPORT_PATH  = "//vrm_spine_skeleton.glb"

# ── 1. Minimal clean scene ───────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24

# ── 2. Armature data block + object ─────────────────────────────────────────
# Armature data (bpy.types.Armature) is created first — it can exist without
# an Object wrapper. The Object links it into the scene graph.
arm_data             = bpy.data.armatures.new(ARM_NAME)
arm_data.display_type = "STICK"    # STICK / OCTAHEDRAL / BBONE — STICK is
                                    # clearest for tutorial screencasting
arm_obj = bpy.data.objects.new(ARM_NAME, arm_data)
bpy.context.collection.objects.link(arm_obj)

# ── 3. Enter EDIT mode — EditBone API only active here ──────────────────────
# bpy.context.active_object must be the armature before mode_set().
# Any other active object causes EDIT mode to open the wrong data type.
bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")

eb = arm_data.edit_bones   # bpy.types.ArmatureEditBones — invalid outside EDIT

# ── 4. Spine chain ──────────────────────────────────────────────────────────
created = {}
for name, head, tail in BONE_CHAIN:
    bone       = eb.new(name)
    bone.head  = Vector(head)
    bone.tail  = Vector(tail)
    # roll=0: bone Y-axis (local-up) points toward +global-Z. For a vertical
    # spine this is correct. Diagonal bones need roll computed via
    # bone.align_roll(target_vector) or EditBone.roll from a reference matrix.
    bone.roll  = 0.0
    created[name] = bone

# Parent assignment: must use EditBone references, NOT name strings.
# arm_data.edit_bones["name"] would also work, but `created` avoids lookups.
for child_name, parent_name in SPINE_PARENTS.items():
    created[child_name].parent      = created[parent_name]
    # use_connect=True: child head position is locked to parent tail.
    # The spine is a perfectly connected chain so every bone connects.
    created[child_name].use_connect = True

# ── 5. Shoulder bones — unconnected branch ──────────────────────────────────
# Shoulders share the upperChest parent but their heads are offset in X.
# use_connect=False: head position is independent of parent tail.
for name, head, tail in SHOULDER_DEFS:
    bone             = eb.new(name)
    bone.head        = Vector(head)
    bone.tail        = Vector(tail)
    bone.roll        = 0.0
    bone.parent      = created["upperChest"]
    bone.use_connect = False
    created[name]    = bone

# ── 6. Exit EDIT mode ────────────────────────────────────────────────────────
# After this call, arm_data.edit_bones is empty / invalid.
# Bone geometry is now frozen in arm_data.bones[name] (read-only Bone type).
# Pose transforms live in arm_obj.pose.bones[name] (PoseBone, read-write).
bpy.ops.object.mode_set(mode="OBJECT")

# ── 7. Bone Collections (Blender 4.0+ — replaces layer bitmask) ─────────────
# arm_data.collections is a BoneCollectionMemberships list.
# .new(name) creates a collection; .assign(bone) adds a data bone to it.
# Bones can belong to multiple collections simultaneously.
col_spine    = arm_data.collections.new("Spine")
col_shoulder = arm_data.collections.new("Shoulders")

for name, *_ in BONE_CHAIN:
    col_spine.assign(arm_data.bones[name])
for name, *_ in SHOULDER_DEFS:
    col_shoulder.assign(arm_data.bones[name])

# ── 8. Custom bone shapes (display widgets) ──────────────────────────────────
# A custom shape must be a mesh Object (any mesh works — only its wire is
# drawn). hide_viewport hides it from the scene but keeps it available as
# a widget. The canonical VRM display is a flat hexagon circle.
def hexagon_widget(name: str, r: float = 0.06) -> bpy.types.Object:
    m  = bpy.data.meshes.new(name)
    bm = bmesh.new()
    n  = 6
    verts = [bm.verts.new((r * math.cos(2 * math.pi * i / n),
                             r * math.sin(2 * math.pi * i / n),
                             0.0)) for i in range(n)]
    bm.edges.new(verts + [verts[0]])   # closed loop
    bm.to_mesh(m)
    bm.free()
    obj = bpy.data.objects.new(name, m)
    bpy.context.collection.objects.link(obj)
    obj.hide_viewport = True
    return obj

widget = hexagon_widget("WGT_Spine")

# Apply to all pose bones. Must be in POSE mode.
bpy.ops.object.mode_set(mode="POSE")
for bone_name in arm_data.bones:
    pb = arm_obj.pose.bones[bone_name]
    pb.custom_shape                = widget
    # use_custom_shape_bone_size: widget scales proportionally with bone length.
    # False = widget rendered at widget object's own scale (constant screen size).
    pb.use_custom_shape_bone_size  = True
bpy.ops.object.mode_set(mode="OBJECT")

# ── 9. Body proxy mesh ────────────────────────────────────────────────────────
# A subdivided cylinder centred on the spine column.
# Real VRM bodies have a proper mesh with precise vertex group weights; this
# proxy demonstrates the skinning pipeline with automatic envelope weighting.
bpy.ops.mesh.primitive_cylinder_add(
    vertices=8, radius=0.16, depth=0.84,
    location=(0.0, 0.0, 1.30),
    end_fill_type="NGON",
)
mesh_obj      = bpy.context.active_object
mesh_obj.name = MESH_NAME

# Subdivide once for smoother automatic weights
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.subdivide(number_cuts=2)
bpy.ops.object.mode_set(mode="OBJECT")

# ── 10. Parent mesh to armature with Automatic Weights ───────────────────────
# Automatic Weights creates vertex groups named after each bone and fills them
# with envelope + heat-diffusion weights. The operator requires:
#   • Both objects selected
#   • Armature as the ACTIVE object (determines which armature receives parenting)
mesh_obj.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

# ── 11. Export GLB with skinning ─────────────────────────────────────────────
for obj in bpy.context.scene.objects:
    obj.select_set(obj.type in {"MESH", "ARMATURE"})

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    use_selection=True,
    export_apply=True,
    export_skins=True,
    export_animations=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

print(f"[holoflow] Exported {EXPORT_PATH}")
