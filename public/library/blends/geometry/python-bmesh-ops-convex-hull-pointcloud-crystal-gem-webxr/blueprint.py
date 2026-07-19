"""
blueprint.py — bmesh.ops.convex_hull: Crystal Gem & Collision Proxy
══════════════════════════════════════════════════════════════════════
Outputs:
  hf_convex_gem.blend   — saved Blender 5.1 file
  hf_convex_gem.glb     — Draco L6 / WebP GLB for WebXR

TECHNIQUE: CONVEX_HULL
──────────────────────
bmesh.ops.convex_hull computes the smallest convex polyhedron whose surface
covers all input vertices.  The algorithm is incremental gift-wrapping,
O(n log n) in practice, operating entirely in LOCAL space.

Return dict keys:
  geom           — BMVert + BMEdge + BMFace that form the HULL SURFACE.
                   These are the elements you want to keep.
  geom_interior  — elements INSIDE the hull: original source verts/edges/faces
                   that are no longer on the surface boundary.
  geom_unused    — input elements not used in the hull (co-located duplicates,
                   disconnected bits outside the vertex cloud).

THE geom_interior DELETION RULE
─────────────────────────────────
The single most-missed step.  If input geometry contains faces (e.g. a remesh
blob), those interior faces survive the call invisibly — causing:
  • Duplicate normals in the GLB NORMAL accessor → lighting artefacts.
  • Non-manifold edges → downstream Boolean ops fail silently.
  • Inflated vertex count → GLB larger than necessary.
Always follow every convex_hull call with:
    bmesh.ops.delete(bm, geom=result["geom_interior"], context="VERTS")

For vert-only input (point cloud) geom_interior is empty faces-wise,
but the interior verts themselves ARE reported there — delete them too.

DEGENERACY GUARD
────────────────
If ALL input verts are coplanar the hull produces a flat disk (front + back
degenerate face pair) rather than raising an exception.  The fibonacci sphere
sampling used here guarantees 3D spread for n ≥ 4 — but keep it in mind
when adapting this technique to unknown point sets.

CRYSTAL GEM — FIBONACCI SPHERE JITTER
───────────────────────────────────────
The golden-angle spiral (φ ≈ 137.508°) distributes N points as evenly as
possible on a sphere surface without the polar bunching of a grid.  Squishing
the sphere on Z (GEM_SQUISH_Z < 1.0 → oblate, > 1.0 → prolate) shapes the
gem habit.  A small per-point radial jitter breaks crystallographic symmetry —
without it the hull often degenerates into near-regular planar rings with very
long skinny triangles along their borders.

COLLISION PROXY — ORGANIC ICO SOURCE
──────────────────────────────────────
Build an ico sphere, subdivide, then push each vert outward along its normal
by a sinusoidal function of position — cheap procedural organic deformation
without any modifiers.  Calling convex_hull on those verts produces the
tightest convex wrapper.  Export as a second mesh object tagged with custom
property "hf:collision_proxy" = True so the Three.js side can route it to
a Cannon.js or Rapier convex hull collider constructor rather than rendering it.
"""

import math
import os
import random

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SEED           = 42           # deterministic jitter seed
GEM_N          = 56           # fibonacci sphere point count; ~30–60 hull faces
GEM_RADIUS     = 0.50         # base sphere radius (Blender units)
GEM_SQUISH_Z   = 0.68         # Z squish: <1 oblate (disc gem), >1 prolate (spike)
GEM_JITTER     = 0.05         # radial jitter fraction — natural facet variation
PROXY_SUBDIVS  = 2            # ico sphere subdivisions for organic hi-poly
PROXY_NOISE    = 0.22         # per-vert normal displacement amplitude
PROXY_FREQ     = 3.5          # noise spatial frequency (cycles per unit)
OUTPUT_DIR     = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "..", "..", "..", "..")
BLEND_NAME     = "hf_convex_gem.blend"
GLB_NAME       = "hf_convex_gem.glb"


# ── UTILITIES ─────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block])


