"""
blueprint.py — Rigid Body Constraints: Hinge, Motor & Generic Spring (Blender 5.1)
Run: blender --background --python blueprint.py

Technique
---------
Bullet's constraint solver adds equations to the Projected Gauss-Seidel (PGS)
passes that enforce relative-motion limits between two rigid bodies.  Each
constraint lives on a scene Empty whose world position and orientation define
the pivot frame — this is the primary design lever.  Unlike modifiers, there
is no bpy.data path to initialise a RigidBodyConstraint: the subsystem lives
outside the modifier stack and requires bpy.ops.rigidbody.constraint_add() to
register the constraint in the physics world and create the obj.rigid_body_constraint
property.  This blueprint demonstrates three canonical patterns: HINGE (door),
HINGE + MOTOR (pendulum), and GENERIC_SPRING (vertical suspension).
"""

import bpy
import math

# ── parameters ────────────────────────────────────────────────────────────────
FRAME_END        = 120
SUBSTEPS         = 20      # 2 ms sub-step at 24 fps — prevents tunnelling
SOLVER_ITER      = 40      # doubled vs domino tutorial: joint constraints need
                           # more PGS passes to resolve simultaneous contacts

DOOR_W           = 0.04   # door thickness (m)
DOOR_H           = 2.0    # door height (m)
DOOR_LEAF_W      = 0.9    # door leaf width
DOOR_MASS        = 8.0    # kg

PENDULUM_LEN     = 1.2    # pivot-to-bob-centre (m)
PENDULUM_MASS    = 2.0    # kg
MOTOR_VEL        = 3.0    # rad/s target angular velocity (≈ 0.5 rev/s)
MOTOR_IMPULSE    = 5.0    # max impulse per sub-step — caps torque output

SPRING_K         = 300.0  # N/m — stiffness. Critical damping at 10 kg = 2√(300×10)≈110
SPRING_DAMP      = 0.3    # Bullet spring_damping_z: fraction, NOT N·s/m.  0.3 ≈ under-damped
CHASSIS_MASS     = 10.0   # kg
SPRING_REST      = 0.35   # m, vertical rest length

OUTPUT_GLB       = "//constraints_demo_frame60.glb"


# ── helpers ───────────────────────────────────────────────────────────────────

def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


def _add_obj(name, mesh, location=(0, 0, 0), rotation=(0, 0, 0)):
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _make_box(name, dims, location=(0, 0, 0), rotation=(0, 0, 0)):
    me = bpy.data.meshes.new(name + "_mesh")
    bpy.ops.object.select_all(action='DESELECT')
    # Use bpy.ops.mesh.primitive_cube_add then scale to dims
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (dims[0] * 0.5, dims[1] * 0.5, dims[2] * 0.5)
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(scale=True)
    return obj


def _make_sphere(name, radius, location=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=12, ring_count=8)
    obj = bpy.context.active_object
    obj.name = name
    return obj


def _ensure_rbw():
    if bpy.context.scene.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rbw = bpy.context.scene.rigidbody_world
    rbw.substeps_per_frame  = SUBSTEPS
    rbw.solver_iterations   = SOLVER_ITER
    rbw.use_split_impulse   = True  # prevents ghost forces in simultaneous contacts


def _add_rb(obj, rtype='ACTIVE', shape='BOX', mass=1.0, margin=0.001):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.rigidbody.object_add(type=rtype)
    rb = obj.rigid_body
    rb.collision_shape  = shape
    rb.mass             = mass
    rb.use_margin       = True
    rb.collision_margin = margin     # keep well below half the thinnest face
    rb.friction         = 0.5
    rb.restitution      = 0.1


def _add_constraint(empty_name, ctype, pos, body1, body2):
    """
    Place an Empty at `pos` and attach a RigidBodyConstraint of `ctype`.
    The Empty's world transform becomes the pivot frame:
      - HINGE rotates around the Empty's local Z axis
      - GENERIC_SPRING uses local X/Y/Z for each spring channel
    operator context: Empty must be active + scene must have rigidbody_world.
    """
    bpy.ops.object.empty_add(type='ARROWS', location=pos)
    empty = bpy.context.active_object
    empty.name = empty_name
    bpy.ops.rigidbody.constraint_add(type=ctype)
    con = empty.rigid_body_constraint
    con.object1 = body1
    con.object2 = body2
    return con, empty


