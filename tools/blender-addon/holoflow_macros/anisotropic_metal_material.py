"""
holoflow_macros/anisotropic_metal_material.py
Blender 5.1  |  CC0

Callable macro: attach an Anisotropic BSDF brushed-metal material to every
selected object.  Preserves existing materials; replaces slot 0 with the
brushed-metal material.

Usage (Scripting workspace):
    import importlib, sys
    sys.path.insert(0, "/path/to/tools/blender-addon")
    from holoflow_macros import anisotropic_metal_material as amm
    amm.apply(circular=False, tint=(0.62, 0.64, 0.68, 1.0))
"""

import bpy

# Defaults (override as kwargs to apply())
_DEFAULTS = dict(
    roughness   = 0.14,
    anisotropy  = 0.88,
    distribution = 'GGX',
    noise_scale  = 85.0,
    noise_gain   = 0.06,
    circular     = False,
    tint         = (0.62, 0.64, 0.68, 1.0),
)


def _build_mat(name, *, roughness, anisotropy, distribution,
               noise_scale, noise_gain, circular, tint):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    lnk = nt.links.new

    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    aniso = nt.nodes.new('ShaderNodeBsdfAnisotropic')
    tang  = nt.nodes.new('ShaderNodeTangent')
    coord = nt.nodes.new('ShaderNodeTexCoord')
    noise = nt.nodes.new('ShaderNodeTexNoise')
    mul   = nt.nodes.new('ShaderNodeMath')
    add   = nt.nodes.new('ShaderNodeMath')

    aniso.distribution = distribution
    aniso.inputs['Color'].default_value      = tint
    aniso.inputs['Roughness'].default_value  = roughness
    aniso.inputs['Anisotropy'].default_value = anisotropy

    if circular:
        tang.direction_type = 'RADIAL'
        tang.axis           = 'Z'
    else:
        tang.direction_type = 'UV_MAP'
        tang.uv_map         = 'UVMap'

    noise.noise_dimensions = '3D'
    noise.inputs['Scale'].default_value      = noise_scale
    noise.inputs['Detail'].default_value     = 0.0
    noise.inputs['Roughness'].default_value  = 0.0
    noise.inputs['Distortion'].default_value = 0.1

    mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = noise_gain
    add.operation = 'ADD';      add.inputs[1].default_value = roughness

    lnk(coord.outputs['Object'], noise.inputs['Vector'])
    lnk(noise.outputs['Fac'],    mul.inputs[0])
    lnk(mul.outputs['Value'],    add.inputs[0])
    lnk(add.outputs['Value'],    aniso.inputs['Roughness'])
    lnk(tang.outputs['Tangent'], aniso.inputs['Tangent'])
    lnk(aniso.outputs['BSDF'],   out.inputs['Surface'])

    return mat


def apply(**kwargs):
    """Apply brushed-metal Anisotropic BSDF to all selected objects."""
    opts = {**_DEFAULTS, **kwargs}
    selected = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if not selected:
        print("anisotropic_metal_material: no mesh objects selected.")
        return

    suffix = "circular" if opts['circular'] else "linear"
    mat_name = f"holoflow_aniso_{suffix}"
    mat = bpy.data.materials.get(mat_name) or _build_mat(mat_name, **opts)

    for obj in selected:
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
        print(f"  Applied {mat_name} → {obj.name}")

    print(f"Done. {len(selected)} object(s) updated.")