def new_object(name: str, mesh: bpy.types.Mesh) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def make_material(name: str, color: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = False
    mat.diffuse_color = (*color[:3], 1.0)
    return mat


def fibonacci_sphere(n: int, radius: float, squish_z: float,
                     jitter: float, rng: random.Random) -> list:
    """Return N points on a squished sphere via golden-angle spiral."""
    golden_angle = math.pi * (3.0 - math.sqrt(5.0))   # 2.399963…
    pts = []
    for i in range(n):
        y   = 1.0 - (i / (n - 1)) * 2.0               # y ∈ [1, -1]
        r   = math.sqrt(max(0.0, 1.0 - y * y))        # ring radius at latitude y
        phi = i * golden_angle
        x   = r * math.cos(phi)
        z   = r * math.sin(phi)
        # jitter: displace radially so nearby hull triangles differ in area
        jit = 1.0 + jitter * (rng.random() * 2.0 - 1.0)
        pts.append(Vector((
            x * radius * jit,
            y * radius * jit,
            z * radius * squish_z * jit,
        )))
    return pts


# ── OBJECT 1: CRYSTAL GEM ─────────────────────────────────────────────────────
def build_crystal_gem(rng: random.Random) -> bpy.types.Object:
    """
    Point cloud on a jittered fibonacci sphere → convex hull → crystal gem.
    hull faces are flat-shaded + sharp-edged for the faceted WebXR look.
    """
    mesh = bpy.data.meshes.new("hf_crystal_gem")
    bm   = bmesh.new()

    pts = fibonacci_sphere(GEM_N, GEM_RADIUS, GEM_SQUISH_Z, GEM_JITTER, rng)

    # Populate BMesh with vert-only geometry (no edges or faces yet).
    for p in pts:
        bm.verts.new(p)

    bm.verts.ensure_lookup_table()

    # ── CONVEX HULL ────────────────────────────────────────────────────────
    # input= accepts any iterable of BMVert — passing all verts is typical.
    # use_existing_faces=False: don't attempt to reuse any edges/faces from
    # the source (irrelevant for a vert-only BMesh, but explicit is safer).
    result = bmesh.ops.convex_hull(
        bm,
        input=bm.verts[:],
        use_existing_faces=False,
    )

    # Delete interior elements — for a vert-only cloud these are the verts
    # that ended up inside the hull volume (did not become hull vertices).
    bmesh.ops.delete(bm, geom=result["geom_interior"], context="VERTS")

    # ── FLAT SHADE + SHARP EDGES ───────────────────────────────────────────
    # All hull faces are already planar (convex_hull guarantees triangles).
    # Flat-shade them so the faceted silhouette reads clearly in WebXR.
    bm.faces.ensure_lookup_table()
    sharp_layer = bm.edges.layers.bool.new("sharp_edge")   # 5.1 attribute API
    for f in bm.faces:
        f.smooth = False
    for e in bm.edges:
        e[sharp_layer] = True   # every hull edge is a hard crease

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    bm.to_mesh(mesh)
    bm.free()

    obj = new_object("hf_crystal_gem", mesh)
    obj["holoflow:facet"] = True

    mat = make_material("hf_gem_surface", (0.42, 0.72, 0.95))
    mesh.materials.append(mat)
    return obj


# ── OBJECT 2: ORGANIC HI-POLY (source) ────────────────────────────────────────
def build_organic_source() -> bpy.types.Object:
    """
    Subdivided ico sphere with per-vertex normal displacement — the "sculpt"
    stand-in that needs a convex collision proxy.  Rendered geometry only;
    no holoflow:facet flag because we want smooth shading here.
    """
    mesh = bpy.data.meshes.new("hf_organic_hipoly")
    bm   = bmesh.new()

    bmesh.ops.create_icosphere(bm,
        subdivisions=PROXY_SUBDIVS,
        radius=0.46)

    # Push each vert outward along its normal by a sinusoidal function of
    # position — cheap, modifier-free organic blobbing.
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        freq  = PROXY_FREQ
        disp  = math.sin(v.co.x * freq) * math.cos(v.co.y * freq) * \
                math.sin(v.co.z * freq + 0.7)
        v.co += v.normal * disp * PROXY_NOISE

    for f in bm.faces:
        f.smooth = True           # smooth-shaded organic blob

    bm.to_mesh(mesh)
    bm.free()

    obj = new_object("hf_organic_hipoly", mesh)
    return obj


# ── OBJECT 3: COLLISION PROXY ─────────────────────────────────────────────────
def build_collision_proxy(source_obj: bpy.types.Object) -> bpy.types.Object:
    """
    Convex hull wrapping the organic hi-poly.  All vertices of the source mesh
    are fed into convex_hull; the result is the smallest convex volume that
    fully contains the source.

    This proxy is tagged "hf:collision_proxy" = True so the Three.js loader
    can route it to a physics engine (Cannon.js / Rapier) rather than rendering.
    """
    mesh = bpy.data.meshes.new("hf_collision_proxy")
    bm   = bmesh.new()

    # Mirror source vertices into this BMesh — LOCAL coordinates, so both
    # objects must share the same local origin (they do: both at world origin).
    src_mesh = source_obj.data
    for v in src_mesh.vertices:
        bm.verts.new(Vector(v.co))   # copy position only
    bm.verts.ensure_lookup_table()

    result = bmesh.ops.convex_hull(bm, input=bm.verts[:], use_existing_faces=False)
    bmesh.ops.delete(bm, geom=result["geom_interior"], context="VERTS")

    # Flat-shade proxy — it won't render, but flat normals are consistent
    # with how physics engines visualise collision shapes in debug mode.
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
        f.smooth = False
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    bm.to_mesh(mesh)
    bm.free()

    obj = new_object("hf_collision_proxy", mesh)
    obj["holoflow:facet"]      = True
    obj["hf:collision_proxy"]  = True     # routing flag for Three.js loader

    mat = make_material("hf_proxy_wire", (0.90, 0.62, 0.12))
    mesh.materials.append(mat)
    return obj


# ── EXPORT ────────────────────────────────────────────────────────────────────
def export():
    bpy.ops.object.select_all(action="SELECT")

    blend_path = os.path.join(OUTPUT_DIR, BLEND_NAME)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[convex_hull] Saved blend: {blend_path}")

    glb_path = os.path.join(OUTPUT_DIR, GLB_NAME)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_extras=True,          # preserves hf:collision_proxy custom prop
    )
    print(f"[convex_hull] Exported GLB: {glb_path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
clear_scene()
rng = random.Random(SEED)

gem     = build_crystal_gem(rng)
organic = build_organic_source()
proxy   = build_collision_proxy(organic)

# Spread objects horizontally for a clear side-by-side comparison
gem.location     = Vector((-1.1, 0.0, 0.0))
organic.location = Vector(( 0.0, 0.0, 0.0))
proxy.location   = Vector(( 1.1, 0.0, 0.0))

bpy.context.view_layer.update()
export()
