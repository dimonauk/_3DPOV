"""
EEVEE Next — Irradiance Volume + Sphere Probe: Baked Indirect Lighting
Blender 5.1  |  Holoflow Studio library  |  CC0

WHY THIS TECHNIQUE
==================
EEVEE Legacy used a single global irradiance sample for the entire scene, so every
surface received the same diffuse GI regardless of position.  EEVEE Next replaces
that with two probe types that capture local radiance:

  • Irradiance Volume (type='GRID') — stores a voxel grid of L2 spherical harmonics.
    Every grid point captures Lambertian irradiance from 6 cubemap faces.  Diffuse
    surfaces sample the nearest voxels and interpolate; the result matches Cycles
    in softness and colour bleeding for non-specular scenes.

  • Sphere Probe (type='SPHERE') — stores a single HDR cubemap captured from its
    centre.  Metallic and glossy surfaces (Roughness < ~0.5) sample this cubemap
    via PMREM (pre-filtered mip chain).  Without a Sphere Probe every shiny surface
    reflects only the World environment, ignoring the actual room geometry.

Both probes must be BAKED before they show any effect.  An unbaked probe object is
inert — it occupies space but contributes nothing to lighting.  The bake requires an
OpenGL context (EEVEE rasterises the 6 cubemap faces on the GPU), so it cannot be
triggered from a headless bpy invocation.  Run this script to build the scene, then
bake manually: Properties › Render › Indirect Lighting → Bake Indirect Lighting.

SCENE OVERVIEW
==============
A 4 × 4 × 3 m gallery room.  Left wall is bright red, right corner panel is emerald
green — strong colour-bleed subjects.  A chrome sphere sits at centre.  One warm area
light casts indirect colour off the walls; a cooler fill point light adds specular interest.

The Irradiance Volume covers the full room volume at 4 × 4 × 3 voxels.
The Sphere Probe is placed at the chrome sphere's position with influence_distance = 1.2 m.
After baking the chrome sphere correctly reflects both room geometry and the coloured
walls — not just the World sky.
"""

import bpy
import math
from mathutils import Vector

# ── parameters ────────────────────────────────────────────────────────────────

ROOM_W = 4.0          # metres, X
ROOM_D = 4.0          # metres, Y
ROOM_H = 3.0          # metres, Z

SPHERE_RADIUS = 0.30  # chrome sphere radius (m)

# Irradiance Volume resolution (voxels per axis)
IV_RES_X = 4
IV_RES_Y = 4
IV_RES_Z = 3

# Sphere Probe influence radius and clip distances
SP_INFLUENCE  = 1.20   # m — only the chrome sphere and nearby floor are within
SP_FALLOFF    = 0.30   # fraction of influence_distance used for blending
SP_CLIP_START = 0.10
SP_CLIP_END   = 6.0

# Light settings
AREA_ENERGY   = 280.0   # W
FILL_ENERGY   = 90.0    # W
FILL_COLOUR   = (0.55, 0.75, 1.0)  # cool blue fill

# ── helpers ───────────────────────────────────────────────────────────────────

