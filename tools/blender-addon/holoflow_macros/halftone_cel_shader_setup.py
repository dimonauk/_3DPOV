"""
holoflow_macros/halftone_cel_shader_setup.py
============================================
One-click: apply an AM halftone cel-shade material to all selected mesh objects.
Blender 5.1 · EEVEE Next · CC0

Usage:
  In Blender Python console or Text Editor:
    from holoflow_macros import halftone_cel_shader_setup
    halftone_cel_shader_setup.apply_to_selection()

Or register as a menu entry by calling register() in the parent add-on.
"""

import bpy
import math

# ── DEFAULTS (override before calling apply_to_selection) ─────────────────────
SCREEN_FREQ  = 18.0
DOT_SHADOW   = 0.44
DOT_LIT      = 0.16
SCREEN_ANGLE = math.radians(45.0)
BAND_THRESH  = 0.45


def _nd(nt, type_, x, y):
    n = nt.nodes.new(type_)
    n.location = (x, y)
    return n


def make_halftone_material(
    name: str = "HalftoneCel",
    freq: float = SCREEN_FREQ,
    dot_shadow: float = DOT_SHADOW,
    dot_lit: float = DOT_LIT,
    angle: float = SCREEN_ANGLE,
    band_thresh: float = BAND_THRESH,
) -> bpy.types.Material:
    """
    Build a new HalftoneCel material (or return existing one with the same name).
    Caller is responsible for assigning to obj.data.materials.append(mat).
    """
    if name in bpy.data.materials:
        return bpy.data.materials[name]

    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    L   = nt.links.new

    out   = _nd(nt, 'ShaderNodeOutputMaterial',  1400, 0)
    pbsdf = _nd(nt, 'ShaderNodeBsdfPrincipled',  -650, 240)
    pbsdf.inputs['Base Color'].default_value = (0.55, 0.55, 0.55, 1.0)
    pbsdf.inputs['Roughness'].default_value  = 0.55

    s2rgb = _nd(nt, 'ShaderNodeShaderToRGB',    -380, 240)
    L(pbsdf.outputs['BSDF'], s2rgb.inputs['Shader'])

    cramp = _nd(nt, 'ShaderNodeValToRGB',       -120, 240)
    cr    = cramp.color_ramp
    cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0.0;         cr.elements[0].color = (0.18, 0.18, 0.18, 1.0)
    cr.elements[1].position = band_thresh; cr.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    L(s2rgb.outputs['Color'], cramp.inputs['Fac'])

    texco   = _nd(nt, 'ShaderNodeTexCoord',  -1250, -80)
    mapping = _nd(nt, 'ShaderNodeMapping',   -1020, -80)
    mapping.inputs['Rotation'].default_value = (0.0, 0.0, angle)

    vscale = _nd(nt, 'ShaderNodeVectorMath', -780, -80)
    vscale.operation = 'SCALE'
    vscale.inputs['Scale'].default_value = freq
    L(texco.outputs['UV'],       mapping.inputs['Vector'])
    L(mapping.outputs['Vector'], vscale.inputs[0])

    sep = _nd(nt, 'ShaderNodeSeparateXYZ', -560, -80)
    L(vscale.outputs['Vector'], sep.inputs['Vector'])

    fx = _nd(nt, 'ShaderNodeMath', -340, 30);   fx.operation = 'FRACT'
    fy = _nd(nt, 'ShaderNodeMath', -340, -200); fy.operation = 'FRACT'
    L(sep.outputs['X'], fx.inputs[0])
    L(sep.outputs['Y'], fy.inputs[0])

    cx = _nd(nt, 'ShaderNodeMath', -130, 30)
    cx.operation = 'SUBTRACT'; cx.inputs[1].default_value = 0.5
    cy = _nd(nt, 'ShaderNodeMath', -130, -200)
    cy.operation = 'SUBTRACT'; cy.inputs[1].default_value = 0.5
    L(fx.outputs['Value'], cx.inputs[0])
    L(fy.outputs['Value'], cy.inputs[0])

    comb = _nd(nt, 'ShaderNodeCombineXYZ', 80, -80)
    L(cx.outputs['Value'], comb.inputs['X'])
    L(cy.outputs['Value'], comb.inputs['Y'])
    comb.inputs['Z'].default_value = 0.0

    vlen = _nd(nt, 'ShaderNodeVectorMath', 280, -80)
    vlen.operation = 'LENGTH'
    L(comb.outputs['Vector'], vlen.inputs[0])

    mix_r = _nd(nt, 'ShaderNodeMix', 480, 240)
    mix_r.data_type = 'FLOAT'
    mix_r.inputs[2].default_value = dot_shadow
    mix_r.inputs[3].default_value = dot_lit
    L(cramp.outputs['Color'], mix_r.inputs['Factor'])

    step = _nd(nt, 'ShaderNodeMath', 720, 80)
    step.operation = 'LESS_THAN'
    L(vlen.outputs['Value'], step.inputs[0])
    L(mix_r.outputs[1],      step.inputs[1])

    mul = _nd(nt, 'ShaderNodeMath', 940, 80)
    mul.operation = 'MULTIPLY'
    L(step.outputs['Value'],  mul.inputs[0])
    L(cramp.outputs['Color'], mul.inputs[1])

    rgb = _nd(nt, 'ShaderNodeCombineColor', 1140, 80)
    L(mul.outputs['Value'], rgb.inputs['Red'])
    L(mul.outputs['Value'], rgb.inputs['Green'])
    L(mul.outputs['Value'], rgb.inputs['Blue'])

    emit = _nd(nt, 'ShaderNodeEmission', 1200, 240)
    emit.inputs['Strength'].default_value = 1.0
    L(rgb.outputs['Color'],     emit.inputs['Color'])
    L(emit.outputs['Emission'], out.inputs['Surface'])

    return mat


def apply_to_selection(**kwargs) -> int:
    """
    Apply (or replace first slot with) HalftoneCel on every selected mesh.
    Returns the count of objects updated.
    """
    mat   = make_halftone_material(**kwargs)
    count = 0
    for obj in bpy.context.selected_objects:
        if obj.type != 'MESH':
            continue
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
        count += 1
    print(f"[halftone_macro] Applied '{mat.name}' to {count} object(s).")
    return count
