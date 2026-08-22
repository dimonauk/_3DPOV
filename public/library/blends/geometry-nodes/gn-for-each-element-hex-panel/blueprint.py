"""
GN For Each Geometry Element — Procedural Hex Panel with Per-Cell Extrusion
Blender 5.1 · CC0 · Holoflow Studio

Technique: the For Each Geometry Element zone (Blender 4.3+, stable in 5.1)
iterates over every FACE of a hexagonal grid and runs an independent
Extrude + colour pass on each cell. Unlike the Repeat zone — which applies
the same sub-graph N times to the accumulated whole — For Each operates on
one element at a time, concatenating per-element outputs into the final mesh.
This is the only GN mechanism that can assign a genuinely different random
extrusion depth to each face while tracking which depth belongs to which cell
without index-juggling hacks.

Outside sources:
  Blender Manual — For Each Geometry Element
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/for_each_geometry_element.html
    CC-BY-SA 4.0 · Blender Documentation Team
  glTF-Blender-IO (Khronos Group)
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0
"""

import bpy
import bmesh
import mathutils

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_X       = 6          # number of hex columns (before dual mesh)
GRID_Y       = 6          # number of hex rows
GRID_SIZE    = 3.0        # world-space extent (metres)
SUBDIV       = 0          # subdivision level before dual mesh (0 = raw tri grid)
EXTRUDE_MIN  = 0.00       # minimum cell extrusion (m)
EXTRUDE_MAX  = 0.28       # maximum cell extrusion (m)
BEVEL_WIDTH  = 0.018      # bevel width applied after extrude (m)
BEVEL_SEGS   = 1          # bevel segments — 1 for hard-surface look
SEED_EXTRUDE = 42
SEED_HUE     = 99
GLB_PATH     = "//hex_panel.glb"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "hex_panel_scene"

# ── Build base hex grid via Grid → Triangulate → Dual Mesh ────────────────────
# A regular quad grid triangulated to uniform triangles, then Dual-Meshed,
# produces a near-hexagonal tiling (Goldberg polyhedron at small scale).
# On a flat 6×6 grid the boundary cells become pentagons; all interior cells
# are hexagons. This is the same topological trick used in the Dual Mesh
# Voronoi Sphere tutorial, applied to a flat surface.
bpy.ops.mesh.primitive_grid_add(x_subdivisions=GRID_X, y_subdivisions=GRID_Y,
                                 size=GRID_SIZE, location=(0, 0, 0))
obj = bpy.context.active_object
obj.name = "hex_panel"

# ── Geometry Nodes modifier ───────────────────────────────────────────────────
# We build the entire pipeline inside a GN modifier so that the base mesh
# stays clean and every parameter remains live until export_apply time.
mod = obj.modifiers.new("HexPanel_GN", "NODES")
tree = bpy.data.node_groups.new("HexPanel_Tree", "GeometryNodeTree")
mod.node_group = tree

nodes = tree.nodes
links = tree.links

# Convenience: place nodes in a left-to-right column layout
def N(type_id, x=0, y=0):
    n = nodes.new(type_id)
    n.location = (x, y)
    return n

# ── Tree input / output ───────────────────────────────────────────────────────
grp_in  = N("NodeGroupInput",  -600, 0)
grp_out = N("NodeGroupOutput",  900, 0)

# Expose Extrude Max and Hue Seed as live group sockets for keyframing
tree.interface.new_socket("Extrude Max", in_out='INPUT',
                          socket_type='NodeSocketFloat')
tree.interface.new_socket("Hue Seed",    in_out='INPUT',
                          socket_type='NodeSocketInt')
tree.interface.new_socket("Geometry",    in_out='OUTPUT',
                          socket_type='NodeSocketGeometry')

# Set defaults (index 0 = Extrude Max, index 1 = Hue Seed)
mod["Input_1"]       = EXTRUDE_MAX
mod["Input_2"]       = SEED_HUE

# ── Step 1: Triangulate → produces the all-triangle base needed by Dual Mesh ──
tri = N("GeometryNodeTriangulate", -400, 60)
links.new(grp_in.outputs["Geometry"], tri.inputs["Mesh"])

# ── Step 2: Dual Mesh → hexagonal tiling ────────────────────────────────────
# Every triangle becomes a vertex; every vertex becomes a polygon.
# Interior vertices (valence-6) → hexagons. Boundary/corner vertices → lower.
dual = N("GeometryNodeDualMesh", -200, 60)
links.new(tri.outputs["Mesh"], dual.inputs["Mesh"])

# ── Step 3: For Each Geometry Element zone (domain = FACE) ───────────────────
# The zone input/output are paired via pair_with_output().  Inside the zone:
#   fe_in.outputs[0]  — Geometry  (same ref as zone input; field context)
#   fe_in.outputs[1]  — Element Index (INT, 0-based per selected face)
# The zone output accumulates per-element Geometry via Join-Geometry semantics.
fe_in  = N("GeometryNodeForeachGeometryElementInput",   50, 100)
fe_out = N("GeometryNodeForeachGeometryElementOutput",  600, 100)
fe_in.domain = 'FACE'          # iterate over faces
fe_in.pair_with_output(fe_out) # establishes zone boundary

links.new(dual.outputs["Mesh"], fe_in.inputs["Geometry"])
# Selection left as default (True for all faces) → iterate every cell

