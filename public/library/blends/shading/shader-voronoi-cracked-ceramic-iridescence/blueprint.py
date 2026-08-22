"""
Shader: Voronoi DISTANCE_TO_EDGE — Cracked-Glaze Ceramic & Soap-Film Iridescence
==================================================================================
Voronoi Cell Boundaries · Crazing Crack Network · Principled BSDF v2 Glaze
Soap-Film Iridescence Variant · GLB Export
Blender 5.1  ·  Category: shading  ·  Licence: CC0

When a ceramic glaze cools faster than the clay body beneath it, the two materials
attempt to contract at different rates.  The glaze, already rigid below its glass
transition temperature, cannot stretch — so it fractures along the shortest path
between each internal stress-focus point.  Those focus points are spatially random,
and the nearest-neighbour diagram of random points is a Voronoi tessellation.  Every
crack you see on crackle-glaze porcelain is therefore a Voronoi cell boundary.

This blueprint reproduces the cracking geometry and the optical properties of
the glaze in two variants:

  VARIANT A — CRACKED CERAMIC
  The Voronoi Texture in DISTANCE_TO_EDGE mode outputs the normalised Euclidean
  distance from any surface point to its nearest cell edge.  Zero at crack
  centres, one deep inside cells.  A ColorRamp with LINEAR interpolation
  remaps this to a bright (high roughness, no clearcoat) crack channel blended
  over a dark, smooth (low roughness, high clearcoat) glaze ground.

  VARIANT B — SOAP-FILM IRIDESCENCE
  Soap films are thin dielectric membranes.  When thickness ≈ λ/4n the film
  exhibits destructive interference for that wavelength.  Blender cannot
  simulate thin-film optics directly, but Voronoi F1 distance (cell centre
  proximity) gives a scalar that rises smoothly across each cell — a perfect
  proxy for film thickness variation.  A Hue Rotate driven by that scalar
  rotates the base colour around the colour wheel, mimicking the spectral
  shift across one iridescent bubble membrane.  Fresnel (IOR=1.4) gates the
  effect: it is only visible at grazing angles where constructive interference
  dominates, matching real soap-film physics.

CRITICAL NODE DETAILS — VORONOI TEXTURE (Blender 5.1)
  feature  : 'DISTANCE_TO_EDGE' — distance from point to nearest cell boundary
             'F1'               — distance from point to nearest cell centre
             'F2'               — distance from point to second-nearest centre
             'SMOOTH_F1'        — C2-smooth version of F1 (no sharp cusps)
             'N_SPHERE_RADIUS'  — radius of largest empty sphere at point
  distance : 'EUCLIDEAN' (default, physically correct)
             'MANHATTAN', 'CHEBYCHEV', 'MINKOWSKI' — stylised metric options
  outputs  : Distance (FLOAT), Color (COLOR — hash of cell index), Position (VECTOR)
  w input  : 4-D coordinate for 4-D Voronoi; leave unconnected for 3-D
  smoothness: only applies to SMOOTH_F1; 0=sharp, 1=maximally smooth

KEY PHYSICAL PARAMETERS (as named constants at top of build function):
  CRACK_SCALE   : Voronoi scale — higher = more, finer cracks
  CRACK_STOP    : ColorRamp stop position controlling crack width
  GLAZE_COLOR   : RGB of the glaze's diffuse tint (celadon green used here)
  CRACK_ROUGH   : Roughness at crack edges (micro-cracking → scattering)
  BODY_SSS      : Subsurface radius vector (clay body warms light that exits)
  COAT_WEIGHT   : Clearcoat weight for intact glaze regions
  SOAP_IOR      : IOR for soap-film Fresnel gate
  SOAP_SPIN_AMP : Hue rotation amplitude in turns (0.5 = full rainbow sweep)

FAILURE MODES
  • DISTANCE_TO_EDGE at very high Scale (>20) produces Moiré-like bands in UV
    space.  Use Object texture coordinate to avoid UV distortion artefacts.
  • Voronoi Distance output is NOT normalised to [0,1] at all scales.  The max
    distance between a point and its nearest edge depends on cell density.  If
    the ColorRamp crack stop appears at a wrong position after changing Scale,
    recalibrate by driving a Viewer node on the raw Distance output first.
  • MixRGB (now ShaderNodeMixRGB in 5.1) Factor=0 → Color1, Factor=1 → Color2.
    The crack mask (bright at boundaries) should be inverted before feeding the
    Mix factor if you want cracks to pull toward Color1.
  • GLB export bakes only the RENDER viewport; ensure Material Preview or
    Rendered mode is active so Cycles computes the shader before baking.
"""

