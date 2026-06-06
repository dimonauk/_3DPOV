"""
GN Scale Instances — Noise-Driven Organic Spine Growth
Blender 5.1 · CC0 · Holoflow Studio

Technique: Scale Instances applies a per-instance VECTOR field to the local
transform of each instance. Driving only Z (height) while leaving X and Y at
1.0 stretches spines along their own outward axis without distorting the cone
profile. Local Space = True means the scale follows the instance's own
orientation rather than world axes — essential when instances are aligned to a
sphere's surface normals, because a world-Z scale would shear the tilted cones.

Center = (0, 0, 0) in local space pins the pivot at the spine base vertex: the
cone grows outward away from the sphere. Center = (0, 0, SPINE_LENGTH/2) would
scale from the midpoint, making the base retract INTO the sphere as the tip
extends — the opposite of what we want.

Contrast with Transform Instances: TI applies ONE uniform translation/rotation/
scale to the whole instance set (all-or-nothing). Scale Instances applies a
FIELD — an independent value per instance, evaluated lazily. This is why noise,
latitude, and animation can all drive the same socket simultaneously.

Outside sources:
  Blender Manual — Scale Instances Node (CC-BY-SA 4.0, Blender Documentation Team)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/instances/scale_instances.html
  blender-scripting (Nicolas Janakiev, MIT)
    https://github.com/njanakiev/blender-scripting
    Related: blender-osm, blender-gis (same author)
  glTF-Blender-IO (Khronos Group, Apache-2.0)
    https://github.com/KhronosGroup/glTF-Blender-IO
    Related: glTF Validator, three.js glTF loader
"""

import bpy
import bmesh
import math

# ── Parameters ────────────────────────────────────────────────────────────────
SPHERE_SUBDIVISIONS = 4      # IcoSphere subdiv 4 = 642 verts; uniform distribution
SPINE_LENGTH        = 0.18   # cone height when Grow_Factor = 1.0 (metres)
SPINE_BASE_RADIUS   = 0.012  # cone base radius (metres)
SPINE_SEGS          = 6      # hexagonal base ring — fast to render, clean silhouette
NOISE_SCALE         = 2.4    # lower value = larger blob-patches on sphere surface
NOISE_DETAIL        = 3.0    # octave count; above 6 has no visible benefit at this scale
NOISE_ROUGH         = 0.55   # persistence per octave; 0.5 = natural, 0.7 = craggier
MIN_SCALE           = 0.18   # shortest spine as fraction of full SPINE_LENGTH
MAX_SCALE           = 1.00   # tallest spine fraction
LAT_COMPRESS        = 0.42   # polar-cap scale multiplier; 0 = flat poles, 1 = no compress
BLEND_OUT           = "//spine_growth.blend"
GLB_OUT             = "//spine_growth.glb"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "spine_growth_scene"
scene.render.fps = 30

# ── Cone template mesh ────────────────────────────────────────────────────────
# Built via bmesh so we never enter Edit Mode. The cone local +Z axis points UP
# (away from base) — AlignEulerToVector maps world +Z onto the surface outward
# normal, so the cone's tip ends up pointing away from the sphere automatically.
def _make_cone() -> bpy.types.Object:
    me = bpy.data.meshes.new("spine_cone_template")
    bm = bmesh.new()
    ring = []
    for i in range(SPINE_SEGS):
        a = 2 * math.pi * i / SPINE_SEGS
        ring.append(bm.verts.new((
            SPINE_BASE_RADIUS * math.cos(a),
            SPINE_BASE_RADIUS * math.sin(a),
            0.0,
        )))
    tip = bm.verts.new((0.0, 0.0, SPINE_LENGTH))
    bmesh.ops.contextual_create(bm, geom=ring)        # base disc cap
    for i, bv in enumerate(ring):
        bm.faces.new([bv, ring[(i + 1) % SPINE_SEGS], tip])  # side triangles
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("spine_cone_template", me)
    bpy.context.collection.objects.link(ob)
    # Hidden in viewport and render — GN reads geometry from bpy.data directly;
    # scene membership is not required for ObjectInfo to reference the cone.
    ob.hide_viewport = True
    ob.hide_render   = True
    return ob

cone_ob = _make_cone()

# ── IcoSphere base ────────────────────────────────────────────────────────────
# IcoSphere chosen over UVSphere: UV sphere clusters vertices at the poles,
# creating dense spine patches there that compete visually with the compression.
# IcoSphere subdivisions=4 gives 642 vertices spaced as uniformly as possible.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=SPHERE_SUBDIVISIONS, radius=1.0, location=(0, 0, 0)
)
sphere = bpy.context.active_object
sphere.name = "spine_growth"

