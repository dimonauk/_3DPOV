"""
KDTree Nearest-Vertex & BVHTree Surface-Snap — Blender 5.1
===========================================================
Technique: spatial queries using mathutils.kdtree.KDTree and
mathutils.bvhtree.BVHTree on an evaluated mesh.

KDTree  — O(log n) k-nearest-neighbour over vertex positions.  Ideal for
          "which vertex is closest to this world coordinate?" — used in
          scatter seeding, IK proximity targets, and lattice-driven add-ons.

BVHTree — bounding-volume-hierarchy over mesh faces.  Supports ray_cast()
          (returns hit location, normal, face index, distance) and
          find_nearest() (surface-snap with no ray direction required).
          BVH is what Shrinkwrap, the viewport snapping engine, and every
          brush-radius tool uses internally.

Demo: displace an icosphere, scatter 64 random "probe" positions in the
bounding box, snap each probe to the nearest face via BVHTree.find_nearest(),
then build a KDTree over the snapped positions and draw k-NN edges between
neighbours.  The result — a surface constellation — is exported as GLB with
a vertex-colour attribute encoding snap distance.

Source: Blender Python API — mathutils module
        https://docs.blender.org/api/current/mathutils.html
        Licence: CC-BY-SA 4.0 / Blender Foundation
"""

# ── PARAMETERS ─────────────────────────────────────────────────────────────
SUBDIVISIONS = 3        # icosphere subdivisions → 320 triangles
NOISE_SCALE  = 0.25     # per-vertex normal-displacement magnitude (m)
PROBE_COUNT  = 64       # random probe positions
BOX_RADIUS   = 1.3      # half-extent of probe cloud (m)
KD_NEIGHBOURS = 2       # KD k-NN edges per snapped probe
EXPORT_PATH  = "//spatial_constellation.glb"
SEED         = 7        # reproducible layout

# ── DEPENDENCIES ───────────────────────────────────────────────────────────
import bpy
import bmesh
import random
import mathutils
from mathutils import Vector

# ── HELPERS ────────────────────────────────────────────────────────────────

def _clean_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def _link(obj: bpy.types.Object) -> None:
    bpy.context.collection.objects.link(obj)


def _solid_mat(name: str, rgba: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = rgba
    return mat


# ── STAGE 1: ANCHOR MESH ───────────────────────────────────────────────────

def build_anchor(subdivisions: int, noise_scale: float, seed: int) -> bpy.types.Object:
    """
    Icosphere with per-vertex noise displacement — the surface probes snap onto.
    Using bmesh.ops.create_icosphere avoids bpy.ops (no context dependency).
    Noise is applied along each vertex's own normal so the displacement is
    radially consistent and doesn't collapse interior normals.
    """
    me = bpy.data.meshes.new("anchor_mesh")
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0)
    bm.verts.ensure_lookup_table()

    rng = random.Random(seed)
    for v in bm.verts:
        # Noise along outward normal — keeps the shape convex-ish
        v.co += v.normal * rng.gauss(0, noise_scale)

    bm.to_mesh(me)
    bm.free()
    me.calc_normals_split()     # mandatory after manual co edits

    obj = bpy.data.objects.new("AnchorMesh", me)
    _link(obj)
    obj.data.materials.append(_solid_mat("mat_anchor", (0.08, 0.12, 0.22, 1.0)))
    return obj


# ── STAGE 2: SPATIAL STRUCTURES ────────────────────────────────────────────

