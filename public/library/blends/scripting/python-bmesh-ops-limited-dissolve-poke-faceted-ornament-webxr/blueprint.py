# ================================================================
# Python bmesh.ops — Limited Dissolve + Poke
# Dense → Faceted Sphere Ornament  |  Blender 5.1 Blueprint
# ================================================================
# Topology reduction is the mirror image of construction: start dense,
# dissolve near-coplanar edges to surface large facet polygons, then
# selectively poke the biggest faces into centroid-fan triangles for
# starburst ornament detail.  Three bmesh.ops sit centre-stage here:
#   • limited_dissolve  — angle-threshold batch dissolution
#   • dissolve_edges    — surgical single-edge removal
#   • poke              — N-gon to N-triangle fan split
# Together they turn a subdivided icosphere into a gem-like ornament
# without any manual topology work or bpy.ops context dependency.
#
# Run: blender --background --python blueprint.py
# Output written relative to this script location:
#   ornament_faceted.blend   (animated .blend with materials)
#   /tmp/<SLUG>.glb          (Draco-compressed WebXR GLB)

import bpy, bmesh, math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
RADIUS           = 1.0    # sphere radius in metres (1 m = studio default scale)
SUBDIVISIONS     = 2      # icosphere frequency: 2 → 80 tris / 42 verts
LD_ANGLE_DEG     = 30.0   # limited_dissolve: collapse edges below this dihedral (°)
MANUAL_ANGLE_DEG = 8.0    # dissolve_edges: secondary pass for micro-artefacts (°)
POKE_TOP_N       = 4      # poke the N largest merged faces into star fans
POKE_OFFSET      = 0.06   # raise fan centre outward along face normal (0 = flat)
SLUG             = "python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
EXPORT_PATH      = f"/tmp/{SLUG}.glb"
DRACO_LEVEL      = 6
COL_BODY         = (0.12, 0.45, 0.68, 1.0)   # cobalt facet panels
COL_STAR         = (0.88, 0.55, 0.02, 1.0)   # amber poke-fan highlight

# ── Clear scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials):
    for item in list(blk): blk.remove(item)

# ── 1. Dense icosphere via bmesh.ops ─────────────────────────────────────────
# bmesh.ops.create_icosphere requires no viewport context, no active object,
# and no undo stack — identical API whether in the Text Editor, a headless
# batch run, or an add-on Operator.execute().
# subdivisions=2 → 80 equilateral tris: enough micro-faces for limited_dissolve
# to have material to merge while staying readable in the UV editor.
me = bpy.data.meshes.new("ornament_faceted")
bm = bmesh.new()

bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=RADIUS)
bm.faces.ensure_lookup_table()
bm.verts.ensure_lookup_table()
bm.normal_update()
print(f"[1] icosphere: {len(bm.faces)} faces / {len(bm.verts)} verts")
# Expected with SUBDIVISIONS=2: 80 faces / 42 verts

# ── 2. limited_dissolve — angle-threshold batch topology reduction ─────────────
# Collapses every edge whose dihedral angle (face-to-face) is below angle_limit.
# "Near-coplanar edges disappear; sharp silhouette edges survive."
#
# delimit=set(): empty set means NO barriers — edges dissolve across material,
# seam, UV, and sharp boundaries alike.  Restrict with e.g. {'MATERIAL','SHARP'}
# to preserve hard-edge marks or multi-material split lines.
#
# use_dissolve_boundaries=False: keeps open-boundary edges (perimeter of the
# mesh if it were open) even when they pass the angle test.  For a closed
# sphere this has no effect, but the explicit flag makes intent clear.
#
# Result at LD_ANGLE_DEG=30°: typically 20–32 irregular N-gons (very faceted).
# At 5°: almost nothing dissolves (sphere is already smooth at S=2).
# At 60°: reduces to ~12 faces — approaching the base icosahedron.
bmesh.ops.limited_dissolve(
    bm,
    angle_limit=math.radians(LD_ANGLE_DEG),
    use_dissolve_boundaries=False,
    delimit=set(),
)
bm.faces.ensure_lookup_table()
bm.normal_update()
print(f"[2] after limited_dissolve({LD_ANGLE_DEG}°): "
      f"{len(bm.faces)} faces / {len(bm.verts)} verts")

# ── 3. dissolve_edges — surgical micro-edge cleanup ────────────────────────────
# limited_dissolve uses a fixed threshold applied globally in one sweep.
# Rarely, winding inconsistencies near the base icosahedron's 5-valent verts
# leave sub-threshold edges that survived because their adjacent faces had
# inconsistent normals at evaluation time.  A second manual pass cleans these up.
#
# e.calc_face_angle(fallback) returns the dihedral angle in RADIANS between
# the two faces sharing this edge.  The fallback fires for boundary edges
# (len(e.link_faces) < 2) — math.pi treats them as "flat = keep".
# Guard len(e.link_faces) == 2 explicitly before angle calculation to avoid
# the fallback masking genuine boundary edges.
#
# use_verts=True: also dissolves any resulting "wire" vertices left after
# edge dissolution (verts with exactly 2 collinear remaining edges).
# use_face_split=False: no vertex insertion at face intersections — correct
# for convex geometry; False is needed when dissolving non-manifold edges.
micro_edges = [
    e for e in bm.edges
    if len(e.link_faces) == 2
    and math.degrees(e.calc_face_angle(math.pi)) < MANUAL_ANGLE_DEG
]

