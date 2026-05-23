"""
holoflow_macros/gn_mesh_boolean_hard_surface.py
================================================
Reusable helper: build the GNBooleanHoles node group and attach it as a
modifier to an existing object.

Usage:
    from holoflow_macros.gn_mesh_boolean_hard_surface import add_boolean_holes

    add_boolean_holes(
        obj,
        density=4.0,
        hole_radius=0.07,
        hole_depth=0.25,
        seed=7,
    )
"""

import bpy


def add_boolean_holes(
    obj: bpy.types.Object,
    density: float = 4.0,
    hole_radius: float = 0.07,
    hole_depth: float = 0.25,
    ring_verts: int = 12,
    seed: int = 7,
    modifier_name: str = "HoloflowGNBoolean",
) -> bpy.types.Modifier:
    """
    Attach a Geometry Nodes boolean-holes modifier to obj.

    Returns the modifier so callers can adjust Input_N values or keyframe them.
    Does not modify or apply any pre-existing modifiers on the object.
    """
    tree_name = f"{modifier_name}_tree"

    # Re-use an existing node group with the same name so multiple objects can
    # share the same GN datablock (changing the tree affects all linked objects).
    tree = bpy.data.node_groups.get(tree_name)
    if tree is None:
        tree = _build_tree(tree_name, ring_verts)

    mod = obj.modifiers.new(name=modifier_name, type="NODES")
    mod.node_group = tree

    mod["Input_2"] = density
    mod["Input_3"] = hole_radius
    mod["Input_4"] = hole_depth
    mod["Input_5"] = seed

    return mod


def _build_tree(name: str, ring_verts: int) -> bpy.types.NodeTree:
    tree = bpy.data.node_groups.new(type="GeometryNodeTree", name=name)

    tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")

    s = tree.interface.new_socket("Hole Density", in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value, s.min_value, s.max_value = 4.0, 0.1, 20.0

    s = tree.interface.new_socket("Hole Radius", in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value, s.min_value, s.max_value = 0.07, 0.01, 0.20

    s = tree.interface.new_socket("Hole Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    s.default_value, s.min_value, s.max_value = 0.25, 0.05, 1.0

    s = tree.interface.new_socket("Seed", in_out="INPUT", socket_type="NodeSocketInt")
    s.default_value, s.min_value = 7, 0

    nodes = tree.nodes
    links = tree.links

    def n(t, x, y):
        nd = nodes.new(t); nd.location = (x, y); return nd

    ni   = n("NodeGroupInput",  -900, 0)
    no   = n("NodeGroupOutput",  900, 0)
    cyl  = n("GeometryNodeMeshCylinder", -600, -200)
    dist = n("GeometryNodeDistributePointsOnFaces", -600, 200)
    inst = n("GeometryNodeInstanceOnPoints", -200, 0)
    real = n("GeometryNodeRealizeInstances", 0, -200)
    bln  = n("GeometryNodeMeshBoolean", 200, 0)
    sms  = n("GeometryNodeSetShadeSmooth", 500, 0)

    cyl.fill_type = "NGON"
    cyl.inputs["Vertices"].default_value = ring_verts
    dist.distribute_method = "POISSON"
    bln.operation = "DIFFERENCE"
    bln.solver = "EXACT"
    bln.inputs["Hole Tolerant"].default_value = True
    sms.domain = "FACE"
    sms.inputs["Shade Smooth"].default_value = True

    links.new(ni.outputs["Geometry"],    dist.inputs["Mesh"])
    links.new(ni.outputs["Hole Density"], dist.inputs["Density Max"])
    links.new(ni.outputs["Seed"],         dist.inputs["Seed"])
    links.new(ni.outputs["Hole Radius"],  cyl.inputs["Radius"])
    links.new(ni.outputs["Hole Depth"],   cyl.inputs["Depth"])
    links.new(dist.outputs["Points"],    inst.inputs["Points"])
    links.new(cyl.outputs["Mesh"],       inst.inputs["Instance"])
    links.new(inst.outputs["Instances"], real.inputs["Geometry"])
    links.new(ni.outputs["Geometry"],    bln.inputs[0])
    links.new(real.outputs["Geometry"],  bln.inputs[1])
    links.new(bln.outputs["Mesh"],       sms.inputs["Geometry"])
    links.new(sms.outputs["Geometry"],   no.inputs["Geometry"])

    return tree
