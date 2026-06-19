"""
GN Store Named Attribute → Shader Attribute Data Bridge
Blender 5.1 | CC0 | Holoflow Studio

Store Named Attribute is the mechanism for writing per-domain computed data into
the geometry's attribute data block under a *user-chosen string name*.  Once
stored, that name is accessible by any downstream consumer that is not the GN
tree itself: the shader editor's Attribute node, Python's mesh.attributes dict,
and glTF export's _attributeName extras.

Compare with Capture Attribute (same GN tree only, no user-visible name) — the
distinction is scope.  Store Named Attribute is the cross-system bridge.

This blueprint builds a sci-fi hull panel whose emissive edge glow is driven
entirely by a GN-computed per-vertex float called "edge_heat".  No texture
painting, no UV bake — the material reads it live from the geometry data.
"""

import bpy
import bmesh
import math

# ── Named constants ────────────────────────────────────────────────────────────
ATTR_NAME     = "edge_heat"    # must match Attribute node Name string in material
PANEL_SIZE    = 2.0            # world-unit side length of the hull panel (metres)
PANEL_DIVS    = 5              # vertex subdivisions per axis (higher = smoother gradient)
GLOW_COLOUR   = (0.05, 0.90, 1.00, 1.0)   # cyan plasma
BASE_COLOUR   = (0.15, 0.18, 0.22, 1.0)   # dark gunmetal
EMIT_STR      = 3.2            # HDR emission strength at full edge_heat = 1.0
SLUG          = "hull_edge_heat"

# ── 1. Clean scene ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = SLUG
scene.render.engine = "CYCLES"
scene.render.film_transparent = True

# Camera: looking slightly down at the panel at an oblique angle
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location       = (0.0, -3.5, 2.4)
cam_obj.rotation_euler = (math.radians(58), 0.0, 0.0)

# Area light positioned top-left to give the panel some depth
area_data = bpy.data.lights.new("key", "AREA")
area_data.energy = 400
area_data.size   = 2.0
area_obj  = bpy.data.objects.new("key", area_data)
scene.collection.objects.link(area_obj)
area_obj.location       = (-1.5, -1.0, 3.0)
area_obj.rotation_euler = (math.radians(45), 0.0, math.radians(-30))

# ── 2. Hull panel mesh ─────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_grid_add(
    x_subdivisions=PANEL_DIVS,
    y_subdivisions=PANEL_DIVS,
    size=PANEL_SIZE,
)
panel      = bpy.context.active_object
panel.name = SLUG

# Bevel the panel's outer rim to give it a slight raised border — this makes
# the edge_heat gradient visually pop because the bevelled strip sits proud of
# the face surface.  We do this BEFORE the GN modifier so the modifier sees the
# final vertex layout.
bpy.ops.object.mode_set(mode="EDIT")
bm = bmesh.from_edit_mesh(panel.data)
bm.edges.ensure_lookup_table()
# Select only the perimeter edges — these are the boundary edges
boundary_edges = [e for e in bm.edges if e.is_boundary]
for e in bm.edges:
    e.select = False
for e in boundary_edges:
    e.select = True
bmesh.ops.bevel(
    bm,
    geom=boundary_edges,
    offset=0.06,
    offset_type="OFFSET",
    segments=2,
    profile=0.5,
    affect="EDGES",
)
bmesh.update_edit_mesh(panel.data)
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.object.shade_smooth()

# ── 3. Geometry Nodes modifier ─────────────────────────────────────────────────
# The tree computes a "Chebyshev distance from panel centre" normalised to
# 0 (centre) → 1 (perimeter).  WHY Chebyshev?  For a square panel it is
# max(|x|, |y|) / half_size — this gives 1.0 along all four edges uniformly,
# including midpoints, unlike Euclidean distance which gives 1.0 only at corners.
# The result is stored as ATTR_NAME with domain=POINT so that the shader can
# read a smooth per-vertex gradient (which rasterises as a smooth interpolated
# gradient across faces — the key visual payoff).

gn_mod  = panel.modifiers.new("EdgeHeatBridge", "NODES")
tree    = bpy.data.node_groups.new("edge_heat_bridge", "GeometryNodeTree")
gn_mod.node_group = tree

# ── 3a. Group interface (Blender 5.x NodeTreeInterface API) ───────────────────
iface   = tree.interface
iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

nodes = tree.nodes
links = tree.links

def gn(bl_idname, x, y):
    n = nodes.new(bl_idname)
    n.location = (x, y)
    return n

n_in  = gn("NodeGroupInput",  -800, 0)
n_out = gn("NodeGroupOutput",  600, 0)

