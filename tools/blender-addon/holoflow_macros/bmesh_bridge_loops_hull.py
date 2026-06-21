"""
holoflow_macros/bmesh_bridge_loops_hull.py
Blender 5.1 | CC0

Reusable helper: build a revolution hull from a (z, radius) profile list
using bmesh.ops.bridge_loops.

Usage:
    import sys, os
    sys.path.insert(0, r'/path/to/tools/blender-addon')
    from holoflow_macros.bmesh_bridge_loops_hull import build_revolution_hull

    mesh, obj = build_revolution_hull(
        profile=[(0, 0.3), (0.5, 1.0), (1.0, 0.3)],
        segments=16,
        name="my_hull",
    )
"""

import bpy
import bmesh


def _ring_edges(bm: "bmesh.types.BMesh", verts: list) -> list:
    vset = set(verts)
    return [e for e in bm.edges
            if e.verts[0] in vset and e.verts[1] in vset]


def _fan_cap(bm: "bmesh.types.BMesh",
             ring: list,
             z_centre: float,
             inward: bool = False) -> None:
    centre = bm.verts.new((0.0, 0.0, z_centre))
    n = len(ring)
    for j in range(n):
        a = ring[j]
        b = ring[(j + 1) % n]
        if inward:
            bm.faces.new([b, a, centre])
        else:
            bm.faces.new([a, b, centre])


def build_revolution_hull(
    profile: list[tuple[float, float]],
    segments: int = 16,
    name: str = "revolution_hull",
    flat_shading: bool = True,
    twist_offset: int = 0,
) -> tuple["bpy.types.Mesh", "bpy.types.Object"]:
    """
    Build a watertight revolution hull from a profile list.

    Args:
        profile:       List of (z_height, radius) tuples, ordered tail to nose.
                       Minimum length: 2 (produces a single bridged section).
        segments:      Number of vertices per ring.  Must be consistent — this
                       value is shared by all rings.
        name:          Name for the generated Blender Mesh and Object.
        flat_shading:  True → each polygon uses its own face normal (faceted).
        twist_offset:  Passed to bridge_loops — non-zero values introduce a
                       helical twist between adjacent profile stations.

    Returns:
        (mesh, obj) — the new Blender mesh data-block and its scene object.
    """
    if len(profile) < 2:
        raise ValueError("profile must have at least 2 entries")

    bm = bmesh.new()
    rings: list[list] = []

    for z, r in profile:
        res = bmesh.ops.create_circle(bm,
            cap_ends=False,
            cap_tris=False,
            segments=segments,
            radius=max(r, 1e-4),  # prevent degenerate zero-radius ring
        )
        for v in res['verts']:
            v.co.z = z
        rings.append(res['verts'])

    for i in range(len(rings) - 1):
        lo = _ring_edges(bm, rings[i])
        hi = _ring_edges(bm, rings[i + 1])
        bmesh.ops.bridge_loops(bm,
            edges=lo + hi,
            use_cyclic=True,
            use_smooth=not flat_shading,
            use_merge=False,
            merge_factor=0.5,
            twist_offset=twist_offset,
        )

    _fan_cap(bm, rings[0],  z_centre=profile[0][0],  inward=False)
    _fan_cap(bm, rings[-1], z_centre=profile[-1][0], inward=True)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    if flat_shading:
        for poly in mesh.polygons:
            poly.use_smooth = False

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return mesh, obj
