# blueprint.py — Python bpy.types.Light
# Scripted 3-Point Lighting Rig: Key Area / Fill Disk / Rim Spot
# EEVEE Next Light Groups, Shadow Settings & light_rig.json for WebXR
# Blender 5.1 — Holoflow Studio
#
# Technique: bpy.data.lights.new(name, type) creates a Light data-block
# independent of any operator or active-object context. Three light types
# build the classic 3-point portrait rig: a wide AREA RECTANGLE key,
# a AREA DISK fill on the opposite side, and a narrow SPOT from behind for
# rim separation. Each object is parented to a shared Empty pivot so the
# entire rig can be rotated around the subject by animating one transform.
#
# EEVEE Next Light Groups partition render output into per-source passes so
# each light can be re-balanced in the compositor without a re-render, and
# the per-group baked textures can be recombined in a Three.js WebXR runtime.
#
# Outputs: subject_sphere.glb (lit subject placeholder), light_rig.json

import bpy
import math
import json
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
SUBJECT_RADIUS   = 1.0           # bounding-sphere radius of the lit subject (m)
RIG_PIVOT        = Vector((0.0, 0.0, 0.0))

# Key — large warm RECTANGLE, 45° above-right
KEY_ENERGY       = 800.0         # watts (total power emitted into hemisphere)
KEY_COLOR        = (1.00, 0.95, 0.85)
KEY_SIZE_X       = 1.20          # width  (m)
KEY_SIZE_Y       = 0.60          # height (m) — only used for RECTANGLE/ELLIPSE
KEY_AZ_DEG       = 45.0          # horizontal angle from front (+Y axis)
KEY_EL_DEG       = 40.0          # vertical elevation
KEY_DIST         = SUBJECT_RADIUS * 5.0

# Fill — soft cool DISK, opposite side, lower energy
FILL_ENERGY      = 300.0
FILL_COLOR       = (0.82, 0.88, 1.00)
FILL_RADIUS      = 0.90          # disk radius (m); size = radius for DISK/ELLIPSE
FILL_AZ_DEG      = 225.0         # 45° past opposite front
FILL_EL_DEG      = 20.0
FILL_DIST        = SUBJECT_RADIUS * 5.5

# Rim — narrow SPOT from behind-above for silhouette separation
RIM_ENERGY       = 550.0
RIM_COLOR        = (0.92, 0.97, 1.00)
RIM_CONE_DEG     = 28.0          # full cone angle in degrees
RIM_BLEND        = 0.12          # penumbra fraction 0=hard, 1=Gaussian
RIM_SHADOW_RAD   = 0.06          # apparent source radius for SPOT shadow softness
RIM_AZ_DEG       = 175.0         # almost directly behind
RIM_EL_DEG       = 55.0
RIM_DIST         = SUBJECT_RADIUS * 4.5

OUTPUT_JSON      = "//light_rig.json"
OUTPUT_GLB       = "//subject_sphere.glb"

# ── Scene reset ──────────────────────────────────────────────────────────────
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for ld in list(bpy.data.lights):
    bpy.data.lights.remove(ld, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me, do_unlink=True)

col   = bpy.context.scene.collection
scene = bpy.context.scene

# ── Spherical → Cartesian (Blender axes) ────────────────────────────────────
# az=0 = looking toward +Y (forward); positive az = clockwise from above (+X).
# el=0 = horizontal; el=90 = directly above.
def sph(az_deg, el_deg, dist, pivot=RIG_PIVOT):
    az = math.radians(az_deg)
    el = math.radians(el_deg)
    x  =  dist * math.sin(az) * math.cos(el)
    y  = -dist * math.cos(az) * math.cos(el)
    z  =  dist * math.sin(el)
    return pivot + Vector((x, y, z))

# ── make_light helper ────────────────────────────────────────────────────────
def make_light(name, ltype, energy, color, location, look_at=RIG_PIVOT):
    ld = bpy.data.lights.new(name=name, type=ltype)
    ld.energy    = energy
    ld.color     = color
    ld.use_shadow = True

    obj = bpy.data.objects.new(name, ld)
    col.objects.link(obj)
    obj.location = location

    # Orient so the light's -Z axis points at look_at (standard Blender convention)
    direction       = (look_at - location).normalized()
    rot_quat        = direction.to_track_quat('-Z', 'Y')
    obj.rotation_euler = rot_quat.to_euler()
    return obj, ld

# ── Rig parent Empty ─────────────────────────────────────────────────────────
rig = bpy.data.objects.new("LightRig_3Point", None)
rig.empty_display_type = 'SPHERE'
rig.empty_display_size = SUBJECT_RADIUS * 0.2
rig.location           = RIG_PIVOT
col.objects.link(rig)

# ── KEY light — AREA RECTANGLE ──────────────────────────────────────────────
key_obj, key_ld = make_light(
    "Key_Area", 'AREA', KEY_ENERGY, KEY_COLOR, sph(KEY_AZ_DEG, KEY_EL_DEG, KEY_DIST)
)
key_ld.shape  = 'RECTANGLE'  # SQUARE/RECTANGLE/DISK/ELLIPSE
key_ld.size   = KEY_SIZE_X   # size = X for RECTANGLE
key_ld.size_y = KEY_SIZE_Y   # size_y = Y — only valid for RECTANGLE/ELLIPSE; ignored for SQUARE/DISK
# CRITICAL: AREA shadow penumbra comes from the physical size (size, size_y).
# light.shadow_soft_size has NO effect on AREA type — only on POINT and SPOT.
# A 1.2 × 0.6 m panel at 5 m subtends ~14° — soft wrap without full wash-out.
key_ld.spread = math.radians(160)
# spread: angular half-cone of area emission; π=hemisphere, π/2=directional panel.
# Reducing spread below 120° concentrates energy like a Fresnel attachment.

