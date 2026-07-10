# BLUEPRINT: bpy.types.VertexGroup
# Scripted Vertex Weight Assignment, Group Merging & VRM Deformation Envelope Bake
# Blender 5.1 | Holoflow Studio | CC0
#
# Technique: build a three-bone humanoid proxy rig with a skinned cylinder mesh.
# Manual radial-falloff weights are written first via the data API; the envelope
# bake is then demonstrated as a second strategy so the reader can compare outputs.
# All bpy.ops calls that require context (paint.weight_from_bones, export) are
# wrapped in temp_override() — the pattern documented in the context-override
# tutorial at /tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting.
#
# Why data API first, bpy.ops second?
#   bpy.ops.paint.weight_from_bones() polls for an active armature-modded mesh in
#   Object mode with an armature selected — fragile preconditions in headless runs.
#   Writing weights through ob.vertex_groups.add() has NO context requirements and
#   works identically whether Blender is interactive or --background.

import bpy
import bmesh
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
ARM_NAME    = "HumanoidRig"
MESH_NAME   = "BodyProxy"
# (bone_name, head_z, tail_z, envelope_radius)
BONE_DEFS   = [
    ("Root",  0.00, 0.40, 0.22),
    ("Spine", 0.40, 1.00, 0.18),
    ("Head",  1.00, 1.30, 0.16),
]
CLEAN_LIMIT = 0.001   # weights below this are noise; drop before normalise
DRACO_LVL   = 6
OUT_GLB     = "//vertex_group_vrm_proxy.glb"
OUT_BLEND   = "//vertex_group_vrm_proxy.blend"

# ── Step 1: Clean scene & build armature ──────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

arm_data = bpy.data.armatures.new(ARM_NAME)
arm_ob   = bpy.data.objects.new(ARM_NAME, arm_data)
sc.collection.objects.link(arm_ob)
sc.view_layer.objects.active = arm_ob

# Edit-bone creation must happen in EDIT mode — there is no data-API shortcut.
with bpy.context.temp_override(active_object=arm_ob):
    bpy.ops.object.mode_set(mode='EDIT')
    ebs = arm_data.edit_bones
    prev = None
    for bname, hz, tz, env_r in BONE_DEFS:
        eb          = ebs.new(bname)
        eb.head     = Vector((0, 0, hz))
        eb.tail     = Vector((0, 0, tz))
        # Envelope radius used by weight_from_bones(type='ENVELOPES').
        # Set here, in edit mode, before leaving EDIT — envelope_distance
        # is only writable on EditBone, not on Bone.
        eb.envelope_distance = env_r
        eb.envelope_weight   = 1.0
        if prev:
            eb.parent       = prev
            eb.use_connect  = True
        prev = eb
    bpy.ops.object.mode_set(mode='OBJECT')

# ── Step 2: Build cylinder mesh via bmesh ─────────────────────────────────────
me = bpy.data.meshes.new(MESH_NAME)
ob = bpy.data.objects.new(MESH_NAME, me)
sc.collection.objects.link(ob)

bm = bmesh.new()
# create_cone centres at origin; translate up so base sits at Z=0.
bmesh.ops.create_cone(
    bm, cap_ends=True, cap_tris=False,
    segments=16, radius1=0.12, radius2=0.12,
    depth=1.30, calc_uvs=True,
)
bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((0, 0, 0.65)))
bm.to_mesh(me)
bm.free()
me.update()

# ── Step 3: Script vertex group creation + radial-falloff weights ──────────────
# Group names must exactly match pose bone names for the Armature modifier to
# bind correctly.  A typo here creates a silent failure: the mesh exports with
# no deformation, no error raised.
groups = {
    bname: ob.vertex_groups.new(name=bname)
    for bname, *_ in BONE_DEFS
}

def linear_weight(vert_z: float, head_z: float, tail_z: float) -> float:
    """Return a weight in [0,1] that peaks at the bone centre and falls off
    linearly to 0 at a distance equal to half the bone length beyond each end.

    This intentionally produces overlapping influences — adjacent bones share
    vertices in the transition zone — which is what blendskinning needs to
    produce smooth deformation in the overlapping region.
    """
    centre = (head_z + tail_z) * 0.5
    # half-length + a small epsilon avoids div-by-zero on zero-length bones
    half   = abs(tail_z - head_z) * 0.5 + 1e-6
    return max(0.0, 1.0 - abs(vert_z - centre) / half)

