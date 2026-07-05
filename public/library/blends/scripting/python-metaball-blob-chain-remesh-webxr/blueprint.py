# blueprint.py — Python bpy.types.MetaBall
# Implicit Blob Chain: Organic Shape Blocking → Voxel Remesh → GLB for WebXR
# Blender 5.1 — Holoflow Studio
#
# Technique: bpy.data.metaballs.new() creates a MetaBall data-block — an
# implicit surface defined by summing potential fields from each element.
# The isosurface at mb.threshold separates solid from air. Two MetaBall
# objects whose names share a family prefix (everything before the first '.')
# merge automatically into one unified isosurface: 'BlobBody' and
# 'BlobBody.001' are one surface; 'OtherBlob' is independent.
# After convert(), a Voxel Remesh modifier produces all-quad topology at a
# controlled edge length. Decimate then targets WebXR's poly budget.
#
# Outputs: blob_chain.glb (GLB, Draco 6, WebP textures)

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
CHAIN_SEGMENTS  = 6        # BALL elements in the body chain
RADIUS_MID      = 0.30     # maximum radius at the centre of the chain (m)
RADIUS_END      = 0.14     # minimum radius at chain tips (m)
STIFFNESS       = 1.0      # field falloff: 1.0 smooth merge, 2.0 distinct lumps
THRESHOLD       = 0.60     # isovalue: lower → puffier merges, higher → tighter
RESOLUTION_VIEW = 0.08     # viewport metaball mesh resolution in m
RESOLUTION_RND  = 0.04     # render-resolution; used at convert() time in Blender
CURVE_AMP       = 0.25     # lateral S-curve amplitude for spine organic feel (m)
HEAD_RADIUS     = 0.38     # head blob radius (same family → merges into body)
HEAD_OFFSET     = Vector((0.0, 0.55, 0.55))   # head position above chain top
VOXEL_SIZE      = 0.05     # Remesh voxel edge length: 0.05 = medium detail
DECIMATE_RATIO  = 0.40     # Decimate collapse ratio for GLB poly budget
OUTPUT_GLB      = "//blob_chain.glb"
FAMILY          = "BlobChain"   # shared prefix → all objects merge into one surface

# ── Scene reset ────────────────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for mb in list(bpy.data.metaballs):
    bpy.data.metaballs.remove(mb, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me, do_unlink=True)

col = bpy.context.scene.collection

# ── Helper: link object to scene ───────────────────────────────────────────────
def link(obj):
    col.objects.link(obj)
    return obj

# ── MetaBall 1: body chain ─────────────────────────────────────────────────────
# bpy.data.metaballs.new(name) creates the MetaBall data-block.
# The object name controls family membership: FAMILY and FAMILY.001 merge;
# a different prefix creates an independent isosurface.
mb_body = bpy.data.metaballs.new(FAMILY)
obj_body = link(bpy.data.objects.new(FAMILY, mb_body))

# resolution (view) and render_resolution are in Blender units.
# Smaller = denser metaball mesh = longer viewport feedback but finer surface.
# resolution is used for interactive display; render_resolution for F12 and
# for the mesh produced by bpy.ops.object.convert().
mb_body.resolution        = RESOLUTION_VIEW
mb_body.render_resolution = RESOLUTION_RND
mb_body.threshold         = THRESHOLD

# Compute spine positions along an S-curve: sin wave gives organic posture.
# Chain runs bottom-to-top along Y with lateral sway in X.
spacing = 0.42   # element centre-to-centre distance
for i in range(CHAIN_SEGMENTS):
    t = i / max(CHAIN_SEGMENTS - 1, 1)   # 0.0 → 1.0

    # Radius tapers from RADIUS_END at tips to RADIUS_MID at centre
    taper = math.sin(t * math.pi)          # peak at mid-chain
    radius = RADIUS_END + (RADIUS_MID - RADIUS_END) * taper

    x = CURVE_AMP * math.sin(t * math.pi * 2.0)
    y = (i - CHAIN_SEGMENTS / 2) * spacing
    z = 0.0

    elem = mb_body.elements.new(type='BALL')
    # elem.co is local to the MetaBall object origin
    elem.co        = Vector((x, y, z))
    elem.radius    = radius
    # stiffness controls how sharply the field falls off at the element boundary:
    #   1.0 → Gaussian-like smooth falloff (elements merge at a distance)
    #   2.0 → faster falloff → elements stay distinct until nearly touching
    elem.stiffness = STIFFNESS

# ── MetaBall 2: head blob (same family) ───────────────────────────────────────
# Naming 'FAMILY.001' makes Blender treat this as part of the same isosurface.
# The '.' separator is the family boundary — everything after it is the suffix.
# All objects in the same family share the threshold and resolution of the
# FIRST object (alphabetically by name) in that family.
mb_head = bpy.data.metaballs.new(FAMILY + ".001")
obj_head = link(bpy.data.objects.new(FAMILY + ".001", mb_head))
obj_head.location = HEAD_OFFSET

