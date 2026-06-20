"""
blueprint.py — compositor-keying-green-screen-despill-tutorial-production
Blender 5.1 · CC0 · Holoflow Studio

TECHNIQUE  Chroma Key Compositing Pipeline
  RenderLayers → Keying (extract + despill) → Dilate/Erode (fringe removal)
  → Blur (edge soften) → AlphaOver (virtual background) → Composite + File Out

WHY CHROMA KEY IN LINEAR SPACE
  Blender's Compositor operates entirely in scene-linear colour.  The Keying
  node computes colour-distance in YCbCr, where Cb/Cr are the chroma channels
  derived from linear R/G/B — not gamma-encoded values.  Sampling the key colour
  directly from a gamma-encoded JPEG will give the wrong YCbCr centroid; always
  sample from the compositor Image node (which has already been decoded to linear)
  via the Keying node's colour picker.

WHY GREEN OVER BLUE
  Human skin reflects least green of any chromatic channel — maximum separation
  between subject and backdrop.  Blue channels carry more sensor noise at lower
  ISO, and blue-lit subjects spill more noticeably onto hair and translucent
  edges.  Digital cameras also have one green sensor per two red/blue in a Bayer
  pattern, giving green the highest native SNR.

Run in Blender 5.1 Scripting workspace: Alt+R. F12 renders keyed composite.
"""

import bpy
import math

# ── CONSTANTS ────────────────────────────────────────────────────────────────
GREEN_KEY_COLOR   = (0.02, 0.86, 0.10)   # linear sRGB — must match World bg
CLIP_BLACK        = 0.02     # alpha below → transparent (suppress dark fringe)
CLIP_WHITE        = 0.85     # alpha above → opaque (keep bright core)
DESPILL_FACTOR    = 0.7      # green-spill removal strength on semi-transparent edges
DESPILL_BALANCE   = 0.5      # 0=favour B channel, 1=favour R, 0.5=neutral
FEATHER_DIST      = -2       # negative erodes matte edge → removes residual fringe
EDGE_KERNEL_RAD   = 3        # pixel radius for edge detection inside Keying node
EDGE_TOLERANCE    = 0.10     # how much adjacent-pixel variation = an "edge"
BG_COLOR          = (0.01, 0.01, 0.06, 1.0)   # deep-space replacement background
RENDER_X, RENDER_Y = 1920, 1080
SAMPLES           = 32
OUTPUT_PATH       = "//output/keying_comp_"

# ── FACTORY RESET ─────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = "GreenScreenComp"

# ── RENDER SETTINGS ──────────────────────────────────────────────────────
sc.render.engine        = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x  = RENDER_X
sc.render.resolution_y  = RENDER_Y
sc.render.film_transparent = False   # render World bg — Keying strips it
sc.eevee.taa_render_samples = SAMPLES

# ── CAMERA ────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam_obj  = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_data.lens = 50
cam_obj.location = (0, -4.5, 1.4)
cam_obj.rotation_euler = (math.radians(80), 0, 0)
sc.camera = cam_obj

# ── WORLD — SOLID CHROMA-GREEN BACKGROUND ─────────────────────────────────
# Fully saturated, slightly warm green matches a quality DV/studio backdrop.
# Using World background keeps colour consistent across all lighting angles.
world = bpy.data.worlds.new("GreenWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (
    GREEN_KEY_COLOR[0], GREEN_KEY_COLOR[1], GREEN_KEY_COLOR[2], 1.0
)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
sc.world = world

# ── LIGHTS ────────────────────────────────────────────────────────────────
def add_light(name, ltype, energy, loc, rot_deg):
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = [math.radians(d) for d in rot_deg]
    return lo

add_light("KeyLight",  "AREA", 600, (-1.5, -2, 3.5), (55, 0, -30))
add_light("FillLight", "AREA", 200, ( 2.0, -2, 2.5), (50, 0,  40))
add_light("RimLight",  "SPOT", 400, ( 0.0,  2, 3.0), (30, 0, 180))

# ── SUBJECT: FACETED HOST-STAND (octahedron + torus base) ─────────────────
# Orange subject maximises chroma contrast against the green key.
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.8, location=(0, 0, 1.3))
ico = bpy.context.active_object
ico.name = "HostProxy"
bpy.ops.object.shade_flat()   # flat shading = faceted look consistent with studio style

bpy.ops.mesh.primitive_torus_add(
    major_radius=0.9, minor_radius=0.12, location=(0, 0, 0.12)
)
base = bpy.context.active_object
base.name = "BaseTorus"

