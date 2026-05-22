"""
GN Extrude Mesh — Procedural Panel Lines for Hard-Surface Assets
================================================================
Blender 5.1 | Holoflow Studio | CC0

Builds a 4×4 wall-panel grid and drives a Geometry Nodes tree that extrudes
every other face (checkerboard pattern) inward as a recessed panel, then
chamfers each panel rim with Scale Elements using the Extrude Mesh Top output.

WHY Individual=True is the core concept:
Without it, Extrude Mesh extrudes all selected faces as one fused slab —
shared borders merge and the result is a single block that rises or sinks
together, no visible gaps. With Individual=True each face extrudes along
its own normal independently. The gap between adjacent extruded faces is
what forms the panel line.

WHY pre-tag faces in Python instead of inside the GN tree:
The GN Index node returns a flat 1-D integer. Reconstructing a 2-D (row, col)
checkerboard inside GN requires integer division, two modulo operations, and
an add — five nodes for what is three lines of Python. Storing the result as
a named BOOLEAN FACE attribute lets the GN tree consume it in one Named
Attribute node and stays readable to anyone inspecting the modifier.

WHY Scale Elements with the Top output:
The Top output from Extrude Mesh is a boolean mask covering exactly the newly
created top faces (the recessed panel bottoms). Feeding it into Scale Elements
shrinks each panel bottom toward its own centre, creating a chamfered ledge
around every recess. Without this step the panels are simple flat-bottomed
holes; with it they read as bevelled sci-fi panels.

WHY Shade Smooth=False in the GN tree:
The side walls of the extrusion inherit shade-smooth state from the base mesh.
Setting it explicitly to False in the GN tree (SetShadeSmooth node) guarantees
flat faceted normals on every face regardless of the source mesh's shade mode,
which is required for the studio's cel-shading pipeline.

Blender 5.1 API notes:
- tree.interface.new_socket() (4.0+ API); tree.inputs.new() was removed.
- GeometryNodeExtrudeMesh.inputs[4] = Individual in FACES mode.
- Named Attribute node outputs[0] = 'Attribute' (typed by data_type property).
- export_apply=True required: GN is lazy; without it the exporter sees the
  unmodified flat grid, not the panel mesh.

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import bmesh
from mathutils import Vector
from pathlib import Path

# ── Named constants ────────────────────────────────────────────────────────────
GRID_COLS    = 4
GRID_ROWS    = 4
FACE_SIZE    = 0.25     # each tile is 0.25×0.25 m → 1×1 m total wall

PANEL_DEPTH  = -0.04   # negative = recessed into the wall
PANEL_INSET  = 0.82    # chamfer rim: 0.82 = 18 % inset on each panel face

MODIFIER_ID  = "HoloflowPanelLines"
ATTR_NAME    = "panel_face"
NODE_GROUP   = "PanelLinesGN"

MAT_BASE_COLOR  = (0.18, 0.22, 0.28, 1.0)   # cool dark grey
MAT_METALLIC    = 0.35
MAT_ROUGHNESS   = 0.55

OUT_DIR   = Path(__file__).parent / "output"
BLEND_OUT = Path(__file__).parent / "panel_lines.blend"
GLB_OUT   = OUT_DIR / "panel_lines.glb"


# ── Scene utilities ────────────────────────────────────────────────────────────

def reset_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def link_to_scene(obj: bpy.types.Object) -> None:
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)


# ── Base mesh ─────────────────────────────────────────────────────────────────

def build_base_panel() -> bpy.types.Object:
    """
    Create a 4×4 grid of quad faces centred at the origin, lying flat on the
    XY plane. Faces at checkerboard positions (row+col) % 2 == 0 are tagged
    with the panel_face=True BOOLEAN FACE attribute that the GN tree reads.

    WHY bmesh instead of bpy.ops.mesh.primitive_grid_add():
    The operator requires an active 3D viewport context. In --background mode
    it silently does nothing. bmesh works in all contexts.
    """
    bm = bmesh.new()
    half_w = (GRID_COLS * FACE_SIZE) / 2.0
    half_h = (GRID_ROWS * FACE_SIZE) / 2.0

    # Build vertex grid
    verts: dict[tuple[int, int], bmesh.types.BMVert] = {}
    for r in range(GRID_ROWS + 1):
        for c in range(GRID_COLS + 1):
            x = -half_w + c * FACE_SIZE
            y = -half_h + r * FACE_SIZE
            verts[(r, c)] = bm.verts.new(Vector((x, y, 0.0)))
    bm.verts.ensure_lookup_table()

    # Build quads row by row
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            bm.faces.new([
                verts[(r,     c)],
                verts[(r,     c + 1)],
                verts[(r + 1, c + 1)],
                verts[(r + 1, c)],
            ])
    bm.faces.ensure_lookup_table()

    mesh = bpy.data.meshes.new("panel_grid")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # Tag checkerboard faces as panel_face=True
    # (row+col) % 2 == 0 selects 8 of the 16 faces in an alternating pattern
    attr = mesh.attributes.new(name=ATTR_NAME, type='BOOLEAN', domain='FACE')
    for i in range(len(mesh.polygons)):
        row = i // GRID_COLS
        col = i % GRID_COLS
        attr.data[i].value = (row + col) % 2 == 0

    obj = bpy.data.objects.new("panel_wall", mesh)
    link_to_scene(obj)
    return obj


# ── Geometry Nodes tree ────────────────────────────────────────────────────────

def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Node graph (left to right):

      GroupInput ─── Geometry ──────────────────────► ExtrudeMesh ─► ScaleElements ─► SetShadeSmooth ─► GroupOutput
                 ─── Panel Depth ──────────────────► Offset Scale │
                 ─── Panel Inset ───────────────────────────────────────────────────► Scale
                                                                   │
        NamedAttribute("panel_face", BOOLEAN) ──────► Selection   └─► Top ─► Selection

    ExtrudeMesh.Top is the live boolean mask of the newly created top/bottom
    panel faces, reused immediately as the ScaleElements selection. This avoids
    any secondary attribute storage.
    """
    tree = bpy.data.node_groups.new(type="GeometryNodeTree", name=NODE_GROUP)
    nodes = tree.nodes
    links = tree.links

    # ── Interface (Blender 4.0+ API — tree.inputs.new() was removed) ──────────
    tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")

    s_depth = tree.interface.new_socket("Panel Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    s_depth.default_value = PANEL_DEPTH
    s_depth.min_value = -0.20
    s_depth.max_value = 0.0

    s_inset = tree.interface.new_socket("Panel Inset", in_out="INPUT", socket_type="NodeSocketFloat")
    s_inset.default_value = PANEL_INSET
    s_inset.min_value = 0.5
    s_inset.max_value = 1.0

    # ── Nodes ──────────────────────────────────────────────────────────────────
    n_in  = nodes.new("NodeGroupInput");   n_in.location  = (-700, 0)
    n_out = nodes.new("NodeGroupOutput");  n_out.location = ( 700, 0)

    # Reads panel_face=True/False per face from the mesh attribute store
    n_attr = nodes.new("GeometryNodeInputNamedAttribute")
    n_attr.data_type = "BOOLEAN"
    n_attr.inputs[0].default_value = ATTR_NAME  # Name socket
    n_attr.location = (-450, -180)

    # Individual=True: each selected face extrudes along its own normal
    # independently, creating the panel-line gap between adjacent panels.
    # Index 4 is the Individual bool socket in FACES mode (stable in 5.x).
    n_extrude = nodes.new("GeometryNodeExtrudeMesh")
    n_extrude.mode = "FACES"
    n_extrude.inputs[4].default_value = True  # Individual
    n_extrude.location = (-160, 0)

    # Scale Elements uses the Top mask from ExtrudeMesh as its selection
    # so it chamfers exactly and only the newly created recessed panel faces.
    n_scale = nodes.new("GeometryNodeScaleElements")
    n_scale.domain = "FACE"
    n_scale.scale_mode = "UNIFORM"
    n_scale.location = (180, 0)

    # Flat shading on all faces — studio cel-shading convention.
    n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = False
    n_smooth.location = (460, 0)

    # ── Links ──────────────────────────────────────────────────────────────────
    links.new(n_in.outputs["Geometry"],     n_extrude.inputs["Mesh"])
    links.new(n_attr.outputs[0],            n_extrude.inputs["Selection"])
    links.new(n_in.outputs["Panel Depth"],  n_extrude.inputs["Offset Scale"])
    links.new(n_extrude.outputs["Mesh"],    n_scale.inputs["Geometry"])
    links.new(n_extrude.outputs["Top"],     n_scale.inputs["Selection"])
    links.new(n_in.outputs["Panel Inset"],  n_scale.inputs["Scale"])
    links.new(n_scale.outputs["Geometry"],  n_smooth.inputs["Geometry"])
    links.new(n_smooth.outputs["Geometry"], n_out.inputs["Geometry"])

    return tree


# ── Material ───────────────────────────────────────────────────────────────────

def add_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(name="panel_wall_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = MAT_BASE_COLOR
    bsdf.inputs["Metallic"].default_value   = MAT_METALLIC
    bsdf.inputs["Roughness"].default_value  = MAT_ROUGHNESS
    obj.data.materials.append(mat)


# ── Modifier ───────────────────────────────────────────────────────────────────

def apply_modifier(obj: bpy.types.Object, tree: bpy.types.GeometryNodeTree) -> None:
    mod = obj.modifiers.new(name=MODIFIER_ID, type="NODES")
    mod.node_group = tree
    # Geometry is Input_0 (auto-wired); Panel Depth = Input_1; Panel Inset = Input_2


# ── Export ─────────────────────────────────────────────────────────────────────

def export_assets(obj: bpy.types.Object) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # export_apply=True: GN modifier is lazy. Without it the exporter reads
    # the raw flat 4×4 grid, not the extruded panel mesh.
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
    )

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[blueprint] GLB  → {GLB_OUT}")
    print(f"[blueprint] blend → {BLEND_OUT}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    reset_scene()
    obj  = build_base_panel()
    tree = build_gn_tree()
    apply_modifier(obj, tree)
    add_material(obj)
    export_assets(obj)


if __name__ == "__main__":
    main()
