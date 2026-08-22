"""
Shader — Principled Hair BSDF · Stylised VRM Hair
Blender 5.1 · CC0 · Holoflow Studio

Technique: the Principled Hair BSDF (Blender 4.0+, implements Chiang et al. 2016)
models light scattering inside a cylindrical hair strand through three lobes:
  R   — specular reflection off the outer cuticle surface.
  TT  — transmission through the cortex (backlit transparency).
  TRT — double-transmission glint: enters, reflects off the back wall, exits.
Each lobe is physically positioned along the strand by the cuticle tilt (Offset).
Using Melanin=0 + Tint overrides the pigment with any cartoon colour while
preserving the physically accurate highlight positioning from the lobe model.

Outside sources:
  Blender Manual — Principled Hair BSDF
    https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/hair_principled.html
    CC-BY-SA 4.0 · Blender Documentation Team
  pbrt-v4 — reference implementation of Chiang 2016 hair scattering
    https://github.com/mmp/pbrt-v4
    Apache-2.0 · Matt Pharr, Wenzel Jakob, Greg Humphreys
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
HAIR_COUNT    = 300          # strand count (use 5 000+ for final Cycles renders)
HAIR_LENGTH   = 0.22         # strand length in metres
HAIR_STEP     = 5            # segments per strand (more = smoother curl)
TINT          = (0.03, 0.45, 0.92, 1.0)  # anime-blue override (linear sRGB)
MELANIN       = 0.0          # 0=white/blonde, 1=black — 0 lets Tint dominate
MELANIN_RED   = 0.30         # 0=cool ash, 1=warm copper
IOR           = 1.55         # hair cortex refractive index (standard human hair)
ROUGHNESS     = 0.12         # longitudinal roughness — 0.12 = silk/anime gloss
RADIAL_ROUGH  = 0.30         # azimuthal roughness — higher wraps shadow further
COAT          = 0.35         # clear coat; models silicone products / wet look
RANDOM_COLOR  = 0.04         # per-strand melanin variation (keep low for anime)
RANDOM_ROUGH  = 0.08         # per-strand roughness variation
OFFSET_DEG    = -3.0         # highlight offset; −3° matches real cuticle tilt
HEAD_R        = 0.12         # head sphere radius (metres)
KEY_ENERGY    = 600.0        # key light watts
BACK_ENERGY   = 1200.0       # back light watts — brighter to reveal TRT glint
FILL_ENERGY   = 100.0        # fill light watts
SEED          = 42
GLB_PATH      = "//vrm_hair.glb"
BLEND_PATH    = "//vrm_hair.blend"

# ── Scene reset ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.name = "vrm_hair_scene"
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.render.film_transparent = True

# ── Scalp hemisphere ──────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=HEAD_R, segments=16, ring_count=10, location=(0, 0, 0))
scalp = bpy.context.active_object
scalp.name = "vrm_scalp"

# Delete the lower hemisphere — keep only z > −HEAD_R * 0.05 (ear ring retained)
bm = bmesh.new()
bm.from_mesh(scalp.data)
bm.faces.ensure_lookup_table()
del_faces = [f for f in bm.faces if f.calc_center_median().z < -HEAD_R * 0.05]
bmesh.ops.delete(bm, geom=del_faces, context='FACES')
bm.to_mesh(scalp.data)
bm.free()
scalp.data.update()

# ── Scalp material ────────────────────────────────────────────────────────────
scalp_mat = bpy.data.materials.new("Scalp")
scalp_mat.use_nodes = True
pbsdf_s = scalp_mat.node_tree.nodes.get("Principled BSDF")
if pbsdf_s:
    pbsdf_s.inputs["Base Color"].default_value = (0.92, 0.81, 0.74, 1.0)
    pbsdf_s.inputs["Roughness"].default_value  = 0.58
scalp.data.materials.append(scalp_mat)  # slot 0

# ── Principled Hair BSDF material ────────────────────────────────────────────
# ShaderNodeBsdfHairPrincipled: separate from ShaderNodeBsdfPrincipled.
# The lobe model (R / TT / TRT) is physically distinct from a surface BSDF
# — it operates on the assumption the mesh represents cylindrical strands.
hair_mat = bpy.data.materials.new("VRM_Hair")
hair_mat.use_nodes = True
nt = hair_mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
out_n.location = (450, 0)
hair_n = nt.nodes.new("ShaderNodeBsdfHairPrincipled")
hair_n.location = (0, 0)

# MELANIN parametrisation: Melanin=0 (fully bleached) lets the Tint colour
# take full control. The highlight positions computed by the lobe model still
# behave physically — only the pigment absorption is overridden.
hair_n.parametrization                         = 'MELANIN'
hair_n.inputs["Melanin"].default_value         = MELANIN
hair_n.inputs["Melanin Redness"].default_value = MELANIN_RED
hair_n.inputs["Tint"].default_value            = TINT
hair_n.inputs["IOR"].default_value             = IOR
# Longitudinal roughness: scattering along the strand axis. 0.12 = glossy
# anime hair. Increase to 0.4+ for realistic curly hair.
hair_n.inputs["Roughness"].default_value        = ROUGHNESS
# Radial roughness: scattering around the strand circumference. Controls
# how far the TT and TRT lobes spread sideways.
hair_n.inputs["Radial Roughness"].default_value = RADIAL_ROUGH
hair_n.inputs["Coat"].default_value             = COAT
hair_n.inputs["Random Color"].default_value     = RANDOM_COLOR
hair_n.inputs["Random Roughness"].default_value = RANDOM_ROUGH
# Offset shifts the R lobe highlight. Real cuticle scales tilt ~2–3° toward the
# root, which places the highlight slightly below the specular peak of a smooth
# cylinder. Negative offset = toward root = natural positioning.
hair_n.inputs["Offset"].default_value           = math.radians(OFFSET_DEG)

nt.links.new(hair_n.outputs[0], out_n.inputs["Surface"])
scalp.data.materials.append(hair_mat)  # slot 1 — material index 2 (1-based)

# ── Particle system hair ──────────────────────────────────────────────────────
mod  = scalp.modifiers.new("Hair_PS", 'PARTICLE_SYSTEM')
ps   = scalp.particle_systems[-1]
ps.seed = SEED
pset = ps.settings
pset.type             = 'HAIR'
pset.count            = HAIR_COUNT
pset.hair_length      = HAIR_LENGTH
pset.hair_step        = HAIR_STEP
pset.render_type      = 'PATH'
pset.use_advanced_hair = True
pset.material         = 2          # 1-based → slot 1 → hair_mat
pset.display_percentage = 25       # full count only at Cycles render time
pset.kink             = 'CURL'
pset.kink_amplitude   = 0.015      # slight curl for anime volume
pset.kink_frequency   = 2.5

# ── 3-point lighting ──────────────────────────────────────────────────────────
# Back light is intentionally brighter than key: the TRT lobe peaks when
# light exits from behind the strand toward the camera (rim/glint effect).
def _light(name, energy, loc, ltype='POINT'):
    d = bpy.data.lights.new(name, ltype)
    d.energy = energy
    if ltype == 'AREA':
        d.size = 0.6
    obj = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    return obj

_light("Key",  KEY_ENERGY,  Vector(( 0.35, -0.55, 0.45)), 'AREA')
_light("Fill", FILL_ENERGY, Vector((-0.40, -0.25, 0.20)), 'POINT')
back_l = _light("Back", BACK_ENERGY, Vector((0.0, 0.50, 0.25)), 'SPOT')
back_l.data.spot_size  = math.radians(50)
back_l.data.spot_blend = 0.25
back_l.rotation_euler  = (math.radians(100), 0.0, 0.0)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_d      = bpy.data.cameras.new("Camera")
cam_d.lens = 85.0   # telephoto: flatter perspective, flattering for hair
cam_obj    = bpy.data.objects.new("Camera", cam_d)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location       = Vector((0.0, -0.40, 0.08))
cam_obj.rotation_euler = (math.radians(82), 0.0, 0.0)
scene.camera = cam_obj

# ── Save blend ────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))

# ── GLB export ────────────────────────────────────────────────────────────────
# The Principled Hair BSDF has no glTF equivalent — it exports as a plain
# opaque material. For WebXR the production path is:
#   1. Groom strands → render-bake each hair row to a transparent PNG atlas.
#   2. Apply the atlas to flat ribbon planes (hair cards) facing the camera.
#   3. Export the hair-card planes as standard GLB with KHR_materials_unlit.
# This blueprint exports the scalp mesh as the structural GLB; the README
# walks the hair-card bake step.
bpy.ops.object.select_all(action='DESELECT')
scalp.select_set(True)
bpy.context.view_layer.objects.active = scalp
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(GLB_PATH),
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_normals=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
)
print("vrm_hair.glb exported (scalp mesh; see README for hair-card bake step).")
