"""
Cycles Panoramic Equirectangular Camera — 360° HDR Environment Map for WebXR Skybox
Blender 5.1 / Python 3.11  |  Licence: CC0

TECHNIQUE
---------
A PANO camera with panorama_type = 'EQUIRECTANGULAR' captures the full sphere
in one render pass by projecting longitude → X and latitude → Y. The output
image format is identical to what three.js EquirectangularReflectionMapping,
@react-three/drei <Environment />, and KHR_lights_punctual IBL all expect.

The projection is lossy at the poles (each pole pixel covers more solid angle
than an equatorial pixel), but this only affects scene geometry that happens
to be directly above or below the camera — for a ground-level sky capture the
distortion is in empty sky, which is invisible.

Key decisions that separate a usable WebXR HDRI from a broken one:
  1. Resolution must be exactly 2:1 (4096×2048 production, 2048×1024 preview)
  2. Camera at scene origin, zero rotation — latitude/longitude fill the sphere
  3. Samples: 128 is enough because OIDN albedo+normal denoising is applied
  4. EXR float32 output — HDR range is essential; JPEG kills the specular hot spots
  5. Compositor: Denoise (with albedo & normal passes) → Hue/Sat/Value → File Output
"""

import bpy, math

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
SCENE_NAME     = "pano_360_hdri"
RES_X, RES_Y   = 4096, 2048   # 2:1 mandatory; do not deviate
SAMPLES        = 128
CAMERA_Z       = 1.60          # eye-level elevation (metres)

# bpy uses radians for lat/lon — full-sphere capture
LAT_MIN        = math.radians(-90.0)
LAT_MAX        = math.radians( 90.0)
LON_MIN        = math.radians(-180.0)
LON_MAX        = math.radians( 180.0)

AREA_ENERGY    = 500.0         # watts
SKY_STRENGTH   = 0.6
OUTPUT_PATH    = "//renders/pano_360.exr"


# ─── CLEAN SCENE ─────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.cameras,
                  bpy.data.lights, bpy.data.materials):
        for item in block:
            block.remove(item)


# ─── CAMERA ──────────────────────────────────────────────────────────────────
def build_pano_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    """
    Panoramic cameras in Blender MUST sit at the origin with no rotation.
    The equirectangular projection maps scene directions to pixel coordinates
    purely via angular direction from the camera origin — any translation
    breaks the seamless sphere.
    """
    cam_data = bpy.data.cameras.new(SCENE_NAME)
    cam_data.type            = 'PANO'
    cam_data.panorama_type   = 'EQUIRECTANGULAR'
    cam_data.latitude_min    = LAT_MIN
    cam_data.latitude_max    = LAT_MAX
    cam_data.longitude_min   = LON_MIN
    cam_data.longitude_max   = LON_MAX

    cam_obj = bpy.data.objects.new(SCENE_NAME, cam_data)
    cam_obj.location = (0.0, 0.0, CAMERA_Z)
    # No rotation — camera looks along -Y by default in PANO mode
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj


# ─── SCENE CONTENT ───────────────────────────────────────────────────────────
def build_studio_env(scene: bpy.types.Scene) -> None:
    """
    Simple studio props give the HDRI reflective content to probe.
    Metallic spheres at different heights are the IBL test classic.
    """
    bpy.ops.mesh.primitive_plane_add(size=20.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "floor"
    mat_floor = bpy.data.materials.new("mat_floor")
    mat_floor.use_nodes = True
    bsdf = mat_floor.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.18, 0.18, 0.18, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.6
    floor.data.materials.append(mat_floor)

    probe_specs = [
        ("probe_rough",  (2.0,  1.0, 0.5), (0.8, 0.5, 0.1, 1), 0.0,  0.8),
        ("probe_mirror", (-2.0, 1.0, 0.5), (0.9, 0.9, 0.9, 1), 1.0,  0.05),
        ("probe_dielectric", (0.0, -3.0, 0.5), (0.1, 0.3, 0.9, 1), 0.0, 0.2),
    ]
    for name, loc, col, metallic, roughness in probe_specs:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=loc, segments=48)
        obj = bpy.context.active_object
        obj.name = name
        mat = bpy.data.materials.new(f"mat_{name}")
        mat.use_nodes = True
        b = mat.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = col
        b.inputs["Metallic"].default_value   = metallic
        b.inputs["Roughness"].default_value  = roughness
        obj.data.materials.append(mat)


