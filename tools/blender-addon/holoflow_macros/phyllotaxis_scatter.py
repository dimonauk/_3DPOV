"""
holoflow_macros/phyllotaxis_scatter.py — Blender 5.1

Reusable function: build a phyllotaxis (Golden Angle) GN node tree that
scatters any instance mesh into a uniform-density disc.

Usage:
    from holoflow_macros.phyllotaxis_scatter import build_phyllotaxis_tree
    ng = build_phyllotaxis_tree(instance_obj, count=144, spacing=0.10)
    mod = scaffold_obj.modifiers.new("Phyllotaxis", 'NODES')
    mod.node_group = ng

Licence: CC0
"""

import bpy
import math

_PHI              = (1.0 + math.sqrt(5.0)) / 2.0
GOLDEN_ANGLE_RAD  = 2.0 * math.pi * (2.0 - _PHI)


def build_phyllotaxis_tree(
    instance_obj: bpy.types.Object,
    count:    int   = 144,
    spacing:  float = 0.10,
    material: bpy.types.Material | None = None,
) -> bpy.types.NodeGroup:
    """
    Returns a GeometryNodeTree that places `count` instances of `instance_obj`
    in a phyllotaxis disc of radius ≈ sqrt(count) × spacing.

    Each instance is rotated around world Z by its placement angle so it
    faces radially outward.  Pass `material` to assign a material via
    SetMaterial before RealizeInstances.
    """
    ng = bpy.data.node_groups.new("PhyllotaxisScatter", 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links
    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def nd(t, loc=(0, 0)):
        n = nds.new(t); n.location = loc; return n

    def mth(op, loc, val_b=None):
        n = nd('ShaderNodeMath', loc); n.operation = op
        if val_b is not None:
            n.inputs[1].default_value = val_b
        return n

    gout = nd('NodeGroupOutput',               loc=(1200, 0))
    pts  = nd('GeometryNodePoints',            loc=(-1000, 0))
    pts.inputs['Count'].default_value  = count
    pts.inputs['Radius'].default_value = 0.001

    idx      = nd('GeometryNodeInputIndex',    loc=(-1000, -180))
    mul_th   = mth('MULTIPLY', (-760, -160), GOLDEN_ANGLE_RAD)
    sqrt_i   = mth('POWER',    (-760, -340), 0.5)
    mul_r    = mth('MULTIPLY', (-540, -340), spacing)
    cos_t    = mth('COSINE',   (-540, -160))
    sin_t    = mth('SINE',     (-540,  -40))
    mul_px   = mth('MULTIPLY', (-320, -160))
    mul_py   = mth('MULTIPLY', (-320,  -40))
    pos_xyz  = nd('ShaderNodeCombineXYZ',      loc=(-100, -100))
    rot_xyz  = nd('ShaderNodeCombineXYZ',      loc=(-100, -300))
    spos     = nd('GeometryNodeSetPosition',   loc=(120, 0))
    oinfo    = nd('GeometryNodeObjectInfo',    loc=(-760, 200))
    oinfo.inputs[0].default_value = instance_obj
    oinfo.transform_space          = 'ORIGINAL'
    inst     = nd('GeometryNodeInstanceOnPoints', loc=(360, 0))
    rinst    = nd('GeometryNodeRotateInstances',  loc=(600, 0))
    rinst.inputs['Local Space'].default_value = False

    last_geo = rinst.outputs[0]

    if material:
        smat = nd('GeometryNodeSetMaterial', loc=(840, 0))
        smat.inputs[2].default_value = material
        lks.new(rinst.outputs[0], smat.inputs[0])
        last_geo = smat.outputs[0]

    real = nd('GeometryNodeRealizeInstances', loc=(1000, 0))
    lks.new(last_geo,              real.inputs[0])
    lks.new(real.outputs[0],       gout.inputs['Geometry'])

    # Field wires
    lks.new(idx.outputs[0],        mul_th.inputs[0])
    lks.new(idx.outputs[0],        sqrt_i.inputs[0])
    lks.new(sqrt_i.outputs[0],     mul_r.inputs[0])
    lks.new(mul_th.outputs[0],     cos_t.inputs[0])
    lks.new(mul_th.outputs[0],     sin_t.inputs[0])
    lks.new(cos_t.outputs[0],      mul_px.inputs[0])
    lks.new(mul_r.outputs[0],      mul_px.inputs[1])
    lks.new(sin_t.outputs[0],      mul_py.inputs[0])
    lks.new(mul_r.outputs[0],      mul_py.inputs[1])
    lks.new(mul_px.outputs[0],     pos_xyz.inputs['X'])
    lks.new(mul_py.outputs[0],     pos_xyz.inputs['Y'])
    lks.new(mul_th.outputs[0],     rot_xyz.inputs['Z'])

    # Geometry wires
    lks.new(pts.outputs['Geometry'],   spos.inputs['Geometry'])
    lks.new(pos_xyz.outputs[0],        spos.inputs['Position'])
    lks.new(spos.outputs['Geometry'],  inst.inputs['Points'])
    lks.new(oinfo.outputs['Geometry'], inst.inputs['Instance'])
    lks.new(inst.outputs['Instances'], rinst.inputs['Instances'])
    lks.new(rot_xyz.outputs[0],        rinst.inputs['Rotation'])

    return ng
