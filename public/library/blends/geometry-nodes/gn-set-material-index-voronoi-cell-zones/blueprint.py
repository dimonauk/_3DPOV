"""
HF_SetMaterialIndex blueprint — Voronoi Cell Zones on a Faceted ICO-Sphere Gem
Blender 5.1  |  CC0  |  Holoflow Studio
source: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/material/set_material_index.html

WHY THIS TECHNIQUE
==================
Blender's mesh material system assigns one integer slot index (material_index)
per face. When you add four materials to bpy.types.Mesh.materials, index 0
draws the first, index 1 the second, and so on.  In old Blender you edited
material_index per-face in Edit Mode; in Geometry Nodes you use the
Set Material Index node, which takes any INTEGER field and writes it to
every face in the evaluation domain.

The clever bit: Voronoi Texture (3D, F1, Euclidean) evaluated at the face
Position produces a 'Color' output that is CONSTANT within each Voronoi cell.
Extract the X component (0..1), multiply by NUM_SLOTS, floor-to-integer,
and you get a stable slot index per zone — exactly like a procedural atlas.

CRITICAL NOTE ON SLOT STABILITY
================================
Set Material Index silently clamps out-of-range integers to slot 0.
If you write index 3 but the mesh has only 2 materials, you see slot 0
(red gem appears instead of obsidian) with no error or warning.
Always populate ALL material slots BEFORE adding the GeoNode modifier.

BLENDER 5.1 API NOTES
======================
- GeoNode interface: ng.interface.new_socket() (4.0+ API; replaces ng.inputs.new)
- ShaderNodeTexVoronoi works inside GeometryNodeTree (same as shader graph)
- FunctionNodeFloatToInt: rounding_mode in {'FLOOR','CEIL','ROUND','TRUNCATE'}
- GeometryNodeSetMaterialIndex input sockets: [0]Geometry [1]Selection [2]Material Index(INT)
- modifier inputs: mod[socket.identifier] = value  (identifier e.g. "Socket_2")
"""

import bpy
import math

# ── parameters ─────────────────────────────────────────────────────────────────
BLEND_OUT      = "//voronoi_gem.blend"
GLB_OUT        = "//voronoi_gem.glb"
OBJ_NAME       = "voronoi_gem"
GN_TREE_NAME   = "HF_SetMaterialIndex"
ICO_SUBDIV     = 2          # 80 faces: enough cells to show distinct zone colours
GEM_RADIUS     = 1.0        # metres
VORONOI_SCALE  = 3.0        # higher = more, smaller cells
NUM_SLOTS      = 4          # must equal len(MATERIALS)

# Principled BSDF gem palette: (name, base_color RGBA, roughness, transmission)
MATERIALS = [
    ("gem_ruby",      (0.85, 0.04, 0.04, 1.0), 0.0, 0.85),
    ("gem_topaz",     (0.92, 0.72, 0.08, 1.0), 0.0, 0.85),
    ("gem_sapphire",  (0.05, 0.15, 0.90, 1.0), 0.0, 0.85),
    ("gem_obsidian",  (0.04, 0.02, 0.07, 1.0), 0.06, 0.0),
]

# ── scene helpers ───────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def make_materials() -> list[bpy.types.Material]:
    mats: list[bpy.types.Material] = []
    for name, base_color, roughness, transmission in MATERIALS:
        if name in bpy.data.materials:
            bpy.data.materials.remove(bpy.data.materials[name])
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value        = base_color
        bsdf.inputs["Roughness"].default_value         = roughness
        # 5.1 socket name for transmission is "Transmission Weight"
        bsdf.inputs["Transmission Weight"].default_value = transmission
        bsdf.inputs["IOR"].default_value               = 1.72   # diamond-adjacent
        mats.append(mat)
    return mats


