"""
Shader: Subsurface Scattering — Stylised Skin
==============================================
Principled BSDF v2  ·  Random Walk Skin  ·  Multi-region SSS
VRM-ready anime skin with ear translucency glow
Blender 5.1  ·  Category: shading  ·  Licence: CC0

Subsurface scattering models light that penetrates a translucent surface,
travels some distance inside scattering off cellular structures, and exits
at a different point.  Skin is the canonical example: light enters at the
nose tip and glows through the septum cartilage; held-up fingers glow red
because haemoglobin in the dermis absorbs blue/green but lets red pass.

Blender 5.1 (Principled BSDF v2) exposes SSS via six sub-parameters:

  Subsurface Weight   — blend factor 0→1 from pure diffuse to full SSS
  Subsurface Radius   — (R,G,B) mean free path in scene units.  Red longest
                        (haemoglobin absorbs blue), blue shortest.
  Subsurface Scale    — global multiplier.  1 unit = 1 m in Blender; a head
                        modelled at 0.2 m needs Scale ≈ 0.06.
  Subsurface IOR      — refractive index of tissue (skin ≈ 1.4).
  Subsurface Aniso    — Henyey-Greenstein g.  0 = isotropic.
  Subsurface Method   — BURLEY: fast diffusion approx, underestimates thin
                        geometry.  RANDOM_WALK: unbiased path tracing inside
                        mesh.  RANDOM_WALK_SKIN: best for thin regions (ears,
                        nostrils) — traces to geometry boundary, so thin
                        shells exit early and glow correctly.

WHY RANDOM_WALK_SKIN beats BURLEY for characters:
  Burley's diffusion profile assumes the object is optically infinite from
  the sample point.  Thin geometry (pinna cartilage ~1 mm; nasal septum
  ~2 mm) terminates earlier than the diffusion profile expects, so Burley
  produces grey instead of the warm red that photographers call "pinna glow".
  Random Walk traces actual photon paths through the mesh; a thin ear shell
  is exited in a few bounces and the exit point IS the glow.

Stylised (anime) tuning vs photorealistic:
  Photorealistic skin uses Subsurface Weight ≈ 0.3 and keeps the base colour
  close to real albedo (8–14 % reflectance, ~(0.78,0.56,0.46) sRGB for fair
  skin).  Anime skin pushes Weight to 0.5–0.7, brightens the base to a more
  saturated peach, and increases the Sheen Weight to produce the soft velvet
  highlight visible on anime cheeks.  The Sheen lobe simulates micro-fibre
  surface texture (fine hair and dead skin cells), which reads as the
  characteristic bloom on a stylised close-up shot.

Scene in this blueprint:
  ─ HEAD mesh: subdivided UV sphere, skin material (face region)
  ─ EAR meshes: two flattened icospheres, ear material (higher SSS weight)
  ─ LIP RING: flattened torus at mouth position, lip material
  ─ THREE-POINT LIGHTING: key (warm), rim (cool blue), fill (neutral)
  ─ HDRI background: grey 0.2 for neutral evaluation
  ─ CAMERA: 85mm-equiv field of view portrait frame
"""

import bpy
import bmesh
import math
from mathutils import Vector, Euler

# ── SCENE UNITS (all in metres) ─────────────────────────────────────────────
HEAD_RADIUS      = 0.105    # 21 cm diameter ≈ human head
EAR_SCALE        = (0.028, 0.048, 0.072)  # flat oval pinna
EAR_OFFSET_X     = HEAD_RADIUS + 0.008    # just outside head sphere
LIP_MAJOR_R      = 0.048
LIP_MINOR_R      = 0.010
LIP_OFFSET_Z     = -0.028   # below head centre

# ── SSS MATERIAL PARAMETERS ─────────────────────────────────────────────────
# Subsurface Radius values are in scene units BEFORE Scale multiplication.
# Scale = 0.06 → effective MFP = Radius × 0.06.
# At Scale 0.06: (1.0,0.42,0.25) → effective (60mm, 25mm, 15mm) → anime range.

SKIN_BASE        = (0.98, 0.82, 0.72, 1.0)
SKIN_SSS_WT      = 0.55
SKIN_RADIUS      = (1.00, 0.42, 0.25)   # R deep, G mid, B shallow
SKIN_SCALE       = 0.06
SKIN_IOR         = 1.40
SKIN_ROUGHNESS   = 0.42
SKIN_SPECULAR_WT = 0.06
SKIN_SHEEN_WT    = 0.18
SKIN_SHEEN_ROUGH = 0.40

EAR_BASE         = (0.90, 0.65, 0.60, 1.0)
EAR_SSS_WT       = 0.90    # pinna is thin → push translucency high
EAR_RADIUS       = (1.50, 0.55, 0.22)
EAR_ROUGHNESS    = 0.50

LIP_BASE         = (0.85, 0.50, 0.52, 1.0)
LIP_SSS_WT       = 0.75
LIP_RADIUS       = (1.20, 0.38, 0.18)
LIP_ROUGHNESS    = 0.30

# ── LIGHT PARAMETERS ────────────────────────────────────────────────────────
KEY_ENERGY       = 1200.0
KEY_COLOUR       = (1.00, 0.96, 0.88)
KEY_LOC          = (0.55, -0.65, 0.40)
RIM_ENERGY       = 600.0
RIM_COLOUR       = (0.80, 0.88, 1.00)
RIM_LOC          = (-0.60, 0.30, 0.35)
FILL_ENERGY      = 300.0
FILL_LOC         = (0.20, 0.80, 0.10)

