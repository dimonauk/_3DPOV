"""
holoflow_macros/shader_lava_magma_flow.py
Holoflow Studio — reusable macro: apply lava/magma flow material to any selected mesh.

Usage (Text Editor or bpy.ops call):
  import holoflow_macros.shader_lava_magma_flow as lava_macro
  lava_macro.apply(bpy.context.active_object, scale=5.0, emission_strength=6.0)

Parameters:
  scale             — Voronoi cell density (default 5.0)
  randomness        — cell regularity 0–1 (default 0.75)
  emission_strength — crack glow strength; >1 triggers EEVEE Bloom (default 6.0)
  disp_scale        — height of lava plates in world units (default 0.12)
  scroll_speed      — Y-scroll per frame via driver (default 0.003)

The macro appends the material (does not replace existing slots) and enables
Displacement and Bump on the material.  Call apply_render_settings() separately
to configure EEVEE Bloom on the active scene.
"""

import bpy

_MAT_NAME = "holoflow_lava_magma_flow"


def build_material(
    scale: float = 5.0,
    randomness: float = 0.75,
    emission_strength: float = 6.0,
    disp_scale: float = 0.12,
    scroll_speed: float = 0.003,
) -> bpy.types.Material:
    existing = bpy.data.materials.get(_MAT_NAME)
    if existing:
        return existing

    mat = bpy.data.materials.new(_MAT_NAME)
    mat.use_nodes = True
    mat.displacement_method = 'DISPLACEMENT'

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    def n(t, x, y):
        nd = nodes.new(t)
        nd.location = (x, y)
        return nd

    out        = n('ShaderNodeOutputMaterial', 700,    0)
    tex_coord  = n('ShaderNodeTexCoord',      -1000,  100)
    mapping    = n('ShaderNodeMapping',        -800,  100)
    mapping.name = "lava_flow_mapping"

    drv = mapping.inputs['Location'].driver_add('default_value', 1)
    drv.driver.expression = f"frame * {scroll_speed}"

    vor_edge = n('ShaderNodeTexVoronoi', -560,  200)
    vor_edge.voronoi_dimensions = '3D'
    vor_edge.feature             = 'DISTANCE_TO_EDGE'
    vor_edge.inputs['Scale'].default_value      = scale
    vor_edge.inputs['Randomness'].default_value = randomness

    inv_crack = n('ShaderNodeMath', -320, 280)
    inv_crack.operation = 'SUBTRACT'
    inv_crack.inputs[0].default_value = 1.0

    crack_ramp = n('ShaderNodeValToRGB', -120, 280)
    crack_ramp.color_ramp.interpolation = 'EASE'
    els = crack_ramp.color_ramp.elements
    els[0].position = 0.0;   els[0].color = (0, 0, 0, 1)
    els.new(0.08);            crack_ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    crack_ramp.color_ramp.elements.new(0.12); crack_ramp.color_ramp.elements[-1].color = (1,1,1,1)

    vor_f1 = n('ShaderNodeTexVoronoi', -560, -100)
    vor_f1.voronoi_dimensions = '3D'
    vor_f1.feature             = 'F1'
    vor_f1.inputs['Scale'].default_value      = scale
    vor_f1.inputs['Randomness'].default_value = randomness

    plate_ramp = n('ShaderNodeValToRGB', -320, -100)
    plate_ramp.color_ramp.interpolation = 'B_SPLINE'
    pr = plate_ramp.color_ramp.elements
    pr[0].position = 0.0;  pr[0].color = (1.0, 0.38, 0.02, 1)
    plate_ramp.color_ramp.elements.new(0.45); plate_ramp.color_ramp.elements[1].color=(0.55,0.04,0.01,1)
    pr[1].position = 0.75; pr[1].color = (0.08, 0.01, 0.0, 1)

    pbsdf   = n('ShaderNodeBsdfPrincipled',  200, -100)
    pbsdf.inputs['Roughness'].default_value          = 0.90
    pbsdf.inputs['Specular IOR Level'].default_value  = 0.08
    pbsdf.inputs['Subsurface Weight'].default_value   = 0.06
    pbsdf.inputs['Subsurface Radius'].default_value   = (0.8, 0.15, 0.05)
    pbsdf.inputs['Subsurface Scale'].default_value    = 0.04

    emit    = n('ShaderNodeEmission',        200,  200)
    emit.inputs['Color'].default_value    = (1.0, 0.72, 0.10, 1)
    emit.inputs['Strength'].default_value = emission_strength

    mix     = n('ShaderNodeMixShader',       460,  100)
    inv_d   = n('ShaderNodeMath',           -120, -300)
    inv_d.operation = 'SUBTRACT'; inv_d.inputs[0].default_value = 1.0
    disp    = n('ShaderNodeDisplacement',    200, -300)
    disp.space = 'WORLD'
    disp.inputs['Scale'].default_value    = disp_scale
    disp.inputs['Midlevel'].default_value = 0.0

    links.new(tex_coord.outputs['Generated'],  mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'],        vor_edge.inputs['Vector'])
    links.new(mapping.outputs['Vector'],        vor_f1.inputs['Vector'])
    links.new(vor_edge.outputs['Distance'],     inv_crack.inputs[1])
    links.new(inv_crack.outputs['Value'],       crack_ramp.inputs['Fac'])
    links.new(vor_f1.outputs['Distance'],       plate_ramp.inputs['Fac'])
    links.new(plate_ramp.outputs['Color'],      pbsdf.inputs['Base Color'])
    links.new(plate_ramp.outputs['Color'],      pbsdf.inputs['Subsurface Color'])
    links.new(crack_ramp.outputs['Color'],      emit.inputs['Color'])
    links.new(crack_ramp.outputs['Fac'],        mix.inputs['Fac'])
    links.new(pbsdf.outputs['BSDF'],            mix.inputs[1])
    links.new(emit.outputs['Emission'],         mix.inputs[2])
    links.new(mix.outputs['Shader'],            out.inputs['Surface'])
    links.new(vor_f1.outputs['Distance'],       inv_d.inputs[1])
    links.new(inv_d.outputs['Value'],           disp.inputs['Height'])
    links.new(disp.outputs['Displacement'],     out.inputs['Displacement'])

    return mat


def apply(obj: bpy.types.Object, **kwargs) -> bpy.types.Material:
    mat = build_material(**kwargs)
    if mat.name not in obj.data.materials:
        obj.data.materials.append(mat)
    return mat


def apply_render_settings(scene: bpy.types.Scene | None = None) -> None:
    sc = scene or bpy.context.scene
    sc.eevee.use_bloom       = True
    sc.eevee.bloom_threshold = 1.0
    sc.eevee.bloom_intensity = 0.25
    sc.eevee.bloom_radius    = 4.0
