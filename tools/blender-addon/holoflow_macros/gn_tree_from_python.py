"""
holoflow_macros — gn_tree_from_python.py
Reusable helper for building Geometry Node trees entirely from Python.

Blender 4.0+ interface API. Blender 4.1+ Index Switch.

Usage:
    from holoflow_macros.gn_tree_from_python import (
        new_gn_group, add_group_io, link, find_socket_id
    )
    ng = new_gn_group('MyGroup')
    gi, go = add_group_io(ng, [('NodeSocketInt','Variant'),],
                               [('NodeSocketGeometry','Geometry'),])
    sphere = ng.nodes.new('GeometryNodeMeshUVSphere')
    ...
"""

import bpy


def new_gn_group(name: str, clear_existing: bool = True) -> bpy.types.GeometryNodeTree:
    """Create (or replace) a GeometryNodeTree node group."""
    if clear_existing and name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[name])
    return bpy.data.node_groups.new(name=name, type='GeometryNodeTree')


def add_group_io(
    ng: bpy.types.GeometryNodeTree,
    inputs:  list[tuple[str, str]],
    outputs: list[tuple[str, str]],
    gi_loc: tuple[float, float] = (-600, 0),
    go_loc: tuple[float, float] = ( 500, 0),
) -> tuple[bpy.types.Node, bpy.types.Node]:
    """
    Add interface sockets and Group Input/Output nodes.

    inputs / outputs:  [(socket_type, name), ...]
      e.g. [('NodeSocketInt', 'Variant'), ('NodeSocketFloat', 'Scale')]

    Returns (GroupInput node, GroupOutput node).
    """
    itf = ng.interface
    for sock_type, name in inputs:
        itf.new_socket(name=name, in_out='INPUT', socket_type=sock_type)
    for sock_type, name in outputs:
        itf.new_socket(name=name, in_out='OUTPUT', socket_type=sock_type)

    gi = ng.nodes.new('NodeGroupInput');  gi.location  = gi_loc
    go = ng.nodes.new('NodeGroupOutput'); go.location = go_loc
    return gi, go


def link(ng: bpy.types.GeometryNodeTree,
         from_socket: bpy.types.NodeSocket,
         to_socket:   bpy.types.NodeSocket) -> bpy.types.NodeLink:
    """Convenience wrapper for ng.links.new()."""
    return ng.links.new(from_socket, to_socket)


def find_socket_id(ng: bpy.types.GeometryNodeTree, name: str) -> str | None:
    """
    Look up the auto-generated identifier for a named interface socket.
    Use this to set modifier properties: mod[find_socket_id(ng,'Variant')] = 0.
    Returns None if not found.
    """
    for item in ng.interface.items_tree:
        if getattr(item, 'name', None) == name and item.item_type == 'SOCKET':
            return item.identifier
    return None


def set_modifier_input(
    ob:   bpy.types.Object,
    ng:   bpy.types.GeometryNodeTree,
    name: str,
    value,
    mod_name: str = 'GN',
) -> bool:
    """
    Set a named GN modifier input on an object.
    Returns True if the socket was found and the value was set.
    """
    mod = ob.modifiers.get(mod_name)
    if mod is None:
        return False
    sid = find_socket_id(ng, name)
    if sid is None:
        return False
    mod[sid] = value
    return True


def build_index_switch(
    ng:        bpy.types.GeometryNodeTree,
    data_type: str = 'GEOMETRY',
    n_items:   int = 3,
    location:  tuple[float, float] = (0, 0),
) -> bpy.types.Node:
    """
    Create an Index Switch node with n_items item sockets.

    data_type must be set before items are added — changing it afterward
    severs existing links. Default is 'GEOMETRY'.

    Node socket layout after return:
      inputs[0]     = 'Index'  (Int)
      inputs[1..n]  = items 0..(n-1)  (data_type)
      outputs[0]    = 'Output' (data_type)
    """
    sw = ng.nodes.new('GeometryNodeIndexSwitch')
    sw.location = location
    sw.data_type = data_type            # must be first

    # Default node ships with 2 items. Add extras to reach n_items.
    for _ in range(n_items - 2):
        sw.index_switch_items.new()

    return sw
