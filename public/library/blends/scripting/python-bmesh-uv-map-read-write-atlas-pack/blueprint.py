"""
Blueprint: Python — bmesh UV Map: Per-Face Planar Projection & Atlas Pack
Blender 5.1 | Topic: scripting | CC0 1.0 — Holoflow Studio

TECHNIQUE
─────────
The bmesh UV layer API (bm.loops.layers.uv) is the correct low-level interface for
reading and writing per-loop UV coordinates in Python.  Every face corner (loop)
carries its own UV coordinate even if two adjacent loops share the same vertex —
that is what makes UV seams possible.  The bmesh approach has two advantages over
operator-based UV projection (smart_project, project_from_view):

  1. Scriptable without modal context — no active 3D view or UV Editor required
     when running from the Text Editor or a terminal session.
  2. Deterministic — the projection is purely geometric, never view-dependent.

WHY PER-FACE PLANAR PROJECTION
───────────────────────────────
smart_project groups coplanar triangles by angle similarity and may merge face
islands across sharp edges, producing UV seams exactly where Holoflow's cel
shader expects no seam (at crease edges).  Per-face planar projection guarantees
each face is a self-contained island — flat diffuse texels map 1-to-1 to face
colour without cross-face bleeding.  Each face is projected onto the local XY
plane defined by that face's own normal, scaled to fit a 0-1 square, then the
full set is repacked into an atlas via UV Pack Islands.

PARAMETERS
──────────
UV_LAYER_NAME  : name written to the UV Map data block (survives GLB export)
PACK_MARGIN    : inter-island gutter in atlas UV space (0.005 = half-texel at 2K)
SPHERE_CUTS    : ico-sphere subdivisions — keep low for faceted look (1–2)
EXPORT_BLEND   : destination path; // = blend-file directory
"""

from __future__ import annotations

import bpy
import bmesh
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
UV_LAYER_NAME = "UVMap"
PACK_MARGIN   = 0.005
SPHERE_CUTS   = 1      # 1 sub = 80 triangles, good faceted test case
EXPORT_BLEND  = "//bmesh_uv_atlas.blend"


# ── 1. Build a test faceted icosphere ─────────────────────────────────────────

def build_faceted_icosphere(name: str, cuts: int) -> bpy.types.Object:
    """Add an icosphere and apply flat shading so each face is visually distinct."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=cuts, radius=1.0)
    obj = bpy.context.active_object
    obj.name = name

    # Flat shade — each face becomes its own smooth-group, mirroring Holoflow exports
    mesh = obj.data
    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()
    return obj


# ── 2. Per-face planar UV projection ──────────────────────────────────────────

def _local_frame(normal: Vector):
    """
    Build an orthonormal basis {local_x, local_y} lying in the face plane.

    We cross world_up with normal to get local_x (tangent), then cross normal
    with local_x to get local_y (bitangent).  The world_up fallback avoids the
    degenerate case where normal ≈ (0, 0, 1).
    """
    world_up = Vector((0.0, 0.0, 1.0))
    if abs(normal.dot(world_up)) > 0.999:
        world_up = Vector((1.0, 0.0, 0.0))
    local_x = world_up.cross(normal).normalized()
    local_y  = normal.cross(local_x).normalized()
    return local_x, local_y


def project_face_planar(face: bmesh.types.BMFace, uv_layer) -> None:
    """
    Project a single face onto its own local XY plane and write UVs in [0,1]².

    Steps:
      • Compute centroid and local frame from face.normal
      • Project each loop vertex onto the local plane via dot products
      • Normalise the 2D bounding box to [0,1] preserving aspect ratio
      • Write back to loop[uv_layer].uv — this is the ONLY assignment point

    The uniform scale (max of width/height) preserves the face's actual aspect
    ratio so a rectangular face never gets stretched into a square UV island.
    """
    normal   = face.normal.copy()
    local_x, local_y = _local_frame(normal)
    center   = face.calc_center_median()

    raw = []
    for loop in face.loops:
        v = loop.vert.co - center
        raw.append(Vector((v.dot(local_x), v.dot(local_y))))

    if not raw:
        return

    min_u  = min(p.x for p in raw)
    max_u  = max(p.x for p in raw)
    min_v  = min(p.y for p in raw)
    max_v  = max(p.y for p in raw)
    scale  = max(max_u - min_u, max_v - min_v) or 1.0

    for loop, p in zip(face.loops, raw):
        loop[uv_layer].uv = Vector((
            (p.x - min_u) / scale,
            (p.y - min_v) / scale,
        ))


def apply_per_face_uvs(obj: bpy.types.Object, uv_name: str = UV_LAYER_NAME) -> int:
    """
    Iterate all faces of obj and apply planar projection.

    Returns the face count processed.  Uses a fresh bmesh from the evaluated
    mesh so modifiers are baked before we read vertex positions — critical if
    a Subdivision Surface or Displace modifier is in the stack.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj_eval  = obj.evaluated_get(depsgraph)

    bm = bmesh.new()
    bm.from_mesh(obj_eval.data)
    bm.faces.ensure_lookup_table()

    # verify() returns the first UV layer, creating one if none exist
    uv_layer = bm.loops.layers.uv.get(uv_name) or bm.loops.layers.uv.new(uv_name)

    for face in bm.faces:
        project_face_planar(face, uv_layer)

    # Write back to the *original* (non-evaluated) mesh data block
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return len(obj.data.polygons)


