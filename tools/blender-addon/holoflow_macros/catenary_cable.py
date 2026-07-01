# holoflow_macros/catenary_cable.py
# Blender 5.1 | CC0 | Holoflow Studio
#
# Reusable factory for the CatenaryCable Geometry Nodes group.
# Import in any blueprint.py:
#   from holoflow_macros.catenary_cable import build_catenary_node_group, DEFAULTS

import bpy

DEFAULTS = {
    "sag_param":    1.20,
    "span":         4.00,
    "resample_pts": 32,
    "profile_res":  6,
    "profile_r":    0.015,
    "taper_tip":    0.40,
}


def build_catenary_node_group(
    ng_name:      str   = "CatenaryCable",
    sag_param:    float = DEFAULTS["sag_param"],
    span:         float = DEFAULTS["span"],
    resample_pts: int   = DEFAULTS["resample_pts"],
    profile_res:  int   = DEFAULTS["profile_res"],
    profile_r:    float = DEFAULTS["profile_r"],
    taper_tip:    float = DEFAULTS["taper_tip"],
) -> bpy.types.NodeGroup:
    """
    Build (or rebuild) the CatenaryCable GN node group.

    Catenary formula:  z(x) = a · (cosh(x/a) − cosh(S/(2a)))
    x ∈ [−S/2, +S/2]; z = 0 at both endpoints; z < 0 at centre.

    Returns the node group.  Assign to a NODES modifier:
        mod = obj.modifiers.new('CatenaryCable', 'NODES')
        mod.node_group = build_catenary_node_group()
    """
    existing = bpy.data.node_groups.get(ng_name)
    if existing:
        bpy.data.node_groups.remove(existing)

    ng    = bpy.data.node_groups.new(ng_name, "GeometryNodeTree")
    ng.is_modifier = True
    iface = ng.interface
    nodes = ng.nodes
    links = ng.links

    # group sockets
    iface.new_socket("Geometry",      in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",      in_out="INPUT",  socket_type="NodeSocketGeometry")
    s_sag  = iface.new_socket("Sag Parameter", in_out="INPUT", socket_type="NodeSocketFloat")
    s_sag.default_value = sag_param; s_sag.min_value = 0.05
    s_span = iface.new_socket("Span",           in_out="INPUT", socket_type="NodeSocketFloat")
    s_span.default_value = span; s_span.min_value = 0.10

    gin  = nodes.new("NodeGroupInput");  gin.location  = (-900, 0)
    gout = nodes.new("NodeGroupOutput"); gout.location = ( 700, 0)

    # baseline
    line   = nodes.new("GeometryNodeCurvePrimitiveLine")
    line.inputs["Start"].default_value = (-span / 2, 0, 0)
    line.inputs["End"].default_value   = ( span / 2, 0, 0)
    resamp = nodes.new("GeometryNodeResampleCurve")
    resamp.mode = "COUNT"; resamp.inputs["Count"].default_value = resample_pts
    links.new(line.outputs["Curve"], resamp.inputs["Curve"])

    # t → x
    spm   = nodes.new("GeometryNodeSplineParameter")
    msub  = nodes.new("ShaderNodeMath"); msub.operation  = "SUBTRACT"; msub.inputs[1].default_value = 0.5
    mspan = nodes.new("ShaderNodeMath"); mspan.operation = "MULTIPLY"
    links.new(spm.outputs["Factor"],  msub.inputs[0])
    links.new(msub.outputs["Value"],  mspan.inputs[0])
    links.new(gin.outputs["Span"],    mspan.inputs[1])

    # cosh(x/a)
    mdxa  = nodes.new("ShaderNodeMath"); mdxa.operation  = "DIVIDE"
    mcxa  = nodes.new("ShaderNodeMath"); mcxa.operation  = "COSH"
    links.new(mspan.outputs["Value"],          mdxa.inputs[0])
    links.new(gin.outputs["Sag Parameter"],    mdxa.inputs[1])
    links.new(mdxa.outputs["Value"],           mcxa.inputs[0])

    # cosh(S/(2a))
    mhalf = nodes.new("ShaderNodeMath"); mhalf.operation = "MULTIPLY"; mhalf.inputs[1].default_value = 0.5
    mdhsa = nodes.new("ShaderNodeMath"); mdhsa.operation = "DIVIDE"
    mchsa = nodes.new("ShaderNodeMath"); mchsa.operation = "COSH"
    links.new(gin.outputs["Span"],             mhalf.inputs[0])
    links.new(mhalf.outputs["Value"],          mdhsa.inputs[0])
    links.new(gin.outputs["Sag Parameter"],    mdhsa.inputs[1])
    links.new(mdhsa.outputs["Value"],          mchsa.inputs[0])

    # z = a·(cosh(x/a) − cosh(S/2a))
    ms2 = nodes.new("ShaderNodeMath"); ms2.operation = "SUBTRACT"
    mma = nodes.new("ShaderNodeMath"); mma.operation = "MULTIPLY"
    links.new(mcxa.outputs["Value"],           ms2.inputs[0])
    links.new(mchsa.outputs["Value"],          ms2.inputs[1])
    links.new(ms2.outputs["Value"],            mma.inputs[0])
    links.new(gin.outputs["Sag Parameter"],    mma.inputs[1])

    cxyz = nodes.new("ShaderNodeCombineXYZ")
    cxyz.inputs["X"].default_value = 0.0; cxyz.inputs["Y"].default_value = 0.0
    links.new(mma.outputs["Value"], cxyz.inputs["Z"])

    setpos = nodes.new("GeometryNodeSetPosition")
    links.new(resamp.outputs["Curve"],  setpos.inputs["Geometry"])
    links.new(cxyz.outputs["Vector"],   setpos.inputs["Offset"])

    # parabolic taper: 4t(1−t)
    m4t   = nodes.new("ShaderNodeMath"); m4t.operation   = "MULTIPLY"; m4t.inputs[1].default_value = 4.0
    m1mt  = nodes.new("ShaderNodeMath"); m1mt.operation  = "SUBTRACT"; m1mt.inputs[0].default_value = 1.0
    mtenv = nodes.new("ShaderNodeMath"); mtenv.operation = "MULTIPLY"
    mscl  = nodes.new("ShaderNodeMath"); mscl.operation  = "MULTIPLY"; mscl.inputs[1].default_value = 1.0 - taper_tip
    madd  = nodes.new("ShaderNodeMath"); madd.operation  = "ADD";      madd.inputs[0].default_value = taper_tip
    mrad  = nodes.new("ShaderNodeMath"); mrad.operation  = "MULTIPLY"; mrad.inputs[1].default_value = profile_r
    links.new(spm.outputs["Factor"],   m4t.inputs[0])
    links.new(spm.outputs["Factor"],   m1mt.inputs[1])
    links.new(m4t.outputs["Value"],    mtenv.inputs[0])
    links.new(m1mt.outputs["Value"],   mtenv.inputs[1])
    links.new(mtenv.outputs["Value"],  mscl.inputs[0])
    links.new(mscl.outputs["Value"],   madd.inputs[1])
    links.new(madd.outputs["Value"],   mrad.inputs[0])

    setrad = nodes.new("GeometryNodeSetCurveRadius")
    links.new(setpos.outputs["Curve"],  setrad.inputs["Curve"])
    links.new(mrad.outputs["Value"],    setrad.inputs["Radius"])

    # sweep
    circle = nodes.new("GeometryNodeCurvePrimitiveCircle")
    circle.mode = "RADIUS"
    circle.inputs["Resolution"].default_value = profile_res
    circle.inputs["Radius"].default_value     = 1.0

    c2m = nodes.new("GeometryNodeCurveToMesh")
    c2m.inputs["Fill Caps"].default_value = False
    links.new(setrad.outputs["Curve"],  c2m.inputs["Curve"])
    links.new(circle.outputs["Curve"],  c2m.inputs["Profile Curve"])
    links.new(c2m.outputs["Mesh"],      gout.inputs["Geometry"])

    return ng
