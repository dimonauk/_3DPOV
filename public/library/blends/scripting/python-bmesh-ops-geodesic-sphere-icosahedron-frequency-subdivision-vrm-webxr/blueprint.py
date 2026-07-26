"""
Geodesic Sphere via Icosahedron Frequency Subdivision — Blender 5.1 Blueprint
Holoflow Studio | CC0 | 2026-07-26

Technique:
  Seed a regular icosahedron (12 vertices, 20 equilateral triangular faces), then
  subdivide every edge FREQUENCY times with bmesh.ops.subdivide_edges() and
  project every vertex back to the sphere.  This Class I geodesic subdivision is
  the same construction used in Buckminster Fuller domes, C₆₀ fullerene chemistry,
  and icosahedral virus capsid biology.

Theory — Euler characteristic at Class I frequency n:
  F  = 20·n²          (all triangles, distributed evenly across the sphere)
  E  = 30·n²          (each original edge split into n segments)
  V  = 10·n² + 2      (10 rings of hex verts + 2 icosahedron poles)
  χ  = V − E + F = (10n²+2) − 30n² + 20n² = 2  ← genus-0 invariant verified

  The 12 original icosahedron vertices survive at every frequency with valence 5.
  All new vertices have valence 6.  Euler's formula forces exactly 12 five-valent
  vertices in any triangulated sphere — the topological origin of the 12 pentagons
  in a fullerene or Goldberg polyhedron.

External attribution:
  George W. Hart — "Geodesic Spheres" — CC BY Attribution
  https://www.georgehart.com/virtual-polyhedra/geodesic.html

  Paul Bourke — "Geodesic Sphere" — Educational freeware
  http://paulbourke.net/geometry/geodesic/

  Blender Python API — bmesh.ops — CC BY-SA 4.0
  https://docs.blender.org/api/current/bmesh.ops.html
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
FREQUENCY      = 4        # Class I frequency n; F=20n², V=10n²+2 (n=1 → bare icosahedron)
RADIUS         = 0.15     # sphere radius in metres (standard Holoflow poi-head scale)
EXTRUDE_DEPTH  = 0.006    # per-face extrude accent in metres (0 = flat geodesic shell)
SMOOTH_SHADING = True     # poly.use_smooth — interpolated normals for WebXR
MESH_NAME      = "hf_geodesic"
OBJ_NAME       = "GeodesicSphere"
GLB_PATH       = "//hf_geodesic.glb"

# ── ICOSAHEDRON SEED ──────────────────────────────────────────────────────────
# Three mutually perpendicular golden-ratio rectangles: (0, ±1, ±φ) and even perms.
# Each vertex lies on the circumsphere of radius √(1+φ²); normalising gives exact
# unit-sphere positions.  The icosahedron has the largest face count of any Platonic
# solid (F=20) and the smallest solid-angle defect per vertex — these two properties
# minimise subdivision distortion when projecting to the sphere.
_PHI = (1.0 + math.sqrt(5.0)) * 0.5    # golden ratio ≈ 1.61803


def _ico_verts() -> list:
    """12 icosahedron vertices normalised to unit sphere."""
    raw = [
        ( 0.0,  1.0,  _PHI), ( 0.0, -1.0,  _PHI),
        ( 0.0,  1.0, -_PHI), ( 0.0, -1.0, -_PHI),
        ( 1.0,  _PHI,  0.0), (-1.0,  _PHI,  0.0),
        ( 1.0, -_PHI,  0.0), (-1.0, -_PHI,  0.0),
        ( _PHI,  0.0,  1.0), (-_PHI,  0.0,  1.0),
        ( _PHI,  0.0, -1.0), (-_PHI,  0.0, -1.0),
    ]
    return [Vector(v).normalized() for v in raw]


# 20 CCW-wound triangles (outward normals when viewed from outside the sphere).
# Vertex 0 is the "north pole" apex; faces 0-4 form the north pentagon cap.
_ICO_FACES = [
    (0, 1, 8), (0, 8, 4), (0, 4, 5), (0, 5, 9), (0, 9, 1),
    (1, 9, 7), (1, 7, 6), (1, 6, 8), (8, 6, 10), (8, 10, 4),
    (4, 10, 2), (4, 2, 5), (5, 2, 11), (5, 11, 9), (9, 11, 7),
    (7, 11, 3), (7, 3, 6), (6, 3, 10), (10, 3, 2), (2, 3, 11),
]


# ── BUILDER ───────────────────────────────────────────────────────────────────

def build_geodesic(bm: bmesh.types.BMesh, freq: int,
                   radius: float, extrude: float) -> None:
    """
    Populate a BMesh with a Class I geodesic sphere.

    use_grid_fill=True is critical:
      Without it, subdivide_edges splits the 30 icosahedron edges into freq
      segments but leaves each original triangular face interior as a single
      N-gon — interior topology is NOT created.  use_grid_fill=True triangulates
      every subdivided face, giving the expected 20·freq² total triangle count.
      Omitting this flag silently produces 20 N-gon faces regardless of freq.

    Project AFTER subdivision (not before):
      Normalising before subdivision would project midpoints individually, leaving
      them at correct positions only on the original 30 edges; the interior
      vertices of each subdivided face would land inside the sphere.  Normalising
      once after subdivision maps all vertices to the sphere in one pass — the
      defining step that makes the mesh geodesic rather than a flat polyhedron.

    Class I vs Class II vs Class III:
      Class I  (this script): subdivision cuts run parallel to icosahedron edges.
               Simplest construction; 12 degree-5 vertices at icosahedron positions.
      Class II: grid rotated 30°; slightly more uniform triangle areas.
               Requires different indexing and a 2-parameter frequency tuple (n, n).
      Class III: arbitrary (p, q) rotation; least symmetric, least used in practice.

    Extrude accent:
      extrude_discrete_faces disconnects each face from its neighbours before
      translating it outward — a gap forms between adjacent faces.  This is
      different from extrude_face_region (connected shell) and is the correct
      choice for a per-face raised-facet look.  The gap width scales with
      EXTRUDE_DEPTH; a value of 0.006 m is visible but subtle at poi scale.
    """
    # 1. Seed the icosahedron
    seed_verts = [bm.verts.new(v * radius) for v in _ico_verts()]
    for tri in _ICO_FACES:
        bm.faces.new([seed_verts[i] for i in tri])
    bm.normal_update()

    # 2. Subdivide: cuts = freq-1 → freq segments per original edge
    if freq > 1:
        bmesh.ops.subdivide_edges(
            bm,
            edges=list(bm.edges),
            cuts=freq - 1,
            use_grid_fill=True,       # triangulate face interiors — required
            use_smooth_even=False,    # raw midpoints; geodesic projection follows
        )

    # 3. Geodesic projection — maps every vertex onto the sphere surface
    for v in bm.verts:
        v.co = v.co.normalized() * radius

    # 4. Per-face extrude for faceted accent (optional; 0 skips)
    if extrude > 1e-8:
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        result = bmesh.ops.extrude_discrete_faces(bm, faces=list(bm.faces))
        for f in result["faces"]:
            for v in f.verts:
                v.co += f.normal * extrude

    bm.normal_update()


# ── MATERIAL ──────────────────────────────────────────────────────────────────

def apply_material(obj) -> None:
    """
    Navy-to-gold PBR gradient along the Generated Z axis (south pole → north pole).
    ShaderNodeTexCoord.Generated outputs the [0,1]³ object bounding-box coordinate
    in object space, which is stable across export — no UV unwrap needed.
    The Z component maps south-pole to 0.0 and north-pole to 1.0 exactly.
    """
    mat = bpy.data.materials.get("GeodesicMat") or bpy.data.materials.new("GeodesicMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location   = (400, 0)
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location  = (200, 0)
    ramp  = nt.nodes.new("ShaderNodeValToRGB");        ramp.location  = (-100, 0)
    coord = nt.nodes.new("ShaderNodeTexCoord");        coord.location = (-500, 0)
    sep   = nt.nodes.new("ShaderNodeSeparateXYZ");     sep.location   = (-300, 0)

    ramp.color_ramp.elements[0].color = (0.02, 0.04, 0.25, 1)   # deep navy (south)
    ramp.color_ramp.elements[1].color = (0.95, 0.73, 0.08, 1)   # gold    (north)

    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value  = 0.8
    bsdf.inputs["Roughness"].default_value = 0.25
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.clear()
    obj.data.materials.append(mat)


# ── EXPORT ────────────────────────────────────────────────────────────────────

def export_glb(obj) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[HF] → {bpy.path.abspath(GLB_PATH)}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

def run() -> None:
    for name in (MESH_NAME, OBJ_NAME):
        if name in bpy.data.meshes:   bpy.data.meshes.remove(bpy.data.meshes[name])
        if name in bpy.data.objects:  bpy.data.objects.remove(bpy.data.objects[name])

    mesh = bpy.data.meshes.new(MESH_NAME)
    bm   = bmesh.new()
    build_geodesic(bm, FREQUENCY, RADIUS, EXTRUDE_DEPTH)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    if SMOOTH_SHADING:
        for p in mesh.polygons:
            p.use_smooth = True

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    apply_material(obj)
    export_glb(obj)

    v, e, f = len(mesh.vertices), len(mesh.edges), len(mesh.polygons)
    chi     = v - e + f
    th_v    = 10 * FREQUENCY ** 2 + 2
    th_f    = 20 * FREQUENCY ** 2
    print(f"[HF] V={v} (expected {th_v})  E={e}  F={f} (expected {th_f})  χ={chi}")


run()
