"""
Python bpy.data.node_groups — Build a GeometryNodeTree via the Python API
Procedural Billboard Scatter for WebXR — Blender 5.1
Holoflow Studio · CC0 1.0

WHY: bpy.ops.* creates nodes interactively; the node_groups API creates them
headlessly, deterministically, and without requiring an active editor context.
This is the correct path for generator scripts, asset-pipeline automation,
and any operator that must run inside an add-on or background render.

RESULT: a subdivided ground plane with a GN Scatter modifier that
distributes vertical billboard quads, randomises their scale per-point,
then exports scatter_billboard.glb ready for Three.js / WebXR.
"""

import bpy
import mathutils

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
GROUND_SIZE      = 8.0      # metres — width/depth of the scatter plane
GROUND_SUBDIVS   = 3        # loop-cut subdivisions → denser face tessellation
DENSITY          = 0.4      # points per m² (Distribute Points on Faces, RANDOM)
SEED             = 7        # top-level scatter seed
SCALE_MIN        = 0.5      # random per-instance scale lower bound
SCALE_MAX        = 1.3      # random per-instance scale upper bound
BILLBOARD_W      = 0.6      # metres — billboard quad width
BILLBOARD_H      = 1.1      # metres — billboard quad height
TREE_NAME        = "HF_Scatter"
MODIFIER_NAME    = "GN Scatter"
OUT_GLB          = "//scatter_billboard.glb"


# ── SCENE RESET ───────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    # Purge orphan data so re-runs don't accumulate stale mesh blocks
    bpy.ops.outliner.orphans_purge(
        do_local_ids=True, do_linked_ids=False, do_recursive=True
    )


# ── GROUND PLANE ──────────────────────────────────────────────────────────────
def make_ground() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE)
    ground = bpy.context.active_object
    ground.name = "scatter_ground"

    # Subdivide in Edit Mode — gives the Distribute node more face area to work on.
    # More faces → more deterministic density clamping inside GN RANDOM mode.
    bpy.ops.object.editmode_toggle()
    bpy.ops.mesh.subdivide(number_cuts=GROUND_SUBDIVS)
    bpy.ops.object.editmode_toggle()
    return ground


# ── BILLBOARD INSTANCE SOURCE ─────────────────────────────────────────────────
def make_billboard() -> bpy.types.Object:
    """
    A single-quad mesh standing upright.  GN Instance on Points replicates it
    onto every scattered point.  hide_render keeps it invisible in Cycles/EEVEE
    but still accessible to the GN Object Info node.
    """
    verts = [
        (-BILLBOARD_W / 2, 0.0, 0.0),
        ( BILLBOARD_W / 2, 0.0, 0.0),
        ( BILLBOARD_W / 2, 0.0, BILLBOARD_H),
        (-BILLBOARD_W / 2, 0.0, BILLBOARD_H),
    ]
    me = bpy.data.meshes.new("billboard_mesh")
    me.from_pydata(verts, [], [(0, 1, 2, 3)])
    me.update()

    obj = bpy.data.objects.new("billboard_src", me)
    bpy.context.scene.collection.objects.link(obj)
    obj.hide_render = True          # instance source — not a direct render object
    obj.hide_viewport = False       # visible in viewport so GN Object Info resolves
    return obj


