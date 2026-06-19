"""
Physics — Cloth Simulation: Flag Banner Blowing in Wind (Blender 5.1)
=====================================================================
Blueprint: author a 32×20-vertex fabric flag, pin the hoist column via
a vertex group, add a Wind force field and a cylindrical pole as a
Collision object, bake 60 frames, apply the deformed mesh at frame 30,
then export a static GLB snapshot and write a looping .blend.

TECHNIQUE OVERVIEW
------------------
Blender's Cloth modifier uses a spring-mass particle system, *not* a
continuous FEM solver.  Each vertex is a mass-point; every edge becomes
a spring with its own stiffness and damping coefficient.  Three spring
types govern the fabric's feel:

  • Tension / Compression  — structural springs along mesh edges.
    Low stiffness → silk; high stiffness → canvas or denim.
  • Shear                  — diagonal springs resisting in-plane shear.
    Drop to 0 → the fabric shears into a parallelogram under load.
  • Bending                — angular springs between face pairs.
    Nearly zero for a real flag (polyester has almost no bending moment);
    raising it to >80 produces a paper effect.

Time-integration uses an implicit (Newmark-β) scheme.  Unlike explicit
Euler, implicit integration is unconditionally stable — it can use large
timesteps without exploding — at the cost of a sparse linear solve per
substep.  `quality` (= substeps per frame) controls accuracy rather than
stability: 8 substeps is sufficient for slow cloth; 20+ is needed when
cloth collides with fast-moving objects.

Pinning is a *mass vertex group*: weight 1.0 = fully static (infinite
effective mass); weight 0.0 = free particle.  Intermediate weights blend
linearly, which lets you create soft anchor zones (spring attachment
points) rather than rigid clamps.

The Wind effector applies a velocity field derived from
  F = ρ × (v_wind − v_cloth)² × A × Cd × n̂
where ρ is air density, A is local face area, Cd is the drag coefficient
(baked into Blender's Air Viscosity setting), and n̂ is the face normal.
The Noise field overlays turbulence via a Perlin octave stack, giving the
chaotic, non-repeating ripple that distinguishes cloth from a rigid
surface animated by a wave modifier.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Named constants ────────────────────────────────────────────────────────────
GRID_W          = 2.0    # flag width  (metres, fly direction)
GRID_H          = 1.2    # flag height (metres)
GRID_SEGS_X     = 32     # subdivisions along width
GRID_SEGS_Y     = 20     # subdivisions along height
PIN_GROUP       = "pin_col"

CLOTH_MASS      = 0.15   # kg/m²  — lightweight polyester
TENSION_K       = 15.0   # N/m    — tension / compression stiffness
SHEAR_K         = 5.0    # N/m    — shear stiffness
BEND_K          = 0.5    # N/m    — bending stiffness (very low for a flag)

WIND_STRENGTH   = 8.0    # force field strength
WIND_NOISE      = 2.5    # turbulence overlay
WIND_SEED       = 42     # reproducible noise seed

POLE_RADIUS     = 0.03   # flag pole radius
POLE_HEIGHT     = 1.6    # pole height (> GRID_H to clear the top)

BAKE_FRAMES     = 60     # total simulation frames to bake
SNAPSHOT_FRAME  = 30     # frame at which to sample the frozen-mesh GLB

OUTPUT_BLEND    = "//cloth_flag_banner.blend"
OUTPUT_GLB      = "//cloth_flag_banner.glb"


# ── 0. Clean scene ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for block in list(bpy.data.meshes) + list(bpy.data.objects):
    try:
        bpy.data.meshes.remove(block, do_unlink=True)
    except Exception:
        pass


# ── 1. Build the flag mesh with bmesh ─────────────────────────────────────────
#
# A regular bpy.ops.mesh.primitive_grid_add would work, but bmesh lets us
# read exact vertex coordinates without any floating-point ambiguity caused by
# object-space vs world-space transforms — important for pinning.
#
# Convention: hoist edge at X=0, fly edge at X=GRID_W.
# Flag hangs vertically: Y=0, Z=0 → Z=GRID_H.
# After creation we set origin to geometry centre, then translate to world
# so the hoist column sits at X=0.

me = bpy.data.meshes.new("flag")
bm = bmesh.new()

dx = GRID_W / GRID_SEGS_X
dz = GRID_H / GRID_SEGS_Y

verts = []
for zi in range(GRID_SEGS_Y + 1):
    row = []
    for xi in range(GRID_SEGS_X + 1):
        v = bm.verts.new(Vector((xi * dx, 0.0, zi * dz)))
        row.append(v)
    verts.append(row)

for zi in range(GRID_SEGS_Y):
    for xi in range(GRID_SEGS_X):
        bm.faces.new([
            verts[zi][xi],
            verts[zi][xi + 1],
            verts[zi + 1][xi + 1],
            verts[zi + 1][xi],
        ])

bm.to_mesh(me)
bm.free()
me.update()

flag_obj = bpy.data.objects.new("flag_banner", me)
bpy.context.scene.collection.objects.link(flag_obj)
flag_obj.location = Vector((-0.01, 0.0, 0.2))  # tiny X gap avoids z-fight with pole


# ── 2. Vertex group for pin (hoist column, xi == 0) ───────────────────────────
#
# Pinning works through the "Vertex Group Mass" slot on ClothSettings.
# Weight 1.0 = fully pinned; 0.0 = free.  We assign weight 1.0 to every
# vertex in the leftmost column (xi == 0, i.e. x ≈ 0 before the object offset).
#
pg = flag_obj.vertex_groups.new(name=PIN_GROUP)

col_vert_indices = []
for zi in range(GRID_SEGS_Y + 1):
    vi = verts[zi][0].index
    col_vert_indices.append(vi)

pg.add(col_vert_indices, 1.0, 'REPLACE')


# ── 3. Flag material ───────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name="flag_cotton_red")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.85, 0.1, 0.05, 1.0)  # deep crimson
    bsdf.inputs["Roughness"].default_value   = 0.75   # matte cotton weave
    bsdf.inputs["Metallic"].default_value    = 0.0
flag_obj.data.materials.append(mat)


# ── 4. Cloth modifier ─────────────────────────────────────────────────────────
cloth_mod = flag_obj.modifiers.new(name='Cloth', type='CLOTH')
cs = cloth_mod.settings          # ClothSettings
cc = cloth_mod.collision_settings  # ClothCollisionSettings

# Material ––– flag-weight polyester
cs.mass                  = CLOTH_MASS
cs.tension_stiffness     = TENSION_K
cs.compression_stiffness = TENSION_K
cs.shear_stiffness       = SHEAR_K
cs.bending_stiffness     = BEND_K

# Zero damping: we let the wind noise provide all pseudo-dissipation.
cs.tension_damping    = 0.0
cs.compression_damping = 0.0
cs.shear_damping      = 0.0
cs.bending_damping    = 0.0

# Structural quality: 16 substeps per frame (24fps scene = 384 cloth substeps/s)
# This is enough for a lightweight flag with no fast-moving colliders.
cs.quality = 16

# Air viscosity provides global velocity damping against the rest frame of the world.
# At 1.0 cloth reaches terminal velocity near the wind speed; 0 = vacuum (no damping).
cs.air_damping = 1.0

# Pin group – the ClothSettings.vertex_group_mass slot binds pinning.
cs.vertex_group_mass = PIN_GROUP

# Self-collision: prevents the flag from interpenetrating itself when a strong
# gust folds it back.  The BVH self-check is expensive; disable if scene is slow.
cc.use_self_collision    = True
cc.self_distance_min     = 0.005  # 5 mm minimum self-separation

# Object collision
cc.use_collision        = True
cc.collision_quality    = 4       # substeps per frame dedicated to collision response


# ── 5. Flag pole (Collision object) ───────────────────────────────────────────
#
# The pole must carry a Collision modifier so the cloth solver registers it.
# Without the modifier, the cloth passes straight through the geometry.
# The pole's origin is at Z=0, pole extends from Z=−0.1 (below floor) to Z=POLE_HEIGHT.
#
bpy.ops.mesh.primitive_cylinder_add(
    radius=POLE_RADIUS,
    depth=POLE_HEIGHT + 0.1,
    location=(0.0, 0.0, POLE_HEIGHT / 2.0 - 0.05),
    vertices=16,
)
pole = bpy.context.active_object
pole.name = "flag_pole"

pole_mat = bpy.data.materials.new(name="pole_metal")
pole_mat.use_nodes = True
pole_bsdf = pole_mat.node_tree.nodes.get("Principled BSDF")
if pole_bsdf:
    pole_bsdf.inputs["Base Color"].default_value = (0.7, 0.7, 0.72, 1.0)
    pole_bsdf.inputs["Metallic"].default_value   = 1.0
    pole_bsdf.inputs["Roughness"].default_value  = 0.25
pole.data.materials.append(pole_mat)

col_mod = pole.modifiers.new(name='Collision', type='COLLISION')
# Thin shell: cloth may not reach the exact mesh surface due to the outer
# thickness padding, so set both to minimal values for a hard pole.
col_mod.settings.thickness_inner = 0.003
col_mod.settings.thickness_outer = 0.003
col_mod.settings.cloth_friction  = 0.08   # minimal friction (smooth metal pole)


# ── 6. Ground plane (Collision) ───────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=6.0, location=(1.5, 0.0, 0.0))
ground = bpy.context.active_object
ground.name = "ground"
gnd_col = ground.modifiers.new(name='Collision', type='COLLISION')
gnd_col.settings.thickness_outer = 0.002
gnd_col.settings.cloth_friction  = 0.65


# ── 7. Wind Force Field ────────────────────────────────────────────────────────
#
# Wind applies a directional force aligned with the object's local -Z axis
# (blowing in world +Y when the effector is default-oriented and rotation is
# 90° on X).  We set rotation so the wind blows in the +X direction
# (perpendicular to the hoist, across the fly edge of the flag).
#
bpy.ops.object.effector_add(type='WIND', location=(0.0, -2.0, GRID_H / 2.0))
wind = bpy.context.active_object
wind.name = "wind_field"
wind.rotation_euler = (math.radians(90), 0.0, math.radians(90))
# Rotation Euler (90°, 0°, 90°) → local -Z points in world +X direction.

wind.field.strength       = WIND_STRENGTH
wind.field.noise          = WIND_NOISE
wind.field.seed           = WIND_SEED
wind.field.use_global_coords = True  # noise pattern moves with world not object


# ── 8. Scene / timeline settings ──────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = BAKE_FRAMES
scene.render.fps  = 24


# ── 9. Point cache location ───────────────────────────────────────────────────
#
# By default, caches land in /tmp/blendcache_<name>/ which is wiped on reboot.
# Set use_library_path=True so the cache follows the .blend file instead.
# This allows the .blend to be opened on another machine with the cache intact.
#
cache = cloth_mod.point_cache
cache.frame_start  = 1
cache.frame_end    = BAKE_FRAMES
cache.use_library_path = True  # cache in blendcache_<file>/ beside the .blend


# ── 10. BAKE ──────────────────────────────────────────────────────────────────
#
# ptcache.bake_all requires a 3D viewport or Properties area context.
# Run this block from the Script Editor in Blender's UI (not headless).
#
# If running from CLI with bpy, use:
#   bpy.ops.ptcache.free_bake_all()     # clear previous bake first
#   for scene in bpy.data.scenes:
#       for obj in scene.objects:
#           for mod in obj.modifiers:
#               if mod.type == 'CLOTH':
#                   override = {'scene': scene, 'active_object': obj, 'point_cache': mod.point_cache}
#                   with bpy.context.temp_override(**override):
#                       bpy.ops.ptcache.bake(bake=True)
#
# In the Script Editor, the simpler call works:
print("▶  Baking cloth simulation — this may take 30–90 seconds …")
try:
    with bpy.context.temp_override(active_object=flag_obj):
        bpy.ops.ptcache.bake_all(bake=True)
    print("   Bake complete.")
except Exception as exc:
    print(f"   Bake via operator skipped ({exc}).")
    print("   ↳  Open the Physics Properties panel and press 'Bake' manually.")


# ── 11. Extract frozen GLB snapshot at SNAPSHOT_FRAME ─────────────────────────
#
# Strategy: jump to the snapshot frame so the cloth modifier evaluates,
# apply the modifier to get a static mesh, export that mesh, then undo
# so the dynamic .blend is preserved.
#
scene.frame_set(SNAPSHOT_FRAME)
bpy.context.view_layer.update()

# Duplicate flag, apply cloth modifier on the duplicate, export
bpy.ops.object.select_all(action='DESELECT')
flag_obj.select_set(True)
bpy.context.view_layer.objects.active = flag_obj

bpy.ops.object.duplicate()
frozen = bpy.context.active_object
frozen.name = "flag_frozen"

try:
    with bpy.context.temp_override(active_object=frozen):
        bpy.ops.object.modifier_apply(modifier='Cloth')
    print(f"   Cloth modifier applied on 'flag_frozen' at frame {SNAPSHOT_FRAME}.")
except Exception as exc:
    print(f"   Could not apply cloth modifier: {exc}")

# Apply transforms to match studio convention (+Y up, applied)
bpy.ops.object.select_all(action='DESELECT')
frozen.select_set(True)
pole.select_set(True)
bpy.context.view_layer.objects.active = frozen
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)
print(f"   Exported → {OUTPUT_GLB}")

# Delete the frozen copy to keep the .blend file clean
bpy.ops.object.delete()

# Save the live animated .blend
bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
print(f"   Saved  → {OUTPUT_BLEND}")
