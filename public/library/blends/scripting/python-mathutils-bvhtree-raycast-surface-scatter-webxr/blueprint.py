# python-mathutils-bvhtree-raycast-surface-scatter-webxr/blueprint.py
# Blender 5.1 — mathutils.BVHTree: Ray-Cast Surface Scatter + Collision Proxy for WebXR
#
# TECHNIQUE: Build an accelerated BVH tree from the evaluated (post-modifier)
# mesh of a target object.  Fire inward rays from a Fibonacci-spiral hemisphere
# of sample origins.  Collect hit locations + normals, orient small props at
# each site, then derive a convex-hull collision proxy from the hit-point cloud.
# Export two GLBs: scatter_result.glb (props on surface) + collision_proxy.glb
# (single low-poly mesh for WebXR hit-testing).
#
# WHY BVH OVER GN INSTANCE-ON-POINTS:
#   GN scatter is GPU-side, non-destructive, and fast to preview — but opaque
#   to Python at script time.  BVHTree gives you the exact world-space location
#   + normal for every hit, enabling downstream logic: audio trigger zones,
#   per-prop LOD metadata, procedural UV offsets, or proximity culling.
#
# WHY FIBONACCI HEMISPHERE:
#   Uniform (theta, phi) grids cluster samples at the poles.  A golden-ratio
#   Fibonacci spiral distributes N points near-uniformly across the hemisphere,
#   which reduces unsampled shadow regions on concave surfaces.

import bpy
import bmesh
import mathutils
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import math
import random

# ── parameters ──────────────────────────────────────────────────────────────
TARGET_NAME       = "ScatterTarget"   # evaluated mesh to scatter onto
PROP_NAME         = "ScatterProp"     # source prop duplicated at each hit site
N_HEMISPHERE_RAYS = 120               # per-hemisphere; total rays = 2× this
RAY_ORIGIN_SCALE  = 2.2               # ray origins at radius × this factor
SEED              = 42
NORMAL_Z_MIN      = math.cos(math.radians(75))  # reject near-horizontal normals
EXPORT_SCATTER    = "//scatter_result.glb"
EXPORT_PROXY      = "//collision_proxy.glb"

random.seed(SEED)


# ── geometry helpers ─────────────────────────────────────────────────────────

def fibonacci_hemisphere(n: int) -> list:
    """Return n unit vectors distributed near-uniformly over the upper hemisphere.

    Golden-angle Fibonacci spiral (phi = π(3 − √5)).  y runs from 1 (north
    pole) to 0 (equator); r = √(1 − y²) gives the XZ radius at each latitude.
    All returned vectors have z >= 0.
    """
    phi = math.pi * (3.0 - math.sqrt(5.0))
    vecs = []
    for i in range(n):
        y = 1.0 - (i / max(n - 1, 1))  # 1 → 0
        r = math.sqrt(max(0.0, 1.0 - y * y))
        t = phi * i
        vecs.append(Vector((math.cos(t) * r, math.sin(t) * r, y)))
    return vecs


def orient_to_normal(normal: Vector) -> Matrix:
    """3×3 rotation matrix that maps +Z onto *normal*.

    Uses Vector.rotation_difference() (quaternion) instead of Matrix.Rotation()
    (axis-angle) because rotation_difference handles the degenerate case where
    normal ≈ -Z cleanly (returns a 180° flip); Matrix.Rotation with a zero-
    length cross product would produce NaN.
    """
    up = Vector((0.0, 0.0, 1.0))
    if (normal.normalized() - up).length_squared < 1e-10:
        return Matrix.Identity(3)
    return up.rotation_difference(normal.normalized()).to_matrix()


# ── scene builders ───────────────────────────────────────────────────────────

