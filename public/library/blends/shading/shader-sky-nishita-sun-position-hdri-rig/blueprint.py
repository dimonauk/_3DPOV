"""
World Shader — Nishita Sky Texture + Sun Position: Physically-Based Outdoor Lighting Rig
Blender 5.1  |  CC0

The Nishita 1993 model simulates atmospheric Rayleigh + Mie + Ozone scattering along
the optical path from the sun to any sky-dome direction.  Five artist parameters —
air_density (Rayleigh), dust_density (Mie/aerosol), ozone_density, sun_elevation,
and sun_rotation — reproduce the entire visible arc from pre-dawn purple to midday
blue without any HDRI texture file.

This blueprint:
  · Builds a World node tree: ShaderNodeTexSky → Background → World Output
  · Creates a SUN lamp whose elevation and rotation match the sky node's sun direction
  · Adds a three-prop test scene (ground + chrome sphere + diffuse cube)
  · Animates sun_elevation from pre-dawn (−5 °) to noon (70 °) across 180 frames
  · Exports a GLB snapshot at the golden-hour keyframe (frame 30)

AgX colour management (default since Blender 4.0) is required — the sky dome spans
an HDR range of ~10⁷:1 that Filmic handles roughly but Linear clips catastrophically.

Sources:
  1. T. Nishita, T. Sirai, K. Tadamura, E. Nakamae — "Display of the earth taking
     into account atmospheric scattering," ACM SIGGRAPH 1993 Proceedings, pp. 175–182.
     https://dl.acm.org/doi/10.1145/166117.166140  (academic reference — PD)
  2. Three.js Sky (MIT) — Preetham sky in WebGL/TSL, sibling WebXR sky reference
     https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Sky.js
     © mrdoob / three.js contributors, MIT licence

Run from Blender 5.1 Scripting workspace  (Text Editor → Run Script).
"""

import bpy
import math

# ── named constants ───────────────────────────────────────────────────────────

# Sky model
SKY_TYPE       = 'NISHITA'         # 'PREETHAM' | 'HOSEK_WILKIE' | 'NISHITA'
SUN_ELEVATION  = math.radians(5.0) # initial dawn elevation: 5 ° above horizon
SUN_ROTATION   = math.radians(45.0)# azimuth: 45 ° off south → south-west sun
AIR_DENSITY    = 1.0               # [0–10] Rayleigh depth; 1.0 = standard atmosphere
DUST_DENSITY   = 0.5               # [0–10] Mie/aerosol depth; 0.5 = moderate urban haze
OZONE_DENSITY  = 1.0               # [0–10] ozone absorption; 1.0 = 300 DU column
ALTITUDE_KM    = 0.0               # height above sea level in km; 0 = coastal / sea level
SUN_DISC       = True              # render the solar disc in the sky dome
SKY_STRENGTH   = 1.0               # world Background strength multiplier

# Matching SUN lamp
SUN_ENERGY_NOON  = 5.0             # direct irradiance proxy at noon (W/m²-ish)
SUN_ANGLE_DEG    = 0.526           # solar angular diameter ≈ 0.53 ° → correct penumbra

# Animation: sun elevation sweep (pre-dawn → noon)
FRAME_START  = 1
FRAME_END    = 180
ELEV_DAWN    = math.radians(-5.0)  # 5 ° below horizon: twilight glow
ELEV_NOON    = math.radians(70.0)  # high-summer noon at ~45 ° latitude
GOLDEN_HOUR  = 30                  # export snapshot at this frame

# Test geometry
GROUND_SIZE     = 8.0
SPHERE_RADIUS   = 0.5
CUBE_SIZE       = 0.8
ROUGHNESS_CHROME = 0.05  # near-mirror → sky colour visible in reflection
ROUGHNESS_CUBE   = 0.85  # diffuse clay → sky colour via GI

