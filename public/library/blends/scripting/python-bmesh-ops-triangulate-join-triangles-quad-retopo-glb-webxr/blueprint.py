"""
bmesh.ops.triangulate + bmesh.ops.join_triangles
Export-Safe Triangulation & Selective Quad Restoration
Blender 5.1 · CC-0 · Holoflow Studio

A hexagonal buckler shield with a central n-gon boss demonstrates two
symmetrical BMesh operations:

  triangulate   — converts any mix of quads, tris, and n-gons into a
                  guaranteed-triangle mesh ready for GLB / game engines.
  join_triangles — the reversal: dissolves adjacent coplanar triangle
                   pairs back into quads, recovering clean topology on
                   planar slab faces after triangulation.

Why this matters for GLB export: the glTF spec requires triangles.
Blender's exporter auto-triangulates on the fly using BEAUTY by default,
but that triangulation is invisible — you cannot inspect or control it
in the .blend.  Pre-triangulating in Python lets you choose the diagonal
method, inspect the result, and guarantee a specific winding for
animated or UV-mapped meshes.

Studio output: hf_shield_disc.blend  +  hf_shield_disc.glb
               Draco-L6 · WebP · +Y up
"""

import bpy
import bmesh
from mathutils import Vector
import math
import os

# ── Constants ─────────────────────────────────────────────────────────────────
OUTER_R = 0.60   # circumradius of the outer hexagonal shield (m)
INNER_R = 0.22   # circumradius of the inner boss ring
DEPTH   = 0.05   # slab thickness (extrude downward)
HEX_N   = 6      # hex = 6 sides

# triangulate / join parameters
QUAD_METHOD      = 'BEAUTY'     # BEAUTY | FIXED | FIXED_ALTERNATE | SHORTEST_DIAGONAL
NGON_METHOD      = 'BEAUTY'     # BEAUTY | CLIP
JOIN_FACE_THR    = 0.020        # radians dihedral tolerance (~1.1°) for join
JOIN_SHAPE_THR   = 0.25         # shape quality gate (0 = squares only, π = anything)

OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath or "/tmp"),
    "../../../glbs/scripting/"
    "python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr",
)
OUTPUT_GLB   = "hf_shield_disc.glb"
EXPORT_FRAME = 1

MAT_BODY = "HF_ShieldBody"
MAT_BOSS = "HF_ShieldBoss"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mat(name: str, rgb: tuple, metallic: float = 0.8, rough: float = 0.30):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value  = (*rgb, 1.0)
        bsdf.inputs["Metallic"].default_value    = metallic
        bsdf.inputs["Roughness"].default_value   = rough
    return mat


def _hex_ring(bm_: bmesh.types.BMesh, r: float, z: float = 0.0, n: int = HEX_N):
    """Return N BMVerts arranged on a regular polygon at height z."""
    return [
        bm_.verts.new(Vector((
            r * math.cos(2 * math.pi * i / n + math.pi / n),
            r * math.sin(2 * math.pi * i / n + math.pi / n),
            z,
        )))
        for i in range(n)
    ]


# ── Build ─────────────────────────────────────────────────────────────────────

