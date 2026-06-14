"""
holoflow_macros/modifier_ocean_fourier_water.py
CC0 — Holoflow Studio

Reusable helper: add a production-ready Ocean modifier + water material
to any object (or a fresh plane) in a Blender 5.1 scene.

Usage:
    from holoflow_macros.modifier_ocean_fourier_water import (
        add_ocean_plane, make_water_material
    )
    obj, mod = add_ocean_plane()
    mat = make_water_material()
    obj.data.materials.append(mat)
"""

import bpy
import math


def add_ocean_plane(
    name: str = "ocean_surface",
    resolution: int = 7,
    size: float = 1.0,
    depth: float = 200.0,
    spectrum: str = "MAXJORNER",
    wave_scale: float = 1.5,
    wind_velocity: float = 28.0,
    wave_alignment: float = 0.9,
    choppiness: float = 1.5,
    damping: float = 0.5,
    foam_layer: str = "foam",
    fps: int = 25,
):
    """
    Add a plane, attach an Ocean modifier in GENERATE mode, wire a
    time driver to the frame counter, and return (obj, mod).

    Parameters mirror blueprint.py constants.  All defaults produce
    a 28 m/s MAXJORNER open-ocean swell at 25 fps.
    """
    bpy.ops.mesh.primitive_plane_add(size=size * 2, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name

    mod = obj.modifiers.new("Ocean", "OCEAN")
    mod.geometry_mode    = "GENERATE"
    mod.resolution       = resolution
    mod.size             = size
    mod.depth            = depth
    mod.spectrum         = spectrum
    mod.wave_scale       = wave_scale
    mod.wind_velocity    = wind_velocity
    mod.wave_alignment   = wave_alignment
    mod.choppiness       = choppiness
    mod.damping          = damping
    mod.random_seed      = 0
    mod.use_foam         = True
    mod.foam_layer_name  = foam_layer
    mod.time             = 0.0

    # Time driver: 1 Blender frame = 1/fps seconds of ocean time.
    fc = mod.driver_add("time")
    fc.driver.type       = "SCRIPTED"
    fc.driver.expression = f"frame / {fps}"

    return obj, mod


def make_water_material(
    foam_layer: str = "foam",
    ior: float = 1.333,
    roughness: float = 0.028,
    transmission: float = 0.92,
    coat_weight: float = 0.45,
    foam_emit: float = 2.2,
    ripple_scale: float = 14.0,
    ripple_strength: float = 0.32,
) -> bpy.types.Material:
    """
    Build a Principled BSDF water material with:
      · Transmission + IOR for refraction
      · Coat specular for sun glints
      · Noise Texture → Bump for micro-ripples
      · ShaderNodeAttribute(foam) → Mix Shader → Emission for foam crests
    """
    mat = bpy.data.materials.new("ocean_water")
    mat.use_nodes = True
    mat.surface_render_method = "FORWARD"
    mat.use_screen_refraction = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    mix  = nt.nodes.new("ShaderNodeMixShader")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    fe   = nt.nodes.new("ShaderNodeEmission")
    fa   = nt.nodes.new("ShaderNodeAttribute")
    bump = nt.nodes.new("ShaderNodeBump")
    nois = nt.nodes.new("ShaderNodeTexNoise")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapp  = nt.nodes.new("ShaderNodeMapping")

    bsdf.inputs["Base Color"].default_value          = (0.03, 0.15, 0.25, 1.0)
    bsdf.inputs["Roughness"].default_value           = roughness
    bsdf.inputs["IOR"].default_value                 = ior
    bsdf.inputs["Transmission Weight"].default_value = transmission
    bsdf.inputs["Coat Weight"].default_value         = coat_weight
    bsdf.inputs["Coat Roughness"].default_value      = 0.03
    bsdf.inputs["Alpha"].default_value               = 0.82

    nois.noise_dimensions              = "3D"
    nois.inputs["Scale"].default_value = ripple_scale
    nois.inputs["Detail"].default_value = 8.0
    bump.inputs["Strength"].default_value = ripple_strength
    bump.inputs["Distance"].default_value = 0.015

    fa.attribute_type = "GEOMETRY"
    fa.attribute_name = foam_layer
    fe.inputs["Color"].default_value    = (0.98, 0.98, 1.0, 1.0)
    fe.inputs["Strength"].default_value = foam_emit

    lnk = nt.links.new
    lnk(coord.outputs["Object"],    mapp.inputs["Vector"])
    lnk(mapp.outputs["Vector"],     nois.inputs["Vector"])
    lnk(nois.outputs["Fac"],        bump.inputs["Height"])
    lnk(bump.outputs["Normal"],     bsdf.inputs["Normal"])
    lnk(fa.outputs["Fac"],          mix.inputs["Fac"])
    lnk(bsdf.outputs["BSDF"],       mix.inputs[1])
    lnk(fe.outputs["Emission"],     mix.inputs[2])
    lnk(mix.outputs["Shader"],      out.inputs["Surface"])

    return mat
