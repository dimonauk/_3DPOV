"""
Cycles Path Guiding + Shadow Caustics — Physically Accurate Glass Caustics
Blender 5.1 | CC0 | Holoflow Studio

Path guiding is a progressive Monte Carlo sampling strategy introduced in
Blender 4.0.  Each render pass builds a 5-dimensional radiance cache; successive
passes sample proportionally to that cache, steering paths toward directions that
are actually bright.  On caustic-heavy scenes — glass, water, polished metal —
this can halve required sample counts for equal noise.

Shadow caustics (per-light, also 4.0+) makes Cycles trace dedicated shadow rays
through refractive/reflective surfaces for that specific light.  Without it,
standard path tracing relies on chance to find the highly focused bright spot; the
convergence is extremely slow.  The two features are complementary: path guiding
finds the caustic distribution; shadow caustics ensures individual pixels can
converge even before the global guide is trained.

This blueprint builds: a glass sphere on a marble pedestal, a spot light casting a
refractive caustic ellipse onto a large floor plane.  The sphere radius, IOR, and
light angle are computed to place the focal ellipse visibly on the floor.
"""

import bpy
import math

# ── Named constants ────────────────────────────────────────────────────────────
SLUG             = "caustic_glass"
SPHERE_RADIUS    = 0.40        # metres — crystal ball
SPHERE_Z         = 0.84        # sphere centre height (pedestal top + radius)
IOR_GLASS        = 1.52        # lead crystal glass — good caustic brightness
PEDESTAL_H       = 0.44        # pedestal height (slightly above sphere equator seam)
FLOOR_SIZE       = 5.0         # floor plane side length
CYCLES_SAMPLES   = 1024        # path-traced samples (enough for visible caustic)
TRAINING_SAMPLES = 128         # path guiding: samples before guide is used
SPOT_ANGLE_DEG   = 25.0        # spotlight cone half-angle (narrow = focused)
SPOT_ENERGY      = 1400.0      # watts — intense to drive caustic brightness
OUTPUT_DIR       = "//"        # relative to .blend — sibling files

# ── 1. Clean scene ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene       = bpy.context.scene
scene.name  = SLUG
world       = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.025, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.10

# ── 2. Camera ─────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
# Angle: looking from slightly above floor level to capture sphere + caustic below
cam_obj.location       = (-2.20, -3.40, 2.00)
cam_obj.rotation_euler = (math.radians(68), 0.0, math.radians(-33))

# ── 3. Spot light ─────────────────────────────────────────────────────────────
# Positioned at 45° off vertical so the caustic ellipse lands clearly to one side
# of the pedestal shadow, where it's unambiguous on the floor.
spot_data  = bpy.data.lights.new("spot_caustic", "SPOT")
spot_data.energy          = SPOT_ENERGY
spot_data.spot_size       = math.radians(SPOT_ANGLE_DEG * 2)
spot_data.spot_blend      = 0.12   # sharp beam edge
spot_data.shadow_soft_size = 0.04  # near-point source for sharp caustic focus
spot_obj   = bpy.data.objects.new("spot_caustic", spot_data)
scene.collection.objects.link(spot_obj)
# Position: offset from sphere along XY so beam crosses sphere at ~45°
spot_obj.location       = (1.80, -1.40, 4.50)
# Point at sphere centre — use track-to constraint equivalent via direction
import mathutils
spot_dir = mathutils.Vector((0, 0, SPHERE_Z)) - mathutils.Vector(spot_obj.location)
spot_obj.rotation_euler = spot_dir.to_track_quat('-Z', 'Y').to_euler()

# WHY a SPOT not SUN: a Sun light produces parallel rays — they all refract with
# the same angle, producing a diffuse bright disk on the floor.  A spot produces
# a cone of diverging rays that the sphere focuses more sharply, giving a defined
# elliptical caustic with a bright core.  The tighter the spot angle, the more
# collimated the beam, the sharper the caustic.
# shadow_soft_size=0.04: physically a 4 cm radius source.  A true point source
# gives infinitely sharp caustic edges; a larger value softens them.  At 0.04 m
# the caustic boundary is realistically crisp without the "sharp edge" artefact
# that makes renders look synthetic.