# ── Geometry Nodes modifier ───────────────────────────────────────────────────
mod  = sphere.modifiers.new("SpineGrowth_GN", "NODES")
tree = bpy.data.node_groups.new("SpineGrowth_Tree", "GeometryNodeTree")
mod.node_group = tree
nodes = tree.nodes
links = tree.links

def N(type_id, x=0, y=0):
    n = nodes.new(type_id); n.location = (x, y); return n

# ── Interface sockets ─────────────────────────────────────────────────────────
tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
# Grow_Factor = "Input_2" identifier — used by record.py for keyframing
grow_sock = tree.interface.new_socket(
    "Grow Factor", in_out="INPUT", socket_type="NodeSocketFloat"
)
grow_sock.default_value = 1.0
grow_sock.min_value      = 0.0
grow_sock.max_value      = 1.0

gi  = N("NodeGroupInput",  -900,   0)
go  = N("NodeGroupOutput",  800,   0)

# ── Flat shading on sphere base ───────────────────────────────────────────────
shade = N("GeometryNodeSetShadeSmooth", -700, 0)
shade.domain = "FACE"
shade.inputs["Shade Smooth"].default_value = False
links.new(gi.outputs["Geometry"], shade.inputs["Geometry"])

# ── Normal alignment for instances ────────────────────────────────────────────
inp_normal = N("GeometryNodeInputNormal",          -700,  250)
aln        = N("FunctionNodeAlignEulerToVector",   -500,  250)
aln.axis       = "Z"      # map cone local +Z onto surface outward normal
aln.pivot_axis = "AUTO"   # minimum-rotation pivot — no visible roll at poles
links.new(inp_normal.outputs["Normal"], aln.inputs["Vector"])

# ── Cone template via ObjectInfo ──────────────────────────────────────────────
oi = N("GeometryNodeObjectInfo", -500, -50)
oi.transform_space              = "ORIGINAL"
oi.inputs["Object"].default_value = cone_ob

# ── Instance On Points ────────────────────────────────────────────────────────
iop = N("GeometryNodeInstanceOnPoints", -200, 0)
links.new(shade.outputs["Geometry"], iop.inputs["Points"])
links.new(oi.outputs["Geometry"],    iop.inputs["Instance"])
links.new(aln.outputs["Rotation"],   iop.inputs["Rotation"])

# ── Noise texture — macro height pattern ──────────────────────────────────────
# InputPosition gives world position of each POINT-domain vertex.
# ShaderNodeTexNoise is available in the GN graph and evaluates as a field.
inp_pos = N("GeometryNodeInputPosition", -900, -400)
noise   = N("ShaderNodeTexNoise",        -700, -400)
noise.noise_dimensions              = "3D"
noise.inputs["Scale"].default_value      = NOISE_SCALE
noise.inputs["Detail"].default_value     = NOISE_DETAIL
noise.inputs["Roughness"].default_value  = NOISE_ROUGH
noise.inputs["Distortion"].default_value = 0.0
links.new(inp_pos.outputs["Position"], noise.inputs["Vector"])

# Remap noise [0,1] → [MIN_SCALE, MAX_SCALE] with SMOOTHSTEP to avoid
# hard-edged transitions at noise patch boundaries.
noise_map = N("ShaderNodeMapRange", -500, -400)
noise_map.data_type          = "FLOAT"
noise_map.interpolation_type = "SMOOTHSTEP"
noise_map.inputs["From Min"].default_value = 0.0
noise_map.inputs["From Max"].default_value = 1.0
noise_map.inputs["To Min"].default_value   = MIN_SCALE
noise_map.inputs["To Max"].default_value   = MAX_SCALE
links.new(noise.outputs["Fac"], noise_map.inputs["Value"])

# ── Latitude compression ──────────────────────────────────────────────────────
# Polar caps (|Z| → 1) receive shorter spines: avoids visual crowding where
# outward-pointing cones converge near both poles.
sep_xyz = N("ShaderNodeSeparateXYZ", -900, -600)
links.new(inp_pos.outputs["Position"], sep_xyz.inputs["Vector"])

abs_z = N("ShaderNodeMath", -700, -600)
abs_z.operation = "ABSOLUTE"
links.new(sep_xyz.outputs["Z"], abs_z.inputs[0])

