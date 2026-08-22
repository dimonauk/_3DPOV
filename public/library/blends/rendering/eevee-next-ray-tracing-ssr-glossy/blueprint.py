"""
EEVEE Next — Screen-Space Ray Tracing: Graduated-Roughness Metal Sphere Array
Blender 5.1  |  CC0  |  Holoflow Studio

Technique
---------
EEVEE Next ships two complementary reflection strategies that work best together:

  SCREEN (SSR) — traces rays through the rendered colour + depth buffer.
                  Handles dynamic objects, reads live light positions, degrades
                  gracefully near screen edges. Cost scales with ssr_quality.
                  Cuts off hard at ssr_max_roughness.

  PROBE (Sphere / Plane probe objects) — baked cubemaps. GPU-cheap, static
                  light only. Fills what SSR cannot reach: off-screen geometry,
                  roughness above the SSR cutoff, the very first frame.

Stacking both gets EEVEE close to a path-traced look at real-time frame rates.

Scene: six IcoSpheres on a near-mirror floor, roughness 0.0 → 1.0.
The SSR cutoff at 0.45 is visible between sphere 3 (0.32, SSR active) and
sphere 4 (0.55, probe fallback) — the reflection quality drop is the lesson.
"""

import bpy
import math
import os
from mathutils import Vector, Euler

# ─── Constants ─────────────────────────────────────────────────────────────────
SLUG              = "eevee-next-ray-tracing-ssr-glossy"
ROUGHNESS_STEPS   = [0.0, 0.08, 0.18, 0.32, 0.55, 1.0]   # chrome → matte clay
SPHERE_RADIUS     = 0.30
SPHERE_SPACING    = 0.85          # centre-to-centre along X (metres)
SPHERE_SUBDIVS    = 4             # IcoSphere subdivisions → 642 verts, smooth enough for SSR normals
FLOOR_HALF        = 6.0
WALL_Y            = 3.5           # backdrop behind the spheres
WALL_HEIGHT       = 4.5

# SSR settings — these are the SCREEN ray-tracing tuning knobs
SSR_QUALITY       = 0.50          # ray-step count factor; 1.0 = 4× slower
SSR_MAX_ROUGHNESS = 0.45          # hard cutoff; above this value → probe fallback
SSR_THICKNESS     = 0.15          # hit-slab depth in metres; too thin → dark halo on thick objects
SSR_BORDER_FADE   = 0.08          # normalised edge blend; 0 = hard pop at screen boundary
SSR_FIREFLY_FAC   = 10.0          # clamp extreme bright reflection samples

FLOOR_ROUGHNESS   = 0.03          # near-mirror: makes SSR reflections vivid on the floor
SPHERE_METALLIC   = 1.0           # pure conductor
SPHERE_BASE       = (0.82, 0.82, 0.85, 1.0)   # platinum-grey, neutral hue
FLOOR_BASE        = (0.90, 0.90, 0.92, 1.0)   # cool white marble
WALL_BASE         = (0.04, 0.04, 0.07, 1.0)   # deep navy — reflected colour reads clearly on spheres

KEY_ENERGY        = 400.0         # watts, area light
FILL_ENERGY       = 180.0         # watts, fill
LIGHT_COLOUR      = (1.0, 0.96, 0.88)  # warm tungsten tint

GLB_OUTPUT = f"//../../glbs/rendering/{SLUG}/ssr_metal_spheres.glb"


# ─── Helpers ───────────────────────────────────────────────────────────────────
def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.lights, bpy.data.cameras):
        for item in list(col):
            col.remove(item, do_unlink=True)


def make_pbr(name: str, base: tuple, metallic: float = 0.0,
             roughness: float = 0.5, ior: float = 1.45) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = base
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = roughness
    bsdf.inputs["IOR"].default_value         = ior
    return mat


