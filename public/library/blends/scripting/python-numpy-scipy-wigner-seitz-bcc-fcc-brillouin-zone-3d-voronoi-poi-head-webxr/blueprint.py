"""
Wigner-Seitz Cell: BCC / FCC / SC Bravais Lattice 3D Voronoi → Poi Head
Blender 5.1 | Python + numpy + scipy | CC0 | Holoflow Studio

The Wigner-Seitz cell of a Bravais lattice is the Voronoi polyhedron of a
single lattice site: all points in space strictly closer to that site than to
any other.  In solid-state physics the same construction in reciprocal space
yields the first Brillouin zone — the fundamental domain of crystal momentum.

Three classical lattice types produce strikingly different convex polyhedra:
  SC  (simple cubic)      → cube            ( 6 square faces)
  BCC (body-centred cubic)→ truncated octahedron (8 hex + 6 square)
  FCC (face-centred cubic)→ rhombic dodecahedron (12 rhombic faces)

All three share a critical property: they tile 3-space without gaps or overlaps
— they are the Wigner-Seitz fundamental domains of the corresponding lattice,
and exactly the same solids appear as Voronoi cells in random sphere-packing
simulations near the closest-packing limit.

Algorithm:
  1. Express each lattice via its 3 primitive vectors (not the conventional cell).
  2. Generate ±SHELLS unit-cell neighbours around the origin via integer combos.
  3. scipy.Voronoi → origin's Voronoi region → WS cell vertex set.
  4. scipy.ConvexHull → merge co-planar triangles → polygon face list.
  5. Classify each face by its Miller-index family ({100}, {111}, {110}).
  6. Assign a per-loop vertex colour to each family.
  7. Build one bmesh per lattice type, then export a multi-object GLB.
"""

import math, bpy, bmesh, numpy as np
from scipy.spatial import Voronoi, ConvexHull
from mathutils import Vector

# ─── Parameters ────────────────────────────────────────────────────────────────
POI_RADIUS    = 0.08     # metres — each WS cell scales to this circumscribed radius
SHELLS        = 3        # lattice shells around origin for Voronoi stability (≥ 2)
SPACING       = 0.22     # metres — centre-to-centre offset between the three objects
EPS_COPLANAR  = 5e-4     # dot-product tolerance for merging co-planar Hull triangles
EPS_MILLER    = 0.06     # cosine tolerance for Miller-index face classification
OUTPUT_GLB    = "hf_wigner_seitz.glb"

# Per-family vertex colours (linear sRGB, RGBA)
COL_100 = (0.15, 0.55, 1.00, 1.0)   # ice-blue  — {100} square faces  (SC, BCC)
COL_111 = (1.00, 0.55, 0.05, 1.0)   # amber     — {111} hex faces      (BCC)
COL_110 = (0.25, 0.90, 0.35, 1.0)   # lime      — {110} rhombic faces  (FCC)
COL_DEF = (0.70, 0.70, 0.70, 1.0)   # grey      — fallback

# Primitive vectors for each Bravais lattice (a = 1)
# WHY primitive vectors: they define the true repeat unit.  The conventional
# cubic cell is 2× (BCC) or 4× (FCC) larger; using primitive vectors avoids
# redundant Voronoi seeds and halves the computation.
_PRIM = {
    "SC":  np.eye(3, dtype=float),
    "BCC": np.array([[-0.5,  0.5,  0.5],
                     [ 0.5, -0.5,  0.5],
                     [ 0.5,  0.5, -0.5]], dtype=float),
    "FCC": np.array([[ 0.0,  0.5,  0.5],
                     [ 0.5,  0.0,  0.5],
                     [ 0.5,  0.5,  0.0]], dtype=float),
}


# ─── Lattice generation ────────────────────────────────────────────────────────

def generate_lattice(prim, n=SHELLS):
    """
    Return (N, 3) of lattice points  p = i·a₁ + j·a₂ + k·a₃  for i,j,k ∈ [-n, n].
    Origin (0,0,0) is guaranteed at index 0 via an argmin-swap.
    """
    a1, a2, a3 = prim
    pts = [i*a1 + j*a2 + k*a3
           for i in range(-n, n+1)
           for j in range(-n, n+1)
           for k in range(-n, n+1)]
    pts = np.array(pts, dtype=float)
    idx0 = np.argmin(np.linalg.norm(pts, axis=1))
    pts[[0, idx0]] = pts[[idx0, 0]]
    return pts


# ─── WS cell computation ───────────────────────────────────────────────────────

def ws_cell_vertices(prim):
    """
    Compute the Wigner-Seitz cell of a Bravais lattice.
    Returns (vertices, ConvexHull) normalised so the circumscribed sphere
    has radius POI_RADIUS.

    scipy.Voronoi returns `point_region` — the index into `regions` for each
    input point.  The origin is index 0, so region = regions[point_region[0]].
    If -1 appears in the region the cell is unbounded → increase SHELLS.
    """
    pts = generate_lattice(prim)
    vor = Voronoi(pts)

    region = vor.regions[vor.point_region[0]]
    if -1 in region:
        raise RuntimeError("Unbounded WS cell — increase SHELLS.")

    verts = vor.vertices[region]          # (M, 3) raw WS cell vertices

    hull  = ConvexHull(verts)
    R_max = np.max(np.linalg.norm(verts, axis=1))
    scale = POI_RADIUS / R_max           # normalise to circumscribed radius
    return verts * scale, hull


