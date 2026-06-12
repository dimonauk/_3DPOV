"""
Compositor — Glare + Film Grain + Tone Map: Cinematic Post-Processing  Blender 5.1
blueprint.py — Text Editor › Run Script, or: blender --background --python blueprint.py

TECHNIQUE
  A four-stage cinematic post chain: Glare → Tone Map → Film Grain →
  Lens Distortion → Vignette.  Each stage must land in the right colour
  space; the ordering is physics, not preference.

WHY GLARE BEFORE TONE MAP
  Glare works on scene-linear HDR values: it finds pixels above `threshold`
  and spreads photons outward.  After tone mapping, bright values are
  compressed into [0, 1]; the HDR peaks that would have bloomed are gone.
  Always wire Glare directly from Render Layers, before any tone curve.

WHY GRAIN AFTER TONE MAP
  Noise in scene-linear space is luminance-weighted: a 10 cd/m² pixel gets
  10× more grain than a 1 cd/m² pixel — shadow noise explodes.  In
  display-referred (post-tone-map) space grain is perceptually uniform,
  which is how silver-halide film actually behaves.

WHY VIGNETTE IS MULTIPLY NOT ADD-BLACK
  Adding a black radial gradient subtracts each channel equally.  On a
  saturated edge one channel hits zero while others stay positive — hue
  shifts.  Multiply scales all channels by the same factor: hue preserved.

WHY PHOTORECEPTOR TONE MAP, NOT AGX VIEW TRANSFORM
  Blender 5.1 applies AgX through the display engine (Color Management).
  A Tone Map compositor node on top doubles the tone curve: blacks crush,
  highlights mud.  Two clean pipelines:
    A) Color Management › View Transform = AgX + NO ToneMap node.  ← production
    B) View Transform = Raw + ToneMap node in Compositor.  ← this blueprint
  Switch to pipeline A before final renders.

OUTSIDE SOURCES
  filmic-blender — MIT  Troy Sobotka
    https://github.com/sobotka/filmic-blender
    Related: https://github.com/AcademySoftwareFoundation/OpenColorIO  Apache-2.0
  Blender Compositor Manual — CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/compositing/
    Related: https://github.com/AcademySoftwareFoundation/openexr  BSD-3-Clause
"""

import bpy
import math
import random

# ── PARAMETERS ───────────────────────────────────────────────────────────────
RENDER_W        = 1280
RENDER_H        = 720
RENDER_SAMPLES  = 64
GLARE_THRESHOLD = 0.80   # scene-linear; lower catches more highlights
GLARE_SIZE      = 8      # bloom radius (power-of-two, max 9)
GLARE_MIX       = 0.85   # 0=original, 1=glow only
TONEMAP_KEY     = 0.18   # target middle-grey (18% grey-card standard)
TONEMAP_OFFSET  = 1.0    # 1.0=no black lift, <1.0=raised blacks
TONEMAP_GAMMA   = 1.0    # 1.0=linear, 2.2 for JPEG display
GRAIN_STRENGTH  = 0.035  # blend factor; 0.06 is heavy 35mm, 0.02 barely visible
LENS_DISTORT    = -0.03  # negative=barrel, positive=pincushion
LENS_DISPERSE   = 0.008  # lateral chromatic aberration
VIG_BLUR        = 180    # vignette falloff softness (px)
VIG_DEPTH       = 0.70   # 0=invisible, 1=corners fully black
# ─────────────────────────────────────────────────────────────────────────────


def clear_and_configure() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine           = "CYCLES"
    s.cycles.device           = "GPU"
    s.cycles.samples          = RENDER_SAMPLES
    s.cycles.use_denoising    = True
    s.cycles.denoiser         = "OPENIMAGEDENOISE"
    s.render.resolution_x     = RENDER_W
    s.render.resolution_y     = RENDER_H
    s.render.resolution_percentage = 100
    # Pipeline B: Raw view transform so the ToneMap node is the only curve applied.
    s.view_settings.view_transform = "Raw"
    s.view_settings.look           = "None"


