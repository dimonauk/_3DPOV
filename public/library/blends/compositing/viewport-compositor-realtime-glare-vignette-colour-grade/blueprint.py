"""
Viewport Compositor — Real-Time Glare, Vignette & Colour Grade  Blender 5.1
blueprint.py — Text Editor › Run Script

TECHNIQUE
  The Viewport Compositor runs a compositor node graph against the EEVEE
  framebuffer in real time — no F12 render required.  Introduced in 4.2 and
  polished in 5.1, it uses scene.node_tree (the same tree as the offline
  Compositor) but evaluates only GPU-compatible nodes on every viewport
  refresh.  The display toggle lives on the 3D view's shading settings:
    space.shading.use_compositor = 'ALWAYS' | 'CAMERA' | 'DISABLED'

  This blueprint builds:
    Glare (BLOOM) → Colour Balance → Lens Distortion + Vignette → Composite

WHY GLARE BEFORE COLOUR BALANCE
  Glare reads scene-linear HDR values.  Colour Balance remaps them.  Running
  Glare first ensures bloom photons spread from true HDR peaks; grading first
  compresses highlights before Glare can read them.

WHY BLOOM VIA COMPOSITOR NOT EEVEE RENDER SETTINGS
  EEVEE Next (4.2+) removed the Bloom render toggle.  CompositorNodeGlare with
  glare_type='BLOOM' is the replacement — it drives both viewport preview and
  the F12 render output from a single parameter set.

WHY BARREL DISTORTION NOT ZERO
  Slight negative Lens Distortion counteracts the flat appearance of real-time
  renders.  Human vision associates barrel distortion with physical optics.
  Keeping it below |0.04| preserves straight-line readability.

VIGNETTE VIA MULTIPLY NOT ADD-BLACK
  Adding a black radial gradient subtracts channels equally — on saturated
  edges one channel clips to 0 while others stay positive, causing a hue shift
  toward the remaining channel.  MULTIPLY scales all channels by the same
  factor, preserving hue in the darkened corners.

OUTSIDE SOURCES
  Blender Manual — Viewport Compositor  CC-BY-SA-4.0  Blender Foundation
    https://docs.blender.org/manual/en/5.1/editors/3dview/viewport_compositor.html
    Related: https://github.com/blender/blender
  Blender Manual — Compositor Glare Node  CC-BY-SA-4.0  Blender Foundation
    https://docs.blender.org/manual/en/5.1/compositing/types/filter/glare.html
    Related: https://github.com/blender/blender-addons
"""

import bpy, math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SCENE_NAME      = "vp_comp_demo"
RENDER_W        = 1280
RENDER_H        = 720

GLARE_TYPE      = "BLOOM"   # BLOOM replaces the removed EEVEE Bloom toggle
GLARE_THRESHOLD = 0.80      # scene-linear; emission surfaces are typically 1.5–8.0
GLARE_SIZE      = 7         # corona radius (power-of-two steps, 1–9)
GLARE_MIX       = 1.0       # 0 = original only, 1 = full bloom added

CB_LIFT         = (1.00, 1.00, 1.02, 1.0)   # cool shadow lift
CB_GAMMA        = (1.04, 1.01, 0.95, 1.0)   # warm midtone push
CB_GAIN         = (0.92, 0.96, 1.08, 1.0)   # blue-shifted highlights

LENS_DISTORT    = -0.025    # negative = barrel; keep ≤ |0.04|
LENS_DISPERSE   = 0.006     # lateral chromatic aberration

VIGNETTE_SIGMA  = 80        # Gaussian blur radius controlling vignette feather
VIGNETTE_BLEND  = 0.70      # Multiply factor: 0 = no vignette, 1 = maximum

ORB_STRENGTH    = 6.0       # central emissive orb — strong bloom
PILLAR_STRENGTH = 2.2       # flanking pillars — softer bloom

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
if SCENE_NAME in bpy.data.scenes:
    bpy.data.scenes.remove(bpy.data.scenes[SCENE_NAME])
scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene

scene.render.resolution_x          = RENDER_W
scene.render.resolution_y          = RENDER_H
scene.render.engine                 = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples      = 64
scene.frame_start                   = 1
scene.frame_end                     = 120

world = bpy.data.worlds.new("world_vp")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.04, 1.0)
scene.world = world

def make_emission_mat(name, colour, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (*colour, 1.0)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat

# Ground plane
bpy.ops.mesh.primitive_plane_add(size=8)
ground = bpy.context.active_object; ground.name = "ground"
m_gnd = bpy.data.materials.new("mat_ground")
m_gnd.use_nodes = True
m_gnd.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
    0.04, 0.04, 0.05, 1.0)
m_gnd.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
ground.data.materials.append(m_gnd)

bpy.ops.mesh.primitive_ico_sphere_add(radius=0.35, subdivisions=3, location=(0, 0, 0.7))
orb = bpy.context.active_object; orb.name = "orb_central"
orb_mat = make_emission_mat("mat_orb", (0.15, 0.80, 1.0), ORB_STRENGTH)
orb.data.materials.append(orb_mat)

