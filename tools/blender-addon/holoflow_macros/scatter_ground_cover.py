"""
holoflow_macros/scatter_ground_cover.py — Reusable ground-cover scatter utility
Blender 5.1  |  CC0 / Holoflow Studio
================================================================================
Exposes apply_scatter_gn_tree() for use by other scripts or the holoflow
add-on menu.  Takes a target mesh object and a collection of scatter instances,
builds the Distribute Points → Instance on Points GN tree, and attaches it as
a NODES modifier.
"""

import bpy

# Default parameters — override via kwargs or at top of calling script
DEFAULTS = dict(
    dist_min    = 0.08,   # Poisson disk minimum separation (metres)
    density_max = 12.0,   # points / m² at weight = 1.0
    density_attr= "scatter_weight",  # vertex-group attribute name
    scale_min   = 0.55,
    scale_max   = 1.25,
    seed_dist   = 7,
    seed_idx    = 11,
    seed_scale  = 42,
    seed_yaw    = 13,
)


def _lk(tree, a, b):
    tree.links.new(a, b)


def apply_scatter_gn_tree(
    target: bpy.types.Object,
    scatter_col: bpy.types.Collection,
    **kwargs,
) -> bpy.types.NodesModifier:
    """
    Build and attach a ground-cover scatter GN tree to `target`.

    Parameters
    ----------
    target      : Object with MESH data — the surface to scatter onto.
    scatter_col : Collection whose children are the scatter instance meshes.
    **kwargs    : Any key from DEFAULTS to override.
    """
    p = {**DEFAULTS, **kwargs}
    mod  = target.modifiers.new("ScatterCover", 'NODES')
    tree = bpy.data.node_groups.new("ScatterGroundCover", 'GeometryNodeTree')
    mod.node_group = tree
    ns = tree.nodes
    ns.clear()

    def N(bl_id, x, y):
        n = ns.new(bl_id)
        n.location = (x, y)
        return n

    n_in   = N('NodeGroupInput',  -600,  0)
    n_out  = N('NodeGroupOutput',  920,  0)
    tree.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    tree.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    n_attr = N('GeometryNodeInputNamedAttribute', -400, -120)
    n_attr.data_type = 'FLOAT'
    n_attr.inputs["Name"].default_value = p["density_attr"]

    n_dist = N('GeometryNodeDistributePointsOnFaces', -160, 0)
    n_dist.distribution_type = 'POISSON_DISK'
    n_dist.inputs["Distance Min"].default_value  = p["dist_min"]
    n_dist.inputs["Density Max"].default_value   = p["density_max"]
    n_dist.inputs["Seed"].default_value          = p["seed_dist"]

    n_col  = N('GeometryNodeCollectionInfo', -160, -260)
    n_col.transform_space = 'RELATIVE'
    n_col.inputs["Separate Children"].default_value = True
    n_col.inputs["Reset Children"].default_value    = False
    n_col.inputs["Collection"].default_value        = scatter_col

    n_idx  = N('FunctionNodeRandomValue', -160, -380)
    n_idx.data_type = 'INT'
    n_idx.inputs["Min"].default_value  = 0
    n_idx.inputs["Max"].default_value  = max(0, len(scatter_col.objects) - 1)
    n_idx.inputs["Seed"].default_value = p["seed_idx"]

    n_align = N('FunctionNodeAlignEulerToVector', 80, -80)
    n_align.axis       = 'Z'
    n_align.pivot_axis = 'AUTO'
    n_align.inputs["Factor"].default_value = 1.0

    n_yaw = N('FunctionNodeRandomValue', 80, -200)
    n_yaw.data_type = 'FLOAT_VECTOR'
    n_yaw.inputs["Min"].default_value   = (0.0, 0.0, 0.0)
    n_yaw.inputs["Max"].default_value   = (0.0, 0.0, 6.2832)
    n_yaw.inputs["Seed"].default_value  = p["seed_yaw"]

    n_inst = N('GeometryNodeInstanceOnPoints', 320, 0)
    n_inst.inputs["Pick Instance"].default_value = True

    n_srnd = N('FunctionNodeRandomValue', 320, -200)
    n_srnd.data_type = 'FLOAT'
    n_srnd.inputs["Min"].default_value   = p["scale_min"]
    n_srnd.inputs["Max"].default_value   = p["scale_max"]
    n_srnd.inputs["Seed"].default_value  = p["seed_scale"]

    n_scale = N('GeometryNodeScaleInstances', 540,  0)
    n_scale.inputs["Local Space"].default_value = True

    n_real  = N('GeometryNodeRealizeInstances', 720,  0)
    n_join  = N('GeometryNodeJoinGeometry',     880,  0)

    _lk(tree, n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    _lk(tree, n_attr.outputs["Attribute"], n_dist.inputs["Density"])
    _lk(tree, n_dist.outputs["Points"],    n_inst.inputs["Points"])
    _lk(tree, n_dist.outputs["Normal"],    n_align.inputs["Vector"])
    _lk(tree, n_align.outputs["Rotation"], n_yaw.inputs["Min"])
    _lk(tree, n_yaw.outputs["Value"],      n_inst.inputs["Rotation"])
    _lk(tree, n_col.outputs["Geometry"],   n_inst.inputs["Instance"])
    _lk(tree, n_idx.outputs["Value"],      n_inst.inputs["Instance Index"])
    _lk(tree, n_inst.outputs["Instances"], n_scale.inputs["Instances"])
    _lk(tree, n_srnd.outputs["Value"],     n_scale.inputs["Scale"])
    _lk(tree, n_scale.outputs["Instances"],n_real.inputs["Geometry"])
    _lk(tree, n_real.outputs["Geometry"],  n_join.inputs["Geometry"])
    _lk(tree, n_in.outputs["Geometry"],    n_join.inputs["Geometry"])
    _lk(tree, n_join.outputs["Geometry"],  n_out.inputs["Geometry"])

    return mod
