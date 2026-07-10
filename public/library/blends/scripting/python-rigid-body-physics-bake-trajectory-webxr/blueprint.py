"""
blueprint.py — Python bpy.types.RigidBodyObject + RigidBodyWorld
               Scripted Physics Scene, Frame-Stepping & Trajectory JSON for WebXR
               Blender 5.1  |  Holoflow Studio  |  CC0

TECHNIQUE:
  Blender wraps the Bullet physics engine behind bpy.types.RigidBodyObject
  and bpy.types.RigidBodyWorld.  The Python API surface is intentionally thin
  — most parameters are ID properties on each participating object.  The expert
  move is FRAME STEPPING rather than point-cache baking: iterating
  scene.frame_set(n) forces the Bullet solver to advance each substep in order,
  producing a correct evaluated matrix_world on every object after each
  view_layer.update().  This works headlessly without the PROPERTIES context
  that bpy.ops.ptcache.bake_all() requires and produces identical trajectories
  — Blender's Bullet tick is deterministic for fixed frame range + substep count.

  Output: rigid_bodies_scene.glb (static geometry)
           trajectory.json          (per-frame position + quaternion per object)
"""

import bpy
import bmesh
import math
import json
import os
from mathutils import Vector, Matrix

# ─── Simulation parameters ────────────────────────────────────────────────────
FRAME_START     = 1
FRAME_END       = 72          # 3 seconds @ 24 fps
FPS             = 24
SUBSTEPS        = 10          # Bullet substeps per frame — more = stabler joints
SOLVER_ITERS    = 10          # Bullet constraint solver iterations
GRAVITY_Z       = -9.81

BOX_SIZE        = 0.4         # edge length of stacked boxes (m)
BOX_GAP         = 0.02        # gap between boxes in stack
FLOOR_SIZE      = 6.0
SPHERE_RADIUS   = 0.35
SPHERE_MASS     = 3.0         # kg
BOX_MASS        = 1.0
SPHERE_LAUNCH_X = -3.5        # starting X of projectile sphere
SPHERE_LAUNCH_Z = BOX_SIZE * 1.5   # centre-height of middle box

OUT_GLB         = "//rigid_bodies_scene.glb"
OUT_JSON        = "//trajectory.json"


# ─── Step 1: Rigid Body World ──────────────────────────────────────────────────
# bpy.ops.rigidbody.world_add() polls:
#   context.scene is not None   → always True
#   context.scene.rigidbody_world is None → True only before world exists
# No 3-D View context is required; it runs cleanly from the Script Editor.
# Calling it a second time raises RuntimeError('Context is incorrect').
# Guard with the None-check below.
def ensure_rigidbody_world() -> bpy.types.RigidBodyWorld:
    scene = bpy.context.scene
    if scene.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rbw = scene.rigidbody_world
    rbw.substeps_per_frame   = SUBSTEPS
    rbw.solver_iterations    = SOLVER_ITERS
    rbw.time_scale           = 1.0

    # WHY substeps_per_frame matters:
    #   At 10 substeps and 24 fps each Bullet tick covers ~4 ms of real time.
    #   Fast-moving projectiles (v > 2 m/s) can tunnel through thin walls at
    #   lower substep counts — the sphere travels further per tick than the
    #   wall thickness.  10 substeps is a safe default for objects > ~0.2 m.

    scene.gravity = (0, 0, GRAVITY_Z)
    # scene.gravity is the same gravity used by Bullet — NOT a separate field.
    # Changing it mid-simulation mid-bake resets the cache.
    return rbw