RENDER_ENGINE    = 'CYCLES'   # CYCLES for accurate SSS; EEVEE_NEXT works in 5.1
RENDER_SAMPLES   = 64
EXPORT_PATH      = "//sss_skin.glb"


def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in bpy.data.collections:
        bpy.data.collections.remove(c)


def make_skin_mat(name, base, sss_wt, radius, roughness=0.42, sheen_wt=0.0):
    """Build a Principled BSDF v2 material with SSS cluster wired."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (400, 0)

    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    # Subsurface Method: RANDOM_WALK_SKIN for thin-geometry accuracy
    bsdf.subsurface_method = 'RANDOM_WALK_SKIN'

    bsdf.inputs['Base Color'].default_value      = base
    bsdf.inputs['Roughness'].default_value       = roughness
    bsdf.inputs['Specular IOR Level'].default_value = SKIN_SPECULAR_WT
    bsdf.inputs['Subsurface Weight'].default_value  = sss_wt
    bsdf.inputs['Subsurface Radius'].default_value  = radius
    bsdf.inputs['Subsurface Scale'].default_value   = SKIN_SCALE
    bsdf.inputs['Subsurface IOR'].default_value     = SKIN_IOR
    if sheen_wt > 0:
        bsdf.inputs['Sheen Weight'].default_value      = sheen_wt
        bsdf.inputs['Sheen Roughness'].default_value   = SKIN_SHEEN_ROUGH

    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


def build_head():
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32, ring_count=24, radius=HEAD_RADIUS, location=(0, 0, 0)
    )
    head = bpy.context.active_object
    head.name = "head"
    # Smooth shading — SSS needs smooth normals to avoid facet banding
    bpy.ops.object.shade_smooth()
    skin_mat = make_skin_mat(
        "skin_face", SKIN_BASE, SKIN_SSS_WT, SKIN_RADIUS,
        roughness=SKIN_ROUGHNESS, sheen_wt=SKIN_SHEEN_WT
    )
    head.data.materials.append(skin_mat)
    return head


def build_ear(side=1):
    """side=+1 → right ear, side=-1 → left ear."""
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=3, radius=1.0, location=(side * EAR_OFFSET_X, 0, 0)
    )
    ear = bpy.context.active_object
    ear.name = f"ear_{'R' if side > 0 else 'L'}"
    ear.scale = EAR_SCALE
    # Flatten the ear: compress Y (front-back) relative to X,Z
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.shade_smooth()
    ear_mat = make_skin_mat(
        f"skin_ear_{'R' if side > 0 else 'L'}",
        EAR_BASE, EAR_SSS_WT, EAR_RADIUS, roughness=EAR_ROUGHNESS
    )
    ear.data.materials.append(ear_mat)
    return ear


def build_lips():
    bpy.ops.mesh.primitive_torus_add(
        major_radius=LIP_MAJOR_R,
        minor_radius=LIP_MINOR_R,
        major_segments=32,
        minor_segments=12,
        location=(0, -HEAD_RADIUS * 0.82, LIP_OFFSET_Z),
    )
    lips = bpy.context.active_object
    lips.name = "lips"
    # Torus is vertical by default; rotate to face forward
    lips.rotation_euler = Euler((math.radians(90), 0, 0))
    bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.object.shade_smooth()
    lip_mat = make_skin_mat(
        "skin_lips", LIP_BASE, LIP_SSS_WT, LIP_RADIUS, roughness=LIP_ROUGHNESS
    )
    lips.data.materials.append(lip_mat)
    return lips


def add_light(name, light_type, location, energy, colour):
    bpy.ops.object.light_add(type=light_type, location=location)
    light = bpy.context.active_object
    light.name = name
    light.data.energy = energy
    light.data.color = colour
    # Area lights wrap the cheek light more softly than Point
    if light_type == 'AREA':
        light.data.size = 0.35
    return light


def setup_camera():
    bpy.ops.object.camera_add(location=(0, -0.45, 0.04))
    cam = bpy.context.active_object
    cam.name = "portrait_camera"
    # 85mm equiv on full-frame = 28.3° vertical FoV
    cam.data.lens = 85
    cam.data.sensor_width = 36
    # Point camera at head centre
    cam.rotation_euler = Euler((math.radians(90), 0, 0))
    bpy.context.scene.camera = cam
    return cam


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = RENDER_ENGINE
    if RENDER_ENGINE == 'CYCLES':
        scene.cycles.samples = RENDER_SAMPLES
        # Subsurface scattering needs enough bounces; default 128 is fine
        scene.cycles.use_denoising = True
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 1280


def export_glb():
    # Select all mesh objects (lights/camera excluded by default)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        use_selection=True,
        export_apply=True,            # apply scale/rotation
        export_materials='EXPORT',
        export_textures=False,        # no image textures in this shader
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def main():
    reset_scene()

    # World: neutral grey HDRI-equivalent — plain grey background
    bpy.context.scene.world = bpy.data.worlds.new("neutral_world")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.04, 0.04, 0.04, 1.0)
        bg.inputs['Strength'].default_value = 0.8

    build_head()
    build_ear(side=1)
    build_ear(side=-1)
    build_lips()

    # Three-point lighting — key is Area for soft cheek wrapping
    add_light("key_light",  'AREA',  KEY_LOC,  KEY_ENERGY,  KEY_COLOUR)
    add_light("rim_light",  'POINT', RIM_LOC,  RIM_ENERGY,  RIM_COLOUR)
    add_light("fill_light", 'POINT', FILL_LOC, FILL_ENERGY, (1, 1, 1))

    setup_camera()
    configure_render()
    export_glb()
    print("SSS skin blueprint complete — save as sss_skin.blend, render to verify.")


if __name__ == "__main__":
    main()
