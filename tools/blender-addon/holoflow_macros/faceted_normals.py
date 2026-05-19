"""
holoflow_macros/faceted_normals.py — Reusable faceted-normals helper

Extracted from the full blueprint so any other script in the library can
import this function without duplicating the core logic.

Usage
─────
    from holoflow_macros.faceted_normals import apply_faceted_normals

    apply_faceted_normals(bpy.context.object.data)

Blender 5.1+. No use_auto_smooth (removed in 4.2).
"""

from __future__ import annotations
import bpy


def apply_faceted_normals(mesh: bpy.types.Mesh) -> int:
    """Bake per-face normals into the custom split normals data layer.

    Sets every loop's normal to the normal of the polygon it belongs to.
    After this call `mesh.has_custom_normals` is True and the glTF exporter
    will emit the per-face normals as the NORMAL accessor rather than
    recomputing averaged vertex normals from geometry.

    WHY this is needed
    ──────────────────
    `polygon.use_smooth = False` is a Blender viewport display flag.  The
    io_scene_gltf2 exporter (Apache-2.0) does not read it; it reads the
    CD_CUSTOMLOOPNORMAL data layer via `has_custom_normals`.  Without this
    call, smooth-averaged normals survive the GLB export even on a visually
    flat-shaded object.

    Parameters
    ──────────
    mesh : bpy.types.Mesh
        Must be a mesh whose geometry is finalised (all modifiers applied,
        object transform applied if you want scale-independent normals).

    Returns
    ───────
    int
        Number of loops processed.
    """
    # Mark flat in the viewport too — keeps Blender display consistent
    for poly in mesh.polygons:
        poly.use_smooth = False

    n_loops = len(mesh.loops)
    loop_normals = [(0.0, 0.0, 0.0)] * n_loops

    for poly in mesh.polygons:
        fn = (poly.normal.x, poly.normal.y, poly.normal.z)
        for li in poly.loop_indices:
            loop_normals[li] = fn

    mesh.normals_split_custom_set(loop_normals)

    assert mesh.has_custom_normals, (
        "normals_split_custom_set() completed but has_custom_normals is False — "
        "unexpected Blender version behaviour."
    )

    return n_loops
