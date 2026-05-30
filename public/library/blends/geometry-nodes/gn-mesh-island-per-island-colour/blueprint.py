#!/usr/bin/env python3
"""
blueprint.py — GN Mesh Island: Per-Island Colour, Random Offset, and Separation
Blender 5.1 | CC0 | Holoflow Studio

Technique:
  GeometryNodeInputMeshIsland outputs Island Index (INT) — constant for every
  geometry element in the same connected component.  The index adapts to
  whatever domain context the downstream node expects (POINT, FACE, EDGE):
  no CaptureAttribute wrapper is required.

  Because IslandIndex is constant within an island, feeding it to RandomValue
  as the ID gives every element in the same island an identical random output —
  an implicit per-island grouping that costs zero topology surgery.

  Materialising island_index as a named INT attribute (StoreNamedAttribute)
  enables downstream SeparateGeometry selection by island number, which is the
  foundation of exploded-view rigs and modular prop assembly pipelines.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy, bmesh
from pathlib import Path

# ─── Constants ────────────────────────────────────────────────────────────────
SLUG       = "gn-mesh-island-per-island-colour"
TOPIC      = "geometry-nodes"
MESH_NAME  = "mosaic_tiles"

HERE      = Path(__file__).parent
BLEND_OUT = HERE / f"{MESH_NAME}.blend"
GLB_OUT   = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

GRID_ROWS    = 4
GRID_COLS    = 4         # → 16 disconnected quad islands
TILE_SIZE    = 0.22      # metres
GAP          = 0.04      # gap between tiles (non-zero ensures no shared verts)
LIFT_MAX     = 0.20      # maximum random Z displacement per island
COLOUR_SEED  = 42
LIFT_SEED    = 99

# ─── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ─── Build base mesh: N disconnected quad tiles ───────────────────────────────
# Each tile is four vertices with NO shared edges to neighbours.
# This guarantees exactly GRID_ROWS × GRID_COLS connected components (islands).
# IslandIndex therefore maps one-to-one to (row×COLS + col) — predictable and
# stable across re-runs because bmesh.faces ordering follows insertion order.
mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
obj  = bpy.data.objects.new(MESH_NAME, mesh)
scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

step          = TILE_SIZE + GAP
half_extent   = (GRID_COLS * step - GAP) / 2.0

bm = bmesh.new()
for r in range(GRID_ROWS):
    for c in range(GRID_COLS):
        cx = -half_extent + c * step
        cy = -half_extent + r * step
        v0 = bm.verts.new((cx,             cy,             0.0))
        v1 = bm.verts.new((cx + TILE_SIZE, cy,             0.0))
        v2 = bm.verts.new((cx + TILE_SIZE, cy + TILE_SIZE, 0.0))
        v3 = bm.verts.new((cx,             cy + TILE_SIZE, 0.0))
        bm.faces.new((v0, v1, v2, v3))
bm.to_mesh(mesh)
bm.free()
mesh.update()

# ─── GN node tree ─────────────────────────────────────────────────────────────
tree       = bpy.data.node_groups.new("GNIslandColour", "GeometryNodeTree")
nodes      = tree.nodes
links      = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
s_lift = tree.interface.new_socket(
    "Lift Multiplier", in_out="INPUT", socket_type="NodeSocketFloat"
)
s_lift.default_value = 1.0
s_lift.min_value     = 0.0
s_lift.max_value     = 1.0

n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-900, 0)
n_out = nodes.new("NodeGroupOutput"); n_out.location  = (1100, 0)

# Island Index — the key to this entire tutorial.
# At FACE domain it equals the connected-component index of each face.
# At POINT domain all vertices of a tile share the same index.
# The exact integer starts at 0 and increments per island in mesh data order.
n_island = nodes.new("GeometryNodeInputMeshIsland")
n_island.location = (-650, -180)

# ── Per-island colour ─────────────────────────────────────────────────────────
# RandomValue(FLOAT_VECTOR, ID=island_idx, Seed=COLOUR_SEED):
#   Every element in the same island has the same IslandIndex → same ID →
#   identical random vector.  Domain context is resolved by StoreNamedAttribute
#   (domain='FACE') so each face gets its island's colour.
# Min 0.2 prevents near-black tiles that lose contrast on dark backgrounds.
n_col = nodes.new("GeometryNodeRandomValue")
n_col.data_type = "FLOAT_VECTOR"
n_col.inputs[0].default_value = (0.20, 0.20, 0.20)
n_col.inputs[1].default_value = (1.00, 1.00, 1.00)
n_col.inputs["Seed"].default_value = COLOUR_SEED
n_col.location = (-380, -60)

n_store_col = nodes.new("GeometryNodeStoreNamedAttribute")
n_store_col.data_type = "FLOAT_COLOR"
n_store_col.domain    = "FACE"
n_store_col.inputs["Name"].default_value = "island_colour"
n_store_col.location = (50, 120)

# ── Per-island Z lift ─────────────────────────────────────────────────────────
# RandomValue(FLOAT, ID=island_idx, Seed=LIFT_SEED):
#   Different seed from colour → uncorrelated vertical offset.
# Lift Multiplier group socket lets record.py keyframe the reveal animation
# without rebuilding the tree.
n_lift = nodes.new("GeometryNodeRandomValue")
n_lift.data_type = "FLOAT"
n_lift.inputs["Min"].default_value  = 0.0
n_lift.inputs["Max"].default_value  = LIFT_MAX
n_lift.inputs["Seed"].default_value = LIFT_SEED
n_lift.location = (-380, -300)

# Scale random lift by the Lift Multiplier (animation control).
n_mul = nodes.new("ShaderNodeMath")
n_mul.operation = "MULTIPLY"
n_mul.location  = (-100, -300)

n_xyz = nodes.new("ShaderNodeCombineXYZ")
n_xyz.inputs["X"].default_value = 0.0
n_xyz.inputs["Y"].default_value = 0.0
n_xyz.location = (180, -200)

n_setpos = nodes.new("GeometryNodeSetPosition")
n_setpos.location = (450, 120)

# ── Materialise island_index as INT for SeparateGeometry ──────────────────────
# Without this step, SeparateGeometry has no way to select island N by number.
# Storing as 'island_index' at FACE domain lets any downstream selection node
# read it back via GeometryNodeInputNamedAttribute + FunctionNodeCompare.
n_store_idx = nodes.new("GeometryNodeStoreNamedAttribute")
n_store_idx.data_type = "INT"
n_store_idx.domain    = "FACE"
n_store_idx.inputs["Name"].default_value  = "island_index"
n_store_idx.location  = (750, 120)

# ── Wire ──────────────────────────────────────────────────────────────────────
links.new(n_island.outputs["Island Index"], n_col.inputs["ID"])
links.new(n_island.outputs["Island Index"], n_lift.inputs["ID"])
links.new(n_island.outputs["Island Index"], n_store_idx.inputs["Value"])

links.new(n_in.outputs["Geometry"],         n_store_col.inputs["Geometry"])
links.new(n_col.outputs["Value"],           n_store_col.inputs["Value"])

links.new(n_lift.outputs["Value"],          n_mul.inputs[0])
links.new(n_in.outputs["Lift Multiplier"],  n_mul.inputs[1])
links.new(n_mul.outputs["Value"],           n_xyz.inputs["Z"])

links.new(n_store_col.outputs["Geometry"],  n_setpos.inputs["Geometry"])
links.new(n_xyz.outputs["Vector"],          n_setpos.inputs["Offset"])

links.new(n_setpos.outputs["Geometry"],     n_store_idx.inputs["Geometry"])
links.new(n_store_idx.outputs["Geometry"],  n_out.inputs["Geometry"])

# ─── Attach modifier ──────────────────────────────────────────────────────────
mod            = obj.modifiers.new("GNIslandColour", "NODES")
mod.node_group = tree
mod["Input_2"] = 1.0   # Lift Multiplier default

# ─── Material ─────────────────────────────────────────────────────────────────
mat  = bpy.data.materials.new("IslandMosaicMat")
mat.use_nodes = True
nt   = mat.node_tree
nt.nodes.clear()

m_out  = nt.nodes.new("ShaderNodeOutputMaterial"); m_out.location  = (400, 0)
m_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); m_bsdf.location = (80, 0)
m_attr = nt.nodes.new("ShaderNodeAttribute");      m_attr.location = (-240, 0)

m_bsdf.inputs["Roughness"].default_value = 0.88
m_bsdf.inputs["Metallic"].default_value  = 0.0
m_attr.attribute_name = "island_colour"
m_attr.attribute_type = "GEOMETRY"

nt.links.new(m_attr.outputs["Color"],  m_bsdf.inputs["Base Color"])
nt.links.new(m_bsdf.outputs["BSDF"],   m_out.inputs["Surface"])

obj.data.materials.append(mat)

# ─── Camera for record.py ────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -2.2, 1.6))
cam = bpy.context.active_object
cam.rotation_euler = (1.05, 0.0, 0.0)
scene.camera = cam

# ─── Export GLB ───────────────────────────────────────────────────────────────
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath        = str(GLB_OUT),
    use_selection   = True,
    export_apply    = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_normals  = True,
    export_attributes = True,
)

# ─── Save .blend ──────────────────────────────────────────────────────────────
BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[blueprint] Done → {BLEND_OUT} | {GLB_OUT}")