def build_shield():
    """
    Topology overview
    ─────────────────
    Outer ring (hex, 6 verts) + inner ring (hex, 6 verts) are connected
    by 6 quads.  The inner ring is closed with a single 6-gon face — the
    n-gon that drives this tutorial.  The entire assembly is then extruded
    downward to form a shallow slab (adds side quads + bottom cap quads).

    After construction we run:
      STEP B  triangulate → all faces become tris
      STEP C  join_triangles on horizontal faces only → slab top/bottom
              quads are restored; side tris remain

    This demonstrates that triangulate and join_triangles are true
    inverses on planar surfaces, and that join_triangles respects the
    axis filter you provide via the face list argument.
    """
    mesh = bpy.data.meshes.new("HF_ShieldDisc")
    obj  = bpy.data.objects.new("HF_ShieldDisc", mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # — outer and inner hex rings ──────────────────────────────────────────────
    outer = _hex_ring(bm, OUTER_R, z=0.0)
    inner = _hex_ring(bm, INNER_R, z=0.0)

    # 6 quads spanning from outer to inner
    # winding: outward normal should face +Z after recalc
    for i in range(HEX_N):
        j = (i + 1) % HEX_N
        bm.faces.new([outer[i], outer[j], inner[j], inner[i]])

    # central boss: one 6-gon n-gon (inner ring closed as a single face)
    # This is the critical n-gon.  The glTF exporter cannot handle n-gons
    # natively — they must become tris before writing to the GLB buffer.
    boss_face = bm.faces.new(inner)

    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    # — material slot assignment ──────────────────────────────────────────────
    # slot 0 = body (hex quads), slot 1 = boss (n-gon)
    # Must assign before extrude so the side + bottom faces inherit body mat
    bm.faces.ensure_lookup_table()
    boss_face.material_index = 1       # assigned after topology is valid

    # — extrude downward to form slab ─────────────────────────────────────────
    # extrude_face_region copies all top faces; we translate the copy down
    all_top = list(bm.faces)
    ret = bmesh.ops.extrude_face_region(bm, geom=all_top)
    bottom_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=bottom_verts, vec=Vector((0.0, 0.0, -DEPTH)))

    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    # flat shading for cel / faceted aesthetic
    for f in bm.faces:
        f.smooth = False

    # mark boundary edges sharp so GLB NORMAL accessor carries split normals
    for e in bm.edges:
        if e.is_boundary or (not e.smooth):
            e.smooth = False

    # ── STEP B: bmesh.ops.triangulate ────────────────────────────────────────
    #
    # Signature:
    #   result = bmesh.ops.triangulate(
    #       bm,
    #       faces          = [],            # list[BMFace]
    #       quad_method    = 'BEAUTY',      # BEAUTY | FIXED | FIXED_ALTERNATE
    #                                       # | SHORTEST_DIAGONAL
    #       ngon_method    = 'BEAUTY',      # BEAUTY | CLIP
    #   )
    #   result['faces']  → list of NEW triangle BMFace handles
    #
    # Key invariants:
    #   1. All BMFace handles from the faces= input become INVALID after
    #      the call — including boss_face.  Never reuse them.
    #   2. result['faces'] contains ONLY the newly created triangles, not
    #      unchanged faces (if any).
    #   3. BEAUTY for quads: Delaunay criterion — minimises the maximum
    #      difference of opposing angles.  Best aesthetic result.
    #      FIXED: always cuts the 0→2 diagonal (top-left to bottom-right
    #      in a standard grid).  Deterministic and faster; good when you
    #      need predictable UV diagonal direction.
    #      SHORTEST_DIAGONAL: cuts the shorter of the two possible quads
    #      diagonals.  Useful for near-square quads on organic surfaces.
    #   4. BEAUTY for n-gons: ear-clip triangulation followed by a
    #      Lawson-flip beauty pass — produces better angles than pure clip.
    #      CLIP (ear-clip only): faster, may produce elongated tris on
    #      concave n-gons.
    #   5. After triangulate, bm.faces contains ONLY triangles.

    all_faces = list(bm.faces)         # collect BEFORE triangulate
    tri_result = bmesh.ops.triangulate(
        bm,
        faces       = all_faces,
        quad_method = QUAD_METHOD,
        ngon_method = NGON_METHOD,
    )
    new_tris = tri_result['faces']     # only the newly created triangle faces
    _ = new_tris                       # keep for diagnostic use if needed

    # ── STEP C: bmesh.ops.join_triangles ─────────────────────────────────────
    #
    # Signature:
    #   result = bmesh.ops.join_triangles(
    #       bm,
    #       faces                 = [],    # list[BMFace] — triangle candidates
    #       angle_face_threshold  = 0.01,  # max dihedral angle between pair normals
    #       angle_shape_threshold = 0.1,   # max deviation from rectangle
    #       cmp_seam              = False, # respect UV seam edges
    #       cmp_sharp             = False, # respect sharp-edge marks
    #       cmp_uvs               = False, # compare UV islands
    #       cmp_vcols             = False, # compare vertex colours
    #       cmp_materials         = True,  # don't join across material slots
    #   )
    #   result['faces'] → list of NEW quad BMFace handles
    #
    # Key invariants:
    #   1. Only triangles supplied in faces= are candidates — quads or n-gons
    #      in the list are silently ignored.
    #   2. A pair joins only if BOTH faces are in the candidate list.
    #      Passing a half-set will leave the other half un-joined.
    #   3. angle_face_threshold is in radians.  0.0 = strict coplanar only.
    #      0.02 (~1.1°) catches floating-point near-flat.
    #   4. angle_shape_threshold gates quad quality.  A merged pair whose
    #      shape exceeds this angle stays as two tris.  0.25 rad allows
    #      mild rhomboids — appropriate for hex-derived quads.
    #   5. cmp_sharp=True prevents dissolving edges you deliberately marked
    #      sharp.  Always use this if the mesh carries hard-edge data for
    #      faceted export.
    #   6. cmp_materials=True is the default and correct for multi-material
    #      meshes — prevents quads spanning the body/boss boundary.

    bm.faces.ensure_lookup_table()

    # Restore quads on horizontal faces (top slab surface and bottom cap).
    # Side faces have normals near-perpendicular to Z and are left as tris.
    horiz_tris = [f for f in bm.faces if abs(f.normal.z) > 0.85]

    join_result = bmesh.ops.join_triangles(
        bm,
        faces                 = horiz_tris,
        angle_face_threshold  = JOIN_FACE_THR,
        angle_shape_threshold = JOIN_SHAPE_THR,
        cmp_sharp             = True,
        cmp_materials         = True,
        cmp_seam              = False,
    )
    new_quads = join_result['faces']   # new quad handles (originals invalid)
    _ = new_quads

    bm.to_mesh(mesh)
    mesh.update()
    bm.free()

    # — materials ─────────────────────────────────────────────────────────────
    mat_body = _mat(MAT_BODY, (0.08, 0.10, 0.20))   # deep navy
    mat_boss = _mat(MAT_BOSS, (0.60, 0.50, 0.10))   # gold boss
    mesh.materials.append(mat_body)
    mesh.materials.append(mat_boss)

    # — sharp_edge boolean attribute for GLB NORMAL accessor ──────────────────
    if "sharp_edge" not in mesh.attributes:
        mesh.attributes.new("sharp_edge", type='BOOLEAN', domain='EDGE')
    vals = [not e.use_edge_sharp for e in mesh.edges]
    mesh.attributes["sharp_edge"].data.foreach_set("value", vals)

    bpy.context.view_layer.update()
    return obj


# ── Export ────────────────────────────────────────────────────────────────────

def export_glb(obj) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, OUTPUT_GLB)
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.ops.export_scene.gltf(
        filepath                             = path,
        use_selection                        = False,
        export_format                        = 'GLB',
        export_apply                         = True,
        export_yup                           = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        export_texcoords                     = True,
        export_normals                       = True,
    )
    print(f"[Holoflow] GLB → {path}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    for o in list(bpy.data.objects):
        if o.name.startswith("HF_"):
            bpy.data.objects.remove(o, do_unlink=True)

    obj = build_shield()
    export_glb(obj)
    print("[Holoflow] triangulate + join_triangles complete.")


if __name__ == "__main__":
    main()
