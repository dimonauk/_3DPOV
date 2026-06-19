"""
blueprint.py  —  compositor-color-grading-rgb-curves-cdl
Blender 5.1 · CC0 · Holoflow Studio

Technique: Exposure → RGB Curves (linear S-contrast) → Color Balance (ASC-CDL)
           → Hue-Saturation-Value (secondary) → Vignette → Composite

The entire pipeline operates in Blender's scene-linear colour space (OCIO
scene-referred), BEFORE the display transform (Filmic/ACES). Every node except
Hue-Saturation-Value is commutative-order-sensitive in linear space: Exposure
MUST precede Curves so the S-curve maps against a normalised reference range,
and CDL MUST precede HSV because ASC-CDL slope×input+offset is a linear
per-channel operation that HSV would distort.

Run in Blender Scripting workspace: Text Editor → Run Script (Alt+R).
After running, F12 renders the fully graded frame.
"""

import bpy
import math

# ─── GRADE PARAMETERS ────────────────────────────────────────────────────────
EXPOSURE_STOPS    = -0.2        # slight pull-back for dynamic-range headroom

# ASC-CDL  out = clamp(slope * in + offset) ^ power
# Neutral: slope=(1,1,1)  offset=(0,0,0)  power=(1,1,1)
CDL_SLOPE   = (1.05, 1.00, 0.96)   # warm gain  — R up, B down in highlights
CDL_OFFSET  = (0.01, 0.00, -0.01)  # warm lift  — shadows tilt warm
CDL_POWER   = (0.95, 0.95,  1.00)  # compress mids on R+G → slightly warm/bright

# Hue-Saturation-Value  (secondary correction, post-CDL)
HSV_HUE          = 0.50     # 0.5 = neutral (no rotation)
HSV_SATURATION   = 1.15     # boost all colours 15 %
HSV_VALUE        = 1.00     # overall brightness — leave for Exposure

# Vignette
VIGNETTE_STRENGTH = 0.35    # 0=none, 1=full black corners

# ─── RENDER SETTINGS ─────────────────────────────────────────────────────────
RES_X   = 1280
RES_Y   = 720
SAMPLES = 64                # adaptive threshold 0.01

# ─── SCENE GEOMETRY ─────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.name = "colour_grade_demo"
scene.render.engine               = "CYCLES"
scene.cycles.samples              = SAMPLES
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold   = 0.01
scene.render.resolution_x         = RES_X
scene.render.resolution_y         = RES_Y
scene.render.filepath             = "//output/colour_grade_"
scene.render.image_settings.file_format     = "PNG"
scene.render.image_settings.color_mode      = "RGBA"
scene.render.image_settings.compression     = 15

# Clear all existing objects
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Faceted 12-sided pillar — flat shading gives each facet a distinct highlight
bpy.ops.mesh.primitive_cylinder_add(
    vertices=12,
    radius=0.7,
    depth=2.2,
    location=(0, 0, 1.1),
)
pillar      = bpy.context.active_object
pillar.name = "grade_pillar"
for poly in pillar.data.polygons:
    poly.use_smooth = False     # flat per-facet shading

# Emissive ring at pillar crown
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.78,
    minor_radius=0.06,
    location=(0, 0, 2.3),
)
ring      = bpy.context.active_object
ring.name = "grade_ring"

# Ground plane
bpy.ops.mesh.primitive_plane_add(size=7.0, location=(0, 0, 0))
floor      = bpy.context.active_object
floor.name = "grade_floor"

# ─── MATERIALS ───────────────────────────────────────────────────────────────
mat_p = bpy.data.materials.new("mat_grade_pillar")
mat_p.use_nodes = True
pb    = mat_p.node_tree.nodes["Principled BSDF"]
pb.inputs["Base Color"].default_value     = (0.10, 0.05, 0.26, 1.0)   # deep violet
pb.inputs["Metallic"].default_value       = 0.18
pb.inputs["Roughness"].default_value      = 0.25
pb.inputs["Coat Weight"].default_value    = 0.65
pb.inputs["Coat Roughness"].default_value = 0.06
pillar.data.materials.append(mat_p)

