"""
holoflow_macros/gn_face_group_boundaries_panel_grooves.py
Reusable macro: add a PanelGrooveMaker GN modifier to any selected mesh object.

Usage (from Blender Text Editor or MCP socket):
    import importlib, sys
    sys.path.insert(0, r"<path-to>/tools/blender-addon")
    from holoflow_macros import gn_face_group_boundaries_panel_grooves as pgb
    pgb.apply_to_selected(noise_scale=0.85, num_groups=12, groove_radius=0.020)

Reference tutorial: /tutorials/blender-tutorial-gn-face-group-boundaries-panel-grooves
"""

import bpy

# ── Defaults (override via apply_to_selected kwargs) ─────────────────────────
_DEFAULTS = dict(
    subdiv_level   = 3,
    noise_scale    = 0.85,
    num_groups     = 12,
    groove_radius  = 0.020,
    circle_verts   = 4,
    noise_seed     = 3,
)
# ─────────────────────────────────────────────────────────────────────────────


def _build_group(ng_name, **p):
    """Build and return the PanelGrooveMaker node group."""
    if ng_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[ng_name])

    ng = bpy.data.node_groups.new(ng_name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = ng.nodes, ng.links

    gin  = N.new('NodeGroupInput');  gin.location  = (-800, 0)
    gout = N.new('NodeGroupOutput'); gout.location = ( 900, 0)

    sdiv = N.new('GeometryNodeSubdivideMesh')
    sdiv.inputs['Level'].default_value = p['subdiv_level']
    L.new(gin.outputs['Geometry'], sdiv.inputs['Mesh'])

    pos  = N.new('GeometryNodeInputPosition')
    noi  = N.new('ShaderNodeTexNoise')
    noi.noise_dimensions = '4D'
    noi.inputs['Scale'].default_value     = p['noise_scale']
    noi.inputs['Detail'].default_value    = 3.0
    noi.inputs['Roughness'].default_value = 0.60
    noi.inputs['W'].default_value         = float(p['noise_seed'])
    L.new(pos.outputs['Position'], noi.inputs['Vector'])

    mran = N.new('ShaderNodeMapRange')
    mran.data_type = 'FLOAT'; mran.clamp = True
    mran.inputs['To Max'].default_value = float(p['num_groups']) - 0.001
    L.new(noi.outputs['Fac'], mran.inputs['Value'])

    ftoi = N.new('FunctionNodeFloatToInt'); ftoi.rounding_mode = 'FLOOR'
    L.new(mran.outputs['Result'], ftoi.inputs['Float'])

    sfs = N.new('GeometryNodeStoreNamedAttribute')
    sfs.data_type = 'INT'; sfs.domain = 'FACE'
    sfs.inputs['Name'].default_value = 'face_set'; sfs.inputs[1].default_value = True
    L.new(sdiv.outputs['Mesh'], sfs.inputs[0])
    L.new(ftoi.outputs['Integer'], sfs.inputs[3])

    fgb = N.new('GeometryNodeFaceGroupBoundaries')
    L.new(ftoi.outputs['Integer'], fgb.inputs['Face Set'])

    sep = N.new('GeometryNodeSeparateGeometry'); sep.domain = 'EDGE'
    L.new(sfs.outputs['Geometry'], sep.inputs['Geometry'])
    L.new(fgb.outputs['Boundary Edges'], sep.inputs['Selection'])

    m2c = N.new('GeometryNodeMeshToCurve')
    L.new(sep.outputs[0], m2c.inputs['Mesh'])

    scr = N.new('GeometryNodeSetCurveRadius')
    scr.inputs['Radius'].default_value = p['groove_radius']
    L.new(m2c.outputs['Curve'], scr.inputs['Curve'])

    circ = N.new('GeometryNodeCurvePrimitiveCircle')
    circ.mode = 'RADIUS'
    circ.inputs['Resolution'].default_value = p['circle_verts']
    circ.inputs['Radius'].default_value     = p['groove_radius']

    c2m = N.new('GeometryNodeCurveToMesh'); c2m.inputs['Fill Caps'].default_value = True
    L.new(scr.outputs['Curve'], c2m.inputs['Curve'])
    L.new(circ.outputs['Curve'], c2m.inputs['Profile Curve'])

    smg = N.new('GeometryNodeSetMaterial')
    L.new(c2m.outputs['Mesh'], smg.inputs['Geometry'])

    mran2 = N.new('ShaderNodeMapRange')
    mran2.data_type = 'FLOAT'; mran2.clamp = True
    mran2.inputs['From Max'].default_value = float(p['num_groups'] - 1)
    mran2.inputs['To Max'].default_value   = 1.0
    L.new(ftoi.outputs['Integer'], mran2.inputs['Value'])

    crn = N.new('ShaderNodeValToRGB')
    cr  = crn.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.120, 0.175, 0.230, 1.0)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.200, 0.140, 0.240, 1.0)
    cr.elements.new(0.33).color = (0.050, 0.120, 0.160, 1.0)
    cr.elements.new(0.66).color = (0.170, 0.220, 0.180, 1.0)
    L.new(mran2.outputs['Result'], crn.inputs['Fac'])

    spc = N.new('GeometryNodeStoreNamedAttribute')
    spc.data_type = 'FLOAT_COLOR'; spc.domain = 'FACE'
    spc.inputs['Name'].default_value = 'panel_col'; spc.inputs[1].default_value = True
    L.new(sfs.outputs['Geometry'], spc.inputs[0])
    L.new(crn.outputs['Color'],    spc.inputs[3])

    join = N.new('GeometryNodeJoinGeometry')
    L.new(spc.outputs['Geometry'], join.inputs[0])
    L.new(smg.outputs['Geometry'], join.inputs[0])
    L.new(join.outputs['Geometry'], gout.inputs['Geometry'])
    return ng, smg


def apply_to_selected(**kwargs):
    """Add PanelGrooveMaker modifier to every selected mesh object."""
    p = {**_DEFAULTS, **kwargs}
    ng, smg = _build_group('PanelGrooveMaker', **p)

    groove_mat = bpy.data.materials.get('Panel_Groove') or bpy.data.materials.new('Panel_Groove')
    groove_mat.use_nodes = True
    nt = groove_mat.node_tree; nt.nodes.clear()
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled')
    pb.inputs['Base Color'].default_value = (0.012, 0.012, 0.014, 1.0)
    pb.inputs['Metallic'].default_value   = 0.95
    pb.inputs['Roughness'].default_value  = 0.08
    nt.links.new(pb.outputs['BSDF'], nt.nodes.new('ShaderNodeOutputMaterial').inputs['Surface'])
    smg.inputs['Material'].default_value = groove_mat

    for obj in bpy.context.selected_objects:
        if obj.type != 'MESH':
            continue
        mod = obj.modifiers.new('PanelGrooveMaker', 'NODES')
        mod.node_group = ng
        print(f"[holoflow_macros] PanelGrooveMaker applied → {obj.name}")
