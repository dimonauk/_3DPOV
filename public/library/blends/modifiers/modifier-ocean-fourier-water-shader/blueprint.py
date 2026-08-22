"""
Ocean Modifier + Water Surface Shader — Fourier Sea with Jacobian Foam
Blender 5.1  |  CC0

Two displacement fields per evaluation:
  · Vertical (Z)   — wave height from the chosen spectral model (iFFT, O(N log N)).
  · Horizontal (XY) — Jacobian deformation toward crests (choppiness).
Where det(Jacobian) < 0 the surface has folded over; the modifier writes 1.0
to the `foam` vertex-colour attribute at those breaking-crest regions.

Source 1: Blender Manual — Ocean Simulation CC-BY-SA 4.0 (Blender Documentation Team)
  https://docs.blender.org/manual/en/latest/physics/ocean_simulation.html
Source 2: Three.js webgl_shaders_ocean.html MIT (mrdoob et al.)
  https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shaders_ocean.html
  Related: Three.js webgpu_ocean.html (WebGPU port); David Li GLSL ocean MIT
  http://david.li/fluid

Run from Blender 5.1 Scripting workspace.  Uncomment export_glb() to write GLB.
"""

import bpy
import math

# ── named constants ────────────────────────────────────────────────────────────

# Ocean geometry
OCEAN_RES        = 7        # grid exponent: 2^N × 2^N; 7=128², 8=256²
OCEAN_SIZE       = 1.0      # world tile width (m); seamlessly tileable
OCEAN_DEPTH      = 200.0    # water depth (m); affects dispersion at k→0
SPECTRUM         = 'MAXJORNER'
# Spectrum guide:
#   MAXJORNER  — Max-Jonswap; open-ocean peaked swell (default)
#   JONSWAP    — original JONSWAP; slightly broader, similar energy
#   PHILLIPS   — simple k^-4 power law; calmer, fewer discrete peaks
#   TEXEL_MARSEN_ARSLOE — TMA; shallow-water correction of JONSWAP

# Wave shape
WAVE_SCALE       = 1.5      # amplitude envelope multiplier (higher = bigger waves)
WIND_VELOCITY    = 28.0     # m/s — drives H_s ≈ 0.0248 × V² (Bretschneider)
WAVE_ALIGNMENT   = 0.90     # 0.0=isotropic sea; 1.0=all waves along wind vector
CHOPPINESS       = 1.5      # Jacobian horizontal deformation (>2.0 causes fold-over)
DAMPING          = 0.50     # suppresses counter-wind energy (0.0–1.0)
FOAM_LAYER_NAME  = 'foam'   # vertex-colour attr; 1.0 where det(J) < 0 (breaking crest)

# Animation
SCENE_FPS        = 25
ANIM_END         = 120      # frames to render

# Lighting
SUN_STRENGTH     = 6.0      # W/m²
SUN_ANGLE        = math.radians(3.0)   # solar disc radius (smaller = harder shadow)

# Water material
WATER_BASE_COL   = (0.03, 0.15, 0.25, 1.0)   # deep-ocean blue
WATER_IOR        = 1.333    # seawater (salt, 20 °C)
WATER_ROUGHNESS  = 0.028    # near-mirror — micro-ripple Bump overrides per pixel
COAT_WEIGHT      = 0.45     # glossy coat for sun glints / wave-highlight specular
COAT_ROUGHNESS   = 0.03
FOAM_EMIT        = 2.2      # emission strength for breaking-crest foam
RIPPLE_SCALE     = 14.0     # Noise UV scale for sub-metre wind ripples
RIPPLE_STRENGTH  = 0.32     # Bump Strength for micro-ripple layer

# Export
EXPORT_FRAME     = 60       # bake frame — mid-animation, active sea state
EXPORT_GLB       = "//ocean_surface.glb"


# ── scene setup ───────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in [bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras]:
        for item in list(blk):
            blk.remove(item)


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine             = 'BLENDER_EEVEE_NEXT'
    sc.frame_start               = 1
    sc.frame_end                 = ANIM_END
    sc.render.fps                = SCENE_FPS
    sc.eevee.use_ssr             = True    # screen-space reflections for wave glints
    sc.eevee.use_ssr_refraction  = True    # refraction for sub-surface look
    sc.eevee.ssr_quality         = 0.5
    sc.eevee.use_gtao            = True    # AO deepens wave troughs
    sc.eevee.gtao_distance       = 0.4
    sc.world = bpy.data.worlds.new("OceanWorld")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value    = (0.44, 0.65, 0.85, 1.0)  # pale sky
        bg.inputs['Strength'].default_value = 0.7