def make_ico_gem(mats: list[bpy.types.Material]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=ICO_SUBDIV,
        radius=GEM_RADIUS,
        location=(0.0, 0.0, 0.0),
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    # Flat shading so each triangular face reads as a distinct facet
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.faces_shade_flat()
    bpy.ops.object.mode_set(mode='OBJECT')

    # Populate ALL material slots BEFORE adding GeoNode modifier — see CRITICAL NOTE above
    for mat in mats:
        obj.data.materials.append(mat)

    return obj

# ── geometry nodes tree ─────────────────────────────────────────────────────────

def build_geonode_tree() -> bpy.types.GeometryNodeTree:
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])

    ng = bpy.data.node_groups.new(GN_TREE_NAME, 'GeometryNodeTree')

    # 4.0+ socket interface API
    ng.interface.new_socket("Geometry",   in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry",   in_out='OUTPUT', socket_type='NodeSocketGeometry')
    s_scale = ng.interface.new_socket("Scale",      in_out='INPUT',  socket_type='NodeSocketFloat')
    s_rand  = ng.interface.new_socket("Randomness", in_out='INPUT',  socket_type='NodeSocketFloat')
    s_slots = ng.interface.new_socket("Num Slots",  in_out='INPUT',  socket_type='NodeSocketInt')

    # Default values shown in the modifier panel
    s_scale.default_value  = VORONOI_SCALE
    s_rand.default_value   = 1.0
    s_slots.default_value  = NUM_SLOTS

    nodes = ng.nodes
    links = ng.links

    def n(type_id: str, x: float = 0, y: float = 0, **kw):
        nd = nodes.new(type_id)
        nd.location = (x, y)
        for k, v in kw.items():
            setattr(nd, k, v)
        return nd

    gin  = n("NodeGroupInput",  x=-760, y=0)
    gout = n("NodeGroupOutput", x=620,  y=0)

    # Position field — evaluated per face inside Set Material Index domain
    pos  = n("GeometryNodeInputPosition", x=-760, y=-280)

    # Voronoi Texture: 3D + F1 + Euclidean gives hard-edged cell colouring.
    # SMOOTH_F1 would give gradient bands — wrong for distinct material zones.
    voro = n("ShaderNodeTexVoronoi", x=-520, y=-280)
    voro.voronoi_dimensions = '3D'
    voro.feature            = 'F1'
    voro.distance           = 'EUCLIDEAN'

    # Separate XYZ to pull one scalar from the Color (Vector) output.
    # Color.X is seeded from the Voronoi cell hash — constant within a cell,
    # unique across cells with high randomness.
    sep  = n("ShaderNodeSeparateXYZ", x=-260, y=-280)

    # Multiply X (range 0..1) by Num Slots to span all slot indices
    mul  = n("ShaderNodeMath",        x=-60,  y=-280, operation='MULTIPLY')
    mul.inputs[1].default_value = float(NUM_SLOTS)   # overridden by link below

    # Floor to convert continuous float to integer
    flr  = n("ShaderNodeMath",        x=160,  y=-280, operation='FLOOR')

    # Explicit float→int conversion.  Set Material Index requires INT domain.
    f2i  = n("FunctionNodeFloatToInt", x=360,  y=-280)
    f2i.rounding_mode = 'FLOOR'

    # Set Material Index — core node.  Selection defaults to True (all faces).
    smi  = n("GeometryNodeSetMaterialIndex", x=480, y=0)

    # ── wire up ─────────────────────────────────────────────────────────────
    links.new(pos.outputs["Position"],          voro.inputs["Vector"])
    links.new(gin.outputs["Scale"],             voro.inputs["Scale"])
    links.new(gin.outputs["Randomness"],        voro.inputs["Randomness"])
    links.new(voro.outputs["Color"],            sep.inputs["Vector"])
    links.new(sep.outputs["X"],                 mul.inputs[0])
    links.new(gin.outputs["Num Slots"],         mul.inputs[1])
    links.new(mul.outputs["Value"],             flr.inputs["Value"])
    links.new(flr.outputs["Value"],             f2i.inputs[0])
    links.new(gin.outputs["Geometry"],          smi.inputs["Geometry"])
    links.new(f2i.outputs["Integer"],           smi.inputs["Material Index"])
    links.new(smi.outputs["Geometry"],          gout.inputs["Geometry"])

    return ng


def add_modifier(obj: bpy.types.Object, ng: bpy.types.GeometryNodeTree) -> None:
    mod = obj.modifiers.new("HF_MatIdx", 'NODES')
    mod.node_group = ng
    # Set modifier inputs using the interface identifier (Blender 4.0+)
    for socket in ng.interface.items_tree:
        if socket.in_out != 'INPUT':
            continue
        if socket.name == "Scale":
            mod[socket.identifier] = VORONOI_SCALE
        elif socket.name == "Randomness":
            mod[socket.identifier] = 1.0
        elif socket.name == "Num Slots":
            mod[socket.identifier] = NUM_SLOTS

# ── world / camera ──────────────────────────────────────────────────────────────

def setup_world_and_camera() -> None:
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 0.3

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    bpy.ops.object.light_add(type='POINT', location=(-3, 3, 2))
    fill = bpy.context.active_object
    fill.data.energy = 20.0
    fill.data.color  = (0.4, 0.5, 1.0)

    bpy.ops.object.camera_add(location=(0, -3.8, 1.4))
    cam = bpy.context.active_object
    cam.rotation_euler       = (math.radians(68), 0, 0)
    bpy.context.scene.camera = cam

# ── export ──────────────────────────────────────────────────────────────────────

def export_glb(path: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(path),
        export_format='GLB',
        export_apply=True,               # realise GeoNode modifier output
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_materials='EXPORT',
    )

# ── main ────────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    mats = make_materials()
    gem  = make_ico_gem(mats)
    ng   = build_geonode_tree()
    add_modifier(gem, ng)
    setup_world_and_camera()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    export_glb(GLB_OUT)
    print("✓ voronoi_gem.blend + voronoi_gem.glb written")


main()
