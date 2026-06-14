"""
Physics — Mantaflow Gaseous Simulation: Smoke & Fire Torch Flame
Blender 5.1 · CC0 · Holoflow Studio

Technique: Mantaflow uses a PURELY EULERIAN (grid-only) approach for gas — no
FLIP particles.  Each timestep runs: velocity field advection via the MacCormack
scheme (second-order, low numerical dissipation), vorticity confinement (injects
rotational momentum to compensate the dissipation that does occur), pressure
projection (PCG solve enforcing ∇·u = 0 for incompressibility), then buoyancy
forcing (Boussinesq approximation: upward body force proportional to temperature
deviation from ambient).  Combustion adds a separate reaction-diffusion step:
fuel field decreases by burning_rate per timestep, releasing heat proportional
to the fuel consumed, which in turn generates smoke (flame_smoke ratio).

Compare with FLIP liquid (see dam-break tutorial): liquid is hybrid
Eulerian–Lagrangian, particles carry velocity to avoid numerical diffusion over
large displacements; gas lacks particles because smoke/fire moves slowly enough
that a grid-only scheme stays stable.  The Eulerian grid's weakness (numerical
viscosity → over-smooth vortices) is addressed directly by vorticity confinement
rather than by adding particles.

Outside sources:
  - Blender Manual: Fluid Domain Settings (CC-BY-SA 4.0, Blender Foundation)
    https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/gas.html
  - njanakiev/blender-scripting (MIT, Nicolas Janakiev)
    https://github.com/njanakiev/blender-scripting
"""

import bpy
import math
from mathutils import Vector, Euler

# ── Parameters ────────────────────────────────────────────────────────────────
DOMAIN_SIZE     = 1.4     # metres — cubic gas domain bounding box
RESOLUTION      = 80      # voxels along longest axis; ≈1.75 cm per voxel
FRAME_END       = 100     # 100 frames @ 24 fps = 4.17 s of flame
FUEL_AMOUNT     = 0.55    # fuel injected per step (controls flame height)
TEMPERATURE     = 1.0     # initial temperature of injected gas (0–5 Mantaflow scale)
VORTICITY       = 0.25    # vorticity confinement strength (0=laminar pillar, 2=chaotic)
BURNING_RATE    = 0.70    # speed of fuel→heat conversion per timestep
FLAME_SMOKE     = 0.85    # smoke density produced per unit fuel burned
TURB_STRENGTH   = 5.0     # turbulence force field strength (lateral flicker)
TURB_NOISE      = 2.0     # turbulence noise frequency (higher=faster flicker)

OUTPUT_BLEND    = "//flame_torch.blend"

# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = 24

# ── Gas domain ─────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cube_add(size=DOMAIN_SIZE)
domain_obj = bpy.context.active_object
domain_obj.name = "flame_domain"
domain_obj.display_type = 'WIRE'   # transparent so flame is visible inside

bpy.ops.object.modifier_add(type='FLUID')
domain_mod = domain_obj.modifiers["Fluid"]
domain_mod.fluid_type = 'DOMAIN'
ds = domain_mod.domain_settings

ds.domain_type    = 'GAS'          # CRITICAL: GAS not LIQUID — no FLIP particles
ds.resolution_max = RESOLUTION

# Adaptive domain: Mantaflow only allocates voxels inside the bounding box of
# active gas.  Without this, a 80³ grid is always full even when the flame
# occupies only 15% of the cube — 6.5× wasted memory and bake time.
ds.use_adaptive_domain = True
ds.adapt_threshold    = 0.01       # cell active when density field > 0.01
ds.adapt_margin       = 4          # add 4 buffer voxels around active region

# Vorticity confinement: the MacCormack advection scheme is second-order but still
# dissipates rotational energy.  Vorticity confinement computes the curl of the
# velocity field and injects a force anti-parallel to the local vorticity gradient.
# Value 0 → perfect pillar; 0.25 → realistic coiling; 1.0+ → violent turbulence.
ds.vorticity = VORTICITY

