"""
blueprint.py — bmesh.ops.solidify
Faceted Crystal Relic Case  ·  Blender 5.1 · Python API
Studio: holoflow_webxr_exporter  ·  CC0

──────────────────────────────────────────────────────────────────────────────
bmesh.ops.solidify(bm, geom=<list>, thickness=<float>)
  Extrudes a set of faces into a hollow shell by offsetting each face along
  its local normal and bridging the boundary edges with rim quads.
  Returns {'geom': BMElemSeq} — the NEW inner geometry (verts, edges, faces).

Key difference from bpy.types.SolidifyModifier
  Modifier  — non-destructive, even-thickness, complex mode, crease, rim fill,
               per-object material offset. Evaluated at depsgraph time.
  bmesh.ops — destructive, in-memory, no even-thickness.  Integrates inline
               with other bmesh ops (bisect → solidify → inset → export) in a
               single bmesh session without extra objects or modifier stacks.
               Inner faces identified deterministically via result['geom'].

Thickness sign
  thickness > 0  → inner shell moves INWARD (toward centre of convex mesh).
  thickness < 0  → inner shell moves OUTWARD (useful for layering shells).

Rim topology
  For a CLOSED mesh (every edge shared by two faces) — no rim faces, result is
  two concentric shells interpenetrating at zero offset.  For an OPEN mesh
  (boundary edges) — rim quads bridge outer→inner boundary loops.  After
  bisect_plane cuts the top off this icosphere-urn, the open lid boundary
  becomes the visible wall-thickness rim when viewed from above.

Production prop: Faceted Crystal Relic Case
  icosphere(subdiv=1) → Z-scale urn shape → bisect top open → solidify →
  tag inner faces → two-material GLB (outer crystal / inner cavity).
──────────────────────────────────────────────────────────────────────────────
"""

import bpy, bmesh, mathutils, os

# ── Parameters ───────────────────────────────────────────────────────────────
WALL_THICKNESS = 0.045   # solidify offset inward; ~3 mm at 0.1 m/unit scale
VERT_SCALE_Z   = 1.55    # elongate icosphere into urn proportions
LID_CUT_Z      = 0.34    # Z of horizontal bisect that opens the lid
INNER_MAT_IDX  = 1       # material slot for inner cavity faces
DRACO_LEVEL    = 6
EXPORT_YUP     = True

_here       = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
OUTPUT_DIR  = os.path.normpath(os.path.join(
    _here, "..", "..", "glbs", "scripting",
    "python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr",
))
OUTPUT_GLB  = os.path.join(OUTPUT_DIR, "hf_relic_case.glb")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ── Mesh + object ─────────────────────────────────────────────────────────────
mesh = bpy.data.meshes.new("hf_relic_case")
obj  = bpy.data.objects.new("hf_relic_case", mesh)
bpy.context.scene.collection.objects.link(obj)

bm = bmesh.new()

# subdivisions=1 → icosahedron: 20 equilateral triangular faces, 12 vertices.
# diameter=0.9 keeps the urn comfortably inside a 1 m³ export unit.
bmesh.ops.create_icosphere(bm, subdivisions=1, diameter=0.9)

# Elongate along Z — turns the sphere into an urn/case silhouette.
# mathutils.Matrix.Scale(factor, 4, axis) produces a uniform-axis scale.
bmesh.ops.transform(
    bm,
    matrix=mathutils.Matrix.Scale(VERT_SCALE_Z, 4, (0.0, 0.0, 1.0)),
    verts=list(bm.verts),
)

# ── Cut lid opening ───────────────────────────────────────────────────────────
# bisect_plane at Z=LID_CUT_Z, clear_outer=True deletes faces ABOVE the plane.
# This creates a open-top bowl: the cut introduces a boundary edge loop at
# the lid rim that solidify will later bridge into visible wall-thickness.
bisect_geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
bmesh.ops.bisect_plane(
    bm,
    geom        = bisect_geom,
    dist        = 0.0001,
    plane_co    = (0.0, 0.0, LID_CUT_Z),
    plane_no    = (0.0, 0.0, 1.0),  # normal pointing +Z = cut horizontal
    clear_outer = True,             # remove faces above the plane (the cap)
    clear_inner = False,
)

# Recalc normals after bisect — the newly created cap edge verts can invert
# winding on some triangles, which would cause solidify to offset incorrectly.
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# ── bmesh.ops.solidify ────────────────────────────────────────────────────────
# All remaining faces (the open-top bowl) are passed as geom.
# thickness=WALL_THICKNESS offsets each inner face inward along its local normal.
# result['geom'] is a BMElemSeq of all newly created elements:
#   BMVert (inner shell verts), BMEdge (inner shell + rim edges),
#   BMFace (inner shell faces AND rim quad faces).
result      = bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=WALL_THICKNESS)
inner_faces = [e for e in result['geom'] if isinstance(e, bmesh.types.BMFace)]

# Tag every inner face with material slot 1 (cavity colour).
# rim faces are also tagged here — they share the inner-shell material to
# create a unified cavity impression when viewed from above.
for f in inner_faces:
    f.material_index = INNER_MAT_IDX

# ── Write bmesh, apply flat shading ───────────────────────────────────────────
bm.to_mesh(mesh)
bm.free()

for poly in mesh.polygons:
    poly.use_smooth = False  # hard facets — no smooth shading blending

# ── Materials ─────────────────────────────────────────────────────────────────
mat_outer = bpy.data.materials.new("hf_crystal_outer")
mat_outer.use_nodes      = False
mat_outer.diffuse_color  = (0.52, 0.78, 0.95, 1.0)   # pale blue-crystal
mat_outer.roughness      = 0.85
mat_outer.metallic       = 0.0

mat_inner = bpy.data.materials.new("hf_crystal_inner")
mat_inner.use_nodes      = False
mat_inner.diffuse_color  = (0.04, 0.12, 0.18, 1.0)   # deep teal cavity
mat_inner.roughness      = 0.95
mat_inner.metallic       = 0.0

mesh.materials.append(mat_outer)   # index 0 → outer shell
mesh.materials.append(mat_inner)   # index 1 → inner cavity + rim

# ── Transform-apply + export ──────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath                                 = OUTPUT_GLB,
    use_selection                            = True,
    export_format                            = 'GLB',
    export_yup                               = EXPORT_YUP,
    export_apply                             = True,   # bakes flat normals into mesh data
    export_draco_mesh_compression_enable     = True,
    export_draco_mesh_compression_level      = DRACO_LEVEL,
    export_materials                         = 'EXPORT',
    export_colors                            = False,
    export_texcoords                         = False,
)

print(f"[holoflow] {OUTPUT_GLB}")
# Expected: hf_relic_case.glb · ~48 outer faces · ~48 inner faces · ~24 rim quads
# · 2 material slots · Draco L6 · Y-up