elem_h = mb_head.elements.new(type='BALL')
elem_h.co        = Vector((0.0, 0.0, 0.0))
elem_h.radius    = HEAD_RADIUS
elem_h.stiffness = 1.0

# ── MetaBall 3: tail CAPSULE (same family) ─────────────────────────────────────
# CAPSULE elements extend the field along the element's local Z axis.
# The length of the capsule shaft is controlled by elem.radius — the capsule
# hemisphere caps each sit at ± radius from the origin along Z. Rotation is
# applied via the MetaBall object's own rotation, not on the element directly.
mb_tail = bpy.data.metaballs.new(FAMILY + ".002")
obj_tail = link(bpy.data.objects.new(FAMILY + ".002", mb_tail))
tail_y   = -(CHAIN_SEGMENTS / 2) * spacing - 0.1
obj_tail.location = Vector((0.0, tail_y, -0.0))
import math as _m
obj_tail.rotation_euler = (_m.radians(90), 0.0, 0.0)

elem_t = mb_tail.elements.new(type='CAPSULE')
elem_t.co        = Vector((0.0, 0.0, 0.0))
elem_t.radius    = 0.22   # capsule hemisphere radius and half-length
elem_t.stiffness = 1.2

# ── Material ───────────────────────────────────────────────────────────────────
def make_mat(name, base_color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value  = roughness
    bsdf.inputs["Metallic"].default_value   = metallic
    return mat

mat_blob = make_mat("hf_blob_body", (0.62, 0.78, 0.55), roughness=0.60)

for o in [obj_body, obj_head, obj_tail]:
    if mat_blob.name not in [m.name for m in o.data.materials]:
        o.data.materials.append(mat_blob)

# ── Force viewport update so metaball mesh is tessellated ─────────────────────
bpy.context.view_layer.update()

# ── Convert to Mesh ────────────────────────────────────────────────────────────
# bpy.ops.object.convert() works on the active object with use_selected=True.
# It replaces obj.data with a bpy.types.Mesh; the original MetaBall data-blocks
# are orphaned. Blender merges all same-family objects into ONE Mesh at this
# step — so three BlobChain.* objects become a single BlobChain Mesh object.
# render_resolution (not resolution) drives the tessellation density; lower
# render_resolution = finer mesh = better convert() fidelity.
for o in bpy.context.scene.objects:
    o.select_set(False)
for o in [obj_body, obj_head, obj_tail]:
    o.select_set(True)
bpy.context.view_layer.objects.active = obj_body
bpy.ops.object.convert(target='MESH')

# After convert(), obj_body holds the merged mesh; obj_head and obj_tail are gone
obj_mesh = bpy.context.view_layer.objects.active

# ── Voxel Remesh ───────────────────────────────────────────────────────────────
# The raw metaball mesh has irregular triangles that vary in density with
# resolution. Voxel Remesh re-grids to uniform all-quad topology at VOXEL_SIZE
# edge length — critical for clean shading normals and predictable UV layouts.
# use_smooth_shade = True before remesh ensures vertex normals are interpolated
# post-remesh. adaptivity = 0 keeps uniform quads; > 0 allows coarser quads
# in flat regions (useful for very large meshes, at the cost of irregular loops).
mod_remesh = obj_mesh.modifiers.new("Remesh", type='REMESH')
mod_remesh.mode           = 'VOXEL'
mod_remesh.voxel_size     = VOXEL_SIZE
mod_remesh.adaptivity     = 0.0
mod_remesh.use_smooth_shade = True

bpy.ops.object.modifier_apply(modifier="Remesh")

# ── Decimate ──────────────────────────────────────────────────────────────────
# Voxel Remesh can produce 30k–80k tris for a human-scale organic shape at 0.05m.
# Decimate COLLAPSE at 0.40 ratio cuts ~60% of the tris while preserving
# silhouette and major surface curvature — WebXR LOD0 target is ≤ 15k tris.
mod_dec = obj_mesh.modifiers.new("Decimate", type='DECIMATE')
mod_dec.decimate_type = 'COLLAPSE'
mod_dec.ratio         = DECIMATE_RATIO

bpy.ops.object.modifier_apply(modifier="Decimate")

# ── Smart UV Project ───────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = obj_mesh
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# ── Holoflow facet tag + rename ────────────────────────────────────────────────
obj_mesh.name              = "BlobCreature"
obj_mesh["holoflow:facet"] = False   # smooth normals — required for organic shapes

# ── GLB export ────────────────────────────────────────────────────────────────
for o in bpy.context.scene.objects:
    o.select_set(False)
obj_mesh.select_set(True)
bpy.context.view_layer.objects.active = obj_mesh

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
)

print(f"blob_chain.glb written: {bpy.path.abspath(OUTPUT_GLB)}")
