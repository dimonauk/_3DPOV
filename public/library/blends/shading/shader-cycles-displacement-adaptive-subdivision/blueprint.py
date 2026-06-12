"""
Cycles Adaptive Subdivision + True Displacement — Blueprint
Blender 5.1  |  Cycles Experimental  |  CC-0

Technique
─────────
A low-poly UV sphere gains a Subdivision Surface modifier (Adaptive mode) and
a material whose Material Output Displacement socket is driven by a Noise
Texture → ColorRamp → Displacement node chain.  Cycles tessellates
micropolygons at render time; the dicing rate (pixels per edge) governs
density — no permanent geometry subdivision is needed.

Three displacement modes
────────────────────────
  BUMP          — shading-normal perturbation only.  No geometry change.
                  Silhouette stays spherically smooth.
  DISPLACEMENT  — actual vertex displacement.  Correct silhouettes.
                  Requires Cycles + EXPERIMENTAL feature set AND a
                  Subdivision Surface modifier with use_adaptive_subdivision.
  BOTH          — same input drives bump micro-detail AND geometry mid-level.
                  Good when one noise map should serve two scales.

Outside sources
───────────────
  Blender Manual — Displacement Node
    https://docs.blender.org/manual/en/latest/render/shader_nodes/vector/displacement.html
    Licence: CC-BY-SA 4.0  |  © Blender Foundation

  Blender Manual — Adaptive Subdivision
    https://docs.blender.org/manual/en/latest/render/cycles/object_settings/adaptive_subdiv.html
    Licence: CC-BY-SA 4.0  |  © Blender Foundation
"""

import bpy
import math
import os

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
DISPLACEMENT_SCALE  = 0.12   # world-space height of tallest displaced peak (m)
DISPLACEMENT_MID    = 0.0    # 0 = outward only; 0.5 = balanced ±; 1 = inward
NOISE_SCALE         = 5.0    # pattern frequency; higher = finer grain
NOISE_DETAIL        = 10.0   # fractal octaves (0–15); adds micro-cracks
NOISE_ROUGHNESS     = 0.65   # Hurst exponent proxy; 0=smooth, 1=jagged
NOISE_DISTORTION    = 0.15   # domain-warp amplitude; breaks up regularity
DICING_RATE         = 1.0    # render: max micropolygon edge in pixels (finer)
PREVIEW_RATE        = 8.0    # viewport: coarser; higher = faster feedback
BASE_COLOUR         = (0.38, 0.32, 0.26, 1.0)   # warm sandstone
ROUGHNESS_VAL       = 0.88   # matte stone
SPHERE_SEGMENTS     = 32     # low-poly edit mesh; Adaptive handles rest
SPHERE_RINGS        = 16
OUTPUT_DIR          = "//output/"

# ─── SCENE SETUP ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "displacement_demo"

world = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Strength"].default_value = 0.6

# ─── CYCLES EXPERIMENTAL ─────────────────────────────────────────────────────
# Adaptive Subdivision lives behind the EXPERIMENTAL feature set.  Without it
# use_adaptive_subdivision on the modifier silently has no effect — the mesh
# subdivides statically instead.
scene.render.engine = 'CYCLES'
scene.cycles.feature_set = 'EXPERIMENTAL'

scene.cycles.samples            = 256
scene.cycles.use_denoising      = True
scene.cycles.denoiser           = 'OPENIMAGEDENOISE'
scene.cycles.dicing_rate        = DICING_RATE
scene.cycles.preview_dicing_rate = PREVIEW_RATE
# max_subdivisions caps micropolygon density per face as a safety valve;
# default 12 is fine for most meshes but set explicitly for reproducibility.
scene.cycles.max_subdivisions   = 12

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUTPUT_DIR + "stone_displaced.png"

# ─── MESH: LOW-POLY SPHERE ────────────────────────────────────────────────────
# The edit mesh stays coarse — Adaptive Subdivision tessellates it at render
# time.  Working with SPHERE_SEGMENTS=32 × RINGS=16 ≈ 512 quads means the
# .blend stays lightweight and modifier recalculation is fast in the viewport.
bpy.ops.mesh.primitive_uv_sphere_add(
    segments=SPHERE_SEGMENTS,
    ring_count=SPHERE_RINGS,
    radius=1.0,
    location=(0, 0, 0),
)
sphere = bpy.context.active_object
sphere.name = "stone_sphere"

# UV unwrap (Smart Project) — required if you later bake displaced normals
# back to a texture.  The UV is also used by the Noise Texture via UV input.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15)   # ~66° island break angle
bpy.ops.object.mode_set(mode='OBJECT')

# ─── SUBDIVISION MODIFIER ─────────────────────────────────────────────────────
# use_adaptive_subdivision = True hands tessellation control to Cycles.
# When the camera is close the sphere gets more micropolygons; when distant,
# fewer — dicing_rate (pixels/edge) is the budget.
# A levels_viewport=1 preview subdivision provides a rough visual of how the
# displacement will look in solid/material-preview modes.
subsurf = sphere.modifiers.new("AdaptiveSubdiv", 'SUBSURF')
subsurf.subdivision_type       = 'CATMULL_CLARK'
subsurf.use_adaptive_subdivision = True   # only active under EXPERIMENTAL
subsurf.levels                 = 1        # viewport subdivision level (not render)
subsurf.render_levels          = 6        # fallback when adaptive is disabled

# ─── MATERIAL ─────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("displaced_stone")
mat.use_nodes = True
sphere.data.materials.append(mat)

# displacement_method must be DISPLACEMENT (not BUMP) for geometry movement.
# BUMP + DISPLACEMENT = BOTH mode (additive).
mat.cycles.displacement_method = 'DISPLACEMENT'

nt    = mat.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

