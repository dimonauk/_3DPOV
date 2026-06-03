"""
GN Sample Nearest Surface — Mesh-Conform Tile Armour  (Blender 5.1)
Licence: CC0

Sample Nearest Surface (SNS) is one of the few Geometry Nodes that crosses
the object boundary: given a target Mesh socket plus a query position, it
returns a field value sampled at the nearest surface point.  Position and
Normal are just fields like any other, so three SNS passes yield snapped
position, surface orientation, and a baked latitude float in a single
topology-aware lookup — no distance falloff, no post-hoc correction.

Design decisions
- Scatter source is a slightly larger sphere (radius SCATTER_RADIUS) so every
  query point starts outside the target surface.  On a convex mesh this
  guarantees Is_Valid = True on every point; on a concave mesh you would need
  a different scatter strategy or filter by Is_Valid.
- Latitude is baked as a vertex attribute on the target in Python, not derived
  inside the node tree.  That keeps the GN graph free of coordinate-space math
  and makes retargeting (swap the Object socket) automatic — the new target just
  needs its own "latitude" attribute.
- The three SNS nodes share a single InputPosition node for Sample Position.
  That one Position field evaluates on the scatter-point domain (the current
  geometry at that point in the graph), so all three lookups hit the same
  nearest surface point.
- Tile alignment is computed before instancing.  FunctionNodeAlignEulerToVector
  is a field node: it produces a per-point Rotation field that Instance On Points
  reads without any Realize Instances cost.
"""

import bpy

# ── Parameters ────────────────────────────────────────────────────────────────
CONFORM_RADIUS   = 2.0    # target sphere radius (m)
SCATTER_RADIUS   = 2.4    # source sphere — query points start outside target
SCATTER_DENSITY  = 450.0  # points per m² on the scatter sphere
TILE_VERTS       = 6      # 6 → hexagonal tile
TILE_RADIUS      = 0.12   # hexagon circumradius at Tile_Scale = 1.0 (m)
TILE_DEPTH       = 0.016  # coin thickness (m)
TILE_SCALE_DEF   = 0.84   # default < 1.0 introduces the inter-tile air gap

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# ── 1. Conform target sphere with baked latitude attribute ────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=CONFORM_RADIUS)
target_obj = bpy.context.active_object
target_obj.name = "ConformTarget"
bpy.ops.object.shade_smooth()

# Bake latitude as a per-vertex FLOAT: 0 = south pole, 1 = north pole.
# SNS reads this via a Named Attribute field evaluated on the target's POINT
# domain — the same mechanism as any other named attribute in a shader.
me = target_obj.data
lat_attr = me.attributes.new("latitude", type='FLOAT', domain='POINT')
for i, v in enumerate(me.vertices):
    lat_attr.data[i].value = v.co.z / CONFORM_RADIUS * 0.5 + 0.5

target_obj.hide_render = True   # source-of-truth mesh; not a rendered visual

# ── 2. Armour host object ─────────────────────────────────────────────────────
bpy.ops.object.add(type='MESH')
armour = bpy.context.active_object
armour.name = "TileArmour"

# ── 3. Geometry Nodes modifier and tree ───────────────────────────────────────
mod  = armour.modifiers.new("ArmourConform", type='NODES')
tree = bpy.data.node_groups.new("ArmourConform", type='GeometryNodeTree')
mod.node_group = tree

N = tree.nodes
L = tree.links

def nd(bl_idname, x=0, y=0):
    n = N.new(bl_idname)
    n.location = (x, y)
    return n

# Interface sockets (Blender 4.0+ tree.interface API)
iface = tree.interface
iface.new_socket("Conform Target",  in_out='INPUT',  socket_type='NodeSocketObject')
iface.new_socket("Scatter Density", in_out='INPUT',  socket_type='NodeSocketFloat')
iface.new_socket("Tile Scale",      in_out='INPUT',  socket_type='NodeSocketFloat')
iface.new_socket("Seed",            in_out='INPUT',  socket_type='NodeSocketInt')
iface.new_socket("Geometry",        in_out='OUTPUT', socket_type='NodeSocketGeometry')

# Modifier defaults — Input_N indices match interface creation order
mod["Input_1"] = target_obj
mod["Input_2"] = SCATTER_DENSITY
mod["Input_3"] = TILE_SCALE_DEF
mod["Input_4"] = 0

