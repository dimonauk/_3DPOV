"""
holoflow_macros/gn_repeat_zone_crystal_cluster.py
Reusable macro: build a Repeat Zone crystal-cluster GN tree.

Usage:
    from holoflow_macros.gn_repeat_zone_crystal_cluster import build_crystal_cluster_gn

    tree = build_crystal_cluster_gn()
    mod  = obj.modifiers.new('GNCrystal', 'NODES')
    mod.node_group = tree
"""

import bpy

GOLDEN_ANGLE_RAD = 2.399963  # 137.508° × π/180


def build_crystal_cluster_gn(
    name: str = "GNCrystalCluster",
    crystal_count: int = 12,
    spiral_radius: float = 0.8,
    base_scale: float = 0.18,
    tip_scale: float = 0.06,
    cone_vertices: int = 8,
    base_height: float = 2.5,
) -> bpy.types.GeometryNodeTree:
    """
    Build and return a GN tree containing a Repeat Zone crystal cluster.

    All six parameters become live modifier sliders. The tree is stateless:
    per-shard position and scale are derived solely from the loop index;
    only the accumulated geometry is carried as a body channel.
    """
    tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name=name)
    nodes = tree.nodes
    links = tree.links

    # I/O
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

    def _i(n, v, lo=1, hi=256):
        s = tree.interface.new_socket(n, in_out="INPUT", socket_type="NodeSocketInt")
        s.default_value, s.min_value, s.max_value = v, lo, hi

    def _f(n, v, lo=0.0, hi=10.0):
        s = tree.interface.new_socket(n, in_out="INPUT", socket_type="NodeSocketFloat")
        s.default_value, s.min_value, s.max_value = v, lo, hi

    _i("Crystal Count",  crystal_count,  1, 64)
    _f("Spiral Radius",  spiral_radius, 0.01, 5.0)
    _f("Base Scale",     base_scale,    0.01, 2.0)
    _f("Tip Scale",      tip_scale,     0.01, 2.0)
    _i("Cone Vertices",  cone_vertices,  3, 32)
    _f("Base Height",    base_height,   0.1, 10.0)

    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1000, 0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 1400, 0)

    n_golden = nodes.new("ShaderNodeValue")
    n_golden.outputs[0].default_value = GOLDEN_ANGLE_RAD
    n_golden.label = "Golden Angle (rad)"
    n_golden.location = (-800, -250)

    # Repeat Zone
    ri = nodes.new("GeometryNodeRepeatInput")
    ro = nodes.new("GeometryNodeRepeatOutput")
    ri.pair_with_output(ro)
    ri.location = (-200, 200);  ro.location = (1000, 200)
    ri.repeat_items.new("GEOMETRY", "Accumulated")
    links.new(n_in.outputs["Crystal Count"], ri.inputs["Iterations"])

    def _m(op, x=None, y=None, loc=(0, 0)):
        n = nodes.new("ShaderNodeMath")
        n.operation = op
        n.use_clamp = False
        n.location  = loc
        if isinstance(x, (int, float)): n.inputs[0].default_value = float(x)
        if isinstance(y, (int, float)): n.inputs[1].default_value = float(y)
        return n

    n_sub1  = _m("SUBTRACT", y=1.0,   loc=(-100, 700))
    n_div_t = _m("DIVIDE",            loc=( 100, 700))
    links.new(n_in.outputs["Crystal Count"],  n_sub1.inputs[0])
    links.new(n_sub1.outputs["Value"],        n_div_t.inputs[1])
    links.new(ri.outputs["Iteration"],        n_div_t.inputs[0])

    n_angle = _m("MULTIPLY",          loc=(-100, 500))
    links.new(ri.outputs["Iteration"],        n_angle.inputs[0])
    links.new(n_golden.outputs["Value"],      n_angle.inputs[1])

    n_sqrt   = _m("SQRT",             loc=( 100, 600))
    n_radius = _m("MULTIPLY",         loc=( 300, 600))
    links.new(n_div_t.outputs["Value"],       n_sqrt.inputs[0])
    links.new(n_sqrt.outputs["Value"],        n_radius.inputs[0])
    links.new(n_in.outputs["Spiral Radius"],  n_radius.inputs[1])

    n_cos = _m("COSINE",              loc=( 100, 500))
    n_sin = _m("SINE",                loc=( 100, 400))
    n_x   = _m("MULTIPLY",           loc=( 300, 500))
    n_y   = _m("MULTIPLY",           loc=( 300, 400))
    links.new(n_angle.outputs["Value"],       n_cos.inputs[0])
    links.new(n_angle.outputs["Value"],       n_sin.inputs[0])
    links.new(n_cos.outputs["Value"],         n_x.inputs[0])
    links.new(n_sin.outputs["Value"],         n_y.inputs[0])
    links.new(n_radius.outputs["Value"],      n_x.inputs[1])
    links.new(n_radius.outputs["Value"],      n_y.inputs[1])

    n_map = nodes.new("ShaderNodeMapRange")
    n_map.location = (300, 700)
    n_map.inputs["From Min"].default_value = 0.0
    n_map.inputs["From Max"].default_value = 1.0
    links.new(n_div_t.outputs["Value"],       n_map.inputs["Value"])
    links.new(n_in.outputs["Base Scale"],     n_map.inputs["To Min"])
    links.new(n_in.outputs["Tip Scale"],      n_map.inputs["To Max"])

    n_depth = _m("MULTIPLY",          loc=( 500, 700))
    links.new(n_map.outputs["Result"],        n_depth.inputs[0])
    links.new(n_in.outputs["Base Height"],    n_depth.inputs[1])

    n_z = _m("DIVIDE", y=2.0,         loc=( 700, 700))
    links.new(n_depth.outputs["Value"],       n_z.inputs[0])

    n_xyz = nodes.new("ShaderNodeCombineXYZ")
    n_xyz.location = (500, 500)
    links.new(n_x.outputs["Value"],           n_xyz.inputs["X"])
    links.new(n_y.outputs["Value"],           n_xyz.inputs["Y"])
    links.new(n_z.outputs["Value"],           n_xyz.inputs["Z"])

    n_cone = nodes.new("GeometryNodeMeshCone")
    n_cone.fill_type = "NGON"
    n_cone.location  = (500, 100)
    n_cone.inputs["Radius Top"].default_value = 0.001
    links.new(n_in.outputs["Cone Vertices"],  n_cone.inputs["Vertices"])
    links.new(n_map.outputs["Result"],        n_cone.inputs["Radius Bottom"])
    links.new(n_depth.outputs["Value"],       n_cone.inputs["Depth"])

    n_tr = nodes.new("GeometryNodeTransform")
    n_tr.location = (700, 300)
    links.new(n_cone.outputs["Mesh"],         n_tr.inputs["Geometry"])
    links.new(n_xyz.outputs["Vector"],        n_tr.inputs["Translation"])

    n_join = nodes.new("GeometryNodeJoinGeometry")
    n_join.location = (850, 300)
    links.new(ri.outputs["Accumulated"],      n_join.inputs["Geometry"])
    links.new(n_tr.outputs["Geometry"],       n_join.inputs["Geometry"])
    links.new(n_join.outputs["Geometry"],     ro.inputs["Accumulated"])

    n_sm = nodes.new("GeometryNodeSetShadeSmooth")
    n_sm.domain   = "FACE"
    n_sm.location = (1150, 200)
    n_sm.inputs["Shade Smooth"].default_value = False
    links.new(ro.outputs["Accumulated"],      n_sm.inputs["Geometry"])
    links.new(n_sm.outputs["Geometry"],       n_out.inputs["Geometry"])

    return tree
