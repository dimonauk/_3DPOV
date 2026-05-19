"""
holoflow_macros/flat_shaded_normals.py
========================================
Reusable helpers extracted from the flat-shaded-faceted-normals blueprint.
Import these into any Holoflow script or add-on panel that needs to control
per-loop normals on a mesh object.

Licence: MIT (studio original)
"""

import bpy
import bmesh
from mathutils import Vector


def apply_shade_flat_direct(obj: bpy.types.Object) -> None:
    """Set every polygon to flat-shaded via the mesh data API (no operator)."""
    me = obj.data
    for poly in me.polygons:
        poly.use_smooth = False
    me.update()


def apply_shade_smooth_direct(obj: bpy.types.Object) -> None:
    """Set every polygon to smooth-shaded via the mesh data API."""
    me = obj.data
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()


def apply_custom_normals_flat(obj: bpy.types.Object) -> None:
    """
    Custom split normals set to each face's own normal.

    Visually equivalent to shade-flat, but the normals are now an explicit
    per-loop attribute that can be further sculpted.

    Blender 5.1: normals_split_custom_set() works without any flag;
    polygons must be marked use_smooth=True for the custom normals to be read.
    """
    me = obj.data
    me.update()

    loop_normals = [None] * len(me.loops)
    for poly in me.polygons:
        fn = poly.normal.copy()
        for li in poly.loop_indices:
            loop_normals[li] = fn

    me.normals_split_custom_set(loop_normals)
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()


def apply_silhouette_blend(obj: bpy.types.Object, segs: int = 12) -> None:
    """
    Silhouette-blend normals for UV-sphere–like meshes.

    Loops belonging to vertices that appear in many faces (pole and near-pole
    vertices on a UV sphere) receive a vertex-averaged normal — keeping the
    silhouette smooth.  All other loops receive the face normal — keeping the
    interior light-bands hard.

    segs    UV sphere longitude segment count; used to compute the pole threshold.
    """
    me = obj.data
    me.update()

    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    vertex_normals: dict[int, Vector] = {v.index: v.normal.copy() for v in bm.verts}
    bm.free()

    vert_loop_count: dict[int, int] = {}
    for loop in me.loops:
        vert_loop_count[loop.vertex_index] = vert_loop_count.get(loop.vertex_index, 0) + 1

    threshold = segs - 2
    pole_verts = {vi for vi, cnt in vert_loop_count.items() if cnt >= threshold}

    loop_normals = [None] * len(me.loops)
    for poly in me.polygons:
        fn = poly.normal.copy()
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            loop_normals[li] = vertex_normals[vi] if vi in pole_verts else fn

    me.normals_split_custom_set(loop_normals)
    for poly in me.polygons:
        poly.use_smooth = True
    me.update()