# ── FILL light — AREA DISK ───────────────────────────────────────────────────
fill_obj, fill_ld = make_light(
    "Fill_Disk", 'AREA', FILL_ENERGY, FILL_COLOR, sph(FILL_AZ_DEG, FILL_EL_DEG, FILL_DIST)
)
fill_ld.shape  = 'DISK'       # DISK and SQUARE use size as radius/half-side
fill_ld.size   = FILL_RADIUS  # radius for DISK
fill_ld.spread = math.radians(150)

# ── RIM light — SPOT ─────────────────────────────────────────────────────────
rim_obj, rim_ld = make_light(
    "Rim_Spot", 'SPOT', RIM_ENERGY, RIM_COLOR, sph(RIM_AZ_DEG, RIM_EL_DEG, RIM_DIST)
)
rim_ld.spot_size       = math.radians(RIM_CONE_DEG)
# spot_size is the FULL cone angle in radians — THREE.SpotLight.angle expects the
# half-angle, so divide by 2 when writing the JSON.
rim_ld.spot_blend      = RIM_BLEND
# spot_blend 0.0 = perfectly hard edge; 1.0 = full Gaussian falloff to zero at edge
rim_ld.shadow_soft_size = RIM_SHADOW_RAD
# shadow_soft_size = apparent radius of the light source for SPOT/POINT shadow calc.
# This controls penumbra width. AREA lights ignore this — they use physical size.

# ── Parent lights to rig Empty ───────────────────────────────────────────────
for lo in (key_obj, fill_obj, rim_obj):
    lo.parent = rig
    # matrix_parent_inverse must be set to the INVERSE of the parent's current world
    # matrix at the time of parenting. Without this the child jumps to the parent's
    # origin on the next depsgraph evaluation — the most common light-rig bug.
    lo.matrix_parent_inverse = rig.matrix_world.inverted()

# ── Light Groups — EEVEE Next multi-pass output ──────────────────────────────
# LightGroups partition the render into per-source diffuse/glossy passes.
# Each pass is a separate EXR layer; compositor can rebalance without a re-render.
vl = scene.view_layers[0]
for group_name in ('key', 'fill', 'rim'):
    # vl.lightgroups.new(name=...) — note .new(), not .add().
    # Duplicate names raise a RuntimeError: check for existence first.
    if group_name not in {lg.name for lg in vl.lightgroups}:
        vl.lightgroups.new(name=group_name)

key_obj.lightgroup  = 'key'
fill_obj.lightgroup = 'fill'
rim_obj.lightgroup  = 'rim'

# Enable the diffuse/glossy direct passes that carry lightgroup data
vl.use_pass_diffuse_direct = True
vl.use_pass_glossy_direct  = True

# ── EEVEE Next scene settings ─────────────────────────────────────────────────
scene.render.engine = 'BLENDER_EEVEE_NEXT'
# 'BLENDER_EEVEE' is legacy EEVEE; 'BLENDER_EEVEE_NEXT' is the rewritten engine
# available from Blender 4.2+. Light Groups only work in EEVEE Next.
scene.eevee.use_shadows = True

# ── Subject placeholder ──────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(radius=SUBJECT_RADIUS, location=RIG_PIVOT)
subject         = bpy.context.active_object
subject.name    = "LitSubject"
subject["holoflow:facet"] = False   # smooth normals for lighting tests

mat = bpy.data.materials.new("subject_grey")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.65, 0.65, 0.65, 1.0)
bsdf.inputs["Roughness"].default_value  = 0.50
subject.data.materials.append(mat)

# ── Export subject GLB ───────────────────────────────────────────────────────
for o in scene.objects:
    o.select_set(False)
subject.select_set(True)
bpy.context.view_layer.objects.active = subject

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_apply=True,
    export_normals=True,
    export_materials='EXPORT',
)

# ── Export light_rig.json for Three.js WebXR ─────────────────────────────────
# Axis remap: Blender (x, y, z) → Three.js (x, z, -y)
# Blender +Y = forward into scene; Three.js +Z = forward into screen.
def bl_to_three(v):
    return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]

rig_data = {
    "schema": "holoflow_light_rig_v1",
    "rig_name": "3PointRig",
    "lights": [
        {
            "name": key_obj.name,
            "type": "RectAreaLight",
            "lightgroup": "key",
            "energy_watts": KEY_ENERGY,
            "color_linear": list(KEY_COLOR),
            "width_m": KEY_SIZE_X,
            "height_m": KEY_SIZE_Y,
            "position_threejs": bl_to_three(key_obj.location),
        },
        {
            "name": fill_obj.name,
            "type": "RectAreaLight",
            "lightgroup": "fill",
            "energy_watts": FILL_ENERGY,
            "color_linear": list(FILL_COLOR),
            "width_m": FILL_RADIUS * 2.0,   # Three.js RectAreaLight uses full width
            "height_m": FILL_RADIUS * 2.0,
            "position_threejs": bl_to_three(fill_obj.location),
        },
        {
            "name": rim_obj.name,
            "type": "SpotLight",
            "lightgroup": "rim",
            "energy_watts": RIM_ENERGY,
            "color_linear": list(RIM_COLOR),
            "angle_rad": rim_ld.spot_size * 0.5,   # Three.js expects half-angle
            "penumbra": RIM_BLEND,
            "position_threejs": bl_to_three(rim_obj.location),
        },
    ],
}

with open(bpy.path.abspath(OUTPUT_JSON), 'w') as fp:
    json.dump(rig_data, fp, indent=2)

print("subject_sphere.glb and light_rig.json written.")
print("3-point rig ready — run record.py for viewport animation.")