# Render + export
RENDER_ENGINE = 'BLENDER_EEVEE_NEXT'  # swap to 'CYCLES' for ground truth
EXPORT_GLB    = "//sky_nishita_hdri_rig.glb"


# ── helpers ───────────────────────────────────────────────────────────────────

def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def make_material(name: str, base_color: tuple, metallic: float, roughness: float):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value   = metallic
    bsdf.inputs['Roughness'].default_value  = roughness
    return mat


# ── world shader ──────────────────────────────────────────────────────────────

def build_world_shader() -> bpy.types.World:
    """
    ShaderNodeTexSky → ShaderNodeBackground → ShaderNodeOutputWorld.

    The sky node computes the spectral radiance at every sky direction from
    the five atmospheric parameters; Background packages that into an environment
    emission sampled by both Cycles (importance-sampled sky) and EEVEE (world cubemap).
    No UV, no texture file — the sky is evaluated analytically at render time.
    """
    world = bpy.data.worlds.get("NishitaSky") or bpy.data.worlds.new("NishitaSky")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()

    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.location      = (-400, 300)
    sky.sky_type      = SKY_TYPE
    sky.sun_elevation = SUN_ELEVATION
    sky.sun_rotation  = SUN_ROTATION
    sky.air_density   = AIR_DENSITY
    sky.dust_density  = DUST_DENSITY
    sky.ozone_density = OZONE_DENSITY
    sky.altitude      = ALTITUDE_KM
    sky.sun_disc      = SUN_DISC

    bg = nt.nodes.new('ShaderNodeBackground')
    bg.location = (-100, 300)
    bg.inputs['Strength'].default_value = SKY_STRENGTH

    out = nt.nodes.new('ShaderNodeOutputWorld')
    out.location = (200, 300)

    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return world


# ── sun lamp ──────────────────────────────────────────────────────────────────

def add_sun_lamp() -> bpy.types.Object:
    """
    SUN type lamp (parallel rays) matches the sky node's sun direction.
    Energy scales with sin(elevation) — Lambert cosine law over the atmosphere;
    at −5 ° (below horizon) energy is near-zero, at 70 ° it is SUN_ENERGY_NOON.
    The SUN lamp angle replicates the solar disc angular diameter for realistic penumbra.
    """
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
    lamp = bpy.context.active_object
    lamp.name      = "Sun_Lamp"
    lamp.data.name = "Sun_Lamp"
    lamp.data.energy = SUN_ENERGY_NOON
    lamp.data.angle  = math.radians(SUN_ANGLE_DEG)
    lamp.data.use_shadow = True
    # Euler: X-tilt from downward vertical = 90° − elevation; Z = azimuth
    lamp.rotation_euler[0] = math.pi / 2.0 - SUN_ELEVATION
    lamp.rotation_euler[2] = SUN_ROTATION
    return lamp


# ── test scene ────────────────────────────────────────────────────────────────

def build_test_scene() -> None:
    """
    Three-prop triad: ground plane, chrome sphere, diffuse cube.
    Together they expose specular highlight (sphere), shadow penumbra (cube),
    and GI sky-colour fill (both objects vs ground).
    """
    bpy.ops.mesh.primitive_plane_add(size=GROUND_SIZE, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "Ground"
    plane.data.materials.append(
        make_material("Ground_Sand", (0.45, 0.42, 0.38, 1.0), 0.0, 0.92)
    )

    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=SPHERE_RADIUS, location=(-1.0, 0.0, SPHERE_RADIUS)
    )
    sphere = bpy.context.active_object
    sphere.name = "Chrome_Sphere"
    sphere.data.materials.append(
        make_material("Chrome", (0.90, 0.90, 0.90, 1.0), 1.0, ROUGHNESS_CHROME)
    )

    bpy.ops.mesh.primitive_cube_add(size=CUBE_SIZE, location=(1.0, 0.0, CUBE_SIZE / 2))
    cube = bpy.context.active_object
    cube.name = "Clay_Cube"
    cube.data.materials.append(
        make_material("Clay", (0.72, 0.72, 0.72, 1.0), 0.0, ROUGHNESS_CUBE)
    )


