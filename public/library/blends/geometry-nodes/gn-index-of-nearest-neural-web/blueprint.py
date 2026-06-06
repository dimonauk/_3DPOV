"""
GN Index of Nearest — Neural Web Connection Field
Blender 5.1  ·  CC0 2026  ·  Holoflow Studio

Scatters points on a UV sphere, then connects each point to its nearest
scatter-neighbour with a thin emission tube.  A wave_radius Group Input
(0 → 2.5) gates which connections are visible: animating it creates a
synaptic activation wave travelling pole-to-equator-to-antipole.

Why Index of Nearest rather than Geometry Proximity?
  GeometryProximity measures distance to a *different* target mesh.
  IndexOfNearest asks "which OTHER element in my own set is nearest?"
  and returns that element's integer index.  It is the foundation for
  nearest-neighbour graphs, minimum-spanning-tree approximations, and
  per-point directional fields that require pairing within a single
  point cloud rather than querying an external surface.

For Each zone role:
  There is no atomic GN node that takes two world-space positions and
  emits an edge.  The For Each zone iterates over scatter points; each
  iteration reads its own position and nn_position via SampleIndex,
  then instantiates a two-vertex MeshLine — a simple 2-vertex/1-edge
  mesh — between them.  The zone accumulates these meshes into one.

Outside sources:
  blender-scripting (Nicolas Janakiev, MIT)
    https://github.com/njanakiev/blender-scripting
    Related: blender-osm, blender-gis (same author)
  glTF-Blender-IO (Khronos Group, Apache-2.0)
    https://github.com/KhronosGroup/glTF-Blender-IO
    Related: glTF Validator, three.js glTF loader (Khronos ecosystem)
"""

import bpy

# ── Parameters ────────────────────────────────────────────────────────────────
POINT_SPACING    = 0.22     # Poisson min-distance on unit sphere
MAX_CONNECT_DIST = 0.48     # skip connections longer than this (world units)
WAVE_RADIUS_INIT = 0.5      # initial wave-front radius for interactive preview
TUBE_RADIUS      = 0.005    # connection tube cross-section (m)
NODE_RADIUS      = 0.020    # scatter-dot radius (m)
TUBE_SEGS        = 6        # hexagonal profile (fast render)
GLB_PATH         = "//neural_web.glb"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "neural_web_scene"

bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                     radius=1.0, location=(0, 0, 0))
obj = bpy.context.active_object
obj.name = "neural_web"

# ── Materials ─────────────────────────────────────────────────────────────────
# Dark sphere — backdrop for the web
mat_sphere = bpy.data.materials.new("NeuralSphere")
mat_sphere.use_nodes = True
bsdf_sp = mat_sphere.node_tree.nodes["Principled BSDF"]
bsdf_sp.inputs["Base Color"].default_value  = (0.02, 0.02, 0.06, 1.0)
bsdf_sp.inputs["Roughness"].default_value   = 0.8
bsdf_sp.inputs["Metallic"].default_value    = 0.0
obj.data.materials.append(mat_sphere)

# Tube — emission gradient: cyan (north) → magenta (south)
mat_tube = bpy.data.materials.new("NeuralTube")
mat_tube.use_nodes = True
_t = mat_tube.node_tree
for _n in list(_t.nodes): _t.nodes.remove(_n)
_out = _t.nodes.new("ShaderNodeOutputMaterial")
_em  = _t.nodes.new("ShaderNodeEmission");  _em.inputs["Strength"].default_value = 4.5
_cr  = _t.nodes.new("ShaderNodeValToRGB")
_cr.color_ramp.elements[0].color = (0.0, 0.85, 1.0, 1.0)   # cyan
_cr.color_ramp.elements[1].color = (0.85, 0.1, 0.85, 1.0)  # magenta
_at  = _t.nodes.new("ShaderNodeAttribute");  _at.attribute_name = "colour_t"
_t.links.new(_at.outputs["Fac"],       _cr.inputs["Fac"])
_t.links.new(_cr.outputs["Color"],     _em.inputs["Color"])
_t.links.new(_em.outputs["Emission"],  _out.inputs["Surface"])

# Node dots — warm white emission
mat_dot = bpy.data.materials.new("NeuralDot")
mat_dot.use_nodes = True
_dt = mat_dot.node_tree
for _n in list(_dt.nodes): _dt.nodes.remove(_n)
_dout = _dt.nodes.new("ShaderNodeOutputMaterial")
_dem  = _dt.nodes.new("ShaderNodeEmission")
_dem.inputs["Color"].default_value    = (1.0, 0.92, 0.8, 1.0)
_dem.inputs["Strength"].default_value = 3.0
_dt.links.new(_dem.outputs["Emission"], _dout.inputs["Surface"])

