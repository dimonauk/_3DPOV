"""
GN Collection Info + Pick Instance — Randomised Multi-Asset Environmental Scatter
Blender 5.1 · Geometry Nodes · CC0

Technique: Build a "scatter_kit" collection of four distinct low-poly props, then
drive Instance on Points with Collection Info + Pick Instance so each scatter point
draws a statistically random prop from the palette.  The key insight is that Collection
Info with separate_children=True outputs an Instances geometry whose ordering matches
the collection children list — Instance Index then acts as a palette lookup.

WHY this over a single-mesh instance: a single-mesh approach requires pre-combining
variants into one mesh with separate materials or geometry IDs.  A collection palette
keeps each prop's material, vertex count and UV island completely independent, making
per-prop art edits non-destructive.

Author: Holoflow Studio — CC0 (public domain dedication)
"""

import bpy
import bmesh
from mathutils import Vector, Matrix
import math
import random

# ── PARAMETERS ────────────────────────────────────────────────────────────────
GROUND_SIZE          = 10.0          # plane half-extent in metres
GROUND_SUBDIVISIONS  = 4            # edge loop density for terrain noise
COLLECTION_NAME      = "scatter_kit"
SCATTER_SEED         = 42
MIN_DISTANCE         = 0.55         # Poisson disc minimum gap between points (m)
DENSITY_MAX          = 2.0          # points per m² at full density
SCALE_MIN            = 0.45
SCALE_MAX            = 1.6
ROT_SEED_OFFSET      = 7            # separate seed offset for rotation variety
OUTPUT_DIR           = "//public/library/glbs/geometry-nodes/"
OUTPUT_NAME          = "prop_scatter.glb"
DRACO_LEVEL          = 6

# ── 0. CLEAN SCENE ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)

# ── 1. PROP FACTORY HELPERS ────────────────────────────────────────────────────

def apply_flat_material(obj, name: str, colour: tuple) -> None:
    """Assign a flat-shaded shadeless material.  Roughness=1 keeps it faceted."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Metallic"].default_value = 0.0
    obj.data.materials.append(mat)
    # Flat normals — each face reads its own normal, no smoothing
    for poly in obj.data.polygons:
        poly.use_smooth = False


def make_rock(name: str) -> bpy.types.Object:
    """Faceted rock: ico-sphere distorted with noise in bmesh."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.28)
    obj = bpy.context.active_object
    obj.name = name
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    rng = random.Random(hash(name))
    for v in bm.verts:
        noise = Vector((rng.uniform(-0.08, 0.08), rng.uniform(-0.08, 0.08),
                        rng.uniform(-0.05, 0.12)))
        v.co += noise
    # Flatten bottom slightly
    for v in bm.verts:
        if v.co.z < 0:
            v.co.z *= 0.4
    bm.to_mesh(me)
    bm.free()
    apply_flat_material(obj, f"mat_{name}", (0.38, 0.34, 0.30, 1.0))
    return obj


def make_crystal(name: str) -> bpy.types.Object:
    """Elongated hex prism tapering to a point — faceted crystal shard."""
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.12, radius2=0.0,
                                    depth=0.55, end_fill_type='NGON')
    obj = bpy.context.active_object
    obj.name = name
    # Slight taper distortion: move top cap inward on Y for asymmetry
    me = obj.data
    for v in me.vertices:
        if v.co.z > 0.2:
            v.co.x *= 0.6
            v.co.y *= 0.6
    apply_flat_material(obj, f"mat_{name}", (0.42, 0.60, 0.90, 1.0))
    return obj