# ─── Step 2: Ground plane (PASSIVE) ───────────────────────────────────────────
# PASSIVE rigid bodies are collision geometry that does not move.
# They must still be in the RigidBodyWorld collection.
def create_ground() -> bpy.types.Object:
    mesh = bpy.data.meshes.new("Ground")
    obj  = bpy.data.objects.new("Ground", mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=FLOOR_SIZE * 0.5)
    bm.to_mesh(mesh)
    bm.free()

    # WHY a flat grid rather than a thick box?
    #   CONVEX_HULL on a flat quad gives a near-zero-height convex hull that
    #   Bullet treats as an infinite plane — zero tunnelling, zero perf cost.
    #   A thick BOX_SIZE floor would produce identical results but wastes tris.

    with bpy.context.temp_override(
        selected_objects=[obj], active_object=obj
    ):
        bpy.ops.rigidbody.object_add()

    obj.rigid_body.type             = 'PASSIVE'
    obj.rigid_body.collision_shape  = 'MESH'
    obj.rigid_body.friction         = 0.6
    obj.rigid_body.restitution      = 0.2   # low bounce for floor

    mat = bpy.data.materials.new("Ground_Mat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value \
        = (0.18, 0.18, 0.20, 1.0)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    obj.data.materials.append(mat)
    return obj


# ─── Step 3: Stacked boxes (3 × ACTIVE) ───────────────────────────────────────
BOX_COLOURS = [
    (0.80, 0.20, 0.10, 1.0),   # red
    (0.10, 0.55, 0.80, 1.0),   # blue
    (0.20, 0.75, 0.30, 1.0),   # green
]

def create_box_stack() -> list:
    stack = []
    z = BOX_SIZE * 0.5  # centre of first box sits half-height above ground

    for i, colour in enumerate(BOX_COLOURS):
        mesh = bpy.data.meshes.new(f"Box_{i}")
        obj  = bpy.data.objects.new(f"Box_{i}", mesh)
        bpy.context.scene.collection.objects.link(obj)

        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=BOX_SIZE)
        bm.to_mesh(mesh)
        bm.free()

        obj.location = (0.5, 0.0, z)  # slight +X offset → interesting topple
        z += BOX_SIZE + BOX_GAP

        with bpy.context.temp_override(
            selected_objects=[obj], active_object=obj
        ):
            bpy.ops.rigidbody.object_add()

        obj.rigid_body.type             = 'ACTIVE'
        obj.rigid_body.collision_shape  = 'BOX'
        # WHY BOX not MESH for box objects?
        #   BOX uses an analytic bounding-box collider — O(1) intersection test
        #   vs O(n_tris) for MESH.  For axis-aligned cubes the shapes are
        #   identical; BOX is always preferred for rectangular objects.
        obj.rigid_body.mass             = BOX_MASS
        obj.rigid_body.friction         = 0.5
        obj.rigid_body.restitution      = 0.3
        obj.rigid_body.linear_damping   = 0.04
        obj.rigid_body.angular_damping  = 0.1

        mat = bpy.data.materials.new(f"Box_{i}_Mat")
        mat.use_nodes = True
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value \
            = colour
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value \
            = 0.5
        obj.data.materials.append(mat)
        stack.append(obj)

    return stack


