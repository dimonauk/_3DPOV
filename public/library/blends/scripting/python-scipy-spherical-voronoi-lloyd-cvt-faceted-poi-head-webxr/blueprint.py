"""
Centroidal Voronoi Tessellation — Lloyd's Algorithm on S²
scipy.spatial.SphericalVoronoi + Lloyd Relaxation → Faceted Poi Head GLB for WebXR
Blender 5.1  •  CC0

TECHNIQUE
---------
A Voronoi diagram on the sphere partitions S² into N convex spherical-polygon
cells, one per generator point.  When generator == centroid of its own cell the
diagram is *centroidal* (CVT).  Lloyd's algorithm achieves this iteratively:

    1. Build SphericalVoronoi from current generators.
    2. For each region compute the spherical centroid (normalise sum of vertices).
    3. Move generator → centroid.  Repeat until delta < CONVERGENCE_THRESH.

A CVT on S² distributes N points with near-uniform spacing — equivalent to
finding the best packing of N roughly-equal spherical caps.  At N=92 the
hexagonal lattice covers the sphere with very few irregular pentagons, giving a
faceted appearance identical to a truncated-icosahedron soccer-ball but free of
any icosahedral symmetry constraint.

MESH STRATEGY
-------------
For each Voronoi region:
  • Sorted boundary vertices (scipy returns them already sorted) form a convex
    polygon on the sphere surface.
  • We scale the polygon by FACE_INSET toward its centroid to create a border
    gap (grout line) — this is the key faceted-gem aesthetic.
  • The inset polygon becomes a flat bmesh face (vertices at radius=1.0).
  • bmesh.ops.extrude_face_region followed by bmesh.ops.scale pulls the face
    inward to EXTRUDE_DEPTH — carving a shallow recess per cell, similar to
    gemstone facets.
  • Flat-shaded (poly.use_smooth = False) for cel-shaded, low-poly look.

WHY SphericalVoronoi?
---------------------
scipy.spatial.SphericalVoronoi uses a modified Fortune's sweep adapted for the
unit sphere, producing the dual of the spherical Delaunay triangulation.  The
vertices of each region are the circumcentres of adjacent Delaunay triangles,
already sorted around the region boundary.  This removes the need to implement a
half-edge data structure ourselves.

PARAMETERS  (tune at the top — each has a physical/mathematical rationale)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

try:
    from scipy.spatial import SphericalVoronoi
    from scipy.spatial.transform import Rotation  # noqa: F401 (confirms scipy present)
except ImportError:
    raise RuntimeError(
        "scipy required — install via Blender's bundled pip:\n"
        "  import subprocess, sys\n"
        '  subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])'
    )

# ── Parameters ────────────────────────────────────────────────────────────────
N_GENERATORS   = 92      # cell count — 92 gives near-soccer-ball hex/pent mix
LLOYD_ITERS    = 40      # iterations; convergence usually < 20, 40 is generous
CONVERGENCE_T  = 1e-6    # stop early if max generator shift < this (radians)
SPHERE_RADIUS  = 1.0     # metres — poi head size; scale later if needed

FACE_INSET     = 0.10    # fraction to shrink each facet toward centroid (grout)
EXTRUDE_DEPTH  = 0.05    # metres — recess depth, negative = inward
FLAT_SHADE     = True    # hard edges for low-poly cel look

GLB_PATH       = "//hf_cvt_poi_head.glb"   # // = blend-file-relative
OBJECT_NAME    = "hf_cvt_poi_head"

# Material colour stops
COL_A = (0.04, 0.04, 0.20, 1.0)   # deep navy (emission dark)
COL_B = (0.40, 0.02, 0.60, 1.0)   # violet (mid)
COL_C = (0.00, 0.80, 1.00, 1.0)   # cyan (emission bright)
EMISSION_STRENGTH = 3.5


# ── Helpers ───────────────────────────────────────────────────────────────────

def fibonacci_sphere(n: int) -> np.ndarray:
    """Fibonacci lattice on S² — better initial spread than uniform random.

    Each point i gets azimuth i·2π/φ² and elevation arcsin(-1 + 2i/(n-1)).
    The golden ratio φ = (1+√5)/2 makes the azimuthal spacing maximally
    irrational (Weyl equidistribution), so no two rows align.
    """
    phi = (1.0 + np.sqrt(5.0)) * 0.5
    indices = np.arange(n, dtype=float)
    theta = 2.0 * np.pi * indices / phi**2          # azimuth (Fibonacci)
    z     = -1.0 + 2.0 * indices / (n - 1)          # elevation via linear map
    z     = np.clip(z, -1.0, 1.0)
    r     = np.sqrt(1.0 - z**2)
    pts   = np.column_stack([r * np.cos(theta), r * np.sin(theta), z])
    return pts / np.linalg.norm(pts, axis=1, keepdims=True)


def sphere_centroid(pts: np.ndarray) -> np.ndarray:
    """Centroid of a spherical polygon defined by vertices on S².

    For a planar polygon the centroid is the average vertex.  On a sphere we
    need the weighted average of the triangles formed by the polygon centroid
    and each edge, where weight = signed spherical area (cross-product
    magnitude gives sin of the angle subtended).  For small facets the naive
    normalised mean is a close approximation and cheaper to compute.

    We use the mean + normalise approach; error < 0.1% for cells covering
    < 5% of S² (true at N > 20).
    """
    c = pts.mean(axis=0)
    n = np.linalg.norm(c)
    if n < 1e-10:
        # degenerate cell — return any member
        return pts[0]
    return c / n


def lloyd_step(generators: np.ndarray) -> tuple[np.ndarray, float]:
    """One Lloyd relaxation step on S².

    Returns (new_generators, max_angular_shift_radians).
    """
    sv = SphericalVoronoi(generators, radius=SPHERE_RADIUS, center=np.zeros(3))
    sv.sort_vertices_of_regions()

    new_gen = generators.copy()
    for i, region in enumerate(sv.regions):
        verts = sv.vertices[region]
        c = sphere_centroid(verts)
        new_gen[i] = c * SPHERE_RADIUS

    # Angular shift: angle between old and new directions
    old_u = generators / np.linalg.norm(generators, axis=1, keepdims=True)
    new_u = new_gen   / np.linalg.norm(new_gen,    axis=1, keepdims=True)
    cos_a = np.clip((old_u * new_u).sum(axis=1), -1.0, 1.0)
    max_shift = np.arccos(cos_a).max()
    return new_gen, max_shift


def run_lloyd(generators: np.ndarray) -> np.ndarray:
    """Iterate Lloyd's algorithm until convergence or LLOYD_ITERS."""
    print(f"[CVT] Starting Lloyd relaxation: {N_GENERATORS} cells, up to {LLOYD_ITERS} iterations")
    for i in range(LLOYD_ITERS):
        generators, delta = lloyd_step(generators)
        if (i + 1) % 5 == 0 or delta < CONVERGENCE_T:
            print(f"  iter {i+1:3d}  max_shift = {delta:.2e} rad")
        if delta < CONVERGENCE_T:
            print(f"  Converged at iteration {i+1}.")
            break
    return generators