def coplanar_polygons(verts, hull):
    """
    Merge the triangulated ConvexHull simplices into proper planar polygon faces.

    ConvexHull.equations gives one plane equation (n·x + d = 0) per triangle.
    Two triangles with the same outward normal (dot ≥ 1 − EPS_COPLANAR) are
    co-planar and belong to the same WS face.  Within each group, sort vertices
    counter-clockwise projected onto the face plane so bmesh.faces.new() works.

    Returns list of (unit_normal, vertex_index_list).
    """
    scale = POI_RADIUS / np.max(np.linalg.norm(verts, axis=1))
    verts_s = verts  # already scaled

    normals  = hull.equations[:, :3]    # unit outward normals
    used     = np.zeros(len(hull.simplices), dtype=bool)
    polys    = []

    for i in range(len(hull.simplices)):
        if used[i]:
            continue
        n0   = normals[i]
        same = np.where(normals @ n0 >= 1.0 - EPS_COPLANAR)[0]
        used[same] = True

        all_vidx = set()
        for j in same:
            all_vidx.update(hull.simplices[j])
        all_vidx = list(all_vidx)

        # Project to face-local 2D and sort by angle around centroid
        fv    = verts_s[all_vidx]
        cent  = fv.mean(axis=0)
        arb   = np.array([1,0,0]) if abs(n0[0]) < 0.9 else np.array([0,1,0])
        u     = np.cross(n0, arb);  u /= np.linalg.norm(u)
        v     = np.cross(n0, u)
        delta = fv - cent
        ang   = np.arctan2(delta @ v, delta @ u)
        order = np.argsort(ang)
        polys.append((n0, [all_vidx[k] for k in order]))

    return polys


# ─── Miller-index classification ───────────────────────────────────────────────

def _family(dirs, n, tol):
    """True if n aligns with any direction in dirs (within cosine tolerance tol)."""
    return bool(np.max(np.abs(dirs @ n)) >= 1.0 - tol)

_DIRS_100 = np.vstack([np.eye(3), -np.eye(3)])
_DIRS_111 = np.array([[s0,s1,s2] for s0 in(1,-1) for s1 in(1,-1) for s2 in(1,-1)],
                      dtype=float) / math.sqrt(3)
_DIRS_110 = np.array(
    [[s0,s1, 0] for s0 in(1,-1) for s1 in(1,-1)] +
    [[s0, 0,s1] for s0 in(1,-1) for s1 in(1,-1)] +
    [[ 0,s0,s1] for s0 in(1,-1) for s1 in(1,-1)], dtype=float) / math.sqrt(2)

def face_colour(normal):
    """Map an outward face normal to its crystallographic colour."""
    n = np.asarray(normal, dtype=float)
    n /= np.linalg.norm(n)
    if _family(_DIRS_100, n, EPS_MILLER): return COL_100
    if _family(_DIRS_111, n, EPS_MILLER): return COL_111
    if _family(_DIRS_110, n, EPS_MILLER): return COL_110
    return COL_DEF


# ─── Blender mesh builder ──────────────────────────────────────────────────────

def build_ws_object(lattice_name, prim, location):
    """Create a WS-cell mesh object with vertex colours and holoflow:facet flag."""
    verts_np, hull = ws_cell_vertices(prim)
    polys           = coplanar_polygons(verts_np, hull)

    mesh = bpy.data.meshes.new(f"HF_WS_{lattice_name}")
    obj  = bpy.data.objects.new(f"HF_WS_{lattice_name}", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj["holoflow:facet"] = True          # studio export flag: flat-shaded facets

    bm  = bmesh.new()
    bvs = [bm.verts.new(verts_np[i].tolist()) for i in range(len(verts_np))]
    bm.verts.ensure_lookup_table()

    cl = bm.loops.layers.color.new("CrystalFace")

    for normal, vidxs in polys:
        try:
            face = bm.faces.new([bvs[i] for i in vidxs])
        except ValueError:
            continue
        col = face_colour(normal)
        for loop in face.loops:
            loop[cl] = col

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()

    # Flat-shading: shade_flat keeps hard crystallographic edges visible
    for poly in mesh.polygons:
        poly.use_smooth = False

    # Emission material driven by vertex colour attribute
    mat = bpy.data.materials.new(f"WS_{lattice_name}_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "CrystalFace"
    emit.inputs["Strength"].default_value = 1.5
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location  = (300, 0)
    emit.location = (100, 0)
    attr.location = (-100, 0)
    mesh.materials.append(mat)

    n_faces = len(mesh.polygons)
    n_verts = len(mesh.vertices)
    print(f"[blueprint] {lattice_name}: {n_verts} verts, {n_faces} faces — OK")
    return obj


# ─── Scene build & export ──────────────────────────────────────────────────────

def run():
    # Clear default scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    lattices = [
        ("SC",  _PRIM["SC"],  (-SPACING, 0.0, 0.0)),
        ("BCC", _PRIM["BCC"], (     0.0, 0.0, 0.0)),
        ("FCC", _PRIM["FCC"], ( SPACING, 0.0, 0.0)),
    ]

    for name, prim, loc in lattices:
        build_ws_object(name, prim, Vector(loc))

    # World: dark background so vertex-colour emission reads cleanly
    bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = (
        0.02, 0.02, 0.02, 1.0)

    # Export
    bpy.ops.export_scene.gltf(
        filepath        = OUTPUT_GLB,
        export_format   = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_draco_position_quantization   = 14,
        export_draco_normal_quantization     = 10,
        export_draco_texcoord_quantization   = 12,
        export_colors   = True,
        export_morph    = False,
        export_apply    = True,
        export_yup      = True,
    )
    print(f"[blueprint] Done → {OUTPUT_GLB}  (holoflow:facet=True on all objects)")


run()
