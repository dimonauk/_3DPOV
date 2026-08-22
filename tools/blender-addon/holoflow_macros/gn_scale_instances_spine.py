"""
holoflow_macros/gn_scale_instances_spine.py
Reusable helper: attach a Scale Instances noise-driven spine-growth GN modifier
to any mesh object. Exposed as a single function so other scripts can call it
without duplicating the full blueprint.

Usage:
    from holoflow_macros.gn_scale_instances_spine import attach_spine_growth
    attach_spine_growth(bpy.context.active_object, cone_ob=my_cone)

Licence: CC0 · Holoflow Studio 2026
"""

import bpy
import math


def attach_spine_growth(
    target_ob: "bpy.types.Object",
    cone_ob: "bpy.types.Object",
    *,
    noise_scale: float = 2.4,
    noise_detail: float = 3.0,
    noise_rough: float = 0.55,
    min_scale: float = 0.18,
    max_scale: float = 1.00,
    lat_compress: float = 0.42,
    modifier_name: str = "SpineGrowth_GN",
) -> "bpy.types.NodesModifier":
    """
    Add a Scale Instances spine-growth GN modifier to target_ob.

    Returns the modifier so the caller can keyframe Grow_Factor ('Input_2').

    Key parameter notes:
    - lat_compress: 0 = poles completely flat, 1 = no polar compression.
      Values 0.3–0.5 look naturalistic.
    - min_scale / max_scale: fraction of cone's SPINE_LENGTH — both must be
      in [0, 1]. min_scale > 0 ensures no zero-height degenerate instances.
    - noise_scale: inverse of patch radius. 1.0 = very large blobs,
      5.0 = fine-grained stipple variation.
    """
    mod  = target_ob.modifiers.new(modifier_name, "NODES")
    tree = bpy.data.node_groups.new(f"{modifier_name}_Tree", "GeometryNodeTree")
    mod.node_group = tree
    nodes = tree.nodes
    links = tree.links

    def N(type_id, x=0, y=0):
        n = nodes.new(type_id); n.location = (x, y); return n

    tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    grow_sock = tree.interface.new_socket(
        "Grow Factor", in_out="INPUT", socket_type="NodeSocketFloat"
    )
    grow_sock.default_value = 1.0
    grow_sock.min_value      = 0.0
    grow_sock.max_value      = 1.0

    gi  = N("NodeGroupInput",  -900, 0)
    go  = N("NodeGroupOutput",  800, 0)

    shade = N("GeometryNodeSetShadeSmooth", -700, 0)
    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = False
    links.new(gi.outputs["Geometry"], shade.inputs["Geometry"])

    inp_normal = N("GeometryNodeInputNormal",        -700, 250)
    aln        = N("FunctionNodeAlignEulerToVector", -500, 250)
    aln.axis = "Z"; aln.pivot_axis = "AUTO"
    links.new(inp_normal.outputs["Normal"], aln.inputs["Vector"])

    oi = N("GeometryNodeObjectInfo", -500, -50)
    oi.transform_space              = "ORIGINAL"
    oi.inputs["Object"].default_value = cone_ob

    iop = N("GeometryNodeInstanceOnPoints", -200, 0)
    links.new(shade.outputs["Geometry"], iop.inputs["Points"])
    links.new(oi.outputs["Geometry"],    iop.inputs["Instance"])
    links.new(aln.outputs["Rotation"],   iop.inputs["Rotation"])

    inp_pos = N("GeometryNodeInputPosition", -900, -400)
    noise   = N("ShaderNodeTexNoise",        -700, -400)
    noise.noise_dimensions              = "3D"
    noise.inputs["Scale"].default_value      = noise_scale
    noise.inputs["Detail"].default_value     = noise_detail
    noise.inputs["Roughness"].default_value  = noise_rough
    noise.inputs["Distortion"].default_value = 0.0
    links.new(inp_pos.outputs["Position"], noise.inputs["Vector"])

    noise_map = N("ShaderNodeMapRange", -500, -400)
    noise_map.data_type = "FLOAT"; noise_map.interpolation_type = "SMOOTHSTEP"
    noise_map.inputs["From Min"].default_value = 0.0
    noise_map.inputs["From Max"].default_value = 1.0
    noise_map.inputs["To Min"].default_value   = min_scale
    noise_map.inputs["To Max"].default_value   = max_scale
    links.new(noise.outputs["Fac"], noise_map.inputs["Value"])

    sep_xyz = N("ShaderNodeSeparateXYZ", -900, -600)
    links.new(inp_pos.outputs["Position"], sep_xyz.inputs["Vector"])

    abs_z = N("ShaderNodeMath", -700, -600); abs_z.operation = "ABSOLUTE"
    links.new(sep_xyz.outputs["Z"], abs_z.inputs[0])

    lat_map = N("ShaderNodeMapRange", -500, -600)
    lat_map.data_type = "FLOAT"; lat_map.interpolation_type = "LINEAR"
    lat_map.inputs["From Min"].default_value = 0.0
    lat_map.inputs["From Max"].default_value = 1.0
    lat_map.inputs["To Min"].default_value   = 1.0
    lat_map.inputs["To Max"].default_value   = lat_compress
    links.new(abs_z.outputs["Value"], lat_map.inputs["Value"])

    mul1 = N("ShaderNodeMath", -250, -500); mul1.operation = "MULTIPLY"
    links.new(noise_map.outputs["Result"], mul1.inputs[0])
    links.new(lat_map.outputs["Result"],   mul1.inputs[1])

    mul2 = N("ShaderNodeMath", 0, -500); mul2.operation = "MULTIPLY"
    links.new(mul1.outputs["Value"],     mul2.inputs[0])
    links.new(gi.outputs["Grow Factor"], mul2.inputs[1])

    comb = N("ShaderNodeCombineXYZ", 200, -500)
    comb.inputs["X"].default_value = 1.0
    comb.inputs["Y"].default_value = 1.0
    links.new(mul2.outputs["Value"], comb.inputs["Z"])

    # Local Space = True: scale along instance's own axes (not world Z).
    # Center = (0,0,0) local: growth from base vertex, not midpoint or tip.
    si = N("GeometryNodeScaleInstances", 400, 0)
    si.inputs["Local Space"].default_value = True
    si.inputs["Center"].default_value      = (0.0, 0.0, 0.0)
    links.new(iop.outputs["Instances"], si.inputs["Instances"])
    links.new(comb.outputs["Vector"],   si.inputs["Scale"])

    ri = N("GeometryNodeRealizeInstances", 600, 0)
    links.new(si.outputs["Instances"], ri.inputs["Geometry"])
    links.new(ri.outputs["Geometry"],  go.inputs["Geometry"])

    return mod
