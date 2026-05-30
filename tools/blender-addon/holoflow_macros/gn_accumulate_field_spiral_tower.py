"""
holoflow_macros/gn_accumulate_field_spiral_tower.py
Blender 5.1 | CC0 | Holoflow Studio

Reusable helper: build a GeometryNodeAccumulateField-driven spiral tower GN
tree on any object.  Returns the modifier so callers can tune socket defaults.

Usage:
    from holoflow_macros.gn_accumulate_field_spiral_tower import build_spiral_tower
    mod = build_spiral_tower(bpy.context.active_object, n_steps=32)
"""

import bpy
import math


GOLDEN_ANGLE = math.pi * (3.0 - math.sqrt(5.0))


def build_spiral_tower(
    obj: bpy.types.Object,
    n_steps: int = 28,
    base_height: float = 0.06,
    height_growth: float = 0.014,
    spiral_radius: float = 0.95,
    cone_base_r: float = 0.10,
    cone_verts: int = 7,
    mod_name: str = "HoloflowGNSpiralTower",
) -> bpy.types.NodesModifier:
    """
    Wire a GN Accumulate Field spiral-tower tree onto *obj* and return
    the modifier.  The caller is responsible for materials and export.
    """
    tree  = bpy.data.node_groups.new(type="GeometryNodeTree", name=mod_name)
    nodes = tree.nodes
    links = tree.links

    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")

    def _sock_i(name, val, lo=1, hi=256):
        s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketInt")
        s.default_value, s.min_value, s.max_value = val, lo, hi

    def _sock_f(name, val, lo=0.0, hi=10.0):
        s = tree.interface.new_socket(name, in_out="INPUT", socket_type="NodeSocketFloat")
        s.default_value, s.min_value, s.max_value = val, lo, hi

    _sock_i("Pillar Count",  n_steps)
    _sock_f("Base Height",   base_height)
    _sock_f("Height Growth", height_growth)
    _sock_f("Spiral Radius", spiral_radius)
    _sock_f("Cone Base R",   cone_base_r)
    _sock_i("Cone Vertices", cone_verts, 3, 32)

    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-1200, 0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 1600, 0)

    n_golden = nodes.new("ShaderNodeValue")
    n_golden.outputs[0].default_value = GOLDEN_ANGLE
    n_golden.location = (-1000, -500)

    def _m(op, x=None, y=None, loc=(0, 0)):
        n = nodes.new("ShaderNodeMath")
        n.operation, n.use_clamp, n.location = op, False, loc
        if isinstance(x, (int, float)): n.inputs[0].default_value = float(x)
        if isinstance(y, (int, float)): n.inputs[1].default_value = float(y)
        return n

    # Step height: h_i = BaseHeight + Index × HeightGrowth
    idx0   = nodes.new("GeometryNodeInputIndex"); idx0.location = (-950, 400)
    grow   = _m("MULTIPLY", loc=(-750, 400))
    step_h = _m("ADD",      loc=(-550, 400))
    links.new(idx0.outputs["Index"],          grow.inputs[0])
    links.new(n_in.outputs["Height Growth"],  grow.inputs[1])
    links.new(grow.outputs["Value"],          step_h.inputs[0])
    links.new(n_in.outputs["Base Height"],    step_h.inputs[1])

    # AccumulateField: domain=POINT, outputs[0]=Leading
    acc = nodes.new("GeometryNodeAccumulateField")
    acc.data_type, acc.domain, acc.location = "FLOAT", "POINT", (-300, 400)
    links.new(step_h.outputs["Value"], acc.inputs[0])

    # Pillar midpoint Z
    half  = _m("MULTIPLY", y=0.5, loc=(-200, 200))
    mid_z = _m("ADD",             loc=(  50, 400))
    links.new(step_h.outputs["Value"],  half.inputs[0])
    links.new(acc.outputs[0],           mid_z.inputs[0])
    links.new(half.outputs["Value"],    mid_z.inputs[1])

    # Fermat spiral XY
    idx1   = nodes.new("GeometryNodeInputIndex"); idx1.location = (-950, -100)
    idx2   = nodes.new("GeometryNodeInputIndex"); idx2.location = (-950, -300)
    cnt_m1 = _m("SUBTRACT", y=1.0,  loc=(-950, -200))
    norm   = _m("DIVIDE",           loc=(-750, -100))
    links.new(n_in.outputs["Pillar Count"], cnt_m1.inputs[0])
    links.new(idx1.outputs["Index"],        norm.inputs[0])
    links.new(cnt_m1.outputs["Value"],      norm.inputs[1])

    sqrt_t = _m("SQRT",     loc=(-550, -100))
    rad_i  = _m("MULTIPLY", loc=(-300, -100))
    links.new(norm.outputs["Value"],          sqrt_t.inputs[0])
    links.new(sqrt_t.outputs["Value"],        rad_i.inputs[0])
    links.new(n_in.outputs["Spiral Radius"],  rad_i.inputs[1])

    angle = _m("MULTIPLY", loc=(-750, -300))
    cos_a = _m("COSINE",   loc=(-550, -200))
    sin_a = _m("SINE",     loc=(-550, -350))
    links.new(idx2.outputs["Index"],    angle.inputs[0])
    links.new(n_golden.outputs["Value"], angle.inputs[1])
    links.new(angle.outputs["Value"],   cos_a.inputs[0])
    links.new(angle.outputs["Value"],   sin_a.inputs[0])

    px = _m("MULTIPLY", loc=(-150, -200))
    py = _m("MULTIPLY", loc=(-150, -350))
    links.new(cos_a.outputs["Value"],  px.inputs[0])
    links.new(rad_i.outputs["Value"],  px.inputs[1])
    links.new(sin_a.outputs["Value"],  py.inputs[0])
    links.new(rad_i.outputs["Value"],  py.inputs[1])

    n_pts = nodes.new("GeometryNodePoints"); n_pts.location = (-950, 200)
    links.new(n_in.outputs["Pillar Count"], n_pts.inputs[0])

    combo_pos = nodes.new("ShaderNodeCombineXYZ"); combo_pos.location = (200, 0)
    links.new(px.outputs["Value"],    combo_pos.inputs["X"])
    links.new(py.outputs["Value"],    combo_pos.inputs["Y"])
    links.new(mid_z.outputs["Value"], combo_pos.inputs["Z"])

    setpos = nodes.new("GeometryNodeSetPosition"); setpos.location = (400, 200)
    links.new(n_pts.outputs["Geometry"],   setpos.inputs["Geometry"])
    links.new(combo_pos.outputs["Vector"], setpos.inputs["Position"])

    # Per-instance taper
    taper = nodes.new("ShaderNodeMapRange"); taper.location = (-150, 700)
    taper.inputs["From Min"].default_value = 0.0
    taper.inputs["From Max"].default_value = 1.0
    taper.inputs["To Min"].default_value   = 1.0
    taper.inputs["To Max"].default_value   = 0.25
    links.new(norm.outputs["Value"], taper.inputs["Value"])

    scale_xy = _m("MULTIPLY", loc=(50, 700))
    links.new(taper.outputs["Result"],     scale_xy.inputs[0])
    links.new(n_in.outputs["Cone Base R"], scale_xy.inputs[1])

    scale_v = nodes.new("ShaderNodeCombineXYZ"); scale_v.location = (250, 700)
    links.new(scale_xy.outputs["Value"], scale_v.inputs["X"])
    links.new(scale_xy.outputs["Value"], scale_v.inputs["Y"])
    links.new(step_h.outputs["Value"],   scale_v.inputs["Z"])

    cone = nodes.new("GeometryNodeMeshCone"); cone.fill_type = "NGON"
    cone.location = (400, 700)
    cone.inputs["Radius Bottom"].default_value = 1.0
    cone.inputs["Radius Top"].default_value    = 0.01
    cone.inputs["Depth"].default_value         = 1.0
    links.new(n_in.outputs["Cone Vertices"], cone.inputs["Vertices"])

    inst = nodes.new("GeometryNodeInstanceOnPoints"); inst.location = (700, 400)
    links.new(setpos.outputs["Geometry"],  inst.inputs["Points"])
    links.new(cone.outputs["Mesh"],        inst.inputs["Instance"])
    links.new(scale_v.outputs["Vector"],   inst.inputs["Scale"])

    real = nodes.new("GeometryNodeRealizeInstances"); real.location = (950, 400)
    links.new(inst.outputs["Instances"], real.inputs["Geometry"])

    smooth = nodes.new("GeometryNodeSetShadeSmooth")
    smooth.domain, smooth.location = "FACE", (1150, 400)
    smooth.inputs["Shade Smooth"].default_value = False
    links.new(real.outputs["Geometry"],   smooth.inputs["Geometry"])
    links.new(smooth.outputs["Geometry"], n_out.inputs["Geometry"])

    mod = obj.modifiers.new(name=mod_name, type="NODES")
    mod.node_group = tree
    mod["Input_2"] = n_steps
    mod["Input_3"] = base_height
    mod["Input_4"] = height_growth
    mod["Input_5"] = spiral_radius
    mod["Input_6"] = cone_base_r
    mod["Input_7"] = cone_verts
    return mod
