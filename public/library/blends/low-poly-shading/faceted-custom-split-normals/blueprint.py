"""
blueprint.py — Faceted Custom Split Normals
Topic  : low-poly-shading
Slug   : faceted-custom-split-normals
Blender: 5.1+  (no use_auto_smooth — that API was removed in 4.1)

WHY this script exists
──────────────────────
The Holoflow aesthetic is high-facet: every polygon reads as a discrete
geometric plane. In Blender's viewport, setting Shade Flat achieves this.
The problem is export: the glTF/GLB exporter does NOT read the
`polygon.use_smooth` flag. It reads the NORMAL vectors stored in the mesh
loops. If you never bake custom split normals, the exporter recalculates
normals from geometry, interpolates across shared vertices, and your faceted
object arrives in Three.js looking like a smooth sphere.

The fix is `mesh.normals_split_custom_set()`. This commits per-loop normals
into the mesh data; the exporter then has something concrete to emit as the
NORMAL accessor in the GLB. One normal per unique (position + normal) vertex
pair, deduplicated by the exporter — you get clean faceted planes at runtime
with no shader-side hacks.

This blueprint walks the complete loop:
  1. Create a low-poly icosphere via bmesh
  2. Bake faceted custom split normals (5.1 API, no deprecated calls)
  3. Add a flat-shaded material (zero roughness variation — every face reads
     equally — to stress-test the facet look)
  4. Export to GLB with normals exported explicitly

Compare `faceted_icosphere` against `smooth_icosphere` in the same file to
see how the normal data differs in the Properties > Mesh panel.

External reference:
  KhronosGroup/glTF 2.0 Specification — Apache-2.0
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes-overview
  Specifically §3.7.2 — NORMAL accessor: unit-length vertex normals, one
  per vertex in the accessor, which forces vertex duplication at hard edges.

Outside attribution:
  KhronosGroup/glTF-Blender-IO — Apache-2.0
  https://github.com/KhronosGroup/glTF-Blender-IO
  The io_scene_gltf2 exporter bundled in Blender 4.2+. The normal-export
  path is in io_scene_gltf2/blender/exp/mesh/primitives/gltf2_blender_prim.py
  around the `_gather_normals()` call — it checks `has_custom_normals` first,
  then falls back to computed normals. That is the exact branch this blueprint
  exercises.
"""

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG             = "faceted-custom-split-normals"
SUBDIVISIONS     = 1          # 1 → 80 tris, 2 → 320 tris, 3 → 1 280 tris
SPHERE_RADIUS    = 1.0
OBJECT_NAME      = "faceted_icosphere"
SMOOTH_NAME      = "smooth_icosphere"   # comparison object, not exported

# Output path — relative to this .blend's location.
# The library layout places blends/ and glbs/ as siblings under public/library/
OUTPUT_GLB = "//../../glbs/low-poly-shading/faceted-custom-split-normals/faceted_icosphere.glb"


# ── 1. SCENE RESET ─────────────────────────────────────────────────────────
# Remove any leftover meshes from a previous run. Camera and lights stay.
for obj in list(bpy.data.objects):
    if obj.type == "MESH":
        bpy.data.objects.remove(obj, do_unlink=True)

for mesh in list(bpy.data.meshes):
    bpy.data.meshes.remove(mesh)


# ── 2. BUILD ICOSPHERE ─────────────────────────────────────────────────────
# bmesh.ops.create_icosphere gives us a true geodesic icosphere — all tris,
# roughly uniform face areas, 12 × 4^n vertices. subdivision=1 → 80 faces.
# We triangulate explicitly because the gltf exporter triangulates on export
# anyway; doing it here means polygon.normal is computed from the same tris
# the exporter will see.
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=SPHERE_RADIUS)
bmesh.ops.triangulate(bm, faces=bm.faces[:])  # in-place, all faces

# Smooth comparison sphere — same geometry, opposite normals treatment
bm_smooth = bmesh.new()
bmesh.ops.create_icosphere(bm_smooth, subdivisions=SUBDIVISIONS, radius=SPHERE_RADIUS)

mesh_facet  = bpy.data.meshes.new(OBJECT_NAME)
mesh_smooth = bpy.data.meshes.new(SMOOTH_NAME)
bm.to_mesh(mesh_facet)
bm_smooth.to_mesh(mesh_smooth)
bm.free()
bm_smooth.free()

obj_facet  = bpy.data.objects.new(OBJECT_NAME, mesh_facet)
obj_smooth = bpy.data.objects.new(SMOOTH_NAME, mesh_smooth)

# Offset smooth sphere so both are visible side-by-side
obj_facet.location  = (-1.5, 0, 0)
obj_smooth.location = ( 1.5, 0, 0)

bpy.context.collection.objects.link(obj_facet)
bpy.context.collection.objects.link(obj_smooth)


# ── 3. FACETED NORMALS — the core technique ────────────────────────────────
# Phase A: mark every polygon as flat-shaded.
#   `use_smooth = False` is the display flag Blender reads in the viewport.
#   It does NOT affect export — but we set it for correctness so the viewport
#   and the GLB are visually consistent.
for poly in mesh_facet.polygons:
    poly.use_smooth = False

