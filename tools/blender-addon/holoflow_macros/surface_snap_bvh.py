"""
holoflow_macros/surface_snap_bvh.py — Blender 5.1
===================================================
Reusable BVHTree surface-snap helper used by the Holoflow WebXR exporter
and any macro that needs to project positions onto an evaluated mesh surface.

Exported API
------------
snap_positions_to_surface(target_obj, positions, *, world_space=True)
    Snap a list of Vector positions to the nearest surface point on target_obj.
    Returns list of (snapped_co, normal, face_index, dist) tuples.

ray_cast_surface(target_obj, origin, direction, *, world_space=True)
    Fire a single ray from origin in direction against target_obj.
    Returns (location, normal, face_index, dist) or (None, None, None, None).

build_bvh(target_obj)
    Build and return a BVHTree from the evaluated depsgraph.  Call once,
    reuse for many queries — building is O(n log n), queries are O(log n).
"""

import bpy
import mathutils
from mathutils import Vector, Matrix


def build_bvh(target_obj: bpy.types.Object) -> mathutils.bvhtree.BVHTree:
    """
    Build BVHTree from the fully evaluated mesh of target_obj.
    Resolves all modifiers via the current evaluated depsgraph.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj  = target_obj.evaluated_get(depsgraph)
    return mathutils.bvhtree.BVHTree.FromObject(eval_obj, depsgraph)


def snap_positions_to_surface(
    target_obj: bpy.types.Object,
    positions: list,
    *,
    world_space: bool = True,
) -> list:
    """
    Snap each position in `positions` to the nearest surface point on target_obj.

    Parameters
    ----------
    target_obj : the mesh object to snap onto (modifiers evaluated)
    positions  : list of mathutils.Vector query positions
    world_space: if True (default) positions and results are in world space;
                 if False, positions are expected in target_obj local space

    Returns
    -------
    list of (location, normal, face_index, dist) — same layout as BVHTree.find_nearest().
    Entries where no face was found have location == None.
    """
    bvh = build_bvh(target_obj)
    inv = target_obj.matrix_world.inverted() if not world_space else Matrix.Identity(4)
    mw  = target_obj.matrix_world

    results = []
    for q in positions:
        q_local = inv @ q if not world_space else q
        loc, normal, face_idx, dist = bvh.find_nearest(q_local)
        if loc is not None and world_space:
            loc    = mw @ loc
            normal = (mw.to_3x3() @ normal).normalized() if normal else None
        results.append((loc, normal, face_idx, dist))
    return results


def ray_cast_surface(
    target_obj: bpy.types.Object,
    origin: Vector,
    direction: Vector,
    *,
    world_space: bool = True,
):
    """
    Fire a single ray from origin in direction against target_obj.
    Converts to/from local space automatically when world_space=True.
    Returns (location, normal, face_index, dist) or (None, None, None, None).
    """
    bvh = build_bvh(target_obj)
    inv = target_obj.matrix_world.inverted()
    mw  = target_obj.matrix_world

    if world_space:
        o_local = inv @ origin
        d_local = (inv.to_3x3() @ direction).normalized()
    else:
        o_local = origin
        d_local = direction.normalized()

    loc, normal, face_idx, dist = bvh.ray_cast(o_local, d_local)

    if loc is not None and world_space:
        loc    = mw @ loc
        normal = (mw.to_3x3() @ normal).normalized() if normal else None

    return loc, normal, face_idx, dist