# MapRange |Z| (0 → 1) to lat_mult (1.0 → LAT_COMPRESS):
# equator (|Z|=0) gets full spine height; poles (|Z|≈1) get LAT_COMPRESS × height.
lat_map = N("ShaderNodeMapRange", -500, -600)
lat_map.data_type          = "FLOAT"
lat_map.interpolation_type = "LINEAR"
lat_map.inputs["From Min"].default_value = 0.0
lat_map.inputs["From Max"].default_value = 1.0
lat_map.inputs["To Min"].default_value   = 1.0           # equator = full
lat_map.inputs["To Max"].default_value   = LAT_COMPRESS  # poles = compressed
links.new(abs_z.outputs["Value"], lat_map.inputs["Value"])

# ── Combine all scale factors ─────────────────────────────────────────────────
mul1 = N("ShaderNodeMath", -250, -500)
mul1.operation = "MULTIPLY"
links.new(noise_map.outputs["Result"], mul1.inputs[0])
links.new(lat_map.outputs["Result"],   mul1.inputs[1])

# Grow_Factor multiplied last: at 0 all spines collapse to flat; at 1 fully grown.
mul2 = N("ShaderNodeMath", 0, -500)
mul2.operation = "MULTIPLY"
links.new(mul1.outputs["Value"],     mul2.inputs[0])
links.new(gi.outputs["Grow Factor"], mul2.inputs[1])

# Build scale VECTOR (X=1, Y=1, Z=combined_scale): X and Y untouched so the
# cone's radial profile never distorts regardless of growth stage.
comb = N("ShaderNodeCombineXYZ", 200, -500)
comb.inputs["X"].default_value = 1.0
comb.inputs["Y"].default_value = 1.0
links.new(mul2.outputs["Value"], comb.inputs["Z"])

# ── Scale Instances ───────────────────────────────────────────────────────────
si = N("GeometryNodeScaleInstances", 400, 0)
# Local Space = True: scale propagates along the instance's own axes.
# False would scale world-Z, shearing any cone tilted away from vertical.
si.inputs["Local Space"].default_value = True
# Center = (0,0,0) LOCAL = base of cone. Growth radiates outward from contact point.
si.inputs["Center"].default_value      = (0.0, 0.0, 0.0)
links.new(iop.outputs["Instances"], si.inputs["Instances"])
links.new(comb.outputs["Vector"],   si.inputs["Scale"])

# Realise before output: downstream nodes and GLB export expect realised mesh.
ri = N("GeometryNodeRealizeInstances", 600, 0)
links.new(si.outputs["Instances"], ri.inputs["Geometry"])
links.new(ri.outputs["Geometry"],  go.inputs["Geometry"])

# ── Material ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("SpineGrowth_Mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
_out  = nt.nodes.new("ShaderNodeOutputMaterial")
_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
_bsdf.inputs["Roughness"].default_value = 0.82
_bsdf.inputs["Metallic"].default_value  = 0.0
# World-position Z → colour ramp: equator = teal, poles = amber.
# No UV needed — world-space procedural maps cleanly onto any geometry.
_geo = nt.nodes.new("ShaderNodeNewGeometry")
_sep = nt.nodes.new("ShaderNodeSeparateXYZ")
_abs = nt.nodes.new("ShaderNodeMath"); _abs.operation = "ABSOLUTE"
_cr  = nt.nodes.new("ShaderNodeValToRGB")
_cr.color_ramp.elements[0].color = (0.06, 0.62, 0.78, 1.0)  # teal (equator)
_cr.color_ramp.elements[1].color = (0.92, 0.55, 0.08, 1.0)  # amber (poles)
nt.links.new(_geo.outputs["Position"], _sep.inputs["Vector"])
nt.links.new(_sep.outputs["Z"],        _abs.inputs[0])
nt.links.new(_abs.outputs["Value"],    _cr.inputs["Fac"])
nt.links.new(_cr.outputs["Color"],     _bsdf.inputs["Base Color"])
nt.links.new(_bsdf.outputs["BSDF"],    _out.inputs["Surface"])
sphere.data.materials.append(mat)

# ── Camera and world ──────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -3.6, 1.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(75), 0, 0)
bpy.context.scene.camera = cam

world = bpy.context.scene.world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
bg.inputs["Strength"].default_value = 0.5

# ── Save and export ───────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

# Export at frame 30 (mid-growth for variety) so the GLB shows interesting variation.
bpy.context.scene.frame_set(30)
bpy.ops.object.select_all(action="DESELECT")
sphere.select_set(True)
bpy.ops.export_scene.gltf(
    filepath        = bpy.path.abspath(GLB_OUT),
    export_format   = "GLB",
    use_selection   = True,
    export_apply    = True,   # realise GN + Scale Instances before export
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)
print("✓ spine_growth.blend + spine_growth.glb written")
