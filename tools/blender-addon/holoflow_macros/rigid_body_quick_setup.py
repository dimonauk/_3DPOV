"""
holoflow_macros — rigid_body_quick_setup
Blender 5.1  ·  CC0  ·  Holoflow Studio

Utility helpers for rigid body setup; removes boilerplate from production scripts.
Import this module from any blueprint.py:
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from rigid_body_quick_setup import ensure_rbw, add_active_rb, add_passive_rb
"""

import bpy


def ensure_rbw(
    scene: bpy.types.Scene | None = None,
    substeps: int = 20,
    solver_iters: int = 20,
    use_split_impulse: bool = True,
    time_scale: float = 1.0,
) -> bpy.types.RigidBodyWorld:
    """
    Ensure the scene has a RigidBodyWorld with studio-safe defaults.
    Creates one if absent.  Returns the world object.

    substeps:         Physics substeps per frame.  20 is safe for objects
                      ≥ 5 cm.  Use 40+ for fast small objects (bullets, BB).
    solver_iters:     Constraint solver passes.  20 prevents stacks drifting.
                      Above 50 gives diminishing returns.
    use_split_impulse: Prevents ghost forces when stacked bodies separate
                      slightly between substeps.  Always True for stacked geometry.
    """
    if scene is None:
        scene = bpy.context.scene
    if scene.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rbw = scene.rigidbody_world
    rbw.substeps_per_frame = substeps
    rbw.solver_iterations  = solver_iters
    rbw.use_split_impulse  = use_split_impulse
    rbw.time_scale         = time_scale
    return rbw


def add_active_rb(
    obj: bpy.types.Object,
    shape: str = "BOX",
    mass: float = 1.0,
    friction: float = 0.5,
    restitution: float = 0.05,
    linear_damping: float = 0.04,
    angular_damping: float = 0.10,
) -> bpy.types.RigidBodyObject:
    """
    Add an ACTIVE rigid body to obj.  Origin must already be at CoG.

    shape choices:
      'BOX'         — fastest; axis-aligned bounding box in local space.
      'CONVEX_HULL' — GJK/EPA; use for non-box convex shapes (gems, bolts).
      'SPHERE'      — cheapest possible; correct for spheres/balls.
      'CAPSULE'     — for cylinders and organic limb proxies.
    MESH is NOT valid on ACTIVE bodies (Bullet limitation in Blender 5.1).
    """
    with bpy.context.temp_override(selected_objects=[obj], active_object=obj):
        bpy.ops.rigidbody.object_add()
    rb                  = obj.rigid_body
    rb.type             = "ACTIVE"
    rb.collision_shape  = shape
    rb.mass             = mass
    rb.friction         = friction
    rb.restitution      = restitution
    rb.linear_damping   = linear_damping
    rb.angular_damping  = angular_damping
    return rb


def add_passive_rb(
    obj: bpy.types.Object,
    shape: str = "MESH",
    friction: float = 0.75,
    restitution: float = 0.05,
) -> bpy.types.RigidBodyObject:
    """
    Add a PASSIVE rigid body to obj (static collision surface).
    MESH shape is valid here — exact collision for flat floors, walls, terrain.
    """
    with bpy.context.temp_override(selected_objects=[obj], active_object=obj):
        bpy.ops.rigidbody.object_add()
    rb                  = obj.rigid_body
    rb.type             = "PASSIVE"
    rb.collision_shape  = shape
    rb.friction         = friction
    rb.restitution      = restitution
    return rb