def make_target(name: str) -> bpy.types.Object:
    """Subdivided UV sphere + Displace modifier — a lumpy surface to scatter onto."""
    if name in bpy.data.objects:
        return bpy.data.objects[name]
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
    ob = bpy.context.active_object
    ob.name = name
    # Displace gives the sphere organic bumps; BVH evaluates these bumps.
    tex = bpy.data.textures.new("BumpTex", "CLOUDS")
    tex.noise_scale = 0.45
    disp = ob.modifiers.new("Bump", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.25
    disp.mid_level = 0.5
    return ob


def make_prop(name: str, size: float = 0.04) -> bpy.types.Object:
    """Icosphere prop (ico, 0 subdivisions = octahedron-ish) as scatter unit."""
    if name in bpy.data.objects:
        return bpy.data.objects[name]
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=0, radius=size)
    me = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.hide_viewport = True   # source hidden; instances will be visible
    ob.hide_render = True
    return ob


# ── main ────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    target = make_target(TARGET_NAME)
    prop_source = make_prop(PROP_NAME)

    # Depsgraph is required for BVHTree.FromObject — it cannot be None in 5.1.
    # Passing None would raise TypeError; the evaluated copy applies Displace.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(target, depsgraph)

    # Build full-sphere directions: upper + lower hemisphere
    upper = fibonacci_hemisphere(N_HEMISPHERE_RAYS)
    directions = upper + [Vector((v.x, v.y, -v.z)) for v in upper]

    bounding_r = max(target.dimensions) * 0.5 * RAY_ORIGIN_SCALE

    hit_points: list = []
    placed: list = []

    for direction in directions:
        origin = direction * bounding_r
        cast_dir = -direction  # fire inward toward centre

        location, normal, index, distance = bvh.ray_cast(origin, cast_dir)

        if location is None:
            continue  # miss — ray bypassed geometry (concave shadow zone)

        if normal is None or normal.length_squared < 1e-8:
            continue  # degenerate triangle: zero-area or numerically flat

        # Reject nearly-horizontal normals (steep overhangs, underside faces).
        # A prop placed on a face tilted >75° from vertical would float oddly.
        if abs(normal.z) < NORMAL_Z_MIN:
            continue

        hit_points.append(location.copy())

        # Duplicate prop data (linked copy shares mesh; full copy for independence)
        inst = prop_source.copy()
        inst.data = prop_source.data.copy()
        bpy.context.collection.objects.link(inst)
        inst.hide_viewport = False
        inst.hide_render = False

        rot = orient_to_normal(normal)
        inst.matrix_world = Matrix.Translation(location) @ rot.to_4x4()
        s = 1.0 + random.uniform(-0.2, 0.2)
        inst.scale = (s, s, s)
        placed.append(inst)

    print(f"[BVHTree scatter] {len(placed)} props from {len(directions)} rays")

    # ── convex-hull collision proxy ──────────────────────────────────────────
    # Minimal bounding volume enclosing all hit points.  In a WebXR scene the
    # XR engine tests ray → proxy AABB first, then refines against the full
    # scatter mesh — the proxy slashes per-frame intersection cost.
    proxy_bm = bmesh.new()
    for pt in hit_points:
        proxy_bm.verts.new(pt)
    proxy_bm.verts.ensure_lookup_table()
    bmesh.ops.convex_hull(proxy_bm, input=proxy_bm.verts)
    proxy_bm.faces.ensure_lookup_table()

    proxy_me = bpy.data.meshes.new("CollisionProxy_mesh")
    proxy_bm.to_mesh(proxy_me)
    proxy_bm.free()

    proxy_ob = bpy.data.objects.new("collision_proxy", proxy_me)
    bpy.context.collection.objects.link(proxy_ob)

    # ── glTF exports ─────────────────────────────────────────────────────────
    gltf_common = dict(
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )

    scatter_obs = {target} | set(placed)
    for o in bpy.context.scene.objects:
        o.select_set(o in scatter_obs)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_SCATTER),
        use_selection=True,
        **gltf_common,
    )

    for o in bpy.context.scene.objects:
        o.select_set(o is proxy_ob)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PROXY),
        use_selection=True,
        **gltf_common,
    )

    print("Exported: scatter_result.glb  +  collision_proxy.glb")


if __name__ == "__main__":
    main()
