"""
holoflow_macros/gn_collection_scatter.py
Blender 5.1 · CC0

Helper: build a Collection Info + Pick Instance GN subgraph on any mesh object.
Adds an 'HF_CollectionScatter' modifier that draws from a named collection.

Usage:
    from holoflow_macros.gn_collection_scatter import add_collection_scatter
    add_collection_scatter(
        obj            = bpy.data.objects["ground"],
        collection     = bpy.data.collections["scatter_kit"],
        num_props      = 4,
        seed           = 42,
        min_distance   = 0.55,
        density_max    = 2.0,
        scale_min      = 0.45,
        scale_max      = 1.6,
    )
"""

import bpy
import math
from typing import Optional


def add_collection_scatter(
    obj: bpy.types.Object,
    collection: bpy.types.Collection,
    num_props: int,
    seed: int = 42,
    min_distance: float = 0.55,
    density_max: float = 2.0,
    scale_min: float = 0.45,
    scale_max: float = 1.6,
    modifier_name: str = "HF_CollectionScatter",
    realize: bool = True,
) -> bpy.types.NodesModifier:
    """
    Add a GN scatter modifier to obj.

    realize=True inserts a Realize Instances node at the output — export-safe
    but locks in the instance geometry.  Set realize=False to keep instances
    live for further GN processing downstream (e.g., chained modifiers).
    """
    mod = obj.modifiers.new(modifier_name, "NODES")
    tree = bpy.data.node_groups.new(f"GN_{modifier_name}", "GeometryNodeTree")
    mod.node_group = tree

    iface = tree.interface
    iface.new_socket("Geometry",   in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",   in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Collection", in_out="INPUT",  socket_type="NodeSocketCollection")
    iface.new_socket("Seed",       in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Min Distance", in_out="INPUT", socket_type="NodeSocketFloat")
    iface.new_socket("Density Max",  in_out="INPUT", socket_type="NodeSocketFloat")
    iface.new_socket("Scale Min",    in_out="INPUT", socket_type="NodeSocketFloat")
    iface.new_socket("Scale Max",    in_out="INPUT", socket_type="NodeSocketFloat")

    # Defaults
    mod["Socket_3"] = seed
    mod["Socket_4"] = min_distance
    mod["Socket_5"] = density_max
    mod["Socket_6"] = scale_min
    mod["Socket_7"] = scale_max
    mod["Socket_2"] = collection

    nodes = tree.nodes
    links = tree.links

    def N(bl_type: str, x: float, y: float) -> bpy.types.Node:
        nd = nodes.new(bl_type)
        nd.location = (x, y)
        return nd

    n_in  = nodes["Group Input"]
    n_out = nodes["Group Output"]
    n_in.location  = (-700, 0)
    n_out.location = (1100 if realize else 900, 0)

    n_dist = N("GeometryNodeDistributePointsOnFaces", (-300, 100))
    n_dist.distribute_method = "POISSON"

    n_col = N("GeometryNodeCollectionInfo", (-300, -120))
    n_col.transform_space = "ORIGINAL"

    n_iop = N("GeometryNodeInstanceOnPoints", (100, 100))
    n_iop.inputs["Pick Instance"].default_value = True

    n_ridx = N("FunctionNodeRandomValue", (-100, 40))
    n_ridx.data_type = "INT"
    n_ridx.inputs["Min"].default_value = 0
    n_ridx.inputs["Max"].default_value = max(0, num_props - 1)

    n_rrot = N("FunctionNodeRandomValue", (-100, -60))
    n_rrot.data_type = "FLOAT"
    n_rrot.inputs[2].default_value = 0.0
    n_rrot.inputs[3].default_value = math.pi * 2

    n_cxyz = N("ShaderNodeCombineXYZ", (50, -80))

    n_rscl = N("FunctionNodeRandomValue", (-100, -180))
    n_rscl.data_type = "FLOAT"

    n_sxyz = N("ShaderNodeCombineXYZ", (50, -200))

    n_rot = N("GeometryNodeRotateInstances", (400, 100))
    n_rot.inputs["Local Space"].default_value = True

    n_scl = N("GeometryNodeScaleInstances", (600, 100))
    n_scl.inputs["Local Space"].default_value = True

    last_geo = n_scl.outputs["Instances"]

    if realize:
        n_real = N("GeometryNodeRealizeInstances", (800, 100))
        links.new(n_scl.outputs["Instances"], n_real.inputs["Geometry"])
        last_geo = n_real.outputs["Geometry"]

    # Ground → Distribute
    links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    links.new(n_in.outputs["Min Distance"], n_dist.inputs["Distance Min"])
    links.new(n_in.outputs["Density Max"],  n_dist.inputs["Density Max"])
    links.new(n_in.outputs["Seed"],         n_dist.inputs["Seed"])
    # Collection
    links.new(n_in.outputs["Collection"],  n_col.inputs["Collection"])
    # IOP
    links.new(n_dist.outputs["Points"],    n_iop.inputs["Points"])
    links.new(n_col.outputs["Instances"],  n_iop.inputs["Instance"])
    links.new(n_ridx.outputs[0],           n_iop.inputs["Instance Index"])
    links.new(n_rrot.outputs[1],           n_cxyz.inputs["Z"])
    links.new(n_cxyz.outputs["Vector"],    n_iop.inputs["Rotation"])
    # Scale
    links.new(n_in.outputs["Scale Min"],   n_rscl.inputs[2])
    links.new(n_in.outputs["Scale Max"],   n_rscl.inputs[3])
    links.new(n_rscl.outputs[1],           n_sxyz.inputs["X"])
    links.new(n_rscl.outputs[1],           n_sxyz.inputs["Y"])
    links.new(n_rscl.outputs[1],           n_sxyz.inputs["Z"])
    # Chain
    links.new(n_iop.outputs["Instances"],  n_rot.inputs["Instances"])
    links.new(n_rot.outputs["Instances"],  n_scl.inputs["Instances"])
    links.new(n_sxyz.outputs["Vector"],    n_scl.inputs["Scale"])
    links.new(last_geo,                    n_out.inputs["Geometry"])

    return mod


def update_palette_count(mod: bpy.types.NodesModifier, num_props: int) -> None:
    """Update the random index max when props are added/removed from the collection."""
    tree = mod.node_group
    for nd in tree.nodes:
        if (nd.bl_idname == "FunctionNodeRandomValue"
                and nd.data_type == "INT"):
            nd.inputs["Max"].default_value = max(0, num_props - 1)
            break