# ── Geometry Nodes modifier ───────────────────────────────────────────────────
mod  = obj.modifiers.new("NeuralWeb_GN", "NODES")
tree = bpy.data.node_groups.new("NeuralWebTree", "GeometryNodeTree")
mod.node_group = tree
nodes = tree.nodes
links = tree.links

def N(t, x=0, y=0):
    n = nodes.new(t); n.location = (x, y); return n

# Group I/O
gi = N("NodeGroupInput",  -2200, 0)
go = N("NodeGroupOutput",  2500, 0)
tree.interface.new_socket("Geometry",       in_out='INPUT',  socket_type='NodeSocketGeometry')
tree.interface.new_socket("Wave Radius",    in_out='INPUT',  socket_type='NodeSocketFloat')
tree.interface.new_socket("Max Conn Dist",  in_out='INPUT',  socket_type='NodeSocketFloat')
tree.interface.new_socket("Tube Radius",    in_out='INPUT',  socket_type='NodeSocketFloat')
tree.interface.new_socket("Geometry",       in_out='OUTPUT', socket_type='NodeSocketGeometry')
mod["Input_2"] = WAVE_RADIUS_INIT
mod["Input_3"] = MAX_CONNECT_DIST
mod["Input_4"] = TUBE_RADIUS

# ── Phase 1: Scatter points ───────────────────────────────────────────────────
dist = N("GeometryNodeDistributePointsOnFaces", -1800, 200)
dist.distribute_method = 'POISSON'
dist.inputs["Distance Min"].default_value  = POINT_SPACING
dist.inputs["Density Max"].default_value   = 20.0
dist.inputs["Seed"].default_value          = 42
links.new(gi.outputs["Geometry"], dist.inputs["Mesh"])

# ── Phase 2: Index of Nearest ─────────────────────────────────────────────────
# For each scatter point, find the index of its nearest OTHER scatter point.
# The Position input defaults to InputPosition (current point position).
# Group ID = 0 means all points compete in one group — no subset filtering.
ion = N("GeometryNodeIndexOfNearest", -1400, 200)
# ion.inputs["Position"] left unconnected → evaluates as InputPosition per point
# ion.inputs["Group ID"] left at default 0

# Sample the neighbor's position using the returned index
samp_nn = N("GeometryNodeSampleIndex", -1000, 300)
samp_nn.data_type = 'FLOAT_VECTOR'
samp_nn.domain    = 'POINT'
pos_fld = N("GeometryNodeInputPosition", -1200, 450)
links.new(dist.outputs["Points"],     samp_nn.inputs["Geometry"])
links.new(pos_fld.outputs["Position"], samp_nn.inputs["Value"])
links.new(ion.outputs["Index"],        samp_nn.inputs["Index"])
# samp_nn.outputs["Value"] = nn_pos (world position of nearest neighbor)

# ── Phase 3: Distance computations ───────────────────────────────────────────
cur_pos = N("GeometryNodeInputPosition", -1000, 150)

vm_sub  = N("ShaderNodeVectorMath", -700, 200)   # conn vector
vm_sub.operation = 'SUBTRACT'
links.new(samp_nn.outputs["Value"],    vm_sub.inputs[0])
links.new(cur_pos.outputs["Position"], vm_sub.inputs[1])

vm_len  = N("ShaderNodeVectorMath", -500, 200)   # connection length (scalar)
vm_len.operation = 'LENGTH'
links.new(vm_sub.outputs["Vector"], vm_len.inputs[0])

# Distance of connection MID-POINT from north pole (0,0,1)
# Gating on midpoint prevents connections that straddle the wave front
# from flickering on and off as the wave passes one end of the edge.
vm_mid = N("ShaderNodeVectorMath", -700, 0)     # (pos + nn_pos) * 0.5
vm_mid.operation = 'ADD'
links.new(cur_pos.outputs["Position"], vm_mid.inputs[0])
links.new(samp_nn.outputs["Value"],    vm_mid.inputs[1])
vm_mid_sc = N("ShaderNodeVectorMath", -500, 0)
vm_mid_sc.operation = 'SCALE'; vm_mid_sc.inputs["Scale"].default_value = 0.5
links.new(vm_mid.outputs["Vector"], vm_mid_sc.inputs[0])

vm_nrth = N("ShaderNodeVectorMath", -300, 0)    # midpoint − (0,0,1)
vm_nrth.operation = 'SUBTRACT'
vm_nrth.inputs[1].default_value = (0.0, 0.0, 1.0)
links.new(vm_mid_sc.outputs["Vector"], vm_nrth.inputs[0])
vm_nd = N("ShaderNodeVectorMath", -100, 0)       # scalar distance from north
vm_nd.operation = 'LENGTH'
links.new(vm_nrth.outputs["Vector"], vm_nd.inputs[0])

