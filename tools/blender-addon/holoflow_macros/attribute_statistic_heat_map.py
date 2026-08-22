# holoflow_macros/attribute_statistic_heat_map.py
# Blender 5.1 | CC0
#
# Utility: attach a self-calibrating face-area heat-map GN modifier to any
# mesh object.  Uses Attribute Statistic for global normalisation and
# Evaluate on Domain (GeometryNodeFieldOnDomain) for cross-domain transfer.
#
# Usage:
#   from holoflow_macros.attribute_statistic_heat_map import add_area_heat_map
#   add_area_heat_map(bpy.context.active_object, noise_strength=0.25)

import bpy

COOL = (0.02, 0.08, 0.55, 1.0)
WARM = (0.95, 0.30, 0.06, 1.0)


def add_area_heat_map(
    obj: bpy.types.Object,
    noise_strength: float = 0.25,
    noise_scale: float = 3.2,
    face_attr: str = "face_heat",
    vertex_attr: str = "vertex_heat",
    modifier_name: str = "AreaHeatMap",
) -> bpy.types.NodesModifier:
    """Return the new GN modifier after attaching it to *obj*."""
    ng    = bpy.data.node_groups.new(modifier_name, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    ng.interface.new_socket("Geometry",       in_out="INPUT",
                            socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry",       in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")
    s_str = ng.interface.new_socket("Noise_Strength", in_out="INPUT",
                                    socket_type="NodeSocketFloat")
    s_str.default_value = noise_strength
    s_str.min_value = 0.0
    s_str.max_value = 1.0

    n_in   = nodes.new("NodeGroupInput")
    n_out  = nodes.new("NodeGroupOutput")

    # Noise displacement
    n_pos  = nodes.new("GeometryNodeInputPosition")
    n_tex  = nodes.new("ShaderNodeTexNoise")
    n_tex.inputs["Scale"].default_value = noise_scale

    n_mul  = nodes.new("ShaderNodeMath")
    n_mul.operation = "MULTIPLY"

    n_comb = nodes.new("ShaderNodeCombineXYZ")
    n_sp   = nodes.new("GeometryNodeSetPosition")

    # Statistics
    n_area = nodes.new("GeometryNodeInputFaceArea")
    n_stat = nodes.new("GeometryNodeAttributeStatistic")
    n_stat.data_type = "FLOAT"
    n_stat.domain    = "FACE"

    n_rmp  = nodes.new("ShaderNodeMapRange")
    n_rmp.clamp = True
    n_rmp.inputs[3].default_value = 0.0
    n_rmp.inputs[4].default_value = 1.0

    n_ramp = nodes.new("ShaderNodeValToRGB")
    n_ramp.color_ramp.elements[0].color    = COOL
    n_ramp.color_ramp.elements[0].position = 0.0
    n_ramp.color_ramp.elements[1].color    = WARM
    n_ramp.color_ramp.elements[1].position = 1.0

    n_sf = nodes.new("GeometryNodeStoreNamedAttribute")
    n_sf.data_type = "FLOAT_COLOR"
    n_sf.domain    = "FACE"
    n_sf.inputs[2].default_value = face_attr

    n_eod = nodes.new("GeometryNodeFieldOnDomain")
    n_eod.data_type = "FLOAT_COLOR"
    n_eod.domain    = "FACE"

    n_sv = nodes.new("GeometryNodeStoreNamedAttribute")
    n_sv.data_type = "FLOAT_COLOR"
    n_sv.domain    = "POINT"
    n_sv.inputs[2].default_value = vertex_attr

    links.new(n_pos.outputs[0],        n_tex.inputs["Vector"])
    links.new(n_tex.outputs["Fac"],    n_mul.inputs[0])
    links.new(n_in.outputs[1],         n_mul.inputs[1])
    links.new(n_mul.outputs[0],        n_comb.inputs[2])
    links.new(n_in.outputs[0],         n_sp.inputs[0])
    links.new(n_comb.outputs[0],       n_sp.inputs[3])
    links.new(n_sp.outputs[0],         n_stat.inputs[0])
    links.new(n_area.outputs[0],       n_stat.inputs[2])
    links.new(n_area.outputs[0],       n_rmp.inputs[0])
    links.new(n_stat.outputs["Min"],   n_rmp.inputs[1])
    links.new(n_stat.outputs["Max"],   n_rmp.inputs[2])
    links.new(n_rmp.outputs[0],        n_ramp.inputs["Fac"])
    links.new(n_sp.outputs[0],         n_sf.inputs[0])
    links.new(n_ramp.outputs["Color"], n_sf.inputs[3])
    links.new(n_sf.outputs[0],         n_sv.inputs[0])
    links.new(n_ramp.outputs["Color"], n_eod.inputs[0])
    links.new(n_eod.outputs[0],        n_sv.inputs[3])
    links.new(n_sv.outputs[0],         n_out.inputs[0])

    mod            = obj.modifiers.new(modifier_name, "NODES")
    mod.node_group = ng
    return mod
