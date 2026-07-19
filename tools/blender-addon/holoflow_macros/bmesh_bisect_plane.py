"""
holoflow_macros/bmesh_bisect_plane.py
Reusable bisect_plane helpers for the Holoflow studio pipeline.

Usage:
    from holoflow_macros.bmesh_bisect_plane import bisect_half, bisect_snap_to_axis

Both functions expect a live BMesh object and return the geom_cut edge list for
downstream bridge_loops / fill operations.
"""

import math
import bmesh
from mathutils import Vector


def bisect_half(bm, plane_co, plane_no, dist=0.0001, remove_outer=True):
    """
    Bisect bm with the plane (plane_co, plane_no) and remove one half.

    remove_outer=True  → removes faces on the positive-normal side.
    remove_outer=False → removes faces on the negative-normal side.

    Returns: list of BMEdge instances at the cut boundary (geom_cut edges).
    """
    if not isinstance(plane_no, Vector):
        plane_no = Vector(plane_no)
    plane_no = plane_no.normalized()

    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=dist,
        plane_co=Vector(plane_co),
        plane_no=plane_no,
        use_snap_center=False,
        clear_outer=remove_outer,
        clear_inner=not remove_outer,
    )
    return [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]


def bisect_snap_to_axis(bm, axis="X", dist=0.005):
    """
    Snap near-axis verts to the mirror plane without removing either side.
    Useful as a pre-step before applying a Mirror modifier or welding with
    bmesh.ops.remove_doubles along the seam.

    axis: 'X', 'Y', or 'Z' — the axis whose zero-plane is the mirror plane.
    dist: snap tolerance in Blender units.

    Returns: list of BMEdge instances along the snapped seam.
    """
    normals = {"X": Vector((1, 0, 0)), "Y": Vector((0, 1, 0)), "Z": Vector((0, 0, 1))}
    if axis not in normals:
        raise ValueError(f"axis must be one of {list(normals)}; got {axis!r}")

    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=dist,
        plane_co=Vector((0, 0, 0)),
        plane_no=normals[axis],
        use_snap_center=False,
        clear_outer=False,
        clear_inner=False,
    )
    return [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
