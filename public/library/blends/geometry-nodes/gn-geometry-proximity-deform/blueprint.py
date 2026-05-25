#!/usr/bin/env python3
"""
blueprint.py — GN Geometry Proximity — Proximity-Driven Deformation Field
Blender 5.1 | CC0 | Holoflow Studio

The Geometry Proximity node computes, for every point in the input geometry,
the nearest point on a target's surface — and the scalar distance to it.
That distance drives a SMOOTHERSTEP falloff which scales a −Z offset on a
subdivided grid, producing a soft displacement dome wherever a secondary
object floats above the plane.  No simulation zone, no keyframe baking —
the field evaluates analytically every scrub position.

                         Why use Proximity rather than a Simulation Zone?
────────────────────────────────────────────────────────────────────────────
Simulation Zones accumulate state across frames and must be baked sequentially.
Proximity is a pure mathematical query that runs at the same cost regardless of
timeline position.  That makes it ideal for:
  • Real-time WebXR controller hover responses (no bake, no cache invalidation)
  • VRM cape/skirt deformation where cloth physics is too expensive for the web
  • Procedural damage footprints driven by an animated Empty
  • Distance-to-object falloffs feeding material gradients via Store Named Attribute

The trade-off: Proximity has no memory of previous positions.  If you need
accumulating damage (indent deepens over time), you need a Simulation Zone.
For a pure "deform while near" field, Proximity is strictly lighter.

                         Node graph (eight nodes, no zone)
────────────────────────────────────────────────────────────────────────────
GroupInput
  ├─ Geometry          ──────────────────────────────── SetPosition.Geometry
  ├─ Max Depress       ── Math(MULTIPLY).B
  └─ Influence Radius  ── MapRange.from_max
ObjectInfo(sphere_obj, RELATIVE).Geometry  ── Proximity.Target
Proximity.Distance ── MapRange(SMOOTHERSTEP, 0→radius, 1→0).Value
MapRange.Value ── Math(MULTIPLY).A ── Math(SUBTRACT 0).Subtrahend
Math(SUBTRACT).Value ── CombineXYZ.Z ── SetPosition.Offset
SetPosition.Geometry ── GroupOutput.Geometry

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
import math
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG             = "gn-geometry-proximity-deform"
TOPIC            = "geometry-nodes"
MESH_NAME        = "proximity_deform"

HERE             = Path(__file__).parent
BLEND_OUT        = HERE / f"{MESH_NAME}.blend"
GLB_OUT          = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

GRID_SIZE        = 3.0     # full XY extent of the deformable plane (metres)
GRID_DIVS        = 39      # subdivisions per axis → 40×40 = 1,600 vertices
SPHERE_RADIUS    = 0.30    # UV sphere radius (visual only, does not affect field)
SPHERE_Z_INIT    = 0.45    # starting height above the plane for the influence sphere
MAX_DEPRESS      = 0.55    # maximum −Z displacement at the sphere's nearest point
INFLUENCE_RADIUS = 1.10    # distance at which deform falls to zero

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene               = bpy.context.scene
scene.name          = "GN_ProximityDeform"
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = 120

# ============================================================
# Influence sphere — a separate object that the GN ObjectInfo node reads.
# Displayed as wireframe so it is visible without occluding the deformed grid.
# ============================================================
bm_s = bmesh.new()
bmesh.ops.create_uvsphere(bm_s, u_segments=16, v_segments=8, radius=SPHERE_RADIUS)
sphere_mesh = bpy.data.meshes.new("influence_sphere")
bm_s.to_mesh(sphere_mesh)
bm_s.free()

sphere_obj           = bpy.data.objects.new("influence_sphere", sphere_mesh)
sphere_obj.location  = (0.0, 0.0, SPHERE_Z_INIT)
sphere_obj.display_type = "WIRE"
scene.collection.objects.link(sphere_obj)

# ============================================================
# Deformable grid — bmesh direct, no bpy.ops.
# size=GRID_SIZE/2 because bmesh.ops.create_grid uses half-extents.
# 40×40 vertices give sub-centimetre resolution across a 3 m plane.
# ============================================================
bm_g = bmesh.new()
bmesh.ops.create_grid(
    bm_g,
    x_segments=GRID_DIVS,
    y_segments=GRID_DIVS,
    size=GRID_SIZE / 2,
)
grid_mesh = bpy.data.meshes.new(f"{MESH_NAME}_mesh")
bm_g.to_mesh(grid_mesh)
bm_g.free()

grid_obj = bpy.data.objects.new(MESH_NAME, grid_mesh)
scene.collection.objects.link(grid_obj)

# ============================================================
# Geometry Nodes tree
# ============================================================
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNProximityDeform")
nodes = tree.nodes
links = tree.links

# ── interface (Blender 4.0+ API; tree.inputs.new() removed in 5.x) ──────────
iface = tree.interface
iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

sock_max = iface.new_socket("Max Depress",      in_out="INPUT", socket_type="NodeSocketFloat")
sock_max.default_value = MAX_DEPRESS
sock_max.min_value     = 0.0
sock_max.max_value     = 3.0

sock_rad = iface.new_socket("Influence Radius", in_out="INPUT", socket_type="NodeSocketFloat")
sock_rad.default_value = INFLUENCE_RADIUS
sock_rad.min_value     = 0.01
sock_rad.max_value     = 10.0

# ── node I/O stubs ──────────────────────────────────────────────────────────
n_in  = nodes.new("NodeGroupInput")
n_out = nodes.new("NodeGroupOutput")
n_in.location  = (-680, 0)
n_out.location = (720, 0)

# ── ObjectInfo ──────────────────────────────────────────────────────────────
# transform_space='RELATIVE' keeps the sphere geometry expressed in the grid
# object's local space.  If both objects share the same world matrix this makes
# no difference, but it prevents a mismatch when the grid is parented or moved.
# As_Instance=False (inputs[1]) requests the evaluated mesh, not an instance
# handle.  An instance handle would give a valid Position output but zero-area
# Geometry, breaking the Proximity FACES target.
n_objinfo = nodes.new("GeometryNodeObjectInfo")
n_objinfo.transform_space          = "RELATIVE"
n_objinfo.inputs[0].default_value  = sphere_obj   # Object
n_objinfo.inputs[1].default_value  = False        # As Instance
n_objinfo.location                 = (-480, -180)

# ── Geometry Proximity ───────────────────────────────────────────────────────
# target_element='FACES' samples the nearest point anywhere on a triangle, not
# just at mesh vertices.  The resulting Distance is smooth across the sphere
# surface, giving a clean falloff field with no vertex-shaped dimpling.
# 'POINTS' mode would show visible faceting in the falloff whenever the sphere
# has coarse tessellation — avoid it for organic deformations.
n_prox = nodes.new("GeometryNodeProximity")
n_prox.target_element = "FACES"
n_prox.location        = (-280, -120)

# ── MapRange ─────────────────────────────────────────────────────────────────
# SMOOTHERSTEP (Ken Perlin's quintic) gives C2-continuous derivatives at both
# ends: f'(0) = f''(0) = f'(1) = f''(1) = 0.
# That means vertices entering and leaving the influence field have zero
# velocity AND zero acceleration at the boundary — no visible pop or crease.
# to_min=1.0 / to_max=0.0: vertices near the sphere (distance → 0) get
# full falloff weight; vertices outside INFLUENCE_RADIUS get zero weight.
n_map = nodes.new("ShaderNodeMapRange")
n_map.data_type            = "FLOAT"
n_map.interpolation_type   = "SMOOTHERSTEP"
n_map.clamp                = True
n_map.inputs[1].default_value = 0.0   # from_min
# inputs[2] from_max ← Influence Radius (linked below)
n_map.inputs[3].default_value = 1.0   # to_min  — full depress when close
n_map.inputs[4].default_value = 0.0   # to_max  — zero depress at boundary
n_map.location               = (-60, -100)

# ── Math MULTIPLY — falloff × MaxDepress → depress magnitude ─────────────────
# Gives the actual displacement in metres.  Exposed as a group input so the
# user can keyframe Max Depress on the modifier panel without touching the nodes.
n_mul = nodes.new("ShaderNodeMath")
n_mul.operation = "MULTIPLY"
n_mul.location  = (160, -100)

# ── Math SUBTRACT — negate the magnitude for −Z direction ────────────────────
# 0 − magnitude = −magnitude.  Using SUBTRACT rather than MULTIPLY(−1) keeps
# the semantic clear: the 0 minuend is explicit.  CombineXYZ.Z then becomes a
# straightforward "how far down" value.
n_neg = nodes.new("ShaderNodeMath")
n_neg.operation = "SUBTRACT"
n_neg.inputs[0].default_value = 0.0   # minuend fixed at zero
n_neg.location  = (340, -100)

# ── CombineXYZ — assemble the offset vector ────────────────────────────────
# X and Y offsets are always 0: we only push in the global −Z direction.
# A more advanced version would point the offset toward (or away from) the
# sphere's nearest surface normal for a true push-apart displacement, but for
# a flat plane the −Z shortcut is identical and eliminates one Vector Math node.
n_cxyz = nodes.new("ShaderNodeCombineXYZ")
n_cxyz.inputs[0].default_value = 0.0
n_cxyz.inputs[1].default_value = 0.0
# inputs[2] ← n_neg.outputs[0] below
n_cxyz.location = (520, -100)

# ── SetPosition ──────────────────────────────────────────────────────────────
# Using Offset (inputs[3]) rather than Position (inputs[2]) is important:
# Position replaces the absolute vertex coordinate; Offset adds a delta to it.
# Using Position would lose the original vertex's XY layout entirely.
n_setpos = nodes.new("GeometryNodeSetPosition")
n_setpos.location = (650, 80)

# ── wire ──────────────────────────────────────────────────────────────────────
links.new(n_objinfo.outputs["Geometry"], n_prox.inputs[0])        # Target
links.new(n_prox.outputs["Distance"],    n_map.inputs[0])         # Value
links.new(n_in.outputs["Influence Radius"], n_map.inputs[2])      # from_max
links.new(n_map.outputs[0],              n_mul.inputs[0])         # falloff
links.new(n_in.outputs["Max Depress"],   n_mul.inputs[1])         # magnitude
links.new(n_mul.outputs[0],              n_neg.inputs[1])         # subtrahend
links.new(n_neg.outputs[0],             n_cxyz.inputs[2])        # Z
links.new(n_in.outputs["Geometry"],     n_setpos.inputs[0])      # Geometry
links.new(n_cxyz.outputs[0],            n_setpos.inputs[3])      # Offset
links.new(n_setpos.outputs[0],          n_out.inputs["Geometry"])

# ============================================================
# Attach modifier
# ============================================================
mod            = grid_obj.modifiers.new("ProximityDeform", "NODES")
mod.node_group = tree

# ============================================================
# Materials
# ============================================================
mat_grid = bpy.data.materials.new("DeformSurface")
mat_grid.use_nodes = True
bsdf = mat_grid.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.18, 0.55, 0.90, 1.0)  # cobalt
bsdf.inputs["Roughness"].default_value  = 0.40
grid_mesh.materials.append(mat_grid)

# ============================================================
# Camera and light
# ============================================================
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
cam_obj.location       = (3.8, -3.8, 3.2)
cam_obj.rotation_euler = (math.radians(55), 0.0, math.radians(45))
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

sun = bpy.data.lights.new("Sun", type="SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("Sun", sun)
sun_obj.rotation_euler = (math.radians(50), 0.0, math.radians(40))
scene.collection.objects.link(sun_obj)

# ============================================================
# Export — snapshot the sphere at its starting position (full dome visible)
# export_apply=True bakes the GN-deformed mesh into real geometry for the GLB.
# ============================================================
bpy.context.view_layer.objects.active = grid_obj
bpy.ops.object.select_all(action="DESELECT")
grid_obj.select_set(True)
sphere_obj.select_set(True)

GLB_OUT.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath                             = str(GLB_OUT),
    use_selection                        = True,
    export_format                        = "GLB",
    export_apply                         = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = "WEBP",
    export_materials                     = "EXPORT",
    export_yup                           = True,
)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

print(f"✓  {GLB_OUT}")
print(f"✓  {BLEND_OUT}")
