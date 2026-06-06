"""
GN UV Unwrap + Pack UV Islands — Crystal Geode with Procedural UV
Blender 5.1  ·  GeometryNodeUVUnwrap + GeometryNodePackUVIslands

Generates UV coordinates inside the GN modifier stack (after subdivision and
noise displacement) so the UV survives any procedural edit without
re-unwrapping.  EdgeAngle > threshold auto-marks seam edges.  UVUnwrap
(ANGLE_BASED) unfolds each island.  PackUVIslands fills the [0,1] square.
StoreNamedAttribute domain=CORNER data_type=FLOAT2 name="UVMap" → TEXCOORD_0
in GLB via glTF-Blender-IO.

Sources:
· UV Unwrap Node  CC-BY-SA 4.0  Blender Documentation Team
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/uv/uv_unwrap.html
· glTF-Blender-IO  Apache-2.0  Khronos Group
  https://github.com/KhronosGroup/glTF-Blender-IO
· glTF 2.0 Spec §Meshes  Apache-2.0  Khronos Group
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes-overview
"""

import bpy
import math

# ── CONSTANTS ───────────────────────────────────────────────────────────────
MESH_NAME       = "crystal_geode"
OBJ_NAME        = "crystal_geode"
BLEND_PATH      = "//crystal_geode.blend"
GLB_PATH        = "//crystal_geode.glb"
UV_ATTR_NAME    = "UVMap"      # must be exactly "UVMap" for TEXCOORD_0 export
MAT_NAME        = "geode_crystal"

SUBDIV_LEVEL    = 3            # cube 8 → 512 faces; level 4 = 2048 (slower)
NOISE_SCALE     = 2.8          # world-space frequency; lower = larger patches
NOISE_DETAIL    = 4.0          # octave count; 4 gives crystal-cluster texture
NOISE_ROUGHNESS = 0.68         # persistence; high = spiky, craggy peaks
NOISE_DISTORT   = 0.28         # domain warp for non-periodic look
NOISE_AMP       = 0.52         # displacement amplitude in metres

# 30°–50° stable range. Below 30° → many tiny islands. Above 70° → distortion.
SEAM_ANGLE_DEG  = 42.0
UV_MARGIN       = 0.003        # per-corner margin (prevents texel bleed)
ISLAND_MARGIN   = 0.005        # inter-island gap after packing

# ── SCENE RESET ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom = True

# ── BASE MESH ────────────────────────────────────────────────────────────────
# Cube: six large faces produce legible seam islands after noise displacement.
bpy.ops.mesh.primitive_cube_add(size=1.8, location=(0, 0, 0))
obj = bpy.context.active_object
obj.name = OBJ_NAME
me  = obj.data
me.name = MESH_NAME

# ── MATERIAL ─────────────────────────────────────────────────────────────────
# Reads "UVMap" via ShaderNodeUVMap → SeparateXYZ → U component → ColorRamp.
# This is how any UV-driven texture would be wired.  Replace ColorRamp with
# ShaderNodeTexImage for a real PNG/WebP texture.
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

uv_node = nt.nodes.new("ShaderNodeUVMap")
uv_node.uv_map = UV_ATTR_NAME
uv_node.location = (-700, 200)

sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
sep_xyz.location = (-500, 200)

ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.location = (-280, 200)
ramp.color_ramp.interpolation = 'B_SPLINE'
ramp.color_ramp.elements[0].color    = (0.04, 0.02, 0.20, 1.0)   # deep indigo
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[1].color    = (0.58, 0.92, 1.00, 1.0)   # ice blue
ramp.color_ramp.elements[1].position = 1.0
mid = ramp.color_ramp.elements.new(0.48)
mid.color = (0.22, 0.65, 0.48, 1.0)                               # aqua teal

bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (20, 200)
bsdf.inputs["Roughness"].default_value            = 0.05
bsdf.inputs["Specular IOR Level"].default_value   = 1.00
# IOR level 1.0 = full specular; crystal-like glints on flat faces

out = nt.nodes.new("ShaderNodeOutputMaterial")
out.location = (320, 200)

