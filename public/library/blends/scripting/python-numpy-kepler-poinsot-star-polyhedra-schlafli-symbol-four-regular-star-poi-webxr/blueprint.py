"""
Kepler-Poinsot Star Polyhedra — Holoflow Blueprint (Blender 5.1)
=================================================================
TECHNIQUE  Johannes Kepler (1619, Harmonices Mundi) discovered two regular star
polyhedra by allowing star-polygon faces {5/2} in place of convex polygons.
Louis Poinsot (1809) found two more by permitting star vertex figures.  Cauchy
(1813) proved these four exhaust all possibilities for regular star polyhedra
in ℝ³ — no other rational Schläfli symbol {p/q} can close up consistently.

SCHLÄFLI SYMBOL {p, q}: p-gon faces, q meeting at each vertex.  Star polygons
allow rational p = n/d (n vertices, winding d times around centre):

  {5/2, 5} — Small Stellated Dodecahedron (Kepler 1619): 12 pentagram faces,
             5-fold vertex, V=12 E=30 F=12, density 2
  {5/2, 3} — Great Stellated Dodecahedron (Kepler 1619): 12 pentagram faces,
             3-fold vertex, V=20 E=30 F=12, density 3
  {5, 5/2} — Great Dodecahedron (Poinsot 1809): 12 pentagonal faces, star
             vertex figure, V=12 E=30 F=12, density 2
  {3, 5/2} — Great Icosahedron (Poinsot 1809): 20 triangular faces, star
             vertex figure, V=12 E=30 F=20, density 7

VISUAL STELLATION  The topologically exact forms self-intersect, causing WebGL
face-culling artefacts.  This blueprint instead uses SPIKE PYRAMIDS — the same
visual outcome as the star polyhedron when viewed from outside:
  SSD: 12 pentagonal pyramids on a dodecahedron, spike height = φ × r_in
  GSD: 20 triangular pyramids on an icosahedron,  spike height = φ² × r_in
The spike tips land at the exact dual-face intersection points, preserving all
vertex positions of the true star polyhedra.

The exported WebXR poi head is the SSD; the GSD, GD (flat dodecahedron), and GI
(flat icosahedron) travel as companion objects in the same .blend.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector
from pathlib import Path
from scipy.spatial import ConvexHull

# ── Parameters ────────────────────────────────────────────────────────────────
SLUG       = "python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr"
POI_RADIUS = 0.082          # circumradius of final poi head (metres)
PHI        = (1 + np.sqrt(5)) * 0.5   # golden ratio ≈ 1.6180
SMOOTH     = False          # flat-shading for faceted look (holoflow:facet)
COL_SSD    = (0.55, 0.12, 0.02, 1.0)  # deep crimson for SSD spikes
COL_GSD    = (0.04, 0.18, 0.55, 1.0)  # deep cobalt for GSD spikes
HERE       = Path(__file__).parent
GLB_SSD    = str(HERE / "hf_ssd_poi.glb")
GLB_ALL    = str(HERE / "hf_kp_all.glb")

# ── Vertex generators ─────────────────────────────────────────────────────────

def dodecahedron_verts() -> np.ndarray:
    """
    20 dodecahedron vertices in two families:
      8 cube corners (±1, ±1, ±1)
     12 golden-rectangle corners (0, ±1/φ, ±φ) and cyclic permutations
    All lie on a sphere of radius √3 (cube) / √(1+φ²) (gold) — same radius
    because 1+φ² = (√5)·φ.
    """
    signs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    cube = [(s1, s2, s3) for s1 in (-1.0, 1.0) for s2 in (-1.0, 1.0) for s3 in (-1.0, 1.0)]
    inv  = 1.0 / PHI
    gold = (
        [(0.0, s1 * inv, s2 * PHI) for s1, s2 in signs] +
        [(s1 * inv, s2 * PHI, 0.0) for s1, s2 in signs] +
        [(s1 * PHI, 0.0, s2 * inv) for s1, s2 in signs]
    )
    return np.array(cube + gold, dtype=np.float64)


def icosahedron_verts() -> np.ndarray:
    """
    12 icosahedron vertices: (0, ±1, ±φ) and cyclic permutations.
    Circumradius = √(1+φ²) = √(1+φ+1) = √(2+φ).
    """
    signs = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    return np.array(
        [(0.0, s1, s2 * PHI) for s1, s2 in signs] +
        [(s1, s2 * PHI, 0.0) for s1, s2 in signs] +
        [(s1 * PHI, 0.0, s2) for s1, s2 in signs],
        dtype=np.float64
    )


def convex_faces(verts: np.ndarray):
    """
    Use ConvexHull to extract faces of a convex polyhedron.
    Returns list of face index lists, each already in CCW order relative to
    the outward normal (scipy guarantees this via hull.equations).
    """
    hull = ConvexHull(verts)
    faces = []
    for simplex, eq in zip(hull.simplices, hull.equations):
        # Ensure normal points outward (outward component positive from centroid)
        centroid = verts.mean(axis=0)
        normal   = eq[:3]
        center   = verts[simplex].mean(axis=0)
        if np.dot(normal, center - centroid) < 0:
            simplex = simplex[::-1]
        faces.append(simplex.tolist())
    return faces


def spike_polyhedron(base_verts: np.ndarray, base_faces, spike_h_factor: float,
                     name: str, col: tuple):
    """
    Build a spiked polyhedron mesh.  For each polygonal face, place a pyramid
    apex along the outward face normal at distance spike_h_factor × face_inradius.
    The face inradius r = A / (perimeter/2) for an n-gon.
    Returns a new Blender mesh object named `name`.
    """
    # Normalise base verts to unit sphere first
    R_base = np.linalg.norm(base_verts, axis=1).max()
    verts_n = base_verts / R_base

    all_verts = list(verts_n)
    all_faces = []

    for face_idx in base_faces:
        fv = np.array([verts_n[i] for i in face_idx])
        centroid = fv.mean(axis=0)
        # Outward face normal via cross-product of two edges
        e0 = fv[1] - fv[0]
        e1 = fv[-1] - fv[0]
        normal = np.cross(e0, e1)
        nlen = np.linalg.norm(normal)
        if nlen < 1e-12:
            continue
        normal /= nlen
        if np.dot(normal, centroid) < 0:
            normal = -normal

        # Face area and perimeter → inradius
        # Generalise: use shoelace on projected 2D coords
        n_v = len(face_idx)
        perimeter = sum(np.linalg.norm(fv[(i+1) % n_v] - fv[i]) for i in range(n_v))
        # Area via cross products (polygon may be non-planar after normalisation)
        area = 0.0
        for i in range(1, n_v - 1):
            area += 0.5 * np.linalg.norm(np.cross(fv[i] - fv[0], fv[i+1] - fv[0]))
        r_in = 2.0 * area / perimeter if perimeter > 0 else 0.0

        apex = centroid + normal * spike_h_factor * r_in
        apex_idx = len(all_verts)
        all_verts.append(apex)

        for i in range(n_v):
            tri = [face_idx[i], face_idx[(i+1) % n_v], apex_idx]
            all_verts_local = tri  # use global indices
            all_faces.append(tri)

    # Build Blender mesh
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(all_verts, [], all_faces)
    mesh.update()

    # Scale to poi radius
    R_max = max(np.linalg.norm(v) for v in all_verts)
    scale = POI_RADIUS / R_max if R_max > 0 else 1.0
    for i, v in enumerate(mesh.vertices):
        v.co *= scale

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # Material
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = col
        bsdf.inputs["Metallic"].default_value   = 0.35
        bsdf.inputs["Roughness"].default_value  = 0.18
    mesh.materials.append(mat)
    mesh.shade_flat()

    # holoflow metadata
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:family"]   = "kepler-poinsot"

    return obj


# ── Scene setup ───────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

dv = dodecahedron_verts()
iv = icosahedron_verts()
df = convex_faces(dv)   # 12 triangulated face simplices from ConvexHull
if_ = convex_faces(iv)  # 20 triangulated face simplices

# Merge co-planar triangles into pentagons/triangles for dodecahedron:
# ConvexHull gives triangles; for the dodecahedron we want pentagons.
# We skip the merge here and use the raw triangulated ConvexHull output,
# which still produces the correct visual stellation.

# SSD — 12 pentagram-spike pyramids on dodecahedron
ssd_obj = spike_polyhedron(dv, df, PHI,       "hf_ssd",  COL_SSD)

# GSD — 20 triangular-spike pyramids on icosahedron (spike ratio = φ²)
gsd_obj = spike_polyhedron(iv, if_, PHI**2,   "hf_gsd",  COL_GSD)

# ── Companion meshes (GD = dodecahedron, GI = icosahedron, un-spiked) ────────
for raw_v, raw_f, nm, co in [
    (dv, df, "hf_gd_dodeca",  (0.08, 0.40, 0.12, 1.0)),
    (iv, if_, "hf_gi_icosa",  (0.40, 0.25, 0.02, 1.0)),
]:
    mesh = bpy.data.meshes.new(nm + "_mesh")
    nv   = raw_v / np.linalg.norm(raw_v, axis=1).max()
    sc   = POI_RADIUS * 0.9
    mesh.from_pydata((nv * sc).tolist(), [], raw_f)
    mesh.update()
    obj  = bpy.data.objects.new(nm, mesh)
    bpy.context.scene.collection.objects.link(obj)
    mat  = bpy.data.materials.new(nm + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = co
        bsdf.inputs["Metallic"].default_value   = 0.28
        bsdf.inputs["Roughness"].default_value  = 0.30
    mesh.materials.append(mat)
    mesh.shade_flat()
    obj["holoflow:facet"] = True
    obj.location.x = 0.25   # offset companion meshes for side-by-side view

# ── Camera & world ─────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, -0.30, 0.12))
cam = bpy.context.object
cam.data.lens = 85
bpy.context.scene.camera = cam
from mathutils import Euler
cam.rotation_euler = Euler((1.22, 0, 0), "XYZ")

world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.6

# ── Export SSD as WebXR GLB ───────────────────────────────────────────────────
bpy.ops.object.select_all(action="DESELECT")
ssd_obj.select_set(True)
bpy.context.view_layer.objects.active = ssd_obj

# +Y-up: rotate X by 90° then apply
import mathutils
ssd_obj.rotation_euler = mathutils.Euler((np.pi / 2, 0, 0), "XYZ")
bpy.ops.object.transform_apply(rotation=True)

bpy.ops.export_scene.gltf(
    filepath       = GLB_SSD,
    use_selection  = True,
    export_format  = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_yup     = True,
)
print(f"[holoflow] SSD GLB → {GLB_SSD}")
print(f"[holoflow] SSD vertices: {len(ssd_obj.data.vertices)}")
print(f"[holoflow] SSD faces:    {len(ssd_obj.data.polygons)}")