# ── Phase 4: Gate booleans ────────────────────────────────────────────────────
cmp_wave = N("FunctionNodeCompare", 100, 0)       # midpoint within wave radius
cmp_wave.data_type = 'FLOAT'; cmp_wave.operation = 'LESS_THAN'
links.new(vm_nd.outputs["Value"],           cmp_wave.inputs["A"])
links.new(gi.outputs["Wave Radius"],        cmp_wave.inputs["B"])

cmp_dist = N("FunctionNodeCompare", 100, 200)     # connection within max dist
cmp_dist.data_type = 'FLOAT'; cmp_dist.operation = 'LESS_THAN'
links.new(vm_len.outputs["Value"],          cmp_dist.inputs["A"])
links.new(gi.outputs["Max Conn Dist"],      cmp_dist.inputs["B"])

bool_and = N("FunctionNodeBooleanMath", 300, 100) # conn_active = wave AND range
bool_and.operation = 'AND'
links.new(cmp_wave.outputs["Result"], bool_and.inputs[0])
links.new(cmp_dist.outputs["Result"], bool_and.inputs[1])

# Normalised distance from north (0-1) for colour gradient on tubes
vm_np = N("ShaderNodeVectorMath", -700, -200)   # Position − (0,0,1)
vm_np.operation = 'SUBTRACT'; vm_np.inputs[1].default_value = (0.0, 0.0, 1.0)
links.new(cur_pos.outputs["Position"], vm_np.inputs[0])
vm_nl = N("ShaderNodeVectorMath", -500, -200)   # scalar length 0-2
vm_nl.operation = 'LENGTH'
links.new(vm_np.outputs["Vector"], vm_nl.inputs[0])
m_div = N("ShaderNodeMath", -300, -200)          # divide by 2 → 0-1
m_div.operation = 'DIVIDE'; m_div.inputs[1].default_value = 2.0
links.new(vm_nl.outputs["Value"], m_div.inputs[0])

# ── Phase 5: Store attributes on scatter points ───────────────────────────────
st_nn = N("GeometryNodeStoreNamedAttribute", 500, 200)
st_nn.data_type = 'FLOAT_VECTOR'; st_nn.domain = 'POINT'
st_nn.inputs["Name"].default_value = "nn_position"
links.new(dist.outputs["Points"],      st_nn.inputs["Geometry"])
links.new(samp_nn.outputs["Value"],    st_nn.inputs["Value"])

st_ac = N("GeometryNodeStoreNamedAttribute", 700, 200)
st_ac.data_type = 'BOOLEAN'; st_ac.domain = 'POINT'
st_ac.inputs["Name"].default_value = "conn_active"
links.new(st_nn.outputs["Geometry"],   st_ac.inputs["Geometry"])
links.new(bool_and.outputs["Boolean"], st_ac.inputs["Value"])

st_ct = N("GeometryNodeStoreNamedAttribute", 900, 200)
st_ct.data_type = 'FLOAT'; st_ct.domain = 'POINT'
st_ct.inputs["Name"].default_value = "colour_t"
links.new(st_ac.outputs["Geometry"],   st_ct.inputs["Geometry"])
links.new(m_div.outputs["Value"],      st_ct.inputs["Value"])

# ── Phase 6: For Each zone — build one edge per scatter point ─────────────────
# Each iteration: read current point's attributes via SampleIndex(index=Element_Index),
# build a 2-vertex MeshLine from pos_i to nn_pos_i, gate inactive connections.
fe_in  = N("GeometryNodeForeachGeometryElementInput",  1100, 300)
fe_out = N("GeometryNodeForeachGeometryElementOutput", 1800, 300)
fe_in.domain = 'POINT'
fe_in.pair_with_output(fe_out)
links.new(st_ct.outputs["Geometry"], fe_in.inputs["Geometry"])

def zone_samp(data_type, name, x, y):
    """SampleIndex helper: read named attribute for the current iteration."""
    s = N("GeometryNodeSampleIndex", x, y)
    s.data_type = data_type; s.domain = 'POINT'
    na = N("GeometryNodeInputNamedAttribute", x - 200, y)
    na.data_type = data_type; na.inputs["Name"].default_value = name
    links.new(st_ct.outputs["Geometry"], s.inputs["Geometry"])
    links.new(na.outputs["Attribute"],   s.inputs["Value"])
    links.new(fe_in.outputs[1],          s.inputs["Index"])  # Element Index
    return s