# ── colour management ─────────────────────────────────────────────────────────

def configure_colour_management() -> None:
    """
    AgX handles the ~10⁷:1 luminance range of the Nishita sky without the sun-disc
    clipping that destroys Linear, and with better chroma preservation in the horizon
    band than Filmic.  Do not switch to Standard or Raw for outdoor sky renders.
    """
    vs = bpy.context.scene.view_settings
    vs.view_transform = 'AgX'
    vs.look           = 'None'   # 'AgX - High Contrast' for dramatic golden-hour look
    vs.exposure       = 0.0
    vs.gamma          = 1.0


# ── render settings ───────────────────────────────────────────────────────────

def configure_render() -> None:
    scene              = bpy.context.scene
    scene.render.engine = RENDER_ENGINE
    scene.frame_start  = FRAME_START
    scene.frame_end    = FRAME_END
    scene.render.fps   = 30

    if RENDER_ENGINE == 'CYCLES':
        scene.cycles.use_light_tree = True   # sky treated as an area light → fast sampling
        scene.cycles.samples        = 256
        scene.cycles.use_denoising  = True
    elif RENDER_ENGINE == 'BLENDER_EEVEE_NEXT':
        scene.eevee.use_raytracing  = True   # SSR needed to show sky in chrome sphere
        scene.eevee.ray_tracing_options.resolution_scale = '1'


# ── animation ─────────────────────────────────────────────────────────────────

def animate_sun(world: bpy.types.World, lamp: bpy.types.Object) -> None:
    """
    Linear sweep of sun_elevation from ELEV_DAWN to ELEV_NOON over FRAME_END frames.
    The SUN lamp energy uses sin(elevation + 0.1) to avoid zero at exactly −5 °;
    a small floor of 0.04 × noon energy keeps twilight barely illuminated.
    """
    sky = next(n for n in world.node_tree.nodes if n.type == 'TEX_SKY')
    scene = bpy.context.scene

    for frame, elev in ((FRAME_START, ELEV_DAWN), (FRAME_END, ELEV_NOON)):
        scene.frame_set(frame)
        sky.sun_elevation = elev
        sky.keyframe_insert(data_path='sun_elevation', frame=frame)

        energy = SUN_ENERGY_NOON * max(0.04, math.sin(elev + 0.1))
        lamp.data.energy = energy
        lamp.data.keyframe_insert(data_path='energy', frame=frame)
        lamp.rotation_euler[0] = math.pi / 2.0 - elev
        lamp.keyframe_insert(data_path='rotation_euler', frame=frame)

    # Park at golden hour for file save + GLB export
    gh_elev = ELEV_DAWN + (ELEV_NOON - ELEV_DAWN) * (GOLDEN_HOUR / FRAME_END)
    scene.frame_set(GOLDEN_HOUR)
    sky.sun_elevation = gh_elev


# ── GLB export ────────────────────────────────────────────────────────────────

def export_glb() -> None:
    """
    Export geometry only — the Nishita sky is analytical and cannot be embedded in
    GLB.  For WebXR, reconstruct the sky in Three.js via Sky.js (MIT) or a custom
    TSL shader using the Preetham model.  The chrome sphere demonstrates the sky's
    IBL colour at golden hour; the cube shows the GI fill direction.
    """
    bpy.ops.object.select_all(action='DESELECT')
    for name in ("Ground", "Chrome_Sphere", "Clay_Cube"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects.get("Chrome_Sphere")
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_GLB,
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
    )


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    reset_scene()
    world = build_world_shader()
    lamp  = add_sun_lamp()
    build_test_scene()
    configure_colour_management()
    configure_render()
    animate_sun(world, lamp)
    export_glb()
    print("✓ Nishita sky rig complete — parked at golden-hour frame", GOLDEN_HOUR)


main()
