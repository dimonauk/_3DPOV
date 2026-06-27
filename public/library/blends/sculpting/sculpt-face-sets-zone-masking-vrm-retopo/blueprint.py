"""
Blender 5.1 — Sculpt Face Sets: Zone Masking & Pre-Retopology Planning
Blueprint: programmatic face-set assignment + vertex-colour derivation + GLB export

Face Sets are stored as the '.sculpt_face_set' INT attribute on the FACE domain.
They appear as colour-coded regions in Sculpt Mode, drive masking and hide/show,
and can be converted to vertex groups for weight-paint retopology planning.

This blueprint does four things:
  1. Creates a low-poly head-proxy UV sphere (32×24 segs, 0.5 m radius).
  2. Assigns four zone IDs to every face by Z-height band:
       Zone 1  Z > 0.40 m   — cranial cap (top of skull)
       Zone 2  0.05–0.40 m  — facial plane (brow → upper lip)
       Zone 3 −0.30–0.05 m  — jaw / lower neck
       Zone 4  Z < −0.30 m  — base cap (occipital)
  3. Derives a vertex-colour attribute 'hs_zone_col' from the zone IDs so the
     GLB carries readable colour data for Three.js material selection.
  4. Exports the annotated mesh as a GLB with vertex colours intact.

Departure from the operator API: face-set assignment uses the mesh attribute API
directly (mesh.attributes['.sculpt_face_set'].data[i].value) rather than
bpy.ops.sculpt.face_sets_create(), because the ops require Sculpt Mode context
and a live brush pass.  The attribute approach is headless-safe and idempotent.

Source: Blender Manual (CC-BY-SA-4.0), Blender Foundation.
https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/editing/face_sets.html
"""

import bpy
import mathutils
import math

# ─── parameters ──────────────────────────────────────────────────────────────
SPHERE_SEGMENTS  = 32
SPHERE_RINGS     = 24
SPHERE_RADIUS    = 0.5          # metres — head-scale reference

# Z-height thresholds (world space, sphere centred at origin)
ZONE_TOP_Z    =  0.40 * SPHERE_RADIUS   # cranial cap above this
ZONE_UPPER_Z  =  0.05 * SPHERE_RADIUS   # facial plane above this
ZONE_LOWER_Z  = -0.30 * SPHERE_RADIUS   # jaw above this; base below

# RGBA colours per zone — used for the hs_zone_col vertex-colour attribute
# These map to three.js vertex colour channels (r,g,b,a) in range 0–1
ZONE_COLOURS = {
    1: (0.90, 0.22, 0.22, 1.0),   # cranial  — warm red
    2: (0.22, 0.78, 0.32, 1.0),   # facial   — sage green
    3: (0.20, 0.42, 0.88, 1.0),   # jaw      — periwinkle blue
    4: (0.88, 0.68, 0.12, 1.0),   # base     — amber
}

EXPORT_PATH = "//sculpt_face_sets_zones.glb"

# ─── scene reset ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# ─── renderer ────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.film_transparent = False

# ─── 1. HEAD-PROXY MESH ──────────────────────────────────────────────────────
# UV Sphere: best for face-set zone planning because its horizontal rings map
# cleanly to anatomical belts (cranial, orbital, maxillary, mandibular).
# Ico sphere produces triangles that don't follow Z-height bands as cleanly.
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SPHERE_SEGMENTS,
    ring_count=SPHERE_RINGS,
    radius=SPHERE_RADIUS,
    location=(0.0, 0.0, 0.0),
)
obj = bpy.context.active_object
obj.name = "head_proxy"
mesh = obj.data
mesh.name = "head_proxy_mesh"

# Apply scale so world Z == local Z — critical for correct face-set assignment
bpy.ops.object.transform_apply(scale=True)

# ─── 2. SCULPT FACE-SET ATTRIBUTE ────────────────────────────────────────────
# '.sculpt_face_set' is the internal Blender attribute name; the leading dot
# marks it as "internal" and Blender reserves it for sculpt data.
# In Blender 4.2+ you can read/write it from Python like any other attribute.
# CRITICAL: the attribute must exist before reading — primitive_uv_sphere_add
# does NOT create it; we create it here.
face_set_attr = mesh.attributes.new(
    name='.sculpt_face_set',
    type='INT',
    domain='FACE',
)

# Assign zone IDs by face centroid Z position.
# face.center returns the average position of the face's vertices in object
# space (not world space), which equals world space here because we applied
# transforms above.
for i, face in enumerate(mesh.polygons):
    z = face.center.z
    if z > ZONE_TOP_Z:
        zone_id = 1
    elif z > ZONE_UPPER_Z:
        zone_id = 2
    elif z > ZONE_LOWER_Z:
        zone_id = 3
    else:
        zone_id = 4
    face_set_attr.data[i].value = zone_id

