"""
holoflow_macros/workbench_assembly_render.py

Reusable helper: configure the Workbench engine for a technical assembly
diagram render on any scene. Call configure_workbench_blueprint() then
render or export as needed.

Usage (from Scripting workspace or another macro):
    from holoflow_macros import workbench_assembly_render as wb
    wb.configure_workbench_blueprint(bpy.context.scene)
    bpy.ops.render.render(animation=False)
"""

import bpy


def configure_workbench_blueprint(
    scene,
    color_type="OBJECT",
    light="FLAT",
    cavity=True,
    cavity_type="SCREEN",
    outline=True,
    outline_colour=(0.95, 0.95, 0.95),
    background=(0.06, 0.07, 0.10),
    shadows=False,
):
    """
    Switch scene to Workbench and apply blueprint render settings.

    Parameters
    ----------
    scene : bpy.types.Scene
    color_type : str
        'OBJECT' | 'MATERIAL' | 'RANDOM' | 'VERTEX' | 'TEXTURE'
    light : str
        'FLAT' (no studio sphere) | 'STUDIO' | 'MATCAP'
    cavity : bool
        Enable screen-space cavity gradient.
    cavity_type : str
        'SCREEN' | 'WORLD' | 'BOTH'
    outline : bool
        Enable Sobel depth-buffer edge detection.
    outline_colour : tuple[float, float, float]
        RGB, linear, 0–1.
    background : tuple[float, float, float]
        World colour for the Workbench background.
    shadows : bool
        Fast EVSM shadow map (useful for 'soft technical' look).
    """
    scene.render.engine = "WORKBENCH"

    sh = scene.display.shading
    sh.type                     = "SOLID"
    sh.color_type               = color_type
    sh.light                    = light
    sh.show_cavity              = cavity
    sh.cavity_type              = cavity_type
    sh.curvature_ridge_factor   = 1.0
    sh.curvature_valley_factor  = 0.8
    sh.show_object_outline      = outline
    sh.object_outline_color     = outline_colour
    sh.show_shadows             = shadows
    sh.shadow_intensity         = 0.5

    if not scene.world:
        scene.world = bpy.data.worlds.new("WorkbenchWorld")
    scene.world.use_nodes = False
    scene.world.color     = background


def set_object_colour(obj, rgba):
    """Assign sRGB RGBA to obj.color for Workbench color_type='OBJECT'."""
    obj.color = rgba


def make_flat_emission_material(name, rgba):
    """
    Create a shadeless Emission material approximating Workbench object colour
    for GLB export (Workbench colour bypasses glTF materials).
    Returns the new bpy.types.Material.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    emit = nt.nodes.new("ShaderNodeEmission")
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit.inputs["Color"].default_value    = rgba
    emit.inputs["Strength"].default_value = 1.0
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat
