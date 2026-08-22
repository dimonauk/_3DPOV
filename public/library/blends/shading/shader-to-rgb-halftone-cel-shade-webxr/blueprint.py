"""
Shader to RGB — Amplitude-Modulated Halftone Cel-Shade (Blender 5.1 · EEVEE Next)
==================================================================================
Blender 5.1 · EEVEE Next · CC0

TECHNIQUE
---------
``ShaderNodeShaderToRGB`` samples the EEVEE Principled BSDF evaluation at
the current pixel and returns it as a plain ``Color`` socket — not a physical
irradiance, but the screen-space result of what EEVEE would shade.  That
colour passes through a two-stop CONSTANT ColourRamp to produce two hard toon
bands: deep shadow (0.18 grey) and full lit (1.0 white).

The toon band value then drives an amplitude-modulated (AM) halftone screen:
the dot radius is *large* in shadow zones and *small* in lit zones — the same
AM encoding used by offset lithography.  The screen is tiled from UV
coordinates rotated 45° to prevent moiré with axis-aligned geometry edges.

LIMITATION
----------
``ShaderNodeShaderToRGB`` is silently inoperative in Cycles and in any WebXR
runtime.  The build step below wires the EEVEE preview material; a separate
Cycles bake of the Emission pass is required before GLB export.  The baked
material (``HalftoneCel_Baked``) uses only an Emission texture so the look is
preserved precisely at runtime (KHR_materials_unlit compatible).

SOURCE / LICENCE
-----------------
Implementation: original, CC0.
Blender Foundation — "Shader to RGB Node", Blender 5.1 Manual, CC-BY-SA-4.0
  https://docs.blender.org/manual/en/latest/render/shader_nodes/converter/shader_to_rgb.html
Halftone AM screen theory: R. Ulichney, "Digital Halftoning," MIT Press 1987.
  Algorithm re-implemented independently; no derived code.

OUTPUT
------
  halftone_cel.blend
  halftone_cel.glb           — baked emission, no PBR channels
  halftone_baked.webp        — 1024 × 1024 baked emission map
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
MESH_NAME    = "halftone_panel"
MAT_EEVEE    = "HalftoneCel"
MAT_BAKED    = "HalftoneCel_Baked"
BAKE_IMG     = "halftone_baked"
BAKE_RES     = 1024
BAKE_PATH    = "//halftone_baked.webp"
EXPORT_PATH  = "//halftone_cel.glb"

SCREEN_FREQ  = 18.0            # dot-cells per UV unit
DOT_SHADOW   = 0.44            # dot radius in shadow band (large → heavy ink)
DOT_LIT      = 0.16            # dot radius in lit band   (small → open paper)
SCREEN_ANGLE = math.radians(45.0)  # 45° avoids moiré with axis-aligned edges

BAND_THRESH  = 0.45            # ColourRamp split: below = shadow, above = lit
SUN_ELEV     = math.radians(42.0)


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(blk):
            blk.remove(item)


def _add_panel() -> bpy.types.Object:
    """Grid primitive — more UVs than default plane, better dot resolution."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=14, size=2.0)
    obj = bpy.context.object
    obj.name = MESH_NAME
    bpy.ops.object.editmode_toggle()
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.02)
    bpy.ops.object.editmode_toggle()
    return obj


def _add_sun_and_camera() -> None:
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 6))
    sun = bpy.context.object
    sun.data.energy = 5.0
    # Elevation drives the toon-band boundary: shadow grows as sun lowers.
    sun.rotation_euler = (SUN_ELEV, 0.0, math.radians(35.0))

    bpy.ops.object.camera_add(location=(0.0, -3.8, 2.2))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(62.0), 0.0, 0.0)
    bpy.context.scene.camera = cam


def _nd(nt, type_, x, y):
    """Create a node and position it."""
    n = nt.nodes.new(type_)
    n.location = (x, y)
    return n


# ── EEVEE HALFTONE MATERIAL ───────────────────────────────────────────────────

