"""
Compositor — OIDN Denoise Node: Cycles Denoising with Normal + Albedo Passes
=============================================================================
Blender 5.1 | Holoflow Studio | CC0

Open Image Denoise (OIDN) is a deep-learning denoiser built into Blender's
Compositor.  Feed it three inputs — the noisy Combined pass, a surface Normal
pass, and a flat-colour Albedo (DiffCol) pass — and the network reconstructs
a clean image from as few as 8–32 samples per pixel.  The payoff: 16–64×
fewer samples at comparable quality to a full path-trace.

WHY NORMAL + ALBEDO MATTER:
  Without auxiliary passes OIDN treats every pixel independently: it blurs
  across sharp edges and muddles fine material detail.  With Normal it knows
  which pixels belong to the same geometric surface and avoids blurring across
  hard silhouettes.  With Albedo (the flat material colour) it separates
  illumination noise from colour; the cleaned illumination is multiplied back
  by the albedo, preserving material colour accuracy.  Together they let the
  network suppress grain on a flat wall without destroying the edge between
  that wall and a foreground object at all.

BLENDER 5.1 PASS NAMES:
  view_layer.use_pass_normal        → True  (surface world-space normals)
  view_layer.use_pass_diffuse_color → True  (flat material colour = OIDN albedo)
  The DiffCol pass is Blender's 'albedo' equivalent: Principled BSDF base
  colour with no lighting baked in.  GlossyCol and TransCol also exist but
  DiffCol is what OIDN expects; mixing them degrades quality.

PREFILTER MODES (Denoise compositor node, Blender 5.1):
  'NONE'     — pass Normal + Albedo straight through; assumes they are clean.
               Only viable if you have ≥ 256 spp — both passes will be noisy
               at low sample counts and this mode destroys quality.
  'FAST'     — single-pass OIDN pre-filter on Normal + Albedo passes; adds ~15%.
  'ACCURATE' — iterative pre-filter; ~30% extra time; recommended for ≤ 32 spp.
               Default here because we render at 32 spp deliberately.

HDR MODE:
  denoise_node.use_hdr = True preserves the HDR range before denoising.
  Clamping to [0,1] first causes the denoiser to treat blown-out specular
  highlights as flat white and fail to reconstruct correct gloss detail.
  Always keep HDR=True unless your pipeline requires an early clamp.

SCENE: displaced sandstone sphere + three-point key/fill/rim lighting, rendered
at 32 spp Cycles.  Compositor: RenderLayers → Denoise (Normal + Albedo) → Composite.
"""

import bpy
import math

# ── Constants ─────────────────────────────────────────────────────────────────
OBJ_NAME          = "StoneSphere"
MAT_NAME          = "ProcSandstone"
RENDER_SAMPLES    = 32          # intentionally low — denoiser compensates
RENDER_X          = 1920
RENDER_Y          = 1080
CAMERA_DIST       = 4.2
SPHERE_SEGMENTS   = 64
SPHERE_RINGS      = 32
SUBDIV_RENDER     = 4
DISP_SCALE        = 0.10        # displacement amplitude in Blender units (m)
ROUGHNESS         = 0.72
BASE_COLOR        = (0.52, 0.44, 0.36)   # warm sandstone
PREFILTER         = "ACCURATE"  # 'NONE' | 'FAST' | 'ACCURATE'
USE_HDR           = True

# ── Reset scene ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for m in list(bpy.data.materials):
    bpy.data.materials.remove(m)

scene = bpy.context.scene
scene.name = "OIDNDenoiseDemo"

# ── Renderer: Cycles ──────────────────────────────────────────────────────────
scene.render.engine              = "CYCLES"
cyc = scene.cycles
cyc.samples                      = RENDER_SAMPLES
cyc.use_denoising                = False   # compositor node does the denoising
cyc.preview_samples              = 16
cyc.diffuse_bounces              = 4
cyc.glossy_bounces               = 4
cyc.transparent_max_bounces      = 8
cyc.use_adaptive_sampling        = False   # fixed budget for repeatable comparison
scene.render.resolution_x        = RENDER_X
scene.render.resolution_y        = RENDER_Y
scene.render.fps                 = 24
scene.frame_start                = 1
scene.frame_end                  = 1
scene.render.filepath            = "//render/stone_denoise_###"
scene.render.image_settings.file_format  = "OPEN_EXR"
scene.render.image_settings.exr_codec    = "DWAA"
scene.render.image_settings.color_depth  = "32"
scene.render.image_settings.color_mode   = "RGBA"

# ── View Layer: enable Normal + Albedo (DiffCol) passes ───────────────────────
vl = scene.view_layers["ViewLayer"]
vl.use_pass_combined          = True   # noisy beauty
vl.use_pass_normal            = True   # surface normals → OIDN geometry guide
vl.use_pass_diffuse_color     = True   # flat colour → OIDN albedo guide

# ── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(
    location=(CAMERA_DIST * 0.8, -CAMERA_DIST, CAMERA_DIST * 0.55)
)
cam = bpy.context.active_object
cam.data.lens        = 85.0   # short telephoto compresses distance, reduces distortion
cam.rotation_euler   = (math.radians(55), 0, math.radians(38))
scene.camera         = cam

# ── Three-point lighting ──────────────────────────────────────────────────────
def add_area(name, loc, rot_deg, energy, color=(1, 1, 1), size=2.5):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.active_object
    l.name             = name
    l.rotation_euler   = tuple(math.radians(a) for a in rot_deg)
    l.data.energy      = energy
    l.data.color       = color
    l.data.size        = size
    return l

