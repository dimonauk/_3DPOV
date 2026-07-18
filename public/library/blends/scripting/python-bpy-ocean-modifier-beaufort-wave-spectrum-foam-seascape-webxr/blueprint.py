"""
Blender 5.1 | bpy.types.OceanModifier
───────────────────────────────────────
The OceanModifier implements an FFT-based wave simulation derived from
Tessendorf's statistical ocean model (SIGGRAPH 2001).  It draws wave
amplitudes from a power spectrum — JONSWAP for fetch-limited open seas,
PHILLIPS for deep omnidirectional ocean — and applies an inverse FFT each
frame to produce a time-varying heightfield.  An optional Gerstner
(choppiness) term horizontally displaces vertices, causing wave peaks to
steepen without adding geometry.

Studio use case: a stylised seascape backdrop for a WebXR scene.
GENERATE mode builds the subdivided ocean grid from a bare plane; we drive
mod.time with a frame/fps expression so the ocean animates freely; then
bake a static GLB snapshot at a chosen frame for lightweight runtime use.

All tunable parameters are named constants at the top.
"""

import bpy
import math
from mathutils import Vector

# ── geometry ───────────────────────────────────────────────────────────────
MESH_NAME        = "hf_ocean_seascape"
MOD_NAME         = "Ocean"
OCEAN_SIZE       = 8.0       # physical patch side length in metres
RESOLUTION       = 7         # subdivision level (1–15); 7 gives a 128-cell grid
RENDER_RES       = 9         # render-time resolution (256-cell grid)
REPEAT_X         = 2         # repeats along +X (apparent infinite ocean)
REPEAT_Y         = 2         # repeats along +Y

# ── wave physics ───────────────────────────────────────────────────────────
# Beaufort 5 — fresh breeze, 8–11 m wave crests, whitecaps universal.
WIND_VELOCITY    = 8.0       # m/s
WAVE_DIRECTION   = math.radians(20.0)  # primary direction (radians from +X)
WAVE_ALIGNMENT   = 0.75      # 0=omnidirectional, 1=fully directional
WAVE_SCALE       = 1.4       # overall wave height multiplier
WAVE_SCALE_MIN   = 0.0       # minimum wavelength filter (0 = no filter)
CHOPPINESS       = 0.85      # Gerstner horizontal displacement (0–4)
DEPTH            = 150.0     # water depth in metres
RANDOM_SEED      = 7

# ── spectrum ───────────────────────────────────────────────────────────────
# JONSWAP models fetch-limited seas (wind direction matters, peaks sharpen).
# PHILLIPS models deep open ocean (omnidirectional, smoother energy spread).
# UNIFIED_DIRECTIONAL spreads energy across wave direction uniformly.
SPECTRUM         = 'JONSWAP'

# ── foam ───────────────────────────────────────────────────────────────────
USE_FOAM         = True
FOAM_LAYER       = "foam"    # named colour attribute used by the material
FOAM_COVERAGE    = 0.15      # fraction of surface area showing foam (0–1)

# ── export ─────────────────────────────────────────────────────────────────
EXPORT_FRAME     = 48        # frame to snapshot as static GLB (24 fps → 2 s)
EXPORT_PATH      = "//hf_ocean_seascape.glb"

# ── colours ────────────────────────────────────────────────────────────────
OCEAN_COLOUR     = (0.02, 0.20, 0.30, 1.0)   # deep teal
FOAM_COLOUR      = (0.85, 0.90, 0.93, 1.0)   # off-white whitecaps
ROUGHNESS        = 0.06
IOR_WATER        = 1.333


# ─────────────────────────────────────────────────────────────────────────
# 1.  Scene reset
# ─────────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in list(bpy.data.collections):
    bpy.data.collections.remove(col)


# ─────────────────────────────────────────────────────────────────────────
# 2.  Base plane — geometry_mode=GENERATE ignores this mesh's topology;
#     the modifier regenerates it entirely.  A single-polygon plane suffices.
# ─────────────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
ocean_obj = bpy.context.active_object
ocean_obj.name = MESH_NAME
ocean_obj.data.name = MESH_NAME


# ─────────────────────────────────────────────────────────────────────────
# 3.  OceanModifier
# ─────────────────────────────────────────────────────────────────────────
mod = ocean_obj.modifiers.new(name=MOD_NAME, type='OCEAN')

# Geometry
mod.geometry_mode  = 'GENERATE'   # builds ocean grid; DISPLACE would move vertices
mod.size           = OCEAN_SIZE
mod.resolution     = RESOLUTION
mod.render_resolution = RENDER_RES
mod.repeat_x       = REPEAT_X
mod.repeat_y       = REPEAT_Y