# ── 3. Pack islands into an atlas ─────────────────────────────────────────────

def _get_or_make_image_editor(context: bpy.types.Context):
    """
    Return (area, region) of an IMAGE_EDITOR area, temporarily converting
    the first Properties area if none exists.  Returns (area, region, was_converted).
    """
    for area in context.screen.areas:
        if area.type == 'IMAGE_EDITOR':
            region = next((r for r in area.regions if r.type == 'WINDOW'), None)
            if region:
                return area, region, False

    # Hijack a small area for the duration of the operator call
    target = next(
        (a for a in context.screen.areas if a.type == 'PROPERTIES'),
        context.screen.areas[-1],
    )
    target.type = 'IMAGE_EDITOR'
    region = next((r for r in target.regions if r.type == 'WINDOW'), None)
    return target, region, True


def pack_islands(obj: bpy.types.Object, margin: float = PACK_MARGIN) -> None:
    """
    Pack all UV islands of obj into a single 0-1 atlas using the UV Pack operator.

    bpy.ops.uv.pack_islands requires IMAGE_EDITOR context (its poll checks for
    a SpaceImageEditor).  We obtain that context via temp_override, temporarily
    converting a screen area when no UV Editor is already open.
    """
    ctx  = bpy.context
    area, region, converted = _get_or_make_image_editor(ctx)

    if region is None:
        print("pack_islands: no usable area found — skipping atlas step.")
        return

    try:
        with ctx.temp_override(area=area, region=region):
            # Must be in Edit Mode for the UV operator
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.select_all(action='SELECT')
            bpy.ops.uv.pack_islands(margin=margin, rotate=True, scale=True)
            bpy.ops.object.mode_set(mode='OBJECT')
    finally:
        if converted:
            area.type = 'PROPERTIES'


# ── 4. Read back — downstream verification ────────────────────────────────────

def print_uv_sample(obj: bpy.types.Object, max_faces: int = 5) -> None:
    """
    Print a sample of UV coordinates to the system console.

    Useful for verifying that pack_islands moved islands out of the 0-1 overlap.
    Every loop coordinate should be ≥ 0 and ≤ 1 after packing.
    """
    mesh   = obj.data
    bm     = bmesh.new()
    bm.from_mesh(mesh)
    uv_layer = bm.loops.layers.uv.get(UV_LAYER_NAME)
    if not uv_layer:
        print("No UV layer found.")
        bm.free()
        return

    for i, face in enumerate(bm.faces[:max_faces]):
        print(f"Face {face.index}:")
        for loop in face.loops:
            u, v = loop[uv_layer].uv
            print(f"  loop {loop.index}: u={u:.4f}  v={v:.4f}")
    bm.free()


# ── 5. Save blend ─────────────────────────────────────────────────────────────

def save_blend(filepath: str = EXPORT_BLEND) -> None:
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(filepath))


# ── Main ──────────────────────────────────────────────────────────────────────

def run() -> None:
    """End-to-end: build mesh → project UVs per-face → pack atlas → save."""

    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    obj = build_faceted_icosphere("faceted_uv_sphere", SPHERE_CUTS)

    face_count = apply_per_face_uvs(obj)
    print(f"Projected {face_count} faces with per-face planar UVs.")

    pack_islands(obj)
    print("Atlas packed.")

    print_uv_sample(obj)
    save_blend()
    print(f"Saved → {EXPORT_BLEND}")


if __name__ == "__main__":
    run()