add_area("Key",  ( 3.5, -3.0,  4.5), (50,  0,  40),  900)
add_area("Fill", (-4.0, -1.0,  2.0), (30,  0, -45),  220, (0.80, 0.88, 1.00))
add_area("Rim",  ( 0.0,  4.5,  3.0), (-30, 0, 175),  480)

# ── World: dark neutral ───────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wt = world.node_tree
wt.nodes.clear()
bg = wt.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value   = (0.03, 0.03, 0.04, 1)
bg.inputs["Strength"].default_value = 0.0
out = wt.nodes.new("ShaderNodeOutputWorld")
wt.links.new(bg.outputs["Background"], out.inputs["Surface"])

# ── Displaced stone sphere ────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SPHERE_SEGMENTS, ring_count=SPHERE_RINGS, radius=1.0
)
sphere = bpy.context.active_object
sphere.name = OBJ_NAME

sub = sphere.modifiers.new("Subdiv", "SUBSURF")
sub.render_levels      = SUBDIV_RENDER
sub.levels             = 2
sub.subdivision_type   = "SIMPLE"   # SIMPLE: pure mesh densification, no smoothing

disp_tex = bpy.data.textures.new("StoneNoise", type="CLOUDS")
disp_tex.noise_scale  = 0.40
disp_tex.noise_depth  = 8
disp_tex.noise_type   = "SOFT_NOISE"

disp_mod = sphere.modifiers.new("Displacement", "DISPLACE")
disp_mod.texture        = disp_tex
disp_mod.strength       = DISP_SCALE
disp_mod.mid_level      = 0.5
disp_mod.texture_coords = "OBJECT"

# ── Sandstone material ────────────────────────────────────────────────────────
mat = bpy.data.materials.new(MAT_NAME)
mat.use_nodes = True
sphere.data.materials.clear()
sphere.data.materials.append(mat)
nt = mat.node_tree
nt.nodes.clear()

out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf   = nt.nodes.new("ShaderNodeBsdfPrincipled")
noise  = nt.nodes.new("ShaderNodeTexNoise")
bump   = nt.nodes.new("ShaderNodeBump")
col_ramp = nt.nodes.new("ShaderNodeValToRGB")

out_n.location    = (500,   0)
bsdf.location     = (200,   0)
bump.location     = (-50, -180)
noise.location    = (-300, -180)
col_ramp.location = (-50,  100)

bsdf.inputs["Base Color"].default_value  = (*BASE_COLOR, 1.0)
bsdf.inputs["Roughness"].default_value   = ROUGHNESS
bsdf.inputs["Metallic"].default_value    = 0.0
bsdf.inputs["Specular IOR Level"].default_value = 0.10

# Noise for colour variation — makes the surface read as stone, not plastic
noise.inputs["Scale"].default_value      = 6.0
noise.inputs["Detail"].default_value     = 12.0
noise.inputs["Roughness"].default_value  = 0.65
noise.inputs["Distortion"].default_value = 0.4

# Colour ramp: dark crevice colour to base sandstone
col_ramp.color_ramp.elements[0].color = (0.28, 0.22, 0.16, 1.0)
col_ramp.color_ramp.elements[1].color = (*BASE_COLOR, 1.0)

# Bump for surface grain
bump.inputs["Strength"].default_value  = 0.55
bump.inputs["Distance"].default_value  = 0.04

nt.links.new(noise.outputs["Fac"],    col_ramp.inputs["Fac"])
nt.links.new(col_ramp.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(noise.outputs["Fac"],    bump.inputs["Height"])
nt.links.new(bump.outputs["Normal"],  bsdf.inputs["Normal"])
nt.links.new(bsdf.outputs["BSDF"],   out_n.inputs["Surface"])

# ── Compositor: RenderLayers → Denoise → Composite ───────────────────────────
scene.use_nodes = True
ct = scene.node_tree
ct.nodes.clear()

rl       = ct.nodes.new("CompositorNodeRLayers")
denoise  = ct.nodes.new("CompositorNodeDenoise")
comp     = ct.nodes.new("CompositorNodeComposite")
viewer   = ct.nodes.new("CompositorNodeViewer")

rl.location      = (-500, 0)
denoise.location = (-100, 0)
comp.location    = (300,  0)
viewer.location  = (300, -200)

# ACCURATE pre-filters Normal + Albedo before use — critical at low spp.
denoise.prefilter = PREFILTER
denoise.use_hdr   = USE_HDR    # preserve HDR specular highlights during denoising

ct.links.new(rl.outputs["Image"],   denoise.inputs["Image"])
ct.links.new(rl.outputs["Normal"],  denoise.inputs["Normal"])
ct.links.new(rl.outputs["DiffCol"], denoise.inputs["Albedo"])

ct.links.new(denoise.outputs["Image"], comp.inputs["Image"])
ct.links.new(denoise.outputs["Image"], viewer.inputs["Image"])

print("=" * 60)
print("OIDN Denoise scene ready.  Press F12 to render.")
print(f"  Samples  : {RENDER_SAMPLES} spp (intentionally low)")
print(f"  Prefilter: {PREFILTER}")
print(f"  HDR mode : {USE_HDR}")
print("Mute Denoise node (M) to compare raw noisy render.")
print("=" * 60)