def add_sun():
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 12))
    sun = bpy.context.object
    sun.data.energy = SUN_STRENGTH
    sun.data.angle  = SUN_ANGLE
    sun.rotation_euler = (math.radians(52), 0.0, math.radians(25))
    return sun


# ── ocean plane ───────────────────────────────────────────────────────────────

def add_ocean_plane():
    # Start with any plane — GENERATE mode replaces it with the iFFT grid.
    bpy.ops.mesh.primitive_plane_add(size=OCEAN_SIZE * 2, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = "ocean_surface"

    mod = obj.modifiers.new("Ocean", 'OCEAN')

    # GENERATE synthesises a full iFFT grid directly; DISPLACE applies wave
    # height to the base plane's existing vertex positions.  Use GENERATE —
    # it creates the correct 2^N × 2^N grid without pre-subdividing the plane.
    mod.geometry_mode   = 'GENERATE'
    mod.resolution      = OCEAN_RES
    mod.size            = OCEAN_SIZE
    mod.depth           = OCEAN_DEPTH
    mod.spectrum        = SPECTRUM
    mod.wave_scale      = WAVE_SCALE
    mod.wind_velocity   = WIND_VELOCITY
    mod.wave_alignment  = WAVE_ALIGNMENT
    mod.choppiness      = CHOPPINESS
    mod.damping         = DAMPING
    mod.random_seed     = 0

    # Foam: fires the 'foam' vertex-colour attribute at determinant < 0 regions.
    mod.use_foam        = True
    mod.foam_layer_name = FOAM_LAYER_NAME
    mod.time            = 0.0   # will be driven by frame counter below

    return obj, mod


def add_time_driver(mod):
    """
    Wire mod.time to frame / FPS so waves advance with playback.

    The Ocean modifier does NOT auto-advance — mod.time must be driven or
    keyframed manually.  A SCRIPTED driver using the built-in `frame` variable
    gives a clean 1:1 mapping: 25 frames = 1 s of ocean time at 25 fps.

    WHY a driver instead of an F-Curve:
    F-Curves require manually placing two keyframes (e.g. 0.0 at frame 1,
    4.8 at frame 120) and interpolating linearly.  The SCRIPTED expression
    `frame / 25` is self-describing, always matches the FPS constant, and
    updates automatically if ANIM_END or the frame range changes.
    """
    fc = mod.driver_add('time')
    drv = fc.driver
    drv.type       = 'SCRIPTED'
    drv.expression = f'frame / {SCENE_FPS}'
    # `frame` is a built-in driver variable; no Variable object needed.
    return drv


# ── water material ────────────────────────────────────────────────────────────

def make_water_material():
    mat = bpy.data.materials.new("ocean_water")
    mat.use_nodes = True
    # FORWARD = EEVEE Next sorted-alpha rendering path (required for SSR + refraction)
    mat.surface_render_method = 'FORWARD'
    mat.use_screen_refraction = True
    nt = mat.node_tree
    nt.nodes.clear()

    out       = nt.nodes.new('ShaderNodeOutputMaterial')
    mix       = nt.nodes.new('ShaderNodeMixShader')
    bsdf      = nt.nodes.new('ShaderNodeBsdfPrincipled')
    foam_emit = nt.nodes.new('ShaderNodeEmission')
    foam_attr = nt.nodes.new('ShaderNodeAttribute')
    bump      = nt.nodes.new('ShaderNodeBump')
    noise     = nt.nodes.new('ShaderNodeTexNoise')
    coord     = nt.nodes.new('ShaderNodeTexCoord')
    mapping   = nt.nodes.new('ShaderNodeMapping')

    # ── Principled BSDF — clear seawater ─────────────────────────────────
    bsdf.inputs['Base Color'].default_value         = WATER_BASE_COL
    bsdf.inputs['Roughness'].default_value          = WATER_ROUGHNESS
    bsdf.inputs['IOR'].default_value                = WATER_IOR
    bsdf.inputs['Transmission Weight'].default_value = 0.92
    bsdf.inputs['Coat Weight'].default_value         = COAT_WEIGHT
    bsdf.inputs['Coat Roughness'].default_value      = COAT_ROUGHNESS
    bsdf.inputs['Alpha'].default_value               = 0.82

    # ── micro-ripple bump ─────────────────────────────────────────────────
    # The iFFT grid at resolution=7 resolves waves down to ~OCEAN_SIZE/128 m.
    # Wind ripples at centimetre scale need a separate Noise-based bump layer.
    noise.noise_dimensions             = '3D'
    noise.inputs['Scale'].default_value    = RIPPLE_SCALE
    noise.inputs['Detail'].default_value   = 8.0
    noise.inputs['Roughness'].default_value = 0.52
    mapping.inputs['Scale'].default_value  = (RIPPLE_SCALE, RIPPLE_SCALE, 1.0)
    bump.inputs['Strength'].default_value  = RIPPLE_STRENGTH
    bump.inputs['Distance'].default_value  = 0.015   # 1.5 cm physical ripple height

    # ── foam layer ────────────────────────────────────────────────────────
    # The Ocean modifier writes the `foam` vertex-colour attribute where the
    # Jacobian determinant of the surface mapping is < 0 (crest has folded over).
    # attribute_type='GEOMETRY' reads from the mesh attribute, NOT an object
    # property — using 'OBJECT' silently returns zero.
    foam_attr.attribute_type = 'GEOMETRY'
    foam_attr.attribute_name = FOAM_LAYER_NAME   # must match mod.foam_layer_name
    foam_emit.inputs['Color'].default_value    = (0.98, 0.98, 1.00, 1.0)
    foam_emit.inputs['Strength'].default_value = FOAM_EMIT

    # ── wiring ────────────────────────────────────────────────────────────
    lnk = nt.links.new
    lnk(coord.outputs['Object'],     mapping.inputs['Vector'])
    lnk(mapping.outputs['Vector'],   noise.inputs['Vector'])
    lnk(noise.outputs['Fac'],        bump.inputs['Height'])
    lnk(bump.outputs['Normal'],      bsdf.inputs['Normal'])

    # foam_attr.outputs['Fac'] is the R channel of the RGBA colour attribute —
    # foam stores a greyscale mask, so R=G=B and Fac is the cleanest tap.
    lnk(foam_attr.outputs['Fac'],       mix.inputs['Fac'])
    lnk(bsdf.outputs['BSDF'],           mix.inputs[1])
    lnk(foam_emit.outputs['Emission'],   mix.inputs[2])
    lnk(mix.outputs['Shader'],           out.inputs['Surface'])

    # Node layout (cosmetic, does not affect evaluation)
    coord.location     = (-900, 0);  mapping.location = (-700, 0)
    noise.location     = (-500, 0);  bump.location    = (-260, -120)
    bsdf.location      = (   0, 0);  foam_attr.location = (-260, 300)
    foam_emit.location = (   0, 380); mix.location    = ( 320, 160)
    out.location       = ( 540, 160)

    return mat


# ── camera ────────────────────────────────────────────────────────────────────

def add_camera():
    bpy.ops.object.camera_add(location=(0.0, -3.8, 2.6))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(52), 0.0, 0.0)
    bpy.context.scene.camera = cam
    cam.data.lens = 55.0
    return cam


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    setup_scene()
    add_sun()
    add_camera()
    obj, mod = add_ocean_plane()
    add_time_driver(mod)
    mat = make_water_material()
    obj.data.materials.append(mat)
    print("Ocean surface built.")
    print(f"  Foam attribute: '{FOAM_LAYER_NAME}' (vertex colour, Fac = foam mask)")
    print("  Press Space in the 3D Viewport to play.  Ctrl+Z to undo.")


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb():
    """
    Snapshot the sea state at EXPORT_FRAME and bake to GLB.

    export_apply=True is mandatory — the glTF exporter evaluates the
    modifier stack at the current frame and bakes the resulting mesh.
    export_attributes=True carries the `foam` vertex-colour attribute into
    the GLB as a custom accessor (_FOAM), readable in Three.js via
    geometry.attributes['_foam'] after GLTFLoader.
    """
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath          = EXPORT_GLB,
        export_format     = 'GLB',
        use_selection     = False,
        export_apply      = True,
        export_materials  = 'EXPORT',
        export_image_format = 'WEBP',
        export_attributes = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_yup        = True,
    )
    print(f"Exported: {EXPORT_GLB}  (frame {EXPORT_FRAME})")


main()
# export_glb()   # uncomment to also write the GLB