def build_scene() -> None:
    s = bpy.context.scene

    bpy.ops.mesh.primitive_plane_add(size=8.0)
    p = bpy.context.active_object; p.name = "ground"
    mp = bpy.data.materials.new("mat_ground"); mp.use_nodes = True
    mp.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.08, 1.0)
    mp.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value  = 0.88
    p.data.materials.append(mp)

    # Chrome sphere: tight roughness → sharp specular spike Glare will catch
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.9, location=(-1.2, 0.0, 0.9))
    sp = bpy.context.active_object; sp.name = "chrome_sphere"
    mc = bpy.data.materials.new("mat_chrome"); mc.use_nodes = True
    bc = mc.node_tree.nodes["Principled BSDF"]
    bc.inputs["Base Color"].default_value = (0.90, 0.85, 0.70, 1.0)
    bc.inputs["Metallic"].default_value   = 1.0
    bc.inputs["Roughness"].default_value  = 0.04
    sp.data.materials.append(mc)

    # Faceted gem: low-poly ico flat-shaded, IOR 2.42 (diamond-like)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.55, location=(1.1, 0.3, 0.55))
    gm = bpy.context.active_object; gm.name = "faceted_gem"
    bpy.ops.object.shade_flat()
    mg = bpy.data.materials.new("mat_gem"); mg.use_nodes = True
    bg = mg.node_tree.nodes["Principled BSDF"]
    bg.inputs["Base Color"].default_value          = (0.6, 0.2, 1.0, 1.0)
    bg.inputs["Transmission Weight"].default_value = 1.0
    bg.inputs["IOR"].default_value                 = 2.42
    bg.inputs["Roughness"].default_value           = 0.0
    gm.data.materials.append(mg)

    # Key: bright point → HDR spike above GLARE_THRESHOLD
    bpy.ops.object.light_add(type="POINT", location=(2.5, -1.8, 3.2))
    kl = bpy.context.active_object; kl.name = "key_light"
    kl.data.energy = 650.0; kl.data.shadow_soft_size = 0.12

    # Fill: cool area, no dominant shadow
    bpy.ops.object.light_add(type="AREA", location=(-3.0, 1.5, 2.0))
    fl = bpy.context.active_object; fl.name = "fill_light"
    fl.data.energy = 110.0; fl.data.color = (0.7, 0.82, 1.0); fl.data.size = 2.0

    bpy.ops.object.camera_add(location=(0.0, -4.5, 2.2))
    cam = bpy.context.active_object; cam.name = "render_cam"
    cam.rotation_euler = (math.radians(72), 0.0, 0.0); cam.data.lens = 50.0
    s.camera = cam


def make_grain_image() -> "bpy.types.Image":
    """
    Monochrome noise at render resolution: centred on 0.5, deviation ±GRAIN_STRENGTH/2.
    R=G=B (luminance-only) — per-channel noise looks like a sensor defect, not film.
    Seed 42 is deterministic so grain is consistent across re-renders.
    """
    img = bpy.data.images.new("film_grain", RENDER_W, RENDER_H, alpha=False, is_data=True)
    rng = random.Random(42)
    dev = GRAIN_STRENGTH * 0.5
    px: list[float] = []
    for _ in range(RENDER_W * RENDER_H):
        v = 0.5 + (rng.random() * 2.0 - 1.0) * dev
        px.extend([v, v, v, 1.0])
    img.pixels = px; img.update()
    return img


