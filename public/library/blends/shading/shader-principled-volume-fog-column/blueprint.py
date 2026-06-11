"""
Procedural Atmospheric Fog Column — Principled Volume shader
Blender 5.1 | bpy 4.4 API | Holoflow Studio | CC0-1.0

Technique: a tall cube mesh is the volume domain.  A Principled Volume
material with Noise Texture → Density creates non-uniform atmospheric haze.
A narrow Spot Light overhead produces volumetric god-ray beams through
Henyey-Greenstein forward scatter (Anisotropy > 0).

Physics primer
──────────────
Blender's Principled Volume maps to the radiative transfer equation:
  dL/ds = -σ_t · L + σ_s · ∫phase(ω,ω′)·L(ω′)dω′ + L_emit
where σ_t = σ_s (scatter) + σ_a (absorb).
• Density   → σ_s  : scattering mean-free path.  0.15 ≈ fog visible at 8 m.
• Absorption Color → spectral σ_a per channel.  White = no absorption.
• Anisotropy → Henyey-Greenstein g.  g=0.5 = strong forward scatter →
  god-ray effect when light shines toward camera.
• Scatter Color → per-channel albedo of each scatter event.

GLB note: glTF 2.0 does not carry a volume domain.  The proxy cube is tagged
holoflow:volume_proxy=True for a downstream Three.js custom shader replacement.
Use record.py for a viewport capture instead of mesh export.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────

DOMAIN_W            = 1.2    # m half-width X/Y — narrow column
DOMAIN_H            = 4.0    # m full height — elongated for rising haze look
VOLUME_DENSITY      = 0.15   # σ_s — 0.05 = thin veil, 0.4 = dense fog
VOLUME_ANISOTROPY   = 0.50   # HG g — 0 = isotropic, 0.5 = strong fwd scatter
SCATTER_COLOR       = (0.65, 0.80, 1.00, 1.0)   # cold blue-grey
ABSORPTION_COLOR    = (1.00, 0.90, 0.75, 1.0)   # absorb short λ slightly
EMISSION_STRENGTH   = 0.0    # 0 = pure scatter; raise to add warm core glow

NOISE_SCALE         = 1.8    # clump spatial frequency
NOISE_DETAIL        = 6.0    # fractal octaves — higher = finer wisps
NOISE_ROUGHNESS     = 0.65   # octave weight (lacunarity multiplier)
NOISE_DISTORTION    = 0.30   # domain warp — breaks hexagonal Worley bias
RAMP_LOW_CUT        = 0.30   # noise value below which density is 0 (air gaps)

LIGHT_ENERGY        = 1200   # W — needs to punch through fog
LIGHT_SPOT_ANGLE    = 0.35   # rad ≈ 20° — narrow for tight god-ray column
LIGHT_POSITION      = (0.0, 0.0, 5.5)

# EEVEE Next — tile-based volumetric integrator
VOL_TILE_SIZE       = '2'    # pixel tile; '2'=highest quality per-frame cost
VOL_SAMPLES         = 128    # ray-march steps per tile
VOL_START           = 0.1    # m — near clip for volume evaluation
VOL_END             = 100.0  # m — far clip

CAMERA_POS          = (3.8, -3.8, 2.2)
CAMERA_LENS         = 35     # mm

# ── Scene utilities ───────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for bl_type in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                    bpy.data.cameras, bpy.data.worlds):
        for item in list(bl_type):
            bl_type.remove(item)


def n(tree, bl_type: str, loc=(0, 0), **kw) -> bpy.types.Node:
    nd = tree.nodes.new(bl_type)
    nd.location = loc
    for k, v in kw.items():
        setattr(nd, k, v)
    return nd


def lnk(tree, a_node, a_sock, b_node, b_sock):
    tree.links.new(a_node.outputs[a_sock], b_node.inputs[b_sock])

# ── Domain geometry ───────────────────────────────────────────────────────────

def build_volume_domain() -> bpy.types.Object:
    """
    A closed convex mesh is mandatory for volume shaders.  Blender evaluates
    the Principled Volume material only inside the mesh's interior; any hole
    clips the density field.  A cube is the safest primitive — no concave
    regions, UV-stable, simple to scale.

    Height >> width gives the column silhouette.  DOMAIN_H/2 as Z scale
    centres the column base at the world origin.
    """
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, DOMAIN_H / 2))
    obj = bpy.context.active_object
    obj.name = "fog_column_domain"
    obj.scale = (DOMAIN_W, DOMAIN_W, DOMAIN_H / 2)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def build_floor() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "floor"
    # Shadow catcher: receives volumetric shadow without its own material cost
    obj.is_shadow_catcher = True
    return obj

# ── Lighting ──────────────────────────────────────────────────────────────────

def build_spot_light() -> bpy.types.Object:
    """
    Spot Light chosen over Area because:
    - Area lights do NOT cast volumetric shadows in EEVEE Next 5.1.
    - Spot gives a single-direction beam — essential for god-ray column look.
    - spot_blend=0.15 soft penumbra avoids visible hard cut-off at beam edge.
    - shadow_soft_size small → tight volumetric beams (like a theatre followspot).
    """
    bpy.ops.object.light_add(type='SPOT', location=LIGHT_POSITION)
    light = bpy.context.active_object
    light.name = "god_ray_spot"
    ld = light.data
    ld.energy            = LIGHT_ENERGY
    ld.spot_size         = LIGHT_SPOT_ANGLE
    ld.spot_blend        = 0.15
    ld.shadow_soft_size  = 0.04   # near-point source = sharp beams
    ld.use_shadow        = True   # MUST be true for volumetric shadows
    return light

# ── Volume material ───────────────────────────────────────────────────────────

def build_volume_material() -> bpy.types.Material:
    """
    Node chain:
      TexCoord(Object) → Noise → ColorRamp → PrincipledVolume.Density
                                           → PrincipledVolume → MaterialOutput.Volume

    WHY Object texture coordinates (not Generated)?
    Object coords are stable in world space regardless of camera or object
    transform.  Generated coords move with UV islands — if the domain cube
    were scaled, Generated would rescale the noise pattern too, silently
    breaking the physical scale of σ_s.  Object coords stay at Blender-unit
    scale = 1 unit / 1 metre, matching the VOLUME_DENSITY tuning.

    WHY ColorRamp at position 0.30 → 0?
    Noise Fac output has a Gaussian distribution centred at 0.5.  Without a
    low cut-off, even faint density everywhere kills the air-gap effect.
    RAMP_LOW_CUT = 0.30 forces the bottom 30% of noise values to zero density,
    creating clear air between wisps.
    """
    mat = bpy.data.materials.new("fog_column_volume")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = n(tree, 'ShaderNodeOutputMaterial',   loc=(700, 0))
    pvol = n(tree, 'ShaderNodeVolumePrincipled',  loc=(400, 0))
    ramp = n(tree, 'ShaderNodeValToRGB',          loc=(100, -80))
    noi  = n(tree, 'ShaderNodeTexNoise',          loc=(-200, 0))
    tc   = n(tree, 'ShaderNodeTexCoord',          loc=(-500, 0))

    # Principled Volume inputs
    pvol.inputs['Density'].default_value           = VOLUME_DENSITY
    pvol.inputs['Anisotropy'].default_value        = VOLUME_ANISOTROPY
    pvol.inputs['Scatter Color'].default_value     = SCATTER_COLOR
    pvol.inputs['Absorption Color'].default_value  = ABSORPTION_COLOR
    pvol.inputs['Emission Strength'].default_value = EMISSION_STRENGTH

    # Noise texture
    noi.inputs['Scale'].default_value      = NOISE_SCALE
    noi.inputs['Detail'].default_value     = NOISE_DETAIL
    noi.inputs['Roughness'].default_value  = NOISE_ROUGHNESS
    noi.inputs['Distortion'].default_value = NOISE_DISTORTION

    # ColorRamp: low-cut clears air gaps; full ramp multiplies base density
    cr = ramp.color_ramp
    cr.elements[0].position = RAMP_LOW_CUT
    cr.elements[0].color    = (0, 0, 0, 1)
    cr.elements[1].position = 1.00
    cr.elements[1].color    = (1, 1, 1, 1)

    lnk(tree, tc,   'Object', noi,  'Vector')
    lnk(tree, noi,  'Fac',    ramp, 'Fac')
    lnk(tree, ramp, 'Color',  pvol, 'Density')
    lnk(tree, pvol, 'Volume', out,  'Volume')

    return mat

# ── Render settings ───────────────────────────────────────────────────────────

def configure_eevee_next(scene: bpy.types.Scene):
    """
    Tile-based volumetric integrator in EEVEE Next 5.1:
    • volumetric_tile_size='2' = 2×2 pixel tiles → 4× higher resolution
      than the default '8', at ~4× render cost per frame.
    • volumetric_samples = ray-march steps per tile per light.
      128 resolves the god-ray column cleanly; 64 is acceptable for preview.
    • use_volumetric_shadows: MUST be True or Spot Light beams are invisible.
      This traces shadow rays back through the volume for each lit voxel.
    """
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    ev = scene.eevee
    ev.volumetric_start                  = VOL_START
    ev.volumetric_end                    = VOL_END
    ev.volumetric_tile_size              = VOL_TILE_SIZE
    ev.volumetric_samples                = VOL_SAMPLES
    ev.volumetric_sample_distribution    = 0.8  # bias toward camera near plane
    ev.use_volumetric_shadows            = True


def configure_world(scene: bpy.types.Scene):
    world = bpy.data.worlds.new("fog_world")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0.03, 0.03, 0.05, 1.0)
        bg.inputs['Strength'].default_value = 0.25  # very dark — fog pops


def tag_proxy_for_webxr(obj: bpy.types.Object):
    obj["holoflow:facet"]            = False
    obj["holoflow:volume_proxy"]     = True
    obj["holoflow:volume_density"]   = VOLUME_DENSITY
    obj["holoflow:volume_anisotropy"]= VOLUME_ANISOTROPY

# ── Camera ────────────────────────────────────────────────────────────────────

def add_camera(domain_obj: bpy.types.Object, scene: bpy.types.Scene):
    bpy.ops.object.camera_add(location=CAMERA_POS)
    cam = bpy.context.active_object
    cam.name = "main_camera"
    cam.data.lens = CAMERA_LENS
    # Track To the domain centre so orbiting record.py always frames the column
    bpy.ops.object.constraint_add(type='TRACK_TO')
    ct = cam.constraints['Track To']
    ct.target     = domain_obj
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'
    scene.camera  = cam
    return cam

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    scene = bpy.context.scene
    clear_scene()

    domain = build_volume_domain()
    build_floor()
    build_spot_light()

    mat = build_volume_material()
    domain.data.materials.append(mat)

    configure_eevee_next(scene)
    configure_world(scene)
    tag_proxy_for_webxr(domain)
    add_camera(domain, scene)

    scene.frame_start = 1
    scene.frame_end   = 120

    print("[fog_column] Scene ready.")
    print(f"  Domain: {domain.name}  scale={tuple(domain.scale)}")
    print(f"  Material: {mat.name}")
    print("  Render: F12 for single frame, or run record.py for orbit animation.")


main()
