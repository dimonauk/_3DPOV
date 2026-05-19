"""
holoflow_macros/uv_unwrap_low_poly.py
======================================
Reusable UV-unwrap helpers for low-poly stylised meshes.
The studio's preferred workflow: seams on hard edges, Angle-Based
Unwrap, Pack Islands with bleed-safe margin.

Usage:
    from holoflow_macros.uv_unwrap_low_poly import (
        mark_seams_by_angle,
        unwrap_and_pack,
        studio_uv_preset,
    )

Blender version: 5.1+
Licence: CC0
"""

import bpy
import bmesh
import math


def ensure_uv_map(obj: bpy.types.Object, name: str = "UVMap") -> None:
    """Add a UV map if none exists. No-op if one is already present."""
    if len(obj.data.uv_layers) == 0:
        obj.data.uv_layers.new(name=name)


def mark_seams_by_angle(
    obj: bpy.types.Object,
    threshold_deg: float = 45.0,
) -> int:
    """
    Mark UV seams on every edge whose dihedral angle > threshold_deg.

    Returns the number of seams marked.

    45° is the studio default for low-poly props. For very angular
    crystal forms, 30° gives more islands (easier to lay flat). For
    near-planar hard-surface panels, 60°–80° keeps island count down.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")

    bm = bmesh.from_edit_mesh(obj.data)
    bm.edges.ensure_lookup_table()
    threshold = math.radians(threshold_deg)
    count = 0

    for edge in bm.edges:
        if len(edge.link_faces) == 2:
            f0, f1 = edge.link_faces
            angle = f0.normal.angle(f1.normal)
            edge.seam = angle > threshold
            if edge.seam:
                count += 1
        else:
            edge.seam = True
            count += 1

    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode="OBJECT")
    return count


def unwrap_and_pack(
    obj: bpy.types.Object,
    margin: float = 0.005,
) -> None:
    """
    Run Angle-Based Unwrap then Pack Islands.

    margin: gap between islands in UV space.
      0.005 ≈ 2 px on a 256×256 texture — prevents bilinear bleed.
      0.01  ≈ 2 px on a 512×512 texture.
    """
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.unwrap(method="ANGLE_BASED", margin=margin)
    bpy.ops.uv.pack_islands(margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def studio_uv_preset(
    obj: bpy.types.Object,
    seam_threshold_deg: float = 45.0,
    margin: float = 0.005,
) -> None:
    """
    Full studio UV pipeline in one call:
      1. Ensure UV map exists.
      2. Mark seams by angle threshold.
      3. Unwrap (Angle-Based) + Pack Islands.
    """
    ensure_uv_map(obj)
    mark_seams_by_angle(obj, seam_threshold_deg)
    unwrap_and_pack(obj, margin)
