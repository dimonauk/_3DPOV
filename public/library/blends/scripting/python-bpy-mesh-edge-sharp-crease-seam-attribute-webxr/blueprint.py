"""
Python Mesh Edge Attribute API — Sharp / Crease / Seam Mark Pipeline
Blender 5.1  |  Holoflow Studio  |  CC0

Technique: build a low-poly faceted dome, then drive all shading behaviour
through the three key edge attribute channels:
  "sharp_edge"   — BOOLEAN per-edge: normal-split boundary (canonical 5.1)
  "crease_edge"  — FLOAT per-edge:   SubSurf sharpness weight (0–1)
  use_seam       — still on MeshEdge directly (not yet migrated to attribute)

Key 5.1 migration ─────────────────────────────────────────────────────
Blender 4.1 converted use_edge_sharp and edge.crease from fixed per-element
slots into named Attribute layers on the mesh.  me.edges.foreach_set(
"use_edge_sharp", array) still works as a compatibility shim, but the
canonical 5.1 route is me.attributes["sharp_edge"].data.foreach_set("value").
use_auto_smooth was removed entirely in 4.1; the replacement workflow is
smooth shading on all polygons combined with explicit sharp-edge marks.

Outside sources ────────────────────────────────────────────────────────
- Blender Foundation, bpy.types.MeshEdge + Mesh API (CC-BY-SA-4.0):
  https://docs.blender.org/api/5.1/bpy.types.MeshEdge.html
  https://docs.blender.org/api/5.1/bpy.types.Mesh.html
- Nicolas Janakiev, blender-scripting (MIT):
  https://github.com/njanakiev/blender-scripting

Run: blender --background --python blueprint.py
Outputs: faceted_dome.blend  /tmp/<SLUG>.glb
"""

import bpy, bmesh, math, array as arr

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG            = "python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
EXPORT_PATH     = f"/tmp/{SLUG}.glb"
DRACO_LEVEL     = 6
ICO_SUBDIVS     = 2        # 80 base triangles → 42 verts → legible facets
ICO_RADIUS      = 1.0      # 1 m, Holoflow studio default scale
SHARP_DEG       = 40.0     # dihedral above which edge becomes a hard mark
SEAM_MERIDIANS  = 8        # longitude sectors for UV seam layout
CREASE_EQUATOR  = 0.85     # crease weight on equatorial edge loop

# ── Clear scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials):
    for item in list(blk): blk.remove(item)

# ── 1. Icosphere dome ────────────────────────────────────────────────────────
# bmesh.ops.create_icosphere needs no active object or undo context —
# runs identically in Text Editor, headless CLI, or Operator.execute().
me = bpy.data.meshes.new("faceted_dome")
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVS, radius=ICO_RADIUS)
bm.normal_update()

# Trim below the equatorial plane and cap the open boundary.
faces_south = [f for f in bm.faces if f.calc_center_median().z < -0.05]
bmesh.ops.delete(bm, geom=faces_south, context='FACES')
boundary = [e for e in bm.edges if e.is_boundary]
if boundary:
    bmesh.ops.edgeloop_fill(bm, edges=boundary)
bm.normal_update()
bm.to_mesh(me)
bm.free()
me.update()

# ── 2. Enable smooth shading on all polygons ─────────────────────────────────
# Smooth shading + sharp-edge marks = the 5.1 replacement for use_auto_smooth.
# All faces are smooth; where we set sharp_edge=True the exporter splits the
# vertex and writes different normals to each side of the hard edge.
me.polygons.foreach_set("use_smooth", arr.array('B', [1] * len(me.polygons)))
me.update()

# ── 3. Sharp-edge marks — Attribute API (canonical 5.1) ─────────────────────
# "sharp_edge" is a built-in BOOLEAN attribute on the EDGE domain.
# Use bmesh for angle computation only; write results via attribute API.
bm2 = bmesh.new()
bm2.from_mesh(me)
bm2.edges.ensure_lookup_table()

SHARP_RAD  = math.radians(SHARP_DEG)
sharp_flags = arr.array('B', [0] * len(me.edges))

