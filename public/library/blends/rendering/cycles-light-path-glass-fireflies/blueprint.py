"""
Cycles Light Path Node — Glass Without Fireflies
Blender 5.1 / bpy direct-data API

Builds a bevelled octagonal crystal prism on a shadow-catcher plane, lit
by a Sun lamp.  The glass material uses a Light Path > Is Shadow Ray switch
to redirect shadow rays through a Transparent BSDF, suppressing refractive
caustic fireflies without touching the visible refracted image.

WHY FIREFLIES HAPPEN
  A caustic is a focused bright patch formed when glass concentrates
  parallel rays.  In path tracing each such ray carries variance equal to
  the product of all BSDF values along its path.  A glass-to-diffuse-to-camera
  path multiplies Transmission × Diffuse × ... so the few paths that reach
  the caustic focal region have very high energy; the many that miss have zero.
  This extreme variance manifests as isolated bright (or black) pixels that
  need thousands of samples to average away.

THE IS SHADOW RAY TRICK
  Shadow rays determine whether a surface point is occluded from a light.
  They do NOT contribute to the colour the camera sees through the glass.
  Routing shadow rays through Transparent BSDF (air, IOR=1) rather than
  the glass refraction lobe removes the high-variance caustic paths entirely.
  The glass still looks correct from the camera: refraction, IOR dispersion,
  Fresnel reflection all use the Principled BSDF.  Only the shadow "footprint"
  is simplified to a soft transparent disc.
"""

import math
import bpy
import bmesh

# ── Parameters (all in SI units) ──────────────────────────────────────────────
SLUG             = "crystal_prism"
PRISM_SEGMENTS   = 8           # octagonal cross-section
PRISM_RADIUS     = 0.40        # m, circumscribed circle radius
PRISM_HEIGHT     = 1.10        # m
BEVEL_AMOUNT     = 0.035       # m, top/bottom ring chamfer
BEVEL_SEGS       = 2           # 2 segs → 45° fillet; 3+ → round
GLASS_IOR        = 1.517       # BK7 borosilicate (camera lenses, lab prisms)
GLASS_ROUGHNESS  = 0.0         # ideal dielectric; raise to ~0.05 for frosted
GLASS_COLOR      = (0.82, 0.93, 1.00, 1.0)  # ice-blue tint
PLANE_SIZE       = 2.5         # m, shadow-catcher half-extent
SUN_STRENGTH     = 6.0         # W/m²
SUN_ELEV         = math.radians(38)   # elevation angle from XY plane
SUN_AZI          = math.radians(20)   # azimuth roll toward Y
CAM_DIST         = 2.8         # m from origin
CAM_ELEV         = math.radians(22)   # above horizon
# Cycles bounce budget
MAX_BOUNCES          = 12   # total path depth
TRANSMISSION_BOUNCES = 8    # refractive crossings (4 pairs = 4 glass objects)
TRANSPARENT_BOUNCES  = 16   # alpha-shadow accumulation
DIFFUSE_BOUNCES  = 4
GLOSSY_BOUNCES   = 4
# Firefly clamps — applied after BSDF evaluation, before accumulation
CLAMP_DIRECT     = 8.0   # clip direct illumination outliers
CLAMP_INDIRECT   = 4.0   # clip indirect (bounce) outliers
SAMPLES          = 128   # preview quality; raise to 512+ for final
OUT_GLB          = f"//{SLUG}.glb"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
    for item in list(blk):
        blk.remove(item)

scene = bpy.context.scene
view_layer = bpy.context.view_layer

# ── Cycles configuration ──────────────────────────────────────────────────────
scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"  # OIDN multi-pass
# Bounce budget
scene.cycles.max_bounces          = MAX_BOUNCES
scene.cycles.diffuse_bounces      = DIFFUSE_BOUNCES
scene.cycles.glossy_bounces       = GLOSSY_BOUNCES
scene.cycles.transmission_bounces = TRANSMISSION_BOUNCES
scene.cycles.volume_bounces       = 2
scene.cycles.transparent_max_bounces = TRANSPARENT_BOUNCES
# Firefly suppression via clamping
# WHY CLAMP WORKS: Cycles accumulates sample radiance as a running mean.
# A single sample with radiance = 1000× the average is physically valid but
# statistically catastrophic — it takes ~1 000 000 samples to dilute it.
# Clamping caps the per-sample contribution at CLAMP_DIRECT/CLAMP_INDIRECT.
# This is an approximation (energy is lost), but for glass the error is tiny
# because caustic focal regions are rarely in the camera's primary view.
scene.cycles.use_clamp_direct   = True
scene.cycles.clamp_direct       = CLAMP_DIRECT
scene.cycles.use_clamp_indirect = True
scene.cycles.clamp_indirect     = CLAMP_INDIRECT
# Disable renderer-level caustics — consistent with the shader trick below.
# Keeping caustics=True while using the Is Shadow Ray switch would be redundant
# and slightly slower (Cycles still evaluates caustic paths before the BSDF
# truncates them).
scene.cycles.caustics_refractive = False
scene.cycles.caustics_reflective = False

# ── Glass material with Light Path switch ─────────────────────────────────────
mat = bpy.data.materials.new(name="glass_crystal")
mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

out_node = nt.nodes.new("ShaderNodeOutputMaterial")
out_node.location = (600, 0)

# Principled BSDF v2: Transmission Weight = 1.0 → full dielectric glass
pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
pbsdf.location = (-200, 80)
pbsdf.inputs["Base Color"].default_value          = GLASS_COLOR
pbsdf.inputs["Roughness"].default_value           = GLASS_ROUGHNESS
pbsdf.inputs["IOR"].default_value                 = GLASS_IOR
pbsdf.inputs["Transmission Weight"].default_value = 1.0
# Specular IOR Level at 0.5 = physically correct Fresnel from IOR alone
pbsdf.inputs["Specular IOR Level"].default_value  = 0.5

