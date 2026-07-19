"""
bmesh.ops.symmetrize — Half-Mesh Mirror & Merge for VRM Character Helmet
Blender 5.1 | Holoflow Studio | CC0

WHY THIS OP INSTEAD OF THE MIRROR MODIFIER
-------------------------------------------
`bpy.types.MirrorModifier` is non-destructive and live — it stays in the
stack and doubles topology at render time.  That is ideal while sculpting but
a liability for VRM export: the glTF exporter must apply every modifier, which
can produce seam duplicates or unapplied data if the stack is dirty.
`bmesh.ops.symmetrize` is DESTRUCTIVE — it bakes the mirror into the mesh
immediately, merges seam verts within `dist`, and leaves you with clean final
topology ready for weight-painting and GLB export.

KEY API FACTS
-------------
- input: ALL geometry (verts + edges + faces) from the source half
- direction: controls which side is the SOURCE
    'X'  → positive-X is source, mirror copies to negative-X
    '-X' → negative-X is source, mirror copies to positive-X
- dist: merge threshold for verts at mirror plane.  Verts within `dist` of
        X=0 snap together into a single vert on the seam.  Too small → seam
        gap; too large → pulls off-plane verts into the seam.
- use_shapekey: propagates symmetrize into shape key data (set False if no SK)
- RETURN: {'geom': [all resulting verts/edges/faces]}  — no sub-keys
- GOTCHA: the mirrored copy has INVERTED WINDING.  Always call
          bmesh.ops.recalc_face_normals after symmetrize.
- GOTCHA: any vert whose X coordinate exceeds `dist` from the mirror plane
          but is on the "destination" side gets DELETED by the op — symmetrize
          replaces, not supplements, the destination half.  Pre-check that
          your half-mesh is strictly on one side before calling.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# ─── constants ───────────────────────────────────────────────────────────────
SEAM_MERGE_DIST = 0.001          # 1 mm merge threshold at the mirror plane
MAT_SHELL_NAME  = "HF_HelmetShell"
MAT_VISOR_NAME  = "HF_HelmetVisor"
GLB_PATH        = "//hf_sym_helmet.glb"
BLEND_NAME      = "hf_sym_helmet"

# Helmet proportions (right half only — X ≥ 0)
SKULL_W   = 0.14   # half-width (X extent of right half)
SKULL_H   = 0.20   # height
SKULL_D   = 0.23   # front-to-back depth
CHIN_DROP = 0.06   # how far the chin guard extends below skull midpoint
VISOR_Z   = 0.04   # Z height of visor opening relative to equator


# ─── material helpers ─────────────────────────────────────────────────────────
def _ensure_mat(name: str, base_col: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*base_col, 1.0)
        bsdf.inputs["Metallic"].default_value   = 0.7
        bsdf.inputs["Roughness"].default_value  = 0.35
    return mat


# ─── geometry builders ────────────────────────────────────────────────────────
def _build_helmet_half(bm: bmesh.types.BMesh) -> None:
    """
    Construct the RIGHT half (X ≥ 0) of a stylised sci-fi helmet shell.

    Strategy:
      1. Start with a subdivided box scaled to skull proportions.
      2. Delete all faces/verts with X < -SEAM_MERGE_DIST (left half).
      3. Pull the front crown forward and taper the chin downward.
      4. Cut a visor notch in the front face cluster.
      5. Flatten all seam verts to X = 0 precisely so symmetrize can merge them.

    The topology stays low-poly / faceted — smooth groups are handled via the
    sharp_edge boolean attribute (flat shading per-face), not geometry density.
    """
    # 1. box subdivided 2×3×2 (W, H, D) — gives us enough loops to shape
    bmesh.ops.create_grid(bm, x_segments=2, y_segments=4, size=1.0)
    # create_grid makes a flat XY plane; we need a 3-D box — use create_cube
    bm.clear()

    # create_cube gives 8 verts, 12 edges, 6 faces; subdivide for shaping loops
    cube_result = bmesh.ops.create_cube(bm, size=1.0)  # noqa: F841
    bmesh.ops.subdivide_edges(
        bm,
        edges=bm.edges[:],
        cuts=2,
        use_grid_fill=True,
    )

    # 2. Scale to skull proportions
    bmesh.ops.scale(
        bm,
        vec=(SKULL_W, SKULL_D, SKULL_H),
        verts=bm.verts[:],
    )

    # 3. Lift the top (Z > 0.08) verts for a dome
    crown_verts = [v for v in bm.verts if v.co.z > SKULL_H * 0.5]
    bmesh.ops.scale(
        bm,
        vec=(0.8, 0.85, 1.0),
        space=Matrix.Identity(4),
        verts=crown_verts,
    )

    # 4. Drop chin verts
    chin_verts = [v for v in bm.verts if v.co.z < -SKULL_H * 0.35]
    bmesh.ops.translate(
        bm,
        vec=Vector((0.0, 0.02, -CHIN_DROP)),
        verts=chin_verts,
    )
    bmesh.ops.scale(
        bm,
        vec=(0.65, 0.7, 1.0),
        space=Matrix.Identity(4),
        verts=chin_verts,
    )

    # 5. Delete left half — keep only X ≥ -SEAM_MERGE_DIST
    left_faces = [f for f in bm.faces if f.calc_center_median().x < -SEAM_MERGE_DIST]
    bmesh.ops.delete(bm, geom=left_faces, context="FACES")

    # Remove any dangling edges / lone verts on the seam
    bmesh.ops.delete(
        bm,
        geom=[e for e in bm.edges if not e.link_faces],
        context="EDGES",
    )
    bmesh.ops.delete(
        bm,
        geom=[v for v in bm.verts if not v.link_edges],
        context="VERTS",
    )

    # 6. Flatten seam column to X = 0 exactly
    for v in bm.verts:
        if abs(v.co.x) < SEAM_MERGE_DIST * 4:
            v.co.x = 0.0

    # 7. Visor notch — pull a row of front-facing verts inward (negative Y)
    front_verts = [
        v for v in bm.verts
        if v.co.y > SKULL_D * 0.35
        and VISOR_Z - 0.05 < v.co.z < VISOR_Z + 0.09
        and v.co.x > 0.01
    ]
    bmesh.ops.translate(
        bm,
        vec=Vector((0.0, -0.025, 0.0)),
        verts=front_verts,
    )

    # 8. Ridge along top-centre — lift X ≈ 0 crown verts slightly
    ridge_verts = [
        v for v in bm.verts
        if v.co.z > SKULL_H * 0.3
        and v.co.x < SKULL_W * 0.15
    ]
    bmesh.ops.translate(
        bm,
        vec=Vector((0.0, 0.0, 0.008)),
        verts=ridge_verts,
    )

    # 9. Mark all edges sharp — faceted low-poly aesthetic
    for e in bm.edges:
        e.seam = False
    sharp_layer = bm.edges.layers.bool.get("sharp_edge") \
                  or bm.edges.layers.bool.new("sharp_edge")
    for e in bm.edges:
        e[sharp_layer] = True

    # 10. Flat shade
    for f in bm.faces:
        f.smooth = False


def _assign_visor_material(
    bm: bmesh.types.BMesh,
    visor_mat_idx: int,
) -> None:
    """
    After symmetrize the full helmet exists.  Assign the visor material to
    front-facing faces near the visor opening.
    """
    for f in bm.faces:
        c = f.calc_center_median()
        if c.y > SKULL_D * 0.3 and VISOR_Z - 0.06 < c.z < VISOR_Z + 0.11:
            f.material_index = visor_mat_idx


# ─── main ────────────────────────────────────────────────────────────────────
def build_helmet() -> bpy.types.Object:
    # Clean scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Materials
    mat_shell = _ensure_mat(MAT_SHELL_NAME, (0.12, 0.14, 0.18))
    mat_visor = _ensure_mat(MAT_VISOR_NAME, (0.05, 0.35, 0.55))

    # ── Phase 1: build right half ────────────────────────────────────────────
    me_half = bpy.data.meshes.new("hf_helmet_half")
    bm_half = bmesh.new()
    _build_helmet_half(bm_half)
    bm_half.to_mesh(me_half)
    bm_half.free()

    ob_half = bpy.data.objects.new("HF_HelmetHalf", me_half)
    bpy.context.scene.collection.objects.link(ob_half)
    bpy.context.view_layer.objects.active = ob_half
    ob_half.select_set(True)

    # ── Phase 2: symmetrize the right half across X=0 ───────────────────────
    #
    # TECHNIQUE: open a new bmesh from the half-mesh, call symmetrize with
    # direction='-X' so the positive-X source copies toward negative-X.
    #
    # direction='-X' means: "the NEGATIVE-X side is the destination; the
    # POSITIVE-X side is the source".  Equivalently: mirror from right to left.
    #
    # The op deletes everything that was on the destination side and replaces it
    # with the mirrored copy.  Since our half-mesh has NOTHING on the left side
    # already (we deleted it in _build_helmet_half), no existing geometry is
    # lost — only the new mirrored copy is placed there.
    #
    me_full = bpy.data.meshes.new("hf_helmet_full")
    bm_full = bmesh.new()
    bm_full.from_mesh(me_half)

    # All geometry is source for the op
    all_geom = bm_full.verts[:] + bm_full.edges[:] + bm_full.faces[:]

    bmesh.ops.symmetrize(
        bm_full,
        input=all_geom,
        direction="-X",   # positive-X → mirror → negative-X
        dist=SEAM_MERGE_DIST,
        use_shapekey=False,
    )

    # MANDATORY: mirrored copy has inverted winding → recalc_face_normals
    bmesh.ops.recalc_face_normals(bm_full, faces=bm_full.faces[:])

    # Propagate sharp_edge layer to the new mirrored faces
    sharp_layer = bm_full.edges.layers.bool.get("sharp_edge") \
                  or bm_full.edges.layers.bool.new("sharp_edge")
    for e in bm_full.edges:
        e[sharp_layer] = True
    for f in bm_full.faces:
        f.smooth = False

    # ── Phase 3: material assignment on full symmetric mesh ─────────────────
    bm_full.to_mesh(me_full)   # temp write to count materials
    me_full.materials.append(mat_shell)
    me_full.materials.append(mat_visor)

    # Re-open to assign mat indices
    bm_full.from_mesh(me_full)
    _assign_visor_material(bm_full, visor_mat_idx=1)

    bm_full.to_mesh(me_full)
    bm_full.free()

    ob_full = bpy.data.objects.new("HF_HelmetFull", me_full)
    bpy.context.scene.collection.objects.link(ob_full)
    ob_full.location = (0.0, 0.0, 0.0)

    # Holoflow WebXR export tag
    ob_full["holoflow:facet"] = True

    # Remove the half-mesh helper
    bpy.data.objects.remove(ob_half, do_unlink=True)
    bpy.data.meshes.remove(me_half)

    # Apply transform (symmetrize result is already at origin)
    bpy.context.view_layer.objects.active = ob_full
    ob_full.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    return ob_full


def export_glb(ob: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
        export_apply=True,
        export_extras=True,
    )


if __name__ == "__main__":
    ob = build_helmet()
    export_glb(ob)
    bpy.ops.wm.save_as_mainfile(
        filepath=bpy.path.abspath(f"//{BLEND_NAME}.blend")
    )
    print(f"[holoflow] symmetrize helmet complete — {len(ob.data.vertices)} verts")