# ── Mesh construction ──────────────────────────────────────────────────────────

def build_cvt_mesh(generators: np.ndarray) -> bpy.types.Mesh:
    """Build faceted Voronoi sphere mesh from converged CVT generators."""
    sv = SphericalVoronoi(generators, radius=SPHERE_RADIUS, center=np.zeros(3))
    sv.sort_vertices_of_regions()

    bm = bmesh.new()

    for region in sv.regions:
        if len(region) < 3:
            continue  # degenerate — skip

        cell_verts = sv.vertices[region]    # already sorted around boundary
        n_v = len(cell_verts)

        # Centroid of this Voronoi cell on S²
        centroid = sphere_centroid(cell_verts)

        # Inset: lerp each vertex toward centroid by FACE_INSET
        # This creates the grout-line gap between adjacent cells
        inset_verts = cell_verts * (1.0 - FACE_INSET) + centroid * FACE_INSET

        # Add bmesh vertices on the sphere surface
        bm_verts = [bm.verts.new(Vector(v.tolist())) for v in inset_verts]

        try:
            face = bm.faces.new(bm_verts)
        except ValueError:
            # duplicate vertices from tiny cells — skip
            continue

        # Flat shading per face
        face.smooth = not FLAT_SHADE

    bm.verts.index_update()
    bm.faces.index_update()
    bm.normal_update()

    # Extrude each face region inward (along -normal) by EXTRUDE_DEPTH
    # We do a face-region extrude then translate along the face normal
    result = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
    extruded_faces = [g for g in result["geom"] if isinstance(g, bmesh.types.BMFace)]
    extruded_verts = [g for g in result["geom"] if isinstance(g, bmesh.types.BMVert)]

    # Move extruded verts inward along -normal of each face
    for face in extruded_faces:
        n = face.normal.normalized()
        for v in face.verts:
            v.co -= n * EXTRUDE_DEPTH

    # Recalc normals consistently outward
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

    mesh = bpy.data.meshes.new(OBJECT_NAME)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


