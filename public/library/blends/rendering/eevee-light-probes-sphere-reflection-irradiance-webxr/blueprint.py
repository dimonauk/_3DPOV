# =============================================================================
# EEVEE Next Light Probes — Sphere Reflection Capture + Irradiance Volume
# Blender 5.1 — bpy direct data API, EEVEE Next renderer
#
# WHY probes exist in EEVEE: EEVEE is a rasteriser. Without ray tracing, a
# chrome sphere has nothing to reflect — the reflection buffer is empty. Light
# probes fix this by pre-rendering panoramic captures from each probe's world
# position, storing the result as a cubemap / spherical-harmonics cache.
# At render time EEVEE samples those cached textures to approximate GI.
#
# EEVEE NEXT renaming (Blender 4.2 → 5.1):
#   Legacy "Reflection Cubemap"  →  Next "Sphere" probe   (type='SPHERE')
#   Legacy "Irradiance Volume"   →  Next "Volume" probe   (type='VOLUME')
#   Legacy "Reflection Plane"    →  Next "Plane"  probe   (type='PLANE')
#
# Sphere probe  — captures a 360° mip-mapped cubemap at the probe origin.
#   Metallic / glossy surfaces sample it for specular reflections.
#   Higher .resolution = better fidelity, higher VRAM cost.
#
# Irradiance Volume — places a 3-D sample grid inside the bounding box.
#   Each grid node captures incoming radiance and compresses it to L2
#   Spherical Harmonics (27 floats per node). Diffuse surfaces interpolate
#   from the four nearest grid nodes via trilinear weighting.
#
# BAKING: probe baking requires a GPU/OpenGL context. The operator
#   bpy.ops.object.lightprobe_cache_bake(subset='ALL')
# will error in blender --background (no display). This blueprint therefore
# builds the scene and saves the .blend; bake interactively via
#   Render Properties → Light Probes → Bake All Light Probes.
#
# GLB/WebXR note: glTF 2.0 has no probe payload (KHR_lights_punctual covers
# punctual lights only). For WebXR delivery, Three.js provides its own
# environment map via PMREMGenerator. The EEVEE bake is for authoring
# fidelity — the GLB export below carries geometry + materials only.
# =============================================================================

import bpy
import bmesh
import math

# ── named constants ───────────────────────────────────────────────────────────
BLEND_OUT       = "//probe_scene.blend"
GLB_OUT         = "//probe_scene.glb"
RENDER_W        = 1280
RENDER_H        = 720
EEVEE_SAMP      = 64
SPHERE_RES      = "512"   # '64'|'128'|'256'|'512'|'1024'|'2048'
SPHERE_RADIUS   = 3.5     # influence distance (metres)
SPHERE_FALLOFF  = 0.15    # blend edge (0 = hard cutoff, 1 = full blend)
VOLUME_RES_X    = 4       # irradiance grid resolution X
VOLUME_RES_Y    = 4       # irradiance grid resolution Y
VOLUME_RES_Z    = 2       # fewer in Z — scene is flat
WORLD_STR       = 0.4     # world strength multiplier

# ── helper: link object into scene ───────────────────────────────────────────
def link(name: str, mesh) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

def add_light(name, loc, rot_deg, energy, size, color=(1.0, 1.0, 1.0)):
    ld = bpy.data.lights.new(name, type="AREA")
    ld.energy = energy
    ld.size   = size
    ld.color  = color
    ob = bpy.data.objects.new(name, ld)
    ob.location       = loc
    ob.rotation_euler = [math.radians(d) for d in rot_deg]
    bpy.context.scene.collection.objects.link(ob)
    return ob

