"""
holoflow_macros/gn_triangulate_safe.py
Holoflow Studio | CC0 | Blender 5.1

Macro: apply GN Triangulate Mesh to every mesh object in the scene using
SHORTEST_DIAGONAL / BEAUTY for WebXR-safe GLB export.

Usage (Scripting workspace):
    import holoflow_macros.gn_triangulate_safe as trisafe
    trisafe.apply_to_all()      # default SHORTEST_DIAGONAL
    trisafe.apply_to_all(quad_method="BEAUTY")  # override
"""

import bpy
import bmesh

QUAD_METHOD_DEFAULT  = "SHORTEST_DIAGONAL"
NGON_METHOD_DEFAULT  = "BEAUTY"
MIN_VERTICES_DEFAULT = 4


def triangulate_object(
    obj: bpy.types.Object,
    quad_method: str = QUAD_METHOD_DEFAULT,
    ngon_method: str = NGON_METHOD_DEFAULT,
    min_vertices: int = MIN_VERTICES_DEFAULT,
) -> int:
    """
    Apply triangulation directly via bmesh (no modifier, destructive).
    Returns the number of faces triangulated.

    Why bmesh rather than a modifier? This macro is for batch pre-export
    processing where you want the final topology on disk, not a live modifier
    stack. For non-destructive workflows, use the GN Triangulate Mesh node
    in a modifier (see blueprint.py in the library entry).
    """
    if obj.type != "MESH":
        return 0

    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)

    eligible = [f for f in bm.faces if len(f.verts) >= min_vertices]
    if not eligible:
        bm.free()
        return 0

    result = bmesh.ops.triangulate(
        bm,
        faces=eligible,
        quad_method=quad_method,
        ngon_method=ngon_method,
    )
    tri_count = len(result["faces"])
    bm.to_mesh(me)
    bm.free()
    me.update()
    return tri_count


def apply_to_all(
    quad_method: str = QUAD_METHOD_DEFAULT,
    ngon_method: str = NGON_METHOD_DEFAULT,
    min_vertices: int = MIN_VERTICES_DEFAULT,
    collection: bpy.types.Collection | None = None,
) -> dict[str, int]:
    """
    Triangulate all mesh objects in the scene (or a specific collection).
    Returns {object_name: faces_triangulated}.
    """
    source = collection.objects if collection else bpy.context.scene.objects
    results: dict[str, int] = {}
    for obj in source:
        n = triangulate_object(obj, quad_method, ngon_method, min_vertices)
        if n > 0:
            results[obj.name] = n
            print(f"[TriSafe] {obj.name}: {n} faces triangulated ({quad_method})")
    return results
