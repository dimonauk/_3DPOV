"""
holoflow_macros/gn_mesh_topology_vertex_valence_heat_map.py
Reusable function: add the vertex valence heat map GN modifier to any mesh object.

Usage (in Blender Text Editor or via bpy exec):
  import importlib, sys
  sys.path.insert(0, '/path/to/holoflow_macros')
  import gn_mesh_topology_vertex_valence_heat_map as vm
  vm.apply_valence_heat_map(bpy.context.object)
"""

import bpy

ATTR_NAME    = "valence_col"
VALENCE_MIN  = 3
VALENCE_MAX  = 8


def _ensure_valence_material():
    name = "Valence_Heat_Map"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    nattr = nt.nodes.new('ShaderNodeAttribute')
    nattr.attribute_type = 'GEOMETRY'
    nattr.attribute_name = ATTR_NAME
    emis = nt.nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = 1.0
    mout = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(nattr.outputs['Color'],   emis.inputs['Color'])
    nt.links.new(emis.outputs['Emission'], mout.inputs['Surface'])
    return mat


def _ensure_node_group(mat):
    name = "ValenceHeatMap"
    if name in bpy.data.node_groups:
        return bpy.data.node_groups[name]

    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links
    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ni.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')

    def nd(t, lbl=None):
        n = nds.new(t)
        if lbl:
            n.label = lbl
        return n

    gin   = nd('NodeGroupInput')
    gout  = nd('NodeGroupOutput')
    iidx  = nd('GeometryNodeInputIndex')
    eov   = nd('GeometryNodeEdgesOfVertex', 'Edges of Vertex')
    mran  = nd('ShaderNodeMapRange')
    mran.data_type = 'FLOAT'
    mran.clamp     = True
    mran.inputs[1].default_value = float(VALENCE_MIN)
    mran.inputs[2].default_value = float(VALENCE_MAX)
    mran.inputs[3].default_value = 0.0
    mran.inputs[4].default_value = 1.0

    cramp = nd('ShaderNodeValToRGB')
    cr = cramp.color_ramp
    cr.interpolation = 'LINEAR'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.04,0.18,0.85,1.0)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.87,0.07,0.07,1.0)
    cr.elements.new(0.2).color = (0.05,0.82,0.54,1.0)
    cr.elements.new(0.4).color = (0.96,0.88,0.04,1.0)
    cr.elements.new(0.7).color = (0.97,0.45,0.06,1.0)

    sattr = nd('GeometryNodeStoreNamedAttribute')
    sattr.data_type = 'FLOAT_COLOR'
    sattr.domain    = 'POINT'
    sattr.inputs['Name'].default_value = ATTR_NAME
    sattr.inputs[1].default_value = True

    smat = nd('GeometryNodeSetMaterial')
    smat.inputs[2].default_value = mat

    lks.new(iidx.outputs['Index'],   eov.inputs['Vertex Index'])
    lks.new(eov.outputs['Total'],    mran.inputs[0])
    lks.new(mran.outputs['Result'],  cramp.inputs['Fac'])
    lks.new(gin.outputs['Geometry'], sattr.inputs[0])
    lks.new(cramp.outputs['Color'],  sattr.inputs[3])
    lks.new(sattr.outputs[0],        smat.inputs[0])
    lks.new(smat.outputs[0],         gout.inputs[0])
    return ng


def apply_valence_heat_map(obj):
    """Add (or replace) the ValenceHeatMap GN modifier on the given object.
    Safe to call multiple times — reuses the existing node group and material.
    """
    if obj is None or obj.type != 'MESH':
        raise TypeError(f"apply_valence_heat_map expects a MESH object, got {obj!r}")
    for mod in list(obj.modifiers):
        if mod.type == 'NODES' and mod.name == 'ValenceHeatMap':
            obj.modifiers.remove(mod)
    mat = _ensure_valence_material()
    ng  = _ensure_node_group(mat)
    mod = obj.modifiers.new("ValenceHeatMap", 'NODES')
    mod.node_group = ng
    print(f"[holoflow_macros] ValenceHeatMap applied to '{obj.name}'")
    return mod