# Transparent BSDF: used only in shadow rays
transp = nt.nodes.new("ShaderNodeBsdfTransparent")
transp.location = (-200, -80)
transp.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)

# Light Path node — the diagnostic lens of the Cycles path tracer
# Is Shadow Ray = True whenever Cycles is computing occlusion/shadow
lpath = nt.nodes.new("ShaderNodeLightPath")
lpath.location = (-420, -40)

# Mix Shader: Factor = Is Shadow Ray
# Factor=0 (camera/reflection/transmission paths) → Shader1 = Principled glass
# Factor=1 (shadow paths) → Shader2 = Transparent (no caustic variance)
mix = nt.nodes.new("ShaderNodeMixShader")
mix.location = (200, 0)

nt.links.new(lpath.outputs["Is Shadow Ray"], mix.inputs["Fac"])
nt.links.new(pbsdf.outputs["BSDF"],          mix.inputs[1])
nt.links.new(transp.outputs["BSDF"],         mix.inputs[2])
nt.links.new(mix.outputs["Shader"],          out_node.inputs["Surface"])

# ── Octagonal prism (bmesh) ───────────────────────────────────────────────────
mesh = bpy.data.meshes.new("prism_mesh")
bm   = bmesh.new()
half_h = PRISM_HEIGHT / 2

top_verts, bot_verts = [], []
for i in range(PRISM_SEGMENTS):
    # offset by half-step so a flat face fronts the camera
    θ = 2 * math.pi * i / PRISM_SEGMENTS + math.pi / PRISM_SEGMENTS
    x = PRISM_RADIUS * math.cos(θ)
    y = PRISM_RADIUS * math.sin(θ)
    top_verts.append(bm.verts.new((x, y,  half_h)))
    bot_verts.append(bm.verts.new((x, y, -half_h)))

for i in range(PRISM_SEGMENTS):
    j = (i + 1) % PRISM_SEGMENTS
    bm.faces.new([top_verts[i], top_verts[j], bot_verts[j], bot_verts[i]])
bm.faces.new(top_verts)
bm.faces.new(list(reversed(bot_verts)))

# Bevel the top and bottom ring edges for specular highlights and a faceted
# gem-cap look.  We select only horizontal cap edges (both verts at ±half_h).
bm.edges.ensure_lookup_table()
cap_edges = [
    e for e in bm.edges
    if (abs(e.verts[0].co.z - half_h) < 1e-4 and abs(e.verts[1].co.z - half_h) < 1e-4)
    or (abs(e.verts[0].co.z + half_h) < 1e-4 and abs(e.verts[1].co.z + half_h) < 1e-4)
]
bmesh.ops.bevel(
    bm, geom=cap_edges, offset=BEVEL_AMOUNT, segments=BEVEL_SEGS,
    profile=0.5, affect="EDGES",
)

bm.to_mesh(mesh)
bm.free()
mesh.validate()
mesh.update()

prism = bpy.data.objects.new("crystal_prism", mesh)
scene.collection.objects.link(prism)
prism.data.materials.append(mat)

# ── Shadow-catcher floor ──────────────────────────────────────────────────────
floor_mesh = bpy.data.meshes.new("floor_mesh")
bm2 = bmesh.new()
bmesh.ops.create_grid(bm2, x_segments=1, y_segments=1, size=PLANE_SIZE)
bm2.to_mesh(floor_mesh)
bm2.free()
floor_obj = bpy.data.objects.new("floor", floor_mesh)
floor_obj.location.z = -half_h - 0.001  # just beneath prism base
scene.collection.objects.link(floor_obj)
floor_obj.is_shadow_catcher = True

# ── Sun light ─────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("sun", type="SUN")
sun_data.energy = SUN_STRENGTH
# Small angle = near-point source → tight, well-defined glass shadow
sun_data.angle  = math.radians(0.5)
sun_obj  = bpy.data.objects.new("sun", sun_data)
scene.collection.objects.link(sun_obj)
# Sun direction is local -Z; tilt by elevation then azimuth roll
sun_obj.rotation_euler = (SUN_ELEV, SUN_AZI, 0.0)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("camera")
cam_data.lens        = 50.0
cam_data.dof.use_dof = False   # keep prism fully in focus for clarity
cam_obj  = bpy.data.objects.new("camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (
    -CAM_DIST * math.cos(CAM_ELEV),
     0.0,
     CAM_DIST * math.sin(CAM_ELEV),
)
cam_obj.rotation_euler = (math.pi / 2 - CAM_ELEV, 0.0, -math.pi / 2)

# ── GLB export ────────────────────────────────────────────────────────────────
# Principled BSDF Transmission=1.0 maps to KHR_materials_transmission in GLB.
# The Light Path node is Cycles-only and is not written to GLB; WebXR renderers
# receive the plain Principled parameters and compute transmission via
# KHR_materials_transmission (no firefly problem at browser sample counts).
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_texcoords=True,
    export_normals=True,
    export_cameras=False,
    export_lights=False,
)

print(f"[blueprint] Wrote {OUT_GLB}")
print(f"[blueprint] Cycles: samples={SAMPLES}, bounces={MAX_BOUNCES}, tx={TRANSMISSION_BOUNCES}")
print(f"[blueprint] Clamp: direct={CLAMP_DIRECT}, indirect={CLAMP_INDIRECT}")
