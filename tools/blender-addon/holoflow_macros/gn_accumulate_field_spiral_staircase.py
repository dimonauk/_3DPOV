"""
holoflow_macros/gn_accumulate_field_spiral_staircase.py
Macro: build_spiral_staircase(obj, steps, rise, twist_deg, tread_w, tread_d, inner_r)

Applies a SpiralStaircase Geometry Nodes modifier to obj using the
AccumulateField prefix-sum scaffold from the tutorial.
"""

import bpy
import bmesh
import math


def _make_tread_source(steps_name: str,
                       tread_w: float,
                       tread_d: float,
                       tread_t: float,
                       inner_r: float) -> bpy.types.Object:
    me = bpy.data.meshes.new(f"{steps_name}_TreadSrc")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(tread_w, tread_d, tread_t), verts=bm.verts)
    for v in bm.verts:
        v.co.y += inner_r + tread_d / 2.0
    bm.to_mesh(me)
    bm.free()
    src = bpy.data.objects.new(f"{steps_name}_TreadSrc", me)
    bpy.context.collection.objects.link(src)
    return src


def build_spiral_staircase(
    obj: bpy.types.Object,
    steps: int     = 16,
    rise: float    = 0.15,
    twist_deg: float = 22.5,
    tread_w: float = 0.80,
    tread_d: float = 0.28,
    tread_t: float = 0.05,
    inner_r: float = 0.22,
) -> bpy.types.NodesModifier:
    """
    Apply SpiralStaircase GN modifier to obj.
    Returns the NODES modifier for further parameter tweaking.
    """
    twist_rad = math.radians(twist_deg)
    tread_src = _make_tread_source(obj.name, tread_w, tread_d, tread_t, inner_r)

    ng  = bpy.data.node_groups.new(f"{obj.name}_SpiralStaircase", 'GeometryNodeTree')
    ni  = ng.interface
    nds = ng.nodes
    lks = ng.links

    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def nd(t, lbl=None):
        n = nds.new(t)
        if lbl:
            n.label = lbl
        return n

    gout  = nd('NodeGroupOutput')
    mline = nd('GeometryNodeMeshLine', 'Scaffold')
    mline.mode = 'OFFSET'
    mline.count_mode = 'TOTAL'
    mline.inputs['Count'].default_value  = steps
    mline.inputs['Offset'].default_value = (0.0, 0.0, 0.0)

    acc_h = nd('GeometryNodeAccumulateField', 'CumulHeight')
    acc_h.data_type = 'FLOAT'
    acc_h.domain    = 'POINT'
    acc_h.inputs[0].default_value = rise

    acc_r = nd('GeometryNodeAccumulateField', 'CumulRotation')
    acc_r.data_type = 'FLOAT'
    acc_r.domain    = 'POINT'
    acc_r.inputs[0].default_value = twist_rad

    cpos  = nd('ShaderNodeCombineXYZ', 'StepZ')
    spos  = nd('GeometryNodeSetPosition')
    oinfo = nd('GeometryNodeObjectInfo', 'TreadSrc')
    oinfo.inputs[0].default_value = tread_src
    oinfo.transform_space = 'ORIGINAL'

    inst  = nd('GeometryNodeInstanceOnPoints')
    crot  = nd('ShaderNodeCombineXYZ', 'StepRot')
    rinst = nd('GeometryNodeRotateInstances')
    rinst.inputs['Local Space'].default_value = False
    real  = nd('GeometryNodeRealizeInstances')

    lks.new(acc_h.outputs['Leading'],     cpos.inputs['Z'])
    lks.new(cpos.outputs['Vector'],       spos.inputs['Position'])
    lks.new(mline.outputs['Mesh'],        spos.inputs['Geometry'])
    lks.new(spos.outputs['Geometry'],     inst.inputs['Points'])
    lks.new(oinfo.outputs['Geometry'],    inst.inputs['Instance'])
    lks.new(acc_r.outputs['Leading'],     crot.inputs['Z'])
    lks.new(inst.outputs['Instances'],    rinst.inputs['Instances'])
    lks.new(crot.outputs['Vector'],       rinst.inputs['Rotation'])
    lks.new(rinst.outputs['Instances'],   real.inputs[0])
    lks.new(real.outputs[0],              gout.inputs['Geometry'])

    mod = obj.modifiers.new("SpiralStaircase", 'NODES')
    mod.node_group = ng
    return mod