# Turbulent noise detail: adds sub-grid frequency content at the Kolmogorov scale,
# which is below the grid resolution.  Without it, smoke looks plasticky-smooth.
ds.use_noise     = True
ds.noise_scale   = 2               # relative octave scale vs base grid
ds.noise_strength = 1.0

# Combustion parameters
ds.burning_rate      = BURNING_RATE   # fuel consumption rate per substep
ds.flame_smoke       = FLAME_SMOKE    # kg smoke per kg fuel burned
ds.flame_smoke_colour = (0.05, 0.04, 0.04)  # dark sooty grey
ds.flame_vorticity   = 0.4            # extra vorticity injected at the fire front

# Cache: MODULAR lets you bake data and noise independently
ds.cache_directory  = "//cache/flame_torch/"
ds.cache_type       = 'MODULAR'

# ── Torch handle (visual prop, no collision needed for thin rod) ───────────────
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.50, location=(0, 0, -0.35))
handle = bpy.context.active_object
handle.name = "torch_handle"
mat_h = bpy.data.materials.new("torch_wood")
mat_h.use_nodes = True
mat_h.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
    0.30, 0.20, 0.12, 1.0
)
handle.data.materials.append(mat_h)

# ── Torch head — flow emitter (sphere at top of handle) ───────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0, 0, 0.06),
                                      segments=16, ring_count=8)
emitter = bpy.context.active_object
emitter.name = "torch_emitter"

bpy.ops.object.modifier_add(type='FLUID')
emitter_mod = emitter.modifiers["Fluid"]
emitter_mod.fluid_type = 'FLOW'
fs = emitter_mod.flow_settings

# FIRE flow_type emits fuel (not smoke directly).  Combustion physics inside the
# domain converts fuel → heat + smoke.  Use BOTH to emit raw smoke simultaneously
# with no combustion — useful for campfire embers or post-flame wisps.
fs.flow_type     = 'FIRE'
fs.flow_behavior = 'INFLOW'    # continuous fuel injection every frame

# fuel_amount controls how much combustible material enters per step.
# 0.55 → medium torch flame (~60% domain height at frame 40).
# Increase to 1.0+ for bonfire-scale; decrease to 0.2 for candle.
fs.fuel_amount      = FUEL_AMOUNT
fs.temperature      = TEMPERATURE  # initial gas temp (drives buoyancy immediately)
fs.surface_distance = 1.5          # inject within 1.5 voxels of emitter surface
fs.use_texture      = False        # solid sphere emitter, no texture masking

# ── Turbulence force field ─────────────────────────────────────────────────────
# Without a force field, the Boussinesq buoyancy force is purely vertical — the
# flame rises in a perfectly laminar column.  Real fire flickers because
# Kelvin–Helmholtz instability at the flame/air interface amplifies stochastic
# temperature and velocity perturbations.  We approximate this with a Turbulence
# field, which adds a chaotic curl to the velocity each step.
bpy.ops.object.effector_add(type='TURBULENCE', location=(0.0, 0.0, 0.15))
turb = bpy.context.active_object
turb.name = "flame_turbulence"
turb.field.strength = TURB_STRENGTH
turb.field.noise    = TURB_NOISE
turb.field.seed     = 7

# ── Volumetric material ────────────────────────────────────────────────────────
# Mantaflow bakes three scalar fields onto the domain voxel grid:
#   "density" — smoke absorption/scattering density (0 = clear, 1+ = opaque)
#   "flame"   — combustion intensity (0 = out, 1 = full burn)
#   "heat"    — gas temperature normalised 0–1 (used for colour mapping)
mat = bpy.data.materials.new("flame_volume")
mat.use_nodes = True
mat.use_volume_as_default = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

pv = nodes.new("ShaderNodeVolumePrincipled")
pv.location = (100, 100)
pv.inputs["Density"].default_value       = 6.0     # multiplier on baked density field
pv.inputs["Anisotropy"].default_value    = 0.20    # slight forward scatter (Mie phase)
pv.inputs["Absorption Color"].default_value = (0.0, 0.0, 0.0, 1.0)  # no transmission