def mat_principled(name, base, metallic=0.0, roughness=0.5,
                   specular=0.5, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value   = (*base, 1.0)
    bsdf.inputs["Metallic"].default_value     = metallic
    bsdf.inputs["Roughness"].default_value    = roughness
    bsdf.inputs["Specular IOR Level"].default_value = specular
    bsdf.inputs["Transmission Weight"].default_value = transmission
    return mat

# =============================================================================
# 1. Scene + EEVEE Next settings
# =============================================================================
scn = bpy.context.scene
scn.render.engine              = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x        = RENDER_W
scn.render.resolution_y        = RENDER_H
scn.render.resolution_percentage = 100
scn.render.film_transparent    = False

eevee = scn.eevee
eevee.taa_render_samples       = EEVEE_SAMP
eevee.use_raytracing           = False   # probe-only path — no RTX required
eevee.use_shadow_high_bitdepth = True
eevee.gi_cubemap_resolution    = SPHERE_RES
eevee.gi_diffuse_bounces       = 3       # 3 diffuse bounces via irradiance grid
eevee.gi_irradiance_smoothing  = 0.10   # slight blurring prevents hard grid seams
eevee.gi_filter_quality        = 3.0    # filter quality 1-8; 3 is balanced

# =============================================================================
# 2. World lighting  — warm teal gradient, low strength
# =============================================================================
world = bpy.data.worlds.new("probe_world")
scn.world = world
world.use_nodes = True
wt = world.node_tree
wt.nodes.clear()
wbg  = wt.nodes.new("ShaderNodeBackground")
wout = wt.nodes.new("ShaderNodeOutputWorld")
wt.links.new(wbg.outputs["Background"], wout.inputs["Surface"])
wbg.inputs["Color"].default_value   = (0.05, 0.10, 0.20, 1.0)
wbg.inputs["Strength"].default_value = WORLD_STR

# =============================================================================
# 3. Materials
# =============================================================================
mat_chrome  = mat_principled("mat_chrome",  (0.9, 0.9, 0.9), metallic=1.0, roughness=0.04)
mat_gold    = mat_principled("mat_gold",    (1.0, 0.78, 0.3), metallic=1.0, roughness=0.12)
mat_brushed = mat_principled("mat_brushed", (0.6, 0.6, 0.65), metallic=1.0, roughness=0.38)
mat_plaster = mat_principled("mat_plaster", (0.85, 0.85, 0.82), metallic=0.0, roughness=0.90)
mat_floor   = mat_principled("mat_floor",   (0.22, 0.22, 0.24), metallic=0.0, roughness=0.80)
mat_accent  = mat_principled("mat_accent",  (0.20, 0.45, 0.80), metallic=0.0, roughness=0.35)

# =============================================================================
# 4. Geometry — floor, back wall, hero objects
# =============================================================================
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=5.0)
me_floor = bpy.data.meshes.new("floor_mesh")
bm.to_mesh(me_floor); bm.free()
floor_obj = link("floor_plane", me_floor)
floor_obj.data.materials.append(mat_floor)

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=5.0)
me_wall = bpy.data.meshes.new("back_wall_mesh")
bm.to_mesh(me_wall); bm.free()
wall_obj = link("back_wall", me_wall)
wall_obj.rotation_euler = (math.radians(90), 0, 0)
wall_obj.location       = (0, -4.5, 4.5)
wall_obj.data.materials.append(mat_plaster)

# Chrome sphere — primary probe test subject
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.7)
me_sphere = bpy.data.meshes.new("chrome_sphere_mesh")
bm.to_mesh(me_sphere); bm.free()
sphere_obj = link("chrome_sphere", me_sphere)
sphere_obj.location = (0, 0, 0.7)
sphere_obj.data.materials.append(mat_chrome)

# Gold ellipsoid (scaled sphere) — tests anisotropic probe sampling at offset
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.5)
me_ellip = bpy.data.meshes.new("gold_ellip_mesh")
bm.to_mesh(me_ellip); bm.free()
ellip_obj = link("gold_ellipsoid", me_ellip)
ellip_obj.scale    = (1.0, 0.6, 1.4)
ellip_obj.location = (-2.0, 0, 0.7)
ellip_obj.data.materials.append(mat_gold)

