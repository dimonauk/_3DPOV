"""
Custom Split Normals — Per-Loop Normal Authoring
Blender 5.1  |  Holoflow Studio  |  CC0

Technique: build a faceted icosphere, detect smooth-shading islands by
face-normal similarity (Union-Find), compute per-island averaged normals,
and stamp them onto the mesh via mesh.normals_split_custom_set().

Key 5.1 migration note ─────────────────────────────────────────────────
Blender 4.1 removed `mesh.use_auto_smooth` and `mesh.auto_smooth_angle`.
The replacement is the "Smooth by Angle" Geometry Nodes modifier, added
via bpy.ops.object.shade_smooth_by_angle(angle=...) or the modifier API.
However, that modifier computes normals at viewport/render time; it cannot
produce truly arbitrary per-loop values.  normals_split_custom_set() is
the ONLY path to hand-authored per-loop normals in 5.1.  The smooth-by-
angle modifier, if present, OVERRIDES custom split normals — remove it or
do not add it when working with this technique.

Outside sources ────────────────────────────────────────────────────────
- Blender Foundation, bpy.types.Mesh API (CC-BY-SA 4.0):
  https://docs.blender.org/api/5.1/bpy.types.Mesh.html
- Blender Foundation, Release Notes 4.1 — Auto Smooth Removal (CC-BY-SA):
  https://wiki.blender.org/wiki/Reference/Release_Notes/4.1/Python_API
- io_scene_gltf2 GLTF exporter (Apache-2.0):
  https://projects.blender.org/blender/blender/src/branch/main/scripts/addons_core/io_scene_gltf2
"""

import bpy
import bmesh
from mathutils import Vector

# ─── Constants ────────────────────────────────────────────────────────────────
OBJ_NAME          = "normal_gem"
ICO_SUBDIVS       = 2          # 320 triangular faces — enough resolution for visible islands
ICO_RADIUS        = 1.0
SMOOTH_DOT        = 0.82       # cos ~35°: faces within 35° of each other → same island
MAT_NAME          = "NormalGem_Metal"
EXPORT_FILENAME   = "custom_normals_gem.glb"
EXPORT_REL        = f"//{EXPORT_FILENAME}"


# ─── Scene Setup ──────────────────────────────────────────────────────────────

def clear_scene() -> None:
    """Delete all mesh objects without relying on operator context."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


# ─── Mesh Construction ────────────────────────────────────────────────────────

def build_icosphere() -> tuple[bpy.types.Mesh, bpy.types.Object]:
    """
    Create a subdivided icosphere using bmesh.ops rather than
    bpy.ops.mesh.primitive_ico_sphere_add().

    WHY direct BMesh?  bpy.ops operators need an active 3D view context.
    From a Script Editor or background process, that context is absent and
    the operator raises RuntimeError.  The BMesh equivalent has no
    context requirement.
    """
    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(
        bm,
        subdivisions=ICO_SUBDIVS,
        radius=ICO_RADIUS,
    )
    bm.to_mesh(mesh)
    bm.free()

    # Force geometry recalculation so mesh.polygons[i].normal is current.
    # In 4.1+ there is no calc_normals(); normals refresh automatically
    # on mesh.update(calc_edges=True).
    mesh.update(calc_edges=True)

    return mesh, obj


# ─── Material ─────────────────────────────────────────────────────────────────

def add_metallic_material(obj: bpy.types.Object) -> bpy.types.Material:
    """
    Attach a simple metallic PBR material so shading differences between
    smooth and flat normal islands are visible in the viewport.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()
    out   = nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value  = (0.72, 0.55, 0.18, 1.0)  # warm gold
    bsdf.inputs["Metallic"].default_value    = 1.0
    bsdf.inputs["Roughness"].default_value   = 0.15
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    out.location  = (300, 0)
    bsdf.location = (0, 0)

    obj.data.materials.append(mat)
    return mat


# ─── Island Detection ─────────────────────────────────────────────────────────

def detect_islands(mesh: bpy.types.Mesh) -> dict[int, int]:
    """
    Assign each polygon to a normal island via Union-Find.

    Two faces belong to the same island when:
      dot(normal_A, normal_B) > SMOOTH_DOT

    This is NOT the same as sharing an edge that is marked smooth.
    Union-Find merges faces transitively: if A≈B and B≈C, all three merge
    even if A and C are far apart angularly.  For the gem case this is the
    desired behaviour (the 5-face "cap" of an icosahedron all merge because
    each face is within 35° of its neighbours).

    Returns: dict mapping face_index → canonical island root index.

    WHY Union-Find over simple clustering?
      Naive pair-comparison is O(F²) and stops at one hop.  Union-Find is
      O(F² · α(F)) — similar asymptotic complexity for small meshes but
      handles transitivity correctly without extra bookkeeping.
    """
    n = len(mesh.polygons)
    normals = [mesh.polygons[i].normal.copy() for i in range(n)]

    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]   # path compression
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        parent[find(a)] = find(b)

    for i in range(n):
        for j in range(i + 1, n):
            if normals[i].dot(normals[j]) > SMOOTH_DOT:
                union(i, j)

    return {i: find(i) for i in range(n)}