def build_bvh_and_kd(obj: bpy.types.Object):
    """
    Build BVHTree and KDTree from the fully-evaluated mesh.

    BVHTree.FromObject(eval_obj, depsgraph) resolves every modifier — critical
    when the anchor carries a Subdivision Surface or Displace modifier that is
    not yet applied to the base mesh.  Without the evaluated depsgraph the BVH
    would query the un-displaced cage, producing snapped positions that miss
    the actual surface by the modifier displacement amount.

    KDTree stores world-space vertex positions (matrix_world @ v.co) so that
    find_n() queries can be issued in world space directly — no inverse-matrix
    step is needed at query time.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj  = obj.evaluated_get(depsgraph)
    mw        = eval_obj.matrix_world

    # BVHTree from the evaluated object — owns its own copy of mesh data
    bvh = mathutils.bvhtree.BVHTree.FromObject(eval_obj, depsgraph)

    # KDTree from evaluated vertex world positions
    me  = eval_obj.to_mesh()
    kd  = mathutils.kdtree.KDTree(len(me.vertices))
    for i, v in enumerate(me.vertices):
        kd.insert(mw @ v.co, i)
    kd.balance()               # balance() partitions the tree; mandatory before find*()
    eval_obj.to_mesh_clear()   # release temporary mesh data — not collected automatically

    return bvh, kd


# ── STAGE 3: PROBE SNAP ────────────────────────────────────────────────────

def snap_probes(bvh, probe_count: int, box_r: float, seed: int) -> list:
    """
    Generate random probes, snap each to the nearest surface point.

    BVHTree.find_nearest(origin) returns (location, normal, face_index, dist).
    All four fields can be None when the BVH is empty — guard even though our
    mesh is guaranteed non-empty, because this pattern is the correct one to
    copy into production add-on code where the object might be an empty.

    dist is the Euclidean distance from the query point to the snapped surface
    location, NOT the distance from the mesh origin.  It is used here as a
    per-probe colour weight.
    """
    rng = random.Random(seed + 100)    # distinct seed from mesh displacement
    raw = [
        Vector((rng.uniform(-box_r, box_r),
                rng.uniform(-box_r, box_r),
                rng.uniform(-box_r, box_r)))
        for _ in range(probe_count)
    ]

    snapped = []
    for q in raw:
        loc, normal, _face_idx, dist = bvh.find_nearest(q)
        if loc is None:
            snapped.append((q.copy(), Vector((0, 0, 1)), 0.0))
        else:
            snapped.append((loc.copy(), (normal or Vector((0, 0, 1))).copy(), dist))

    return snapped


# ── STAGE 4: KD EDGES ON SNAPPED POINTS ────────────────────────────────────

def kd_edges(snapped: list, k: int) -> list:
    """
    Build a KDTree over the snapped positions, find k nearest neighbours per
    point, and return a de-duplicated edge list.

    KDTree.find_n(co, n) returns the n closest entries including the query
    point itself at index 0 (dist=0).  Requesting k+1 and skipping self (j==i)
    gives exactly k unique neighbours.
    """
    snap_kd = mathutils.kdtree.KDTree(len(snapped))
    for i, (pos, _n, _d) in enumerate(snapped):
        snap_kd.insert(pos, i)
    snap_kd.balance()

    edge_set = set()
    for i, (pos, _n, _d) in enumerate(snapped):
        for _co, j, _dist in snap_kd.find_n(pos, k + 1):
            if j != i:
                edge_set.add((min(i, j), max(i, j)))
    return list(edge_set)


# ── STAGE 5: VISUALISE ─────────────────────────────────────────────────────

def build_constellation(snapped: list, edges: list) -> bpy.types.Object:
    """
    One mesh: vertices at snapped positions, edges from KD neighbour pairs.
    FLOAT_COLOR attribute 'snap_dist' on POINT domain encodes normalised dist.
    An Emission shader reads 'snap_dist' via the Attribute node so the colour
    survives GLB export as vertex colour → Three.js geometry.attributes.Color.
    """
    me = bpy.data.meshes.new("constellation_mesh")
    bm = bmesh.new()
    col_layer = bm.verts.layers.float_color.new("snap_dist")

    max_d = max((d for _, _, d in snapped), default=1.0) or 1.0
    bm_verts = []
    for pos, _n, dist in snapped:
        v = bm.verts.new(pos)
        t = dist / max_d        # 0 = on surface (red), 1 = furthest (blue)
        v[col_layer] = (1.0 - t, 0.35 * (1.0 - t), t, 1.0)
        bm_verts.append(v)

    bm.verts.ensure_lookup_table()
    for i, j in edges:
        try:
            bm.edges.new((bm_verts[i], bm_verts[j]))
        except ValueError:
            pass                # bmesh raises ValueError on duplicate edges

    bm.to_mesh(me)
    bm.free()

    # Emission shader reading the colour attribute
    mat  = bpy.data.materials.new("mat_constellation")
    mat.use_nodes = True
    tree = mat.node_tree
    for n in list(tree.nodes):
        tree.nodes.remove(n)
    out  = tree.nodes.new("ShaderNodeOutputMaterial");  out.location  = (300, 0)
    emit = tree.nodes.new("ShaderNodeEmission");         emit.location = (100, 0)
    attr = tree.nodes.new("ShaderNodeAttribute");        attr.location = (-120, 0)
    attr.attribute_name = "snap_dist"
    tree.links.new(attr.outputs["Color"], emit.inputs["Color"])
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    obj = bpy.data.objects.new("Constellation", me)
    _link(obj)
    obj.data.materials.append(mat)
    return obj


# ── STAGE 6: EXPORT ────────────────────────────────────────────────────────

def export_glb(path: str) -> None:
    # export_colors=True writes FLOAT_COLOR attributes as COLOR_0 accessor
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_colors=True,
        use_selection=False,
    )
    print(f"[spatial] exported → {path}")


# ── MAIN ───────────────────────────────────────────────────────────────────

def main() -> None:
    _clean_scene()

    anchor       = build_anchor(SUBDIVISIONS, NOISE_SCALE, SEED)
    bvh, _kd     = build_bvh_and_kd(anchor)
    snapped      = snap_probes(bvh, PROBE_COUNT, BOX_RADIUS, SEED)
    edges        = kd_edges(snapped, KD_NEIGHBOURS)
    build_constellation(snapped, edges)

    export_glb(EXPORT_PATH)
    print(f"[spatial] {PROBE_COUNT} probes snapped, {len(edges)} KD edges")


main()