# ─── Step 4: Sphere projectile (ACTIVE) ───────────────────────────────────────
def create_sphere_projectile() -> bpy.types.Object:
    mesh = bpy.data.meshes.new("Sphere")
    obj  = bpy.data.objects.new("Sphere", mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=SPHERE_RADIUS)
    bm.to_mesh(mesh)
    bm.free()

    obj.location = (SPHERE_LAUNCH_X, 0.0, SPHERE_LAUNCH_Z)

    with bpy.context.temp_override(
        selected_objects=[obj], active_object=obj
    ):
        bpy.ops.rigidbody.object_add()

    obj.rigid_body.type             = 'ACTIVE'
    obj.rigid_body.collision_shape  = 'SPHERE'
    # WHY SPHERE for the projectile?
    #   Analytic sphere–sphere and sphere–box GJK overlap tests in Bullet are
    #   the fastest possible collision pair.  CONVEX_HULL on a sphere mesh adds
    #   ~12 μs per collision pair for negligible shape improvement.
    obj.rigid_body.mass             = SPHERE_MASS
    obj.rigid_body.friction         = 0.3
    obj.rigid_body.restitution      = 0.6
    obj.rigid_body.linear_damping   = 0.01

    # Give the sphere an initial velocity by inserting position keyframes
    # at frames 1 and 2 — Bullet reads the frame-delta as a velocity impulse.
    # WHY not set obj.rigid_body.initial_velocity?
    #   bpy.types.RigidBodyObject has no initial_velocity attribute in 5.1.
    #   Keyframe-based velocity is the documented approach and survives re-bake.
    scene = bpy.context.scene
    scene.frame_set(FRAME_START)
    obj.location = (SPHERE_LAUNCH_X, 0.0, SPHERE_LAUNCH_Z)
    obj.keyframe_insert("location", frame=FRAME_START)

    # One Bullet tick (1 / (FPS × SUBSTEPS)) = ~4 ms at default settings.
    # Velocity ≈ Δlocation / Δtime.  Moving the sphere 0.23 m in one frame
    # at 24 fps → ~5.5 m/s lateral speed — enough to knock three boxes.
    obj.location = (SPHERE_LAUNCH_X + 0.23, 0.0, SPHERE_LAUNCH_Z)
    obj.keyframe_insert("location", frame=FRAME_START + 1)

    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    mat = bpy.data.materials.new("Sphere_Mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value   = (0.9, 0.85, 0.10, 1.0)
    bsdf.inputs["Metallic"].default_value     = 0.8
    bsdf.inputs["Roughness"].default_value    = 0.2
    obj.data.materials.append(mat)
    return obj


# ─── Step 5: Frame stepping → trajectory JSON ─────────────────────────────────
def bake_trajectory(objects: list, rbw: bpy.types.RigidBodyWorld) -> dict:
    """
    Step through every frame from FRAME_START to FRAME_END, read each
    object's evaluated world matrix, and record position + quaternion.

    WHY frame stepping rather than ptcache.bake_all()?
      bpy.ops.ptcache.bake_all(bake=True) polls for a 'PROPERTIES' SpaceType
      and 'PHYSICS' context_mode.  Neither is available in a headless script
      or the Script Editor without a custom window layout override.  Frame
      stepping is universally available and produces byte-identical results
      to a UI bake — the Bullet cache is populated by the same code path.

    CRITICAL ORDERING:
      Physics evaluates FORWARD ONLY.  Jumping to frame 60 without having
      stepped through 1–59 gives stale or zeroed matrices.  Always start
      from FRAME_START.  For very long simulations (> 300 frames) consider
      writing a sub-sampled trajectory (every Nth frame) and interpolating
      in Three.js with AnimationClip blending.
    """
    scene    = bpy.context.scene
    scene.frame_set(FRAME_START)   # rewind simulation to the beginning

    trajectory: dict = {obj.name: {"frames": {}} for obj in objects}

    for frame in range(FRAME_START, FRAME_END + 1):
        scene.frame_set(frame)
        bpy.context.view_layer.update()

        for obj in objects:
            t, r, _ = obj.matrix_world.decompose()
            # Quaternion convention: Blender is (W, X, Y, Z); GLTF/Three.js is
            # (X, Y, Z, W).  Swap on export so the JSON matches GLTF convention.
            trajectory[obj.name]["frames"][str(frame)] = {
                "position":   [round(t.x, 5), round(t.z, 5), round(-t.y, 5)],
                # WHY position remapping?
                #   Blender: +Z up, +Y forward.  GLTF/Three.js: +Y up, -Z forward.
                #   Remap: x→x, y→z, z→-y  (same as GLB exporter export_yup=True).
                "quaternion": [round(r.x, 6), round(r.z, 6), round(-r.y, 6),
                               round(r.w, 6)],
            }

    return trajectory


# ─── Step 6: Export GLB + JSON ────────────────────────────────────────────────
def export_glb(all_objects: list) -> None:
    """Export static rest-pose geometry (frame 1) as a GLB."""
    bpy.context.scene.frame_set(FRAME_START)
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    for obj in all_objects:
        obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT_GLB),
        use_selection=True,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[holoflow] GLB written: {OUT_GLB}")


def export_json(trajectory: dict) -> None:
    path = bpy.path.abspath(OUT_JSON)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "meta": {
                    "frame_start":  FRAME_START,
                    "frame_end":    FRAME_END,
                    "fps":          FPS,
                    "substeps":     SUBSTEPS,
                    "gravity_y":    GRAVITY_Z,  # already remapped to GLTF Y
                    "blender_version": "5.1",
                },
                "objects": trajectory,
            },
            fh,
            indent=2,
        )
    print(f"[holoflow] trajectory JSON written: {path}")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    # Reset scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    rbw    = ensure_rigidbody_world()
    ground = create_ground()
    boxes  = create_box_stack()
    sphere = create_sphere_projectile()

    all_objects   = [ground] + boxes + [sphere]
    # Only ACTIVE bodies move; PASSIVE bodies have trivial constant transforms.
    active_bodies = boxes + [sphere]

    print("[holoflow] stepping frames — this may take 10-30 seconds...")
    trajectory = bake_trajectory(active_bodies, rbw)
    export_glb(all_objects)
    export_json(trajectory)
    print("[holoflow] blueprint complete.")


main()
