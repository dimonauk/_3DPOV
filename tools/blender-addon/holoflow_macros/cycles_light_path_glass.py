"""
holoflow_macros/cycles_light_path_glass.py
Reusable helper: build a Cycles glass material with the Light Path
Is Shadow Ray trick for firefly-free rendering.

Usage
-----
    from holoflow_macros.cycles_light_path_glass import build_glass_material

    mat = build_glass_material(
        name="my_glass",
        ior=1.517,
        roughness=0.0,
        color=(0.82, 0.93, 1.00, 1.0),
        use_shadow_ray_trick=True,  # set False for simpler scene debugging
    )
    obj.data.materials.append(mat)

Why the shadow-ray trick?
--------------------------
Refractive caustics arise from paths that multiply several BSDF lobes together,
producing extreme variance (firefly pixels).  Shadow rays evaluate occlusion only
— they do not contribute to the visible colour the camera sees through the glass.
Routing them through Transparent BSDF removes the caustic variance entirely
without affecting the refracted image.

Licence: CC0 — Holoflow Studio
"""

import bpy
from typing import Tuple


RGBFloat = Tuple[float, float, float, float]


def build_glass_material(
    name: str,
    ior: float = 1.517,
    roughness: float = 0.0,
    color: RGBFloat = (0.82, 0.93, 1.00, 1.0),
    use_shadow_ray_trick: bool = True,
) -> bpy.types.Material:
    """Return a Cycles glass material, optionally with the Is Shadow Ray switch."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)

    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    pbsdf.location = (-200, 80)
    pbsdf.inputs["Base Color"].default_value          = color
    pbsdf.inputs["Roughness"].default_value           = roughness
    pbsdf.inputs["IOR"].default_value                 = ior
    pbsdf.inputs["Transmission Weight"].default_value = 1.0
    pbsdf.inputs["Specular IOR Level"].default_value  = 0.5

    if use_shadow_ray_trick:
        transp = nt.nodes.new("ShaderNodeBsdfTransparent")
        transp.location = (-200, -80)
        transp.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)

        lpath = nt.nodes.new("ShaderNodeLightPath")
        lpath.location = (-420, -40)

        mix = nt.nodes.new("ShaderNodeMixShader")
        mix.location = (200, 0)

        nt.links.new(lpath.outputs["Is Shadow Ray"], mix.inputs["Fac"])
        nt.links.new(pbsdf.outputs["BSDF"],          mix.inputs[1])
        nt.links.new(transp.outputs["BSDF"],         mix.inputs[2])
        nt.links.new(mix.outputs["Shader"],          out.inputs["Surface"])
    else:
        nt.links.new(pbsdf.outputs["BSDF"], out.inputs["Surface"])

    return mat


def configure_cycles_for_glass(
    scene: bpy.types.Scene,
    samples: int = 128,
    max_bounces: int = 12,
    transmission_bounces: int = 8,
    clamp_direct: float = 8.0,
    clamp_indirect: float = 4.0,
) -> None:
    """Set Cycles scene parameters appropriate for glass rendering."""
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    scene.cycles.max_bounces          = max_bounces
    scene.cycles.transmission_bounces = transmission_bounces
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.diffuse_bounces  = 4
    scene.cycles.glossy_bounces   = 4
    scene.cycles.volume_bounces   = 2
    scene.cycles.use_clamp_direct   = True
    scene.cycles.clamp_direct       = clamp_direct
    scene.cycles.use_clamp_indirect = True
    scene.cycles.clamp_indirect     = clamp_indirect
    # Disable renderer-level caustics when using the shader trick
    scene.cycles.caustics_refractive = False
    scene.cycles.caustics_reflective = False
