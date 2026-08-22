# ============================================================
# Holoflow Studio Macro — GN Tree API helpers
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# Reusable utilities for building Geometry Nodes trees via the
# bpy Python API (Blender 4.0+ tree.interface system).
# Import in any blueprint that needs programmatic GN construction.
# ============================================================

from __future__ import annotations
import bpy


def purge_node_group(name: str) -> None:
    """Remove an existing node group so scripts are re-runnable."""
    ng = bpy.data.node_groups.get(name)
    if ng:
        bpy.data.node_groups.remove(ng)


def new_gn_tree(name: str) -> bpy.types.GeometryNodeTree:
    """Create a fresh GeometryNodeTree with standard geometry I/O sockets."""
    purge_node_group(name)
    tree: bpy.types.GeometryNodeTree = bpy.data.node_groups.new(
        name=name, type="GeometryNodeTree"
    )
    iface = tree.interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    return tree


def add_float_input(
    tree: bpy.types.GeometryNodeTree,
    name: str,
    default: float = 1.0,
    lo: float = 0.0,
    hi: float = 10.0,
) -> str:
    """
    Add a Float INPUT socket to the tree interface and return its identifier.
    The identifier is the key used to read/write the modifier's input dict.
    """
    s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value = default
    s.min_value     = lo
    s.max_value     = hi
    return s.identifier


def find_socket_id(tree: bpy.types.GeometryNodeTree, socket_name: str) -> str:
    """
    Return the modifier dict-key identifier for a named INPUT socket.
    Raises RuntimeError when the socket is not found.
    Use the identifier (not the socket index) to read/write modifier inputs —
    the index shifts when sockets are inserted or removed.
    """
    for item in tree.interface.items_tree:
        if item.in_out == "INPUT" and item.name == socket_name:
            return item.identifier
    raise RuntimeError(
        f"Socket '{socket_name}' not found in '{tree.name}' interface."
    )


def add_gn_modifier(
    ob: bpy.types.Object,
    tree: bpy.types.GeometryNodeTree,
    modifier_name: str = "HS_GN",
) -> bpy.types.Modifier:
    """Attach a Geometry Nodes modifier pointing at the given tree."""
    mod = ob.modifiers.new(name=modifier_name, type="NODES")
    mod.node_group = tree
    return mod


def keyframe_modifier_input(
    mod: bpy.types.Modifier,
    socket_id: str,
    value: float,
    frame: int,
) -> None:
    """
    Set a GN modifier float input and insert a keyframe.
    socket_id must be the .identifier string from tree.interface, NOT an index.
    """
    mod[socket_id] = value
    mod.keyframe_insert(f'["{socket_id}"]', frame=frame)


def place(node: bpy.types.Node, x: float, y: float) -> None:
    """Set node position in the canvas (pixels)."""
    node.location = (x, y)
