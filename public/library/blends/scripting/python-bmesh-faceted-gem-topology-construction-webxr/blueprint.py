# python-bmesh-faceted-gem-topology-construction-webxr/blueprint.py
# Blender 5.1 — bmesh: Faceted Gem via Direct Topology Construction
#
# TECHNIQUE: Build an octagonal brilliant-cut gem from scratch using the bmesh
# context API — no bpy.ops, no Edit Mode entry, no modifier stack.  Lay down
# three vertex rings (table, girdle, culet point), stitch crown trapezoids and
# pavilion triangles, flood-recalculate outward normals, assign per-loop UVs
# via bm.loops.layers.uv, mark every edge sharp for hard-facet rendering,
# convert to a bpy.data.Mesh, attach a Principled BSDF glass material, and
# export a WebXR-ready GLB.
#
# WHY bmesh OVER bpy.ops:
#   bpy.ops.mesh.* requires an active Object in Edit Mode — awkward in headless
#   scripts and impossible in background mode.  The bmesh API is context-free:
#   create a BMesh, mutate it, push to a bpy.data.Mesh, discard the BMesh.
#   For batch mesh construction (5 000+ verts) the operator round-trip is
#   10–100× slower than the direct C-level path.
#
# WHY RECALC_FACE_NORMALS INSTEAD OF HAND-WINDING:
#   Correct face winding for outward normals is trivially wrong in code — one
#   ring built clockwise when you meant counterclockwise means inside-out.
#   bmesh.ops.recalc_face_normals flood-fills consistent orientation from the
#   first face outward.  Far cheaper than re-checking every loop individually.

import bpy
import bmesh
import math

# ── parameters ────────────────────────────────────────────────────────────────
OBJECT_NAME = "faceted_gem"    # exported glTF root name — snake_case per studio
N_SIDES     = 8                # octagonal brilliant cut
R_TABLE     = 0.35             # table polygon radius (top face, small)
R_GIRDLE    = 0.60             # widest equator radius
H_CROWN     = 0.28             # crown height above girdle  (Z > 0)
H_PAVILION  = 0.38             # pavilion depth below girdle (Z < 0)
EXPORT_PATH = "//faceted_gem.glb"


# ── gem geometry ──────────────────────────────────────────────────────────────

def build_gem_bmesh() -> "bmesh.types.BMesh":
    """Return a fully constructed BMesh for the gem.  Caller owns bm.free()."""
    bm = bmesh.new()

    # ── vertex rings ─────────────────────────────────────────────────────────
    # Three structural elements of a brilliant cut:
    #   • table  — flat upper polygon (small radius, full crown height)
    #   • girdle — widest equator band (large radius, Z = 0)
    #   • culet  — single apex at the base (point, not a face, for this cut)
    table_verts  = []
    girdle_verts = []
    for i in range(N_SIDES):
        angle        = (2 * math.pi / N_SIDES) * i
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        table_verts.append(
            bm.verts.new((R_TABLE * cos_a,  R_TABLE * sin_a,  H_CROWN))
        )
        girdle_verts.append(
            bm.verts.new((R_GIRDLE * cos_a, R_GIRDLE * sin_a, 0.0))
        )
    culet = bm.verts.new((0.0, 0.0, -H_PAVILION))

    # ensure_lookup_table() MUST be called after any vert/edge/face creation
    # before indexing bm.verts[i] by integer.  The lookup table is an internal
    # C array that becomes stale after structural changes.
    bm.verts.ensure_lookup_table()

    # ── face construction ─────────────────────────────────────────────────────
    # Table face: single N-gon — one flat top facet.
    bm.faces.new(table_verts[:])

    for i in range(N_SIDES):
        j = (i + 1) % N_SIDES
        # Crown kite: trapezoid bridging table edge to girdle edge.
        # Winding is approximate here — recalc_face_normals corrects it.
        bm.faces.new([
            table_verts[i], girdle_verts[i],
            girdle_verts[j], table_verts[j],
        ])
        # Pavilion triangle: girdle edge converging at culet.
        bm.faces.new([girdle_verts[i], culet, girdle_verts[j]])

    bm.faces.ensure_lookup_table()

    # Flood-fill normals outward from the first face — robust regardless of
    # per-face winding order used during construction above.
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    # ── per-loop UV: cylindrical projection ──────────────────────────────────
    # UV data lives on *loops* (half-edges), not vertices — adjacent faces can
    # therefore have discontinuous UV coordinates at shared edges, which is
    # required for flat-unfolded faceted textures.
    total_h  = H_CROWN + H_PAVILION
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            co  = loop.vert.co
            u   = (math.atan2(co.y, co.x) / (2 * math.pi) + 0.5) % 1.0
            v   = (co.z + H_PAVILION) / total_h   # 0.0 at culet, 1.0 at table
            loop[uv_layer].uv = (u, v)

    return bm


# ── material: Principled BSDF glass gem ───────────────────────────────────────

def add_glass_material(ob: bpy.types.Object) -> None:
    """Sapphire-blue glass via Principled BSDF full transmission + 0 roughness."""
    mat  = bpy.data.materials.new("GemGlass")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    # Sapphire colour — override with any gem hue at the BSDF Base Color input
    bsdf.inputs["Base Color"].default_value       = (0.06, 0.28, 0.82, 1.0)
    bsdf.inputs["Roughness"].default_value        = 0.0
    bsdf.inputs["IOR"].default_value              = 2.42   # diamond IOR
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    ob.data.materials.append(mat)


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Build geometry via bmesh — context-free, no Edit Mode
    bm = build_gem_bmesh()

    me = bpy.data.meshes.new(OBJECT_NAME + "_mesh")
    bm.to_mesh(me)   # push topology + UV layer into the bpy.data.Mesh
    bm.free()        # ALWAYS free: bmesh holds C-side heap allocation

    # Mark every edge sharp — all edges are facet boundaries in a brilliant cut.
    # In Blender 5.1 the canonical storage is mesh.attributes["sharp_edge"];
    # use_edge_sharp is the per-edge Python accessor for that boolean attribute.
    for edge in me.edges:
        edge.use_edge_sharp = True

    ob = bpy.data.objects.new(OBJECT_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob["holoflow:facet"] = True   # Holoflow Studio export flag

    add_glass_material(ob)

    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    v_count = len(me.vertices)
    f_count = len(me.polygons)
    print(f"[bmesh gem] {v_count}V  {len(me.edges)}E  {f_count}F → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
