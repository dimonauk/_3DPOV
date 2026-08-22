# ============================================================
# Holoflow Macro — Shader Node Group Batch Material
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# Reusable helper: create a named shader node group and apply
# it to all selected mesh objects.  Import and call from a
# larger pipeline script or run standalone.
# ============================================================

import bpy
import colorsys


def purge_group(name: str) -> None:
    ng = bpy.data.node_groups.get(name)
    if ng:
        bpy.data.node_groups.remove(ng)


def build_shader_group(
    name: str,
    base_color: tuple = (0.18, 0.18, 0.82, 1.0),
    shadow_color: tuple = (0.03, 0.03, 0.07, 1.0),
    toon_steps: float = 3.0,
    edge_glow: float = 0.40,
    rim_strength: float = 2.5,
) -> bpy.types.ShaderNodeTree:
    """
    Build and return an HS_FacetCelShader-style shader node group.
    EEVEE only: ShaderToRGB is not available in Cycles.
    """
    purge_group(name)
    nt    = bpy.data.node_groups.new(name, 'ShaderNodeTree')
    nodes = nt.nodes
    links = nt.links

    def at(node, x, y):
        node.location = (x, y)

    # Interface
    cs = nt.interface.new_socket('Color', in_out='INPUT',
                                  socket_type='NodeSocketColor')
    cs.default_value = base_color

    ss = nt.interface.new_socket('Shadow Color', in_out='INPUT',
                                  socket_type='NodeSocketColor')
    ss.default_value = shadow_color

    ts = nt.interface.new_socket('Toon Steps', in_out='INPUT',
                                  socket_type='NodeSocketFloat')
    ts.default_value = toon_steps
    ts.min_value = 1.0
    ts.max_value = 8.0

    eg = nt.interface.new_socket('Edge Glow', in_out='INPUT',
                                  socket_type='NodeSocketFloat')
    eg.default_value = edge_glow
    eg.min_value = 0.0
    eg.max_value = 1.0

    nt.interface.new_socket('Surface', in_out='OUTPUT',
                             socket_type='NodeSocketShader')

    gi = nodes.new('NodeGroupInput');  at(gi, -780, 0)
    go = nodes.new('NodeGroupOutput'); at(go,  700, 0)

    diff = nodes.new('ShaderNodeBsdfDiffuse'); at(diff, -540, 100)
    links.new(gi.outputs['Color'], diff.inputs['Color'])

    s2r = nodes.new('ShaderNodeShaderToRGB'); at(s2r, -330, 100)
    links.new(diff.outputs['BSDF'], s2r.inputs['Shader'])

    bw = nodes.new('ShaderNodeRGBToBW'); at(bw, -120, 100)
    links.new(s2r.outputs['Color'], bw.inputs['Color'])

    mul = nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; at(mul, 60, 140)
    links.new(bw.outputs['Val'],             mul.inputs[0])
    links.new(gi.outputs['Toon Steps'],      mul.inputs[1])

    flr = nodes.new('ShaderNodeMath'); flr.operation = 'FLOOR'; at(flr, 240, 140)
    links.new(mul.outputs['Value'], flr.inputs[0])

    div = nodes.new('ShaderNodeMath'); div.operation = 'DIVIDE'; at(div, 420, 140)
    links.new(flr.outputs['Value'],          div.inputs[0])
    links.new(gi.outputs['Toon Steps'],      div.inputs[1])

    mix = nodes.new('ShaderNodeMixRGB'); mix.blend_type = 'MIX'; at(mix, 60, -100)
    links.new(div.outputs['Value'],          mix.inputs['Fac'])
    links.new(gi.outputs['Shadow Color'],    mix.inputs['Color1'])
    links.new(gi.outputs['Color'],           mix.inputs['Color2'])

    eb = nodes.new('ShaderNodeEmission'); eb.label = 'Body Emission'; at(eb, 300, -80)
    links.new(mix.outputs['Color'], eb.inputs['Color'])

    fres = nodes.new('ShaderNodeFresnel'); fres.inputs['IOR'].default_value = 1.45; at(fres, -120, -260)

    rm = nodes.new('ShaderNodeMath'); rm.operation = 'MULTIPLY'; at(rm, 60, -300)
    links.new(fres.outputs['Fac'],           rm.inputs[0])
    links.new(gi.outputs['Edge Glow'],       rm.inputs[1])

    er = nodes.new('ShaderNodeEmission')
    er.label = 'Rim Emission'
    er.inputs['Color'].default_value    = (1.0, 1.0, 1.0, 1.0)
    er.inputs['Strength'].default_value = rim_strength
    at(er, 300, -260)

    ms = nodes.new('ShaderNodeMixShader'); at(ms, 520, -120)
    links.new(rm.outputs['Value'],      ms.inputs['Fac'])
    links.new(eb.outputs['Emission'],   ms.inputs[1])
    links.new(er.outputs['Emission'],   ms.inputs[2])
    links.new(ms.outputs['Shader'],     go.inputs['Surface'])

    return nt


def apply_group_to_selection(
    group: bpy.types.ShaderNodeTree,
    objects=None,
    unique_hue: bool = True,
) -> int:
    """
    Apply group to objects (defaults to all selected MESH objects).
    Returns the count of materials created.
    """
    if objects is None:
        objects = [o for o in bpy.context.selected_objects if o.type == 'MESH']

    count = 0
    for obj in objects:
        mat_name = f"M_{group.name}_{obj.name}"
        mat = bpy.data.materials.get(mat_name)
        if mat:
            bpy.data.materials.remove(mat)
        mat = bpy.data.materials.new(mat_name)
        mat.use_nodes = True
        mat.node_tree.nodes.clear()

        gn = mat.node_tree.nodes.new('ShaderNodeGroup')
        gn.node_tree = group
        gn.location  = (-200, 0)

        if unique_hue:
            r, g, b = colorsys.hsv_to_rgb((count * 0.11) % 1.0, 0.75, 0.85)
            gn.inputs['Color'].default_value = (r, g, b, 1.0)

        out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        out.location = (160, 0)
        mat.node_tree.links.new(gn.outputs['Surface'], out.inputs['Surface'])

        obj.data.materials.clear()
        obj.data.materials.append(mat)
        count += 1

    return count


if __name__ == '__main__':
    group = build_shader_group('HS_FacetCelShader')
    n = apply_group_to_selection(group, list(bpy.data.objects))
    print(f"[HS macro] Applied {group.name} to {n} objects.")
