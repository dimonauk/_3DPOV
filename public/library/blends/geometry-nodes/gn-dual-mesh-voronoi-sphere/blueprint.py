#!/usr/bin/env python3
"""
Blueprint: GN Dual Mesh — Geodesic Voronoi Sphere
Blender 5.1 | CC0 | Holoflow Studio

The Dual Mesh node converts a triangulated mesh into its topological dual:
every triangle becomes a vertex, every vertex becomes a polygon face. On a
subdivided icosphere this produces the canonical hex/pent tiling of a
geodesic dome — twelve pentagons (from the original icosahedron vertices)
surrounded by hexagons wherever the subdivision added interior vertices.

WHY project positions after Dual Mesh:
A dual vertex is placed at the centroid of its source triangle. On a unit
sphere the centroid of a spherical triangle lies strictly inside the sphere —
the average of three unit vectors is NOT a unit vector. Without re-projection
every hex panel bows inward and the silhouette looks lumpy. VectorMath(NORMALIZE)
× SPHERE_RADIUS pushes every centroid back onto the true sphere surface, making
each panel geometrically flat (coplanar) so flat-shade normals have no error.

WHY icosphere seed, not UV sphere:
A UV sphere's faces are quads. The dual of a quad mesh is a quad mesh — no
topological gain. An icosphere is fully triangulated from the start; its dual
is the target hex/pent lattice. SubdivideMesh adds interior vertices so the dual
has interior hexagons as well as the twelve corner pentagons.

WHY a Triangulate node before Dual Mesh:
SubdivideMesh on an all-triangle mesh stays all-triangle. The Triangulate node
is a defensive guard: if the input mesh ever gains a non-triangular face (e.g.
from a future GN API change that returns quads), Dual Mesh would produce
degenerate geometry. One extra node is cheaper than a silent bug.

Blender 5.1 API notes:
  tree.interface.new_socket() — 4.0+ API replaces removed tree.inputs.new()
  Modifier input access: mod["Input_N"] for typed parameters, or inputs by name.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from pathlib import Path

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG         = "gn-dual-mesh-voronoi-sphere"
TOPIC        = "geometry-nodes"
MESH_NAME    = "dual_mesh_voronoi_sphere"

# Subdivide level applied to the icosphere before Dual Mesh.
# Level 0: 20 source triangles  → 12 pentagon faces.  Too coarse, clearly a dodecahedron.
# Level 1: 80 source triangles  → 42 dual vertices  → 42 hex/pent faces.
# Level 2: 320 source triangles → 162 dual vertices → 162 faces.  ← sweet spot for WebXR
# Level 3: 1280 triangles       → 642 faces.  Fine, but heavy for mobile WebXR.
SUBDIV_LEVEL = 2

SPHERE_RADIUS = 1.0     # metres; all output positions lie on this sphere

EMIT_COLOUR   = (0.18, 0.52, 0.90, 1.0)   # Holoflow cobalt-blue, RGBA linear
EMIT_STRENGTH = 2.2                          # bright enough for WebXR without HDR clip

HERE      = Path(__file__).parent
BLEND_OUT = HERE / f"{MESH_NAME}.blend"
GLB_OUT   = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"


# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene               = bpy.context.scene
scene.name          = "DualMeshVoronoiSphere"
scene.render.engine = "BLENDER_EEVEE_NEXT"


# ── Seed icosphere ─────────────────────────────────────────────────────────────
# subdivisions=1 gives the minimal 20-triangle base. GN SubdivideMesh does the
# heavy lifting inside the modifier stack so SUBDIV_LEVEL is the single lever.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=1,
    radius=SPHERE_RADIUS,
    location=(0, 0, 0),
)
ico_obj      = bpy.context.active_object
ico_obj.name = MESH_NAME


# ── GN tree ────────────────────────────────────────────────────────────────────
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNDualMeshSphere")
nodes = tree.nodes
links = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1100, 0)
n_out = nodes.new("NodeGroupOutput"); n_out.location  = (1000, 0)

# 1 — Subdivide Mesh
#   Multiplies face count 4× per level. Dual Mesh converts each triangle to a
#   vertex, so level 2 gives 320 triangles → 162 dual vertices → a sphere with
#   150 hexagons and 12 pentagons. Matches a classic geodesic class-1 frequency-2.
n_sub = nodes.new("GeometryNodeSubdivideMesh")
n_sub.inputs[1].default_value = SUBDIV_LEVEL   # "Level"
n_sub.location = (-780, 0)

# 2 — Triangulate
#   Defensive: ensures Dual Mesh always sees an all-triangle mesh.
n_tri = nodes.new("GeometryNodeTriangulate")
n_tri.location = (-520, 0)

# 3 — Dual Mesh
#   keep_boundaries=False (default): closes the mesh. 'True' would only matter
#   on open meshes (hemisphere, disk) to prevent boundary edges collapsing.
n_dual = nodes.new("GeometryNodeDualMesh")
n_dual.inputs[1].default_value = False   # "Keep Boundaries"
n_dual.location = (-260, 0)

# 4 — Read position of dual vertices (triangle centroids, inside the sphere)
n_pos = nodes.new("GeometryNodeInputPosition")
n_pos.location = (-260, -260)

# 5 — Normalize: collapses centroid vector to unit direction toward sphere surface
n_norm = nodes.new("ShaderNodeVectorMath")
n_norm.operation = "NORMALIZE"
n_norm.location  = (0, -260)

# 6 — Scale: unit direction × SPHERE_RADIUS → true sphere surface position
#   VectorMath SCALE: input[0]=Vector, input[3]=Scale (float scalar)
n_scale = nodes.new("ShaderNodeVectorMath")
n_scale.operation = "SCALE"
n_scale.inputs[3].default_value = SPHERE_RADIUS
n_scale.location = (260, -260)

# 7 — Set Position: overwrite vertex positions with the re-projected coords.
#   input[0]=Geometry, input[1]=Selection (default True), input[2]=Position
#   input[3]=Offset (default zero) — leaving 1 and 3 disconnected is correct.
n_setpos = nodes.new("GeometryNodeSetPosition")
n_setpos.location = (520, 0)

# ── Links ─────────────────────────────────────────────────────────────────────
links.new(n_in.outputs[0],       n_sub.inputs[0])       # Geometry → Subdivide
links.new(n_sub.outputs[0],      n_tri.inputs[0])        # Mesh → Triangulate
links.new(n_tri.outputs[0],      n_dual.inputs[0])       # Mesh → Dual Mesh
links.new(n_dual.outputs[0],     n_setpos.inputs[0])     # Dual Mesh → Set Position
links.new(n_pos.outputs[0],      n_norm.inputs[0])       # Position → Normalize
links.new(n_norm.outputs[0],     n_scale.inputs[0])      # Unit vec → Scale
links.new(n_scale.outputs[0],    n_setpos.inputs[2])     # Sphere pos → Position
links.new(n_setpos.outputs[0],   n_out.inputs[0])        # → Group Output


# ── Assign modifier ────────────────────────────────────────────────────────────
gn_mod            = ico_obj.modifiers.new("DualMeshVoronoi", "NODES")
gn_mod.node_group = tree


# ── Apply modifier ─────────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = ico_obj
ico_obj.select_set(True)
bpy.ops.object.modifier_apply(modifier=gn_mod.name)


# ── Flat shading ──────────────────────────────────────────────────────────────
# Each hex/pent face is geometrically flat after re-projection. Flat shading
# assigns a single normal per face (the face normal), so the geodesic structure
# reads clearly. Smooth shading would interpolate across panel boundaries and
# destroy the dome aesthetic.
bpy.ops.object.shade_flat()


# ── Emission material ─────────────────────────────────────────────────────────
mat = bpy.data.materials.new("DualMeshEmit")
mat.use_nodes = True
nt  = mat.node_tree
nt.nodes.clear()

n_emit = nt.nodes.new("ShaderNodeEmission")
n_emit.inputs["Color"].default_value    = EMIT_COLOUR
n_emit.inputs["Strength"].default_value = EMIT_STRENGTH
n_emit.location = (-200, 0)

n_out_mat = nt.nodes.new("ShaderNodeOutputMaterial")
n_out_mat.location = (60, 0)
nt.links.new(n_emit.outputs["Emission"], n_out_mat.inputs["Surface"])

ico_obj.data.materials.append(mat)


# ── Apply transforms ──────────────────────────────────────────────────────────
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


# ── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.2, 1.4))
cam = bpy.context.active_object
cam.rotation_euler = (1.15, 0, 0)
scene.camera = cam


# ── Save .blend ───────────────────────────────────────────────────────────────
BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))


# ── Export GLB ────────────────────────────────────────────────────────────────
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
ico_obj.select_set(True)
bpy.context.view_layer.objects.active = ico_obj
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="WEBP",
)

print(f"Blend saved  → {BLEND_OUT}")
print(f"GLB exported → {GLB_OUT}")