# ── 3b. Read vertex world position ────────────────────────────────────────────
# WHY Position not UV: positions are always available; UV requires an unwrap
# first and maps differently to the panel shape.  Position is authoritative.
n_pos = gn("GeometryNodeInputPosition", -600, 100)

# ── 3c. Separate XYZ — we need X and Y components for Chebyshev distance ──────
n_xyz = gn("ShaderNodeSeparateXYZ", -400, 100)
links.new(n_pos.outputs["Position"], n_xyz.inputs["Vector"])

# ── 3d. abs(X) and abs(Y) ─────────────────────────────────────────────────────
# WHY two separate Math nodes rather than a Vector Math ABSOLUTE: we need
# scalar values individually so we can feed them into the subsequent MAX node.
n_ax = gn("ShaderNodeMath", -200, 200)
n_ax.operation = "ABSOLUTE"
links.new(n_xyz.outputs["X"], n_ax.inputs[0])

n_ay = gn("ShaderNodeMath", -200, 0)
n_ay.operation = "ABSOLUTE"
links.new(n_xyz.outputs["Y"], n_ay.inputs[0])

# ── 3e. max(|X|, |Y|) — Chebyshev distance from panel centre ─────────────────
n_max = gn("ShaderNodeMath", 0, 100)
n_max.operation = "MAXIMUM"
links.new(n_ax.outputs["Value"], n_max.inputs[0])
links.new(n_ay.outputs["Value"], n_max.inputs[1])

# ── 3f. Normalise to 0→1 by dividing by panel half-size ─────────────────────
# Panel half-size = PANEL_SIZE / 2 = 1.0.  The GN constant is baked in here.
# WHY not a socket: exposing as a UI socket adds friction for no gain; the
# panel geometry doesn't change size in this pipeline.  If you want to drive
# multiple panel sizes, promote PANEL_SIZE to a NodeSocketFloat and divide by
# it from group input instead.
n_div = gn("ShaderNodeMath", 200, 100)
n_div.operation = "DIVIDE"
n_div.inputs[1].default_value = PANEL_SIZE / 2.0
links.new(n_max.outputs["Value"], n_div.inputs[0])

# ── 3g. Clamp to 0→1 (bevel vertices can sit at coords > half_size) ──────────
n_clamp = gn("ShaderNodeClamp", 400, 100)
n_clamp.clamp_type = "MINMAX"
n_clamp.inputs["Min"].default_value = 0.0
n_clamp.inputs["Max"].default_value = 1.0
links.new(n_div.outputs["Value"], n_clamp.inputs["Value"])

# ── 3h. STORE NAMED ATTRIBUTE — the core of this tutorial ────────────────────
# domain=POINT means the float is stored per-vertex.  The shader's Attribute
# node will interpolate these vertex values smoothly across faces via the
# GPU rasteriser — exactly what we want for a gradient glow.
#
# WHY POINT not FACE: FACE domain stores one value per polygon, evaluated at
# face centres.  Rasterisation clips at face boundaries giving a flat stepped
# look.  POINT domain interpolates per-vertex values with the same weights used
# for vertex normals, producing a smooth gradient.
#
# WHY Store Named Attribute not Capture Attribute: Capture Attribute evaluates
# the field lazily and makes the result available ONLY within this GN tree.
# Store Named Attribute writes the concrete float value into the mesh's data
# block under the name ATTR_NAME.  Any system that can read mesh attributes by
# name — the shader editor, Python (mesh.attributes["edge_heat"]), glTF export
# (_edge_heat extras) — can consume it.
n_store = gn("GeometryNodeStoreNamedAttribute", 400, -100)
n_store.domain    = "POINT"
n_store.data_type = "FLOAT"
n_store.inputs["Name"].default_value = ATTR_NAME

links.new(n_in.outputs["Geometry"],  n_store.inputs["Geometry"])
links.new(n_clamp.outputs["Result"], n_store.inputs["Value"])
links.new(n_store.outputs["Geometry"], n_out.inputs["Geometry"])

# ── 4. Material: read edge_heat via Attribute node ────────────────────────────
# The Attribute node (shader editor) reads any named attribute from the mesh
# data by string lookup.  For a FLOAT attribute, the usable output is "Fac".
# "Color" would give (value, value, value, 1) and "Vector" gives (value, 0, 0).
# WHY Attribute node not Vertex Color node: Vertex Color only reads paint-layer
# data (stored as BYTE_COLOR or FLOAT_COLOR).  Attribute node reads any data
# type by name — FLOAT, VECTOR, INT, etc.  Post-Blender 4.0 this is the
# canonical way to bridge GN float attributes to the shader.