mat_r = bpy.data.materials.new("mat_grade_ring")
mat_r.use_nodes = True
rb    = mat_r.node_tree.nodes["Principled BSDF"]
rb.inputs["Base Color"].default_value       = (0.55, 0.00, 0.90, 1.0)
rb.inputs["Emission Color"].default_value   = (0.55, 0.00, 0.90, 1.0)
rb.inputs["Emission Strength"].default_value = 8.0
ring.data.materials.append(mat_r)

mat_f = bpy.data.materials.new("mat_grade_floor")
mat_f.use_nodes = True
fb    = mat_f.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.30, 0.30, 0.30, 1.0)
fb.inputs["Roughness"].default_value  = 0.90
floor.data.materials.append(mat_f)

# ─── 3-POINT LIGHTING ────────────────────────────────────────────────────────
def area_light(name, loc, rot_euler, energy, colour):
    ld        = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.color  = colour
    ld.size   = 1.6
    lo        = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location       = loc
    lo.rotation_euler = rot_euler
    return lo

area_light("key_light",  (-3.0,  2.5, 4.5),
           (math.radians(-55), 0, math.radians(-40)), 700,  (1.00, 0.80, 0.62))
area_light("fill_light", ( 3.5, -1.0, 2.5),
           (math.radians(-35), 0, math.radians( 70)), 160,  (0.62, 0.80, 1.00))
area_light("rim_light",  ( 0.5, -4.2, 3.2),
           (math.radians(-50), 0, math.radians(  5)), 320,  (1.00, 1.00, 1.00))

# ─── CAMERA ─────────────────────────────────────────────────────────────────
cam_d = bpy.data.cameras.new("grade_cam")
cam_d.lens = 50
cam_o      = bpy.data.objects.new("grade_cam", cam_d)
scene.collection.objects.link(cam_o)
scene.camera    = cam_o
cam_o.location  = (4.0, -5.5, 3.2)
cam_o.rotation_euler = (math.radians(70), 0.0, math.radians(36))

# ─── VIEW LAYER PASSES ─────────────────────────────────────────────────────
# Normal + DiffCol feed OIDN for guided denoising
vl = scene.view_layers["ViewLayer"]
vl.use_pass_normal        = True
vl.use_pass_diffuse_color = True

# ─── COMPOSITOR TREE ────────────────────────────────────────────────────────
scene.use_nodes = True
tree  = scene.node_tree
for n in list(tree.nodes):
    tree.nodes.remove(n)

def N(typ, x, y):
    n = tree.nodes.new(typ)
    n.location = (x, y)
    return n

def L(src_node, src_sock, dst_node, dst_sock):
    tree.links.new(src_node.outputs[src_sock], dst_node.inputs[dst_sock])

# 1 — Render Layers ─────────────────────────────────────────────────────────
rl = N("CompositorNodeRLayers", -680, 300)

# 2 — OIDN Denoise (Normal + Albedo guided) ─────────────────────────────────
dn            = N("CompositorNodeDenoise", -440, 300)
dn.use_hdr    = True        # preserves specular > 1.0 through denoising
dn.prefilter  = "ACCURATE"  # iterative pre-filter for noisy aux passes
L(rl, "Image",   dn, "Image")
L(rl, "Normal",  dn, "Normal")
L(rl, "DiffCol", dn, "Albedo")

# 3 — Exposure ───────────────────────────────────────────────────────────────
# Scene-linear multiply: EV -0.2 = factor 2^-0.2 ≈ 0.87
# Applied FIRST so the RGB Curves maps a normalised range (not overexposed)
exp = N("CompositorNodeExposure", -200, 300)
exp.inputs["Exposure"].default_value = EXPOSURE_STOPS
L(dn, "Image", exp, "Image")

# 4 — RGB Curves (S-contrast) ─────────────────────────────────────────────
# Operates in scene-linear space: curve maps linear_in → linear_out.
# Two intermediate control points create an S-shape against the neutral diagonal.
# Keep black (0,0) and white (1,1) endpoints untouched — only add midpoints.
crv = N("CompositorNodeCurveRGB", 40, 300)
c   = crv.mapping.curves[0]        # index 0 = combined (C) curve, all channels
# Default points: [0]=(0,0), [1]=(1,1) — add intermediate S-curve points
c.points.new(0.18, 0.15)   # pull midgrey slightly below diagonal → deepen shadows
c.points.new(0.82, 0.88)   # push near-whites above diagonal → open highlights
crv.mapping.update()
L(exp, "Image", crv, "Image")

