"""
holoflow_macros/shader_wood_grain.py
=====================================
Reusable function: build_wood_grain_material(obj, **params)

Attaches a fully-wired procedural wood grain material to any Blender mesh
object.  All parameters are keyword-overridable; defaults produce an oak
plank.  Call from the Python console, another script, or a Blender add-on.

Usage
-----
    import bpy
    from holoflow_macros.shader_wood_grain import build_wood_grain_material

    obj = bpy.context.active_object
    build_wood_grain_material(obj,
        ring_freq=8.0,          # old-growth wide rings
        distort_strength=0.5,   # highly wavy grain
        roughness_base=0.18,    # lacquered finish
        anisotropy=0.82,
    )
"""

import bpy

# Default oak plank parameters
_DEFAULTS = dict(
    ring_freq        = 14.0,
    long_compress    = 0.06,
    distort_scale    = 0.8,
    distort_detail   = 8.0,
    distort_rough    = 0.55,
    distort_strength = 0.38,
    dark_wood        = (0.079, 0.033, 0.007),
    light_wood       = (0.570, 0.280, 0.072),
    mid_wood         = (0.330, 0.145, 0.030),
    fiber_scale      = 55.0,
    roughness_base   = 0.30,
    roughness_var    = 0.14,
    ior              = 1.55,
    anisotropy       = 0.68,
    aniso_rotation   = 0.0,
    uv_map_name      = "UVMap",
    mat_name         = "wood_grain_mat",
)


def _lnk(nt, a, ao, b, bi):
    nt.links.new(a.outputs[ao], b.inputs[bi])


def _nd(nt, t, x, y, **kw):
    n = nt.nodes.new(t)
    n.location = (x, y)
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def build_wood_grain_material(obj: bpy.types.Object, **overrides) -> bpy.types.Material:
    """
    Build and attach a procedural wood grain material.

    Parameters mirror the blueprint.py constants; see that file for the
    technical rationale of each value.  Returns the created Material.
    """
    p = {**_DEFAULTS, **overrides}

    mat = bpy.data.materials.new(p["mat_name"])
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = _nd(nt, 'ShaderNodeOutputMaterial', 1200, 0)
    pbsdf = _nd(nt, 'ShaderNodeBsdfPrincipled',  850, 0)
    pbsdf.inputs['Metallic'].default_value            = 0.0
    pbsdf.inputs['IOR'].default_value                 = p["ior"]
    pbsdf.inputs['Anisotropic'].default_value         = p["anisotropy"]
    pbsdf.inputs['Anisotropic Rotation'].default_value = p["aniso_rotation"]
    _lnk(nt, pbsdf, 'BSDF', out, 'Surface')

    tc      = _nd(nt, 'ShaderNodeTexCoord',   -900,    0)
    v_scale = _nd(nt, 'ShaderNodeVectorMath', -700,    0, operation='MULTIPLY')
    rf, lc  = p["ring_freq"], p["long_compress"]
    v_scale.inputs[1].default_value = (rf, rf, rf * lc)
    _lnk(nt, tc, 'Object', v_scale, 0)

    n_dist  = _nd(nt, 'ShaderNodeTexNoise',   -500, -220)
    n_dist.inputs['Scale'].default_value     = p["distort_scale"]
    n_dist.inputs['Detail'].default_value    = p["distort_detail"]
    n_dist.inputs['Roughness'].default_value = p["distort_rough"]
    n_dist.inputs['Distortion'].default_value = 0.0
    _lnk(nt, v_scale, 'Vector', n_dist, 'Vector')

    v_ds = _nd(nt, 'ShaderNodeVectorMath', -280, -220, operation='SCALE')
    v_ds.inputs['Scale'].default_value = p["distort_strength"]
    _lnk(nt, n_dist, 'Color', v_ds, 0)

    v_add = _nd(nt, 'ShaderNodeVectorMath', -60, 0, operation='ADD')
    _lnk(nt, v_scale, 'Vector', v_add, 0)
    _lnk(nt, v_ds,    'Vector', v_add, 1)

    wave = _nd(nt, 'ShaderNodeTexWave', 160, 0,
               wave_type='BANDS', bands_direction='X', wave_profile='SIN')
    wave.inputs['Scale'].default_value           = 1.0
    wave.inputs['Distortion'].default_value      = 0.0
    wave.inputs['Detail'].default_value          = 2.0
    wave.inputs['Detail Scale'].default_value    = 1.0
    wave.inputs['Detail Roughness'].default_value = 0.50
    _lnk(nt, v_add, 'Vector', wave, 'Vector')

    cr = _nd(nt, 'ShaderNodeValToRGB', 400, 100)
    cr.color_ramp.interpolation = 'B_SPLINE'
    cr.color_ramp.elements[0].position = 0.0
    cr.color_ramp.elements[0].color    = (*p["dark_wood"], 1.0)
    s1 = cr.color_ramp.elements.new(0.42)
    s1.color = (*p["light_wood"], 1.0)
    s2 = cr.color_ramp.elements.new(0.70)
    s2.color = (*p["mid_wood"], 1.0)
    cr.color_ramp.elements[-1].position = 1.0
    cr.color_ramp.elements[-1].color    = (*p["dark_wood"], 1.0)
    _lnk(nt, wave, 'Fac',   cr,    'Fac')
    _lnk(nt, cr,   'Color', pbsdf, 'Base Color')

    n_fib = _nd(nt, 'ShaderNodeTexNoise', 160, -300)
    n_fib.inputs['Scale'].default_value     = p["fiber_scale"]
    n_fib.inputs['Detail'].default_value    = 6.0
    n_fib.inputs['Roughness'].default_value = 0.80
    n_fib.inputs['Distortion'].default_value = 0.10
    _lnk(nt, v_add, 'Vector', n_fib, 'Vector')

    mr = _nd(nt, 'ShaderNodeMapRange', 400, -280)
    mr.inputs['From Min'].default_value = 0.0
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value   = max(0.05, p["roughness_base"] - p["roughness_var"])
    mr.inputs['To Max'].default_value   = min(0.95, p["roughness_base"] + p["roughness_var"])
    _lnk(nt, n_fib, 'Fac', mr, 'Value')
    _lnk(nt, mr, 'Result', pbsdf, 'Roughness')

    tang = _nd(nt, 'ShaderNodeTangent', 600, -340)
    tang.direction_type = 'UV_MAP'
    tang.uv_map = p["uv_map_name"]
    _lnk(nt, tang, 'Tangent', pbsdf, 'Tangent')

    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return mat