if micro_edges:
    bmesh.ops.dissolve_edges(bm, edges=micro_edges,
                             use_verts=True, use_face_split=False)
    bm.faces.ensure_lookup_table()
    bm.normal_update()
    print(f"[3] dissolved {len(micro_edges)} micro-edges below {MANUAL_ANGLE_DEG}°")
else:
    print(f"[3] no micro-edges below {MANUAL_ANGLE_DEG}° found — skipping")

# ── 4. poke — insert centroid fan in the N largest merged faces ────────────────
# After dissolution the sphere carries large irregular N-gons where many original
# triangles merged.  poke() inserts one vertex at the face centre and draws
# edges to every corner vertex, replacing one N-gon with N triangles.
#
# center_mode='MEAN_WEIGHTED': weights the fan centre by triangle area rather
# than vertex count — the best choice for irregular N-gons where a simple
# arithmetic mean would shift the centre toward dense vert clusters.
# 'MEAN' (unweighted) can place the centre off-surface for concave faces.
# 'BOUNDS' uses the bounding-box mid-point — reliable only for rectangular faces.
#
# offset > 0 pushes the fan centre outward along the face normal, creating a
# faceted pyramid peak (visible in PBR as a specular highlight ridge).
# Set POKE_OFFSET = 0.0 for a flat starburst with no elevation.
#
# Sort by vertex count as a proxy for face area: larger merged faces have more
# vertices because they absorbed more original icosphere triangles.
merged_faces = sorted(bm.faces, key=lambda f: len(f.verts), reverse=True)
poke_faces   = merged_faces[:POKE_TOP_N]

poke_ret = bmesh.ops.poke(
    bm, faces=poke_faces,
    offset=POKE_OFFSET,
    use_relative_offset=False,
    center_mode='MEAN_WEIGHTED',
)
# Assign the amber highlight material to every new triangle in the star fan.
# poke_ret['faces'] = all new BMFace objects produced (N triangles per poked face).
for f in poke_ret['faces']:
    f.material_index = 1

bm.faces.ensure_lookup_table()
bm.normal_update()
print(f"[4] poke created {len(poke_ret['faces'])} star triangles")

# ── 5. Recalc normals after surgery ───────────────────────────────────────────
# poke inherits winding from the original face, but the raised fan centre
# introduces new face orientations.  recalc_face_normals flood-fills outward
# orientation assuming a convex volume — safe for this sphere topology.
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# ── 6. Flat shade every face ──────────────────────────────────────────────────
# f.smooth = False on a BMFace uses geometric face normals per polygon —
# the faceted look requires no custom split-normal layer, no per-loop normals.
# Setting this before bm.to_mesh() avoids a separate bpy.ops.object.shade_flat()
# call which would require an active object in the viewport.
for f in bm.faces:
    f.smooth = False

# ── 7. Triangulate for glTF 2.0 ───────────────────────────────────────────────
# glTF 2.0 requires triangles in all primitive data.  BEAUTY triangulation
# minimises the longest diagonal per quad (Delaunay-like).  EAR_CLIP handles
# concave N-gons robustly.  Faces already triangulated by the poke pass are
# no-ops but listed anyway — bmesh.ops.triangulate is idempotent on tris.
bmesh.ops.triangulate(bm, faces=list(bm.faces),
                      quad_method='BEAUTY', ngon_method='EAR_CLIP')
print(f"[7] final mesh: {len(bm.faces)} tris / {len(bm.verts)} verts")

# ── 8. Write to Blender mesh data-block ───────────────────────────────────────
bm.to_mesh(me)
bm.free()   # C allocation — not GC-managed; omitting this leaks memory in batch loops

# ── Materials ─────────────────────────────────────────────────────────────────
def _mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = rgba
        bsdf.inputs['Roughness'].default_value  = 0.28
        bsdf.inputs['Metallic'].default_value   = 0.60
    return m

me.materials.append(_mat("ornament_body", COL_BODY))   # index 0 — cobalt
me.materials.append(_mat("ornament_star", COL_STAR))   # index 1 — amber

# ── Link object into scene ────────────────────────────────────────────────────
obj = bpy.data.objects.new("ornament_faceted", me)
obj.name = "ornament_faceted"   # holoflow: snake_case root name
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj

# ── Rotation animation (kept for record.py camera + viewport recording) ───────
obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0.0, 0.0, math.radians(360.0))
obj.keyframe_insert("rotation_euler", frame=120)
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 120

# ── Save .blend ───────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//ornament_faceted.blend"))
print(f"[save] ornament_faceted.blend written")

# ── Export GLB ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
)
print(f"[export] {EXPORT_PATH}")
