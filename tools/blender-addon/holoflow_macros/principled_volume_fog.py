"""
holoflow_macros/principled_volume_fog.py
Holoflow Studio — Blender 5.1 | CC0-1.0

Reusable helper: attach a Principled Volume fog material to any selected
closed mesh and configure EEVEE Next volumetric settings in one call.

Usage (Blender Scripting workspace):
    import importlib, sys
    sys.path.insert(0, "/path/to/tools/blender-addon")
    from holoflow_macros import principled_volume_fog as pvf
    pvf.apply_fog(density=0.15, anisotropy=0.5, noise_scale=1.8)
"""

import bpy

# ── Defaults ──────────────────────────────────────────────────────────────────

_DEFAULTS = dict(
    density       = 0.15,
    anisotropy    = 0.50,
    scatter_color = (0.65, 0.80, 1.00, 1.0),
    absorb_color  = (1.00, 0.90, 0.75, 1.0),
    emission      = 0.0,
    noise_scale   = 1.8,
    noise_detail  = 6.0,
    noise_rough   = 0.65,
    noise_dist    = 0.30,
    ramp_cut      = 0.30,
    vol_tile      = '2',
    vol_samples   = 128,
)

# ── Node helpers ──────────────────────────────────────────────────────────────

def _n(tree, bl_type, loc=(0, 0)):
    nd = tree.nodes.new(bl_type)
    nd.location = loc
    return nd


def _lnk(tree, a, a_s, b, b_s):
    tree.links.new(a.outputs[a_s], b.inputs[b_s])

# ── Public API ────────────────────────────────────────────────────────────────

def build_volume_material(name: str = "hf_fog_volume", **kw) -> bpy.types.Material:
    """Return a new Principled Volume material with noise-driven density."""
    p = {**_DEFAULTS, **kw}
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = _n(tree, 'ShaderNodeOutputMaterial',  (700, 0))
    pvol = _n(tree, 'ShaderNodeVolumePrincipled', (400, 0))
    ramp = _n(tree, 'ShaderNodeValToRGB',         (100, -80))
    noi  = _n(tree, 'ShaderNodeTexNoise',         (-200, 0))
    tc   = _n(tree, 'ShaderNodeTexCoord',         (-500, 0))

    pvol.inputs['Density'].default_value           = p['density']
    pvol.inputs['Anisotropy'].default_value        = p['anisotropy']
    pvol.inputs['Scatter Color'].default_value     = p['scatter_color']
    pvol.inputs['Absorption Color'].default_value  = p['absorb_color']
    pvol.inputs['Emission Strength'].default_value = p['emission']

    noi.inputs['Scale'].default_value      = p['noise_scale']
    noi.inputs['Detail'].default_value     = p['noise_detail']
    noi.inputs['Roughness'].default_value  = p['noise_rough']
    noi.inputs['Distortion'].default_value = p['noise_dist']

    cr = ramp.color_ramp
    cr.elements[0].position = p['ramp_cut']
    cr.elements[0].color    = (0, 0, 0, 1)
    cr.elements[1].position = 1.0
    cr.elements[1].color    = (1, 1, 1, 1)

    _lnk(tree, tc,   'Object', noi,  'Vector')
    _lnk(tree, noi,  'Fac',    ramp, 'Fac')
    _lnk(tree, ramp, 'Color',  pvol, 'Density')
    _lnk(tree, pvol, 'Volume', out,  'Volume')

    return mat


def configure_eevee_next(scene=None, **kw):
    """Apply EEVEE Next volumetric render settings."""
    p = {**_DEFAULTS, **kw}
    scene = scene or bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    ev = scene.eevee
    ev.volumetric_tile_size           = p['vol_tile']
    ev.volumetric_samples             = p['vol_samples']
    ev.volumetric_sample_distribution = 0.8
    ev.use_volumetric_shadows         = True


def apply_fog(obj=None, **kw):
    """
    Attach a Principled Volume fog material to `obj` (defaults to the active
    object) and configure EEVEE Next in one call.

    Example:
        pvf.apply_fog(density=0.25, anisotropy=0.6, noise_scale=2.4)
    """
    obj = obj or bpy.context.active_object
    if obj is None:
        raise RuntimeError("No active object — select a closed mesh first.")
    mat = build_volume_material(**kw)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    obj["holoflow:volume_proxy"]      = True
    obj["holoflow:volume_density"]    = kw.get('density', _DEFAULTS['density'])
    obj["holoflow:volume_anisotropy"] = kw.get('anisotropy', _DEFAULTS['anisotropy'])
    configure_eevee_next(**kw)
    print(f"[hf] Fog material '{mat.name}' applied to '{obj.name}'.")
    return mat
