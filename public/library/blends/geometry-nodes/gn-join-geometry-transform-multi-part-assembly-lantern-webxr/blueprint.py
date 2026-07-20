"""
GN Join Geometry + Transform Geometry — Faceted Lantern Assembly
Blender 5.1 · CC0 · Holoflow Studio

Join Geometry merges multiple geometry streams into a single mesh object.
Transform Geometry repositions an entire stream in node-space before the
join. Together these two nodes form the canonical GN pattern for multi-part
props: one modifier, one mesh object, one GLB node — no parenting, no
object constraints, no manual empties.

This blueprint assembles a three-part lantern inside a single GN modifier:
  Part 0 — Gem core   : IcoSphere(subdiv=1) → flat shade → material 0
  Part 1 — Wire cage  : IcoSphere(subdiv=1, r+4%) → Wireframe → material 1
  Part 2 — Hex base   : Cylinder(vertices=6) → flat shade → material 2

Each part lives in its own sub-graph, receives a TransformGeometry to
position it in world-space, then a SetMaterialIndex before entering a
single JoinGeometry node.

Outside sources:
  Blender Manual — Join Geometry Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/join_geometry.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Blender Manual — Transform Geometry Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/operations/transform_geometry.html
    CC-BY-SA 4.0 · Blender Documentation Team
"""

import bpy, os
import mathutils

# ── Parameters ─────────────────────────────────────────────────────────────────
GEM_RADIUS      = 0.22    # metres — faceted icosphere gem
CAGE_RADIUS     = 0.23    # slightly larger so wires sit outside gem faces
CAGE_THICKNESS  = 0.012   # edge-tube diameter
BASE_VERTICES   = 6       # hexagonal base
BASE_RADIUS     = 0.16    # base footprint radius
BASE_DEPTH      = 0.07    # base cap thickness
GEM_OFFSET_Z    = 0.04    # lift gem & cage clear of base top face
BASE_OFFSET_Z   = -0.23   # shift base down relative to gem centre
GLB_PATH        = "//hf_lantern.glb"

# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "hf_lantern_scene"

# ── Host mesh — GN ignores it; we build entirely from primitive nodes ──────────
mesh = bpy.data.meshes.new("hf_lantern")
obj  = bpy.data.objects.new("hf_lantern", mesh)
scene.collection.objects.link(obj)