density_attr = nodes.new("ShaderNodeAttribute")
density_attr.attribute_name = "density"
density_attr.location = (-500, 250)

flame_attr = nodes.new("ShaderNodeAttribute")
flame_attr.attribute_name = "flame"
flame_attr.location = (-500, 50)

heat_attr = nodes.new("ShaderNodeAttribute")
heat_attr.attribute_name = "heat"
heat_attr.location = (-500, -150)

# Flame colour ramp: heat 0 → 1 maps black → dark red → orange → yellow → white-hot.
# EASE interpolation avoids the sharp banding that LINEAR produces between stops.
ramp = nodes.new("ShaderNodeValToRGB")
ramp.location = (-200, -150)
ramp.color_ramp.interpolation = 'EASE'
ramp.color_ramp.elements[0].position = 0.0
ramp.color_ramp.elements[0].color    = (0.0, 0.0, 0.0, 1.0)    # no flame
ramp.color_ramp.elements[1].position = 1.0
ramp.color_ramp.elements[1].color    = (1.0, 1.0, 0.90, 1.0)   # white-hot core
e1 = ramp.color_ramp.elements.new(0.25)
e1.color = (0.55, 0.02, 0.00, 1.0)    # dark crimson
e2 = ramp.color_ramp.elements.new(0.50)
e2.color = (1.00, 0.38, 0.00, 1.0)    # orange
e3 = ramp.color_ramp.elements.new(0.78)
e3.color = (1.00, 0.85, 0.08, 1.0)    # yellow

# Emission strength driven by flame field × fixed multiplier.
# Decouples the artistic scale from the physical fuel_amount parameter.
mul_em = nodes.new("ShaderNodeMath")
mul_em.operation = 'MULTIPLY'
mul_em.location  = (-200, 50)
mul_em.inputs[1].default_value = 10.0

output = nodes.new("ShaderNodeOutputMaterial")
output.location = (400, 100)

links.new(density_attr.outputs["Fac"],  pv.inputs["Density"])
links.new(heat_attr.outputs["Fac"],     ramp.inputs["Fac"])
links.new(ramp.outputs["Color"],        pv.inputs["Emission Color"])
links.new(flame_attr.outputs["Fac"],    mul_em.inputs[0])
links.new(mul_em.outputs["Value"],      pv.inputs["Emission Strength"])
links.new(pv.outputs["Volume"],         output.inputs["Volume"])

domain_obj.data.materials.append(mat)

# ── EEVEE Next render settings ─────────────────────────────────────────────────
# EEVEE is preferred over Cycles for gaseous sims: ray-march through a 80³ volume
# in EEVEE takes ~200 ms/frame; Cycles integrates hundreds of volume-scatter events
# per pixel sample, typically 10–30× slower for equivalent smoke quality.
scene.render.engine = 'BLENDER_EEVEE_NEXT'
eevee = scene.eevee
eevee.volumetric_start      = 0.05
eevee.volumetric_end        = 3.5
eevee.volumetric_tile_size  = '2'    # 2 px tiles = highest quality ray-march
eevee.volumetric_samples    = 128    # more steps = less banding in thick smoke
eevee.use_volumetric_lights = True   # allow lights to scatter inside volume

# ── World: dark environment so fire emission is the dominant light source ──────
scene.world                = bpy.data.worlds.new("flame_world")
scene.world.use_nodes      = True
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05

# ── Camera ─────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.90, -1.10, 0.45))
cam = bpy.context.active_object
cam.name = "flame_cam"
cam.rotation_euler = Euler((1.18, 0.0, 0.63), 'XYZ')
scene.camera = cam

# ── Warm key light at torch height ────────────────────────────────────────────
bpy.ops.object.light_add(type='POINT', location=(0.45, -0.50, 0.35))
key = bpy.context.active_object
key.name = "torch_key"
key.data.energy = 250
key.data.color  = (1.0, 0.60, 0.18)   # orange-yellow, echoes flame emission colour

bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
print("flame_torch.blend saved.  "
      "Open in Blender UI → select flame_domain → Physics → Fluid → Bake All.")
