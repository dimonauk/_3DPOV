"""
holoflow_macros / gn_curve_to_points_bead_necklace.py
Reusable helper: inject the BeadNecklace GN tree onto any closed curve.
Blender 5.1  |  CC0  |  Holoflow Studio

Usage:
    from holoflow_macros.gn_curve_to_points_bead_necklace import inject_bead_necklace_gn
    inject_bead_necklace_gn(bpy.context.active_object, bead_count=48)
"""

import bpy
import math

_SCALE_MIN  = 0.75
_SCALE_MAX  = 1.25
_SCALE_SEED = 7


def inject_bead_necklace_gn(
    curve_obj: bpy.types.Object,
    bead_count: int   = 40,
    bead_radius: float = 0.08,
    string_radius: float = 0.005,
    mat_pearl: bpy.types.Material | None = None,
    mat_cord:  bpy.types.Material | None = None,
    tree_name: str = "BeadNecklace",
) -> bpy.types.NodesModifier:
    """Add or replace the BeadNecklace GN modifier on curve_obj.

    If mat_pearl / mat_cord are None the modifier uses Blender's default
    material slot (grey); supply explicit Material objects for production use.

    Returns the applied NodesModifier so callers can tweak socket defaults.
    """
    # Remove existing modifier with the same tree to avoid stacking
    for mod in list(curve_obj.modifiers):
        if isinstance(mod, bpy.types.NodesModifier) and mod.node_group \
                and mod.node_group.name == tree_name:
            curve_obj.modifiers.remove(mod)

    ng = _build_tree(tree_name, mat_pearl, mat_cord)
    mod = curve_obj.modifiers.new(tree_name, 'NODES')
    mod.node_group = ng

    # Set visible modifier panel defaults via socket identifiers
    for item in ng.interface.items_tree:
        if item.name == "Bead Count":
            mod[item.identifier] = bead_count
        elif item.name == "Bead Radius":
            mod[item.identifier] = bead_radius
        elif item.name == "String Radius":
            mod[item.identifier] = string_radius

    return mod


def _build_tree(name, mat_pearl, mat_cord):
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')

    ng.interface.new_socket("Geometry",      in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry",      in_out='OUTPUT', socket_type='NodeSocketGeometry')

    s = ng.interface.new_socket("Bead Count",    in_out='INPUT', socket_type='NodeSocketInt')
    s.default_value, s.min_value, s.max_value = 40, 4, 200

    s = ng.interface.new_socket("Bead Radius",   in_out='INPUT', socket_type='NodeSocketFloat')
    s.default_value, s.min_value, s.max_value = 0.08, 0.01, 0.50

    s = ng.interface.new_socket("String Radius", in_out='INPUT', socket_type='NodeSocketFloat')
    s.default_value, s.min_value, s.max_value = 0.005, 0.001, 0.05

    ns = ng.nodes
    lk = ng.links

    def N(idname, x, y, **kw):
        nd = ns.new(idname)
        nd.location = (x, y)
        for k, v in kw.items():
            setattr(nd, k, v)
        return nd

    gi = N('NodeGroupInput',  -1100,  0)
    go = N('NodeGroupOutput',  1300,  0)

    # String branch
    rs_s = N('GeometryNodeResampleCurve', -800, -250)
    rs_s.mode = 'EVALUATED'
    rs_s.inputs['Resolution'].default_value = 64
    lk.new(gi.outputs['Geometry'], rs_s.inputs['Curve'])

    prof = N('GeometryNodeCurvePrimitiveCircle', -800, -450)
    prof.mode = 'RADIUS'
    prof.inputs['Resolution'].default_value = 6
    lk.new(gi.outputs['String Radius'], prof.inputs['Radius'])

    c2m = N('GeometryNodeCurveToMesh', -450, -350)
    c2m.inputs['Fill Caps'].default_value = False
    lk.new(rs_s.outputs['Curve'],  c2m.inputs['Curve'])
    lk.new(prof.outputs['Curve'],  c2m.inputs['Profile Curve'])

    sm_c = N('GeometryNodeSetMaterial', -150, -350)
    if mat_cord:
        sm_c.inputs['Material'].default_value = mat_cord
    lk.new(c2m.outputs['Mesh'], sm_c.inputs['Geometry'])

    # Bead branch
    rs_b = N('GeometryNodeResampleCurve', -800, 300)
    rs_b.mode = 'EVALUATED'
    rs_b.inputs['Resolution'].default_value = 64
    lk.new(gi.outputs['Geometry'], rs_b.inputs['Curve'])

    c2p = N('GeometryNodeCurveToPoints', -450, 300)
    c2p.mode = 'COUNT'
    lk.new(rs_b.outputs['Curve'],    c2p.inputs['Curve'])
    lk.new(gi.outputs['Bead Count'], c2p.inputs['Count'])

    sph = N('GeometryNodeMeshUVSphere', -450, 550)
    sph.inputs['Segments'].default_value = 8
    sph.inputs['Rings'].default_value    = 6
    lk.new(gi.outputs['Bead Radius'], sph.inputs['Radius'])

    aln = N('FunctionNodeAlignEulerToVector', -150, 450)
    aln.axis       = 'Y'
    aln.pivot_axis = 'Z'
    lk.new(c2p.outputs['Tangent'], aln.inputs['Vector'])

    rnd = N('FunctionNodeRandomValue', -150, 300)
    rnd.data_type = 'FLOAT'
    rnd.inputs['Min'].default_value  = _SCALE_MIN
    rnd.inputs['Max'].default_value  = _SCALE_MAX
    rnd.inputs['Seed'].default_value = _SCALE_SEED

    cxyz = N('ShaderNodeCombineXYZ', 100, 300)
    lk.new(rnd.outputs['Value'], cxyz.inputs['X'])
    lk.new(rnd.outputs['Value'], cxyz.inputs['Y'])
    lk.new(rnd.outputs['Value'], cxyz.inputs['Z'])

    iop = N('GeometryNodeInstanceOnPoints', 350, 380)
    lk.new(c2p.outputs['Points'],     iop.inputs['Points'])
    lk.new(sph.outputs['Mesh'],       iop.inputs['Instance'])
    lk.new(aln.outputs['Rotation'],   iop.inputs['Rotation'])
    lk.new(cxyz.outputs['Vector'],    iop.inputs['Scale'])

    sm_b = N('GeometryNodeSetMaterial', 600, 500)
    if mat_pearl:
        sm_b.inputs['Material'].default_value = mat_pearl
    lk.new(iop.outputs['Instances'], sm_b.inputs['Geometry'])

    real = N('GeometryNodeRealizeInstances', 850, 400)
    lk.new(sm_b.outputs['Geometry'], real.inputs['Geometry'])

    join = N('GeometryNodeJoinGeometry', 1050, 0)
    lk.new(real.outputs['Geometry'],    join.inputs['Geometry'])
    lk.new(sm_c.outputs['Geometry'],    join.inputs['Geometry'])
    lk.new(join.outputs['Geometry'],    go.inputs['Geometry'])

    return ng
