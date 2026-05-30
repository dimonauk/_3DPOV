#!/usr/bin/env python3
"""
blueprint.py — GN Distribute Points on Faces + Weight-Painted Density
Blender 5.1 | CC0 | Holoflow Studio

Technique: distribute points on a subdivided plane at maximum density, then
probabilistically cull them using a per-vertex FLOAT attribute
("scatter_density", 0–1) that was painted in Vertex Paint mode. The culling
uses a per-point random float compared against the attribute: if random >= density
the point is deleted before instancing. Remaining points receive a low-poly rock
prop via Instance on Points + Realize Instances, ready for GLB export.

Key insight: Blender's Distribute Points on Faces node transfers POINT-domain
vertex attributes to the output points by bilinear interpolation within each
face. There is no Capture Attribute node needed — the Named Attribute node reads
from the distributed-points geometry context automatically.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
import math
import random
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG          = "gn-distribute-weight-painted-scatter"
TOPIC         = "geometry-nodes"
TERRAIN_NAME  = "scatter_terrain"
PROP_NAME     = "scatter_prop_rock"

HERE          = Path(__file__).parent
BLEND_OUT     = HERE / f"{TERRAIN_NAME}.blend"
GLB_OUT       = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{TERRAIN_NAME}.glb"

TERRAIN_DIVS  = 15        # subdivisions per axis → (DIVS+1)² vertices
TERRAIN_SIZE  = 4.0       # full world-space extent in X and Y
MAX_DENSITY   = 8.0       # points per m² before culling — set high intentionally
SCATTER_SEED  = 7         # deterministic seed for GN Random Value nodes
PROP_RADIUS   = 0.10      # icosphere base radius for the rock prop
PROP_SEED     = 42        # rock vertex-displacement seed

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene               = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ============================================================
# Terrain mesh
# bmesh.ops.create_grid: size = half-extent, so full width = TERRAIN_SIZE
# ============================================================
mesh = bpy.data.meshes.new(f"{TERRAIN_NAME}_mesh")
obj  = bpy.data.objects.new(TERRAIN_NAME, mesh)
scene.collection.objects.link(obj)

bm = bmesh.new()
bmesh.ops.create_grid(
    bm,
    x_segments=TERRAIN_DIVS,
    y_segments=TERRAIN_DIVS,
    size=TERRAIN_SIZE / 2,
)
bm.to_mesh(mesh)
bm.free()

# ============================================================
# scatter_density attribute — FLOAT on POINT domain
# Value range 0.0–1.0.  Painted interactively in Vertex Paint
# mode during the screen recording; set here procedurally.
# Pattern: radial gradient, full at centre, zero at TERRAIN_SIZE/2 radius.
# ============================================================
mesh.attributes.new(name="scatter_density", type="FLOAT", domain="POINT")
attr = mesh.attributes["scatter_density"]
half = TERRAIN_SIZE / 2.0
for i, vert in enumerate(mesh.vertices):
    r = (vert.co.x ** 2 + vert.co.y ** 2) ** 0.5
    attr.data[i].value = max(0.0, 1.0 - r / half)

# ============================================================
# Prop object — low-poly rock (icosphere + random axis scaling)
# Kept separate from the terrain so ObjectInfo can reference it.
# Not exported solo; its geometry is baked into the terrain GLB
# via Realize Instances + export_apply=True.
# ============================================================
prop_mesh = bpy.data.meshes.new(f"{PROP_NAME}_mesh")
prop_obj  = bpy.data.objects.new(PROP_NAME, prop_mesh)
scene.collection.objects.link(prop_obj)

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=PROP_RADIUS)
bm.verts.ensure_lookup_table()
rng = random.Random(PROP_SEED)
for v in bm.verts:
    v.co.x += rng.uniform(-PROP_RADIUS * 0.22, PROP_RADIUS * 0.22)
    v.co.y += rng.uniform(-PROP_RADIUS * 0.22, PROP_RADIUS * 0.22)
    v.co.z  = abs(v.co.z) * rng.uniform(0.55, 0.90)  # flatten base
bm.normal_update()
bm.to_mesh(prop_mesh)
bm.free()
for face in prop_mesh.polygons:
    face.use_smooth = False

# ============================================================
# Geometry Nodes tree
# Flow: terrain mesh
#   → Distribute Points on Faces (MAX_DENSITY per m²)
#   → filter by probability gate (Named Attribute vs Random Value)
#   → Delete Geometry (remove failed points)
#   → Instance on Points (prop with random Z rotation)
#   → Realize Instances
#   → Group Output
# ============================================================
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNScatterDensity")
nodes = tree.nodes
links = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

n_in  = nodes.new("NodeGroupInput");   n_in.location  = (-1600,    0)
n_out = nodes.new("NodeGroupOutput");  n_out.location = ( 1800,    0)

# ── Distribute Points on Faces ──────────────────────────────
# RANDOM mode: uniform probability per unit area at MAX_DENSITY.
# The output Points geometry inherits POINT-domain attributes from
# the source mesh by bilinear interpolation within each triangle pair.
n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
n_dist.distribute_method          = "RANDOM"
n_dist.inputs["Density"].default_value = MAX_DENSITY
n_dist.inputs["Seed"].default_value    = SCATTER_SEED
n_dist.location = (-1100, 0)

# ── Read scatter_density at each distributed point ──────────
# Named Attribute reads from the geometry context — here the distributed
# Points flowing downstream to Delete Geometry. Blender has already
# interpolated scatter_density from the terrain vertices to every point.
n_attr = nodes.new("GeometryNodeInputNamedAttribute")
n_attr.data_type = "FLOAT"
n_attr.inputs["Name"].default_value = "scatter_density"
n_attr.location = (-700, -260)

# ── Random float [0,1] per distributed point ────────────────
# Compared against scatter_density: if random >= density → delete.
# Using a fixed Seed produces deterministic results across re-runs.
n_rand = nodes.new("GeometryNodeRandomValue")
n_rand.data_type = "FLOAT"
n_rand.inputs["Min"].default_value  = 0.0
n_rand.inputs["Max"].default_value  = 1.0
n_rand.inputs["Seed"].default_value = SCATTER_SEED
n_rand.location = (-700, -450)

# ── Compare: random >= density → True → delete this point ───
# GREATER_EQUAL: A >= B.
# A = random (0–1 uniform), B = density (0–1 weight-painted).
# Points where the random draw fails the density threshold are removed;
# only points lucky enough to beat the density survive to be instanced.
n_cmp = nodes.new("FunctionNodeCompare")
n_cmp.data_type = "FLOAT"
n_cmp.operation = "GREATER_EQUAL"
n_cmp.location  = (-380, -350)

# ── Delete Geometry: remove probability-failed points ───────
n_del = nodes.new("GeometryNodeDeleteGeometry")
n_del.domain   = "POINT"
n_del.mode     = "ALL"
n_del.location = (-100, 100)

# ── ObjectInfo: supply prop geometry for instancing ─────────
# RELATIVE transform_space: prop geometry is centred on its own origin.
n_obj = nodes.new("GeometryNodeObjectInfo")
n_obj.transform_space = "RELATIVE"
n_obj.inputs["Object"].default_value = prop_obj
n_obj.location = (200, -240)

# ── Random Z rotation per instance ──────────────────────────
# FLOAT_VECTOR with X=0, Y=0, Z in [0, 2π].
# Gives each rock a unique yaw while keeping it flat on the terrain.
n_rot = nodes.new("GeometryNodeRandomValue")
n_rot.data_type = "FLOAT_VECTOR"
n_rot.inputs[0].default_value = (0.0, 0.0, 0.0)
n_rot.inputs[1].default_value = (0.0, 0.0, math.tau)
n_rot.inputs["Seed"].default_value = SCATTER_SEED + 1
n_rot.location = (200, -440)

# ── Instance on Points ──────────────────────────────────────
n_inst = nodes.new("GeometryNodeInstanceOnPoints")
n_inst.location = (500, 100)

# ── Realize Instances ────────────────────────────────────────
# Required for export_apply=True to bake all instances into real mesh data.
# Without this, the GLB exporter may embed only the instanced prototype
# and a transform list rather than the full realized geometry.
n_real = nodes.new("GeometryNodeRealizeInstances")
n_real.location = (900, 100)

# ── Wire everything ─────────────────────────────────────────
links.new(n_in.outputs["Geometry"],       n_dist.inputs["Mesh"])
links.new(n_dist.outputs["Points"],       n_del.inputs["Geometry"])
links.new(n_rand.outputs["Value"],        n_cmp.inputs["A"])
links.new(n_attr.outputs["Attribute"],    n_cmp.inputs["B"])
links.new(n_cmp.outputs["Result"],        n_del.inputs["Selection"])
links.new(n_del.outputs["Geometry"],      n_inst.inputs["Points"])
links.new(n_obj.outputs["Geometry"],      n_inst.inputs["Instance"])
links.new(n_rot.outputs["Value"],         n_inst.inputs["Rotation"])
links.new(n_inst.outputs["Instances"],    n_real.inputs["Geometry"])
links.new(n_real.outputs["Geometry"],     n_out.inputs["Geometry"])

# ── Attach modifier ─────────────────────────────────────────
mod            = obj.modifiers.new(name="ScatterDensity", type="NODES")
mod.node_group = tree

# ============================================================
# Materials
# ============================================================
mat = bpy.data.materials.new(name="terrain_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.20, 0.36, 0.11, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.95
obj.data.materials.append(mat)

rock_mat = bpy.data.materials.new(name="rock_mat")
rock_mat.use_nodes = True
rbsdf = rock_mat.node_tree.nodes["Principled BSDF"]
rbsdf.inputs["Base Color"].default_value = (0.34, 0.30, 0.26, 1.0)
rbsdf.inputs["Roughness"].default_value  = 0.88
prop_obj.data.materials.append(rock_mat)

# ============================================================
# Export
# ============================================================
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    export_apply=True,
    use_active_collection=False,
    use_selection=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print(f"[blueprint] .blend → {BLEND_OUT}")
print(f"[blueprint] .glb   → {GLB_OUT}")