def build_eevee_material() -> bpy.types.Material:
    """
    Full EEVEE-viewport halftone material.  Node graph summary:

      Principled → ShaderToRGB → ColourRamp(CONSTANT) → cel_value
                                                        ↓
      TexCoord.UV → Mapping(45°) → VectorMath(SCALE×freq) → SeparateXYZ
        → frac(X/Y) → centre(X/Y) → CombineXYZ → VectorMath(LENGTH) → dot_dist
                                                        ↓
      Mix(DOT_SHADOW, DOT_LIT, cel_value) → dot_radius
                                                        ↓
      LESS_THAN(dot_dist, dot_radius) → dot_mask × cel_value → Emission → Output
    """
    mat = bpy.data.materials.new(MAT_EEVEE)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    L   = nt.links.new

    # Output & BSDF
    out   = _nd(nt, 'ShaderNodeOutputMaterial',  1400, 0)
    pbsdf = _nd(nt, 'ShaderNodeBsdfPrincipled',  -650, 240)
    pbsdf.inputs['Base Color'].default_value = (0.55, 0.55, 0.55, 1.0)
    pbsdf.inputs['Roughness'].default_value  = 0.55
    pbsdf.inputs['Metallic'].default_value   = 0.0

    # Shader → RGB (EEVEE-only capture)
    s2rgb = _nd(nt, 'ShaderNodeShaderToRGB', -380, 240)
    L(pbsdf.outputs['BSDF'], s2rgb.inputs['Shader'])

    # ColourRamp — CONSTANT for hard cel bands
    cramp = _nd(nt, 'ShaderNodeValToRGB', -120, 240)
    cr    = cramp.color_ramp
    cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0.0;          cr.elements[0].color = (0.18, 0.18, 0.18, 1.0)
    cr.elements[1].position = BAND_THRESH;  cr.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    L(s2rgb.outputs['Color'], cramp.inputs['Fac'])

    # UV coordinate source → 45° rotation mapping
    texco   = _nd(nt, 'ShaderNodeTexCoord',   -1250, -80)
    mapping = _nd(nt, 'ShaderNodeMapping',    -1020, -80)
    mapping.inputs['Rotation'].default_value = (0.0, 0.0, SCREEN_ANGLE)

    # Scale UV by screen frequency
    vscale = _nd(nt, 'ShaderNodeVectorMath', -780, -80)
    vscale.operation = 'SCALE'
    vscale.inputs['Scale'].default_value = SCREEN_FREQ
    L(texco.outputs['UV'],       mapping.inputs['Vector'])
    L(mapping.outputs['Vector'], vscale.inputs[0])

    # Separate, frac, centre each component
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

    # Amplitude-modulated radius: lerp between DOT_SHADOW and DOT_LIT
    # ShaderNodeMix with data_type='FLOAT' is the lerp node in 5.1
    mix_r = _nd(nt, 'ShaderNodeMix', 480, 240)
    mix_r.data_type = 'FLOAT'
    mix_r.inputs[2].default_value = DOT_SHADOW   # A = shadow radius (fat dot)
    mix_r.inputs[3].default_value = DOT_LIT      # B = lit radius   (thin dot)
    # Factor (input 0) from cel_value — auto-converts Color→Float via luminance
    L(cramp.outputs['Color'], mix_r.inputs['Factor'])

    # Step: dot_mask = (dot_dist < dot_radius)
    step = _nd(nt, 'ShaderNodeMath', 720, 80)
    step.operation = 'LESS_THAN'
    L(vlen.outputs['Value'], step.inputs[0])
    L(mix_r.outputs[1],      step.inputs[1])  # index 1 = float output of Mix

    # Multiply dot_mask × cel_value → final greyscale
    mul = _nd(nt, 'ShaderNodeMath', 940, 80)
    mul.operation = 'MULTIPLY'
    L(step.outputs['Value'],  mul.inputs[0])
    L(cramp.outputs['Color'], mul.inputs[1])  # Color→Float luminance

    # Combine to RGB colour for Emission socket
    rgb = _nd(nt, 'ShaderNodeCombineColor', 1140, 80)
    L(mul.outputs['Value'], rgb.inputs['Red'])
    L(mul.outputs['Value'], rgb.inputs['Green'])
    L(mul.outputs['Value'], rgb.inputs['Blue'])

    emit = _nd(nt, 'ShaderNodeEmission', 1200, 240)
    emit.inputs['Strength'].default_value = 1.0
    L(rgb.outputs['Color'],      emit.inputs['Color'])
    L(emit.outputs['Emission'],  out.inputs['Surface'])

    return mat