# SampleIndex for current point's position (use Position field directly)
sp_pos = N("GeometryNodeSampleIndex", 1100, 500)
sp_pos.data_type = 'FLOAT_VECTOR'; sp_pos.domain = 'POINT'
pf2 = N("GeometryNodeInputPosition", 900, 620)
links.new(st_ct.outputs["Geometry"],  sp_pos.inputs["Geometry"])
links.new(pf2.outputs["Position"],    sp_pos.inputs["Value"])
links.new(fe_in.outputs[1],           sp_pos.inputs["Index"])

sp_nn  = zone_samp('FLOAT_VECTOR', "nn_position", 1100, 150)
sp_ac  = zone_samp('BOOLEAN',      "conn_active",  1100, -50)
sp_col = zone_samp('FLOAT',        "colour_t",    1100, -250)

# Two-vertex edge from pos_i to nn_pos_i
ml = N("GeometryNodeMeshLine", 1400, 400)
ml.mode = 'END_POINTS'; ml.inputs["Count"].default_value = 2
links.new(sp_pos.outputs["Value"],  ml.inputs["Start Location"])
links.new(sp_nn.outputs["Value"],   ml.inputs["End Location"])

# Propagate colour_t to line vertices for tube gradient
st_cl = N("GeometryNodeStoreNamedAttribute", 1450, 200)
st_cl.data_type = 'FLOAT'; st_cl.domain = 'POINT'
st_cl.inputs["Name"].default_value = "colour_t"
links.new(ml.outputs["Mesh"],       st_cl.inputs["Geometry"])
links.new(sp_col.outputs["Value"],  st_cl.inputs["Value"])

# Delete both vertices when inactive — edge vanishes with them
not_ac = N("FunctionNodeBooleanMath", 1500, 0)
not_ac.operation = 'NOT'
links.new(sp_ac.outputs["Value"],   not_ac.inputs[0])
dg = N("GeometryNodeDeleteGeometry", 1650, 200)
dg.domain = 'POINT'
links.new(st_cl.outputs["Geometry"], dg.inputs["Geometry"])
links.new(not_ac.outputs["Boolean"], dg.inputs["Selection"])
links.new(dg.outputs["Geometry"],    fe_out.inputs["Geometry"])

# ── Phase 7: Tubes + scatter dots ────────────────────────────────────────────
m2c = N("GeometryNodeMeshToCurve",      2000, 400)
links.new(fe_out.outputs["Geometry"],   m2c.inputs["Mesh"])

circ = N("GeometryNodeCurvePrimitiveCircle", 2000, 200)
circ.inputs["Radius"].default_value     = TUBE_RADIUS
circ.inputs["Resolution"].default_value = TUBE_SEGS

c2m = N("GeometryNodeCurveToMesh", 2150, 400)
c2m.inputs["Fill Caps"].default_value = True
links.new(m2c.outputs["Curve"],    c2m.inputs["Curve"])
links.new(circ.outputs["Curve"],   c2m.inputs["Profile Curve"])

smt_tube = N("GeometryNodeSetMaterial", 2300, 400)
smt_tube.inputs["Material"].default_value = mat_tube
links.new(c2m.outputs["Mesh"],     smt_tube.inputs["Geometry"])

# Scatter dots: IcoSphere primitive as per-point instance
ico = N("GeometryNodeMeshIcoSphere",   2000, 0)
ico.inputs["Radius"].default_value     = NODE_RADIUS
ico.inputs["Subdivisions"].default_value = 1

iop = N("GeometryNodeInstanceOnPoints", 2150, 0)
links.new(st_ct.outputs["Geometry"], iop.inputs["Points"])
links.new(ico.outputs["Mesh"],       iop.inputs["Instance"])

smt_dot = N("GeometryNodeSetMaterial", 2300, 0)
smt_dot.inputs["Material"].default_value = mat_dot
links.new(iop.outputs["Instances"],  smt_dot.inputs["Geometry"])

real = N("GeometryNodeRealizeInstances", 2400, 0)
links.new(smt_dot.outputs["Geometry"], real.inputs["Geometry"])

# Join sphere + tubes + dots
join = N("GeometryNodeJoinGeometry", 2450, 200)
links.new(gi.outputs["Geometry"],      join.inputs["Geometry"])
links.new(smt_tube.outputs["Geometry"], join.inputs["Geometry"])
links.new(real.outputs["Geometry"],    join.inputs["Geometry"])
links.new(join.outputs["Geometry"],    go.inputs["Geometry"])

# ── Export ────────────────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = obj
bpy.ops.object.modifier_apply(modifier="NeuralWeb_GN")

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format="GLB",
    export_apply=True,
    export_normals=True,
    export_colors=True,
    export_attributes=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)
print("neural_web.glb exported.")
