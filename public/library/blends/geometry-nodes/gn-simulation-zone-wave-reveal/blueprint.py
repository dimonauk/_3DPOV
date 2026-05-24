#!/usr/bin/env python3
"""
blueprint.py — GN Simulation Zone Wave Reveal
Blender 5.1 | CC0 | Holoflow Studio

Technique: a Geometry Nodes Simulation Zone carries two pieces of frame-to-frame
state — the grid geometry (holding per-vertex float "wave_time") and a scalar
"Radius" that increments by STEP_PER_FRAME each frame. Any vertex whose distance
from the origin first falls inside that radius receives wave_time = scene_seconds
at that moment; once set, the value is never overwritten. The result is an
organic radial reveal: the grid lights up centre-out over ~85 frames.

Key difference from the Repeat Zone: a Simulation Zone runs ONCE per frame and
feeds its output back as the input for the NEXT frame. A Repeat Zone runs N times
within a single frame. Both use pair_with_output() and body channels, but the
semantics and API property names differ (state_items vs repeat_items).

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG           = "gn-simulation-zone-wave-reveal"
TOPIC          = "geometry-nodes"
MESH_NAME      = "wave_reveal_grid"

HERE           = Path(__file__).parent
BLEND_OUT      = HERE / f"{MESH_NAME}.blend"
GLB_OUT        = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

GRID_SIZE      = 3.0     # full span in X and Y (±1.5 m from centre)
GRID_DIVS      = 19      # divisions each axis → 20×20 = 400 vertices
STEP_PER_FRAME = 0.025   # radius growth per frame; √2×1.5 ≈ 2.12 m reached at ~85 frames
TOTAL_FRAMES   = 120
GLB_FRAME      = 60      # snapshot: wave roughly halfway across grid
ATTR_NAME      = "wave_time"  # float POINT attribute; 0.0 = inactive

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene               = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = TOTAL_FRAMES

# ============================================================
# Base mesh — flat grid via bmesh
# Flat plane; each vertex has a unique XY position so the
# Simulation Zone can compute |position| per vertex each frame.
# ============================================================
mesh = bpy.data.meshes.new(f"{MESH_NAME}_base")
obj  = bpy.data.objects.new(MESH_NAME, mesh)
scene.collection.objects.link(obj)

bm = bmesh.new()
bmesh.ops.create_grid(
    bm,
    x_segments=GRID_DIVS,
    y_segments=GRID_DIVS,
    size=GRID_SIZE / 2,  # bmesh 'size' = half-extent; full grid width = GRID_SIZE
)
bm.to_mesh(mesh)
bm.free()

# Initial wave_time — all 0.0; Blender zero-initialises new float attributes
mesh.attributes.new(name=ATTR_NAME, type="FLOAT", domain="POINT")

# ============================================================
# Geometry Nodes tree
# ============================================================
tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNSimWaveReveal")
nodes = tree.nodes
links = tree.links

tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1200,  0)
n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 1600,  0)

# ============================================================
# Simulation Zone
# pair_with_output() must be called BEFORE adding state items so
# both nodes receive matching sockets simultaneously.
# Geometry is the implicit default body channel.
# "Radius" is an additional scalar state item (FLOAT).
# ============================================================
sim_in  = nodes.new("GeometryNodeSimulationInput")
sim_out = nodes.new("GeometryNodeSimulationOutput")
sim_in.pair_with_output(sim_out)
sim_in.location  = (-400, 200)
sim_out.location = ( 900, 200)

# Add radius scalar state — declared on the OUTPUT node; INPUT gains a matching socket
sim_out.state_items.new("FLOAT", "Radius")
# After this call the zone has:
#   sim_in.outputs["Radius"]  → cached radius from previous frame (0.0 on frame 1)
#   sim_out.inputs["Radius"]  → radius to cache for next frame
#   sim_in.inputs["Radius"]   → initial radius on frame 1 / reset  ← leave at 0.0

# Connect initial geometry to the zone's skip / frame-1 port
links.new(n_in.outputs["Geometry"], sim_in.inputs["Geometry"])

# ============================================================
# ShaderNodeMath convenience factory
# ============================================================
def _m(op, x=None, y=None, loc=(0, 0)):
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
# Zone body — all nodes below read sim_in.outputs and write sim_out.inputs
# ============================================================

# Grow radius: new_radius = old_radius + STEP_PER_FRAME
n_rad_grow = _m("ADD", y=STEP_PER_FRAME, loc=(-100, 550))
links.new(sim_in.outputs["Radius"], n_rad_grow.inputs[0])
links.new(n_rad_grow.outputs["Value"], sim_out.inputs["Radius"])

# Read the per-vertex wave_time attribute from the previous frame's geometry.
# GeometryNodeInputNamedAttribute reads any named attribute by exact string.
# data_type='FLOAT' matches the FLOAT POINT attribute on the base mesh.
n_read_wt = nodes.new("GeometryNodeInputNamedAttribute")
n_read_wt.data_type = "FLOAT"
n_read_wt.inputs["Name"].default_value = ATTR_NAME
n_read_wt.location = (-100, 320)
# outputs[0] = "Attribute"   per-vertex float
# outputs[1] = "Exists"      bool — True when attribute is present on geometry

# was_active = wave_time > 0.0  →  1.0 for any previously activated vertex
n_was_active = _m("GREATER_THAN", y=0.0, loc=(200, 320))
links.new(n_read_wt.outputs["Attribute"], n_was_active.inputs[0])

# Distance from origin — ShaderNodeVectorMath(LENGTH)
# outputs[0] = Vector (ignored for LENGTH), outputs[1] = Value (the scalar length)
n_pos = nodes.new("GeometryNodeInputPosition")
n_pos.location = (-100, 100)

n_len = nodes.new("ShaderNodeVectorMath")
n_len.operation = "LENGTH"
n_len.location  = (100, 100)
links.new(n_pos.outputs["Position"], n_len.inputs[0])

# in_range = dist < new_radius  →  1.0 if vertex is now inside the wave front
n_in_range = _m("LESS_THAN", loc=(300, 220))
links.new(n_len.outputs["Value"],          n_in_range.inputs[0])
links.new(n_rad_grow.outputs["Value"],     n_in_range.inputs[1])

# NOT was_active = 1.0 - was_active  →  gate that blocks re-activation
n_not_active = _m("SUBTRACT", x=1.0, loc=(400, 320))
links.new(n_was_active.outputs["Value"], n_not_active.inputs[1])

# just_reached = in_range AND NOT was_active  (MULTIPLY = float AND on 0/1 values)
n_just_reached = _m("MULTIPLY", loc=(560, 270))
links.new(n_in_range.outputs["Value"],   n_just_reached.inputs[0])
links.new(n_not_active.outputs["Value"], n_just_reached.inputs[1])

# Scene time in seconds — used as the activation timestamp per vertex
# Seconds is fps-independent; downstream material normalises by total duration
n_stime = nodes.new("GeometryNodeInputSceneTime")
n_stime.location = (400, 80)

# value_if_inactive = Switch(just_reached: false=0.0, true=scene_seconds)
# Vertices entering the radius this frame receive a non-zero timestamp; others stay 0
n_sw_inner = nodes.new("GeometryNodeSwitch")
n_sw_inner.input_type = "FLOAT"
n_sw_inner.location   = (720, 180)
links.new(n_just_reached.outputs["Value"],   n_sw_inner.inputs[0])  # condition
n_sw_inner.inputs[1].default_value = 0.0                            # False: not yet reached
links.new(n_stime.outputs["Seconds"],        n_sw_inner.inputs[2])  # True: timestamp

# wave_time_new = Switch(was_active: false=value_if_inactive, true=old_wave_time)
# Already-active vertices keep their original timestamp — activation is irreversible
n_sw_outer = nodes.new("GeometryNodeSwitch")
n_sw_outer.input_type = "FLOAT"
n_sw_outer.location   = (900, 320)
links.new(n_was_active.outputs["Value"],     n_sw_outer.inputs[0])  # condition
links.new(n_sw_inner.outputs["Output"],      n_sw_outer.inputs[1])  # False: inactive path
links.new(n_read_wt.outputs["Attribute"],    n_sw_outer.inputs[2])  # True: preserve timestamp

# Write updated wave_time back to the geometry for next frame
n_store = nodes.new("GeometryNodeStoreNamedAttribute")
n_store.data_type = "FLOAT"
n_store.domain    = "POINT"
n_store.location  = (1100, 300)
n_store.inputs["Name"].default_value = ATTR_NAME
links.new(sim_in.outputs["Geometry"],        n_store.inputs["Geometry"])
links.new(n_sw_outer.outputs["Output"],      n_store.inputs["Value"])
links.new(n_store.outputs["Geometry"],       sim_out.inputs["Geometry"])

# ============================================================
# After zone: flat shading + output
# ============================================================
n_flat = nodes.new("GeometryNodeSetShadeSmooth")
n_flat.domain = "FACE"
n_flat.location = (1300, 0)
n_flat.inputs["Shade Smooth"].default_value = False
links.new(sim_out.outputs["Geometry"], n_flat.inputs["Geometry"])
links.new(n_flat.outputs["Geometry"],  n_out.inputs["Geometry"])

# ============================================================
# Modifier
# ============================================================
mod            = obj.modifiers.new(name="HoloflowGNWaveReveal", type="NODES")
mod.node_group = tree

# ============================================================
# Emission material — ShaderNodeAttribute reads wave_time FLOAT POINT attribute.
# GN-written named attributes are visible in material shader trees in Blender 4+.
# ============================================================
mat = bpy.data.materials.new("WaveReveal")
mat.use_nodes             = True
mat.surface_render_method = "FORWARD"
nt  = mat.node_tree
out_node = nt.nodes["Material Output"]
nt.nodes.remove(nt.nodes["Principled BSDF"])

attr_n = nt.nodes.new("ShaderNodeAttribute")
attr_n.attribute_name = ATTR_NAME
attr_n.location = (-600, 0)

norm_n = nt.nodes.new("ShaderNodeMath")
norm_n.operation = "DIVIDE"
norm_n.location  = (-400, 0)
norm_n.inputs[1].default_value = TOTAL_FRAMES / 24.0  # 24 fps assumed; normalise 0→1
nt.links.new(attr_n.outputs["Fac"], norm_n.inputs[0])

ramp_n = nt.nodes.new("ShaderNodeValToRGB")
ramp_n.location     = (-200, 0)
cr                  = ramp_n.color_ramp
cr.interpolation    = "B_SPLINE"
cr.elements[0].position = 0.0; cr.elements[0].color = (0.0, 0.0, 0.05, 1.0)  # inactive: near-black
cr.elements[1].position = 1.0; cr.elements[1].color = (0.5, 1.0, 1.0,  1.0)  # early: cyan-white
mid = cr.elements.new(0.45)
mid.color = (0.0, 0.35, 1.0, 1.0)  # cobalt at midpoint of reveal
nt.links.new(norm_n.outputs["Value"], ramp_n.inputs["Fac"])

emit_n = nt.nodes.new("ShaderNodeEmission")
emit_n.location = (50, 0)
emit_n.inputs["Strength"].default_value = 4.0
nt.links.new(ramp_n.outputs["Color"], emit_n.inputs["Color"])
nt.links.new(emit_n.outputs["Emission"], out_node.inputs["Surface"])

obj.data.materials.append(mat)

# ============================================================
# Lighting & camera
# ============================================================
sun_d = bpy.data.lights.new("Sun", type="SUN"); sun_d.energy = 2.0
sun_o = bpy.data.objects.new("Sun", sun_d)
scene.collection.objects.link(sun_o)
sun_o.rotation_euler = (0.5, 0.0, 0.7)

cam_d = bpy.data.cameras.new("Camera")
cam_o = bpy.data.objects.new("Camera", cam_d)
scene.collection.objects.link(cam_o)
cam_o.location       = (0.0, -4.8, 3.8)
cam_o.rotation_euler = (0.88, 0.0, 0.0)
scene.camera         = cam_o

# ============================================================
# Advance simulation frame-by-frame to GLB_FRAME.
# Simulation zones are incremental: frame_set(N) alone only evaluates frame N
# using the cached state from frame N-1. If the cache is empty (headless),
# each frame must be visited in order from frame_start so the zone can build
# its state chain correctly.
# ============================================================
bpy.context.view_layer.objects.active = obj
for frame in range(1, GLB_FRAME + 1):
    scene.frame_set(frame)
    bpy.context.view_layer.update()

# ============================================================
# Export GLB — static snapshot at GLB_FRAME
# export_apply=True bakes the evaluated GN geometry (with wave_time
# propagated to this frame) into the exported mesh. The wave_time
# attribute itself is not a glTF standard attribute; visual appearance
# is baked into the geometry via the EEVEE emission material.
# ============================================================
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
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

scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[holoflow] {MESH_NAME}.blend saved; GLB snapshot at frame {GLB_FRAME}")
