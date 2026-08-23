"""
Weaire-Phelan A15 Foam — Poi Head Blueprint
============================================
Blender 5.1  bpy · NumPy · SciPy

Technique
─────────
  1. Construct the 8 seed points of the A15 crystal lattice (space group
     Pm-3n, #223) in one cubic unit cell.
  2. Tile into a 3×3×3 periodic supercell (216 seeds total) so every
     central-cell Voronoi vertex lies inside the supercell — no
     "point at infinity" artefact from scipy.spatial.Voronoi.
  3. Run scipy.spatial.Voronoi on all 216 seeds.
  4. For each of the 8 central seeds extract the Voronoi polyhedron via
     scipy.spatial.ConvexHull on the region vertex set.  Valid because
     Voronoi cells are always strictly convex for generic seed positions.
  5. Triangulate via hull.simplices → BMesh → flat-shaded Blender mesh.
  6. Two materials: amber (type-A pentagonal dodecahedra) and cobalt
     (type-B tetrakaidecahedra).  FLOAT_COLOR POINT attribute "WP_Colour"
     for the WebXR vertex-colour pipeline.
  7. Scale to POI_R bounding sphere, two shape keys (SK_Tight/SK_Expanded).
  8. Wireframe modifier → cage overlay reveals cell topology.

Kelvin's 1887 conjecture
────────────────────────
  Lord Kelvin asked: partition ℝ³ into equal-volume cells with the
  minimum total interfacial area.  His own answer — the bitruncated cubic
  honeycomb (truncated octahedra, 14 faces each) — stood for 107 years.
  Weaire & Phelan (1994) found a two-cell periodic structure, derived from
  the A15 crystal lattice, that achieves ~0.3 % less surface area per
  unit volume.  It has never been beaten analytically.
"""

import bpy, bmesh
import numpy as np
from scipy.spatial import Voronoi, ConvexHull

# ── parameters ────────────────────────────────────────────────────────────────
L         = 1.0        # unit cell edge (abstract; scaled to poi at the end)
POI_R     = 0.082      # target bounding-sphere radius in metres
WIRE_T    = 0.0013     # wireframe tube diameter after scaling (m)
DB_DIST   = 1e-5       # remove_doubles merge distance (abstract units)

# Material colours (linear-sRGB RGBA)
COL_A = (0.85, 0.54, 0.10, 1.0)   # amber  — type-A pentagonal dodecahedra
COL_B = (0.16, 0.36, 0.80, 1.0)   # cobalt — type-B tetrakaidecahedra

# ── A15 seed fractional coordinates ──────────────────────────────────────────
# Type A — Wyckoff 2a in Pm-3n: (0,0,0) and (½,½,½)
FRAC_A = np.array([[0.00, 0.00, 0.00],
                   [0.50, 0.50, 0.50]])

# Type B — Wyckoff 6c in Pm-3n: cyclic permutations of (0, ¼, ½) and (0, ¾, ½)
# Three orthogonal atom chains, each with two atoms per chain.
FRAC_B = np.array([
    [0.00, 0.25, 0.50], [0.00, 0.75, 0.50],   # chain || z-axis
    [0.50, 0.00, 0.25], [0.50, 0.00, 0.75],   # chain || x-axis
    [0.25, 0.50, 0.00], [0.75, 0.50, 0.00],   # chain || y-axis
])

SEEDS  = np.vstack([FRAC_A, FRAC_B]) * L       # (8, 3), abstract units
N_SEED = 8
TYPES  = [0, 0] + [1] * 6                      # 0=A(amber), 1=B(cobalt)
COLS   = [COL_A, COL_B]