# ── Material ───────────────────────────────────────────────────────────────────

def make_emission_material() -> bpy.types.Material:
    """Emission material: navy → violet → cyan ramp driven by vertex position."""
    mat = bpy.data.materials.new("cvt_facet_emission")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    emit  = nt.nodes.new("ShaderNodeEmission")
    ramp  = nt.nodes.new("ShaderNodeValToRGB")
    info  = nt.nodes.new("ShaderNodeObjectInfo")
    map_r = nt.nodes.new("ShaderNodeMapRange")

    out.location   = (600, 0)
    emit.location  = (400, 0)
    ramp.location  = (200, 0)
    map_r.location = (0, -100)
    info.location  = (-200, -100)

    # Object Info → Random (per-object seed) drives the colour ramp offset
    # so each face cluster (if exported as separate objects) has unique hue.
    # When exported as a single mesh, Random = 0 → ramp picks its full gradient.
    nt.links.new(info.outputs["Random"], map_r.inputs["Value"])
    map_r.inputs["From Min"].default_value = 0.0
    map_r.inputs["From Max"].default_value = 1.0
    map_r.inputs["To Min"].default_value   = 0.0
    map_r.inputs["To Max"].default_value   = 1.0

    nt.links.new(map_r.outputs["Result"], ramp.inputs["Fac"])

    # Configure colour ramp: deep navy → violet → cyan
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = COL_A
    el = cr.elements.new(0.5);     el.color = COL_B
    cr.elements[-1].position = 1.0; cr.elements[-1].color = COL_C

    emit.inputs["Strength"].default_value = EMISSION_STRENGTH
    nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Scene setup & export ───────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes) + list(bpy.data.materials):
        blk.user_clear(); blk.use_fake_user = False
        try:
            bpy.data.meshes.remove(blk)
        except Exception:
            pass
        try:
            bpy.data.materials.remove(blk)
        except Exception:
            pass


def setup_scene() -> None:
    """Black world, Bloom EEVEE for emission pop."""
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
    eevee = bpy.context.scene.eevee
    eevee.use_bloom      = True
    eevee.bloom_threshold   = 0.4
    eevee.bloom_intensity   = 0.3
    eevee.bloom_radius      = 5.0


def export_glb(obj: bpy.types.Object) -> None:
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
    )
    print(f"[CVT] Exported → {bpy.path.abspath(GLB_PATH)}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    setup_scene()

    # 1. Initial generators: Fibonacci lattice gives better starting coverage
    #    than pure random, reducing Lloyd iterations needed for convergence.
    generators = fibonacci_sphere(N_GENERATORS)

    # 2. Run Lloyd's algorithm to convergence
    generators = run_lloyd(generators)

    # 3. Build Blender mesh from the CVT
    mesh = build_cvt_mesh(generators)
    obj  = bpy.data.objects.new(OBJECT_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # 4. Assign material
    mat = make_emission_material()
    mesh.materials.append(mat)

    # 5. Mark Holoflow facet flag (Studio convention)
    obj["holoflow:facet"] = True
    obj["holoflow:generator_count"] = N_GENERATORS
    obj["holoflow:lloyd_iters"] = LLOYD_ITERS

    # 6. Export GLB
    export_glb(obj)
    print("[CVT] Done.")


if __name__ == "__main__":
    main()
