"""
Rigging — B-Bones Cartoon Spine for VRM Characters (Blender 5.1)
=================================================================
Topic     : rigging / armature
Technique : Bendy Bones (bbone_segments > 1) subdivide each bone into a cubic
            Bézier deformation curve.  Custom TANGENT handle bones steer the
            tangent at the chain root and tip independently, enabling full 'S'
            curves.  On glTF export the Bézier expands to bbone_segments
            standard linear bones — plan mesh density accordingly.

Why these choices
-----------------
• bbone_segments = 4 per spine bone: four sub-segments give smooth 'C' and 'S'
  bends with no visible kinks.  Rule of thumb: segments ≥ bend_angle_deg / 20.
  Higher counts add export bones; lower counts show kinks at sharp poses.

• TANGENT handle type at chain root + tip: AUTO averages adjacent bone
  directions — fine for mid-chain bones but flattens the entry/exit tangent.
  TANGENT reads the handle bone's local -Y axis as the Bézier tangent, giving
  the animator a grabbable control bone to steer the spine entry angle —
  essential at hip and shoulder for exaggerated cartoon poses.

• 24-loop torso mesh: 24 loops ÷ 6 spine bones = 4 loops per bone, matching
  bbone_segments.  One mesh edge loop per sub-segment avoids the visible
  staircase artefact that appears under the baked linear-bone deformation the
  glTF exporter produces.

• display_type = 'BBONE': renders the bone as a 3-D ribbon showing each
  Bézier segment — critical visual feedback; without it the B-Bone looks like a
  standard stick bone and the curve is invisible until Pose Mode bends it.

• Automatic Weights via parent_set: heat-diffusion algorithm; robust starting
  point.  Manual weight paint is expected for final characters but this
  ensures all spine_NN vertex groups exist with correct naming.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── parameters ────────────────────────────────────────────────────────────────
TORSO_RADIUS  = 0.22        # metres — approximate torso half-width
TORSO_HEIGHT  = 1.40        # metres — hip-to-shoulder column
TORSO_SEGS    = 16          # sides around the cylinder
TORSO_LOOPS   = 24          # edge loops along Z  (= SPINE_BONES × BBONE_SEGS)
SPINE_BONES   = 6           # deform spine bone count
BBONE_SEGS    = 4           # B-Bone sub-segments per spine bone
HANDLE_LEN    = 0.14        # visual length of TANGENT handle bones
TOON_COLOUR   = (0.18, 0.52, 0.82, 1.0)   # Holoflow cobalt-blue

# ── clear scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# ── torso mesh — ring-by-ring bmesh build to hit TORSO_LOOPS exactly ──────────
mesh = bpy.data.meshes.new("torso_mesh")
bm   = bmesh.new()

vert_rings = []
for li in range(TORSO_LOOPS + 1):        # inclusive: bottom ring 0 → top ring N
    t = li / TORSO_LOOPS
    z = t * TORSO_HEIGHT
    r = TORSO_RADIUS * (1.0 - t * 0.25) # 25 % taper: hip wider than shoulder
    ring = [
        bm.verts.new((
            r * math.cos(s * 2.0 * math.pi / TORSO_SEGS),
            r * math.sin(s * 2.0 * math.pi / TORSO_SEGS),
            z,
        ))
        for s in range(TORSO_SEGS)
    ]
    vert_rings.append(ring)

for i in range(TORSO_LOOPS):
    ra, rb = vert_rings[i], vert_rings[i + 1]
    for j in range(TORSO_SEGS):
        jn = (j + 1) % TORSO_SEGS
        bm.faces.new([ra[j], ra[jn], rb[jn], rb[j]])

bm.to_mesh(mesh)
bm.free()
mesh.calc_normals_split()

torso_obj          = bpy.data.objects.new("torso", mesh)
torso_obj.location = Vector((0.0, 0.0, 0.0))
bpy.context.collection.objects.link(torso_obj)

# ── toon material — consistent with the EEVEE Toon Cel Shader tutorial ────────
mat  = bpy.data.materials.new("toon_spine")
mat.use_nodes = True
tree = mat.node_tree
tree.nodes.clear()
out  = tree.nodes.new("ShaderNodeOutputMaterial")
diff = tree.nodes.new("ShaderNodeBsdfDiffuse")
diff.inputs["Color"].default_value = TOON_COLOUR
diff.inputs["Roughness"].default_value = 1.0
tree.links.new(diff.outputs["BSDF"], out.inputs["Surface"])
out.location  = (300, 0)
diff.location = (0, 0)
mesh.materials.append(mat)

# ── armature ──────────────────────────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj        = bpy.context.active_object
arm_obj.name   = "spine_rig"
arm_data       = arm_obj.data
arm_data.name  = "spine_rig"
# BBONE display type: renders each B-Bone as a 3-D ribbon, not a stick.
arm_data.display_type = "BBONE"

for eb in list(arm_data.edit_bones):
    arm_data.edit_bones.remove(eb)

bone_h      = TORSO_HEIGHT / SPINE_BONES
spine_names = [f"spine_{i+1:02d}" for i in range(SPINE_BONES)]

# ── spine deform chain ────────────────────────────────────────────────────────
for i, name in enumerate(spine_names):
    eb                 = arm_data.edit_bones.new(name)
    z0                 = i * bone_h
    eb.head            = Vector((0.0, 0.0, z0))
    eb.tail            = Vector((0.0, 0.0, z0 + bone_h))
    eb.bbone_segments  = BBONE_SEGS  # subdivide into N Bézier sub-segments
    eb.bbone_x         = 0.05        # ribbon display width
    eb.bbone_z         = 0.05
    if i > 0:
        eb.parent      = arm_data.edit_bones[spine_names[i - 1]]
        eb.use_connect = True

# ── handle bones (TANGENT: the handle's -Y axis becomes the Bézier tangent) ──
# Root handle: unparented, positioned below the chain.  Rotating it steers the
# entry tangent of spine_01 independently of the bone's own rotation.
hb_root            = arm_data.edit_bones.new("bbone_handle_root")
hb_root.head       = Vector((0.0, 0.0, -HANDLE_LEN))
hb_root.tail       = Vector((0.0, 0.0,  0.0))

# Tip handle: parented to the last spine bone so it travels with the chain.
hb_tip             = arm_data.edit_bones.new("bbone_handle_tip")
hb_tip.head        = Vector((0.0, 0.0, TORSO_HEIGHT))
hb_tip.tail        = Vector((0.0, 0.0, TORSO_HEIGHT + HANDLE_LEN))
hb_tip.parent      = arm_data.edit_bones[spine_names[-1]]
hb_tip.use_connect = True

# Wire TANGENT handles to the chain endpoints.
first_eb = arm_data.edit_bones[spine_names[0]]
last_eb  = arm_data.edit_bones[spine_names[-1]]

first_eb.bbone_custom_handle_start = hb_root
first_eb.bbone_handle_type_start   = "TANGENT"

last_eb.bbone_custom_handle_end    = hb_tip
last_eb.bbone_handle_type_end      = "TANGENT"

bpy.ops.object.mode_set(mode="OBJECT")

# ── parent torso → armature (Automatic Weights) ───────────────────────────────
# mesh selected first, then armature (armature must be active for the operator)
bpy.ops.object.select_all(action="DESELECT")
torso_obj.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

arm_data.show_axes = False

print("── B-Bones spine rig complete ──────────────────────────────────────────")
print(f"  Spine bones    : {SPINE_BONES}  ×  {BBONE_SEGS} segments")
print(f"  GLB export     : {SPINE_BONES * BBONE_SEGS} standard linear bones after bake")
print(f"  Torso loops    : {TORSO_LOOPS}  (1 loop : 1 sub-segment)")
print("  Pose Mode tips :")
print("    • Select spine_02–05, press R X — bend the mid-spine")
print("    • Select bbone_handle_root, press R Y — steer the entry tangent")
print("    • Properties > Bone > Bendy Bones > Segments: change at runtime")
print("  GLB export : File > Export > glTF 2.0, enable Armature > Apply Pose")
