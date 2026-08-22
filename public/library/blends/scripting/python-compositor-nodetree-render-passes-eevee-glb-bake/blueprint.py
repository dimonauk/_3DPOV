"""
blueprint.py — Python bpy.types.CompositorNodeTree
Build a production compositor pipeline programmatically in Blender 5.1.

Technique synopsis
------------------
scene.use_nodes = True creates scene.node_tree as a CompositorNodeTree and
auto-populates it with a RenderLayers → Composite pair.  Clear that default
with tree.nodes.clear() before building a custom graph.

Pipeline built here:

    RenderLayers ─┬─ Image / Normal / Albedo ──► Denoise (OIDN)
                  │                                     │
                  │                               ColorBalance  ◄── CDL grade (lift/gamma/gain)
                  │                                     │
                  │                                   Glare  ◄── FOG_GLOW for EEVEE emission
                  │                                     │
                  │                                 LensDist  ◄── barrel + chromatic aberration
                  │                                     │
                  │                         ┌──────────► Composite
                  │                         │
                  └─ (pass sockets) ────► File Output  ◄── multilayer EXR archive

Node bl_idnames in the Compositor use the "CompositorNode" prefix — they are
distinct from "ShaderNode" and "GeometryNode" trees and cannot be mixed.
Blender 5.1 adds a GPU compositor backend (scene.render.compositor_device='GPU')
that evaluates the entire tree on the GPU each refresh — far faster than CPU for
complex graphs.  It respects compositor_precision='AUTO' (full float32 on GPU).

File Output EXR: layer_slots.new(name) adds a named input; the slot's integer
index (not its name) is used when wiring with tree.links.new.  The default
auto-created slot must be removed before adding custom ones — it occupies index 0
and will absorb the first link.

OIDN denoiser: vl.use_denoising_data = True exposes Denoising Normal and
Denoising Albedo sockets on the RenderLayers node.  These guide the denoiser
to preserve fine detail — without them, OIDN uses image-only denoising which
blurs geometry boundaries.  denoise.use_hdr = True preserves HDR values; without
it, emission peaks above 1.0 are clipped before denoising.
"""

import bpy
import math

# ──────────────────────────────────────────────────────────
# PARAMETERS
# ──────────────────────────────────────────────────────────
EXR_OUTPUT_PATH    = "//render/compositor_passes"   # relative to .blend
COLOUR_LIFT        = (0.00, 0.00, 0.01, 1.0)        # CDL lift  — blue in shadows
COLOUR_GAMMA       = (1.00, 0.98, 0.95, 1.0)        # CDL gamma — warm mids
COLOUR_GAIN        = (1.08, 1.04, 0.98, 1.0)        # CDL gain  — warm highlights
GLARE_THRESHOLD    = 0.85                            # pixel luma to trigger glow
GLARE_MIX          = 0.04                            # additive glow weight (0–1)
LENS_DISTORTION    = 0.012                           # barrel coefficient (+ = barrel)
LENS_DISPERSION    = 0.008                           # chromatic aberration
RESOLUTION_X       = 1920
RESOLUTION_Y       = 1080
RENDER_ENGINE      = 'BLENDER_EEVEE_NEXT'
USE_GPU_COMPOSITOR = True

# ──────────────────────────────────────────────────────────
# 1. SCENE + VIEW LAYER — enable render passes
# ──────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine             = RENDER_ENGINE
scene.render.resolution_x       = RESOLUTION_X
scene.render.resolution_y       = RESOLUTION_Y
scene.render.use_file_extension = True

if USE_GPU_COMPOSITOR:
    # GPU backend: evaluates the compositor tree entirely on the GPU.
    # Much faster for Glare, Denoise, and LensDist on large resolutions.
    scene.render.compositor_device    = 'GPU'
    scene.render.compositor_precision = 'AUTO'  # full float32 on GPU path

vl = scene.view_layers[0]
vl.use_pass_diffuse_direct   = True
vl.use_pass_diffuse_indirect = True
vl.use_pass_glossy_direct    = True
vl.use_pass_ao               = True
vl.use_pass_z                = True
vl.use_pass_normal           = True
# Denoising data: exposes Denoising Normal + Denoising Albedo on RenderLayers node.
# Without this, OIDN only uses the image, blurring edge detail.
vl.use_denoising_data = True

# ──────────────────────────────────────────────────────────
# 2. COMPOSITOR TREE — clear defaults, build custom graph
# ──────────────────────────────────────────────────────────
scene.use_nodes = True           # creates scene.node_tree as CompositorNodeTree
tree = scene.node_tree
tree.nodes.clear()               # remove auto-populated RenderLayers + Composite
tree.links.clear()

def N(bl_idname):
    return tree.nodes.new(bl_idname)

def L(src_socket, dst_socket):
    tree.links.new(src_socket, dst_socket)

# ──────────────────────────────────────────────────────────
# 3. CREATE NODES
# ──────────────────────────────────────────────────────────
rl = N("CompositorNodeRLayers")
rl.location = (-700, 400)
rl.layer = vl.name

denoise = N("CompositorNodeDenoise")
denoise.location = (-300, 400)
denoise.use_hdr  = True          # preserve values >1.0 — needed for emission glow
# filter_type = 'IMAGE' (default) — the general-purpose filter for beauty passes

cb = N("CompositorNodeColorBalance")
cb.location          = (100, 400)
cb.correction_method = 'LIFT_GAMMA_GAIN'
# LIFT_GAMMA_GAIN applies a per-channel multiplicative grade:
#   lift  shifts shadow luminance (add)
#   gamma bends the midtone response curve (power)
#   gain  scales highlight luminance (multiply)
cb.lift  = COLOUR_LIFT
cb.gamma = COLOUR_GAMMA
cb.gain  = COLOUR_GAIN