import bpy
import bmesh
from mathutils import Vector

# ── Named constants ───────────────────────────────────────────────────────────
OBJ_NAME       = "celadon_bowl"
MAT_CERAMIC    = "M_CrackedGlaze_Ceramic"
MAT_SOAP       = "M_SoapFilm_Iridescence"

CRACK_SCALE    = 8.0
CRACK_STOP     = 0.12      # ColorRamp stop: narrower = finer crack lines
CRACK_ROUGH    = 0.65      # roughness inside cracks (micro-fragmented glaze surface)
GLAZE_COLOR    = (0.20, 0.48, 0.40, 1.0)   # celadon green (iron-reduced Cu glaze)
CRACK_COLOR    = (0.72, 0.68, 0.60, 1.0)   # exposed clay body, warm buff
BODY_SSS_RADIUS = (0.06, 0.04, 0.03)       # clay subsurface (warm red-orange bias)
COAT_WEIGHT    = 0.85
COAT_ROUGH     = 0.03      # mirror glaze

SOAP_IOR       = 1.40      # water + surfactant film
SOAP_SPIN_AMP  = 0.45      # hue rotation amplitude in turns
SOAP_BASE      = (0.96, 0.96, 1.00, 1.0)   # near-white base for tinting

GLB_PATH = "//celadon_bowl.glb"


def purge_orphans() -> None:
    bpy.ops.outliner.orphans_purge(
        do_local_ids=True, do_linked_ids=True, do_recursive=True
    )


def delete_defaults() -> None:
    for name in ("Cube", "Light", "Camera"):
        if name in bpy.data.objects:
            bpy.data.objects[name].select_set(True)
    bpy.ops.object.delete()


