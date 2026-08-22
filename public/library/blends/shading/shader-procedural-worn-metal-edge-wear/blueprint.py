"""
Procedural Worn Metal — Bevel-Shader Edge Wear, Noise Bump & Roughness Gradient
================================================================================
Blender 5.1  ·  Category: shading  ·  Engine: EEVEE Next

The Bevel node is an EEVEE-exclusive screen-space operator that reads the
depth buffer to estimate surface curvature at every rendered pixel.  At a
sharp edge the face normals on either side diverge; Bevel detects this
divergence and returns a blended normal that represents a rounded transition
even when the geometry has no bevel modifier.  By comparing this perturbed
normal against the unmodified surface normal via a DOT PRODUCT, we get a
per-pixel curvature scalar:

    dot(Bevel.Normal, Geometry.Normal) → 1.0 on flat faces
                                       → ~0 at right-angle edges

Inverting that scalar (1 − dot) gives the edge-wear mask: 0 on flat metal,
rising to 1 at the stress points where real scratches accumulate.

Node graph summary
  [Bevel]─[Geometry]─[DOT]─[1-x]─[CR_Edge]──┐
                                               ├─[MAX]─► wear_mask
  [Noise]──────────────────────[CR_Noise]─────┘
      │                                        │
      └─[Bump]──────────────────────────────► [Worn PBSDF].Normal
                                              │
  [Clean PBSDF]──[MixShader(wear_mask)]──────► Output
  [Worn PBSDF] ──┘

Sources
  Blender Manual — Bevel Node (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/render/shader_nodes/input/bevel.html

  njanakiev/blender-scripting (MIT, Nicolas Janakiev)
  https://github.com/njanakiev/blender-scripting
"""

import bpy
from pathlib import Path

# ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
BLEND_OUT = _HERE / "worn_metal.blend"
GLB_OUT   = (
    _HERE.parents[2]
    / "glbs" / "shading" / "shader-procedural-worn-metal-edge-wear"
    / "worn_metal.glb"
)

# ── PARAMETERS — edit to retarget ────────────────────────────────────────────
# Bevel node: edge-wear detector (EEVEE only)
BEVEL_RADIUS  = 0.06   # world-space curvature detection radius (m)
BEVEL_SAMPLES = 16     # quality; 4 = fast preview, 16 = production

# Clean polished steel
CLEAN_COLOUR    = (0.72, 0.72, 0.74, 1.0)
CLEAN_METALLIC  = 1.0
CLEAN_ROUGHNESS = 0.06   # tight specular lobe → mirror-like

# Worn / oxidised metal
WORN_COLOUR     = (0.21, 0.18, 0.15, 1.0)  # warm dark — rust undertone
WORN_METALLIC   = 0.75                      # oxide layer slightly less metallic
WORN_ROUGHNESS  = 0.72                      # scattered specular → scratched read

# Noise texture — random wear patch variation
NOISE_SCALE      = 12.0
NOISE_DETAIL     = 6.0
NOISE_ROUGHNESS  = 0.55   # fractal roughness of the noise itself
NOISE_DISTORTION = 0.3

# Micro-scratch bump
BUMP_STRENGTH = 0.38
BUMP_DISTANCE = 0.003   # 3 mm physical scale on a ~1.5 m head

# Mesh subdivision applied before exporting
MONKEY_SUBD = 2

# ── SCENE ─────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "worn_metal_scene"
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# ── MESH — Suzanne with Subdivision ──────────────────────────────────────────
# Suzanne's mix of tight internal creases (eye sockets, nostrils) and smooth
# curved faces makes edge-wear variation immediately legible.
bpy.ops.mesh.primitive_monkey_add(size=1.5, location=(0, 0, 0))
monkey = bpy.context.active_object
monkey.name = "worn_metal"

subd = monkey.modifiers.new("Subsurf", 'SUBSURF')
subd.levels           = MONKEY_SUBD
subd.render_levels    = MONKEY_SUBD
subd.subdivision_type = 'CATMULL_CLARK'