# ── Node graph ────────────────────────────────────────────────────────────────
gi = nd("NodeGroupInput",   -900,   0)
go = nd("NodeGroupOutput",  1500,   0)

# Object Info → extract the target mesh as a Geometry value
oi = nd("GeometryNodeObjectInfo", -650, 400)
oi.transform_space = 'RELATIVE'
L.new(gi.outputs["Conform Target"], oi.inputs["Object"])

# Scatter source: UV sphere slightly larger than the target
sph = nd("GeometryNodeMeshUVSphere", -650, -100)
sph.inputs["Radius"].default_value   = SCATTER_RADIUS
sph.inputs["Segments"].default_value = 16
sph.inputs["Rings"].default_value    = 10

# Distribute random points on the scatter sphere surface
dp = nd("GeometryNodeDistributePointsOnFaces", -400, -100)
dp.distribute_method = 'RANDOM'
L.new(sph.outputs["Mesh"],            dp.inputs["Mesh"])
L.new(gi.outputs["Scatter Density"],  dp.inputs["Density"])
L.new(gi.outputs["Seed"],             dp.inputs["Seed"])

# Shared query position: Position evaluated on the CURRENT geometry (scatter points).
# Three SNS nodes all reference this same node — they each hit the same nearest
# surface point on the target for a given scatter-point position.
qpos = nd("GeometryNodeInputPosition", -630, -280)

# ── SNS #1 — snap to surface position ────────────────────────────────────────
# Value socket: an InputPosition node evaluated on the TARGET mesh.
# SNS bilinearly interpolates between the nearest triangle's vertex positions.
pos_field = nd("GeometryNodeInputPosition", -420, 600)
sns_p = nd("GeometryNodeSampleNearestSurface", -100, 550)
sns_p.data_type = 'FLOAT_VECTOR'
L.new(oi.outputs["Geometry"],        sns_p.inputs["Mesh"])
L.new(pos_field.outputs["Position"], sns_p.inputs["Value"])
L.new(qpos.outputs["Position"],      sns_p.inputs["Sample Position"])

# ── SNS #2 — surface normal ───────────────────────────────────────────────────
# Same idea: Normal is just a field on the target mesh.  On a smooth-shaded
# target sphere, SNS returns the interpolated vertex normal — the true surface
# tangent, not a discrete face normal.
nrm_field = nd("GeometryNodeInputNormal", -420, 300)
sns_n = nd("GeometryNodeSampleNearestSurface", -100, 250)
sns_n.data_type = 'FLOAT_VECTOR'
L.new(oi.outputs["Geometry"],        sns_n.inputs["Mesh"])
L.new(nrm_field.outputs["Normal"],   sns_n.inputs["Value"])
L.new(qpos.outputs["Position"],      sns_n.inputs["Sample Position"])

# ── SNS #3 — latitude float attribute ────────────────────────────────────────
lat_na = nd("GeometryNodeInputNamedAttribute", -420, -50)
lat_na.data_type = 'FLOAT'
lat_na.inputs["Name"].default_value = "latitude"
sns_l = nd("GeometryNodeSampleNearestSurface", -100, -80)
sns_l.data_type = 'FLOAT'
L.new(oi.outputs["Geometry"],        sns_l.inputs["Mesh"])
L.new(lat_na.outputs["Attribute"],   sns_l.inputs["Value"])
L.new(qpos.outputs["Position"],      sns_l.inputs["Sample Position"])

# ── Snap scatter points to the surface and tag with latitude ──────────────────
# Set Position moves each scatter point from its scatter-sphere location to the
# exact nearest surface point on the target.  This step is critical: the
# Instance On Points rotation is computed BEFORE snapping, but Instance On Points
# reads the POST-snap point positions for instance origin placement.
sp = nd("GeometryNodeSetPosition", 200, -100)
L.new(dp.outputs["Points"],          sp.inputs["Geometry"])
L.new(sns_p.outputs["Value"],        sp.inputs["Position"])