# ── BAKED EXPORT MATERIAL ─────────────────────────────────────────────────────

def build_baked_material(img: bpy.types.Image) -> bpy.types.Material:
    """
    Export-safe material for GLB: baked halftone on Emission socket only.
    Principled BSDF with Roughness 1.0, Metallic 0.0 keeps PBR channels
    neutral; Emission Strength 1.0 makes the baked halftone self-lit in any
    WebXR runtime (KHR_materials_unlit not required but compatible).
    """
    mat = bpy.data.materials.new(MAT_BAKED)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    L   = nt.links.new

    out   = _nd(nt, 'ShaderNodeOutputMaterial',  600, 0)
    pbsdf = _nd(nt, 'ShaderNodeBsdfPrincipled',  280, 0)
    img_n = _nd(nt, 'ShaderNodeTexImage',        -80, 0)
    img_n.image = img
    pbsdf.inputs['Roughness'].default_value         = 1.0
    pbsdf.inputs['Metallic'].default_value          = 0.0
    pbsdf.inputs['Emission Strength'].default_value = 1.0
    L(img_n.outputs['Color'], pbsdf.inputs['Emission Color'])
    L(pbsdf.outputs['BSDF'],  out.inputs['Surface'])
    return mat


# ── BAKE SETUP ────────────────────────────────────────────────────────────────

def setup_emission_bake_target() -> bpy.types.Image:
    """
    Prepare the image node that Cycles bake will write to.
    Actual bake: Object mode → select mesh → Properties → Render → Bake
    Type=Emit, Margin 16px, Output Samples=128 with Cycles on CPU.
    The Image Texture node must be selected (but not linked) in the EEVEE
    material so Blender knows which image to bake into.
    """
    img = bpy.data.images.new(BAKE_IMG, BAKE_RES, BAKE_RES, alpha=False)
    img.filepath = BAKE_PATH
    img.file_format = 'WEBP'
    return img


# ── EXPORT ────────────────────────────────────────────────────────────────────

def export_glb(filepath: str = EXPORT_PATH) -> None:
    """Export with baked material active (slot index 1)."""
    bpy.context.view_layer.objects.active = bpy.data.objects[MESH_NAME]
    bpy.data.objects[MESH_NAME].active_material_index = 1
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_image_format='WEBP',
        export_webp_texture_quality=92,
        export_normals=True,
    )
    bpy.data.objects[MESH_NAME].active_material_index = 0  # restore preview


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

def build() -> None:
    _clear_scene()
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

    obj = _add_panel()
    mat = build_eevee_material()
    obj.data.materials.append(mat)

    img      = setup_emission_bake_target()
    baked    = build_baked_material(img)
    obj.data.materials.append(baked)

    _add_sun_and_camera()

    print(
        "[halftone_cel] Scene built.\n"
        "  Slot 0 = HalftoneCel   — EEVEE viewport preview (Shader to RGB active).\n"
        "  Slot 1 = HalftoneCel_Baked — GLB export target (awaits Emit bake).\n"
        "  Render engine is EEVEE Next.  To bake:\n"
        "    1. Select mesh, Slot 0 active, add unlinked Image Texture node → halftone_baked.\n"
        "    2. Switch engine to CYCLES, Bake Type = Emit, run bake.\n"
        "    3. Save image as WEBP.  Then call export_glb()."
    )


if __name__ == "__main__":
    build()
