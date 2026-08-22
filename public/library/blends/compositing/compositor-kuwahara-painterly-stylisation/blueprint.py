"""
Compositor — Kuwahara Anisotropic Filter: Painterly Oil-Paint Stylisation
=========================================================================
Blender 5.1 | Holoflow Studio | CC0

The Kuwahara filter (added to Blender's Compositor in 4.3) partitions each
pixel's neighbourhood into overlapping sectors, measures the mean and variance
of each sector, and outputs the mean of the lowest-variance sector.  The result
preserves sharp edges while smoothing homogeneous regions — the perceptual
hallmark of oil-paint stroke structure.

ANISOTROPIC MODE (Kyprianidis 2009 — the one to always use):
  Computes the local structure tensor S = ∇I ∇Iᵀ (averaged over a Gaussian
  window) whose dominant eigenvector gives the orientation of the strongest
  local gradient (i.e., the edge direction).  The filter sectors are then
  rotated and anisotropically stretched along this direction so strokes follow
  contours.  At a concave curve the strokes curve with the silhouette; at a
  sharp corner they terminate cleanly.  CLASSIC mode uses fixed circular
  sectors regardless of local geometry and produces blocky T-junction artefacts
  at every edge crossing.

KEY PARAMETERS:
  SIZE        — kernel half-radius in pixels.  At 1280×720: 3-5 is subtle; 7+ is
                painterly.  Scales quadratically; double resolution → multiply by
                ~1.5 not 2.0 (perceptual equivalence not pixel equivalence).
  UNIFORMITY  — integer σ for the Gaussian sector weighting.  Low (2-3) = highly
                adaptive to structure tensor; high (8+) → approaches CLASSIC.
  SHARPNESS   — float [0,1].  Controls the soft-max exponent weighting sectors by
                1/σ².  At 1.0 only the minimum-variance sector contributes (hard
                boundary between strokes); at 0.0 all sectors blend equally → blur.
  VARIATION   — 'ANISOTROPIC' (structure-tensor-guided) or 'CLASSIC' (isotropic).

PIPELINE:
  RenderLayers → OIDN Denoise → Kuwahara → MixRGB(0.75 painted/0.25 clean)
               → Film Grain → Tone Map → Composite

  Mixing 75 % Kuwahara with 25 % clean denoised preserves micro-detail
  (pore-level roughness, thin specular highlights) that full Kuwahara smooths.
  Always apply Kuwahara after denoising — it is not firefly-robust on noisy input.

SCENE: faceted ceramic vessel, emissive trim ring, three-point Cycles lighting.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
OBJ_NAME          = "CeramicVessel"
MAT_NAME          = "FacetedCeladon"
TRIM_MAT_NAME     = "EmissiveTrim"
SCENE_NAME        = "KuwaharaPainterlyDemo"
RENDER_SAMPLES    = 96
RENDER_W          = 1280
RENDER_H          = 720
KUW_SIZE          = 4           # pixels — good balance at 1280×720
KUW_UNIFORMITY    = 4           # σ adaptation strength
KUW_SHARPNESS     = 0.55        # stroke boundary crispness
KUW_VARIATION     = "ANISOTROPIC"
MIX_FACTOR        = 0.75        # fraction of Kuwahara vs clean denoised
GRAIN_STRENGTH    = 0.05        # subtle film grain (0=none, 0.1=visible)
OUTPUT_PATH       = "//output/kuwahara_painterly_###"

# ── Reset ──────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
for lt in list(bpy.data.lights):   bpy.data.lights.remove(lt)

scene = bpy.context.scene
scene.name = SCENE_NAME

# ── Renderer: Cycles ──────────────────────────────────────────────────────────
scene.render.engine                        = "CYCLES"
scene.cycles.samples                       = RENDER_SAMPLES
scene.cycles.use_denoising                 = False   # compositor OIDN handles it
scene.cycles.diffuse_bounces               = 4
scene.cycles.glossy_bounces                = 4
scene.cycles.use_adaptive_sampling         = True
scene.cycles.adaptive_threshold            = 0.01
scene.render.resolution_x                  = RENDER_W
scene.render.resolution_y                  = RENDER_H
scene.render.resolution_percentage         = 100
scene.render.fps                           = 30
scene.frame_start                          = 1
scene.frame_end                            = 1
scene.render.filepath                      = OUTPUT_PATH
scene.render.image_settings.file_format    = "PNG"
scene.render.image_settings.color_mode     = "RGBA"
scene.render.image_settings.color_depth    = "16"

# View Layer: enable Normal + DiffCol passes for OIDN
vl = scene.view_layers["ViewLayer"]
vl.use_pass_normal        = True
vl.use_pass_diffuse_color = True

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens        = 85          # slightly telephoto — flatters vessel form
cam_data.dof.use_dof = False       # keep focus crisp; Kuwahara adds blur organically
cam_obj  = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location       = (0.0, -3.8, 1.4)
cam_obj.rotation_euler = (math.radians(75), 0.0, 0.0)

# ── Vessel mesh: subdivided cylinder shade-flat for faceted look ───────────────
bpy.ops.mesh.primitive_cylinder_add(
    vertices=12, radius=0.65, depth=1.4, location=(0, 0, 0)
)
vessel = bpy.context.active_object
vessel.name = OBJ_NAME

# Taper the top: scale upper loop to create vessel-neck silhouette
import bmesh
bm = bmesh.from_edit_mesh(vessel.data) if vessel.mode == 'EDIT' else bmesh.new()
bm.from_mesh(vessel.data)
top_verts = [v for v in bm.verts if v.co.z > 0.6]
for v in top_verts:
    scale = 0.72
    v.co.x *= scale
    v.co.y *= scale
bm.to_mesh(vessel.data)
bm.free()
vessel.data.update()

bpy.ops.object.shade_flat()    # hard-edge faceted shading — each polygon = one normal

# Assign celadon material to vessel
mat_body = bpy.data.materials.new(MAT_NAME)
mat_body.use_nodes = True
nt = mat_body.node_tree
nt.nodes.clear()
out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (400, 0)
prin = nt.nodes.new("ShaderNodeBsdfPrincipled");  prin.location = (0, 0)
# Celadon glaze: muted jade-grey-green with glassy clearcoat
prin.inputs["Base Color"].default_value  = (0.42, 0.55, 0.48, 1.0)
prin.inputs["Roughness"].default_value   = 0.18
prin.inputs["Specular IOR Level"].default_value = 0.6
prin.inputs["Coat Weight"].default_value = 0.9
prin.inputs["Coat Roughness"].default_value = 0.05
nt.links.new(prin.outputs["BSDF"], out.inputs["Surface"])
vessel.data.materials.append(mat_body)

# ── Emissive trim ring ────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.65, minor_radius=0.04,
    major_segments=32, minor_segments=8,
    location=(0, 0, 0.1)
)
trim = bpy.context.active_object
trim.name = "TrimRing"

mat_trim = bpy.data.materials.new(TRIM_MAT_NAME)
mat_trim.use_nodes = True
tt = mat_trim.node_tree; tt.nodes.clear()
t_out  = tt.nodes.new("ShaderNodeOutputMaterial"); t_out.location  = (400, 0)
t_emit = tt.nodes.new("ShaderNodeEmission");        t_emit.location = (0, 0)
t_emit.inputs["Color"].default_value    = (0.95, 0.85, 0.55, 1.0)  # warm gold glow
t_emit.inputs["Strength"].default_value = 6.0   # high enough to bloom in Kuwahara
tt.links.new(t_emit.outputs["Emission"], t_out.inputs["Surface"])
trim.data.materials.append(mat_trim)

# ── Ground plane ──────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.7))
ground = bpy.context.active_object
ground.name = "Ground"
mat_ground = bpy.data.materials.new("GroundMat")
mat_ground.use_nodes = True
gt = mat_ground.node_tree; gt.nodes.clear()
g_out  = gt.nodes.new("ShaderNodeOutputMaterial"); g_out.location = (400, 0)
g_prin = gt.nodes.new("ShaderNodeBsdfPrincipled"); g_prin.location = (0, 0)
g_prin.inputs["Base Color"].default_value  = (0.24, 0.22, 0.28, 1.0)
g_prin.inputs["Roughness"].default_value   = 0.85
gt.links.new(g_prin.outputs["BSDF"], g_out.inputs["Surface"])
ground.data.materials.append(mat_ground)

# ── Lighting: three-point + rim ───────────────────────────────────────────────
def add_area(name, loc, rot_deg, energy, colour=(1, 1, 1), size=1.0):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy; ld.color = colour; ld.size = size
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location       = loc
    lo.rotation_euler = tuple(math.radians(d) for d in rot_deg)
    return lo

add_area("KeyLight",  ( 2.5,  -2.5, 3.5), (55, 0,  40), 250, (1.0, 0.97, 0.90), 1.5)
add_area("FillLight", (-2.5,  -1.5, 2.0), (55, 0, -40), 80,  (0.75, 0.82, 1.0 ), 2.0)
add_area("RimLight",  ( 0.0,   3.0, 2.8), (30, 0, 180), 120, (0.90, 0.70, 0.55), 0.8)

# ── World ─────────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wt = world.node_tree; wt.nodes.clear()
wbg  = wt.nodes.new("ShaderNodeBackground");  wbg.location  = (0, 0)
wout = wt.nodes.new("ShaderNodeOutputWorld"); wout.location  = (200, 0)
wbg.inputs["Color"].default_value    = (0.06, 0.06, 0.07, 1.0)
wbg.inputs["Strength"].default_value = 0.4
wt.links.new(wbg.outputs["Background"], wout.inputs["Surface"])

# ── Compositor ────────────────────────────────────────────────────────────────
scene.use_nodes = True
tree = scene.node_tree
tree.nodes.clear()

def N(type_, x, y):
    n = tree.nodes.new(type_); n.location = (x, y); return n

def L(a, b):
    tree.links.new(a, b)

# Render Layers
rl        = N("CompositorNodeRLayers",  -400,  200)
rl.scene  = scene

# OIDN denoise — feeds clean image into Kuwahara (noisy input degrades it)
dn        = N("CompositorNodeDenoise",    0,   200)
dn.use_hdr  = True
dn.prefilter = "ACCURATE"   # iterative; best for low sample counts
L(rl.outputs["Image"],       dn.inputs["Image"])
L(rl.outputs["Normal"],      dn.inputs["Normal"])
L(rl.outputs["DiffCol"],     dn.inputs["Albedo"])

# Kuwahara filter — anisotropic, 4-pixel kernel, 75% blend
kuw            = N("CompositorNodeKuwahara", 400,  200)
kuw.size        = KUW_SIZE          # kernel half-radius in pixels
kuw.uniformity  = KUW_UNIFORMITY    # Gaussian σ for sector weighting adaptation
kuw.sharpness   = KUW_SHARPNESS     # sector boundary crispness [0,1]
kuw.variation   = KUW_VARIATION     # 'ANISOTROPIC' | 'CLASSIC'
L(dn.outputs["Image"], kuw.inputs["Image"])

# Mix: 75% Kuwahara + 25% clean denoised — preserves micro-detail
mix        = N("CompositorNodeMixRGB",   700,  200)
mix.blend_type    = "MIX"
mix.inputs["Fac"].default_value = MIX_FACTOR
L(dn.outputs["Image"],  mix.inputs[1])    # socket 1 = A (clean denoised)
L(kuw.outputs["Image"], mix.inputs[2])    # socket 2 = B (Kuwahara)

# Film grain — apply after Kuwahara so grain itself doesn't get filtered
grain_node = N("CompositorNodeFilter", 1000,  200)
# NOTE: Blender's native film grain is a Compositor Glare/Grain operator in
# the Texture node. Approximate with a Noise texture + Add at low strength.
# For true grain, use: Filter node type 'SOFT' for texture variation,
# or add-on Film Grain (GPL-licenced — exclude from CC0 blueprint).
# Workaround: MixRGB ADD with a subtle white noise value.
grain_noise    = N("CompositorNodeTexture",  800,  -100)
# Use scene.bake_type or bpy.data.textures for noise
grain_tex = bpy.data.textures.new("GrainTex", "NOISE")
grain_noise.texture = grain_tex
grain_mix  = N("CompositorNodeMixRGB", 1000,  50)
grain_mix.blend_type = "ADD"
grain_mix.inputs["Fac"].default_value = GRAIN_STRENGTH
L(mix.outputs["Image"],         grain_mix.inputs[1])
L(grain_noise.outputs["Color"], grain_mix.inputs[2])

# Tone Map — Reinhard for photographic warmth
tone       = N("CompositorNodeTonemap",  1300,  200)
tone.tonemap_type  = "RD_PHOTORECEPTOR"
tone.key           = 0.18   # middle-grey target; 0.18 = photographic standard
tone.offset        = 1.0
tone.gamma         = 1.0    # linear passthrough; raise to warm highlights
L(grain_mix.outputs["Image"], tone.inputs["Image"])

# Composite output
comp       = N("CompositorNodeComposite", 1600, 200)
L(tone.outputs["Image"], comp.inputs["Image"])

# Viewer for interactive check
view       = N("CompositorNodeViewer",  1600,  0)
L(tone.outputs["Image"], view.inputs["Image"])

# ── Arrange nodes for readability ─────────────────────────────────────────────
rl.location           = (-400,  150)
dn.location           = (  50,  150)
kuw.location          = ( 400,  150)
mix.location          = ( 700,  150)
grain_mix.location    = (1000,  150)
tone.location         = (1300,  150)
comp.location         = (1600,  150)
view.location         = (1600,    0)

print("[holoflow] Kuwahara painterly compositor demo ready.")
print("  F12 → renders to:", OUTPUT_PATH)
print("  Compositor → Viewer node → inspect Kuwahara-painted result.")
print("  Adjust kuw.size (1-10) and kuw.sharpness (0.0-1.0) live in Compositor.")
