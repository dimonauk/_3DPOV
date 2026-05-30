"""
holoflow_macros/mesh_island_colour.py
Blender 5.1 | CC0 | Holoflow Studio

Reusable helpers for island-keyed GN attribute pipelines:
  - build_island_colour_tree()   : builds a GNIslandColour node group
  - apply_island_colour()        : attaches it to an object as a modifier
  - separate_island()            : adds a SeparateGeometry subtree by island index

All functions return the created node group or modifier for further customisation.
"""

from __future__ import annotations
import bpy
from bpy.types import Object, NodeTree


def build_island_colour_tree(
    name: str = "GNIslandColour",
    colour_seed: int = 42,
    lift_seed: int = 99,
    lift_max: float = 0.20,
    colour_min: tuple[float, float, float] = (0.20, 0.20, 0.20),
) -> NodeTree:
    """
    Create a reusable GeometryNodeTree that colours every mesh island
    uniquely using IslandIndex-seeded RandomValue and applies a random
    Z lift scaled by an animatable Lift Multiplier group socket.

    Stored named attributes:
        island_colour  — FLOAT_COLOR, FACE domain
        island_index   — INT, FACE domain (prerequisite for SeparateGeometry)

    Returns the node group; attach to an object via apply_island_colour().
    """
    tree  = bpy.data.node_groups.new(name, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    s = tree.interface.new_socket("Lift Multiplier", in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value, s.min_value, s.max_value = 1.0, 0.0, 1.0

    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-900, 0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location  = (1000, 0)

    n_island = nodes.new("GeometryNodeInputMeshIsland")
    n_island.location = (-640, -180)

    # Per-island colour
    n_col = nodes.new("GeometryNodeRandomValue")
    n_col.data_type = "FLOAT_VECTOR"
    n_col.inputs[0].default_value = colour_min
    n_col.inputs[1].default_value = (1.0, 1.0, 1.0)
    n_col.inputs["Seed"].default_value = colour_seed
    n_col.location = (-380, -60)

    n_store_col = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_col.data_type = "FLOAT_COLOR"
    n_store_col.domain    = "FACE"
    n_store_col.inputs["Name"].default_value = "island_colour"
    n_store_col.location = (50, 120)

    # Per-island Z lift
    n_lift = nodes.new("GeometryNodeRandomValue")
    n_lift.data_type = "FLOAT"
    n_lift.inputs["Min"].default_value  = 0.0
    n_lift.inputs["Max"].default_value  = lift_max
    n_lift.inputs["Seed"].default_value = lift_seed
    n_lift.location = (-380, -300)

    n_mul = nodes.new("ShaderNodeMath")
    n_mul.operation = "MULTIPLY"
    n_mul.location  = (-100, -300)

    n_xyz = nodes.new("ShaderNodeCombineXYZ")
    n_xyz.inputs["X"].default_value = 0.0
    n_xyz.inputs["Y"].default_value = 0.0
    n_xyz.location = (180, -200)

    n_setpos = nodes.new("GeometryNodeSetPosition")
    n_setpos.location = (440, 120)

    # Store island_index as INT for downstream SeparateGeometry
    n_store_idx = nodes.new("GeometryNodeStoreNamedAttribute")
    n_store_idx.data_type = "INT"
    n_store_idx.domain    = "FACE"
    n_store_idx.inputs["Name"].default_value = "island_index"
    n_store_idx.location = (720, 120)

    links.new(n_island.outputs["Island Index"], n_col.inputs["ID"])
    links.new(n_island.outputs["Island Index"], n_lift.inputs["ID"])
    links.new(n_island.outputs["Island Index"], n_store_idx.inputs["Value"])

    links.new(n_in.outputs["Geometry"],         n_store_col.inputs["Geometry"])
    links.new(n_col.outputs["Value"],           n_store_col.inputs["Value"])

    links.new(n_lift.outputs["Value"],          n_mul.inputs[0])
    links.new(n_in.outputs["Lift Multiplier"],  n_mul.inputs[1])
    links.new(n_mul.outputs["Value"],           n_xyz.inputs["Z"])

    links.new(n_store_col.outputs["Geometry"],  n_setpos.inputs["Geometry"])
    links.new(n_xyz.outputs["Vector"],          n_setpos.inputs["Offset"])

    links.new(n_setpos.outputs["Geometry"],     n_store_idx.inputs["Geometry"])
    links.new(n_store_idx.outputs["Geometry"],  n_out.inputs["Geometry"])

    return tree


def apply_island_colour(
    obj: Object,
    tree: NodeTree | None = None,
    modifier_name: str = "GNIslandColour",
) -> bpy.types.NodesModifier:
    """
    Attach an island-colour GN tree to obj as a NODES modifier.
    Creates a new tree via build_island_colour_tree() if tree is None.
    Returns the modifier.
    """
    if tree is None:
        tree = build_island_colour_tree()
    mod            = obj.modifiers.new(modifier_name, "NODES")
    mod.node_group = tree
    mod["Input_2"] = 1.0   # Lift Multiplier default
    return mod


def separate_island(
    tree: NodeTree,
    after_node: bpy.types.Node,
    target_island: int = 0,
) -> bpy.types.Node:
    """
    Append a SeparateGeometry subtree to an existing GN tree that
    isolates the island at index target_island using the stored
    'island_index' INT attribute.

    Wires:
        NamedAttribute(island_index) + Compare(INT, EQUAL, B=target) →
        SeparateGeometry(FACE).Selection

    Returns the SeparateGeometry node (connect its Geometry output as needed).

    Prerequisite: the tree must already store 'island_index' via
    StoreNamedAttribute (as build_island_colour_tree() does).
    """
    nodes = tree.nodes
    links = tree.links

    x_base = after_node.location[0] + 300

    n_read = nodes.new("GeometryNodeInputNamedAttribute")
    n_read.data_type = "INT"
    n_read.inputs["Name"].default_value = "island_index"
    n_read.location = (x_base, -200)

    n_cmp = nodes.new("FunctionNodeCompare")
    n_cmp.data_type = "INT"
    n_cmp.operation = "EQUAL"
    n_cmp.inputs["B"].default_value = target_island
    n_cmp.location = (x_base + 240, -200)

    n_sep = nodes.new("GeometryNodeSeparateGeometry")
    n_sep.domain   = "FACE"
    n_sep.location = (x_base + 480, 0)

    links.new(n_read.outputs["Attribute"], n_cmp.inputs["A"])
    links.new(n_cmp.outputs["Result"],     n_sep.inputs["Selection"])
    links.new(after_node.outputs["Geometry"], n_sep.inputs["Geometry"])

    return n_sep
