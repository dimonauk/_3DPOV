"""
holoflow_macros/gn_scatter_build.py — Reusable GeometryNodeTree builder
Holoflow Studio · CC0 1.0 · Blender 5.1

Exposes build_scatter_node_tree() as a callable for add-on operators.
See tutorial: /tutorials/blender-tutorial-python-geometry-nodetree-build-scatter-modifier-api
"""

import bpy

TREE_NAME     = "HF_Scatter"
MODIFIER_NAME = "GN Scatter"


def build_scatter_node_tree(
    billboard_obj: bpy.types.Object,
    scale_min: float = 0.5,
    scale_max: float = 1.3,
    tree_name: str   = TREE_NAME,
) -> bpy.types.NodeTree:
    """
    Create (or replace) a GeometryNodeTree that scatters billboard_obj
    on faces of the target mesh using Distribute Points on Faces → Instance.

    Returns the node group so callers can inspect or extend it.
    """
    if tree_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[tree_name])

    tree  = bpy.data.node_groups.new(tree_name, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    # Interface
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Density",  in_out="INPUT",  socket_type="NodeSocketFloat")
    tree.interface.new_socket("Seed",     in_out="INPUT",  socket_type="NodeSocketInt")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    # Nodes
    n_in   = nodes.new("NodeGroupInput");                  n_in.location   = (-900,   0)
    n_out  = nodes.new("NodeGroupOutput");                 n_out.location  = ( 800,   0)
    n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "RANDOM";                   n_dist.location = (-500,   0)
    n_obj  = nodes.new("GeometryNodeObjectInfo")
    n_obj.inputs["Object"].default_value = billboard_obj
    n_obj.transform_space = "ORIGINAL";                    n_obj.location  = (-200, -250)
    n_idx  = nodes.new("GeometryNodeInputIndex");          n_idx.location  = (-500, -350)
    n_rand = nodes.new("FunctionNodeRandomValue")
    n_rand.data_type = "FLOAT"
    n_rand.inputs["Min"].default_value = scale_min
    n_rand.inputs["Max"].default_value = scale_max;       n_rand.location = (-200, -420)
    n_xyz  = nodes.new("ShaderNodeCombineXYZ");            n_xyz.location  = ( 100, -420)
    n_inst = nodes.new("GeometryNodeInstanceOnPoints");    n_inst.location = ( 400,   0)

    # Links
    links.new(n_in.outputs["Geometry"], n_dist.inputs["Mesh"])
    links.new(n_in.outputs["Density"],  n_dist.inputs["Density"])
    links.new(n_in.outputs["Seed"],     n_dist.inputs["Seed"])
    links.new(n_idx.outputs["Index"],   n_rand.inputs["ID"])
    links.new(n_rand.outputs["Value"],  n_xyz.inputs["X"])
    links.new(n_rand.outputs["Value"],  n_xyz.inputs["Y"])
    links.new(n_rand.outputs["Value"],  n_xyz.inputs["Z"])
    links.new(n_dist.outputs["Points"], n_inst.inputs["Points"])
    links.new(n_obj.outputs["Geometry"], n_inst.inputs["Instance"])
    links.new(n_xyz.outputs["Vector"],  n_inst.inputs["Scale"])
    links.new(n_inst.outputs["Instances"], n_out.inputs["Geometry"])

    return tree


def apply_scatter_to(
    target: bpy.types.Object,
    tree: bpy.types.NodeTree,
    density: float = 0.4,
    seed: int      = 7,
) -> bpy.types.NodesModifier:
    mod = target.modifiers.new(MODIFIER_NAME, "NODES")
    mod.node_group = tree
    for item in tree.interface.items_tree:
        if item.in_out != "INPUT":
            continue
        if item.name == "Density":
            mod[item.identifier] = density
        elif item.name == "Seed":
            mod[item.identifier] = seed
    return mod