# ── Materials (SetMaterialIndex reads from object's slot list by index) ────────
def make_mat(name, base_col, emission_col=None, emission_strength=0.0,
             roughness=0.4, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value       = (*base_col, 1.0)
    bsdf.inputs["Roughness"].default_value        = roughness
    bsdf.inputs["Metallic"].default_value         = metallic
    # Emission strength renamed in 5.x; check both socket names
    for em_name in ("Emission Strength", "Emission Color"):
        if em_name in bsdf.inputs and emission_col:
            bsdf.inputs[em_name].default_value = (*emission_col, 1.0) if "Color" in em_name else emission_strength
    if emission_col and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emission_col, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

mat_gem  = make_mat("Lantern_Gem",  (0.35, 0.65, 0.95),
                    emission_col=(0.5, 0.75, 1.0), emission_strength=1.4,
                    roughness=0.05, metallic=0.0)
mat_cage = make_mat("Lantern_Cage", (0.85, 0.80, 0.60),
                    roughness=0.25, metallic=0.85)
mat_base = make_mat("Lantern_Base", (0.72, 0.68, 0.52),
                    roughness=0.30, metallic=0.70)

for mat in (mat_gem, mat_cage, mat_base):
    obj.data.materials.append(mat)

# ── Geometry Nodes modifier ────────────────────────────────────────────────────
mod  = obj.modifiers.new("Lantern_GN", "NODES")
tree = bpy.data.node_groups.new("LanternAssembly_Tree", "GeometryNodeTree")
mod.node_group = tree

nodes = tree.nodes
links = tree.links

def N(type_id, x=0, y=0):
    n = nodes.new(type_id)
    n.location = (x, y)
    return n

# ── Group Input / Output ───────────────────────────────────────────────────────
grp_in  = N("NodeGroupInput",  -900, 0)
grp_out = N("NodeGroupOutput",  800, 0)

# Expose live parameters so the user can tweak in the modifier panel
s_gem = tree.interface.new_socket("Gem Radius",     in_out='INPUT',
                                  socket_type='NodeSocketFloat')
s_gem.default_value = GEM_RADIUS; s_gem.min_value = 0.05; s_gem.max_value = 1.0

s_cg  = tree.interface.new_socket("Cage Thickness", in_out='INPUT',
                                  socket_type='NodeSocketFloat')
s_cg.default_value = CAGE_THICKNESS; s_cg.min_value = 0.002; s_cg.max_value = 0.08

tree.interface.new_socket("Geometry", in_out='OUTPUT',
                          socket_type='NodeSocketGeometry')

mod["Input_1"] = GEM_RADIUS
mod["Input_2"] = CAGE_THICKNESS

# ── Helper: flat-shade a geometry stream ──────────────────────────────────────
def flat_shade(x, y, upstream_geo_socket):
    shade = N("GeometryNodeSetShadeSmooth", x, y)
    shade.domain = 'FACE'
    shade.inputs["Shade Smooth"].default_value = False
    links.new(upstream_geo_socket, shade.inputs["Geometry"])
    return shade.outputs["Geometry"]

# ── Helper: assign material index ─────────────────────────────────────────────
def set_mat(x, y, upstream_geo_socket, index):
    sm = N("GeometryNodeSetMaterialIndex", x, y)
    sm.inputs["Material Index"].default_value = index
    links.new(upstream_geo_socket, sm.inputs["Geometry"])
    return sm.outputs["Geometry"]

# ── Helper: translate geometry in node-space ──────────────────────────────────
def translate(x, y, upstream_geo_socket, translation):
    tf = N("GeometryNodeTransformGeometry", x, y)
    tf.inputs["Translation"].default_value = mathutils.Vector(translation)
    tf.inputs["Scale"].default_value       = mathutils.Vector((1, 1, 1))
    links.new(upstream_geo_socket, tf.inputs["Geometry"])
    return tf.outputs["Geometry"]

# ══════════════════════════════════════════════════════════════════════════════
# PART 0 — GEM CORE
# IcoSphere (subdiv 1) → flat shade → material slot 0 → translate up
# ══════════════════════════════════════════════════════════════════════════════
ico_gem = N("GeometryNodeMeshIcoSphere", -700, 200)
# Socket 0 = Radius, Socket 1 = Subdivisions
links.new(grp_in.outputs["Gem Radius"], ico_gem.inputs["Radius"])
ico_gem.inputs["Subdivisions"].default_value = 1

geo_gem = flat_shade(-500, 200, ico_gem.outputs["Mesh"])
geo_gem = set_mat(-300, 200, geo_gem, 0)
geo_gem = translate(-100, 200, geo_gem, (0.0, 0.0, GEM_OFFSET_Z))

# ══════════════════════════════════════════════════════════════════════════════
# PART 1 — WIRE CAGE
# IcoSphere (subdiv 1, slightly larger) → Wireframe → material slot 1 → translate up
# The cage sits at the same Y/Z offset as the gem, radius 4% larger so wires
# appear outside the gem faces rather than z-fighting through them.
# ══════════════════════════════════════════════════════════════════════════════
ico_cage = N("GeometryNodeMeshIcoSphere", -700, -80)
ico_cage.inputs["Radius"].default_value        = CAGE_RADIUS
ico_cage.inputs["Subdivisions"].default_value  = 1

wire = N("GeometryNodeWireframe", -500, -80)
wire.use_boundary = False   # skip open boundary edges (none on closed sphere)
links.new(grp_in.outputs["Cage Thickness"], wire.inputs["Thickness"])
links.new(ico_cage.outputs["Mesh"],         wire.inputs["Mesh"])

geo_cage = set_mat(-300, -80, wire.outputs["Mesh"], 1)
geo_cage = translate(-100, -80, geo_cage, (0.0, 0.0, GEM_OFFSET_Z))

# ══════════════════════════════════════════════════════════════════════════════
# PART 2 — HEX BASE CAP
# Cylinder(vertices=6) → flat shade → material slot 2 → translate down
# A 6-vertex cylinder gives a hexagonal prism — thematically matches the
# icosphere's triangular faces without requiring a separate bevel modifier.
# ══════════════════════════════════════════════════════════════════════════════
cyl = N("GeometryNodeMeshCylinder", -700, -340)
cyl.inputs["Vertices"].default_value    = BASE_VERTICES
cyl.inputs["Radius"].default_value      = BASE_RADIUS
cyl.inputs["Depth"].default_value       = BASE_DEPTH
cyl.fill_type = 'NGON'    # closed top and bottom faces

geo_base = flat_shade(-500, -340, cyl.outputs["Mesh"])
geo_base = set_mat(-300, -340, geo_base, 2)
geo_base = translate(-100, -340, geo_base, (0.0, 0.0, BASE_OFFSET_Z))

# ══════════════════════════════════════════════════════════════════════════════
# JOIN GEOMETRY — merge all three streams into one mesh
# Critical note: missing attributes are zero-filled across streams.
# Material index is a built-in attribute and is ALWAYS preserved.
# Any custom named attribute on only one stream → zero on all other elements.
# ══════════════════════════════════════════════════════════════════════════════
join = N("GeometryNodeJoinGeometry", 100, 0)
# JoinGeometry has a multi-input "Geometry" socket — connect all three streams
links.new(geo_gem,  join.inputs["Geometry"])
links.new(geo_cage, join.inputs["Geometry"])
links.new(geo_base, join.inputs["Geometry"])

links.new(join.outputs["Geometry"], grp_out.inputs["Geometry"])

# ── Export GLB ─────────────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.modifier_apply(modifier="Lantern_GN")

bpy.ops.export_scene.gltf(
    filepath          = bpy.path.abspath(GLB_PATH),
    export_format     = 'GLB',
    use_selection     = True,
    export_yup        = True,
    export_apply      = False,          # already applied above
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_materials  = 'EXPORT',
    export_colors     = False,
    export_texcoords  = False,
)
print("Lantern GLB written →", bpy.path.abspath(GLB_PATH))