# ── material helper ───────────────────────────────────────────────────────────
def make_mat(name: str, col: tuple):
    """Create or update a Principled BSDF material."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    p = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
    if p is None:
        p = nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = col
    p.inputs["Metallic"].default_value   = 0.0
    p.inputs["Roughness"].default_value  = 0.45
    mat.use_backface_culling = False
    return mat

# ── periodic supercell seeds ──────────────────────────────────────────────────
def periodic_seeds():
    """
    Tile the unit cell into a 3×3×3 supercell (27 tiles × 8 seeds = 216).
    The central tile corresponds to offset (0,0,0), which is index 13 in
    the lexicographic ordering of {-1,0,+1}³.  Its 8 seed indices are
    [13×8 … 13×8+7].
    """
    offsets = np.array(
        [[dx, dy, dz]
         for dx in (-1, 0, 1)
         for dy in (-1, 0, 1)
         for dz in (-1, 0, 1)], dtype=float
    ) * L
    all_pts = np.vstack([SEEDS + o for o in offsets])   # (216, 3)
    central_start = 13 * N_SEED
    return all_pts, list(range(central_start, central_start + N_SEED))

# ── Voronoi cell faces ────────────────────────────────────────────────────────
def cell_triangles(vor: Voronoi, seed_idx: int):
    """
    Return a list of (3, 3) float64 arrays — the triangulated faces of
    the Voronoi cell for seed `seed_idx`.

    Why ConvexHull works here:
      scipy.spatial.Voronoi labels a Voronoi cell by the indices of its
      vertices.  Because Voronoi cells in ℝ³ are always convex, the convex
      hull of those vertices is exactly the polyhedron we want.
      hull.simplices gives a triangulation of its surface.
    """
    region = vor.regions[vor.point_region[seed_idx]]
    # -1 indicates an unbounded ridge — should not occur for central seeds
    # because the 3×3×3 supercell is large enough.
    if -1 in region or len(region) < 4:
        return []
    pts = vor.vertices[np.array(region, dtype=int)]     # (m, 3)
    try:
        hull = ConvexHull(pts)
    except Exception:
        return []
    return [pts[s] for s in hull.simplices]             # list of (3, 3)

# ── BMesh construction ────────────────────────────────────────────────────────
def build_bm(vor: Voronoi, cidx: list) -> bmesh.types.BMesh:
    """
    Build the foam BMesh.  Each triangle from cell_triangles() becomes a
    BMesh face with material_index set to the cell type.
    remove_doubles merges shared vertices; recalc_face_normals makes all
    normals point outward from the foam interior.
    """
    bm = bmesh.new()
    for i, seed_idx in enumerate(cidx):
        mat_i = TYPES[i]
        for tri in cell_triangles(vor, seed_idx):
            bverts = [bm.verts.new(tuple(float(x) for x in v)) for v in tri]
            try:
                face = bm.faces.new(bverts)
                face.material_index = mat_i
            except ValueError:
                pass                    # degenerate or duplicate — skip
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=DB_DIST)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

# ── scale to poi bounding sphere ──────────────────────────────────────────────
def scale_to_poi(me: bpy.types.Mesh) -> float:
    """Centre mesh at origin, uniform-scale so bounding radius == POI_R."""
    pts = np.array([v.co for v in me.vertices])
    cen = pts.mean(axis=0)
    for v in me.vertices:
        v.co -= cen
    pts -= cen
    r = float(np.sqrt((pts ** 2).sum(axis=1)).max())
    s = POI_R / r if r > 0 else 1.0
    for v in me.vertices:
        v.co *= s
    return s

# ── FLOAT_COLOR vertex-colour attribute ───────────────────────────────────────
def add_vertex_colour(me: bpy.types.Mesh):
    """
    Assign per-vertex colour by averaging the material colours of adjacent
    faces.  Vertices shared between type-A and type-B cells get a blend;
    interior vertices get the pure cell colour.
    """
    attr = me.color_attributes.new("WP_Colour", "FLOAT_COLOR", "POINT")
    accum = {}
    for poly in me.polygons:
        col = COLS[poly.material_index][:3]
        for vi in poly.vertices:
            if vi not in accum:
                accum[vi] = [col, 1]
            else:
                prev, n = accum[vi]
                accum[vi] = [tuple((prev[j]*n + col[j]) / (n+1) for j in range(3)), n+1]
    for vi, (col, _) in accum.items():
        attr.data[vi].color = (*col, 1.0)

# ── shape keys ────────────────────────────────────────────────────────────────
def add_shape_keys(obj: bpy.types.Object, me: bpy.types.Mesh):
    """
    SK_Tight   : vertices nudged 12 mm inward (bubbles contract)
    SK_Expanded: vertices nudged 12 mm outward (bubbles inflate)
    Direction vector is radial from mesh centroid (origin after scale_to_poi).
    """
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_tight    = obj.shape_key_add(name="SK_Tight",    from_mix=False)
    sk_expanded = obj.shape_key_add(name="SK_Expanded", from_mix=False)

    vco   = np.array([v.co for v in me.vertices])
    norms = np.linalg.norm(vco, axis=1, keepdims=True).clip(1e-12)
    dirs  = vco / norms                                     # unit radial vectors
    DELTA = 0.012                                           # 12 mm nudge

    for sv, d, co in zip(sk_tight.data, dirs, vco):
        sv.co = tuple(co - d * DELTA)
    for sv, d, co in zip(sk_expanded.data, dirs, vco):
        sv.co = tuple(co + d * DELTA)

# ════════════════════════════════════════════════════════════════════════════
# Main build sequence
# ════════════════════════════════════════════════════════════════════════════

# 0 ── clear scene
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)

# 1 ── materials
mat_a = make_mat("WP_Amber",  COL_A)
mat_b = make_mat("WP_Cobalt", COL_B)

# 2 ── periodic Voronoi  (216 seeds, runs in < 0.1 s)
all_pts, cidx = periodic_seeds()
vor = Voronoi(all_pts)

# 3 ── BMesh → Blender mesh
bm   = build_bm(vor, cidx)
mesh = bpy.data.meshes.new("hf_weaire_phelan")
bm.to_mesh(mesh)
bm.free()
mesh.materials.append(mat_a)
mesh.materials.append(mat_b)
for poly in mesh.polygons:
    poly.use_smooth = False          # flat shading for studio faceted aesthetic

# 4 ── scale to poi radius
scale_to_poi(mesh)
mesh.update()

# 5 ── vertex colour attribute
add_vertex_colour(mesh)

# 6 ── link object
obj = bpy.data.objects.new("hf_weaire_phelan", mesh)
bpy.context.collection.objects.link(obj)

# 7 ── shape keys
add_shape_keys(obj, mesh)

# 8 ── wireframe modifier — reveals cell topology and junction structure
wf = obj.modifiers.new("Cage", "WIREFRAME")
wf.thickness       = WIRE_T
wf.use_even_offset = True
wf.use_replace     = False           # solid + cage overlay for EEVEE render

# 9 ── holoflow metadata
obj["holoflow:category"] = "poi-head"
obj["holoflow:facet"]    = True
obj["holoflow:surface"]  = "weaire-phelan-a15"
obj["holoflow:space_group"] = "Pm-3n"

# 10 ── set active, origin at geometry centre
bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

# ── report
print(f"[Weaire-Phelan]  vertices: {len(mesh.vertices):,}")
print(f"                 faces   : {len(mesh.polygons):,}")
print(f"                 radius  : {POI_R:.3f} m")
print(f"                 cells   : 2 × A (dodecahedra) + 6 × B (tetrakaidecahedra)")