for v in me.vertices:
    z = v.co.z
    for bname, hz, tz, _ in BONE_DEFS:
        w = linear_weight(z, hz, tz)
        if w > CLEAN_LIMIT:
            # 'REPLACE' overwrites any prior entry for this vertex in this group.
            # 'ADD' / 'SUBTRACT' require an existing entry — they silently no-op
            # if the vertex is not yet in the group, making them wrong for first
            # population.  Always use REPLACE when setting initial weights.
            groups[bname].add([v.index], w, 'REPLACE')

# ── Step 4: Normalise + verify per-vertex sums ────────────────────────────────
# VRM skin weights must sum to 1.0 per vertex; the GLB exporter does NOT
# auto-normalise.  vertex_group_normalize_all() rescales every group weight so
# the column sum is 1.0 while preserving the ratio between bones.
# vertex_group_clean() then removes entries below CLEAN_LIMIT to trim the
# vertex-bone association list (GLB skinning supports up to 4 influences per
# vertex; excess or noise entries bloat the file and can confuse decoders).
sc.view_layer.objects.active = ob
ob.select_set(True)
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.vertex_group_normalize_all(
        group_select_mode='ALL', lock_active=False
    )
    bpy.ops.object.vertex_group_clean(
        group_select_mode='ALL', limit=CLEAN_LIMIT, keep_single=False
    )

# Verify: print the first four vertices
# me.vertices[i].groups → sequence of VertexGroupElement
# VertexGroupElement.group = index into ob.vertex_groups
# VertexGroupElement.weight = float in [0, 1]
for v in me.vertices[:4]:
    total  = sum(g.weight for g in v.groups)
    detail = [(ob.vertex_groups[g.group].name, round(g.weight, 3)) for g in v.groups]
    print(f"  v{v.index:3d}  sum={total:.4f}  {detail}")

# ── Step 5: Armature modifier + envelope-bake (alternative strategy) ──────────
mod                    = ob.modifiers.new("Armature", 'ARMATURE')
mod.object             = arm_ob
mod.use_bone_envelopes = True   # Bone envelope volumes (set via envelope_distance)
mod.use_vertex_groups  = True   # also honour group-based skinning; both active

# weight_from_bones() polls:
#   - context.active_object is a mesh with an Armature modifier referencing an armature
#   - the armature object is in context.selected_objects
#   - mode is OBJECT
# Passing the wrong combination raises RuntimeError silently — the groups are
# simply not updated.  temp_override guarantees the poll state.
arm_ob.select_set(True)
with bpy.context.temp_override(
    active_object=ob,
    selected_objects=[ob, arm_ob],
    object=ob,
):
    bpy.ops.paint.weight_from_bones(type='ENVELOPES')
# NOTE: this OVERWRITES the manual weights set in Step 3.
# If you want manual overrides to win, either:
#   a) run the bake first, then patch specific vertices via Step 3's API, or
#   b) skip the bake entirely and rely only on the data-API weights.
print(f"[holoflow] groups post-bake: {[g.name for g in ob.vertex_groups]}")

# Re-normalise after bake — envelope bake does not guarantee sum=1.0.
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.vertex_group_normalize_all(
        group_select_mode='ALL', lock_active=False
    )
    bpy.ops.object.vertex_group_clean(
        group_select_mode='ALL', limit=CLEAN_LIMIT, keep_single=False
    )

# ── Step 6: Export skinned GLB + save .blend ──────────────────────────────────
# export_skins=True writes the JOINTS_0/WEIGHTS_0 attributes into the GLB.
# Without it, the armature modifier bakes to static positions and the skeleton
# is absent from the file — a silent mistake that breaks VRM viewers.
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_apply=False,
        export_skins=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_yup=True,
        export_normals=True,
    )
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print("[holoflow] vertex group VRM proxy exported")
