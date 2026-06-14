"""
blueprint.py — Grease Pencil 3: Line Art Modifier + Toon Ink Outline Render
Blender 5.1 | Topic: grease-pencil | Licence: CC0

Technique in brief
------------------
Grease Pencil 3 (GP3, introduced Blender 4.3) is a complete rewrite of the GP
data model.  Layers own frames which own stroke arrays; modifiers share the same
object stack as mesh modifiers.  The GREASE_PENCIL_LINEART modifier analyses
3D geometry each frame and emits ink strokes into a named GP3 layer for five
edge categories: CONTOUR (silhouette), CREASE (hard interior angles), MATERIAL_
BOUNDARY, EDGE_MARK, and INTERSECTION.  Paired with an EEVEE Shader-to-RGB
cel-shading material on the source mesh, the result is stylised 2D-in-3D ink
illustration without any texture painting.
"""

import bpy
import bmesh
from mathutils import Vector
import math

# ── Constants ─────────────────────────────────────────────────────────────────

GEM_RADIUS        = 0.6         # base icosphere radius (m)
GEM_SUBDIVS       = 2           # 2 subdivisions → 80 triangular faces
GEM_STRETCH_Z     = 1.35        # elongate upward for crystal silhouette

# Toon band threshold values (0=shadow, 1=highlight in Shader-to-RGB output)
TONE_SHADOW       = 0.0
TONE_MID          = 0.45
TONE_HIGHLIGHT    = 0.80

# Sapphire gem colour palette
COL_SHADOW        = (0.03, 0.04, 0.12, 1.0)   # deep navy shadow
COL_MID           = (0.15, 0.25, 0.70, 1.0)   # mid sapphire
COL_HIGHLIGHT     = (0.55, 0.72, 1.00, 1.0)   # icy specular band

# Line Art settings
INK_COLOUR        = (0.0,  0.0,  0.0,  1.0)   # classic black ink
INK_THICKNESS     = 15                          # thousandths of px at render height
CREASE_ANGLE_DEG  = 25.0                        # dihedral below this → no stroke

LAYER_NAME        = "Ink Outlines"
MAT_NAME_INK      = "gp_ink_black"
MAT_NAME_GEM      = "gem_cel"


# ── Scene reset ───────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


# ── Gem mesh ──────────────────────────────────────────────────────────────────

