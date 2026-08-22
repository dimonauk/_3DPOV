"""
holoflow_macros/gn_scatter_density_mask.py
Blender 5.1 · CC0 — Holoflow Studio

One-call helper: add the HF_ScatterDensityMask GN modifier to any mesh object.
The caller supplies the instance collection and the weight-group name; all other
parameters arrive as live modifier-panel controls.

Usage
-----
    from holoflow_macros import gn_scatter_density_mask as sc
    sc.add_scatter(obj, collection=bpy.data.collections["Rocks"])

The modifier appears in Properties ▸ Modifier with sliders for:
  Density Max, Min Distance, Scale Min, Scale Max, Seed
"""

import bpy
import math

GN_TREE_NAME = "HF_ScatterDensityMask"

def _build_or_get_tree(
    instance_col: bpy.types.Collection,
    weight_group: str = "scatter_density",
) -> bpy.types.NodeTree:
    """Return the shared GN tree, creating it if absent."""
    if GN_TREE_NAME in bpy.data.node_groups:
        return bpy.data.node_groups[GN_TREE_NAME]

    ng    = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
    iface = ng.interface
    nodes = ng.nodes
    links = ng.links

    iface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")

    s_dmax             = iface.new_socket("Density Max",  in_out="INPUT",
                             socket_type="NodeSocketFloat")
    s_dmax.default_value = 6.0
    s_dmax.min_value     = 0.0
    s_dmax.max_value     = 30.0

    s_mind             = iface.new_socket("Min Distance", in_out="INPUT",
                             socket_type="NodeSocketFloat")
    s_mind.subtype       = "DISTANCE"
    s_mind.default_value = 0.25
    s_mind.min_value     = 0.01
    s_mind.max_value     = 2.0

    s_smin             = iface.new_socket("Scale Min",    in_out="INPUT",
                             socket_type="NodeSocketFloat")
    s_smin.default_value = 0.08

    s_smax             = iface.new_socket("Scale Max",    in_out="INPUT",
                             socket_type="NodeSocketFloat")
    s_smax.default_value = 0.22

    s_seed             = iface.new_socket("Seed",         in_out="INPUT",
                             socket_type="NodeSocketInt")
    s_seed.default_value = 42

    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-700, 0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location  = ( 900, 0)

    n_attr = nodes.new("GeometryNodeInputNamedAttribute")
    n_attr.data_type                    = "FLOAT"
    n_attr.inputs["Name"].default_value = weight_group
    n_attr.location                     = (-500, -200)

    n_mul           = nodes.new("ShaderNodeMath")
    n_mul.operation = "MULTIPLY"
    n_mul.location  = (-280, -160)

    n_dist                   = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.distribute_method = "POISSON"
    n_dist.location          = (-60, 80)

    n_ryaw              = nodes.new("FunctionNodeRandomValue")
    n_ryaw.data_type    = "FLOAT"
    n_ryaw.inputs["Min"].default_value = 0.0
    n_ryaw.inputs["Max"].default_value = math.tau
    n_ryaw.location     = (180, -120)

    n_rote        = nodes.new("FunctionNodeRotateEuler")
    n_rote.type   = "AXIS_ANGLE"
    n_rote.space  = "LOCAL"
    n_rote.inputs["Axis"].default_value = (0.0, 0.0, 1.0)
    n_rote.location = (420, -60)

    n_rscl              = nodes.new("FunctionNodeRandomValue")
    n_rscl.data_type    = "FLOAT"
    n_rscl.location     = (180, -300)

    n_cxyz         = nodes.new("ShaderNodeCombineXYZ")
    n_cxyz.location = (420, -240)

    n_rpick              = nodes.new("FunctionNodeRandomValue")
    n_rpick.data_type    = "INT"
    n_rpick.inputs["Min"].default_value = 0
    n_rpick.inputs["Max"].default_value = max(0, len(instance_col.objects) - 1)
    n_rpick.location     = (180, -480)

    n_col                 = nodes.new("GeometryNodeCollectionInfo")
    n_col.transform_space = "RELATIVE"
    n_col.inputs["Collection"].default_value        = instance_col
    n_col.inputs["Separate Children"].default_value = True
    n_col.inputs["Reset Children"].default_value    = False
    n_col.location = (180, 200)

    n_iop          = nodes.new("GeometryNodeInstanceOnPoints")
    n_iop.inputs["Pick Instance"].default_value = True
    n_iop.location = (640, 80)

    links.new(n_attr.outputs["Attribute"],  n_mul.inputs[0])
    links.new(n_in.outputs["Density Max"],  n_mul.inputs[1])
    links.new(n_in.outputs["Geometry"],     n_dist.inputs["Mesh"])
    links.new(n_mul.outputs["Value"],       n_dist.inputs["Density Max"])
    links.new(n_in.outputs["Min Distance"], n_dist.inputs["Distance Min"])
    links.new(n_in.outputs["Seed"],         n_dist.inputs["Seed"])
    links.new(n_dist.outputs["Rotation"],   n_rote.inputs["Rotation"])
    links.new(n_in.outputs["Seed"],         n_ryaw.inputs["Seed"])
    links.new(n_ryaw.outputs["Value"],      n_rote.inputs["Angle"])
    links.new(n_in.outputs["Scale Min"],    n_rscl.inputs["Min"])
    links.new(n_in.outputs["Scale Max"],    n_rscl.inputs["Max"])
    links.new(n_in.outputs["Seed"],         n_rscl.inputs["Seed"])
    links.new(n_rscl.outputs["Value"],      n_cxyz.inputs["X"])
    links.new(n_rscl.outputs["Value"],      n_cxyz.inputs["Y"])
    links.new(n_rscl.outputs["Value"],      n_cxyz.inputs["Z"])
    links.new(n_in.outputs["Seed"],         n_rpick.inputs["Seed"])
    links.new(n_dist.outputs["Points"],     n_iop.inputs["Points"])
    links.new(n_col.outputs["Instances"],   n_iop.inputs["Instance"])
    links.new(n_rpick.outputs["Value"],     n_iop.inputs["Instance Index"])
    links.new(n_rote.outputs["Rotation"],   n_iop.inputs["Rotation"])
    links.new(n_cxyz.outputs["Vector"],     n_iop.inputs["Scale"])
    links.new(n_iop.outputs["Instances"],   n_out.inputs["Geometry"])

    return ng


def add_scatter(
    ob: bpy.types.Object,
    collection: bpy.types.Collection,
    weight_group: str = "scatter_density",
    density_max: float = 6.0,
    min_distance: float = 0.25,
    scale_min: float = 0.08,
    scale_max: float = 0.22,
    seed: int = 42,
) -> bpy.types.NodesModifier:
    """Attach HF_ScatterDensityMask to *ob* and set default values."""
    ng  = _build_or_get_tree(collection, weight_group)
    mod = ob.modifiers.new(GN_TREE_NAME, "NODES")
    mod.node_group = ng
    # Override defaults via modifier inputs dict (socket identifiers)
    for sock in ng.interface.items_tree:
        if not hasattr(sock, 'default_value'):
            continue
        val_map = {
            "Density Max":  density_max,
            "Min Distance": min_distance,
            "Scale Min":    scale_min,
            "Scale Max":    scale_max,
            "Seed":         seed,
        }
        if sock.name in val_map and sock.identifier in mod:
            mod[sock.identifier] = val_map[sock.name]
    return mod
