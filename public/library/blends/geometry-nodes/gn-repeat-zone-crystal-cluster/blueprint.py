#!/usr/bin/env python3
"""
blueprint.py — GN Repeat Zone Crystal Cluster
Blender 5.1 | CC0 | Holoflow Studio

Technique: a Geometry Nodes Repeat Zone runs once per crystal (default 12
iterations). Inside each iteration the loop index drives the Fermat-spiral
position and scale — fully stateless, nothing carried between iterations
except the accumulated crystal geometry in the single body channel.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import math
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG            = "gn-repeat-zone-crystal-cluster"
TOPIC           = "geometry-nodes"
MESH_NAME       = "crystal_cluster"

HERE        = Path(__file__).parent
BLEND_OUT   = HERE / f"{MESH_NAME}.blend"
GLB_OUT     = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

CRYSTAL_COUNT    = 12      # Repeat Zone iteration count
BASE_SCALE       = 0.18    # XY radius of the centre (largest) shard
TIP_SCALE        = 0.06    # XY radius of the outermost (smallest) shard
SPIRAL_RADIUS    = 0.8     # max XY radius of the Fermat spiral
CONE_VERTICES    = 8       # polygon faces around each shard cross-section
BASE_HEIGHT      = 2.5     # height-multiplier; actual depth = BASE_HEIGHT × scale
GOLDEN_ANGLE_RAD = 2.399963  # 137.508° * π/180 — the most irrational angle

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ============================================================
# Base object — empty mesh; the GN modifier provides all geometry
# ============================================================
mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
obj  = bpy.data.objects.new(MESH_NAME, mesh)
scene.collection.objects.link(obj)

# ============================================================
# Geometry Nodes tree
# ============================================================
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNCrystalCluster")
nodes = tree.nodes
links = tree.links

# I/O sockets — Blender 4.0+ interface API (tree.inputs.new() removed in 5.x)
tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

def _int_sock(name: str, val: int, lo: int = 1, hi: int = 256):
    s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketInt")
    s.default_value = val
    s.min_value = lo
    s.max_value = hi

def _float_sock(name: str, val: float, lo: float = 0.0, hi: float = 10.0):
    s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value = val
    s.min_value = lo
    s.max_value = hi

_int_sock(  "Crystal Count",  CRYSTAL_COUNT, 1, 64)
_float_sock("Spiral Radius",  SPIRAL_RADIUS, 0.01, 5.0)
_float_sock("Base Scale",     BASE_SCALE,    0.01, 2.0)
_float_sock("Tip Scale",      TIP_SCALE,     0.01, 2.0)
_int_sock(  "Cone Vertices",  CONE_VERTICES, 3, 32)
_float_sock("Base Height",    BASE_HEIGHT,   0.1, 10.0)

# ============================================================
# Group In / Out
# ============================================================
n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1000,  0)
n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 1400,  0)

# Golden angle — mathematical constant, intentionally not a user socket
n_golden = nodes.new("ShaderNodeValue")
n_golden.outputs[0].default_value = GOLDEN_ANGLE_RAD
n_golden.label    = "Golden Angle (rad)"
n_golden.location = (-800, -250)

# ============================================================
# Repeat Zone
# pair_with_output() establishes the zone relationship; body channels
# must be added AFTER pairing so both nodes gain matching sockets.
# ============================================================
repeat_in  = nodes.new("GeometryNodeRepeatInput")
repeat_out = nodes.new("GeometryNodeRepeatOutput")
repeat_in.pair_with_output(repeat_out)
repeat_in.location  = (-200,  200)
repeat_out.location = (1000,  200)

# Single body channel: the growing pile of crystal geometry
# Type enum: 'GEOMETRY' | 'FLOAT' | 'INT' | 'VECTOR' | 'BOOLEAN' | 'RGBA'
repeat_in.repeat_items.new("GEOMETRY", "Accumulated")

# Repeat count comes from the "Crystal Count" group socket
links.new(n_in.outputs["Crystal Count"], repeat_in.inputs["Iterations"])

# ============================================================
# Convenience: ShaderNodeMath factory
# ============================================================
def _math(op: str, x=None, y=None, loc=(0, 0)) -> bpy.types.ShaderNodeMath:
    n = nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = False
    n.location  = loc
    if isinstance(x, (int, float)):
        n.inputs[0].default_value = float(x)
    if isinstance(y, (int, float)):
        n.inputs[1].default_value = float(y)
    return n

# ============================================================
# Inside the Repeat Zone — all nodes read repeat_in.outputs and
# write to repeat_out.inputs; the zone boundary is implicit.
# ============================================================

# t = iteration / (count − 1)  →  normalised position 0..1 in the spiral
n_sub1  = _math("SUBTRACT", y=1.0,   loc=(-100,  700))   # count − 1
n_div_t = _math("DIVIDE",            loc=( 100,  700))   # iteration ÷ (count−1)
links.new(n_in.outputs["Crystal Count"],      n_sub1.inputs[0])
links.new(n_sub1.outputs["Value"],            n_div_t.inputs[1])
links.new(repeat_in.outputs["Iteration"],     n_div_t.inputs[0])

# angle = iteration × golden_angle_rad
n_angle = _math("MULTIPLY",          loc=(-100,  500))
links.new(repeat_in.outputs["Iteration"],     n_angle.inputs[0])
links.new(n_golden.outputs["Value"],          n_angle.inputs[1])

# radius = sqrt(t) × SPIRAL_RADIUS  →  Fermat spiral: equal-area spacing
n_sqrt   = _math("SQRT",             loc=( 100,  600))
n_radius = _math("MULTIPLY",         loc=( 300,  600))
links.new(n_div_t.outputs["Value"],           n_sqrt.inputs[0])
links.new(n_sqrt.outputs["Value"],            n_radius.inputs[0])
links.new(n_in.outputs["Spiral Radius"],      n_radius.inputs[1])

# x = cos(angle) × radius  |  y = sin(angle) × radius
n_cos = _math("COSINE",              loc=( 100,  500))
n_sin = _math("SINE",                loc=( 100,  400))
n_x   = _math("MULTIPLY",           loc=( 300,  500))
n_y   = _math("MULTIPLY",           loc=( 300,  400))
links.new(n_angle.outputs["Value"],           n_cos.inputs[0])
links.new(n_angle.outputs["Value"],           n_sin.inputs[0])
links.new(n_cos.outputs["Value"],             n_x.inputs[0])
links.new(n_sin.outputs["Value"],             n_y.inputs[0])
links.new(n_radius.outputs["Value"],          n_x.inputs[1])
links.new(n_radius.outputs["Value"],          n_y.inputs[1])

# scale_factor = lerp(Base Scale, Tip Scale, t)
# ShaderNodeMapRange: Value ∈ [From Min, From Max] → [To Min, To Max]
n_map = nodes.new("ShaderNodeMapRange")
n_map.location = (300, 700)
n_map.inputs["From Min"].default_value = 0.0
n_map.inputs["From Max"].default_value = 1.0
links.new(n_div_t.outputs["Value"],           n_map.inputs["Value"])
links.new(n_in.outputs["Base Scale"],         n_map.inputs["To Min"])
links.new(n_in.outputs["Tip Scale"],          n_map.inputs["To Max"])

# depth = scale_factor × Base Height
n_depth = _math("MULTIPLY",          loc=( 500,  700))
links.new(n_map.outputs["Result"],            n_depth.inputs[0])
links.new(n_in.outputs["Base Height"],        n_depth.inputs[1])

# z_offset = depth / 2  →  lifts cone base to z = 0 (tip pointing up)
n_z = _math("DIVIDE", y=2.0,         loc=( 700,  700))
links.new(n_depth.outputs["Value"],           n_z.inputs[0])

# Combine XYZ → world position for this crystal
n_xyz = nodes.new("ShaderNodeCombineXYZ")
n_xyz.location = (500, 500)
links.new(n_x.outputs["Value"],               n_xyz.inputs["X"])
links.new(n_y.outputs["Value"],               n_xyz.inputs["Y"])
links.new(n_z.outputs["Value"],               n_xyz.inputs["Z"])

# Cone primitive — fill_type='NGON': single flat polygon per cap → manifold solid
n_cone = nodes.new("GeometryNodeMeshCone")
n_cone.fill_type = "NGON"
n_cone.location  = (500, 100)
n_cone.inputs["Radius Top"].default_value    = 0.001   # nearly-sharp tip
n_cone.inputs["Radius Bottom"].default_value = BASE_SCALE
n_cone.inputs["Depth"].default_value         = BASE_HEIGHT
links.new(n_in.outputs["Cone Vertices"],      n_cone.inputs["Vertices"])
links.new(n_map.outputs["Result"],            n_cone.inputs["Radius Bottom"])
links.new(n_depth.outputs["Value"],           n_cone.inputs["Depth"])

# Transform: translate cone to its spiral XY position (no rotation — upright shards)
n_transform = nodes.new("GeometryNodeTransform")
n_transform.location = (700, 300)
links.new(n_cone.outputs["Mesh"],             n_transform.inputs["Geometry"])
links.new(n_xyz.outputs["Vector"],            n_transform.inputs["Translation"])

# Join: merge incoming body geometry with the new shard
# Multi-input socket — calling links.new() twice to the same socket is correct
n_join = nodes.new("GeometryNodeJoinGeometry")
n_join.location = (850, 300)
links.new(repeat_in.outputs["Accumulated"],   n_join.inputs["Geometry"])
links.new(n_transform.outputs["Geometry"],    n_join.inputs["Geometry"])

# Feed joined geometry back into the Repeat Output body channel
links.new(n_join.outputs["Geometry"],         repeat_out.inputs["Accumulated"])

# ============================================================
# After the Repeat Zone
# ============================================================
# Flat shade: False → each cone face stays its own flat polygon
# Crystal aesthetic depends on hard face boundaries, not smooth shading
n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
n_smooth.domain   = "FACE"
n_smooth.location = (1150, 200)
n_smooth.inputs["Shade Smooth"].default_value = False
links.new(repeat_out.outputs["Accumulated"],  n_smooth.inputs["Geometry"])
links.new(n_smooth.outputs["Geometry"],       n_out.inputs["Geometry"])

# ============================================================
# Attach modifier
# Socket index map: Geometry INPUT=0 (auto), Geometry OUTPUT=1 (auto)
# Crystal Count=2, Spiral Radius=3, Base Scale=4, Tip Scale=5, Vertices=6, Height=7
# ============================================================
mod = obj.modifiers.new(name="HoloflowGNCrystal", type="NODES")
mod.node_group = tree
mod["Input_2"] = CRYSTAL_COUNT
mod["Input_3"] = SPIRAL_RADIUS
mod["Input_4"] = BASE_SCALE
mod["Input_5"] = TIP_SCALE
mod["Input_6"] = CONE_VERTICES
mod["Input_7"] = BASE_HEIGHT

# ============================================================
# Material — faceted crystal, EEVEE Next FORWARD render path
# ============================================================
mat = bpy.data.materials.new("CrystalFaceted")
mat.use_nodes           = True
mat.blend_method        = "BLEND"
mat.shadow_method       = "NONE"
mat.use_backface_culling = False
mat.surface_render_method = "FORWARD"
nt   = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value          = (0.3, 0.7, 1.0, 1.0)
bsdf.inputs["Transmission Weight"].default_value = 0.85
bsdf.inputs["Roughness"].default_value           = 0.04
bsdf.inputs["IOR"].default_value                 = 1.52
bsdf.inputs["Alpha"].default_value               = 0.80
obj.data.materials.append(mat)

# ============================================================
# Lighting & camera
# ============================================================
sun_d = bpy.data.lights.new("Sun", type="SUN")
sun_d.energy = 3.0
sun_o = bpy.data.objects.new("Sun", sun_d)
scene.collection.objects.link(sun_o)
sun_o.rotation_euler = (0.6, 0.0, 0.9)

cam_d = bpy.data.cameras.new("Camera")
cam_o = bpy.data.objects.new("Camera", cam_d)
scene.collection.objects.link(cam_o)
cam_o.location       = (2.0, -2.0, 1.8)
cam_o.rotation_euler = (1.1, 0.0, 0.8)
scene.camera         = cam_o

# ============================================================
# Export GLB
# export_apply=True: evaluates the GN modifier stack before serialising
# Without this the exporter writes the empty base mesh — no crystals.
# ============================================================
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
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

# Save .blend with live modifier intact
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

print(f"[holoflow] {MESH_NAME}.blend + GLB written — {CRYSTAL_COUNT} crystals via Repeat Zone")