def build_compositor(grain_img: "bpy.types.Image") -> None:
    s = bpy.context.scene; s.use_nodes = True
    t = s.node_tree; n = t.nodes; lk = t.links; n.clear()

    rl = n.new("CompositorNodeRLayers"); rl.location = (-900, 300)

    # 1. GLARE — scene-linear HDR; must precede tone mapping (see header)
    gl = n.new("CompositorNodeGlare"); gl.location = (-660, 300)
    gl.glare_type = "FOG_GLOW"  # omnidirectional; STREAKS for anamorphic, SIMPLE_STAR for point sources
    gl.quality = "HIGH"; gl.threshold = GLARE_THRESHOLD
    gl.size = GLARE_SIZE; gl.mix = GLARE_MIX
    lk.new(rl.outputs["Image"], gl.inputs["Image"])

    # 2. TONE MAP — compresses HDR into display range
    tm = n.new("CompositorNodeTonemap"); tm.location = (-420, 300)
    tm.tonemap_type = "PHOTORECEPTOR"  # key=target grey, offset=black lift
    tm.key = TONEMAP_KEY; tm.offset = TONEMAP_OFFSET; tm.gamma = TONEMAP_GAMMA
    lk.new(gl.outputs["Image"], tm.inputs["Image"])

    # 3. FILM GRAIN — display-referred, post-tone-map (see header)
    gi = n.new("CompositorNodeImage"); gi.location = (-420, 60); gi.image = grain_img
    gx = n.new("CompositorNodeMixRGB"); gx.location = (-180, 240)
    gx.blend_type = "SCREEN"  # Screen(a,b)=1-(1-a)(1-b) avoids highlight clipping vs Add
    gx.inputs["Fac"].default_value = GRAIN_STRENGTH
    lk.new(tm.outputs["Image"], gx.inputs[1]); lk.new(gi.outputs["Image"], gx.inputs[2])

    # 4. LENS DISTORTION — barrel warp + lateral chromatic aberration
    ld = n.new("CompositorNodeLensdist"); ld.location = (60, 240)
    ld.inputs["Distort"].default_value = LENS_DISTORT
    ld.inputs["Dispersion"].default_value = LENS_DISPERSE
    lk.new(gx.outputs["Image"], ld.inputs["Image"])

    # 5. VIGNETTE — ellipse mask → blur → scale to [1-DEPTH, 1] → multiply
    em = n.new("CompositorNodeEllipseMask"); em.location = (-420, -200)
    em.width = 0.85; em.height = 0.85; em.x = 0.5; em.y = 0.5
    bl = n.new("CompositorNodeBlur"); bl.location = (-180, -200)
    bl.size_x = bl.size_y = VIG_BLUR; bl.filter_type = "GAUSS"
    lk.new(em.outputs["Mask"], bl.inputs["Image"])
    # Remap blur output: [0,1] → [1-VIG_DEPTH, 1] so centre=1 (unchanged), corners darken
    ma = n.new("CompositorNodeMath"); ma.location = (60, -200)
    ma.operation = "MULTIPLY"; ma.inputs[1].default_value = VIG_DEPTH
    lk.new(bl.outputs["Image"], ma.inputs[0])
    ad = n.new("CompositorNodeMath"); ad.location = (300, -200)
    ad.operation = "ADD"; ad.inputs[1].default_value = 1.0 - VIG_DEPTH
    lk.new(ma.outputs["Value"], ad.inputs[0])
    vm = n.new("CompositorNodeMixRGB"); vm.location = (300, 240)
    vm.blend_type = "MULTIPLY"; vm.inputs["Fac"].default_value = 1.0
    lk.new(ld.outputs["Image"], vm.inputs[1]); lk.new(ad.outputs["Value"], vm.inputs[2])

    co = n.new("CompositorNodeComposite"); co.location = (560, 240)
    lk.new(vm.outputs["Image"], co.inputs["Image"])
    vw = n.new("CompositorNodeViewer"); vw.location = (560, 60)
    lk.new(vm.outputs["Image"], vw.inputs["Image"])


def main() -> None:
    clear_and_configure()
    build_scene()
    grain_img = make_grain_image()
    build_compositor(grain_img)
    bpy.context.scene.render.filepath = "//renders/cinematic_grade_####"
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.ops.wm.save_as_mainfile(
        filepath="//../../public/library/blends/compositing/"
                 "compositor-glare-filmgrain-tonemapping/"
                 "compositor_cinematic_grade.blend"
    )
    print("[holoflow] compositor-glare-filmgrain-tonemapping blueprint ready.")


main()