# Wave physics
mod.wind_velocity  = WIND_VELOCITY
mod.wave_direction = WAVE_DIRECTION
mod.wave_alignment = WAVE_ALIGNMENT
mod.wave_scale     = WAVE_SCALE
mod.wave_scale_min = WAVE_SCALE_MIN
mod.choppiness     = CHOPPINESS
mod.depth          = DEPTH
mod.random_seed    = RANDOM_SEED
mod.spectrum       = SPECTRUM

# Foam — the modifier writes a per-vertex colour attribute whose red
# channel indicates wave crest steepness; read in shader as foam mask.
mod.use_foam       = USE_FOAM
mod.foam_layer_name = FOAM_LAYER
mod.foam_coverage  = FOAM_COVERAGE

# Normals: True = per-vertex normals from FFT gradients (better shading).
mod.use_normals    = True

# Initial time: driver wired in section 5 replaces this.
mod.time           = 0.0


# ─────────────────────────────────────────────────────────────────────────
# 4.  Material — Principled BSDF with foam colour blend
#     Foam attribute is accessed via Named Attribute → factor into Mix.
# ─────────────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("hf_ocean_mat")
mat.use_nodes = True
nt    = mat.node_tree
nodes = nt.nodes
links = nt.links
nodes.clear()

out     = nodes.new('ShaderNodeOutputMaterial')
bsdf    = nodes.new('ShaderNodeBsdfPrincipled')
mix     = nodes.new('ShaderNodeMix')           # Blender 4+/5.x Mix node
attr    = nodes.new('ShaderNodeAttribute')     # reads the foam colour attribute

mix.data_type = 'RGBA'
mix.blend_type = 'MIX'

attr.attribute_name = FOAM_LAYER
attr.attribute_type = 'GEOMETRY'

bsdf.inputs['Roughness'].default_value = ROUGHNESS
bsdf.inputs['IOR'].default_value       = IOR_WATER

# No-foam base colour via mix input 0 (Factor=0 shows Color A = ocean)
mix.inputs[6].default_value  = OCEAN_COLOUR   # Color A (Blender 5.x: socket 6)
mix.inputs[7].default_value  = FOAM_COLOUR    # Color B (socket 7)

links.new(attr.outputs['Fac'],  mix.inputs['Factor'])
links.new(mix.outputs[2],       bsdf.inputs['Base Color'])  # Result → Base
links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

# Lay nodes out left → right
attr.location = (-500, 0);  mix.location = (-250, 0)
bsdf.location = (50, 0);    out.location  = (350, 0)

ocean_obj.data.materials.append(mat)


# ─────────────────────────────────────────────────────────────────────────
# 5.  Driver: mod.time ← frame / 24.0
#     This gives continuous animation without a baked cache.  The scene FPS
#     is 24; dividing by it maps frame numbers to seconds of ocean time.
# ─────────────────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 120   # 5-second preview at 24 fps
bpy.context.scene.render.fps  = 24

driver = mod.driver_add("time").driver
driver.type       = 'SCRIPTED'
driver.expression = "frame / 24.0"
# No variables needed — built-in 'frame' token available in all expressions.


# ─────────────────────────────────────────────────────────────────────────
# 6.  Camera — wide overhead shot that shows repeating ocean tiles
# ─────────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 28.0
cam_obj  = bpy.data.objects.new("Camera", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = Vector((0.0, -14.0, 10.0))
cam_obj.rotation_euler = (math.radians(52), 0.0, 0.0)


# ─────────────────────────────────────────────────────────────────────────
# 7.  Sun light
# ─────────────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy = 4.0
sun_data.angle  = math.radians(2.0)   # near-parallel rays for crisp specular
sun_obj  = bpy.data.objects.new("Sun", sun_data)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(55), math.radians(0), math.radians(40))


# ─────────────────────────────────────────────────────────────────────────
# 8.  GLB snapshot — evaluate modifier at EXPORT_FRAME, write static mesh
#     export_apply=True collapses modifiers via depsgraph evaluation;
#     the .blend modifier stack is left intact.
# ─────────────────────────────────────────────────────────────────────────
bpy.context.scene.frame_set(EXPORT_FRAME)

bpy.ops.object.select_all(action='DESELECT')
ocean_obj.select_set(True)
bpy.context.view_layer.objects.active = ocean_obj

bpy.ops.export_scene.gltf(
    filepath                              = bpy.path.abspath(EXPORT_PATH),
    use_selection                         = True,
    export_format                         = 'GLB',
    export_yup                            = True,
    export_apply                          = True,
    export_draco_mesh_compression_enable  = True,
    export_draco_mesh_compression_level   = 6,
    export_image_format                   = 'WEBP',
)

print(f"[hf] ocean snapshot exported → {EXPORT_PATH}  (frame {EXPORT_FRAME})")
print(f"[hf] live ocean remains animated via driver  (frame / 24.0)")