def purge_defaults() -> None:
    """Remove default cube, light, and camera left by Blender's startup scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.lights) + list(bpy.data.cameras):
        bpy.data.batch_remove(ids=[block])


def new_material(name: str, colour: tuple, roughness: float = 0.85,
                 metallic: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value   = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value    = roughness
    bsdf.inputs["Metallic"].default_value     = metallic
    return mat


def add_box_face(name: str, location: tuple, scale: tuple,
                 mat: bpy.types.Material) -> bpy.types.Object:
    """Add a flat quad acting as a room surface (wall / floor / ceiling)."""
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    # Ensure normals face inward (toward scene centre)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode='OBJECT')
    return obj


# ── scene build ───────────────────────────────────────────────────────────────

def build_room() -> None:
    plaster  = new_material("mat_plaster",  (0.90, 0.88, 0.85), roughness=0.92)
    red_wall = new_material("mat_red_wall", (0.85, 0.07, 0.06), roughness=0.88)
    grn_wall = new_material("mat_grn_wall", (0.04, 0.72, 0.26), roughness=0.86)
    floor_m  = new_material("mat_floor",    (0.60, 0.56, 0.48), roughness=0.60)

    hw, hd, hh = ROOM_W / 2, ROOM_D / 2, ROOM_H / 2

    # Floor: Y-up plane at Z=0, scale to room footprint
    add_box_face("room_floor",   (0, 0, 0),   (ROOM_W, ROOM_D, 1), floor_m)

    # Ceiling
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, ROOM_H))
    ceiling = bpy.context.active_object
    ceiling.name = "room_ceiling"
    ceiling.scale = (ROOM_W, ROOM_D, 1)
    bpy.ops.object.transform_apply(scale=True)
    ceiling.data.materials.append(plaster)

    # Back wall (−Y face, oriented toward +Y into scene)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -hd, hh))
    bw = bpy.context.active_object
    bw.name = "room_back_wall"
    bw.rotation_euler = (math.radians(90), 0, 0)
    bw.scale = (ROOM_W, ROOM_H, 1)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    bw.data.materials.append(plaster)

    # Front wall (open for camera — omit for clarity)

    # Left wall — RED (−X face, strong colour bleed test)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-hw, 0, hh))
    lw = bpy.context.active_object
    lw.name = "room_left_wall_red"
    lw.rotation_euler = (0, math.radians(90), 0)
    lw.scale = (ROOM_D, ROOM_H, 1)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    lw.data.materials.append(red_wall)

    # Right corner panel — GREEN (partial coverage, partial plaster)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(hw, 0, hh))
    rw = bpy.context.active_object
    rw.name = "room_right_wall_green"
    rw.rotation_euler = (0, math.radians(-90), 0)
    rw.scale = (ROOM_D, ROOM_H, 1)
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    rw.data.materials.append(grn_wall)


def build_chrome_sphere() -> bpy.types.Object:
    # Low-roughness metallic sphere — primary test subject for Sphere Probe reflections
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=SPHERE_RADIUS, segments=64, ring_count=32, location=(0, 0, SPHERE_RADIUS)
    )
    sphere = bpy.context.active_object
    sphere.name = "chrome_sphere"
    chrome = new_material("mat_chrome", (0.95, 0.95, 0.90), roughness=0.04, metallic=1.0)
    sphere.data.materials.append(chrome)

    # Smooth shading — normals interpolated per-vertex
    bpy.ops.object.shade_smooth()
    return sphere


def build_accent_box() -> bpy.types.Object:
    """A matte diffuse pedestal under the sphere, good diffuse GI receiver."""
    bpy.ops.mesh.primitive_cube_add(size=0.6, location=(0, 0, 0.15))
    ped = bpy.context.active_object
    ped.name = "pedestal"
    ped.scale = (1.0, 1.0, 0.5)
    bpy.ops.object.transform_apply(scale=True)
    stone = new_material("mat_stone", (0.55, 0.52, 0.48), roughness=0.78)
    ped.data.materials.append(stone)
    return ped


def build_lights() -> None:
    # Ceiling area light — warm neutral key
    bpy.ops.object.light_add(type='AREA', location=(0, 0.4, ROOM_H - 0.05))
    key = bpy.context.active_object
    key.name = "light_area_key"
    key.rotation_euler = (0, 0, 0)      # faces down (−Z)
    key.data.energy       = AREA_ENERGY
    key.data.color        = (1.0, 0.95, 0.82)
    key.data.size         = 1.2         # m — softer than a point
    key.data.use_shadow   = True

    # Fill point — cool, behind sphere, adds specular highlight on rim
    bpy.ops.object.light_add(type='POINT', location=(0.6, 1.4, 1.0))
    fill = bpy.context.active_object
    fill.name = "light_point_fill"
    fill.data.energy = FILL_ENERGY
    fill.data.color  = FILL_COLOUR
    fill.data.shadow_soft_size = 0.15


def add_irradiance_volume() -> bpy.types.Object:
    """
    Irradiance Volume at room centre.  Influence covers the full 4×4×3 m room.

    WHY 4×4×3 voxels: one voxel per metre gives adequate diffuse GI resolution
    for a room this size.  Each voxel stores 9 coefficients (L2 SH) capturing
    the irradiance incoming from all directions at that point.  Increasing to
    8×8×6 doubles spatial resolution but quadruples bake time (8 cube-face captures
    per voxel × 4× more voxels).  For a small gallery 4×4×3 is the sweet spot.
    """
    bpy.ops.object.lightprobe_add(
        type='GRID',
        location=(0.0, 0.0, ROOM_H / 2),
    )
    iv = bpy.context.active_object
    iv.name = "irradiance_volume_room"

    # Scale the influence cage to match the room interior
    iv.scale = (ROOM_W / 2, ROOM_D / 2, ROOM_H / 2)
    bpy.ops.object.transform_apply(scale=True)

    d = iv.data
    d.grid_resolution_x = IV_RES_X
    d.grid_resolution_y = IV_RES_Y
    d.grid_resolution_z = IV_RES_Z

    # Clip distances — near clip must be > 0 to avoid self-intersection artefacts
    d.clip_start = 0.10
    d.clip_end   = 10.0

    # Intensity: 1.0 is neutral.  Raise to 1.2 to compensate for probe blending
    # falloff that slightly dims the interior edges.
    d.intensity = 1.0
    d.falloff   = 0.20   # 20% of influence radius used for smooth probe blending

    return iv


def add_sphere_probe() -> bpy.types.Object:
    """
    Sphere Probe centred on the chrome sphere.

    WHY influence_distance = 1.2 m: the chrome sphere has radius 0.30 m.  Setting
    influence to 1.2 m captures the probe's reflection data for the sphere and the
    immediately surrounding pedestal and floor without bleeding in the far red wall
    (1.2 m from centre just clips the wall, so its reflection is faint but present —
    intentional, as the sphere should reflect a hint of the room).

    The SPHERE probe bakes one cubemap from its centre.  Surfaces within influence_distance
    sample this cubemap for their specular reflection.  Outside the influence sphere,
    surfaces fall back to the World environment.  The falloff blends between the two.

    Parallax correction: without it, the sphere's reflection looks correct only at
    the probe's exact position.  For non-planar probes in an interior, set
    custom_parallax = True and adjust parallax_distance to the half-size of the
    room you want to correct.  Here parallax is left at default (= influence sphere
    is also the parallax volume) which gives correct perspective for the chrome ball.
    """
    bpy.ops.object.lightprobe_add(
        type='SPHERE',
        location=(0.0, 0.0, SPHERE_RADIUS),   # at chrome sphere centre
    )
    sp = bpy.context.active_object
    sp.name = "sphere_probe_chrome"

    d = sp.data
    d.influence_distance = SP_INFLUENCE
    d.falloff            = SP_FALLOFF
    d.clip_start         = SP_CLIP_START
    d.clip_end           = SP_CLIP_END

    # custom_parallax=False: use influence sphere as parallax volume (good for
    # isolated objects).  For interior corner rooms set True and set parallax_distance
    # to the room half-diagonal so reflections track the actual wall positions.
    d.custom_parallax = False

    return sp


def configure_eevee() -> None:
    """
    EEVEE Next render settings for best probe quality.

    gi_cubemap_resolution: cubemap resolution per Sphere Probe face.
      '128' — fast bake, adequate for diffuse-dominant scenes.
      '256' — recommended default; handles mid-sized chrome objects.
      '512' — for architectural visualisation with large glossy surfaces.
      '1024'+ — only for stills; bake can take minutes per probe.

    gi_irradiance_pool_size: atlas tile count for the irradiance cache.
      '16'  → 256 irradiance voxels maximum across all scene probes.
      '32'  → 1024 voxels — plenty for a room with 4×4×3 = 48 voxels.

    NOTE: In Blender 5.1 these settings live at
    Properties › Render › Indirect Lighting.
    After setting them, click "Bake Indirect Lighting" to populate the cache.
    The script cannot trigger the bake headlessly — an OpenGL context is required
    because EEVEE rasterises each cubemap face on the GPU.  Run the script first
    to build the scene, then bake via the UI button or the operator shortcut.
    """
    eevee = bpy.context.scene.eevee
    eevee.gi_cubemap_resolution   = '256'
    eevee.gi_irradiance_pool_size = '32'

    # Ambient occlusion enhances the GI read — shadows in crevices near the pedestal
    eevee.use_gtao       = True
    eevee.gtao_distance  = 0.20

    # Max reflection bounce count for EEVEE Next screen-space reflections
    # (probes fill in when SSR misses off-screen geometry)
    eevee.use_ssr        = True
    eevee.ssr_quality    = 0.75

    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(2.8, -3.2, 1.4))
    cam = bpy.context.active_object
    cam.name = "camera_main"
    cam.rotation_euler = (math.radians(75), 0, math.radians(42))
    bpy.context.scene.camera = cam
    cam.data.lens = 35     # mm — natural perspective
    return cam


def export_glb(path: str) -> None:
    """
    Export the scene mesh geometry only — probe bake data does NOT travel in GLB.
    For WebXR, replace the Sphere Probe reflection with a PMREM from an equirectangular
    render: render the scene 360° from the probe's location (Camera type=Panoramic,
    Panorama Type=Equirectangular) → use Three.js PMREMGenerator.fromEquirectangular().
    """
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_yup=True,
    )


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    purge_defaults()
    build_room()
    build_chrome_sphere()
    build_accent_box()
    build_lights()
    add_irradiance_volume()
    add_sphere_probe()
    configure_eevee()
    add_camera()

    bpy.ops.object.select_all(action='DESELECT')
    print("Scene ready.  Open Properties › Render › Indirect Lighting and click")
    print("'Bake Indirect Lighting' to populate the irradiance and sphere probe caches.")
    print("After baking, File › Save to preserve the cache in the .blend file.")


if __name__ == "__main__":
    main()