def build_gem() -> bpy.types.Object:
    """
    Crystal gem from an icosphere.  Two subdivisions give 80 triangles — enough
    faces for interesting crease-edge strokes without losing the low-poly read.
    Stretching Z by 1.35 creates the tapered crystal silhouette.

    We do NOT shade smooth.  Flat shading preserves per-face normals so that
    the Line Art modifier can compute accurate dihedral angles between adjacent
    faces and fire crease strokes at the right threshold.  Shade Smooth would
    interpolate normals across edges and suppress interior strokes.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=GEM_SUBDIVS,
        radius=GEM_RADIUS,
        location=(0.0, 0.0, 0.0),
    )
    gem = bpy.context.active_object
    gem.name = "gem"

    gem.scale.z = GEM_STRETCH_Z
    bpy.ops.object.transform_apply(scale=True)   # Line Art reads world-space verts
    bpy.ops.object.shade_flat()

    return gem


# ── Cel-shading material ──────────────────────────────────────────────────────

def build_cel_material() -> bpy.types.Material:
    """
    EEVEE cel-shading via Shader to RGB.

    Shader to RGB captures a shader's lighting evaluation — including EEVEE
    shadow — as a 0-1 float per pixel.  Feeding into a ColourRamp at CONSTANT
    interpolation quantises the smooth gradient into hard-edged toon bands.

    Why Diffuse BSDF not Principled BSDF?
    Principled has multiple lobes (diffuse, specular, coat, sheen).  When those
    all feed through Shader to RGB the specular bleed blurs the band boundaries.
    Diffuse BSDF is a pure cosine single-lobe F(N·L) → clean 0-1 value → razor-
    sharp CONSTANT steps.  Add specular rim separately as an Emission node blended
    *after* the ColourRamp, not piped through Shader to RGB.
    """
    mat = bpy.data.materials.new(MAT_NAME_GEM)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    diffuse = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diffuse.location = (-400, 0)
    diffuse.inputs['Color'].default_value     = (0.30, 0.50, 1.00, 1.0)
    diffuse.inputs['Roughness'].default_value = 0.0

    s2rgb = nt.nodes.new('ShaderNodeShaderToRGB')
    s2rgb.location = (-180, 0)

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.location = (60, 0)
    ramp.color_ramp.interpolation = 'CONSTANT'   # hard toon steps, no gradient blend

    stops = ramp.color_ramp.elements
    stops[0].position = TONE_SHADOW
    stops[0].color    = COL_SHADOW
    stops[1].position = TONE_MID
    stops[1].color    = COL_MID
    stops.new(TONE_HIGHLIGHT)
    stops[2].color = COL_HIGHLIGHT

    emit = nt.nodes.new('ShaderNodeEmission')
    emit.location = (280, 0)
    emit.inputs['Strength'].default_value = 1.0

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (460, 0)

    nt.links.new(diffuse.outputs['BSDF'],  s2rgb.inputs['Shader'])
    nt.links.new(s2rgb.outputs['Color'],   ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])

    return mat


# ── Grease Pencil 3 ink object ────────────────────────────────────────────────

def build_gp3_ink_object() -> bpy.types.Object:
    """
    GP3 data model (Blender 4.3+):

      GreasePencilv3  ← bpy.types.GreasePencilv3  (NOT bpy.types.GreasePencil v2)
        .layers[]     ← GreasePencilLayer
          .frames[]   ← GreasePencilFrame
            .strokes[]← GreasePencilStroke  (populated at runtime by Line Art)

    GP3 materials are standard bpy.data.materials with GP data appended via
    bpy.data.materials.create_gpencil_data(mat).  The .grease_pencil sub-object
    exposes .color (stroke colour), .show_stroke, .show_fill.

    Assignment to GP3 objects is via gp_data.materials.append(mat) — NOT the
    same path as mesh material slot assignment.
    """
    bpy.ops.object.grease_pencil_add(type='EMPTY')
    gp_obj  = bpy.context.active_object
    gp_obj.name = "gp_ink"
    gp_data = gp_obj.data

    # GP3 ink material — stroke only, no fill
    ink_mat = bpy.data.materials.new(MAT_NAME_INK)
    bpy.data.materials.create_gpencil_data(ink_mat)
    gm = ink_mat.grease_pencil
    gm.color       = INK_COLOUR
    gm.show_stroke = True
    gm.show_fill   = False
    gp_data.materials.append(ink_mat)

    # The layer that Line Art writes strokes into.
    # An empty frame at 1 is required — Line Art populates it on evaluation;
    # the frame does not need manually authored strokes.
    layer = gp_data.layers.new(LAYER_NAME)
    layer.frames.new(1)

    return gp_obj


# ── Line Art modifier ─────────────────────────────────────────────────────────

def add_line_art_modifier(gp_obj: bpy.types.Object,
                          gem_obj: bpy.types.Object) -> None:
    """
    GREASE_PENCIL_LINEART (GP3 variant, Blender 4.3+) generates GP3 strokes
    from scene geometry every frame.  Edge categories:

      CONTOUR          — silhouette boundary: front-facing face adjacent to
                         back-facing face from the camera.  Updates every frame
                         as the object or camera rotates.
      CREASE           — interior edges whose dihedral angle > crease_threshold.
                         At 2 subdivisions the icosphere's minimum facet-to-facet
                         angle is ~28°.  Threshold 25° captures every facet edge.
      MATERIAL_BOUNDARY— where faces with different materials meet.

    source_type='OBJECT' restricts the modifier to the gem mesh only.
    'SCENE' would also catch the floor plane and any stray geometry.

    target_layer must match the GP3 layer name exactly (case-sensitive).
    target_material must be the material object at slot 0 of the GP3 data,
    not a mesh material — a slot-index mismatch is the most common failure.
    """
    mod = gp_obj.modifiers.new("InkLines", type='GREASE_PENCIL_LINEART')

    mod.source_type   = 'OBJECT'
    mod.source_object = gem_obj

    mod.target_layer    = LAYER_NAME
    mod.target_material = gp_obj.data.materials[0]

    mod.edge_types       = {'CONTOUR', 'CREASE', 'MATERIAL_BOUNDARY'}
    mod.crease_threshold = math.radians(CREASE_ANGLE_DEG)
    mod.thickness        = INK_THICKNESS
    mod.stroke_depth_offset = 0.001    # prevents z-fighting with gem surface


# ── Lighting + camera ─────────────────────────────────────────────────────────

def build_lighting() -> None:
    """
    Two-light rig tuned for cel-shading toon bands:
    Key SUN (high energy) drives the Diffuse BSDF cosine term; the difference
    between lit and shadow hemispheres must cross the TONE_MID threshold (0.45)
    for bands to separate.  Fill POINT (low energy, warm) lifts shadow without
    crossing TONE_MID — the shadow band stays dark navy, not mid-sapphire.
    """
    bpy.ops.object.light_add(type='SUN', location=(2.0, -1.5, 3.0))
    key = bpy.context.active_object
    key.rotation_euler = (math.radians(45), 0.0, math.radians(-30))
    key.data.energy    = 5.0

    bpy.ops.object.light_add(type='POINT', location=(-1.5, 2.0, 0.5))
    fill = bpy.context.active_object
    fill.data.energy = 0.8
    fill.data.color  = (1.0, 0.9, 0.7)   # warm cream fill


def build_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(2.2, -2.2, 1.5))
    cam = bpy.context.active_object
    cam.rotation_euler              = (math.radians(65), 0.0, math.radians(45))
    cam.data.lens                   = 50.0
    bpy.context.scene.camera        = cam
    return cam


# ── Render ────────────────────────────────────────────────────────────────────

def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine      = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    # Ray tracing needed for accurate EEVEE shadow cast onto the cel bands
    scene.eevee.use_raytracing = True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()

    gem_obj = build_gem()
    cel_mat = build_cel_material()
    gem_obj.data.materials.append(cel_mat)

    gp_obj = build_gp3_ink_object()
    add_line_art_modifier(gp_obj, gem_obj)

    build_lighting()
    build_camera()
    configure_render()

    bpy.context.view_layer.objects.active = gp_obj

    print("[blueprint] GP3 Line Art toon outline scene ready.")
    print(f"  GP3 object: {gp_obj.name!r}  |  Gem mesh: {gem_obj.name!r}")
    print(f"  Line Art target layer: {LAYER_NAME!r}")
    print("  → Switch to EEVEE Next.  Viewport Overlays → tick Grease Pencil.")
    print("  → Press Ctrl+Shift+Q to force GP3 evaluation if strokes are missing.")


if __name__ == "__main__":
    main()
