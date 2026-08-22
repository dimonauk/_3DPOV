"""
bmesh.ops.poke — Face-Poke & Raised Boss Lattice: Faceted Crystal Shield for WebXR
Blender 5.1 / Holoflow Studio blueprint

poke inserts one centre vertex into every selected BMFace and creates a triangle fan.
The ``offset`` param displaces that vertex along the face normal — positive raises a
diamond boss, negative sinks a dimple. Every quad becomes a 4-triangle X-crown; every
hexagon becomes a 6-triangle pinwheel. Combined with sharp-edge tagging on the new spoke
edges the result is a fully hard-faceted crystal surface that bakes clean flat-shaded
split normals into the GLB NORMAL accessor without a WeightedNormal or custom-normals pass.

Technique sequence:
  create_grid → disc trim → poke(offset=BOSS_HEIGHT) → sharp all edges →
  material-assign by boss_verts → extrude_edge_only rim → translate → fill back → export
"""

import bpy
import bmesh
from mathutils import Vector

# ─── constants ────────────────────────────────────────────────────────────────
SLUG           = "hf_poke_shield"
GRID_SEGS      = 7          # NxN quad grid (odd → clean centre cell)
GRID_SIZE      = 1.0        # half-extent of source grid (metres)
DISC_RADIUS    = 0.88       # trim threshold: faces with centroid.length > this are removed
BOSS_HEIGHT    = 0.07       # poke offset along face normal — raised diamond tip height
USE_REL_OFFSET = False      # True scales offset by face area; False keeps all tips even
CENTER_MODE    = 'MEAN_WEIGHTED'   # MEAN_WEIGHTED | MEAN | BOUNDS (see README §3)
SHELL_DEPTH    = 0.10       # back-plate wall extrusion depth
EXPORT_PATH    = "//hf_poke_shield.glb"
DRACO_LEVEL    = 6

# ─── scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'

# ─── materials ────────────────────────────────────────────────────────────────
def _mat(name, r, g, b, rough=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1)
    bsdf.inputs["Roughness"].default_value = rough
    return m

mat_body = _mat("HF_Shield_Body", 0.18, 0.22, 0.30)       # dark steel plate
mat_boss = _mat("HF_Shield_Boss", 0.75, 0.65, 0.20, 0.45) # gilt raised boss

# ─── geometry ─────────────────────────────────────────────────────────────────
bm = bmesh.new()

# 1. Flat quad grid — GRID_SEGS × GRID_SEGS quads in XY plane
bmesh.ops.create_grid(bm, x_segments=GRID_SEGS, y_segments=GRID_SEGS, size=GRID_SIZE)
bm.faces.ensure_lookup_table()

# 2. Trim to disc — remove faces whose area-weighted centroid falls outside DISC_RADIUS.
#    calc_center_median() returns a Vector; .length gives distance from world origin.
#    After FACES deletion, dangling verts with no remaining link_faces are cleaned separately —
#    deleting verts inside the FACES context would raise a topology error.
outer = [f for f in bm.faces if f.calc_center_median().length > DISC_RADIUS * GRID_SIZE]
bmesh.ops.delete(bm, geom=outer, context='FACES')
bmesh.ops.delete(bm,
    geom=[v for v in bm.verts if not v.link_faces],
    context='VERTS')

bm.faces.ensure_lookup_table()
disc_faces = bm.faces[:]   # snapshot BEFORE poke — old BMFace handles are invalid after call

# 3. POKE — core technique
#    Signature: poke(bm, faces, offset, use_relative_offset, center_mode) → {'verts': [...]}
#    Each input face is split into len(face.verts) triangles that share the new centre vert.
#    WINDING: poke inherits source-face winding for all child triangles —
#    recalc_face_normals is NOT required after poke alone.
result = bmesh.ops.poke(
    bm,
    faces               = disc_faces,
    offset              = BOSS_HEIGHT,
    use_relative_offset = USE_REL_OFFSET,
    center_mode         = CENTER_MODE,
)
boss_verts = set(result['verts'])   # one new BMVert per input face — the raised tips

# 4. Hard-facet look — mark all edges sharp so the GLB exporter writes split corner normals.
#    In Blender 5.1 BMesh: e.smooth = False writes the "sharp_edge" boolean mesh attribute.
#    The new spoke edges (centre→rim) default to smooth after poke — this pass catches them.
for e in bm.edges:
    e.smooth = False
for f in bm.faces:
    f.smooth = False   # flat shading per face (no interpolation in WebXR fragment shader)

# 5. Material assignment — boss triangles share a centre vert with a boss_vert handle
bm.faces.ensure_lookup_table()
for f in bm.faces:
    f.material_index = 1 if any(v in boss_verts for v in f.verts) else 0

# 6. Back plate — extrude the boundary (single-link-face) rim loop downward
bm.edges.ensure_lookup_table()
rim_edges = [e for e in bm.edges if len(e.link_faces) == 1]

ret_ext = bmesh.ops.extrude_edge_only(bm, edges=rim_edges)
# geom returns BMVert + BMEdge + BMFace for the wall strip — filter for verts to translate
wall_verts = [g for g in ret_ext['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=wall_verts, vec=Vector((0, 0, -SHELL_DEPTH)))

# 7. Cap the open back — single boundary loop → fill with beauty triangulation
bm.edges.ensure_lookup_table()
back_rim = [e for e in bm.edges if len(e.link_faces) == 1]
bmesh.ops.fill(bm, edges=back_rim, use_beauty=True)

# 8. Final normal repair — extrude + fill can flip back-face winding
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
for f in bm.faces:
    f.smooth = False

# ─── mesh object ──────────────────────────────────────────────────────────────
me = bpy.data.meshes.new(SLUG)
ob = bpy.data.objects.new(SLUG, me)
bpy.context.scene.collection.objects.link(ob)
bm.to_mesh(me)
bm.free()

me.materials.append(mat_body)
me.materials.append(mat_boss)
ob["holoflow:facet"] = True
ob.name = SLUG

bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ─── GLB export ───────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath                             = EXPORT_PATH,
    use_selection                        = True,
    export_format                        = 'GLB',
    export_yup                           = True,
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO_LEVEL,
    export_image_format                  = 'WEBP',
    export_extras                        = True,
)

print(f"[HF] {SLUG}.glb — {len(me.vertices)}v · {len(me.polygons)}f"
      f"  boss_tips={len(boss_verts)}")