# ── Inside zone: isolate one face ─────────────────────────────────────────────
# FunctionNodeCompare(EQUAL on INT): current face index == Element Index?
# This gives a per-face boolean mask that is True for exactly one face.
cmp_idx = N("FunctionNodeCompare", 150, 200)
cmp_idx.data_type = 'INT'
cmp_idx.operation = 'EQUAL'
links.new(fe_in.outputs[1],           cmp_idx.inputs["A"])  # Element Index
# B is the domain Index field — InputIndex evaluated per FACE
face_idx = N("GeometryNodeInputIndex", 150, 280)
links.new(face_idx.outputs["Index"],  cmp_idx.inputs["B"])

# SeparateGeometry keeps only the True face — isolating one hex cell per pass
sep = N("GeometryNodeSeparateGeometry", 280, 200)
sep.domain = 'FACE'
links.new(fe_in.outputs[0],           sep.inputs["Geometry"])
links.new(cmp_idx.outputs["Result"],  sep.inputs["Selection"])

# ── Inside zone: random extrude depth per cell ────────────────────────────────
# Seed = Element Index makes every cell deterministically different.
# ID = 0 here because we want one random per iteration, not per vertex.
rnd_ext = N("FunctionNodeRandomValue", 280, 50)
rnd_ext.data_type = 'FLOAT'
rnd_ext.inputs["Min"].default_value = EXTRUDE_MIN
# Extrude Max comes from the group socket so it can be keyframed
links.new(grp_in.outputs["Extrude Max"], rnd_ext.inputs["Max"])
links.new(fe_in.outputs[1],             rnd_ext.inputs["Seed"])  # Element Index as seed

# ExtrudeMesh on the isolated single-face geometry
extrude = N("GeometryNodeExtrudeMesh", 420, 200)
extrude.mode = 'FACES'
links.new(sep.outputs["Component"],    extrude.inputs["Mesh"])
links.new(rnd_ext.outputs["Value"],    extrude.inputs["Offset Scale"])

# ── Inside zone: random hue per cell ─────────────────────────────────────────
# Different seed (Hue Seed group socket) + same Element Index → independent
# colour stream that is still deterministic and uncorrelated with extrusion.
rnd_hue = N("FunctionNodeRandomValue", 280, -80)
rnd_hue.data_type = 'FLOAT'
rnd_hue.inputs["Min"].default_value = 0.0
rnd_hue.inputs["Max"].default_value = 1.0
# Combine Element Index and user Hue Seed into a composite seed
math_seed = N("ShaderNodeMath", 150, -80)
math_seed.operation = 'ADD'
links.new(fe_in.outputs[1],           math_seed.inputs[0])  # Element Index
links.new(grp_in.outputs["Hue Seed"], math_seed.inputs[1])
links.new(math_seed.outputs["Value"], rnd_hue.inputs["Seed"])

# HSV → RGB: random hue, fixed saturation 0.72, value 0.88
# CombineColor (Blender 3.3+ replacement for CombineHSV)
hsv = N("ShaderNodeCombineColor", 420, -80)
hsv.mode = 'HSV'
links.new(rnd_hue.outputs["Value"], hsv.inputs["Red"])    # Hue
hsv.inputs["Green"].default_value = 0.72                  # Saturation
hsv.inputs["Blue"].default_value  = 0.88                  # Value

# Store colour as FACE-domain FLOAT_COLOR attribute — constant per face = flat shading
store_col = N("GeometryNodeStoreNamedAttribute", 500, 100)
store_col.domain    = 'FACE'
store_col.data_type = 'FLOAT_COLOR'
store_col.inputs["Name"].default_value = "cell_colour"
links.new(extrude.outputs["Mesh"],  store_col.inputs["Geometry"])
links.new(hsv.outputs["Color"],     store_col.inputs["Value"])

# ── Wire per-element output into For Each Output ──────────────────────────────
links.new(store_col.outputs["Geometry"], fe_out.inputs["Geometry"])

# ── Merge all per-cell results → flat-shade → output ─────────────────────────
# The For Each zone's output geometry is already joined across all iterations.
shade = N("GeometryNodeSetShadeSmooth", 720, 60)
shade.domain = 'FACE'
shade.inputs["Shade Smooth"].default_value = False
links.new(fe_out.outputs["Geometry"], shade.inputs["Geometry"])
links.new(shade.outputs["Geometry"], grp_out.inputs["Geometry"])

# ── Material: reads 'cell_colour' attribute ────────────────────────────────────
mat = bpy.data.materials.new("HexPanel_Mat")
mat.use_nodes = True
mn = mat.node_tree.nodes
mat.node_tree.links.clear()
attr_n = mn.new("ShaderNodeAttribute")
attr_n.attribute_type  = 'GEOMETRY'
attr_n.attribute_name  = "cell_colour"
bsdf = mn["Principled BSDF"]
mat.node_tree.links.new(attr_n.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value    = 0.55
bsdf.inputs["Metallic"].default_value     = 0.0
obj.data.materials.append(mat)

# ── Apply modifier + shade flat ───────────────────────────────────────────────
# export_apply inside bpy.ops.export_scene.gltf handles this for GLB,
# but applying here locks the mesh for blend file saves.
bpy.context.view_layer.objects.active = obj
bpy.ops.object.modifier_apply(modifier="HexPanel_GN")
bpy.ops.object.shade_flat()

# ── GLB export ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format="GLB",
    export_apply=True,
    export_normals=True,
    export_colors=True,
    export_attributes=True,           # writes cell_colour as _CELL_COLOUR
    export_yup=True,                  # +Y up (Holoflow convention)
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

print("hex_panel.glb exported.")