# Output
output = nodes.new('ShaderNodeOutputMaterial')
output.location = (800, 0)

# Principled BSDF — stone surface
pbsdf = nodes.new('ShaderNodeBsdfPrincipled')
pbsdf.location = (400, 200)
pbsdf.inputs['Base Color'].default_value = BASE_COLOUR
pbsdf.inputs['Roughness'].default_value  = ROUGHNESS_VAL
pbsdf.inputs['Metallic'].default_value   = 0.0
links.new(pbsdf.outputs['BSDF'], output.inputs['Surface'])

# Texture Coordinate — Using UV keeps displacement consistent with future
# normal bakes (Generated coords shift when the mesh deforms).
tex_coord = nodes.new('ShaderNodeTexCoord')
tex_coord.location = (-600, -100)

# Noise Texture — fractal Brownian motion approximating stone surface variation
noise = nodes.new('ShaderNodeTexNoise')
noise.location = (-380, -100)
noise.inputs['Scale'].default_value       = NOISE_SCALE
noise.inputs['Detail'].default_value      = NOISE_DETAIL
noise.inputs['Roughness'].default_value   = NOISE_ROUGHNESS
noise.inputs['Distortion'].default_value  = NOISE_DISTORTION
# Lacunarity 2.0 = each octave doubles spatial frequency (standard fBm)
noise.inputs['Lacunarity'].default_value  = 2.0
links.new(tex_coord.outputs['UV'], noise.inputs['Vector'])

# ColorRamp — sculpts the displacement profile.
# Moving element[0] above 0.0 clips the valleys flat: only peaks displace
# outward, which reads as eroded stone ridges rather than lumpy foam.
color_ramp = nodes.new('ShaderNodeValToRGB')
color_ramp.location = (-140, -100)
color_ramp.color_ramp.interpolation = 'EASE'
color_ramp.color_ramp.elements[0].position = 0.35   # cut bottom 35% flat
color_ramp.color_ramp.elements[1].position = 1.0
links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])

# Displacement node — converts scalar height to a displacement vector.
# Midlevel: the neutral height (0 = displace only outward from surface).
# Scale: peak height in metres when Midlevel=0.
# Space: OBJECT is camera-distance-independent; WORLD-space displacement
#        changes apparent height with object scale transforms.
disp = nodes.new('ShaderNodeDisplacement')
disp.location  = (400, -200)
disp.space     = 'OBJECT'
disp.inputs['Midlevel'].default_value = DISPLACEMENT_MID
disp.inputs['Scale'].default_value    = DISPLACEMENT_SCALE
links.new(color_ramp.outputs['Color'], disp.inputs['Height'])
links.new(disp.outputs['Displacement'], output.inputs['Displacement'])

# ─── LIGHTING ────────────────────────────────────────────────────────────────
# Grazing-angle key light emphasises surface relief.
bpy.ops.object.light_add(type='AREA', location=(2.5, -3.0, 2.8))
key = bpy.context.active_object
key.name = "key_light"
key.data.energy = 180
key.data.size   = 2.5
key.rotation_euler = (math.radians(50), 0, math.radians(35))

# Fill: softens harsh shadow on the rear hemisphere
bpy.ops.object.light_add(type='AREA', location=(-3.0, 2.0, 1.5))
fill = bpy.context.active_object
fill.name = "fill_light"
fill.data.energy = 45
fill.data.size   = 4.0

# ─── CAMERA ──────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(
    location=(0, -3.2, 0.4),
    rotation=(math.radians(84), 0, 0),
)
cam = bpy.context.active_object
cam.name = "render_cam"
scene.camera = cam

# ─── BAKE-READY COPY (low-poly target for normal baking) ─────────────────────
# Duplicate the sphere, remove the Subdivision modifier, and assign a plain
# material with an Image Texture node wired to the output (required by the
# bake engine to know where to write).  Run the bake separately after setting
# up the ray cage extrusion:
#
#   bpy.context.view_layer.objects.active = low_poly_copy
#   high_poly_sphere.select_set(True)
#   bpy.ops.object.bake(
#       type='NORMAL',
#       use_selected_to_active=True,
#       cage_extrusion=0.25,   # must exceed max displacement height
#   )
#
# The resulting 2 K normal map replaces the Displacement node entirely in the
# GLB/WebXR material, giving near-identical shading at zero geometry cost.
bpy.ops.object.select_all(action='DESELECT')
sphere.select_set(True)
bpy.context.view_layer.objects.active = sphere
bpy.ops.object.duplicate()
low_poly = bpy.context.active_object
low_poly.name = "stone_sphere_bake_target"
low_poly.location.x = 2.8   # offset for visibility

# Remove the subdivision modifier from the bake target — it receives the bake
# onto its original low-poly UV layout.
for mod in list(low_poly.modifiers):
    low_poly.modifiers.remove(mod)

bake_mat = bpy.data.materials.new("bake_target")
bake_mat.use_nodes = True
bake_nt = bake_mat.node_tree
bake_img_node = bake_nt.nodes.new('ShaderNodeTexImage')
bake_img = bpy.data.images.new("normal_bake_2k", width=2048, height=2048)
bake_img.colorspace_settings.name = 'Non-Color'
bake_img_node.image = bake_img
# Make the image node active (required by bake engine)
bake_nt.nodes.active = bake_img_node
low_poly.data.materials.clear()
low_poly.data.materials.append(bake_mat)

# ─── SAVE ─────────────────────────────────────────────────────────────────────
blend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stone_displaced.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"blueprint.py: saved {blend_path}")
print("blueprint.py: to render:  blender stone_displaced.blend --python -c 'import bpy; bpy.ops.render.render(write_still=True)'")
print("blueprint.py: to bake normals — select low-poly target, add high-poly to selection, run bake as shown above")