def make_pebble(name: str) -> bpy.types.Object:
    """Squat ico-sphere scaled to 1:1.2:0.55 — a river pebble."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.22)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (1.0, 1.2, 0.55)
    bpy.ops.object.transform_apply(scale=True)
    apply_flat_material(obj, f"mat_{name}", (0.50, 0.48, 0.45, 1.0))
    return obj


def make_mushroom(name: str) -> bpy.types.Object:
    """Stalk + disc cap — two primitives joined into one mesh."""
    # Stalk
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.055, depth=0.30)
    stalk = bpy.context.active_object
    stalk.name = "stalk_tmp"
    stalk.location.z = 0.15
    bpy.ops.object.transform_apply(location=True)
    # Cap
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.06)
    cap = bpy.context.active_object
    cap.name = "cap_tmp"
    cap.location.z = 0.32
    bpy.ops.object.transform_apply(location=True)
    # Join
    bpy.ops.object.select_all(action='DESELECT')
    stalk.select_set(True)
    cap.select_set(True)
    bpy.context.view_layer.objects.active = stalk
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    apply_flat_material(obj, f"mat_{name}", (0.62, 0.20, 0.12, 1.0))
    return obj


# ── 2. BUILD COLLECTION AND PROPS ─────────────────────────────────────────────
kit_col = bpy.data.collections.new(COLLECTION_NAME)
bpy.context.scene.collection.children.link(kit_col)

for layer_col in bpy.context.view_layer.layer_collection.children:
    if layer_col.name == COLLECTION_NAME:
        layer_col.exclude = False

prop_factories = [make_rock, make_crystal, make_pebble, make_mushroom]
prop_names     = ["rock_a", "crystal_b", "pebble_c", "mushroom_d"]
NUM_PROPS      = len(prop_names)

# Create each prop, unlink from Scene Collection, link only to scatter_kit
for factory, pname in zip(prop_factories, prop_names):
    obj = factory(pname)
    bpy.context.scene.collection.objects.unlink(obj)
    kit_col.objects.link(obj)
    obj.location = (0, 0, 0)   # origin at base

# ── 3. GROUND PLANE ──────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE * 2)
ground = bpy.context.active_object
ground.name = "ground_scatter"
# Mild height variation so the terrain reads naturally
me = ground.data
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=GROUND_SUBDIVISIONS, use_grid_fill=True)
rng2 = random.Random(99)
for v in bm.verts:
    if abs(v.co.x) < GROUND_SIZE * 0.98 and abs(v.co.y) < GROUND_SIZE * 0.98:
        v.co.z += rng2.uniform(-0.06, 0.14)
bm.to_mesh(me)
bm.free()
# Flat ground material
mat_ground = bpy.data.materials.new("mat_ground")
mat_ground.use_nodes = True
bsdf_g = mat_ground.node_tree.nodes["Principled BSDF"]
bsdf_g.inputs["Base Color"].default_value = (0.22, 0.28, 0.15, 1.0)
bsdf_g.inputs["Roughness"].default_value = 1.0
ground.data.materials.append(mat_ground)
for poly in ground.data.polygons:
    poly.use_smooth = False

# ── 4. GEOMETRY NODES MODIFIER ───────────────────────────────────────────────
mod = ground.modifiers.new("HF_CollectionScatter", 'NODES')
tree = bpy.data.node_groups.new("GN_CollectionScatter", 'GeometryNodeTree')
mod.node_group = tree

# Interface sockets — typed for Blender 5.1 NodeTreeInterface API
iface = tree.interface
iface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
iface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
sock_col   = iface.new_socket("Collection",   in_out='INPUT',  socket_type='NodeSocketCollection')
sock_seed  = iface.new_socket("Seed",         in_out='INPUT',  socket_type='NodeSocketInt')
sock_mdist = iface.new_socket("Min Distance", in_out='INPUT',  socket_type='NodeSocketFloat')
sock_dens  = iface.new_socket("Density Max",  in_out='INPUT',  socket_type='NodeSocketFloat')
sock_smin  = iface.new_socket("Scale Min",    in_out='INPUT',  socket_type='NodeSocketFloat')
sock_smax  = iface.new_socket("Scale Max",    in_out='INPUT',  socket_type='NodeSocketFloat')

# Set defaults on modifier inputs
mod["Socket_3"] = SCATTER_SEED
mod["Socket_4"] = MIN_DISTANCE
mod["Socket_5"] = DENSITY_MAX
mod["Socket_6"] = SCALE_MIN
mod["Socket_7"] = SCALE_MAX

nodes = tree.nodes
links = tree.links

def N(bl_idname: str, pos: tuple) -> bpy.types.Node:
    nd = nodes.new(bl_idname)
    nd.location = pos
    return nd

# Group I/O
n_in  = nodes["Group Input"]
n_out = nodes["Group Output"]
n_in.location  = (-800, 0)
n_out.location = (1200, 0)

# Distribute Points on Faces
n_dist = N("GeometryNodeDistributePointsOnFaces", (-400, 100))
n_dist.distribute_method = 'POISSON'
# Collection Info — separate_children exposes each object as a pickable instance
n_col  = N("GeometryNodeCollectionInfo", (-200, -160))
n_col.transform_space = 'ORIGINAL'
# WHY ORIGINAL not RELATIVE: RELATIVE would bake the ground object's world transform
# into each instance, shifting every prop by the plane's location.  ORIGINAL keeps
# each prop at its own local-space origin, which is the artist-set pivot.

# Instance on Points
n_iop  = N("GeometryNodeInstanceOnPoints", (200, 100))
# Random Value for instance index (INT — selects which collection child)
n_ridx = N("FunctionNodeRandomValue", (-200, 20))
n_ridx.data_type = 'INT'
n_ridx.inputs["Min"].default_value = 0
n_ridx.inputs["Max"].default_value = NUM_PROPS - 1

# Random rotation: float 0..2π, applied as Z Euler
n_rrot = N("FunctionNodeRandomValue", (-200, -60))
n_rrot.data_type = 'FLOAT'
n_rrot.inputs[2].default_value = 0.0           # Min float
n_rrot.inputs[3].default_value = math.pi * 2   # Max float

n_cxyz = N("ShaderNodeCombineXYZ", (0, -80))   # (0, 0, random_Z) rotation vector

# Random scale: uniform float per instance
n_rscl = N("FunctionNodeRandomValue", (-200, -200))
n_rscl.data_type = 'FLOAT'

# Combine XYZ for uniform scale vector
n_scl_xyz = N("ShaderNodeCombineXYZ", (0, -200))

# Rotate + Scale Instances
n_rot = N("GeometryNodeRotateInstances", (500, 100))
n_rot.inputs["Local Space"].default_value = True
n_scl = N("GeometryNodeScaleInstances",  (700, 100))
n_scl.inputs["Local Space"].default_value = True

# Realize Instances for export (keep modifier unrealised so tree stays live)
n_real = N("GeometryNodeRealizeInstances", (1000, 100))

# ── LINKS ─────────────────────────────────────────────────────────────────────
# Ground geometry → Distribute
links.new(n_in.outputs["Geometry"],   n_dist.inputs["Mesh"])
links.new(n_in.outputs["Min Distance"], n_dist.inputs["Distance Min"])
links.new(n_in.outputs["Density Max"], n_dist.inputs["Density Max"])
links.new(n_in.outputs["Seed"],        n_dist.inputs["Seed"])
# Collection palette
links.new(n_in.outputs["Collection"], n_col.inputs["Collection"])
# Points + instances → IOP
links.new(n_dist.outputs["Points"],   n_iop.inputs["Points"])
links.new(n_col.outputs["Instances"], n_iop.inputs["Instance"])
n_iop.inputs["Pick Instance"].default_value = True
links.new(n_ridx.outputs[0],          n_iop.inputs["Instance Index"])
links.new(n_rrot.outputs[1],          n_cxyz.inputs["Z"])   # value socket
links.new(n_cxyz.outputs["Vector"],   n_iop.inputs["Rotation"])
# Scale input from scale min/max
links.new(n_in.outputs["Scale Min"],  n_rscl.inputs[2])
links.new(n_in.outputs["Scale Max"],  n_rscl.inputs[3])
links.new(n_rscl.outputs[1],          n_scl_xyz.inputs["X"])
links.new(n_rscl.outputs[1],          n_scl_xyz.inputs["Y"])
links.new(n_rscl.outputs[1],          n_scl_xyz.inputs["Z"])
# Chain: IOP → Rotate → Scale → Realize → out
links.new(n_iop.outputs["Instances"], n_rot.inputs["Instances"])
links.new(n_rot.outputs["Instances"], n_scl.inputs["Instances"])
links.new(n_scl_xyz.outputs["Vector"], n_scl.inputs["Scale"])
links.new(n_scl.outputs["Instances"], n_real.inputs["Geometry"])
links.new(n_real.outputs["Geometry"], n_out.inputs["Geometry"])

# Set the Collection input on the modifier
mod["Socket_2"] = bpy.data.collections[COLLECTION_NAME]

# ── 5. SCENE SETUP ────────────────────────────────────────────────────────────
# Camera
bpy.ops.object.camera_add(location=(8, -8, 6))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(55), 0, math.radians(45))
bpy.context.scene.camera = cam

# Key light
bpy.ops.object.light_add(type='SUN', location=(4, -4, 10))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.rotation_euler = (math.radians(40), 0, math.radians(30))

# ── 6. GLB EXPORT ─────────────────────────────────────────────────────────────
# Duplicate ground, apply modifier (realises instances into mesh), export, delete copy
import os
bpy.ops.object.select_all(action='DESELECT')
ground.select_set(True)
bpy.context.view_layer.objects.active = ground
bpy.ops.object.duplicate()
export_obj = bpy.context.active_object
# Apply the GN modifier to bake instances
bpy.ops.object.modifier_apply(modifier="HF_CollectionScatter")

out_path = os.path.join(bpy.path.abspath(OUTPUT_DIR), OUTPUT_NAME)
os.makedirs(os.path.dirname(out_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=out_path,
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
    export_yup=True,
)
bpy.ops.object.delete()
print(f"[blueprint] GLB exported → {out_path}")

# ── 7. SAVE ───────────────────────────────────────────────────────────────────
blend_path = bpy.path.abspath(
    "//public/library/blends/geometry-nodes/"
    "gn-collection-info-pick-instance-asset-scatter/prop_scatter.blend"
)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("[blueprint] .blend saved →", blend_path)
