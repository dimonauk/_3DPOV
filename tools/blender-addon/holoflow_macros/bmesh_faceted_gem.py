# holoflow_macros/bmesh_faceted_gem.py
# Reusable macro: build a faceted brilliant-cut gem via bmesh direct API.
#
# Usage:
#   from holoflow_macros.bmesh_faceted_gem import build_faceted_gem
#   ob = build_faceted_gem(n_sides=8, r_table=0.35, r_girdle=0.60,
#                          h_crown=0.28, h_pavilion=0.38, name="gem")

import bpy
import bmesh
import math


def build_faceted_gem(
    n_sides: int   = 8,
    r_table: float = 0.35,
    r_girdle: float = 0.60,
    h_crown: float  = 0.28,
    h_pavilion: float = 0.38,
    name: str = "faceted_gem",
    sharp_edges: bool = True,
) -> bpy.types.Object:
    """Create a brilliant-cut gem mesh object and link it to the active collection.

    All edges are marked sharp when sharp_edges=True (default) — correct for
    the Holoflow Studio hard-facet aesthetic.  Returns the linked Object so the
    caller can apply materials, set custom properties, or export immediately.
    """
    bm = bmesh.new()

    table_verts  = []
    girdle_verts = []
    for i in range(n_sides):
        angle        = (2 * math.pi / n_sides) * i
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        table_verts.append(
            bm.verts.new((r_table * cos_a,  r_table * sin_a,  h_crown))
        )
        girdle_verts.append(
            bm.verts.new((r_girdle * cos_a, r_girdle * sin_a, 0.0))
        )
    culet = bm.verts.new((0.0, 0.0, -h_pavilion))
    bm.verts.ensure_lookup_table()

    bm.faces.new(table_verts[:])
    for i in range(n_sides):
        j = (i + 1) % n_sides
        bm.faces.new([
            table_verts[i], girdle_verts[i],
            girdle_verts[j], table_verts[j],
        ])
        bm.faces.new([girdle_verts[i], culet, girdle_verts[j]])
    bm.faces.ensure_lookup_table()

    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    # Cylindrical UV: azimuth as U, normalised height as V
    total_h  = h_crown + h_pavilion
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            co = loop.vert.co
            loop[uv_layer].uv = (
                (math.atan2(co.y, co.x) / (2 * math.pi) + 0.5) % 1.0,
                (co.z + h_pavilion) / total_h,
            )

    me = bpy.data.meshes.new(name + "_mesh")
    bm.to_mesh(me)
    bm.free()

    if sharp_edges:
        for edge in me.edges:
            edge.use_edge_sharp = True

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob["holoflow:facet"] = True
    return ob
