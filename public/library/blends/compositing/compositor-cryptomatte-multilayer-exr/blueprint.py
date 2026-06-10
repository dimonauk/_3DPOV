"""
Compositor Nodes — Cryptomatte Masking + Multi-Layer EXR  (Blender 5.1)
blueprint.py — run via Text Editor › Run Script, or:
               blender --background --python blueprint.py

WHY MULTI-LAYER EXR OVER PNG SEQUENCES
  PNG stores only the final composited RGBA — all intermediate data discarded
  at export.  OpenEXR Multi-Layer writes every render pass (Diffuse Direct,
  Glossy Direct, Shadow, Normal, Depth, Cryptomatte) as separate half-float
  channels in one .exr file.  The shadow pass can be reweighted in DaVinci
  Resolve post without re-rendering; any compositing application (Nuke,
  Natron, Fusion) opens the file without a Blender project.  Holoflow's video
  pipeline uses this as the interchange format between the Blender render farm
  and the grade session.  DWAA codec (lossy wavelet) gives 3–8× smaller files
  than ZIP with imperceptible quality loss at production bit depths.

WHY CRYPTOMATTE OBJECT NOT MATERIAL
  Cryptomatte stores a per-pixel hash of either the owning object or its
  material.  Material-mode hashes are useful when one mesh has multiple
  material slots — you get a separate matte per slot.  Object-mode gives one
  matte per mesh, which is almost always correct when compositing: isolate
  the gem, isolate the character, isolate the background.  The Cryptomatte V2
  specification (Psyop, BSD 2-Clause) stores hash values in CryptoObject00..02
  channels — up to 6 depth layers for overlapping transparent objects.

WHY INTEL OIDN OVER BLENDER NLM DENOISER
  NLM (Non-Local Means) is a spatial filter that averages similar patches.  At
  64 samples, fireflies and dark-patch gaps smear rather than resolve.  OIDN
  (Intel Open Image Denoise, Apache-2.0) is a trained convolutional network
  operating on Combined + Normal + Albedo passes jointly.  It preserves edge
  sharpness and recovers texture detail that NLM would blur.  Quality at 64
  samples is visually comparable to 2048 samples for most shots.

WHY FOG GLOW FOR GEM HIGHLIGHTS
  Glare type options: Simple Star (cross-hatch streaks — wrong for gems),
  Streaks (anamorphic lens — correct for bokeh highlights), Ghosts (lens
  flares), Fog Glow (omnidirectional diffuse bloom).  A gem scatters light
  through multiple refractions producing a radial halo — Fog Glow models this
  correctly.  Applying Fog Glow ONLY to the Cryptomatte-isolated gem pass
  then adding it back confines bloom to the gem silhouette — no spill onto
  the background or matte sphere.

OUTSIDE SOURCES
  Cryptomatte Specification v1.2.1 — BSD 2-Clause  Psyop Inc.
    https://github.com/Psyop/Cryptomatte
    Related: https://github.com/EsotericSoftware/cryptomatte-cli (CC0)
  Blender Compositor Manual — CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/compositing/
    Related: https://github.com/sobotka/filmic-blender (MIT, Troy Sobotka)
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
RENDER_ENGINE    = "CYCLES"
RENDER_SAMPLES   = 64              # 64 + OIDN ≈ 512-sample perceptual quality
RENDER_RES_X     = 1920
RENDER_RES_Y     = 1080
PNG_OUTPUT_PATH  = "//renders/final_####"  # composite PNG sequence

GEM_NAME         = "faceted_gem"
SPHERE_NAME      = "matte_sphere"
PLANE_NAME       = "ground_plane"

GEM_COLOUR       = (0.08, 0.72, 0.68, 1.0)   # studio teal
GEM_IOR          = 1.72                        # crown glass
GEM_TRANSMISSION = 0.90
GEM_IRIDESCENCE  = 0.45

SPHERE_COLOUR    = (0.82, 0.78, 0.90, 1.0)    # pale lavender

PLANE_COLOUR     = (0.15, 0.15, 0.18, 1.0)    # near-black charcoal

# Fog Glow settings
GLARE_SIZE       = 7       # bloom radius (2^size pixels): 7 → ~128 px at 1080p
GLARE_THRESHOLD  = 0.8     # only pixels brighter than this contribute to glow
GLARE_MIX        = 0.70    # 0 = original, 1 = full glow

VIGNETTE_STRENGTH = 0.55   # 0 = none, 1 = full-black corners

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.lights, bpy.data.cameras):
        for b in list(pool):
            pool.remove(b)


def make_material(name, colour, metallic=0.0, roughness=0.5,
                  ior=1.45, transmission=0.0, iridescence=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    pb = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    pb.inputs["Base Color"].default_value  = colour
    pb.inputs["Metallic"].default_value    = metallic
    pb.inputs["Roughness"].default_value   = roughness
    pb.inputs["IOR"].default_value         = ior
    pb.inputs["Transmission Weight"].default_value = transmission
    if "Iridescence Weight" in pb.inputs:
        pb.inputs["Iridescence Weight"].default_value = iridescence
    return mat


def add_gem():
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.6,
                                          location=(0.0, 0.0, 0.75))
    obj = bpy.context.active_object
    obj.name = GEM_NAME
    for poly in obj.data.polygons:
        poly.use_smooth = False   # flat shading = crystalline faceted read
    obj.data.materials.append(make_material(
        "mat_gem", GEM_COLOUR, 0.0, 0.02,
        GEM_IOR, GEM_TRANSMISSION, GEM_IRIDESCENCE))
    return obj


def add_sphere():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                         radius=0.45, location=(-1.1, 0.3, 0.5))
    obj = bpy.context.active_object
    obj.name = SPHERE_NAME
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(make_material(
        "mat_sphere", SPHERE_COLOUR, roughness=0.9))
    return obj


def add_ground():
    bpy.ops.mesh.primitive_plane_add(size=6.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = PLANE_NAME
    obj.data.materials.append(make_material(
        "mat_plane", PLANE_COLOUR, roughness=0.6))
    return obj


def add_lights():
    sc = bpy.context.scene

    def area(name, energy, colour, size, loc, rot_deg):
        d = bpy.data.lights.new(name, "AREA")
        d.energy, d.color, d.size = energy, colour, size
        o = bpy.data.objects.new(name, d)
        sc.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = tuple(math.radians(a) for a in rot_deg)
        return o

    area("key_light",  800, (1.0, 0.95, 0.85), 0.8,
         (-2.5, -2.0, 3.8), (50, -20, -30))
    area("fill_light", 220, (0.70, 0.80, 1.0), 1.2,
         (2.8, -1.5, 2.0), (35, 25, 40))

    # Spot rim light — bright, from behind; drives TRT glint on glass
    ld = bpy.data.lights.new("rim_light", "SPOT")
    ld.energy = 500
    ld.spot_size  = math.radians(40)
    ld.spot_blend = 0.3
    ro = bpy.data.objects.new("rim_light", ld)
    sc.collection.objects.link(ro)
    ro.location = (0.5, 3.5, 2.5)
    ro.rotation_euler = (math.radians(-60), 0, math.radians(170))


def add_camera():
    d = bpy.data.cameras.new("cam")
    d.lens = 50
    o = bpy.data.objects.new("cam", d)
    bpy.context.scene.collection.objects.link(o)
    o.location = (3.2, -3.2, 2.4)
    o.rotation_euler = (math.radians(63), 0, math.radians(45))
    bpy.context.scene.camera = o
    return o


# ── RENDER CONFIGURATION ──────────────────────────────────────────────────────
def configure_render(scene):
    scene.render.engine            = RENDER_ENGINE
    scene.cycles.samples           = RENDER_SAMPLES
    scene.cycles.use_denoising     = True
    scene.cycles.denoiser          = "OPENIMAGEDENOISE"
    # RGB_ALBEDO_NORMAL: feeds three input buffers to OIDN for best edge preservation
    scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    scene.render.resolution_x      = RENDER_RES_X
    scene.render.resolution_y      = RENDER_RES_Y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath          = PNG_OUTPUT_PATH


def enable_passes(view_layer):
    view_layer.use_pass_diffuse_direct    = True
    view_layer.use_pass_diffuse_indirect  = True
    view_layer.use_pass_glossy_direct     = True
    view_layer.use_pass_glossy_indirect   = True
    view_layer.use_pass_shadow            = True
    view_layer.use_pass_normal            = True
    view_layer.use_pass_z                 = True
    view_layer.use_pass_cryptomatte_object   = True
    view_layer.use_pass_cryptomatte_accurate = True
    view_layer.pass_cryptomatte_depth        = 3  # 3 layers = 6 EXR channels


# ── COMPOSITOR NODE TREE ──────────────────────────────────────────────────────
def build_compositor(scene, gem_obj):
    scene.use_nodes           = True
    scene.render.use_compositing = True
    nt    = scene.node_tree
    nt.nodes.clear()
    link  = nt.links.new

    # Sources
    rl = nt.nodes.new("CompositorNodeRLayers")
    rl.location = (-650, 0)

    # Denoiser — uses pre-rendered Denoising Normal + Denoising Albedo passes
    dn = nt.nodes.new("CompositorNodeDenoise")
    dn.location  = (-400, 100)
    dn.use_hdr   = True        # preserves HDR values above 1.0 — critical for gems
    link(rl.outputs["Image"],              dn.inputs["Image"])
    link(rl.outputs["Denoising Normal"],   dn.inputs["Normal"])
    link(rl.outputs["Denoising Albedo"],   dn.inputs["Albedo"])

    # Cryptomatte — isolates the gem by object hash
    # source='RENDER' reads hashes baked into the current render session.
    # matte_id: double-quoted object name = exact hash match.
    # Multiple objects: '"gem1" "gem2"' — space-separated, each quoted.
    cm = nt.nodes.new("CompositorNodeCryptomatte")
    cm.location   = (-400, -180)
    cm.source     = "RENDER"
    cm.layer_name = "CryptoObject00"
    cm.matte_id   = f'"{gem_obj.name}"'
    link(rl.outputs["Image"], cm.inputs["Image"])

    # Multiply denoised frame by gem matte to extract gem pixels only
    gem_extract = nt.nodes.new("CompositorNodeMixRGB")
    gem_extract.location = (-180, -180)
    gem_extract.blend_type = "MULTIPLY"
    gem_extract.inputs[0].default_value = 1.0   # mix factor = full multiply
    link(dn.outputs["Image"],  gem_extract.inputs[1])
    link(cm.outputs["Matte"],  gem_extract.inputs[2])

    # Fog Glow on gem extract only
    glare = nt.nodes.new("CompositorNodeGlare")
    glare.location   = (50, -180)
    glare.glare_type = "FOG_GLOW"
    glare.quality    = "HIGH"
    glare.size       = GLARE_SIZE
    glare.threshold  = GLARE_THRESHOLD
    glare.mix        = GLARE_MIX
    link(gem_extract.outputs[0], glare.inputs["Image"])

    # Add glow back onto the full denoised frame
    add_glow = nt.nodes.new("CompositorNodeMixRGB")
    add_glow.location   = (280, 0)
    add_glow.blend_type = "ADD"
    add_glow.inputs[0].default_value = 1.0
    link(dn.outputs["Image"],    add_glow.inputs[1])
    link(glare.outputs["Image"], add_glow.inputs[2])

    # Vignette — soft ellipse darkens corners without altering colour balance
    # Ellipse → Gaussian blur → invert → MULTIPLY_ADD scale → Multiply with image
    vig_ell = nt.nodes.new("CompositorNodeEllipseMask")
    vig_ell.location = (280, -320)
    vig_ell.width    = 0.90
    vig_ell.height   = 0.90

    vig_blur = nt.nodes.new("CompositorNodeBlur")
    vig_blur.location    = (460, -320)
    vig_blur.filter_type = "GAUSS"
    vig_blur.size_x      = 120
    vig_blur.size_y      = 120
    link(vig_ell.outputs["Mask"], vig_blur.inputs["Image"])

    # Invert: 1 - blurred_ellipse  →  0=bright_centre, 1=dark_edges
    vig_inv = nt.nodes.new("CompositorNodeMath")
    vig_inv.location  = (640, -320)
    vig_inv.operation = "SUBTRACT"
    vig_inv.inputs[0].default_value = 1.0
    link(vig_blur.outputs["Image"], vig_inv.inputs[1])

    # Scale: multiply by strength, then add (1 − strength) → range [(1-s), 1]
    vig_scale = nt.nodes.new("CompositorNodeMath")
    vig_scale.location  = (820, -320)
    vig_scale.operation = "MULTIPLY_ADD"
    vig_scale.inputs[1].default_value = VIGNETTE_STRENGTH
    vig_scale.inputs[2].default_value = 1.0 - VIGNETTE_STRENGTH
    link(vig_inv.outputs["Value"], vig_scale.inputs[0])

    vig_apply = nt.nodes.new("CompositorNodeMixRGB")
    vig_apply.location   = (1000, 0)
    vig_apply.blend_type = "MULTIPLY"
    vig_apply.inputs[0].default_value = 1.0
    link(add_glow.outputs["Image"],   vig_apply.inputs[1])
    link(vig_scale.outputs["Value"],  vig_apply.inputs[2])

    # Multi-layer EXR file output — raw passes for external grade
    fout = nt.nodes.new("CompositorNodeOutputFile")
    fout.location = (1200, -280)
    fout.base_path = "//renders/"
    fout.format.file_format = "OPEN_EXR_MULTILAYER"
    fout.format.exr_codec   = "DWAA"   # lossy wavelet, 3–8× smaller than ZIP
    fout.format.color_depth = "32"
    fout.file_slots.clear()
    pass_map = {
        "Image": rl.outputs["Image"],
        "DiffDir": rl.outputs["DiffDir"],
        "GlossDir": rl.outputs["GlossDir"],
        "Shadow": rl.outputs["Shadow"],
        "Normal": rl.outputs["Normal"],
        "Depth": rl.outputs["Depth"],
    }
    for slot_name, src_socket in pass_map.items():
        fout.file_slots.new(slot_name)
        link(src_socket, fout.inputs[slot_name])

    # Composite + Viewer
    comp = nt.nodes.new("CompositorNodeComposite")
    comp.location = (1200, 120)
    link(vig_apply.outputs["Image"], comp.inputs["Image"])

    view = nt.nodes.new("CompositorNodeViewer")
    view.location = (1200, -60)
    link(vig_apply.outputs["Image"], view.inputs["Image"])


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
def export_glb(filepath):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_animations=False,
    )


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    sc = bpy.context.scene

    gem_obj = add_gem()
    add_sphere()
    add_ground()
    add_lights()
    add_camera()

    configure_render(sc)
    enable_passes(sc.view_layers[0])
    build_compositor(sc, gem_obj)

    bpy.ops.wm.save_as_mainfile(
        filepath="//compositor_cryptomatte_multilayer.blend")
    export_glb("//compositor_scene.glb")

    # Trigger full Cycles render (uncomment for headless batch mode):
    # bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
