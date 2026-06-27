"""
holoflow_macros/gn_city_block_extrude.py
GN City Block Extrude — Reusable Macro
Blender 5.1 · CC0 · Holoflow Studio

Call build_city_block_gn_tree(ng_name, height_min, height_max, park_threshold)
to append the HS_CityBlock geometry nodes tree to any open Blender file.
Typical usage: run from the Blender Python console or import from another script.

See: public/library/blends/geometry-nodes/gn-extrude-mesh-city-block-attribute-height/blueprint.py
Tutorial: /tutorials/blender-tutorial-gn-extrude-mesh-city-block-attribute-height
"""

import bpy

_SEED_PARK_OFFSET = 10_000   # W offset separating park noise from height noise


def build_city_block_gn_tree(
    ng_name: str = "HS_CityBlock",
    height_min: float = 0.5,
    height_max: float = 6.0,
    park_threshold: float = 0.25,
) -> bpy.types.GeometryNodeTree:
    """
    Build and return the HS_CityBlock GN tree.

    Args:
        ng_name:        Node group name.  Overwrites existing group with same name.
        height_min:     Shortest tower height in metres.
        height_max:     Tallest tower height in metres.
        park_threshold: Fraction of lots left unextruded (0 = all built, 1 = all park).

    Returns:
        The new GeometryNodeTree, ready to assign to a modifier:
            mod = ob.modifiers.new('HS_CityBlock', 'NODES')
            mod.node_group = build_city_block_gn_tree()
    """
    if ng_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[ng_name])

    ng = bpy.data.node_groups.new(ng_name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes

    def lk(a, b):
        ng.links.new(a, b)

    in_n  = N.new('NodeGroupInput');  in_n.location  = (-1100, 0)
    out_n = N.new('NodeGroupOutput'); out_n.location  = (850,   0)

    # Height field: face_index → White Noise 1D → MapRange → Offset Scale
    fi_h = N.new('GeometryNodeInputIndex'); fi_h.location = (-850, 280)
    wn_h = N.new('ShaderNodeTexWhiteNoise'); wn_h.location = (-650, 280)
    wn_h.noise_dimensions = '1D'
    mr_h = N.new('ShaderNodeMapRange'); mr_h.location = (-420, 280)
    mr_h.clamp = True
    mr_h.inputs['From Min'].default_value = 0.0
    mr_h.inputs['From Max'].default_value = 1.0
    mr_h.inputs['To Min'].default_value   = height_min
    mr_h.inputs['To Max'].default_value   = height_max

    # Park selection: (face_index + OFFSET) → White Noise 1D → Compare
    fi_p   = N.new('GeometryNodeInputIndex'); fi_p.location = (-850, -220)
    add_p  = N.new('ShaderNodeMath'); add_p.location = (-680, -220)
    add_p.operation = 'ADD'
    add_p.inputs[1].default_value = float(_SEED_PARK_OFFSET)
    wn_p   = N.new('ShaderNodeTexWhiteNoise'); wn_p.location = (-480, -220)
    wn_p.noise_dimensions = '1D'
    cmp    = N.new('FunctionNodeCompare'); cmp.location = (-280, -220)
    cmp.data_type = 'FLOAT'
    cmp.operation = 'GREATER_THAN'
    cmp.inputs['B'].default_value = park_threshold

    # Extrude Mesh
    ext = N.new('GeometryNodeExtrudeMesh'); ext.location = (-50, 0)
    ext.mode = 'FACES'
    ext.use_individual_faces = True

    # Material index assignment (Top=2 rooftop, Side=1 wall, rest=0 ground)
    smi_roof = N.new('GeometryNodeSetMaterialIndex'); smi_roof.location = (200, 120)
    smi_roof.inputs['Material Index'].default_value = 2
    smi_wall = N.new('GeometryNodeSetMaterialIndex'); smi_wall.location = (500, 0)
    smi_wall.inputs['Material Index'].default_value = 1

    # Wire
    lk(fi_h.outputs['Index'],        wn_h.inputs['W'])
    lk(wn_h.outputs['Value'],        mr_h.inputs['Value'])
    lk(fi_p.outputs['Index'],        add_p.inputs[0])
    lk(add_p.outputs['Value'],       wn_p.inputs['W'])
    lk(wn_p.outputs['Value'],        cmp.inputs['A'])
    lk(in_n.outputs['Geometry'],     ext.inputs['Mesh'])
    lk(cmp.outputs['Result'],        ext.inputs['Selection'])
    lk(mr_h.outputs['Result'],       ext.inputs['Offset Scale'])
    lk(ext.outputs['Mesh'],          smi_roof.inputs['Geometry'])
    lk(ext.outputs['Top'],           smi_roof.inputs['Selection'])
    lk(smi_roof.outputs['Geometry'], smi_wall.inputs['Geometry'])
    lk(ext.outputs['Side'],          smi_wall.inputs['Selection'])
    lk(smi_wall.outputs['Geometry'], out_n.inputs['Geometry'])

    return ng