# ── MATERIAL ─────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("WornMetal")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# ── TEXTURE COORDINATE ────────────────────────────────────────────────────────
n_tc = nodes.new('ShaderNodeTexCoord')
n_tc.location = (-1100, 0)
# Object coords: scale-invariant regardless of mesh size; survives apply-transforms.
# UV coords would bake the procedural result to specific islands — Object is preferable
# for a purely procedural shader intended to transfer across meshes.

# ── BEVEL NODE ────────────────────────────────────────────────────────────────
# EEVEE-only: reads the G-buffer depth at each pixel to estimate curvature.
# Output 'Normal' converges toward the adjacent face's normal at sharp edges.
n_bevel = nodes.new('ShaderNodeBevel')
n_bevel.inputs['Samples'].default_value = BEVEL_SAMPLES
n_bevel.inputs['Radius'].default_value  = BEVEL_RADIUS
n_bevel.location = (-860, 350)

# Unperturbed surface normal for comparison
n_geom = nodes.new('ShaderNodeNewGeometry')
n_geom.location = (-860, 160)

# DOT PRODUCT: cos(angle between Bevel normal and surface normal)
# 1.0 = flat face (identical normals), ~0 = 90° edge.
n_dot = nodes.new('ShaderNodeVectorMath')
n_dot.operation = 'DOT_PRODUCT'
n_dot.location  = (-620, 280)
links.new(n_bevel.outputs['Normal'], n_dot.inputs[0])
links.new(n_geom.outputs['Normal'],  n_dot.inputs[1])

# Invert: 1 - dot → 0 on flat, rising to 1 at edge
n_inv = nodes.new('ShaderNodeMath')
n_inv.operation = 'SUBTRACT'
n_inv.inputs[0].default_value = 1.0
n_inv.location  = (-420, 280)
links.new(n_dot.outputs['Value'], n_inv.inputs[1])

# Shape the edge signal: set the threshold where wear begins and saturates.
# LINEAR interpolation gives a smooth graduation — read as gradual oxidation.
n_cr_edge = nodes.new('ShaderNodeValToRGB')
n_cr_edge.color_ramp.interpolation = 'LINEAR'
n_cr_edge.color_ramp.elements[0].position = 0.28
n_cr_edge.color_ramp.elements[0].color    = (0, 0, 0, 1)
n_cr_edge.color_ramp.elements[1].position = 0.65
n_cr_edge.color_ramp.elements[1].color    = (1, 1, 1, 1)
n_cr_edge.location = (-200, 280)
links.new(n_inv.outputs['Value'], n_cr_edge.inputs['Fac'])

# ── NOISE TEXTURE — random wear patches ──────────────────────────────────────
n_noise = nodes.new('ShaderNodeTexNoise')
n_noise.noise_dimensions                   = '3D'
n_noise.inputs['Scale'].default_value      = NOISE_SCALE
n_noise.inputs['Detail'].default_value     = NOISE_DETAIL
n_noise.inputs['Roughness'].default_value  = NOISE_ROUGHNESS
n_noise.inputs['Distortion'].default_value = NOISE_DISTORTION
n_noise.location = (-860, -120)
links.new(n_tc.outputs['Object'], n_noise.inputs['Vector'])

# B_SPLINE ramp: soft transitions on noise patches look like gradual oxidation stains.
# For hard anodised aluminium, use CONSTANT for sharper wear-zone boundaries.
n_cr_noise = nodes.new('ShaderNodeValToRGB')
n_cr_noise.color_ramp.interpolation = 'B_SPLINE'
n_cr_noise.color_ramp.elements[0].position = 0.50
n_cr_noise.color_ramp.elements[0].color    = (0, 0, 0, 1)
n_cr_noise.color_ramp.elements[1].position = 0.82
n_cr_noise.color_ramp.elements[1].color    = (1, 1, 1, 1)
n_cr_noise.location = (-580, -120)
links.new(n_noise.outputs['Fac'], n_cr_noise.inputs['Fac'])

# ── COMBINE WEAR SIGNALS ─────────────────────────────────────────────────────
# MAX: either edge curvature OR a noise patch alone drives full wear.
# An ADD-then-clamp would let the two signals compound, over-wearing mid-face
# zones that should stay clean.  MAX preserves the independent nature of each channel.
n_max = nodes.new('ShaderNodeMath')
n_max.operation = 'MAXIMUM'
n_max.location  = (20, 100)
links.new(n_cr_edge.outputs['Color'],  n_max.inputs[0])
links.new(n_cr_noise.outputs['Color'], n_max.inputs[1])
# ShaderNodeMath accepts a Color socket by reading its R channel (greyscale ramp → safe).

