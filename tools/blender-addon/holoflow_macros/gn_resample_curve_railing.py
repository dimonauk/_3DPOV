"""
holoflow_macros.gn_resample_curve_railing
==========================================
Reusable macro: adds a HF_Railing GN modifier to a selected Curve object,
building a parametric balustrade (posts + handrail tube) along the curve.

Usage (Blender Scripting workspace):
    import importlib
    import holoflow_macros.gn_resample_curve_railing as m
    importlib.reload(m)
    m.apply(
        curve_obj    = bpy.data.objects["stair_rail_path"],
        post_spacing = 0.50,
        rail_radius  = 0.025,
        post_height  = 0.90,
        post_width   = 0.022,
        mat_rail     = bpy.data.materials["chrome"],
        mat_post     = bpy.data.materials["matte_black"],
    )

Licence: CC0 1.0 — Holoflow Studio
Blender 5.1 (bpy 4.4)
"""

import bpy
from mathutils import Vector


def apply(
    curve_obj:    bpy.types.Object,
    post_spacing: float = 0.50,
    rail_radius:  float = 0.025,
    post_height:  float = 0.90,
    post_width:   float = 0.022,
    mat_rail:     bpy.types.Material | None = None,
    mat_post:     bpy.types.Material | None = None,
) -> bpy.types.NodesModifier:
    """
    Add HF_Railing geometry-nodes modifier to `curve_obj`.

    Returns the created modifier so callers can further adjust socket values.
    If a node group named 'HF_Railing' already exists in bpy.data.node_groups,
    it is reused (allows multi-object sharing of the same tree).
    """
    if curve_obj.type != 'CURVE':
        raise TypeError(f"curve_obj must be a CURVE object, got {curve_obj.type!r}")

    # Reuse or create the node group
    ng_name = "HF_Railing"
    if ng_name in bpy.data.node_groups:
        ng = bpy.data.node_groups[ng_name]
    else:
        ng = _build_tree(ng_name, mat_rail, mat_post)

    mod            = curve_obj.modifiers.new(ng_name, 'NODES')
    mod.node_group = ng

    # Set default values on the modifier's socket inputs
    mod["Input_1"] = post_spacing   # Post Spacing
    mod["Input_2"] = rail_radius    # Rail Radius
    mod["Input_3"] = post_height    # Post Height

    return mod


def _build_tree(name: str, mat_rail, mat_post) -> bpy.types.GeometryNodeTree:
    ng    = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    nodes = ng.nodes
    links = ng.links
    iface = ng.interface

    # Sockets
    iface.new_socket("Geometry",     in_out='INPUT',  socket_type='NodeSocketGeometry')
    sk_sp = iface.new_socket("Post Spacing", in_out='INPUT',  socket_type='NodeSocketFloat')
    sk_rr = iface.new_socket("Rail Radius",  in_out='INPUT',  socket_type='NodeSocketFloat')
    sk_ph = iface.new_socket("Post Height",  in_out='INPUT',  socket_type='NodeSocketFloat')
    iface.new_socket("Geometry",     in_out='OUTPUT', socket_type='NodeSocketGeometry')
    sk_sp.default_value = 0.50
    sk_rr.default_value = 0.025
    sk_ph.default_value = 0.90

    gin  = nodes.new('NodeGroupInput')
    gout = nodes.new('NodeGroupOutput')

    # ── post branch ───────────────────────────────────────────────────────────
    resamp = nodes.new('GeometryNodeResampleCurve'); resamp.mode = 'LENGTH'
    links.new(gin.outputs['Geometry'],     resamp.inputs['Curve'])
    links.new(gin.outputs['Post Spacing'], resamp.inputs['Length'])

    c2p = nodes.new('GeometryNodeCurveToPoints'); c2p.mode = 'EVALUATED'
    links.new(resamp.outputs['Curve'], c2p.inputs['Curve'])

    box = nodes.new('GeometryNodeMeshCube')
    box.inputs['Size'].default_value = (0.044, 0.044, 0.90)  # default POST_W*2 × POST_H

    half = nodes.new('ShaderNodeMath'); half.operation = 'MULTIPLY'
    half.inputs[1].default_value = 0.5
    links.new(gin.outputs['Post Height'], half.inputs[0])
    cxyz = nodes.new('ShaderNodeCombineXYZ')
    links.new(half.outputs['Value'], cxyz.inputs['Z'])
    tform = nodes.new('GeometryNodeTransform')
    links.new(box.outputs['Mesh'],         tform.inputs['Geometry'])
    links.new(cxyz.outputs['Vector'],      tform.inputs['Translation'])

    if mat_post:
        smp = nodes.new('GeometryNodeSetMaterial')
        links.new(tform.outputs['Geometry'], smp.inputs['Geometry'])
        smp.inputs['Material'].default_value = mat_post
        post_geo = smp.outputs['Geometry']
    else:
        post_geo = tform.outputs['Geometry']

    inst = nodes.new('GeometryNodeInstanceOnPoints')
    links.new(c2p.outputs['Points'], inst.inputs['Points'])
    links.new(post_geo,              inst.inputs['Instance'])

    align = nodes.new('FunctionNodeAlignEulerToVector')
    align.axis = 'Y'; align.pivot_axis = 'Z'
    links.new(c2p.outputs['Tangent'],    align.inputs['Vector'])
    links.new(align.outputs['Rotation'], inst.inputs['Rotation'])

    real = nodes.new('GeometryNodeRealizeInstances')
    links.new(inst.outputs['Instances'], real.inputs['Geometry'])

    # ── rail tube branch ──────────────────────────────────────────────────────
    tform_rc = nodes.new('GeometryNodeTransform')
    cxyz_z   = nodes.new('ShaderNodeCombineXYZ')
    links.new(gin.outputs['Post Height'], cxyz_z.inputs['Z'])
    links.new(gin.outputs['Geometry'],    tform_rc.inputs['Geometry'])
    links.new(cxyz_z.outputs['Vector'],   tform_rc.inputs['Translation'])

    circ = nodes.new('GeometryNodeCurvePrimitiveCircle'); circ.mode = 'RADIUS'
    links.new(gin.outputs['Rail Radius'], circ.inputs['Radius'])

    c2m = nodes.new('GeometryNodeCurveToMesh')
    c2m.inputs['Fill Caps'].default_value = True
    links.new(tform_rc.outputs['Geometry'], c2m.inputs['Curve'])
    links.new(circ.outputs['Curve'],        c2m.inputs['Profile Curve'])

    if mat_rail:
        smr = nodes.new('GeometryNodeSetMaterial')
        links.new(c2m.outputs['Mesh'], smr.inputs['Geometry'])
        smr.inputs['Material'].default_value = mat_rail
        rail_geo = smr.outputs['Geometry']
    else:
        rail_geo = c2m.outputs['Mesh']

    # ── join ──────────────────────────────────────────────────────────────────
    join = nodes.new('GeometryNodeJoinGeometry')
    links.new(real.outputs['Geometry'], join.inputs['Geometry'])
    links.new(rail_geo,                 join.inputs['Geometry'])
    links.new(join.outputs['Geometry'], gout.inputs['Geometry'])

    return ng