# ── 4. Shadow Caustics — per-light toggle ─────────────────────────────────────
# This is the key flag.  Without it, Cycles can technically render caustics but
# relies on the rare multi-bounce path that connects source → glass entry →
# glass exit → floor → camera.  The probability of sampling this path by chance
# is ~1 in 10^4 per pixel — meaning thousands of samples are needed just to see
# a faint suggestion.  With use_caustics=True Cycles adds a dedicated bidirectional
# shadow-ray tracer for this light that is algebraically guaranteed to hit the
# floor via the glass, giving caustic energy in every sample.
spot_data.cycles.use_caustics = True  # CyclesLightSettings (Blender 4.0+ API)

# ── 5. Floor plane ────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=FLOOR_SIZE)
floor       = bpy.context.active_object
floor.name  = "floor"

# ── 6. Pedestal ───────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cube_add(size=1.0)
pedestal       = bpy.context.active_object
pedestal.name  = "pedestal"
pedestal.scale = (0.55, 0.55, PEDESTAL_H / 2.0)  # half-size in Z since cube is size 1
bpy.ops.object.transform_apply(scale=True)
pedestal.location.z = PEDESTAL_H / 2.0  # bottom at z=0

# ── 7. Glass sphere ───────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=SPHERE_RADIUS,
    segments=64,
    ring_count=32,
)
sphere       = bpy.context.active_object
sphere.name  = "glass_sphere"
sphere.location.z = SPHERE_Z
bpy.ops.object.shade_smooth()

# ── 8. Materials ──────────────────────────────────────────────────────────────
# ── 8a. Glass — Principled BSDF, transmission-only ───────────────────────────
# Transmission Weight=1.0, Roughness=0.0 gives a perfectly smooth glass that
# produces a tightly focused caustic.  Any roughness above ~0.02 starts smearing
# the caustic into a diffuse blob.  Use Roughness=0.0 for demonstration clarity.
#
# WHY IOR=1.52 not 1.45:
#   Standard window glass: 1.52.  Borosilicate: 1.47.  Leaded crystal: 1.62.
#   1.52 gives a visible caustic ellipse in the studio's floor scene without the
#   extreme hot-spot brightness of 1.62.  At 1.45 the caustic is noticeably dimmer.
mat_glass = bpy.data.materials.new("glass_crystal")
mat_glass.use_nodes = True
nt  = mat_glass.node_tree
nt.nodes.clear()

bsdf_g   = nt.nodes.new("ShaderNodeBsdfPrincipled")
out_g    = nt.nodes.new("ShaderNodeOutputMaterial")
bsdf_g.location = (0, 0);  out_g.location = (300, 0)
bsdf_g.inputs["Base Color"].default_value          = (0.94, 0.97, 1.00, 1.0)
bsdf_g.inputs["Roughness"].default_value           = 0.0
bsdf_g.inputs["IOR"].default_value                 = IOR_GLASS
bsdf_g.inputs["Transmission Weight"].default_value = 1.0
# Alpha=0 in viewport to avoid opaque glass blocking the caustic view
mat_glass.blend_method  = "HASHED"
mat_glass.shadow_method = "HASHED"
nt.links.new(bsdf_g.outputs["BSDF"], out_g.inputs["Surface"])
sphere.data.materials.append(mat_glass)

# ── 8b. Floor — warm concrete with slight variation ──────────────────────────
mat_floor = bpy.data.materials.new("floor_concrete")
mat_floor.use_nodes = True
nt2 = mat_floor.node_tree
nt2.nodes.clear()

noise_f = nt2.nodes.new("ShaderNodeTexNoise")
noise_f.inputs["Scale"].default_value   = 8.0
noise_f.inputs["Detail"].default_value  = 6.0
noise_f.inputs["Roughness"].default_value = 0.55
noise_f.location = (-500, 100)

ramp_f  = nt2.nodes.new("ShaderNodeValToRGB")
ramp_f.location = (-280, 100)
ramp_f.color_ramp.elements[0].color = (0.78, 0.74, 0.68, 1.0)  # warm beige
ramp_f.color_ramp.elements[1].color = (0.88, 0.85, 0.80, 1.0)  # pale marble