# Store tile_lat on scatter points.  Each instance inherits its point's
# attribute value — all six vertices of one tile read the same per-point float
# via the Attribute shader node, so the colour is per-tile, not per-vertex.
sl = nd("GeometryNodeStoreNamedAttribute", 450, -100)
sl.data_type = 'FLOAT'
sl.domain    = 'POINT'
sl.inputs["Name"].default_value = "tile_lat"
L.new(sp.outputs["Geometry"],        sl.inputs["Geometry"])
L.new(sns_l.outputs["Value"],        sl.inputs["Value"])

# ── Per-tile rotation aligned to surface normal ───────────────────────────────
# FunctionNodeAlignEulerToVector is a field node: it produces a Rotation value
# per scatter point that Instance On Points consumes without Realize Instances.
# axis='Z' maps the tile's local +Z to the surface outward normal.
aln = nd("FunctionNodeAlignEulerToVector", 200, 350)
aln.axis       = 'Z'
aln.pivot_axis = 'AUTO'
L.new(sns_n.outputs["Value"],        aln.inputs["Vector"])

# ── Hex tile geometry: 6-sided coin ──────────────────────────────────────────
# Radius = TILE_RADIUS * Tile_Scale — multiplying at the source keeps the tile
# mesh centred at origin regardless of scale, which is what Instance On Points
# needs.  A separate Scale/Transform node would work but adds an extra node.
tile_r = nd("ShaderNodeMath", -650, -500)
tile_r.operation = 'MULTIPLY'
tile_r.inputs[0].default_value = TILE_RADIUS
L.new(gi.outputs["Tile Scale"],      tile_r.inputs[1])

hex_geo = nd("GeometryNodeMeshCylinder", -400, -520)
hex_geo.inputs["Vertices"].default_value = TILE_VERTS
hex_geo.inputs["Depth"].default_value    = TILE_DEPTH
hex_geo.fill_type = 'NGON'     # flat hexagonal cap, not triangulated fan
L.new(tile_r.outputs["Value"],       hex_geo.inputs["Radius"])

# ── Instance On Points — place one tile per snapped scatter point ─────────────
inst = nd("GeometryNodeInstanceOnPoints", 750, -100)
L.new(sl.outputs["Geometry"],        inst.inputs["Points"])
L.new(hex_geo.outputs["Mesh"],       inst.inputs["Instance"])
L.new(aln.outputs["Rotation"],       inst.inputs["Rotation"])
L.new(inst.outputs["Instances"],     go.inputs["Geometry"])

# ── 4. Material — latitude colour ramp ───────────────────────────────────────
mat = bpy.data.materials.new("ArmourTile")
mat.use_nodes            = True
mat.use_backface_culling = True
mn = mat.node_tree.nodes
ml = mat.node_tree.links

bsdf    = mn["Principled BSDF"]
attr_nd = mn.new("ShaderNodeAttribute")
attr_nd.attribute_name = "tile_lat"
attr_nd.location = (-600, 200)

ramp = mn.new("ShaderNodeValToRGB")
ramp.location = (-300, 200)
ramp.color_ramp.elements[0].color = (0.02, 0.10, 0.55, 1)  # deep indigo  (south)
ramp.color_ramp.elements[1].color = (0.88, 0.38, 0.05, 1)  # warm amber   (north)
mid = ramp.color_ramp.elements.new(0.5)
mid.color = (0.05, 0.52, 0.22, 1)                           # equator green

bsdf.inputs["Metallic"].default_value  = 0.35
bsdf.inputs["Roughness"].default_value = 0.30

ml.new(attr_nd.outputs["Fac"],  ramp.inputs["Fac"])
ml.new(ramp.outputs["Color"],   bsdf.inputs["Base Color"])
armour.data.materials.append(mat)

# ── 5. World, lights, camera ─────────────────────────────────────────────────
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.06, 1)

bpy.ops.object.light_add(type='SUN', location=(4, -3, 7))
sun = bpy.context.active_object
sun.data.energy = 4.0

bpy.ops.object.light_add(type='AREA', location=(-3, 4, 2))
fill = bpy.context.active_object
fill.data.energy = 80
fill.data.size   = 5.0

bpy.ops.object.camera_add(location=(0, -6.5, 2.5))
cam = bpy.context.active_object
cam.rotation_euler = (1.18, 0, 0)
cam.data.lens      = 50
scene.camera       = cam

# ── 6. Save ───────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//tile_armour.blend"))
print("Saved tile_armour.blend — run record.py to render viewport.mp4")