for obj in (ico, base):
    mat = bpy.data.materials.new(f"{obj.name}Mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.82, 0.38, 0.04, 1.0)  # amber
    bsdf.inputs["Metallic"].default_value  = 0.6
    bsdf.inputs["Roughness"].default_value = 0.3
    obj.data.materials.clear()
    obj.data.materials.append(mat)

# ── COMPOSITOR TREE ──────────────────────────────────────────────────────
sc.use_nodes = True
sc.render.use_compositing = True
tree  = sc.node_tree
nodes = tree.nodes
links = tree.links
nodes.clear()

def n(ntype, x, y, label=None):
    node = nodes.new(ntype)
    node.location = (x, y)
    if label:
        node.label = label
    return node

# Render source
rl = n("CompositorNodeRLayers", -800, 0, "Render Layers")

# KEY NODE — core of the pipeline
# Inputs:  [0] Image, [1] Key Color
# Outputs: [0] Image (keyed + despilled RGBA), [1] Matte (BW alpha), [2] Edges
key = n("CompositorNodeKeying", -500, 0, "Chroma Key")
key.key_color           = GREEN_KEY_COLOR
key.clip_black          = CLIP_BLACK
key.clip_white          = CLIP_WHITE
key.despill_factor      = DESPILL_FACTOR
key.despill_balance     = DESPILL_BALANCE
# edge_kernel_radius: larger → detects broader gradient transitions (fine hair)
key.edge_kernel_radius  = EDGE_KERNEL_RAD
key.edge_kernel_tolerance = EDGE_TOLERANCE
# feather_distance: negative = erode matte inward → eliminates green-lit edge pixels
key.feather_distance    = FEATHER_DIST
key.feather_falloff     = 'SMOOTH'

links.new(rl.outputs["Image"], key.inputs["Image"])

# DILATE / ERODE — secondary edge cleanup on the matte channel
# The Keying node's internal feather is sufficient for most edges, but a second
# pass through DilateErode with type='FEATHER' blurs the falloff further at
# motion-blur-like edges (translucent glass, fly-away hair strands).
de = n("CompositorNodeDilateErode", -200, -200, "Dilate/Erode")
de.mode     = 'FEATHER'
de.distance = -1          # very light secondary erosion — don't over-chisel

# MATTE BLUR — soft-focus the alpha boundary so AlphaOver blends imperceptibly
mblur = n("CompositorNodeBlur", 0, -200, "Matte Blur")
mblur.filter_type = 'GAUSS'
mblur.size_x = 2
mblur.size_y = 2

links.new(key.outputs["Matte"], de.inputs["Mask"])
links.new(de.outputs["Mask"],   mblur.inputs["Image"])

# SET ALPHA — replace the keyed image's embedded alpha with the cleaned matte
# The Keying node's own Image output already has correct alpha for most shots.
# SetAlpha lets us swap in the softened matte for unusually complex hair edges.
sa = n("CompositorNodeSetAlpha", 200, 0, "Set Alpha")
sa.mode = 'REPLACE_ALPHA'
links.new(key.outputs["Image"], sa.inputs["Image"])
links.new(mblur.outputs["Image"], sa.inputs["Alpha"])

# REPLACEMENT BACKGROUND — colour fill node (deep space blue-black)
# For real production: replace with CompositorNodeImage(bpy.data.images.load(path))
bg = n("CompositorNodeMixRGB", 400, 200, "BG Colour")
bg.blend_type = 'MIX'
bg.inputs["Fac"].default_value = 1.0
bg.inputs["Color1"].default_value = BG_COLOR
bg.inputs["Color2"].default_value = (0.0, 0.0, 0.0, 1.0)  # unused second slot

# ALPHA OVER — composite subject over background
# premul=0.0 (use_premultiply=False): our keyed image uses straight alpha (Keying
# node always outputs straight). Premultiplied AlphaOver with straight alpha
# would darken edges by blending pre-divided values — the classic "dark halo".
ao = n("CompositorNodeAlphaOver", 600, 0, "Alpha Over")
ao.premul = 0.0
links.new(bg.outputs["Image"], ao.inputs[1])   # slot 1 = background
links.new(sa.outputs["Image"], ao.inputs[2])   # slot 2 = foreground

# COLOUR MATCH — lighten/shift foreground to match replacement background ambience
# Subtle lift keeps subject from feeling pasted — optional but recommended.
cm = n("CompositorNodeColorBalance", 800, 0, "Colour Match")
cm.correction_method = 'LIFT_GAMMA_GAIN'
cm.lift   = (1.00, 1.00, 1.03)   # very slight blue warmth in shadows
cm.gamma  = (1.00, 1.00, 1.00)
cm.gain   = (0.98, 0.99, 1.02)   # gentle blue push in highlights
links.new(ao.outputs["Image"], cm.inputs["Image"])

# COMPOSITE — final output to render result
comp = n("CompositorNodeComposite", 1100, 0, "Composite")
links.new(cm.outputs["Image"], comp.inputs["Image"])

# FILE OUTPUT — saves numbered PNG sequence to disk
fout = n("CompositorNodeOutputFile", 1100, -200, "File Out")
fout.base_path     = OUTPUT_PATH
fout.file_slots[0].path = "frame_"
fout.format.file_format = 'PNG'
fout.format.color_mode  = 'RGBA'   # preserve alpha for downstream compositing
links.new(cm.outputs["Image"], fout.inputs["Image"])

# VIEWER — optional live preview inside compositor
viewer = n("CompositorNodeViewer", 1100, 200, "Preview")
links.new(cm.outputs["Image"], viewer.inputs["Image"])

# ── ANIMATION: 1 frame only for demonstration render ─────────────────────
sc.frame_start = 1
sc.frame_end   = 1

print(f"[{__file__}] Chroma key compositor ready. F12 to render keyed composite.")
print(f"  Key colour : {GREEN_KEY_COLOR}")
print(f"  Clip range : {CLIP_BLACK} – {CLIP_WHITE}")
print(f"  Despill    : factor={DESPILL_FACTOR}, balance={DESPILL_BALANCE}")
