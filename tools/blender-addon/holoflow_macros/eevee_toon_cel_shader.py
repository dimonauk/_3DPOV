"""
holoflow_macros/eevee_toon_cel_shader.py
=========================================
Blender 5.1 | Holoflow Studio | CC0

Reusable macro that creates (or rebuilds) the HoloflowToonShader node group
and applies it to any object's material slots.

Usage:
    from holoflow_macros.eevee_toon_cel_shader import (
        build_toon_shader_group,
        make_toon_material,
    )

    group = build_toon_shader_group()
    mat   = make_toon_material(
        name="MyMaterial",
        shadow_colour=(0.04, 0.05, 0.18, 1.0),
        lit_colour=(0.25, 0.55, 0.95, 1.0),
        rim_colour=(0.95, 0.95, 1.00, 1.0),
        toon_step=0.45,
        rim_threshold=0.25,
    )
    my_obj.data.materials.clear()
    my_obj.data.materials.append(mat)

The node group is a single shared datablock. Calling build_toon_shader_group()
a second time replaces the existing group; all Group nodes pointing to it
update automatically because they reference the datablock by name.
"""

import bpy
from typing import Tuple

Colour4 = Tuple[float, float, float, float]

GROUP_NAME = "HoloflowToonShader"


def build_toon_shader_group(
    toon_step: float     = 0.45,
    rim_threshold: float = 0.25,
    shadow_colour: Colour4 = (0.04, 0.05, 0.18, 1.0),
    lit_colour: Colour4    = (0.25, 0.55, 0.95, 1.0),
) -> bpy.types.NodeTree:
    """
    Create (or replace) the HoloflowToonShader ShaderNodeTree.

    Parameters set default values on the group interface. Per-material
    overrides are applied via make_toon_material() or directly via
    n_group.inputs[name].default_value after linking the group.

    Returns the node group datablock.
    """
    if GROUP_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GROUP_NAME])

    tree  = bpy.data.node_groups.new(type="ShaderNodeTree", name=GROUP_NAME)
    nodes = tree.nodes
    links = tree.links

    # ── interface ──────────────────────────────────────────────────────────────
    tree.interface.new_socket("Shader",        in_out="OUTPUT", socket_type="NodeSocketShader")
    tree.interface.new_socket("Base Colour",   in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Shadow Colour", in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Lit Colour",    in_out="INPUT",  socket_type="NodeSocketColor")
    tree.interface.new_socket("Rim Colour",    in_out="INPUT",  socket_type="NodeSocketColor")

    s_step = tree.interface.new_socket("Toon Step", in_out="INPUT", socket_type="NodeSocketFloat")
    s_step.default_value = toon_step
    s_step.min_value = 0.01
    s_step.max_value = 0.99

    s_rim = tree.interface.new_socket("Rim Threshold", in_out="INPUT", socket_type="NodeSocketFloat")
    s_rim.default_value = rim_threshold
    s_rim.min_value = 0.0
    s_rim.max_value = 0.99

    # ── nodes ─────────────────────────────────────────────────────────────────
    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-900, 100)
    n_out = nodes.new("NodeGroupOutput"); n_out.location  = ( 500, 100)

    n_diff = nodes.new("ShaderNodeBsdfDiffuse"); n_diff.location = (-620, 260)

    n_s2rgb = nodes.new("ShaderNodeShaderToRGB"); n_s2rgb.location = (-380, 260)

    n_toon_ramp = nodes.new("ShaderNodeValToRGB"); n_toon_ramp.location = (-160, 260)
    cr = n_toon_ramp.color_ramp
    cr.interpolation = "CONSTANT"
    cr.elements[0].position = 0.0;       cr.elements[0].color = shadow_colour
    cr.elements[1].position = toon_step; cr.elements[1].color = lit_colour

    n_geo = nodes.new("ShaderNodeNewGeometry"); n_geo.location = (-900, -160)

    n_dot = nodes.new("ShaderNodeVectorMath")
    n_dot.operation = "DOT_PRODUCT"; n_dot.location = (-620, -160)

    n_add = nodes.new("ShaderNodeMath")
    n_add.operation = "ADD"; n_add.inputs[1].default_value = 1.0; n_add.location = (-380, -160)

    n_rim_ramp = nodes.new("ShaderNodeValToRGB"); n_rim_ramp.location = (-160, -160)
    cr2 = n_rim_ramp.color_ramp
    cr2.interpolation = "CONSTANT"
    cr2.elements[0].position = 0.0;           cr2.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    cr2.elements[1].position = rim_threshold; cr2.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    n_mix = nodes.new("ShaderNodeMixRGB")
    n_mix.blend_type = "MIX"; n_mix.use_clamp = True; n_mix.location = (60, 160)

    n_emit = nodes.new("ShaderNodeEmission")
    n_emit.inputs["Strength"].default_value = 1.0; n_emit.location = (280, 160)

    # ── links ─────────────────────────────────────────────────────────────────
    links.new(n_in.outputs["Base Colour"],  n_diff.inputs["Color"])
    links.new(n_diff.outputs["BSDF"],       n_s2rgb.inputs["Shader"])
    links.new(n_s2rgb.outputs["Color"],     n_toon_ramp.inputs["Fac"])
    links.new(n_toon_ramp.outputs["Color"], n_mix.inputs["Color1"])

    links.new(n_geo.outputs["Normal"],      n_dot.inputs[0])
    links.new(n_geo.outputs["Incoming"],    n_dot.inputs[1])
    links.new(n_dot.outputs["Value"],       n_add.inputs[0])
    links.new(n_add.outputs["Value"],       n_rim_ramp.inputs["Fac"])
    links.new(n_rim_ramp.outputs["Alpha"],  n_mix.inputs["Fac"])
    links.new(n_in.outputs["Rim Colour"],   n_mix.inputs["Color2"])
    links.new(n_mix.outputs["Color"],       n_emit.inputs["Color"])
    links.new(n_emit.outputs["Emission"],   n_out.inputs["Shader"])

    return tree


def make_toon_material(
    name: str,
    shadow_colour: Colour4 = (0.04, 0.05, 0.18, 1.0),
    lit_colour: Colour4    = (0.25, 0.55, 0.95, 1.0),
    rim_colour: Colour4    = (0.95, 0.95, 1.00, 1.0),
    toon_step: float       = 0.45,
    rim_threshold: float   = 0.25,
) -> bpy.types.Material:
    """
    Create a material that instances the shared HoloflowToonShader group.

    Each material stores independent per-material overrides on its Group node
    inputs. Changing the shared group's node graph updates all materials;
    colour overrides here do not affect other materials.
    """
    if GROUP_NAME not in bpy.data.node_groups:
        build_toon_shader_group()

    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    n_out   = nodes.new("ShaderNodeOutputMaterial"); n_out.location = (300, 0)
    n_group = nodes.new("ShaderNodeGroup");          n_group.location = (0, 0)
    n_group.node_tree = bpy.data.node_groups[GROUP_NAME]

    n_group.inputs["Base Colour"].default_value   = lit_colour
    n_group.inputs["Shadow Colour"].default_value = shadow_colour
    n_group.inputs["Lit Colour"].default_value    = lit_colour
    n_group.inputs["Rim Colour"].default_value    = rim_colour
    n_group.inputs["Toon Step"].default_value     = toon_step
    n_group.inputs["Rim Threshold"].default_value = rim_threshold

    links.new(n_group.outputs["Shader"], n_out.inputs["Surface"])
    return mat