def build_bowl(name: str) -> bpy.types.Object:
    """Low-poly bowl: UV sphere spun to a shallow dish profile."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0, segments=24, ring_count=12, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = name

    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)

    # Scale to shallow dish (flatten Y, cut top hemisphere)
    for v in bm.verts:
        if v.co.z > 0.15:
            v.co.z = 0.15
        v.co.z *= 0.45

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    bm.to_mesh(me)
    bm.free()
    me.update()
    return obj


def new_node(tree: bpy.types.NodeTree, bl_idname: str, loc: tuple) -> bpy.types.Node:
    n = tree.nodes.new(type=bl_idname)
    n.location = loc
    return n


def link(tree, from_node, from_socket, to_node, to_socket):
    tree.links.new(from_node.outputs[from_socket], to_node.inputs[to_socket])


# ── CERAMIC GLAZE MATERIAL ────────────────────────────────────────────────────

def build_ceramic_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_CERAMIC)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    # Output
    out  = new_node(tree, "ShaderNodeOutputMaterial",    (700, 0))
    bsdf = new_node(tree, "ShaderNodeBsdfPrincipled",    (460, 0))

    # Voronoi — crack geometry
    vor  = new_node(tree, "ShaderNodeTexVoronoi",        (-300, 100))
    vor.voronoi_dimensions = '3D'
    vor.feature             = 'DISTANCE_TO_EDGE'
    vor.distance            = 'EUCLIDEAN'
    vor.inputs["Scale"].default_value    = CRACK_SCALE
    vor.inputs["Randomness"].default_value = 1.0

    # Texture coordinate — Object space avoids UV seam discontinuities
    tex_coord = new_node(tree, "ShaderNodeTexCoord",     (-520, 100))
    link(tree, tex_coord, "Object", vor, "Vector")

    # ColorRamp: distance 0 (on edge) → bright crack, interior → dark/transparent
    ramp = new_node(tree, "ShaderNodeValToRGB",          (-60, 200))
    ramp.color_ramp.interpolation = 'LINEAR'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (1.0, 1.0, 1.0, 1.0)   # at crack
    ramp.color_ramp.elements[1].position = CRACK_STOP
    ramp.color_ramp.elements[1].color    = (0.0, 0.0, 0.0, 1.0)   # glaze interior
    link(tree, vor, "Distance", ramp, "Fac")

    # Crack mask drives: base colour, roughness, coat weight
    #   crack factor (0=glaze, 1=crack edge)
    crack_fac = ramp   # alias for clarity

    # Base colour: glaze vs exposed clay
    mix_col = new_node(tree, "ShaderNodeMixRGB",         (140, 280))
    mix_col.blend_type = 'MIX'
    mix_col.inputs["Color1"].default_value = GLAZE_COLOR
    mix_col.inputs["Color2"].default_value = CRACK_COLOR
    link(tree, crack_fac, "Color", mix_col, "Fac")

    # Roughness: smooth glaze → rough crack edge
    mix_rough = new_node(tree, "ShaderNodeMapRange",     (140, 100))
    mix_rough.inputs["From Min"].default_value = 0.0
    mix_rough.inputs["From Max"].default_value = 1.0
    mix_rough.inputs["To Min"].default_value   = 0.04    # polished glaze
    mix_rough.inputs["To Max"].default_value   = CRACK_ROUGH
    link(tree, crack_fac, "Color", mix_rough, "Value")

    # Coat weight: only intact glaze has clearcoat; cracks don't
    mix_coat = new_node(tree, "ShaderNodeMapRange",      (140, -100))
    mix_coat.inputs["From Min"].default_value = 0.0
    mix_coat.inputs["From Max"].default_value = 1.0
    mix_coat.inputs["To Min"].default_value   = COAT_WEIGHT
    mix_coat.inputs["To Max"].default_value   = 0.0
    link(tree, crack_fac, "Color", mix_coat, "Value")

    # Wire into Principled BSDF
    link(tree, mix_col,   "Color",  bsdf, "Base Color")
    link(tree, mix_rough, "Result", bsdf, "Roughness")
    link(tree, mix_coat,  "Result", bsdf, "Coat Weight")
    bsdf.inputs["Coat Roughness"].default_value        = COAT_ROUGH
    bsdf.inputs["Subsurface Weight"].default_value     = 0.18
    bsdf.inputs["Subsurface Radius"].default_value     = BODY_SSS_RADIUS
    bsdf.inputs["Subsurface Scale"].default_value      = 0.05
    bsdf.inputs["Metallic"].default_value              = 0.0
    bsdf.inputs["IOR"].default_value                   = 1.50   # soda-lime glass glaze

    link(tree, bsdf, "BSDF", out, "Surface")
    return mat


# ── SOAP-FILM IRIDESCENCE MATERIAL ───────────────────────────────────────────

def build_soap_material() -> bpy.types.Material:
    """
    Soap-film iridescence:
      Voronoi F1 Distance → proxy for local film thickness variation
      → drives Hue Rotate amplitude
      Fresnel gates the tinted emission so it only appears at grazing angles.
    """
    mat = bpy.data.materials.new(MAT_SOAP)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = new_node(tree, "ShaderNodeOutputMaterial", (900,  0))
    bsdf = new_node(tree, "ShaderNodeBsdfPrincipled", (660,  0))

    tex_coord = new_node(tree, "ShaderNodeTexCoord",  (-600, 100))

    # Voronoi F1 — smooth cell-centre distance = film thickness proxy
    vor_f1 = new_node(tree, "ShaderNodeTexVoronoi",   (-380, 200))
    vor_f1.voronoi_dimensions = '3D'
    vor_f1.feature             = 'F1'
    vor_f1.distance            = 'EUCLIDEAN'
    vor_f1.inputs["Scale"].default_value      = CRACK_SCALE * 0.8
    vor_f1.inputs["Randomness"].default_value = 1.0
    link(tree, tex_coord, "Object", vor_f1, "Vector")

    # Multiply distance by amplitude → hue shift in turns
    mul = new_node(tree, "ShaderNodeMath",             (-140, 300))
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = SOAP_SPIN_AMP
    link(tree, vor_f1, "Distance", mul, 0)

    # Hue/Saturation/Value — rotate hue by film-thickness proxy
    hsv = new_node(tree, "ShaderNodeHueSaturation",    (100, 300))
    hsv.inputs["Saturation"].default_value = 1.20   # boost beyond base saturation
    hsv.inputs["Value"].default_value      = 1.10
    hsv.inputs["Color"].default_value      = SOAP_BASE
    link(tree, mul, "Value", hsv, "Hue")

    # Fresnel — grazing-angle gate
    fres = new_node(tree, "ShaderNodeFresnel",          (-140, -80))
    fres.inputs["IOR"].default_value = SOAP_IOR

    # Mix: at normal incidence (Fresnel≈0) → white base; at grazing → iridescent
    mix = new_node(tree, "ShaderNodeMixRGB",            (340, 200))
    mix.blend_type = 'MIX'
    mix.inputs["Color1"].default_value = SOAP_BASE
    link(tree, fres, "Fac",   mix, "Fac")
    link(tree, hsv,  "Color", mix, "Color2")

    link(tree, mix,  "Color", bsdf, "Base Color")
    bsdf.inputs["Metallic"].default_value   = 0.0
    bsdf.inputs["Roughness"].default_value  = 0.05
    bsdf.inputs["Alpha"].default_value      = 0.30    # film is translucent
    bsdf.inputs["IOR"].default_value        = SOAP_IOR
    bsdf.inputs["Transmission Weight"].default_value = 0.70

    link(tree, bsdf, "BSDF", out, "Surface")
    mat.blend_method = 'BLEND'   # enable transparency in EEVEE
    return mat


# ── SCENE ASSEMBLY ────────────────────────────────────────────────────────────

def build_scene() -> None:
    purge_orphans()
    delete_defaults()

    # Key light
    bpy.ops.object.light_add(type='AREA', location=(2, -2, 3))
    key = bpy.context.active_object
    key.data.energy = 400
    key.data.size   = 1.5

    # Camera
    bpy.ops.object.camera_add(location=(0, -3, 1.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.15, 0, 0)
    bpy.context.scene.camera = cam

    # Bowl with ceramic glaze (primary)
    bowl_a = build_bowl(OBJ_NAME)
    bowl_a.location = (-1.2, 0, 0)
    mat_a = build_ceramic_material()
    bowl_a.data.materials.append(mat_a)

    # Second bowl with soap-film shader (secondary)
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0, segments=24, ring_count=12, location=(1.2, 0, 0)
    )
    bowl_b = bpy.context.active_object
    bowl_b.name = OBJ_NAME + "_soap"
    mat_b = build_soap_material()
    bowl_b.data.materials.append(mat_b)

    bpy.context.scene.render.engine    = 'CYCLES'
    bpy.context.scene.cycles.samples   = 128
    bpy.context.scene.render.film_transparent = True


def export_glb(path: str) -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_cameras=False,
        export_lights=False,
    )


if __name__ == "__main__":
    build_scene()
    export_glb(bpy.path.abspath(GLB_PATH))
    print("Blueprint complete — celadon_bowl.glb written.")