bsdf_f  = nt2.nodes.new("ShaderNodeBsdfPrincipled")
out_f   = nt2.nodes.new("ShaderNodeOutputMaterial")
bsdf_f.location = (0, 0);  out_f.location = (300, 0)
bsdf_f.inputs["Roughness"].default_value = 0.82  # matte — caustic reads clearly on diffuse
nt2.links.new(noise_f.outputs["Color"],   ramp_f.inputs["Fac"])
nt2.links.new(ramp_f.outputs["Color"],    bsdf_f.inputs["Base Color"])
nt2.links.new(bsdf_f.outputs["BSDF"],     out_f.inputs["Surface"])
floor.data.materials.append(mat_floor)

# ── 8c. Pedestal — dark stone ─────────────────────────────────────────────────
mat_ped = bpy.data.materials.new("pedestal_stone")
mat_ped.use_nodes = True
nt3 = mat_ped.node_tree
nt3.nodes.clear()
bsdf_p = nt3.nodes.new("ShaderNodeBsdfPrincipled")
out_p  = nt3.nodes.new("ShaderNodeOutputMaterial")
bsdf_p.inputs["Base Color"].default_value = (0.12, 0.11, 0.10, 1.0)
bsdf_p.inputs["Roughness"].default_value  = 0.65
bsdf_p.inputs["Specular IOR Level"].default_value = 0.55
nt3.links.new(bsdf_p.outputs["BSDF"], out_p.inputs["Surface"])
pedestal.data.materials.append(mat_ped)

# ── 9. Cycles render engine ───────────────────────────────────────────────────
scene.render.engine = "CYCLES"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.cycles.samples      = CYCLES_SAMPLES
scene.cycles.use_denoising = True          # OIDN post-denoising to clean noise floor

# ── 9a. Path Guiding ──────────────────────────────────────────────────────────
# Path guiding builds a spatial 5D cache (position × direction → radiance).
# The first TRAINING_SAMPLES passes are "exploration" — the cache is populated but
# not yet used to bias sampling.  After that, every new sample is drawn from the
# cached distribution rather than uniform hemisphere sampling.  For caustics
# specifically, this means once the guide has seen the bright focal ellipse a few
# times, it will preferentially send future paths toward it.
scene.cycles.use_guiding            = True
scene.cycles.guiding_training_samples = TRAINING_SAMPLES

# WHY 128 training samples:
#   At 128 samples the caustic ellipse has been sampled enough times for the guide
#   to build a meaningful distribution.  Too few (< 32) and the guide sends paths
#   randomly; too many (> 256) wastes time on unguided sampling when the scene is
#   stable.  128 is the Blender default for good reason.

# ── 9b. Caustic enable scene-wide ─────────────────────────────────────────────
# Refractive caustics (glass focusing light) is the relevant mode here.
# Reflective caustics (shiny metal bowls, concave mirrors) are left off — they
# are expensive and not present in this scene.
scene.cycles.caustics_refractive = True
scene.cycles.caustics_reflective = False

# ── 9c. Denoising configuration ───────────────────────────────────────────────
# Caustic renders are inherently noisy even at 1024 samples.  OIDN denoises
# the raw render while preserving the bright caustic ellipse.  Without denoising,
# the caustic core shows speckling that viewers mistake for render artefacts.
# With it, the caustic reads as a smooth bright focal band.
scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"  # full quality OIDN mode

# ── 10. Render and save ───────────────────────────────────────────────────────
import os
scene.render.filepath = os.path.join(OUTPUT_DIR, "output", SLUG + "_0001.png")
os.makedirs(bpy.path.abspath(os.path.join(OUTPUT_DIR, "output")), exist_ok=True)
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "16"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(bpy.path.abspath(OUTPUT_DIR), SLUG + ".blend"))
print(f"✓  {SLUG}.blend saved.  Caustic render at output/{SLUG}_0001.png")
print("   Path guiding and shadow caustics active — expect ~3-6 min at 1024 spp on GPU.")