glare = N("CompositorNodeGlare")
glare.location   = (400, 400)
glare.glare_type = 'FOG_GLOW'   # additive diffusion — good for EEVEE emission bloom
glare.threshold  = GLARE_THRESHOLD
glare.mix        = GLARE_MIX
glare.quality    = 'MEDIUM'     # LOW = half-res fast; HIGH = full-res slow
glare.size       = 6            # 2**size pixel kernel radius (6 = 64 px)

lensdist = N("CompositorNodeLensDist")
lensdist.location          = (700, 400)
lensdist.use_projector     = False  # False = radial distortion; True = anamorphic lens
lensdist.use_jitter        = False  # smooth distortion map; jitter = faster but noisy
# Distortion socket controls the barrel/pincushion coefficient.
# Dispersion controls chromatic aberration — R and B channels shift in/outward.
lensdist.inputs['Distortion'].default_value = LENS_DISTORTION
lensdist.inputs['Dispersion'].default_value = LENS_DISPERSION

composite = N("CompositorNodeComposite")
composite.location = (1100, 400)

viewer = N("CompositorNodeViewer")
viewer.location = (1100, 200)

# File Output — multilayer EXR for offline lightmap bake archive
fileout = N("CompositorNodeOutputFile")
fileout.location                 = (100, 100)
fileout.base_path                = EXR_OUTPUT_PATH
fileout.format.file_format       = 'OPEN_EXR_MULTILAYER'
fileout.format.exr_codec         = 'ZIP'    # lossless deflate — good balance vs ZIPS/NONE
fileout.format.color_depth       = '32'     # full float32; '16' for half-float EXR
fileout.format.color_mode        = 'RGBA'

# Remove auto-created slot (occupies index 0 and would absorb the first link)
while fileout.layer_slots:
    fileout.layer_slots.remove(fileout.layer_slots[0])

EXR_SLOTS = [
    "Image",
    "Denoising Normal",
    "Denoising Albedo",
    "Diffuse Direct",
    "Diffuse Indirect",
    "Glossy Direct",
    "AO",
    "Depth",
    "Normal",
]
for name in EXR_SLOTS:
    fileout.layer_slots.new(name)

# ──────────────────────────────────────────────────────────
# 4. WIRE THE GRAPH
# ──────────────────────────────────────────────────────────
# Main beauty chain
L(rl.outputs['Image'],            denoise.inputs['Image'])
L(rl.outputs['Denoising Normal'], denoise.inputs['Normal'])
L(rl.outputs['Denoising Albedo'], denoise.inputs['Albedo'])
L(denoise.outputs['Image'],       cb.inputs['Image'])
L(cb.outputs['Image'],            glare.inputs['Image'])
L(glare.outputs['Image'],         lensdist.inputs['Image'])
L(lensdist.outputs['Image'],      composite.inputs['Image'])
L(lensdist.outputs['Image'],      viewer.inputs['Image'])

# Render passes → File Output EXR slots (integer index required)
slot_names = [s.name for s in fileout.layer_slots]
for rl_name, slot_name in [
    ('Image',            'Image'),
    ('Denoising Normal', 'Denoising Normal'),
    ('Denoising Albedo', 'Denoising Albedo'),
    ('Diffuse Direct',   'Diffuse Direct'),
    ('Diffuse Indirect', 'Diffuse Indirect'),
    ('Glossy Direct',    'Glossy Direct'),
    ('AO',               'AO'),
    ('Depth',            'Depth'),
    ('Normal',           'Normal'),
]:
    if rl_name in rl.outputs and slot_name in slot_names:
        L(rl.outputs[rl_name], fileout.inputs[slot_names.index(slot_name)])

# ──────────────────────────────────────────────────────────
# 5. SUBJECT SCENE — sphere with emission to exercise the graph
# ──────────────────────────────────────────────────────────
for name in ("CompositorSubject", "Comp_Key", "Comp_Fill", "Comp_Rim", "CompositorCam"):
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 0), segments=64, ring_count=32)
subject = bpy.context.active_object
subject.name = "CompositorSubject"

mat = bpy.data.materials.new("CompositorSubjectMat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value       = (0.80, 0.75, 0.70, 1.0)
    bsdf.inputs['Roughness'].default_value        = 0.30
    bsdf.inputs['Metallic'].default_value         = 0.10
    bsdf.inputs['Emission Color'].default_value   = (0.95, 0.85, 0.60, 1.0)
    bsdf.inputs['Emission Strength'].default_value = 1.8  # drives Glare FOG_GLOW
subject.data.materials.append(mat)
subject["holoflow:facet"] = False

for name, ltype, loc, energy in [
    ("Comp_Key",  "AREA", ( 4.0, -3.0,  5.0), 800),
    ("Comp_Fill", "AREA", (-4.0, -2.0,  3.0), 300),
    ("Comp_Rim",  "SPOT", ( 0.0,  5.0,  3.0), 600),
]:
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    if ltype == 'AREA':
        ld.size = 1.2
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc

cam_data = bpy.data.cameras.new("CompositorCam")
cam_data.lens = 85.0
cam_obj = bpy.data.objects.new("CompositorCam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location       = (0.0, -4.5, 1.5)
cam_obj.rotation_euler = (math.radians(72), 0.0, 0.0)
scene.camera = cam_obj

print("Compositor pipeline built.")
print("Open the Compositor workspace — the full graph is wired and ready.")
print(f"Render (F12) to write multilayer EXR to: {EXR_OUTPUT_PATH}_####.exr")