# Brushed aluminium cylinder — tests rougher specular at medium roughness
bm = bmesh.new()
bmesh.ops.create_cone(bm, segments=32, radius1=0.45, radius2=0.45, depth=1.4)
me_cyl = bpy.data.meshes.new("brushed_cylinder_mesh")
bm.to_mesh(me_cyl); bm.free()
cyl_obj = link("brushed_cylinder", me_cyl)
cyl_obj.location = (2.0, 0, 0.7)
cyl_obj.data.materials.append(mat_brushed)

# Diffuse accent box — primary irradiance volume test subject
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=0.9)
me_box = bpy.data.meshes.new("accent_box_mesh")
bm.to_mesh(me_box); bm.free()
box_obj = link("accent_box", me_box)
box_obj.location = (0, 2.0, 0.45)
box_obj.data.materials.append(mat_accent)

# =============================================================================
# 5. Key + fill lighting
# =============================================================================
add_light("key_light",  loc=( 3.0,  2.5, 4.0), rot_deg=(-60,  0,  40), energy=600, size=1.8)
add_light("fill_light", loc=(-3.0,  1.5, 2.5), rot_deg=(-45,  0, -30), energy=150, size=3.0,
          color=(0.7, 0.82, 1.0))
add_light("rim_light",  loc=( 0.0, -3.5, 3.2), rot_deg=(-30,  0, 180), energy=200, size=1.0,
          color=(1.0, 0.90, 0.75))

# =============================================================================
# 6. Sphere Reflection Probe
#    Placed at scene centre so all hero objects fall within its influence radius.
#    SPHERE_RADIUS should enclose all objects you want reflected in glossy mats.
# =============================================================================
bpy.ops.object.lightprobe_add(type="SPHERE", location=(0.0, 0.0, 1.5))
sphere_probe_obj = bpy.context.object
sphere_probe_obj.name = "refl_sphere_probe"
sp = sphere_probe_obj.data           # LightProbe data block
sp.influence_distance = SPHERE_RADIUS
sp.falloff            = SPHERE_FALLOFF
sp.clip_start         = 0.1          # avoid self-intersection artifacts
sp.clip_end           = 20.0
sp.intensity          = 1.0
# resolution is set via eevee.gi_cubemap_resolution globally in EEVEE Next
# (per-probe resolution override is not available in 5.1 via bpy — set globally)

# =============================================================================
# 7. Irradiance Volume Probe
#    Encloses the whole scene floor area. Resolution grid: 4×4×2.
#    Denser in XY (lateral) than Z because the scene objects are flat.
#    WHY L2 SH: 27 floats per node is efficient; higher-order SH buys little
#    for smooth indirect diffuse but costs significantly more memory.
# =============================================================================
bpy.ops.object.lightprobe_add(type="VOLUME", location=(0.0, 0.0, 1.5))
vol_probe_obj = bpy.context.object
vol_probe_obj.name  = "irradiance_vol_probe"
vol_probe_obj.scale = (4.5, 4.5, 2.0)  # world-space size via object scale
vp = vol_probe_obj.data
vp.grid_resolution_x = VOLUME_RES_X
vp.grid_resolution_y = VOLUME_RES_Y
vp.grid_resolution_z = VOLUME_RES_Z
vp.intensity         = 1.0

# =============================================================================
# 8. Camera
# =============================================================================
cam_d = bpy.data.cameras.new("cam")
cam_d.lens          = 50
cam_d.clip_start    = 0.1
cam_d.clip_end      = 50.0
cam_obj = bpy.data.objects.new("cam", cam_d)
cam_obj.location       = (5.5, -5.5, 3.2)
cam_obj.rotation_euler = (math.radians(70), 0, math.radians(45))
bpy.context.scene.collection.objects.link(cam_obj)
scn.camera = cam_obj

# =============================================================================
# 9. Frame range + save
#    record.py drives the camera orbit; blueprint just defines frame count.
# =============================================================================
scn.frame_start = 1
scn.frame_end   = 120

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
print("Saved:", bpy.path.abspath(BLEND_OUT))
print("NOTE: Open probe_scene.blend and bake probes interactively:")
print("  Render Properties → Light Probes → Bake All Light Probes")
print("  Then: File → Export → glTF 2.0 → probe_scene.glb")
