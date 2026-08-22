# holoflow_macros/foreach_element_stone_chisel.py
# Holoflow Studio | CC0 | Blender 5.1
#
# Macro: HS_AshlarChisel — reusable function that installs the Foreach Element
# Zone ashlar-chisel node group into any open .blend file.
#
# Usage from the Blender scripting editor:
#   import holoflow_macros.foreach_element_stone_chisel as m
#   ng = m.install_ashlar_chisel_group()
#   # Then assign ng to any object's GN modifier.
#
# The group exposes three user-facing sockets:
#   Depth Max   FLOAT  [0, 0.3]   default 0.06 — max stone depth variance
#   Size Jitter FLOAT  [0, 0.05]  default 0.01 — max XY size variance
#   Seed        INT               default 0    — random pattern seed

import bpy

GN_NAME    = "HS_AshlarChisel"
GRID_X     = 8
GRID_Y     = 6
STONE_W    = 0.30
STONE_H    = 0.18
MORTAR_GAP = 0.012
BASE_THICK = 0.04
DEPTH_DEF  = 0.06
JITTER_DEF = 0.010


def install_ashlar_chisel_group(
    grid_x: int   = GRID_X,
    grid_y: int   = GRID_Y,
    stone_w: float = STONE_W,
    stone_h: float = STONE_H,
    mortar: float  = MORTAR_GAP,
) -> bpy.types.NodeGroup:
    """
    Build and return the HS_AshlarChisel GN node group.

    If a group with this name already exists in bpy.data.node_groups it is
    removed first so the call is idempotent (safe to re-run on updates).
    """
    if GN_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_NAME])

    ng    = bpy.data.node_groups.new(GN_NAME, "GeometryNodeTree")
    ng.is_modifier = True
    nodes = ng.nodes
    links = ng.links
    iface = ng.interface

    iface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    d = iface.new_socket("Depth Max",   in_out="INPUT", socket_type="NodeSocketFloat")
    d.default_value, d.min_value, d.max_value = DEPTH_DEF, 0.0, 0.3
    j = iface.new_socket("Size Jitter", in_out="INPUT", socket_type="NodeSocketFloat")
    j.default_value, j.min_value, j.max_value = JITTER_DEF, 0.0, 0.05
    s = iface.new_socket("Seed",        in_out="INPUT", socket_type="NodeSocketInt")
    s.default_value = 0

    gin  = nodes.new("NodeGroupInput");  gin.location  = (-1400, 0)
    gout = nodes.new("NodeGroupOutput"); gout.location = (1300, 0)

    grid = nodes.new("GeometryNodeMeshGrid")
    grid.inputs["Vertices X"].default_value = grid_x + 1
    grid.inputs["Vertices Y"].default_value = grid_y + 1
    grid.inputs["Size X"].default_value     = grid_x * stone_w
    grid.inputs["Size Y"].default_value     = grid_y * stone_h

    inp_pos = nodes.new("GeometryNodeInputPosition")
    cap_ctr = nodes.new("GeometryNodeCaptureAttribute")
    cap_ctr.domain, cap_ctr.data_type = "FACE", "FLOAT_VECTOR"
    links.new(grid.outputs["Mesh"],        cap_ctr.inputs["Geometry"])
    links.new(inp_pos.outputs["Position"], cap_ctr.inputs["Value"])

    rnd = nodes.new("FunctionNodeRandomValue")
    rnd.data_type = "FLOAT"
    rnd.inputs["Min"].default_value = 0.0
    rnd.inputs["Max"].default_value = 1.0
    links.new(gin.outputs["Seed"], rnd.inputs["Seed"])

    cap_rnd = nodes.new("GeometryNodeCaptureAttribute")
    cap_rnd.domain, cap_rnd.data_type = "FACE", "FLOAT"
    links.new(cap_ctr.outputs["Geometry"], cap_rnd.inputs["Geometry"])
    links.new(rnd.outputs["Value"],        cap_rnd.inputs["Value"])

    fe_in  = nodes.new("GeometryNodeForeachGeometryElementInput")
    fe_in.domain = "FACE"
    fe_out = nodes.new("GeometryNodeForeachGeometryElementOutput")
    links.new(cap_rnd.outputs["Geometry"], fe_in.inputs["Geometry"])

    elem_idx = fe_in.outputs["Element Index"]
    zone_geo = fe_in.outputs["Geometry"]

    def sample(attr_out, dtype, domain="FACE"):
        n = nodes.new("GeometryNodeSampleIndex")
        n.domain, n.data_type = domain, dtype
        links.new(zone_geo,  n.inputs["Geometry"])
        links.new(attr_out,  n.inputs["Value"])
        links.new(elem_idx,  n.inputs["Index"])
        return n.outputs["Value"]

    ctr_v = sample(cap_ctr.outputs["Attribute"], "FLOAT_VECTOR")
    rnd_f = sample(cap_rnd.outputs["Attribute"], "FLOAT")

    def math_op(op, a, b, b_const=None):
        n = nodes.new("ShaderNodeMath"); n.operation = op
        if a is not None: links.new(a, n.inputs[0])
        if b is not None: links.new(b, n.inputs[1])
        elif b_const is not None: n.inputs[1].default_value = b_const
        return n.outputs["Value"]

    depth  = math_op("MULTIPLY", rnd_f, gin.outputs["Depth Max"])
    jitter = math_op("MULTIPLY", rnd_f, gin.outputs["Size Jitter"])
    half_j = math_op("MULTIPLY", jitter, None, b_const=0.5)

    sx = nodes.new("ShaderNodeMath"); sx.operation = "SUBTRACT"
    sx.inputs[0].default_value = stone_w - mortar
    links.new(jitter, sx.inputs[1])

    sy = nodes.new("ShaderNodeMath"); sy.operation = "SUBTRACT"
    sy.inputs[0].default_value = stone_h - mortar
    links.new(half_j, sy.inputs[1])

    sz_add = nodes.new("ShaderNodeMath"); sz_add.operation = "ADD"
    sz_add.inputs[0].default_value = BASE_THICK
    links.new(depth, sz_add.inputs[1])

    cxyz_sz = nodes.new("ShaderNodeCombineXYZ")
    links.new(sx.outputs["Value"],     cxyz_sz.inputs["X"])
    links.new(sy.outputs["Value"],     cxyz_sz.inputs["Y"])
    links.new(sz_add.outputs["Value"], cxyz_sz.inputs["Z"])

    box = nodes.new("GeometryNodeMeshCube")
    links.new(cxyz_sz.outputs["Vector"], box.inputs["Size"])

    z_off = math_op("MULTIPLY", depth, None, b_const=0.5)
    sep = nodes.new("ShaderNodeSeparateXYZ")
    links.new(ctr_v, sep.inputs["Vector"])
    cxyz_pos = nodes.new("ShaderNodeCombineXYZ")
    links.new(sep.outputs["X"],  cxyz_pos.inputs["X"])
    links.new(sep.outputs["Y"],  cxyz_pos.inputs["Y"])
    links.new(z_off, cxyz_pos.inputs["Z"])

    set_pos = nodes.new("GeometryNodeSetPosition")
    links.new(box.outputs["Mesh"],        set_pos.inputs["Geometry"])
    links.new(cxyz_pos.outputs["Vector"], set_pos.inputs["Position"])
    links.new(set_pos.outputs["Geometry"], fe_out.inputs["Geometry"])

    set_mat = nodes.new("GeometryNodeSetMaterial")
    links.new(fe_out.outputs["Geometry"], set_mat.inputs["Geometry"])
    links.new(set_mat.outputs["Geometry"], gout.inputs["Geometry"])

    return ng
