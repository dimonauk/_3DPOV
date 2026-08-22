"""
Physics — Rigid Body Dynamics: Domino Chain Topple
Blender 5.1 · CC0 · Holoflow Studio

Technique: Blender 5.1 wraps the Bullet Physics engine (zlib licence, Erwin Coumans)
for rigid body simulation.  Each domino is an ACTIVE rigid body with BOX collision
shape — Bullet uses the object AABB as the collision hull, which is exact for box
primitives and far cheaper than CONVEX_HULL (GJK-EPA O(v) per pair vs. O(v log v)
for convex decomposition).  The chain reaction is seeded by tilting the first domino
12° past its critical tipping angle (≈8.5° for height:thickness = 6.67:1); Bullet
then propagates impulses through all DOMINO_COUNT collisions across SIM_FRAMES.

After simulation the user bakes via Object > Rigid Body > Bake to Keyframes (or
the operator bpy.ops.rigidbody.bake_to_keyframes), which converts the point-cache
trajectories into per-object location/rotation keyframes that glTF-Blender-IO can
write as ANIMATION channels.  This blueprint exports only the frame-1 snapshot GLB
(all dominos standing) because the full bake is too heavy for a headless single pass;
record.py renders without explicit bake — EEVEE evaluates the RB cache
frame-by-frame during animation render, matching the cloth-simulation approach.

Critical tuning:
  substeps_per_frame = 20  — divides the 41.7 ms frame into 2 ms sub-steps;
                             a domino at 2 m/s (typical impact) travels 4 mm per
                             sub-step, well under the 6 mm half-thickness so no
                             tunnelling is possible.
  solver_iterations  = 20  — Projected Gauss-Seidel (PGS) constraint solves per
                             sub-step; 20 is ample for non-stacked objects.
  collision_margin   = 0.002 — Bullet's inward expansion shell; default 0.04 m
                              (4 cm!) is catastrophic for 12 mm thick dominos;
                              must stay well under T/2 = 6 mm.

Outside sources:
  Blender Manual — Rigid Body Physics
    https://docs.blender.org/manual/en/latest/physics/rigid_body/index.html
    CC-BY-SA 4.0 · Blender Foundation
  Bullet Physics SDK (the solver Blender wraps)
    https://github.com/bulletphysics/bullet3
    zlib licence · Erwin Coumans / Google
  glTF-Blender-IO — official Khronos glTF exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
DOMINO_COUNT    = 15          # dominoes in the chain
DOMINO_H        = 0.080       # height (Z), m
DOMINO_W        = 0.040       # width (X, face), m
DOMINO_T        = 0.012       # thickness (Y, standing), m

# Centre-to-centre along Y; gap = SPACING − T = 33 mm.
# Impact reach ≈ DOMINO_H − T/2 = 74 mm >> gap → reliable chain reaction.
CHAIN_SPACING   = 0.045       # m

# First domino tilted negative-X rotation → top moves toward +Y (chain direction).
# Critical angle = arctan(T / DOMINO_H) ≈ 8.5°; 12° ensures immediate topple.
TILT_DEG        = 12.0

FLOOR_SIZE      = 1.4         # floor plane half-extent, m

DOMINO_MASS     = 0.080       # kg — approximates a small hardwood tile
DOMINO_FRICTION = 0.70        # wood-on-wood kinetic friction
DOMINO_BOUNCE   = 0.15        # restitution; wood does not bounce like rubber
DOMINO_MARGIN   = 0.002       # Bullet collision inset (< T/2 = 6 mm)
DOMINO_LIN_DAMP = 0.04        # velocity drag — prevents infinite sliding
DOMINO_ANG_DAMP = 0.08        # angular drag — prevents endless spinning

RB_SUBSTEPS     = 20          # sub-steps per frame
RB_ITERATIONS   = 20          # PGS solver passes per sub-step

SIM_FRAMES      = 120         # 5 s at 24 fps; last domino typically down by frame 90

MAT_IVORY = (0.86, 0.81, 0.72, 1.0)   # even-index dominos
MAT_NAVY  = (0.11, 0.17, 0.30, 1.0)   # odd-index dominos
MAT_FLOOR = (0.55, 0.55, 0.52, 1.0)   # floor plane

EXPORT_GLB_PATH   = "//domino_chain.glb"
EXPORT_BLEND_PATH = "//domino_chain.blend"


# ── Helpers ───────────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)


def make_material(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value  = 0.55
    bsdf.inputs["Metallic"].default_value   = 0.0
    return mat


def make_domino_mesh(name: str, mat: bpy.types.Material) -> bpy.types.Mesh:
    """One mesh data block per colour-variant; shared across all instances of that colour."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)
    return mesh


def _add_rb(obj: bpy.types.Object, rb_type: str) -> None:
    """Set object as active and add rigid body via operator — operator needs active object."""
    bpy.context.view_layer.objects.active = obj
    bpy.ops.rigidbody.object_add(type=rb_type)


