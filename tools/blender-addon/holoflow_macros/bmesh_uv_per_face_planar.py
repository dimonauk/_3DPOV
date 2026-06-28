"""
holoflow_macros/bmesh_uv_per_face_planar.py — Per-face planar UV projection

Extracted from the bmesh UV Map tutorial blueprint so any other library script
can apply clean per-face UVs without duplicating the coordinate-frame math.

Usage
─────
    from holoflow_macros.bmesh_uv_per_face_planar import apply_per_face_planar_uvs

    face_count = apply_per_face_planar_uvs(bpy.context.active_object)

Each face is projected onto its own local XY plane (defined by face.normal),
scaled to fit in a 0-1 square preserving aspect ratio.  The result is that every
face becomes a self-contained UV island — correct for faceted cel-shaded meshes
where cross-face UV sharing would produce seam artefacts.

Blender 5.1+.
"""

from __future__ import annotations

import bpy
import bmesh
from mathutils import Vector

UV_LAYER_NAME = "UVMap"


def _local_frame(normal: Vector):
    """Orthonormal basis {local_x, local_y} lying in the plane of normal."""
    world_up = Vector((0.0, 0.0, 1.0))
    if abs(normal.dot(world_up)) > 0.999:
        world_up = Vector((1.0, 0.0, 0.0))
    local_x = world_up.cross(normal).normalized()
    local_y  = normal.cross(local_x).normalized()
    return local_x, local_y


def _project_face(face: bmesh.types.BMFace, uv_layer) -> None:
    normal          = face.normal.copy()
    local_x, local_y = _local_frame(normal)
    center          = face.calc_center_median()

    raw = []
    for loop in face.loops:
        v = loop.vert.co - center
        raw.append(Vector((v.dot(local_x), v.dot(local_y))))

    if not raw:
        return

    min_u = min(p.x for p in raw)
    max_u = max(p.x for p in raw)
    min_v = min(p.y for p in raw)
    max_v = max(p.y for p in raw)
    scale = max(max_u - min_u, max_v - min_v) or 1.0

    for loop, p in zip(face.loops, raw):
        loop[uv_layer].uv = Vector((
            (p.x - min_u) / scale,
            (p.y - min_v) / scale,
        ))


def apply_per_face_planar_uvs(
    obj: bpy.types.Object,
    uv_name: str = UV_LAYER_NAME,
) -> int:
    """
    Apply per-face planar UV projection to all faces of obj.

    Reads the evaluated mesh (modifiers applied) so Subdivision Surface and
    Displace modifiers are accounted for in vertex positions before projection.
    Writes UVs back to the original (non-evaluated) mesh data block.

    Returns the number of faces processed.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj_eval  = obj.evaluated_get(depsgraph)

    bm = bmesh.new()
    bm.from_mesh(obj_eval.data)
    bm.faces.ensure_lookup_table()

    uv_layer = bm.loops.layers.uv.get(uv_name) or bm.loops.layers.uv.new(uv_name)

    for face in bm.faces:
        _project_face(face, uv_layer)

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return len(obj.data.polygons)