# ── MICRO-SCRATCH BUMP ────────────────────────────────────────────────────────
# Same noise drives the Bump height.  The bump is only perceived in worn zones
# because the worn PBSDF that receives this Normal is linearly blended in by
# the wear mask.  On clean zones the clean PBSDF uses its own unperturbed normal.
# Keep BUMP_STRENGTH < 0.5: strong bump reads as rock, not scratched metal.
n_bump = nodes.new('ShaderNodeBump')
n_bump.inputs['Strength'].default_value = BUMP_STRENGTH
n_bump.inputs['Distance'].default_value = BUMP_DISTANCE
n_bump.location = (-200, -250)
links.new(n_noise.outputs['Fac'], n_bump.inputs['Height'])

# ── CLEAN METAL PBSDF ────────────────────────────────────────────────────────
n_clean = nodes.new('ShaderNodeBsdfPrincipled')
n_clean.inputs['Base Color'].default_value = CLEAN_COLOUR
n_clean.inputs['Metallic'].default_value   = CLEAN_METALLIC
n_clean.inputs['Roughness'].default_value  = CLEAN_ROUGHNESS
# IOR 2.5 approximates a non-physical but visually correct steel Fresnel
n_clean.inputs['IOR'].default_value        = 2.5
n_clean.location = (240, 380)

# ── WORN METAL PBSDF ─────────────────────────────────────────────────────────
n_worn = nodes.new('ShaderNodeBsdfPrincipled')
n_worn.inputs['Base Color'].default_value = WORN_COLOUR
n_worn.inputs['Metallic'].default_value   = WORN_METALLIC
n_worn.inputs['Roughness'].default_value  = WORN_ROUGHNESS
n_worn.location = (240, 60)
# Scratch-perturbed normal — visible where the wear mask blends this PBSDF in
links.new(n_bump.outputs['Normal'], n_worn.inputs['Normal'])

# ── MIX SHADER ────────────────────────────────────────────────────────────────
n_mix = nodes.new('ShaderNodeMixShader')
n_mix.location = (560, 240)
links.new(n_max.outputs['Value'],  n_mix.inputs['Fac'])
links.new(n_clean.outputs['BSDF'], n_mix.inputs[1])
links.new(n_worn.outputs['BSDF'],  n_mix.inputs[2])

# ── OUTPUT ────────────────────────────────────────────────────────────────────
n_out = nodes.new('ShaderNodeOutputMaterial')
n_out.location = (760, 240)
links.new(n_mix.outputs['Shader'], n_out.inputs['Surface'])

monkey.data.materials.append(mat)

# ── LIGHTING — two-light studio ──────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(3.0, -2.0, 4.0))
key = bpy.context.active_object
key.data.energy = 900
key.data.size   = 2.0

bpy.ops.object.light_add(type='AREA', location=(-2.5, 3.0, 2.0))
fill = bpy.context.active_object
fill.data.energy = 250
fill.data.size   = 3.5

# ── CAMERA ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -3.6, 0.55))
cam = bpy.context.active_object
cam.rotation_euler = (1.37, 0.0, 0.0)
scene.camera = cam

# ── SAVE + EXPORT ─────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))

GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
monkey.select_set(True)
bpy.context.view_layer.objects.active = monkey

# NOTE: The Bevel node is EEVEE screen-space only.
# The exported GLB carries a single flat metallic roughness value; the
# procedural wear variation is NOT in the file.
# For WebXR delivery with full wear detail, bake the Roughness pass first:
#   bpy.context.scene.render.engine = 'CYCLES'
#   bpy.ops.object.bake(type='ROUGHNESS', ...)
# then plug the resulting texture into the PBSDF Roughness socket before export.
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_image_format='WEBP',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

print(f"✓ Saved  {BLEND_OUT}")
print(f"✓ Saved  {GLB_OUT}")
print("  Bevel edge-wear is EEVEE viewport-only — bake Roughness for WebXR.")