def assign(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ─── Purge + scene ─────────────────────────────────────────────────────────────
purge_scene()
scene = bpy.context.scene
scene.name = "eevee_ssr_metal_spheres"
scene.frame_start, scene.frame_end = 1, 120

# ─── Render engine ─────────────────────────────────────────────────────────────
# In Blender 4.2+ 'BLENDER_EEVEE' resolves to EEVEE Next; the legacy engine
# was removed. This explicit assignment guards against a Cycles session.
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080

# ─── EEVEE Next — Screen-Space Ray Tracing ────────────────────────────────────
eevee = scene.eevee
eevee.use_ssr            = True   # activates the SSR (SCREEN) reflection pass
eevee.use_ssr_refraction = False  # refraction SSR is a separate concern

# Quality: controls ray march step count. 0.25 is viewport-interactive;
# 0.5 is a good balance; 1.0 halves step size twice → 4× slower, sharper.
eevee.ssr_quality        = SSR_QUALITY

# Max roughness: the single most important setting. Surfaces ABOVE this value
# receive NO SSR — they fall back to the nearest sphere probe entirely.
# 0.45 keeps chrome + brushed metal while excluding painted / matte surfaces.
eevee.ssr_max_roughness  = SSR_MAX_ROUGHNESS

# Thickness: each screen pixel implicitly represents a solid slab of this depth.
# Rays that intersect within the slab count as a hit. Too thin → false misses
# on thick objects (dark halo at silhouette). Too thick → reflections leak
# through walls.
eevee.ssr_thickness      = SSR_THICKNESS

# Border fade: SSR reflection strength fades over this fraction of the screen
# near each edge. Prevents a hard pop when reflective objects pan into frame.
eevee.ssr_border_fade    = SSR_BORDER_FADE
eevee.ssr_firefly_fac    = SSR_FIREFLY_FAC

eevee.use_gtao           = True   # AO adds contact-shadow depth cue under spheres
eevee.gtao_distance      = 0.25

# ─── World ─────────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("ssr_world")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = WALL_BASE   # ambient matches backdrop
bg.inputs["Strength"].default_value = 0.4

# ─── Floor ─────────────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=FLOOR_HALF * 2, location=(0, 0, 0))
floor_obj = bpy.context.active_object
floor_obj.name = "floor"
assign(floor_obj, make_pbr("mat_floor", FLOOR_BASE,
                            metallic=0.0, roughness=FLOOR_ROUGHNESS, ior=1.52))

# ─── Backdrop wall ─────────────────────────────────────────────────────────────
# Plane in XY, rotated 90° around X → lies in XZ plane, normal facing -Y.
# Camera sits at -Y looking toward +Y, so this face is visible.
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, WALL_Y, WALL_HEIGHT / 2))
wall_obj = bpy.context.active_object
wall_obj.name = "backdrop_wall"
wall_obj.scale = Vector((FLOOR_HALF, WALL_HEIGHT / 2, 1.0))
wall_obj.rotation_euler = Euler((math.radians(90), 0, 0), 'XYZ')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
assign(wall_obj, make_pbr("mat_wall", WALL_BASE, metallic=0.0, roughness=1.0))

# ─── Metal sphere row ──────────────────────────────────────────────────────────
# SSR cutoff at 0.45 falls between sphere 3 (roughness 0.32, SSR) and sphere 4
# (roughness 0.55, probe fallback). The visual quality drop shows exactly where
# the engine switches strategy.
sphere_count  = len(ROUGHNESS_STEPS)
total_width   = (sphere_count - 1) * SPHERE_SPACING
x_start       = -total_width / 2.0
sphere_obs    = []

for i, roughness in enumerate(ROUGHNESS_STEPS):
    x = x_start + i * SPHERE_SPACING
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=SPHERE_RADIUS, subdivisions=SPHERE_SUBDIVS,
        location=(x, 0.0, SPHERE_RADIUS))
    sph = bpy.context.active_object
    sph.name = f"sphere_r{int(roughness * 100):03d}"
    # Shade smooth: per-vertex normals are required for SSR to trace accurately.
    # Flat normals produce a faceted polygon pattern in the reflection buffer.
    bpy.ops.object.shade_smooth()
    assign(sph, make_pbr(
        f"mat_metal_r{int(roughness * 100):03d}",
        SPHERE_BASE, metallic=SPHERE_METALLIC, roughness=roughness))
    sphere_obs.append(sph)

# ─── Sphere Probe (probe fallback for SSR blind spots) ────────────────────────
# One probe centred over the array covers all six spheres. When a surface's
# roughness exceeds ssr_max_roughness, EEVEE selects the nearest sphere probe.
# influence_distance must encompass the entire scene; too small → surfaces
# fall back to unlit black rather than the ambient probe.
bpy.ops.object.light_probe_add(type='SPHERE', location=(0, 0, 1.8))
probe = bpy.context.active_object
probe.name = "sphere_probe_centre"
probe.data.influence_distance = FLOOR_HALF * 1.5

# ─── Lighting ──────────────────────────────────────────────────────────────────
for cfg in [
    dict(name="key",  loc=(-2.5, -3.0, 5.0),
         rot=(math.radians(50), 0, math.radians(-30)), energy=KEY_ENERGY),
    dict(name="fill", loc=( 3.5, -1.5, 3.5),
         rot=(math.radians(45), 0, math.radians(40)),  energy=FILL_ENERGY),
]:
    bpy.ops.object.light_add(type='AREA', location=cfg["loc"])
    lt = bpy.context.active_object
    lt.name = f"light_{cfg['name']}"
    lt.rotation_euler = Euler(cfg["rot"], 'XYZ')
    lt.data.energy    = cfg["energy"]
    lt.data.color     = LIGHT_COLOUR
    lt.data.size      = 2.5
    lt.data.use_shadow = True

# ─── Camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -5.0, 1.9))
cam = bpy.context.active_object
cam.name = "camera_main"
cam.data.lens = 50
scene.camera = cam

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0.4, 0.6))
look_at = bpy.context.active_object
look_at.name = "camera_target"
# Track To: camera -Z (view direction) always aims at the look-at empty.
tt = cam.constraints.new('TRACK_TO')
tt.target     = look_at
tt.track_axis = 'TRACK_NEGATIVE_Z'
tt.up_axis    = 'UP_Y'

# ─── GLB export ────────────────────────────────────────────────────────────────
glb_path = bpy.path.abspath(GLB_OUTPUT)
os.makedirs(os.path.dirname(glb_path), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for ob in sphere_obs + [floor_obj, wall_obj]:
    ob.select_set(True)
bpy.context.view_layer.objects.active = sphere_obs[0]
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_materials='EXPORT',
    export_apply=True,
    export_yup=True,
    export_animations=False,
    export_lights=False,
)
print(f"[holoflow] GLB → {glb_path}")