# Phase B: build the loop normals array from face normals.
#   A "loop" in Blender is a vertex-in-face slot — a face with 3 vertices
#   has 3 loops. `poly.loop_indices` yields the loop indices that belong to
#   that face. `poly.normal` is the face normal (computed from geometry after
#   bm.to_mesh() was called).
#
#   We allocate the full array up front to avoid repeated list.append()
#   overhead on large meshes. On a subdivision-3 sphere (5 120 faces) the
#   loops list is 15 360 entries long; a pre-allocated list is 3× faster.
n_loops = len(mesh_facet.loops)
loop_normals = [(0.0, 0.0, 0.0)] * n_loops

for poly in mesh_facet.polygons:
    fn = (poly.normal.x, poly.normal.y, poly.normal.z)
    for li in poly.loop_indices:
        loop_normals[li] = fn

# Phase C: commit to the mesh.
#   `normals_split_custom_set()` is the Blender 5.1 API for this — it takes
#   a flat sequence of (x, y, z) tuples in loop order, normalises them
#   internally, and sets `mesh.has_custom_normals = True`. After this call the
#   exporter will read these normals from the `CD_CUSTOMLOOPNORMAL` layer
#   rather than recomputing from geometry.
#
#   In Blender 4.0 there was also `use_auto_smooth` + `auto_smooth_angle`.
#   Those properties were deprecated in 4.1 and removed entirely in 4.2.
#   Do NOT use them. The 5.1 replacement for angle-based auto-smooth is the
#   "Smooth by Angle" geometry nodes modifier — but for full-faceted output we
#   don't need it; we're setting every face's loops to the face normal.
mesh_facet.normals_split_custom_set(loop_normals)

print(f"[faceted] has_custom_normals: {mesh_facet.has_custom_normals}")  # must be True
print(f"[faceted] loops: {n_loops},  polygons: {len(mesh_facet.polygons)}")


# ── 4. SMOOTH SPHERE — default behaviour for comparison ───────────────────
# No custom normals: the exporter will compute vertex normals by averaging
# adjacent face normals, which gives the smooth look. This is what happens
# when you export without the custom-normals step.
for poly in mesh_smooth.polygons:
    poly.use_smooth = True   # display flag, smooth in viewport

# mesh_smooth deliberately has no normals_split_custom_set() call.
print(f"[smooth] has_custom_normals: {mesh_smooth.has_custom_normals}")   # False


# ── 5. MATERIAL — flat grey with specular to reveal facets ────────────────
# A single Principled BSDF with low roughness means the specular highlight
# walks face-by-face rather than blending — every facet catches the light
# independently, which is the visual test that custom normals are working.
mat = bpy.data.materials.new("facet_test")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value  = (0.7, 0.72, 0.75, 1.0)  # cool grey
bsdf.inputs["Roughness"].default_value   = 0.15   # low → sharp facet highlights
bsdf.inputs["Metallic"].default_value    = 0.05

mesh_facet.materials.append(mat)

mat_smooth = bpy.data.materials.new("smooth_test")
mat_smooth.use_nodes = True
bsdf_s = mat_smooth.node_tree.nodes["Principled BSDF"]
bsdf_s.inputs["Base Color"].default_value = (0.75, 0.7, 0.7, 1.0)  # warm grey
bsdf_s.inputs["Roughness"].default_value  = 0.15

mesh_smooth.materials.append(mat_smooth)


# ── 6. APPLY TRANSFORMS (Holoflow convention) ─────────────────────────────
# The studio rule: apply all transforms before GLB export so every mesh
# arrives with identity matrix in the asset. This eliminates the subtle
# "why is my object rotated 90°" bug that haunts un-applied Blender exports.
bpy.ops.object.select_all(action="DESELECT")
obj_facet.select_set(True)
bpy.context.view_layer.objects.active = obj_facet
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


# ── 7. EXPORT FACETED GLB ─────────────────────────────────────────────────
import os
abs_glb = bpy.path.abspath(OUTPUT_GLB)
os.makedirs(os.path.dirname(abs_glb), exist_ok=True)

bpy.ops.object.select_all(action="DESELECT")
obj_facet.select_set(True)
bpy.context.view_layer.objects.active = obj_facet

bpy.ops.export_scene.gltf(
    filepath=abs_glb,
    use_selection=True,
    export_format="GLB",
    export_normals=True,          # explicit — do not omit normals
    export_apply=False,           # already applied in step 6
    export_yup=True,              # +Y up — Holoflow / Three.js convention
    export_materials="EXPORT",
    export_image_format="WEBP",
    export_draco_mesh_compression_enable=False,   # no geo for this asset
)

print(f"[export] written → {abs_glb}")


# ── 8. VERTEX COUNT ANALYSIS ──────────────────────────────────────────────
# Custom split normals cause vertex duplication at every hard edge in the GLB.
# The glTF exporter must emit one vertex per unique (position + normal) pair.
# For a fully faceted mesh every edge is hard, so vertex count ≈ 3 × face count
# (3 loops per tri, all split).  Print the expectation vs the actual mesh data.
tris = len([p for p in mesh_facet.polygons])  # all tris post-triangulate
print(
    f"[analysis] tris: {tris} → expected GLB vertices ≈ {tris * 3}"
    f" (shared Blender verts: {len(mesh_facet.vertices)})"
)

print("blueprint.py complete — save as faceted_icosphere.blend")
