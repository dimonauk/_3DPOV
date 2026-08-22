"""
Physics — Rigid Body Dynamics: Domino Chain + Brick-Wall Collapse
Blender 5.1  ·  CC0  ·  Holoflow Studio

TECHNIQUE:
  Blender's rigid body system wraps Bullet 2.x (discrete-timestep sequential-
  impulse solver).  Each substep Bullet: (1) advances velocities via symplectic
  Euler, (2) generates contact manifolds via GJK/EPA narrow-phase detection,
  (3) projects impulses onto the constraint manifold until convergence, (4) updates
  positions.  Symplectic Euler conserves energy better than explicit Euler — a
  stack of bricks stays stable for hundreds of frames without drifting upward.

  Domino chain condition: the tip of a falling domino must sweep past the CoG of
  the next domino before the first domino hits the floor.  For height H and depth
  D the tip travels H horizontally when fully fallen.  Chain propagates if:
      gap < H − D/2
  With H=0.10 m, D=0.02 m → max reliable gap = 0.09 m.  We use 0.068 m
  (68 % of H) — a comfortable 24 % safety margin against rotational damping loss.

  Brick running bond: even rows offset by BRICK_W/2.  This interlocks courses and
  makes the collapse more energetic — corner bricks drag their row-mates sideways.

Outside sources:
  - Blender Manual: Rigid Body Simulation (CC-BY-SA 4.0, Blender Foundation)
    https://docs.blender.org/manual/en/latest/physics/rigid_body/index.html
  - bulletphysics/bullet3 physics engine source (zlib licence, Erwin Coumans)
    https://github.com/bulletphysics/bullet3
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
DOM_H       = 0.10   # domino height (m)
DOM_W       = 0.04   # domino face width (m)
DOM_D       = 0.02   # domino thickness (m)  — depth along chain axis
DOM_COUNT   = 16     # number of dominoes in the chain
DOM_SPACING = 0.068  # centre-to-centre gap along X axis — see chain condition above
DOM_TILT    = 15.0   # degrees: first domino tilted past balance point (min ~11.3°)
DOM_MASS    = 0.025  # kg per domino (25 g — typical plastic game domino)

BRICK_H     = 0.025  # brick height (m)
BRICK_W     = 0.06   # brick width (m)   — dimension along wall face
BRICK_D     = 0.03   # brick depth (m)   — dimension into the wall
BRICK_ROWS  = 4      # courses of brick
BRICK_COLS  = 6      # bricks per row (before running-bond offset clipping)
BRICK_MASS  = 0.4    # kg per brick (scaled; real standard brick ≈ 2 kg)
BRICK_GAP   = 0.002  # mortar joint gap (m) — prevents z-fighting on contact

WALL_DIST   = DOM_SPACING * DOM_COUNT + 0.04  # X coord of wall front face

SUBSTEPS    = 20     # physics substeps/frame — 20 is safe for 10 cm objects @ 24 fps
SOLVER_ITERS = 20    # constraint solver iterations — higher = stiffer stacks

FRAME_END   = 120    # 5 s @ 24 fps
OUTPUT_BLEND = "//domino_chain.blend"

# ── Scene reset ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = 24
scene.gravity     = Vector((0.0, 0.0, -9.81))

# ── Rigid body world ───────────────────────────────────────────────────────────
bpy.ops.rigidbody.world_add()
rbw = scene.rigidbody_world
rbw.substeps_per_frame = SUBSTEPS
rbw.solver_iterations  = SOLVER_ITERS
# use_split_impulse prevents "ghost impulses" when stacked objects drift apart
# slightly between substeps — critical for brick stacks; negligible perf cost.
rbw.use_split_impulse  = True
rbw.time_scale         = 1.0


# ── Materials ─────────────────────────────────────────────────────────────────
def make_material(name: str, base_color: tuple, roughness: float = 0.6) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value  = roughness
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


mat_floor   = make_material("floor_concrete", (0.55, 0.52, 0.48), 0.85)
mat_domino  = make_material("domino_plastic",  (0.05, 0.05, 0.08), 0.30)
mat_brick   = make_material("brick_clay",      (0.72, 0.35, 0.20), 0.75)


# ── Floor (passive rigid body) ─────────────────────────────────────────────────
bpy.ops.mesh.primitive_plane_add(size=6.0)
floor = bpy.context.active_object
floor.name = "floor"
floor.location = Vector((DOM_SPACING * DOM_COUNT * 0.5, 0.0, 0.0))
floor.data.materials.append(mat_floor)

with bpy.context.temp_override(selected_objects=[floor], active_object=floor):
    bpy.ops.rigidbody.object_add()
floor.rigid_body.type            = "PASSIVE"
# MESH collision shape for the floor: exact match to the flat plane.
# For convex or irregular passive surfaces CONVEX_HULL is fine; for a flat
# plane MESH and BOX both degenerate to the same contact normals.
floor.rigid_body.collision_shape = "MESH"
floor.rigid_body.friction        = 0.75   # rough concrete
floor.rigid_body.restitution     = 0.05   # minimal bounce off concrete


# ── Helper: add active rigid body ─────────────────────────────────────────────
def add_active_rb(
    obj: bpy.types.Object,
    shape: str = "BOX",
    mass: float = 1.0,
    friction: float = 0.5,
    restitution: float = 0.05,
) -> None:
    """
    Attach an ACTIVE rigid body to obj via bpy.ops with temp_override.
    Shape choices for cuboids:
      BOX         — fastest; Bullet constructs an AABB in local space; exact for
                    axis-aligned boxes with origin at CoG.
      CONVEX_HULL — GJK/EPA support mapping; correct for non-rectilinear shapes;
                    4–8× slower than BOX for the same result on a domino/brick.
      MESH        — not permitted on ACTIVE bodies in Blender 5.1 (Bullet restriction:
                    mesh collision on dynamic objects is undefined; only statics allowed).
    Origin MUST be at object's geometric centre (i.e. CoG for uniform density).
    Off-centre origins cause the simulation to rotate around the wrong pivot —
    the most common rigid body debugging surprise.
    """
    with bpy.context.temp_override(selected_objects=[obj], active_object=obj):
        bpy.ops.rigidbody.object_add()
    rb = obj.rigid_body
    rb.type             = "ACTIVE"
    rb.collision_shape  = shape
    rb.mass             = mass
    rb.friction         = friction
    rb.restitution      = restitution
    rb.linear_damping   = 0.04   # air resistance; 0.04 ≈ free-fall to 98 % terminal v
    rb.angular_damping  = 0.10   # rotational air drag; prevents perpetual spinning


# ── Dominoes ───────────────────────────────────────────────────────────────────
def make_domino_mesh() -> bpy.types.Mesh:
    verts = [
        (-DOM_W/2, -DOM_D/2,  0.0),
        ( DOM_W/2, -DOM_D/2,  0.0),
        ( DOM_W/2,  DOM_D/2,  0.0),
        (-DOM_W/2,  DOM_D/2,  0.0),
        (-DOM_W/2, -DOM_D/2,  DOM_H),
        ( DOM_W/2, -DOM_D/2,  DOM_H),
        ( DOM_W/2,  DOM_D/2,  DOM_H),
        (-DOM_W/2,  DOM_D/2,  DOM_H),
    ]
    faces = [
        (0,1,2,3), (4,5,6,7),
        (0,1,5,4), (2,3,7,6),
        (0,3,7,4), (1,2,6,5),
    ]
    mesh = bpy.data.meshes.new("domino")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh


dom_mesh = make_domino_mesh()

for i in range(DOM_COUNT):
    obj = bpy.data.objects.new(f"domino_{i:02d}", dom_mesh)
    scene.collection.objects.link(obj)

    x = i * DOM_SPACING
    # Z: origin is at base of domino (z=0). CoG is at z = DOM_H/2.
    # We raise the object so its bottom face sits on the floor (z=0).
    obj.location = Vector((x, 0.0, 0.0))

    # Shift origin to CoG before adding rigid body.
    # from_pydata placed vertices with z=0..DOM_H; geometric centre is DOM_H/2.
    # We do not use bpy.ops.object.origin_set here because it triggers depsgraph
    # and is context-sensitive. Instead, translate mesh vertices by -DOM_H/2 z,
    # then place object at z = DOM_H/2 so bottom is still on floor.
    for v in obj.data.vertices:
        v.co.z -= DOM_H / 2.0
    obj.location.z = DOM_H / 2.0

    obj.data.materials.append(mat_domino)

    if i == 0:
        # Tilt past the tipping angle (arctan(D/H/2) ≈ 11.3°) so Bullet drives it down.
        # 15° is 33 % beyond tipping — enough to overcome static friction immediately.
        obj.rotation_euler.x = math.radians(DOM_TILT)

    bpy.context.view_layer.objects.active = obj
    add_active_rb(obj, shape="BOX", mass=DOM_MASS, friction=0.45, restitution=0.08)


# ── Brick wall ─────────────────────────────────────────────────────────────────
def make_brick_mesh() -> bpy.types.Mesh:
    hw = BRICK_W / 2 - BRICK_GAP / 2
    hd = BRICK_D / 2 - BRICK_GAP / 2
    hh = BRICK_H / 2 - BRICK_GAP / 2
    verts = [
        (-hw, -hd, -hh), ( hw, -hd, -hh),
        ( hw,  hd, -hh), (-hw,  hd, -hh),
        (-hw, -hd,  hh), ( hw, -hd,  hh),
        ( hw,  hd,  hh), (-hw,  hd,  hh),
    ]
    faces = [
        (0,1,2,3), (4,5,6,7),
        (0,1,5,4), (2,3,7,6),
        (0,3,7,4), (1,2,6,5),
    ]
    mesh = bpy.data.meshes.new("brick")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh


brick_mesh = make_brick_mesh()

for row in range(BRICK_ROWS):
    # Running bond: odd rows shift by half a brick width.
    offset = (BRICK_W / 2.0) if (row % 2 == 1) else 0.0
    wall_x = WALL_DIST + BRICK_D / 2.0   # front face at WALL_DIST, origin centred
    z      = BRICK_H / 2.0 + row * BRICK_H   # CoG height for this course

    for col in range(BRICK_COLS):
        bx = col * BRICK_W + offset - (BRICK_COLS * BRICK_W) / 2.0 + BRICK_W / 2.0
        obj = bpy.data.objects.new(f"brick_r{row}_c{col}", brick_mesh)
        scene.collection.objects.link(obj)
        obj.location = Vector((wall_x, bx, z))
        obj.data.materials.append(mat_brick)
        bpy.context.view_layer.objects.active = obj
        add_active_rb(obj, shape="BOX", mass=BRICK_MASS, friction=0.60, restitution=0.02)


# ── Camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 35.0
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
# Side-on angle: slightly above and to the right so the chain runs left→right.
cam.location       = Vector((DOM_SPACING * DOM_COUNT * 0.5, -1.80, 0.22))
look_at            = Vector((WALL_DIST * 0.5, 0.0, 0.08))
cam.rotation_euler = (look_at - cam.location).to_track_quat("-Z", "Y").to_euler()

# ── Key light ──────────────────────────────────────────────────────────────────
sun_data   = bpy.data.lights.new("Sun", "SUN")
sun_data.energy  = 3.0
sun_data.angle   = math.radians(4)
sun_obj    = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.location       = Vector((0.5, -2.5, 4.0))
sun_obj.rotation_euler = (math.radians(55), 0.0, math.radians(20))

# ── Render settings ────────────────────────────────────────────────────────────
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.resolution_percentage = 100

# ── Bake note ──────────────────────────────────────────────────────────────────
# After running this script, bake the simulation:
#   Scene Properties → Rigid Body World → Cache → Bake All
# Or via Python:
#   with bpy.context.temp_override(scene=scene):
#       bpy.ops.ptcache.bake_all(bake=True)
# Baking is required for record.py OpenGL rendering to show animated physics.
print("Blueprint complete. Save as domino_chain.blend, then bake before recording.")