# 5 — Color Balance (ASC-CDL) ────────────────────────────────────────────────
# ASC CDL v1.2: out = clamp(slope * in + offset) ^ power
#   Slope  = linear gain per channel (equivalent to "Gain" in LGG parlance)
#   Offset = additive constant (equivalent to "Lift")
#   Power  = gamma exponent (equivalent to "Gamma", but inverted: power<1 lifts mids)
#
# OFFSET_POWER_SLOPE is the interchange format used between DI suites
# (DaVinci Resolve, FilmLight Baselight, Marquise Nuke, etc.).
# Values survive round-trips between facilities without numerical drift.
cb = N("CompositorNodeColorBalance", 280, 300)
cb.correction_method = "OFFSET_POWER_SLOPE"
# Each property is RGBA — Alpha component is unused by the CDL formula
cb.offset = (*CDL_OFFSET, 1.0)   # warm-shift shadows
cb.power  = (*CDL_POWER,  1.0)   # compress R+G mids → warm/bright midtones
cb.slope  = (*CDL_SLOPE,  1.0)   # warm gain in highlights
L(crv, "Image", cb, "Color")

# 6 — Hue-Saturation-Value (secondary correction) ───────────────────────────
# Applied AFTER CDL: HSV rotates in perceptual space (cylindrical HSV model),
# which is non-linear and would skew CDL's linear arithmetic if applied before.
hsv = N("CompositorNodeHueSat", 520, 300)
hsv.inputs["Hue"].default_value        = HSV_HUE
hsv.inputs["Saturation"].default_value = HSV_SATURATION
hsv.inputs["Value"].default_value      = HSV_VALUE
hsv.inputs["Fac"].default_value        = 1.0
L(cb, "Color", hsv, "Color")

# 7 — Vignette ──────────────────────────────────────────────────────────────
# EllipseMask (1 inside, 0 outside) → blur edge → remap 0..1 → (1-S)..1
# → MULTIPLY with graded image → centre unchanged, corners darkened by S
ell          = N("CompositorNodeEllipseMask", -200, -80)
ell.x        = 0.5
ell.y        = 0.5
ell.width    = 0.65
ell.height   = 0.75
ell.rotation = 0.0

blur             = N("CompositorNodeBlur", 40, -80)
blur.filter_type = "GAUSS"
blur.size_x      = 160
blur.size_y      = 160
L(ell, "Mask", blur, "Image")

# MULTIPLY by VIGNETTE_STRENGTH:  out = mask * S  →  range [0, S]
m1                      = N("CompositorNodeMath", 240, -80)
m1.operation            = "MULTIPLY"
m1.inputs[1].default_value = VIGNETTE_STRENGTH
L(blur, "Image", m1, 0)

# ADD (1-S):  out = mask*S + (1-S)  →  range [1-S, 1]
m2                      = N("CompositorNodeMath", 420, -80)
m2.operation            = "ADD"
m2.inputs[1].default_value = 1.0 - VIGNETTE_STRENGTH
L(m1, "Value", m2, 0)

# Multiply graded image by vignette mask: centres stay, corners darken
vig = N("CompositorNodeMixRGB", 680, 260)
vig.blend_type                = "MULTIPLY"
vig.inputs[0].default_value   = 1.0   # Fac = full blend
L(hsv, "Color",  vig, 1)    # Color1: graded image
L(m2,  "Value",  vig, 2)    # Color2: vignette mask (greyscale float → RGB)

# 8 — Viewer + Composite ─────────────────────────────────────────────────────
viewer = N("CompositorNodeViewer",    940, 280)
comp   = N("CompositorNodeComposite", 940, 160)
L(vig, "Image", viewer, "Image")
L(vig, "Image", comp,   "Image")

print("[holoflow] colour grading compositor tree built.")
print(f"  Exposure {EXPOSURE_STOPS:+.2f} EV → RGB Curves S-contrast →"
      f" ASC-CDL slope{CDL_SLOPE} offset{CDL_OFFSET} power{CDL_POWER}"
      f" → HSV sat×{HSV_SATURATION} → vignette {VIGNETTE_STRENGTH*100:.0f}%")
print("  Press F12 to render the graded frame.")