# ─── WORLD / SKY ─────────────────────────────────────────────────────────────
def build_sky(scene: bpy.types.Scene) -> None:
    """
    Nishita sky gives photophysically correct sky dome without an HDRI.
    Sun elevation, turbidity, and ozone together control warm/cool cast.
    """
    world = bpy.data.worlds.new(SCENE_NAME)
    world.use_nodes = True
    scene.world = world

    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    bg   = nodes.new('ShaderNodeBackground')
    sky  = nodes.new('ShaderNodeTexSky')
    out  = nodes.new('ShaderNodeOutputWorld')

    sky.sky_type      = 'NISHITA'
    sky.sun_elevation = math.radians(32.0)   # mid-morning
    sky.turbidity     = 3.0
    sky.ozone         = 1.0
    bg.inputs['Strength'].default_value = SKY_STRENGTH

    links.new(sky.outputs['Color'], bg.inputs['Color'])
    links.new(bg.outputs['Background'], out.inputs['Surface'])


# ─── RENDER SETTINGS ─────────────────────────────────────────────────────────
def configure_render(scene: bpy.types.Scene) -> None:
    """
    OIDN denoising requires Albedo and Normal render passes to be enabled.
    Without them the denoiser runs in 'Combined only' mode, which produces
    acceptable results at 256+ samples but smears fine detail at 128.
    """
    scene.render.engine           = 'CYCLES'
    scene.render.resolution_x     = RES_X
    scene.render.resolution_y     = RES_Y
    scene.render.resolution_percentage = 100
    scene.cycles.samples          = SAMPLES
    scene.cycles.use_denoising   = True
    scene.cycles.denoiser         = 'OPENIMAGEDENOISE'

    vl = scene.view_layers["ViewLayer"]
    vl.use_pass_combined  = True
    vl.use_pass_diffuse_color  = True   # albedo
    vl.use_pass_normal    = True        # normals

    scene.render.image_settings.file_format    = 'OPEN_EXR'
    scene.render.image_settings.color_depth    = '32'
    scene.render.image_settings.exr_codec      = 'ZIP'
    scene.render.filepath                      = OUTPUT_PATH


# ─── COMPOSITOR ──────────────────────────────────────────────────────────────
def build_compositor(scene: bpy.types.Scene) -> None:
    """
    Compositor denoise node: wiring in Albedo and Normal passes gives OIDN
    its feature buffers. The denoise quality jumps significantly — equivalent
    to roughly 4× the sample count without feature guidance.

    After denoising a Hue/Sat/Value node trims the HDR highlights slightly
    (value 0.9) to avoid over-blown specular when the HDRI is used as a
    WebXR background sky — three.js tone-maps separately.
    """
    scene.use_nodes = True
    tree  = scene.node_tree
    nodes = tree.nodes
    links = tree.links
    nodes.clear()

    rl     = nodes.new('CompositorNodeRLayers')
    denoise = nodes.new('CompositorNodeDenoise')
    hsv    = nodes.new('CompositorNodeHueSat')
    out    = nodes.new('CompositorNodeComposite')
    fout   = nodes.new('CompositorNodeOutputFile')

    fout.base_path = "//renders/"
    fout.file_slots[0].path = "pano_360_#####"
    fout.format.file_format = 'OPEN_EXR'
    fout.format.color_depth = '32'

    denoise.use_hdr = True   # preserve HDR range through denoise pass
    hsv.inputs['Value'].default_value = 0.90

    links.new(rl.outputs['Image'],      denoise.inputs['Image'])
    links.new(rl.outputs['DiffCol'],    denoise.inputs['Albedo'])
    links.new(rl.outputs['Normal'],     denoise.inputs['Normal'])
    links.new(denoise.outputs['Image'], hsv.inputs['Image'])
    links.new(hsv.outputs['Image'],     out.inputs['Image'])
    links.new(hsv.outputs['Image'],     fout.inputs['Image'])


# ─── MAIN ────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    scene = bpy.context.scene
    scene.name = SCENE_NAME

    build_pano_camera(scene)
    build_studio_env(scene)
    build_sky(scene)
    configure_render(scene)
    build_compositor(scene)

    bpy.ops.wm.save_mainfile(filepath=f"//{SCENE_NAME}.blend")
    print("Blueprint ready — render with F12 or bpy.ops.render.render(write_still=True)")


main()