nt.links.new(uv_node.outputs["UV"],   sep_xyz.inputs["Vector"])
nt.links.new(sep_xyz.outputs["X"],    ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"],   bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],    out.inputs["Surface"])

obj.data.materials.append(mat)

# ── GEOMETRY NODES MODIFIER ──────────────────────────────────────────────────
mod = obj.modifiers.new("GN_UV_Unwrap", "NODES")
ng  = bpy.data.node_groups.new("GN_UV_Unwrap", "GeometryNodeTree")
mod.node_group = ng

# ── INTERFACE SOCKETS ────────────────────────────────────────────────────────
ng.interface.new_socket("Geometry",         in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry",         in_out="OUTPUT", socket_type="NodeSocketGeometry")

amp_s  = ng.interface.new_socket("Displacement",       in_out="INPUT", socket_type="NodeSocketFloat")
amp_s.default_value = NOISE_AMP
amp_s.min_value = 0.0
amp_s.max_value = 2.0

seam_s = ng.interface.new_socket("Seam Angle Degrees", in_out="INPUT", socket_type="NodeSocketFloat")
seam_s.default_value = SEAM_ANGLE_DEG
seam_s.min_value = 0.0
seam_s.max_value = 180.0

# ── GN NODES ─────────────────────────────────────────────────────────────────
gi  = ng.nodes.new("NodeGroupInput")
go  = ng.nodes.new("NodeGroupOutput")
gi.location = (-1600, 0)
go.location = ( 1600, 0)

# 1. Subdivide — topology must exist before EdgeAngle can measure anything.
#    SubdivideMesh is NOT Subdivision Surface modifier: it does a simple
#    midpoint split, no smoothing, which is correct for flat-shaded crystals.
subdiv = ng.nodes.new("GeometryNodeSubdivideMesh")
subdiv.location = (-1300, 100)
subdiv.inputs["Level"].default_value = SUBDIV_LEVEL

# 2. Noise displacement — 3D, evaluated at world-space vertex position.
pos   = ng.nodes.new("GeometryNodeInputPosition")
pos.location = (-1300, -200)

noise = ng.nodes.new("ShaderNodeTexNoise")
noise.noise_dimensions  = '3D'
noise.location          = (-1050, -200)
noise.inputs["Scale"].default_value      = NOISE_SCALE
noise.inputs["Detail"].default_value     = NOISE_DETAIL
noise.inputs["Roughness"].default_value  = NOISE_ROUGHNESS
noise.inputs["Distortion"].default_value = NOISE_DISTORT

# Centre noise Fac [0,1] → [-1,+1] so displacement is symmetric.
sub05 = ng.nodes.new("ShaderNodeMath")
sub05.operation = 'SUBTRACT'
sub05.location  = (-800, -200)
sub05.inputs[1].default_value = 0.5

# Scale by user Displacement amplitude socket.
scale_fac = ng.nodes.new("ShaderNodeMath")
scale_fac.operation = 'MULTIPLY'
scale_fac.location  = (-600, -200)

# Multiply scalar displacement by surface normal → directional offset.
nrm = ng.nodes.new("GeometryNodeInputNormal")
nrm.location = (-600, -400)

vec_scale = ng.nodes.new("ShaderNodeVectorMath")
vec_scale.operation = 'SCALE'
vec_scale.location  = (-350, -300)
# VectorMath SCALE exposes a named "Scale" socket (Blender 4.0+).

set_pos = ng.nodes.new("GeometryNodeSetPosition")
set_pos.location = (-100, 100)

# 3. Flat shading — omitting this leaves smooth-shaded output hiding crystal facets.
shade_flat = ng.nodes.new("GeometryNodeSetShadeSmooth")
shade_flat.domain = 'FACE'
shade_flat.location = (150, 100)
shade_flat.inputs["Shade Smooth"].default_value = False

# 4. Edge angle → seam BOOLEAN.  Unsigned Angle = dihedral between adjacent
#    face normals; 0 = coplanar, π = back-to-back.  Concave vs convex is
#    irrelevant for seam detection, so Unsigned is always correct here.
edge_angle = ng.nodes.new("GeometryNodeEdgeAngle")
edge_angle.location = (400, -100)

# Convert user "Seam Angle Degrees" socket → radians for comparison.
deg2rad = ng.nodes.new("ShaderNodeMath")
deg2rad.operation = 'RADIANS'
deg2rad.location  = (200, -300)

gt_seam = ng.nodes.new("ShaderNodeMath")
gt_seam.operation = 'GREATER_THAN'
gt_seam.location  = (600, -100)

# 5. UV Unwrap — FIELD NODE, no Geometry socket.  Evaluates in CORNER domain
#    from the mesh context of StoreNamedAttribute (the downstream consumer).
#    ANGLE_BASED (conformal) = angular distortion minimised → organic surfaces.
#    MINIMUM_STRETCH = area distortion minimised → flat/architectural surfaces.
uv_unwrap = ng.nodes.new("GeometryNodeUVUnwrap")
uv_unwrap.method = 'ANGLE_BASED'
uv_unwrap.location = (850, 100)
uv_unwrap.inputs["Margin"].default_value = UV_MARGIN

# 6. Pack UV Islands — FIELD NODE.  Without packing, islands scatter outside [0,1].
pack_uv = ng.nodes.new("GeometryNodePackUVIslands")
pack_uv.location = (1100, 100)
pack_uv.inputs["Margin"].default_value  = ISLAND_MARGIN
pack_uv.inputs["Rotate"].default_value  = True

# 7. Store as CORNER FLOAT2 "UVMap".
#    CORNER: one UV per face corner → vertices can have different UVs per face.
#    FLOAT2: [U, V] two-component.  NOT FLOAT_VECTOR (XYZ, three-component).
#    "UVMap": glTF-Blender-IO maps this name to TEXCOORD_0 in the GLB.
store_uv = ng.nodes.new("GeometryNodeStoreNamedAttribute")
store_uv.domain    = 'CORNER'
store_uv.data_type = 'FLOAT2'
store_uv.location  = (1350, 100)
store_uv.inputs["Name"].default_value = UV_ATTR_NAME

# ── LINKS ────────────────────────────────────────────────────────────────────
lk = ng.links.new

# Geometry spine
lk(gi.outputs["Geometry"],     subdiv.inputs["Mesh"])
lk(subdiv.outputs["Mesh"],     set_pos.inputs["Geometry"])
lk(set_pos.outputs["Geometry"],shade_flat.inputs["Geometry"])
lk(shade_flat.outputs["Geometry"], store_uv.inputs["Geometry"])
lk(store_uv.outputs["Geometry"],   go.inputs["Geometry"])

# Noise displacement
lk(pos.outputs["Position"],    noise.inputs["Vector"])
lk(noise.outputs["Fac"],       sub05.inputs[0])
lk(sub05.outputs["Value"],     scale_fac.inputs[0])
lk(gi.outputs["Displacement"], scale_fac.inputs[1])
lk(nrm.outputs["Normal"],      vec_scale.inputs[0])
lk(scale_fac.outputs["Value"], vec_scale.inputs["Scale"])
lk(vec_scale.outputs["Vector"],set_pos.inputs["Offset"])

# Seam: angle → radians comparison → BOOLEAN
lk(gi.outputs["Seam Angle Degrees"], deg2rad.inputs[0])
lk(edge_angle.outputs["Unsigned Angle"], gt_seam.inputs[0])
lk(deg2rad.outputs["Value"],    gt_seam.inputs[1])
lk(gt_seam.outputs["Value"],   uv_unwrap.inputs["Seam"])

# UV field chain
lk(uv_unwrap.outputs["UV"],    pack_uv.inputs["UV"])
lk(pack_uv.outputs["UV"],      store_uv.inputs["Value"])

# ── CAMERA + LIGHTING ────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_obj  = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (3.2, -3.2, 2.4)
cam_obj.rotation_euler = (math.radians(60), 0, math.radians(45))
cam_data.lens = 50

light_data = bpy.data.lights.new("Key", type='SUN')
light_data.energy = 4.5
light_data.color  = (1.0, 0.97, 0.92)
light_obj = bpy.data.objects.new("Key", light_data)
scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(40), math.radians(20), 0)

fill_data = bpy.data.lights.new("Fill", type='SUN')
fill_data.energy = 1.2
fill_data.color  = (0.60, 0.80, 1.00)
fill_obj = bpy.data.objects.new("Fill", fill_data)
scene.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(-20), math.radians(160), 0)

# ── SAVE BLEND ───────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))

# ── EXPORT GLB ───────────────────────────────────────────────────────────────
# export_attributes=True: Named Attributes (including "UVMap") are exported.
# export_apply=True: GN modifier is applied before export — the UV attribute
# is baked into TEXCOORD_0.  Without export_apply the modifier is skipped
# and no UV appears in the GLB.
bpy.ops.export_scene.gltf(
    filepath                          = bpy.path.abspath(GLB_PATH),
    use_selection                     = False,
    export_format                     = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level = 6,
    export_image_format               = 'WEBP',
    export_attributes                 = True,
    export_apply                      = True,
)

print("Done — crystal_geode.blend + crystal_geode.glb written.")
print(f"UV attribute '{UV_ATTR_NAME}' in CORNER FLOAT2 → TEXCOORD_0 in GLB.")