mat     = bpy.data.materials.new("hull_edge_heat_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

def mn(bl_idname, x, y):
    n = nt.nodes.new(bl_idname)
    n.location = (x, y)
    return n

def ml(a, ao, b, bi):
    nt.links.new(a.outputs[ao], b.inputs[bi])

# Attribute node ──────────────────────────────────────────────────────────────
n_attr = mn("ShaderNodeAttribute", -700, 100)
n_attr.attribute_type = "GEOMETRY"
n_attr.attribute_name = ATTR_NAME     # must match ATTR_NAME exactly

# ColorRamp for emissive colour: 0 = black, 1 = cyan
n_ramp = mn("ShaderNodeValToRGB", -450, 150)
n_ramp.color_ramp.interpolation = "EASE"
n_ramp.color_ramp.elements[0].position = 0.35  # glow only near the perimeter
n_ramp.color_ramp.elements[0].color    = (0.0, 0.0, 0.0, 1.0)
n_ramp.color_ramp.elements[1].position = 1.0
n_ramp.color_ramp.elements[1].color    = GLOW_COLOUR

# Multiply by EMIT_STR for HDR intensity ─────────────────────────────────────
n_mul = mn("ShaderNodeMath", -150, 250)
n_mul.operation = "MULTIPLY"
n_mul.inputs[1].default_value = EMIT_STR

# Base colour ─────────────────────────────────────────────────────────────────
n_base_col = mn("ShaderNodeRGB", -700, -150)
n_base_col.outputs[0].default_value = BASE_COLOUR

# Mix: lerp base colour toward glow colour at the edges (for tinted highlight)
n_mix = mn("ShaderNodeMixRGB", -150, 0)
n_mix.blend_type = "MIX"
n_mix.inputs["Fac"].default_value = 0.0  # driven by edge_heat below

# Principled BSDF ──────────────────────────────────────────────────────────────
n_bsdf = mn("ShaderNodeBsdfPrincipled", 150, 0)
n_bsdf.inputs["Metallic"].default_value  = 0.90
n_bsdf.inputs["Roughness"].default_value = 0.25

n_out_mat = mn("ShaderNodeOutputMaterial", 450, 0)

# Wire material nodes
ml(n_attr,    "Fac",   n_ramp,    "Fac")
ml(n_ramp,    "Color", n_mul,     0)
ml(n_mul,     "Value", n_bsdf,    "Emission Strength")
ml(n_ramp,    "Color", n_bsdf,    "Emission Color")
ml(n_attr,    "Fac",   n_mix,     "Fac")
ml(n_base_col,"Color", n_mix,     "Color1")
ml(n_ramp,    "Color", n_mix,     "Color2")
ml(n_mix,     "Color", n_bsdf,    "Base Color")
ml(n_bsdf,    "BSDF",  n_out_mat, "Surface")

panel.data.materials.append(mat)

# ── 5. Verify the attribute exists on the evaluated mesh ─────────────────────
# After updating the dependency graph the modifier has run and the attribute
# should be present.  This is a good headless CI check.
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
panel_eval = panel.evaluated_get(depsgraph)
attr_names = [a.name for a in panel_eval.data.attributes]
assert ATTR_NAME in attr_names, (
    f"Attribute '{ATTR_NAME}' not found in mesh after GN evaluation. "
    f"Present attributes: {attr_names}"
)
print(f"✓  Attribute '{ATTR_NAME}' confirmed present: domain={panel_eval.data.attributes[ATTR_NAME].domain}, "
      f"type={panel_eval.data.attributes[ATTR_NAME].data_type}")

# ── 6. GLB export ─────────────────────────────────────────────────────────────
# export_attributes=True emits custom attributes as extras in the glTF JSON.
# THREE.js r155+ reads these as geometry.attributes['_edge_heat'] — an
# AccessorElement with itemSize=1, type FLOAT.  You can drive a custom shader
# uniform or clone the material with the attribute as a vertex attribute.
#
# Caveat: the KHR_mesh_quantization extension (Draco) encodes vertex data
# before the attribute extras are written, so custom float attributes survive
# Draco compression without quantisation artefacts.
import os
out_dir = bpy.path.abspath("//")
bpy.ops.export_scene.gltf(
    filepath=os.path.join(out_dir, SLUG + ".glb"),
    export_format="GLB",
    use_selection=False,
    export_attributes=True,
    export_materials="EXPORT",
    export_apply=True,
    export_image_format="WEBP",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

# ── 7. Save .blend ────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(
    filepath=os.path.join(out_dir, SLUG + ".blend")
)
print(f"✓  {SLUG}.blend + {SLUG}.glb saved.  Open the .blend to see the live edge glow in EEVEE viewport.")
