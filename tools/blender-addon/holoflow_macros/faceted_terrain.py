"""holoflow_macros.faceted_terrain
Blender 5.1 macro — build a Geometry Nodes faceted terrain on the
active object and tag it with the holoflow:facet export flag.

Standalone import or use inside the holoflow_webxr_exporter operator.
CC0 — public domain.

Usage (from Blender Script Editor or another add-on):
    from holoflow_macros.faceted_terrain import apply_faceted_terrain_gn
    apply_faceted_terrain_gn(obj, scale=3.2, detail=4.0, disp_max=1.6, seed=42)
"""

import bpy

GN_TREE_NAME = "HF_FacetedTerrain"


def _n(nodes: bpy.types.Nodes, idname: str, col: int, row: int) -> bpy.types.Node:
    nd = nodes.new(idname)
    nd.location = (col * 220, row * -200)
    return nd


def build_faceted_terrain_tree(
    scale: float      = 3.2,
    detail: float     = 4.0,
    roughness: float  = 0.65,
    disp_max: float   = 1.6,
    seed: int         = 42,
    tree_name: str    = GN_TREE_NAME,
) -> bpy.types.NodeTree:
    """
    Build (or replace) the GN_FacetedTerrain node tree.

    Parameters mirror blueprint.py constants — call with keyword
    arguments to override any of them before assigning to a modifier.
    """
    if tree_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[tree_name])

    tree  = bpy.data.node_groups.new(tree_name, "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi      = _n(nodes, "NodeGroupInput",              0, 0)
    go      = _n(nodes, "NodeGroupOutput",             7, 0)
    shade   = _n(nodes, "GeometryNodeSetShadeSmooth",  1, 0)
    pos     = _n(nodes, "GeometryNodeInputPosition",   2, 1)
    noise   = _n(nodes, "ShaderNodeTexNoise",          3, 1)
    remap   = _n(nodes, "ShaderNodeMapRange",          4, 1)
    combine = _n(nodes, "ShaderNodeCombineXYZ",        5, 1)
    set_pos = _n(nodes, "GeometryNodeSetPosition",     6, 0)

    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = False

    noise.noise_dimensions                  = "3D"
    noise.inputs["Scale"].default_value     = scale
    noise.inputs["Detail"].default_value    = detail
    noise.inputs["Roughness"].default_value = roughness
    noise.inputs["W"].default_value         = float(seed) * 0.01

    remap.inputs["From Min"].default_value = 0.0
    remap.inputs["From Max"].default_value = 1.0
    remap.inputs["To Min"].default_value   = 0.0
    remap.inputs["To Max"].default_value   = disp_max

    links.new(gi.outputs["Geometry"],      shade.inputs["Geometry"])
    links.new(shade.outputs["Geometry"],   set_pos.inputs["Geometry"])
    links.new(pos.outputs["Position"],     noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],        remap.inputs["Value"])
    links.new(remap.outputs["Result"],     combine.inputs["Z"])
    links.new(combine.outputs["Vector"],   set_pos.inputs["Offset"])
    links.new(set_pos.outputs["Geometry"], go.inputs["Geometry"])

    return tree


def apply_faceted_terrain_gn(
    obj: bpy.types.Object,
    modifier_name: str = "HF_FacetedTerrain",
    **kwargs,
) -> bpy.types.Modifier:
    """
    Attach the faceted-terrain GN modifier to obj.
    Keyword args are forwarded to build_faceted_terrain_tree().
    Sets holoflow:facet custom property as a side-effect.
    """
    tree = build_faceted_terrain_tree(**kwargs)
    mod  = obj.modifiers.new(modifier_name, "NODES")
    mod.node_group = tree
    obj["holoflow:facet"] = True
    return mod
