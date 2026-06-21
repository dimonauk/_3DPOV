"""
GN Corners of Face + Vertex of Corner — Per-Corner Gradient on a Faceted Gem
Blender 5.1  ·  Holoflow Studio blueprint
=============================================================================
Topology traversal path (all-triangle ICO sphere):
  FaceOfCorner → CornersOfFace(sort 0/1/2) → VertexOfCorner
  → EvaluateAtIndex(POINT, Position)
  → manual triangle centroid
  → corner-to-centroid distance
  → AttributeStatistic(CORNER).Max → MapRange → "corner_grad" (CORNER float)

This teaches ALL four mesh-topology nodes introduced in Blender 4.0:
  GeometryNodeFaceOfCorner, GeometryNodeCornersOfFace,
  GeometryNodeVertexOfCorner, GeometryNodeEvaluateAtIndex

WHY manual centroid instead of EvaluateAtIndex(FACE, Position)?
  EvaluateAtIndex(FACE) gives the same answer and is shorter.
  The explicit traversal path here serves as an instructional walkthrough
  of the full corner-topology API — students can then simplify as desired.
"""

import bpy, math, os

# ── Constants ────────────────────────────────────────────────────────────────
BLEND_DIR        = os.path.dirname(os.path.abspath(__file__))
OUTPUT_GLB       = os.path.join(BLEND_DIR, "faceted_gem_gradient.glb")
GEM_SUBDIVISIONS = 2        # ICO L2 → 80 all-triangle faces, clean faceted look
GEM_RADIUS       = 1.0      # metres; holoflow export uses Y-up

# ── 1. Scene reset ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "FacetedGemGradient"

# ── 2. ICO sphere (all-triangle mesh → exactly 3 corners per face) ────────────
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=GEM_SUBDIVISIONS, radius=GEM_RADIUS, location=(0, 0, 0)
)
gem = bpy.context.active_object
gem.name = "faceted_gem"
bpy.ops.object.shade_flat()   # flat normals = faceted facets, no vertex smoothing

# ── 3. Build Geometry Nodes tree ──────────────────────────────────────────────
ng = bpy.data.node_groups.new("GemCornerGradient", "GeometryNodeTree")
# NodeTreeInterface API (Blender 4.0+, replaces deprecated ng.inputs/outputs)
ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

nodes = ng.nodes
links = ng.links

def N(bl_id, x, y, label=""):
    n = nodes.new(bl_id)
    n.location = (x, y)
    if label:
        n.label = label
    return n

# Group I/O
gIn  = N("NodeGroupInput",  -1500,    0)
gOut = N("NodeGroupOutput",  1200,    0)

# Corner index (Index node evaluates to the per-element index in field context)
idx = N("GeometryNodeInputIndex", -1300, 200, "Corner Index (field)")
# Corner vertex position (Position in CORNER domain = the corner's vertex location)
pos_corner = N("GeometryNodeInputPosition", -1300, -350, "Corner Vertex Pos")

# ── FaceOfCorner: which face owns THIS corner? ──────────────────────────────
foc = N("GeometryNodeFaceOfCorner", -1100, 200, "Face of Corner")
links.new(idx.outputs["Index"], foc.inputs["Corner Index"])

# ── CornersOfFace with Sort Index 0, 1, 2 ──────────────────────────────────
# Returns the sort_idx-th corner index for the owning face (sorted ascending)
# ICO sphere is all triangles so sort indices 0..2 cover every corner on each face
def make_cof(sort_val, y):
    n = N("GeometryNodeCornersOfFace", -900, y, f"CornersOfFace sort={sort_val}")
    links.new(foc.outputs["Face Index"], n.inputs["Face Index"])
    n.inputs["Sort Index"].default_value = sort_val
    return n

cof0 = make_cof(0,  200)   # first corner of this corner's face
cof1 = make_cof(1,    0)   # second corner
cof2 = make_cof(2, -200)   # third corner

# ── VertexOfCorner: corner index → vertex index ─────────────────────────────
def make_voc(cof_node, y):
    n = N("GeometryNodeVertexOfCorner", -700, y, "Vertex of Corner")
    links.new(cof_node.outputs["Corner Index"], n.inputs["Corner Index"])
    return n

voc0 = make_voc(cof0,  200)
voc1 = make_voc(cof1,    0)
voc2 = make_voc(cof2, -200)

# ── EvaluateAtIndex(POINT, Position) → explicit vertex world-space positions ─
# Each call: given a vertex index, return Position at that vertex
def make_eval_pos(voc_node, x_offset, y):
    pos_src = N("GeometryNodeInputPosition", x_offset - 120, y - 70)
    ev = N("GeometryNodeEvaluateAtIndex", x_offset, y, "Vertex Pos")
    ev.data_type = "FLOAT_VECTOR"
    ev.domain    = "POINT"   # look up in VERTEX (POINT) domain
    links.new(voc_node.outputs["Vertex Index"], ev.inputs["Index"])
    links.new(pos_src.outputs["Position"],      ev.inputs["Value"])
    return ev

ep0 = make_eval_pos(voc0, -500,  200)
ep1 = make_eval_pos(voc1, -500,    0)
ep2 = make_eval_pos(voc2, -500, -200)

# ── Triangle centroid: (p0 + p1 + p2) / 3 ───────────────────────────────────
add01 = N("ShaderNodeVectorMath", -250,  100, "p0 + p1")
add01.operation = "ADD"
links.new(ep0.outputs["Value"], add01.inputs[0])
links.new(ep1.outputs["Value"], add01.inputs[1])