# ─── Normal Computation ───────────────────────────────────────────────────────

def island_averaged_normals(
    mesh: bpy.types.Mesh,
    face_to_island: dict[int, int],
) -> dict[int, Vector]:
    """
    For each island root, compute the face-area-weighted average normal of
    all member polygons.

    WHY area-weighted?
      Uniformly averaging normals gives equal vote to tiny and large faces.
      A large flat panel should dominate the island normal; a tiny sliver
      face at the boundary should not pull the normal toward the edge.

    Returns: dict mapping island_root → averaged unit Vector.
    """
    accum:  dict[int, Vector] = {}
    weight: dict[int, float]  = {}

    for poly in mesh.polygons:
        root = face_to_island[poly.index]
        area = poly.area
        accum.setdefault(root, Vector((0, 0, 0)))
        weight.setdefault(root, 0.0)
        accum[root]  += poly.normal * area
        weight[root] += area

    result: dict[int, Vector] = {}
    for root, vec in accum.items():
        w = weight[root]
        n = (vec / w) if w > 1e-12 else Vector((0, 0, 1))
        n.normalize()
        result[root] = n

    return result


def build_per_loop_normals(
    mesh: bpy.types.Mesh,
    face_to_island: dict[int, int],
    island_normals:  dict[int, Vector],
) -> list[tuple[float, float, float]]:
    """
    Build a flat list of (x, y, z) normals, one per mesh loop.

    Loop ordering in Blender: for each polygon in mesh.polygons order,
    its loops span [poly.loop_start, poly.loop_start + poly.loop_total).
    normals_split_custom_set() expects this exact ordering — one entry per
    loop, polygon by polygon.

    Within an island all loops on a face receive the same averaged normal,
    so the shading blends smoothly across shared edges.  At island
    boundaries the normals diverge, producing a sharp silhouette.
    """
    out: list[tuple[float, float, float]] = []
    for poly in mesh.polygons:
        n = island_normals[face_to_island[poly.index]]
        for _ in poly.loop_indices:
            out.append((n.x, n.y, n.z))
    return out


# ─── Apply Custom Split Normals ───────────────────────────────────────────────

def apply_custom_normals(
    mesh:    bpy.types.Mesh,
    normals: list[tuple[float, float, float]],
) -> None:
    """
    Stamp per-loop split normals onto the mesh.

    Steps:
      1. Enable smooth shading on every polygon.
         use_smooth=False causes the polygon to render with its face normal
         regardless of what normals_split_custom_set() stored.  The custom
         normals are silently ignored for flat-shaded polygons.

      2. Call normals_split_custom_set(normals).
         The list length must equal sum(poly.loop_total for poly in polys).
         A mismatch raises RuntimeError immediately.

    There is NO need to call mesh.use_auto_smooth = True in Blender 4.1+.
    That attribute no longer exists; accessing it raises AttributeError.
    Custom split normals are respected unconditionally once set.
    """
    for poly in mesh.polygons:
        poly.use_smooth = True

    mesh.normals_split_custom_set(normals)

    # Validate: read back and spot-check the first loop.
    mesh.calc_normals_split()
    first_stored = mesh.loops[0].normal.copy()
    expected     = Vector(normals[0])
    delta        = (first_stored - expected).length
    if delta > 0.001:
        print(f"[holoflow] WARNING: normal mismatch on loop 0 — "
              f"stored {first_stored!r}, expected {expected!r}")
    mesh.free_normals_split()


# ─── Export ───────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object, rel_path: str) -> None:
    """
    Export the single object as GLB with custom normals baked.

    export_normals=True is the default; listed here explicitly for clarity.
    The GLTF exporter reads split normals from mesh.loops[i].normal after
    calling calc_normals_split() internally, so our custom normals survive
    the export without any additional steps.

    WHY export_apply=False here?
      export_apply applies all modifiers and resets the object transform.
      A "Smooth by Angle" modifier applied here WOULD recompute normals,
      overwriting our custom values.  Since we set custom normals directly
      on the data-block and the object has no modifiers, export_apply is
      harmless either way, but disabling it makes the intent explicit.
    """
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    abs_path = bpy.path.abspath(rel_path)
    bpy.ops.export_scene.gltf(
        filepath=abs_path,
        use_selection=True,
        export_format='GLB',
        export_normals=True,
        export_apply=False,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[holoflow] exported → {abs_path}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()

    mesh, obj = build_icosphere()
    add_metallic_material(obj)

    face_to_island  = detect_islands(mesh)
    island_count    = len(set(face_to_island.values()))
    print(f"[holoflow] {len(mesh.polygons)} faces → {island_count} normal islands")

    island_norms    = island_averaged_normals(mesh, face_to_island)
    loop_normals    = build_per_loop_normals(mesh, face_to_island, island_norms)
    apply_custom_normals(mesh, loop_normals)

    export_glb(obj, EXPORT_REL)
    print("[holoflow] done — custom_normals_gem.glb written")


main()