# ── GEOMETRY NODE TREE ────────────────────────────────────────────────────────
def build_scatter_node_tree(billboard_obj: bpy.types.Object) -> bpy.types.NodeTree:
    """
    Key 5.1 API facts:
    • tree.interface.new_socket() replaces the removed tree.inputs/tree.outputs.
    • Nodes are typed by their bl_idname string (NOT the UI label).
    • Links require a socket OBJECT, not a name string.
    • One output socket may fan to multiple input sockets — used for X/Y/Z scale.
    • GeometryNodeInputIndex supplies per-element index into RandomValue.ID,
      giving different scale per instance instead of the same value for all.
    """
    if TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[TREE_NAME])

    tree  = bpy.data.node_groups.new(TREE_NAME, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    # ── Group interface (Blender 4.0+ / 5.1 API) ──────────────────────────
    tree.interface.new_socket(
        "Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry"
    )
    tree.interface.new_socket(
        "Density",  in_out="INPUT",  socket_type="NodeSocketFloat"
    )
    tree.interface.new_socket(
        "Seed",     in_out="INPUT",  socket_type="NodeSocketInt"
    )
    tree.interface.new_socket(
        "Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry"
    )

    # ── Nodes ─────────────────────────────────────────────────────────────
    n_in = nodes.new("NodeGroupInput");   n_in.location  = (-900,   0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 800,   0)

    # Distribute Points on Faces — RANDOM mode uses Density (pts/m²)
    n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "RANDOM"
    n_dist.location = (-500, 0)

    # Object Info — retrieves the billboard mesh as instancable geometry
    n_obj = nodes.new("GeometryNodeObjectInfo")
    n_obj.inputs["Object"].default_value = billboard_obj
    n_obj.transform_space = "ORIGINAL"   # keep billboard in its own local space
    n_obj.location = (-200, -250)

    # Index — per-point integer, feeds Random Value ID for per-point variation
    n_idx = nodes.new("GeometryNodeInputIndex")
    n_idx.location = (-500, -350)

    # Random Value — per-instance float in [SCALE_MIN, SCALE_MAX]
    n_rand = nodes.new("FunctionNodeRandomValue")
    n_rand.data_type = "FLOAT"
    n_rand.inputs["Min"].default_value = SCALE_MIN
    n_rand.inputs["Max"].default_value = SCALE_MAX
    n_rand.location = (-200, -420)

    # Combine XYZ — broadcast the scalar into a uniform-scale vector
    n_xyz = nodes.new("ShaderNodeCombineXYZ")
    n_xyz.location = (100, -420)

    # Instance on Points — the GN scatter workhorse
    n_inst = nodes.new("GeometryNodeInstanceOnPoints")
    n_inst.location = (400, 0)

    # ── Links ─────────────────────────────────────────────────────────────
    # Scatter: ground geometry → distribute
    links.new(n_in.outputs["Geometry"], n_dist.inputs["Mesh"])
    links.new(n_in.outputs["Density"],  n_dist.inputs["Density"])
    links.new(n_in.outputs["Seed"],     n_dist.inputs["Seed"])

    # Per-point random scale: index → random ID → float → XYZ
    links.new(n_idx.outputs["Index"],  n_rand.inputs["ID"])
    links.new(n_rand.outputs["Value"], n_xyz.inputs["X"])
    links.new(n_rand.outputs["Value"], n_xyz.inputs["Y"])
    links.new(n_rand.outputs["Value"], n_xyz.inputs["Z"])

    # Instance assembly: points + billboard + scale → instances
    links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    links.new(n_obj.outputs["Geometry"],   n_inst.inputs["Instance"])
    links.new(n_xyz.outputs["Vector"],     n_inst.inputs["Scale"])

    # Output
    links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])

    return tree


# ── MODIFIER APPLICATION ──────────────────────────────────────────────────────
def apply_modifier(
    ground: bpy.types.Object, tree: bpy.types.NodeTree
) -> None:
    """
    The socket identifier strings (Socket_1, Socket_2 …) are auto-generated
    in interface-insertion order.  Iterating tree.interface.items_tree resolves
    them by name — far more robust than hard-coding positional indices.
    """
    mod = ground.modifiers.new(MODIFIER_NAME, "NODES")
    mod.node_group = tree

    for item in tree.interface.items_tree:
        if item.in_out != "INPUT":
            continue
        if item.name == "Density":
            mod[item.identifier] = DENSITY
        elif item.name == "Seed":
            mod[item.identifier] = SEED


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
def export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT_GLB),
        export_format="GLB",
        export_apply=True,                          # apply modifiers — realises GN
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        use_selection=False,
    )
    print(f"[HF Scatter] Exported → {OUT_GLB}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    ground    = make_ground()
    billboard = make_billboard()
    tree      = build_scatter_node_tree(billboard)
    apply_modifier(ground, tree)
    export_glb()


if __name__ == "__main__":
    main()