add012 = N("ShaderNodeVectorMath", -250, -100, "sum + p2")
add012.operation = "ADD"
links.new(add01.outputs["Vector"], add012.inputs[0])
links.new(ep2.outputs["Value"],    add012.inputs[1])

centroid = N("ShaderNodeVectorMath", -50, 0, "÷3 → centroid")
centroid.operation = "SCALE"
centroid.inputs["Scale"].default_value = 1.0 / 3.0   # average of 3 vertices
links.new(add012.outputs["Vector"], centroid.inputs[0])

# ── Corner-to-centroid displacement and distance ─────────────────────────────
radial = N("ShaderNodeVectorMath", 150, 100, "corner − centroid")
radial.operation = "SUBTRACT"
links.new(pos_corner.outputs["Position"], radial.inputs[0])
links.new(centroid.outputs["Vector"],     radial.inputs[1])

dist_node = N("ShaderNodeVectorMath", 350, 100, "radial dist")
dist_node.operation = "LENGTH"
links.new(radial.outputs["Vector"], dist_node.inputs[0])

# ── AttributeStatistic over ALL corners → Max for normalisation ──────────────
# Pass the same distance field expression as the Attribute socket;
# GN evaluates the field twice (once per element, once for statistics) — no cycle.
attr_stat = N("GeometryNodeAttributeStatistic", 350, -200, "Max(dist) over corners")
attr_stat.data_type = "FLOAT"
attr_stat.domain    = "CORNER"
links.new(gIn.outputs["Geometry"],      attr_stat.inputs["Geometry"])
links.new(dist_node.outputs["Value"],   attr_stat.inputs[2])   # socket 2 = "Attribute"

# ── MapRange 0..Max → 0..1 ───────────────────────────────────────────────────
mr = N("ShaderNodeMapRange", 550, 0, "Normalise → corner_grad")
mr.clamp = True
mr.inputs["From Min"].default_value = 0.0
mr.inputs["To Min"].default_value   = 0.0
mr.inputs["To Max"].default_value   = 1.0
links.new(dist_node.outputs["Value"],   mr.inputs["Value"])
links.new(attr_stat.outputs["Max"],     mr.inputs["From Max"])

# ── Store as "corner_grad" float attribute in CORNER domain ─────────────────
store = N("GeometryNodeStoreNamedAttribute", 800, 0, "Store corner_grad")
store.data_type = "FLOAT"
store.domain    = "CORNER"
store.inputs["Name"].default_value = "corner_grad"
links.new(gIn.outputs["Geometry"],   store.inputs["Geometry"])
links.new(mr.outputs["Result"],      store.inputs["Value"])
links.new(store.outputs["Geometry"], gOut.inputs["Geometry"])

# ── 4. Attach GN modifier ────────────────────────────────────────────────────
mod = gem.modifiers.new("GemCornerGrad", "NODES")
mod.node_group = ng

# ── 5. Material: crystal with per-corner gradient read via Attribute node ────
mat = bpy.data.materials.new("GemCrystal")
mat.use_nodes = True
gem.data.materials.clear()
gem.data.materials.append(mat)

mn = mat.node_tree.nodes
ml = mat.node_tree.links
mn.clear()

out  = mn.new("ShaderNodeOutputMaterial"); out.location  = (600,  0)
bsdf = mn.new("ShaderNodeBsdfPrincipled"); bsdf.location = (300,  0)
ramp = mn.new("ShaderNodeValToRGB");       ramp.location = (  0, 150)
attr = mn.new("ShaderNodeAttribute");      attr.location = (-300, 150)

# Reads our corner-domain float attribute; Fac output is the scalar channel
attr.attribute_name = "corner_grad"
attr.attribute_type = "GEOMETRY"

# Gradient: face centre (0) = bright aqua-white; face edge (1) = deep indigo
ramp.color_ramp.interpolation = "LINEAR"
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color    = (0.85, 1.0, 1.0, 1.0)   # aqua-white
ramp.color_ramp.elements[1].position = 1.0
ramp.color_ramp.elements[1].color    = (0.05, 0.02, 0.28, 1.0)  # deep indigo

bsdf.inputs["Roughness"].default_value = 0.08
bsdf.inputs["Metallic"].default_value  = 0.0
try:
    bsdf.inputs["Transmission Weight"].default_value = 0.70  # 4.0+ socket name
except KeyError:
    pass

ml.new(attr.outputs["Fac"],       ramp.inputs["Fac"])      # float → color ramp
ml.new(ramp.outputs["Color"],     bsdf.inputs["Base Color"])
ml.new(bsdf.outputs["BSDF"],     out.inputs["Surface"])

# ── 6. Lighting + camera ─────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(4, -4, 8))
sun = bpy.context.active_object
sun.data.energy = 6.0
sun.data.angle  = 0.04   # tight beam → sharp facet shadows

bpy.ops.object.light_add(type="POINT", location=(-2, 3, 3))
fill = bpy.context.active_object
fill.data.energy = 60.0
fill.data.color  = (0.4, 0.8, 1.0)

bpy.ops.object.camera_add(location=(0, -4.5, 1.8))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(70), 0, 0)
scene.camera = cam

# ── 7. Render + export ───────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080

bpy.ops.object.select_all(action="DESELECT")
gem.select_set(True)
bpy.context.view_layer.objects.active = gem

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    use_selection=True,
    export_apply=True,                          # bake GN modifier to mesh
    export_materials="EXPORT",
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

print(f"[holoflow] corner-gradient gem exported → {OUTPUT_GLB}")