# Keyframe orb emission for the animation: 1.0 → 6.0 → 1.0 pulse
em_node = orb_mat.node_tree.nodes["Emission"]
for fr, val in ((1, 1.0), (30, ORB_STRENGTH), (60, 1.0), (90, ORB_STRENGTH), (120, 1.0)):
    em_node.inputs["Strength"].default_value = val
    em_node.inputs["Strength"].keyframe_insert("default_value", frame=fr)

bpy.ops.mesh.primitive_cube_add(size=0.35, location=(-1.4, 0, 0.45))
pL = bpy.context.active_object; pL.name = "pillar_L"
pL.data.materials.append(make_emission_mat("mat_pL", (1.0, 0.9, 0.7), PILLAR_STRENGTH))

bpy.ops.mesh.primitive_cube_add(size=0.35, location=(1.4, 0, 0.45))
pR = bpy.context.active_object; pR.name = "pillar_R"
pR.data.materials.append(make_emission_mat("mat_pR", (1.0, 0.9, 0.7), PILLAR_STRENGTH))

cam_data = bpy.data.cameras.new("cam"); cam_data.lens = 50
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
cam.location = (0, -5, 1.6)
cam.rotation_euler = (math.radians(80), 0, 0)
scene.camera = cam

light_data = bpy.data.lights.new("fill", "AREA")
light_data.energy = 8; light_data.size = 3
light_obj = bpy.data.objects.new("fill_light", light_data)
scene.collection.objects.link(light_obj)
light_obj.location = (0, -3, 3)

# ── COMPOSITOR NODE TREE ───────────────────────────────────────────────────────
scene.use_nodes = True
tree = scene.node_tree; nodes = tree.nodes; links = tree.links
nodes.clear()

rl = nodes.new("CompositorNodeRLayers"); rl.location = (-600, 0)

glare = nodes.new("CompositorNodeGlare")
glare.glare_type = GLARE_TYPE
glare.threshold  = GLARE_THRESHOLD
glare.size       = GLARE_SIZE
glare.mix        = GLARE_MIX
glare.quality    = "HIGH"
glare.location   = (-300, 0)
links.new(rl.outputs["Image"], glare.inputs["Image"])

cb = nodes.new("CompositorNodeColorBalance")
cb.correction_method = "LIFT_GAMMA_GAIN"
cb.lift  = CB_LIFT
cb.gamma = CB_GAMMA
cb.gain  = CB_GAIN
cb.location = (0, 0)
links.new(glare.outputs["Image"], cb.inputs["Image"])

ld = nodes.new("CompositorNodeLensdist")
ld.use_fit    = True     # scale to fill frame after warp
ld.use_jitter = False    # jitter adds noise; avoid in real-time viewport
ld.inputs["Distortion"].default_value = LENS_DISTORT
ld.inputs["Dispersion"].default_value = LENS_DISPERSE
ld.location = (280, 0)
links.new(cb.outputs["Image"], ld.inputs["Image"])

# Vignette branch
ellipse = nodes.new("CompositorNodeEllipseMask")
ellipse.width = 0.70; ellipse.height = 0.60
ellipse.location = (-300, -320)

blur = nodes.new("CompositorNodeBlur")
blur.filter_type = "GAUSS"
blur.size_x = VIGNETTE_SIGMA; blur.size_y = VIGNETTE_SIGMA
blur.use_relative = False
blur.location = (0, -320)
links.new(ellipse.outputs["Mask"], blur.inputs["Image"])

inv = nodes.new("CompositorNodeInvert")
inv.invert_alpha = False; inv.location = (280, -320)
links.new(blur.outputs["Image"], inv.inputs["Color"])

vmix = nodes.new("CompositorNodeMixRGB")
vmix.blend_type = "MULTIPLY"
vmix.inputs["Fac"].default_value = VIGNETTE_BLEND
vmix.location = (560, 0)
links.new(ld.outputs["Image"],     vmix.inputs["Image"])
links.new(inv.outputs["Color"],    vmix.inputs["Image_001"])

comp = nodes.new("CompositorNodeComposite"); comp.location = (840, 0)
links.new(vmix.outputs["Image"], comp.inputs["Image"])

viewer = nodes.new("CompositorNodeViewer"); viewer.location = (840, -200)
links.new(vmix.outputs["Image"], viewer.inputs["Image"])

# ── ENABLE VIEWPORT COMPOSITOR ────────────────────────────────────────────────
# use_compositor values: 'ALWAYS' (any shading mode), 'CAMERA' (camera view only),
# 'DISABLED'.  Must be in RENDERED shading to see EEVEE output.
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type          = "RENDERED"
                space.shading.use_compositor = "ALWAYS"
                break

print("[VP Compositor] Node tree built. Glare threshold:", GLARE_THRESHOLD,
      "| Bloom size:", GLARE_SIZE, "| Barrel:", LENS_DISTORT)