# ── Scene building ────────────────────────────────────────────────────────────

def build_floor(mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=FLOOR_SIZE * 2, location=(0.0, 0.0, 0.0))
    floor = bpy.context.active_object
    floor.name = "floor"
    floor.data.materials.append(mat)
    _add_rb(floor, 'PASSIVE')
    # MESH collision for the flat floor gives exact detection at zero cost for a static plane
    floor.rigid_body.collision_shape = 'MESH'
    floor.rigid_body.friction = 0.80
    return floor


def build_dominos(
    mat_ivory: bpy.types.Material,
    mat_navy: bpy.types.Material,
) -> list[bpy.types.Object]:
    mesh_even = make_domino_mesh("domino_mesh_ivory", mat_ivory)
    mesh_odd  = make_domino_mesh("domino_mesh_navy",  mat_navy)
    dominos: list[bpy.types.Object] = []

    for i in range(DOMINO_COUNT):
        mesh = mesh_even if i % 2 == 0 else mesh_odd
        obj  = bpy.data.objects.new(f"domino_{i:02d}", mesh)
        bpy.context.collection.objects.link(obj)

        # Non-uniform scale encodes dimensions; RB uses bounding box so scale ≠ apply
        obj.scale    = Vector((DOMINO_W, DOMINO_T, DOMINO_H))
        # Base centre at Z = DOMINO_H/2 → bottom face flush with floor (Z = 0)
        obj.location = Vector((0.0, i * CHAIN_SPACING, DOMINO_H * 0.5))

        _add_rb(obj, 'ACTIVE')
        rb = obj.rigid_body
        rb.mass             = DOMINO_MASS
        rb.collision_shape  = 'BOX'      # exact for cuboids; cheaper than CONVEX_HULL
        rb.friction         = DOMINO_FRICTION
        rb.restitution      = DOMINO_BOUNCE
        rb.use_margin       = True
        rb.collision_margin = DOMINO_MARGIN   # < T/2 to avoid phantom gaps
        rb.linear_damping   = DOMINO_LIN_DAMP
        rb.angular_damping  = DOMINO_ANG_DAMP
        dominos.append(obj)

    # Negative X rotation: top of standing domino (+Z) moves toward +Y (chain direction)
    # using right-hand rule: positive X rotation sends +Z toward -Y, so negate.
    dominos[0].rotation_euler.x = -math.radians(TILT_DEG)
    return dominos


def add_camera_and_light() -> None:
    chain_len = (DOMINO_COUNT - 1) * CHAIN_SPACING
    mid_y     = chain_len * 0.5
    look_at   = Vector((0.0, mid_y, DOMINO_H * 0.4))

    cam_data = bpy.data.cameras.new("cam_data")
    cam_data.lens = 50
    cam = bpy.data.objects.new("camera", cam_data)
    bpy.context.collection.objects.link(cam)
    # 3/4 view: slightly behind the first domino, above, to the right
    cam.location = Vector((0.8, mid_y - 0.6, 0.42))
    direction    = (look_at - cam.location).normalized()
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam

    # Sun: crisp directional shadows reveal the topple sequence
    bpy.ops.object.light_add(type='SUN', location=(3.0, -2.0, 4.0))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = math.radians(4)   # near-parallel → sharp shadow edges


def configure_rb_world() -> None:
    scene = bpy.context.scene
    if scene.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rbw = scene.rigidbody_world
    rbw.substeps_per_frame  = RB_SUBSTEPS
    rbw.solver_iterations   = RB_ITERATIONS
    rbw.time_scale          = 1.0
    rbw.point_cache.frame_start = 1
    rbw.point_cache.frame_end   = SIM_FRAMES


# ── Export ────────────────────────────────────────────────────────────────────

def export_snapshot_glb() -> None:
    """Frame-1 snapshot: all dominos standing (first one tilted).  No bake needed."""
    bpy.context.scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_GLB_PATH),
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_animations=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_texcoords=True,
        export_normals=True,
    )
    print(f"[holoflow] snapshot GLB → {EXPORT_GLB_PATH}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    scene = bpy.context.scene
    scene.render.fps  = 24
    scene.frame_start = 1
    scene.frame_end   = SIM_FRAMES

    mat_ivory = make_material("mat_ivory", MAT_IVORY)
    mat_navy  = make_material("mat_navy",  MAT_NAVY)
    mat_floor = make_material("mat_floor", MAT_FLOOR)

    build_floor(mat_floor)
    build_dominos(mat_ivory, mat_navy)
    add_camera_and_light()
    configure_rb_world()
    export_snapshot_glb()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(EXPORT_BLEND_PATH))
    print("[holoflow] .blend saved → domino_chain.blend")
    print("[holoflow] To bake animation:  Object > Rigid Body > Bake to Keyframes (1–120)")
    print("[holoflow] Then for video:     blender --background domino_chain.blend --python record.py")


if __name__ == '__main__':
    main()