# ─── 3. VERTEX-COLOUR ATTRIBUTE ──────────────────────────────────────────────
# '.sculpt_face_set' is not exported by the GLB exporter (it's internal).
# We derive a BYTE_COLOR attribute 'hs_zone_col' on the CORNER domain so it
# exports as a COLOR_0 accessor in the GLB and reads in Three.js as
# geometry.attributes.color.  CORNER domain means each face corner can hold
# a distinct colour — a requirement for flat-shaded faceted looks.
vc_attr = mesh.attributes.new(
    name='hs_zone_col',
    type='BYTE_COLOR',
    domain='CORNER',
)

# Build a lookup: face index → zone ID (already set above)
zone_by_face = [face_set_attr.data[i].value for i in range(len(mesh.polygons))]

# Each polygon has len(polygon.loop_indices) corners; we must iterate loop
# indices to map corner → face
for face in mesh.polygons:
    rgba = ZONE_COLOURS[zone_by_face[face.index]]
    for loop_idx in face.loop_indices:
        col = vc_attr.data[loop_idx]
        col.color = rgba

# ─── 4. MATERIAL: VERTEX COLOUR PASSTHROUGH ──────────────────────────────────
# Wire up a simple material that reads hs_zone_col so the viewport shows zones.
# In Object Mode + Material Preview, you'll see the four coloured bands.
mat = bpy.data.materials.new(name="face_set_zones")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

output_node = nodes.new('ShaderNodeOutputMaterial')
output_node.location = (400, 0)

bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (100, 0)
bsdf.inputs['Roughness'].default_value = 0.9
bsdf.inputs['Metallic'].default_value  = 0.0

vc_node = nodes.new('ShaderNodeVertexColor')
vc_node.location = (-200, 0)
vc_node.layer_name = 'hs_zone_col'

links.new(vc_node.outputs['Color'], bsdf.inputs['Base Color'])
links.new(bsdf.outputs['BSDF'], output_node.inputs['Surface'])

obj.data.materials.append(mat)

# ─── 5. SHADE SMOOTH ─────────────────────────────────────────────────────────
# Smooth shading gives a clean silhouette for the orbiting viewport render;
# for the actual sculpt session you would use 'Flat' to see polygon detail.
bpy.ops.object.shade_smooth()

# ─── 6. CAMERA + LIGHTING ────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -1.6, 0.15))
cam_obj = bpy.context.active_object
cam_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
scene.camera = cam_obj

bpy.ops.object.light_add(type='SUN', location=(2.0, -1.0, 3.0))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(45), math.radians(15), 0.0)

bpy.ops.object.light_add(type='AREA', location=(-1.5, -1.0, 1.5))
fill = bpy.context.active_object
fill.data.energy = 60.0
fill.data.size    = 2.0

# ─── 7. SCULPT MODE CONFIGURATION (reference — not executed headless) ─────────
# The lines below show the operator calls you would run interactively.
# They require Sculpt Mode context and an active brush stroke; they are
# provided as documentation, NOT run by this script.
#
# # Enter sculpt mode:
# bpy.ops.object.mode_set(mode='SCULPT')
#
# # Create a face set from a flood fill starting under the cursor:
# bpy.ops.sculpt.face_sets_create(mode='MASKED')
# bpy.ops.sculpt.face_sets_create(mode='VISIBLE')
# bpy.ops.sculpt.face_sets_create(mode='FACE_ANGLE', threshold=0.4)
#
# # Expand selection to the entire connected region:
# bpy.ops.sculpt.face_set_change_visibility(mode='TOGGLE')
#
# # Init face sets from topology:
# bpy.ops.sculpt.face_sets_init(mode='LOOP_SEAM', threshold=0.5)

# ─── 8. VERTEX GROUP DERIVATION ──────────────────────────────────────────────
# Convert zone IDs to vertex groups for retopology and weight-paint planning.
# This is the bridge between sculpt-mode face sets and armature skinning.
#
# Each zone gets a vertex group where weight = 1.0 for verts that EXCLUSIVELY
# belong to faces in that zone.  Verts shared across zone boundaries get the
# weight of the zone that owns the most faces using that vertex.
#
# Step 1: count zone votes per vertex
vert_zone_votes = [{} for _ in range(len(mesh.vertices))]
for face in mesh.polygons:
    zid = zone_by_face[face.index]
    for vi in face.vertices:
        vert_zone_votes[vi][zid] = vert_zone_votes[vi].get(zid, 0) + 1

for zone_id, colour in ZONE_COLOURS.items():
    vg = obj.vertex_groups.new(name=f"hs_zone_{zone_id:02d}")
    majority_verts = [
        vi for vi, votes in enumerate(vert_zone_votes)
        if max(votes, key=votes.get) == zone_id
    ]
    vg.add(majority_verts, 1.0, 'REPLACE')

# ─── 9. EXPORT GLB ───────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    use_selection=True,
    export_apply=True,                    # apply modifiers + transforms
    export_colors=True,                   # include hs_zone_col → COLOR_0
    export_vertex_groups=False,           # skip VGs — data is in hs_zone_col
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,                      # +Y up — three.js convention
)

print("Blueprint complete: sculpt_face_sets_zones.glb written.")
print(f"  {len(mesh.polygons)} faces partitioned into {len(ZONE_COLOURS)} zones.")
print("  Vertex groups: hs_zone_01 … hs_zone_04 available for armature binding.")