for e in bm2.edges:
    # Boundary edges are always sharp (open manifold seam).
    if e.is_boundary or len(e.link_faces) < 2:
        sharp_flags[e.index] = 1
        continue
    dihedral = e.link_faces[0].normal.angle(e.link_faces[1].normal)
    if dihedral > SHARP_RAD:
        sharp_flags[e.index] = 1

bm2.free()

# Attribute access: .get() returns None if attribute doesn't yet exist.
# me.edges.foreach_set("use_edge_sharp", sharp_flags) is the compat shim —
# same result but bypasses the attribute layer entirely.
sharp_attr = (me.attributes.get("sharp_edge") or
              me.attributes.new("sharp_edge", type='BOOLEAN', domain='EDGE'))
sharp_attr.data.foreach_set("value", sharp_flags)

# ── 4. Crease weights — equatorial edge loop ─────────────────────────────────
# "crease_edge" is a FLOAT attribute (0.0 = no crease, 1.0 = full crease).
# Only takes effect under a Subdivision Surface modifier — pre-populate so
# the blend is SubSurf-ready without any manual UI work.
crease_attr = (me.attributes.get("crease_edge") or
               me.attributes.new("crease_edge", type='FLOAT', domain='EDGE'))
crease_vals = arr.array('f', [0.0] * len(me.edges))
verts = me.vertices
for e in me.edges:
    v0, v1 = verts[e.vertices[0]], verts[e.vertices[1]]
    # Equatorial: both endpoints near z = 0
    if abs(v0.co.z) < 0.18 and abs(v1.co.z) < 0.18:
        crease_vals[e.index] = CREASE_EQUATOR
crease_attr.data.foreach_set("value", crease_vals)

# ── 5. UV seam marks — still on MeshEdge (not migrated to attribute in 5.1) ──
# UV seam marks remain on me.edges, not yet moved to an Attribute layer.
# foreach_set("use_seam", ...) is both the current AND the correct route.
# Meridian seams divide the dome into SEAM_MERIDIANS equal longitude sectors.
sector_angle = 2.0 * math.pi / SEAM_MERIDIANS
SEAM_TOL     = sector_angle * 0.12   # ±12% sector-width tolerance

seam_flags = arr.array('B', [0] * len(me.edges))
for e in me.edges:
    v0, v1 = verts[e.vertices[0]], verts[e.vertices[1]]
    # Skip degenerate pole edges with near-zero XY radius.
    if (v0.co.x**2 + v0.co.y**2 < 1e-8 or
            v1.co.x**2 + v1.co.y**2 < 1e-8):
        continue
    a0 = math.atan2(v0.co.y, v0.co.x) % (2 * math.pi)
    a1 = math.atan2(v1.co.y, v1.co.x) % (2 * math.pi)
    for m in range(SEAM_MERIDIANS):
        meridian = m * sector_angle
        # Angular distance from meridian, wrapped to [−π, π].
        d0 = abs((a0 - meridian + math.pi) % (2 * math.pi) - math.pi)
        d1 = abs((a1 - meridian + math.pi) % (2 * math.pi) - math.pi)
        if d0 < SEAM_TOL and d1 < SEAM_TOL:
            seam_flags[e.index] = 1
            break

me.edges.foreach_set("use_seam", seam_flags)
me.update()

# ── 6. Material ───────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("FacetedDome")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.12, 0.50, 0.82, 1.0)  # cobalt
bsdf.inputs["Roughness"].default_value  = 0.28
bsdf.inputs["Metallic"].default_value   = 0.22
me.materials.append(mat)

# ── 7. Object + link ──────────────────────────────────────────────────────────
ob = bpy.data.objects.new("faceted_dome", me)
bpy.context.scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob

# ── 8. Save blend + export GLB ───────────────────────────────────────────────
# Sharp-edge marks translate to vertex duplication at export: each sharp edge
# becomes two vertices at identical position with divergent normals.  For a
# 42-vert dome with ~15 sharp edges, expect ~57 vertices in the GLB vs ~42
# in the .blend — correct shading without custom per-loop normal storage.
bpy.ops.wm.save_as_mainfile(filepath="//faceted_dome.blend")
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
)
print(f"sharp={sum(sharp_flags)} seam={sum(seam_flags)} "
      f"crease_nonzero={sum(1 for v in crease_vals if v > 0)}")
print(f"exported → {EXPORT_PATH}")