# ── scene build ───────────────────────────────────────────────────────────────

def build_scene():
    _clear_scene()

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END

    # Render engine for record.py
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.fps    = 24

    _ensure_rbw()

    # ── shared floor ──────────────────────────────────────────────────────────
    floor = _make_box("Floor", (12, 4, 0.1), location=(0, 0, -0.05))
    _add_rb(floor, rtype='PASSIVE', shape='BOX', mass=0)


    # ── SETPIECE A: hinged door ───────────────────────────────────────────────
    # Frame post: passive, at x=-4.5. Door leaf: active, opens +Z rotation.
    # The HINGE pivot Empty sits at the hinge axis (post-to-door edge).
    # HINGE rotates around pivot's Z; here the door swings in the XY plane,
    # so the pivot's local Z must point world-up → no rotation on pivot needed.

    frame_post = _make_box("DoorFrame", (0.1, 0.2, DOOR_H),
                           location=(-4.5, 0, DOOR_H * 0.5))
    _add_rb(frame_post, rtype='PASSIVE', shape='BOX', mass=0)

    door = _make_box("Door", (DOOR_LEAF_W, DOOR_W, DOOR_H),
                     location=(-4.5 + DOOR_LEAF_W * 0.5, 0, DOOR_H * 0.5))
    # Origin must sit at the hinge edge, not door centre — shift mesh verts:
    # bpy.ops approach: set origin to 3D cursor placed at hinge edge
    bpy.ops.object.select_all(action='DESELECT')
    door.select_set(True)
    bpy.context.view_layer.objects.active = door
    bpy.context.scene.cursor.location = (-4.5, 0, DOOR_H * 0.5)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    _add_rb(door, rtype='ACTIVE', shape='BOX', mass=DOOR_MASS)
    door.rigid_body.angular_damping = 0.5  # prevent endless swinging

    hinge_con, _ = _add_constraint(
        "HingePivot", 'HINGE',
        pos=(-4.5, 0, DOOR_H * 0.5),
        body1=frame_post, body2=door
    )
    # Limit door to 0–90° swing around pivot Z axis
    hinge_con.use_limit_ang_z  = True
    hinge_con.limit_ang_z_lower = 0.0
    hinge_con.limit_ang_z_upper = math.radians(90.0)
    # Disable all translational DOF (HINGE already fixes these; explicit for clarity)
    hinge_con.disable_collisions = True   # body1/body2 should not collide with each other

    # Give door an initial push: frame-1 angular velocity injection via keyframe
    door.rigid_body.kinematic = True
    door.keyframe_insert("rigid_body.kinematic", frame=1)
    door.rigid_body.kinematic = False
    door.keyframe_insert("rigid_body.kinematic", frame=2)


    # ── SETPIECE B: motor-driven pendulum ─────────────────────────────────────
    # A HINGE + motor spins the pendulum continuously without limit.
    # motor_ang_max_impulse caps the torque; too low → motor stalls under gravity.
    # too high → instantaneous velocity snap causes solver explosion.

    pivot_post = _make_box("PivotPost", (0.1, 0.1, 0.3),
                           location=(0, 0, 2.6))
    _add_rb(pivot_post, rtype='PASSIVE', shape='BOX', mass=0)

    # Rod as thin box connecting pivot to bob
    rod = _make_box("PendulumRod", (0.03, 0.03, PENDULUM_LEN),
                    location=(0, 0, 2.6 - PENDULUM_LEN * 0.5))
    _add_rb(rod, rtype='ACTIVE', shape='BOX', mass=0.2)

    bob = _make_sphere("PendulumBob", radius=0.12,
                       location=(0, 0, 2.6 - PENDULUM_LEN))
    _add_rb(bob, rtype='ACTIVE', shape='SPHERE', mass=PENDULUM_MASS)

    # FIXED constraint welds rod to bob (they are separate objects for clarity)
    fixed_con, _ = _add_constraint(
        "RodBobFixed", 'FIXED',
        pos=(0, 0, 2.6 - PENDULUM_LEN + 0.12),
        body1=rod, body2=bob
    )
    fixed_con.disable_collisions = True

    motor_con, motor_empty = _add_constraint(
        "MotorPivot", 'HINGE',
        pos=(0, 0, 2.6),
        body1=pivot_post, body2=rod
    )
    # No angle limits — free rotation; motor drives it
    motor_con.use_motor_ang         = True
    motor_con.motor_ang_target_velocity = MOTOR_VEL
    motor_con.motor_ang_max_impulse = MOTOR_IMPULSE
    motor_con.disable_collisions    = True
    # Motor axis = pivot Empty local Z; orient Empty so local Z = world Y to
    # spin pendulum in the XZ plane (visible from front).
    motor_empty.rotation_euler = (math.radians(90), 0, 0)


    # ── SETPIECE C: spring suspension ─────────────────────────────────────────
    # GENERIC_SPRING on a single centre pivot — not four corners — for clarity.
    # All DOF locked except Z translation + Z spring.
    # Bullet's spring_damping is a ratio (0–1), not N·s/m.  Values above 1
    # produce over-damped (no oscillation) behaviour.

    spring_base = _make_box("SpringBase", (1.2, 0.8, 0.05),
                            location=(4.5, 0, 0.025))
    _add_rb(spring_base, rtype='PASSIVE', shape='BOX', mass=0)

    chassis = _make_box("Chassis", (1.0, 0.6, 0.2),
                        location=(4.5, 0, SPRING_REST + 0.1 + 0.1))
    _add_rb(chassis, rtype='ACTIVE', shape='BOX', mass=CHASSIS_MASS)

    spring_con, _ = _add_constraint(
        "SpringPivot", 'GENERIC_SPRING',
        pos=(4.5, 0, SPRING_REST * 0.5),
        body1=spring_base, body2=chassis
    )
    spring_con.disable_collisions = True

    # Lock all DOF except Z translation
    spring_con.use_limit_lin_x = True
    spring_con.limit_lin_x_lower = spring_con.limit_lin_x_upper = 0.0
    spring_con.use_limit_lin_y = True
    spring_con.limit_lin_y_lower = spring_con.limit_lin_y_upper = 0.0
    spring_con.use_limit_ang_x = True
    spring_con.limit_ang_x_lower = spring_con.limit_ang_x_upper = 0.0
    spring_con.use_limit_ang_y = True
    spring_con.limit_ang_y_lower = spring_con.limit_ang_y_upper = 0.0
    spring_con.use_limit_ang_z = True
    spring_con.limit_ang_z_lower = spring_con.limit_ang_z_upper = 0.0

    # Vertical spring — free Z translation with spring restoring force
    spring_con.use_limit_lin_z = False      # Z is the free/sprung axis
    spring_con.use_spring_z    = True
    spring_con.spring_stiffness_z = SPRING_K
    spring_con.spring_damping_z   = SPRING_DAMP

    # ── lighting ──────────────────────────────────────────────────────────────
    bpy.ops.object.light_add(type='SUN', location=(0, -3, 5))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(60), 0, math.radians(30))

    bpy.ops.object.camera_add(location=(0, -8, 3))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(75), 0, 0)
    scene.camera = cam

    # ── save .blend ───────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))


def export_glb():
    """
    Export frame-60 snapshot.  Rigid body point-cache cannot be baked in
    background mode; export the frame-0 rest pose as a structural reference.
    For an animated GLB, call bpy.ops.rigidbody.bake_to_keyframes first.
    """
    bpy.context.scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )


if __name__ == "__main__":
    build_scene()
    export_glb()
    print("✓ constraints_demo.blend + frame-1 GLB written")
