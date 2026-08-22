"""
blueprint.py — bmesh.ops.bisect_plane: Cross-Section, Cutaway & Symmetry Seal
══════════════════════════════════════════════════════════════════════════════
Outputs:
  hf_bisect_halfshell.blend   — saved Blender 5.1 file
  hf_bisect_halfshell.glb     — Draco L6 / WebP GLB for WebXR

TECHNIQUE: BISECT_PLANE
────────────────────────
bmesh.ops.bisect_plane cuts geometry with a mathematical plane defined by a
point (plane_co) and a unit normal (plane_no).  Crossing edges are subdivided
at their intersection with the plane; new vertices are inserted exactly on the
plane.  Faces on one or both sides can then be removed via the clear_outer /
clear_inner flags.  The return dict key 'geom_cut' delivers only the new verts
and edges AT the cut boundary — the edge ring you need for downstream fill,
bridge, or extrude operations.

Unlike the Boolean modifier:
  — No N-gon explosion at the cut boundary: bisect produces a clean edge ring
    with 2-manifold topology (every new edge borders exactly two faces).
  — Operates on a raw BMesh — zero depsgraph overhead.
  — 'geom_cut' is ready immediately for bmesh.ops.fill, bridge_loops, or a
    manual grid_fill cap — no topology cleanup step required.

geom= INVARIANT
───────────────
geom= must include ALL THREE element types — verts, edges, AND faces.  Passing
only faces leaves the boundary edges uncut; passing only edges misses the
interior cuts on large polygons.  Always use:
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]

clear_outer / clear_inner SEMANTICS
──────────────────────────────────────
A face is 'outer' when (face_centroid − plane_co) · plane_no > 0.
A face is 'inner' when the dot product is < 0.
  clear_outer=True, clear_inner=False  → half-space removal (cross-section view)
  clear_outer=False, clear_inner=True  → inverted removal
  clear_outer=False, clear_inner=False → cut only; both halves survive (symmetry
                                         snap: use dist to merge near-plane verts)
  clear_outer=True,  clear_inner=True  → removes all geometry (usually wrong)

dist PARAMETER (snap tolerance)
────────────────────────────────
Any vertex within dist of the plane is considered 'on' the plane and snapped
to it rather than being assigned to one side.  This makes bisect_plane double as
a symmetry-snap tool: set dist to the maximum stray distance of your mirror-axis
verts and all of them are welded to the plane boundary in one call.

CONSTRUCTION — TWO OBJECTS
───────────────────────────
HALFSHELL — UV sphere bisected at Z=0.  clear_outer=True removes the top
  hemisphere.  geom_cut returns the equatorial ring, filled with
  bmesh.ops.fill to produce a flat triangulated disc cap.
  Two material slots: 0 = shell, 1 = cap.

CUTAWAY   — Subdivided cube bisected by a 45° plane passing through the
  upper-front edge.  clear_outer=True opens the angled face.
  Cut-ring edges are tagged so a distinct material can be assigned
  to the revealed cross-section faces in a follow-up material pass.
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SPHERE_U        = 32          # longitude segments — 32 gives 11.25° facets
SPHERE_V        = 16          # latitude rings
SPHERE_R        = 0.55        # radius in Blender units
CUBE_SIZE       = 0.9         # half-size of the cutaway casing cube
CUTAWAY_DEG     = 45.0        # bisect plane tilt (degrees from +Z toward +Y)
BISECT_DIST     = 0.0001      # snap tolerance — only near-degenerate verts snap
OUTPUT_DIR      = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "..", "..", "..", "..")
BLEND_NAME      = "hf_bisect_halfshell.blend"
GLB_NAME        = "hf_bisect_halfshell.glb"


# ── UTILITIES ──────────────────────────────────────────────────────────────────
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
    mat.diffuse_color = (*color, 1.0)
    return mat


# ── OBJECT 1: HALFSHELL ────────────────────────────────────────────────────────
def build_halfshell() -> bpy.types.Object:
    """
    UV sphere bisected at Z=0 (clear_outer removes the top hemisphere).
    geom_cut returns the equatorial ring; bmesh.ops.fill seals it as a disc.
    """
    mesh = bpy.data.meshes.new("hf_halfshell")
    bm   = bmesh.new()

    # bmesh.ops.create_uvsphere produces a geodesic UV sphere natively.
    # u_segments = longitude (rings around Z axis); v_segments = latitude.
    bmesh.ops.create_uvsphere(bm,
        u_segments=SPHERE_U,
        v_segments=SPHERE_V,
        radius=SPHERE_R)

    # ── BISECT at Z=0 (plane_no points +Z → 'outer' is the top hemisphere) ──
    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=BISECT_DIST,
        plane_co=Vector((0.0, 0.0, 0.0)),
        plane_no=Vector((0.0, 0.0, 1.0)),   # +Z normal → positive side = top
        use_snap_center=False,               # deprecated in 5.x; always False
        clear_outer=True,                    # remove top hemisphere
        clear_inner=False,                   # keep bottom hemisphere
    )

    # geom_cut contains only the new verts + edges created AT the cut line.
    # Filter to BMEdge only — these form the equatorial edge ring.
    cut_edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]

    # ── SEAL the equatorial ring with a triangulated disc ──────────────────
    # bmesh.ops.fill triangulates an arbitrary closed edge ring.  For a circle
    # the result is a radial fan — N triangles meeting at a centre vertex.
    # This differs from grid_fill, which needs a rectangular (N×M) topology.
    fill_res = bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True)

    # ── FLAT-SHADE all faces ───────────────────────────────────────────────
    for f in bm.faces:
        f.smooth = False

    # ── MATERIAL INDEX: cap faces get slot 1 ──────────────────────────────
    # fill_res['faces'] contains the new disc triangles.
    for f in fill_res.get("faces", []):
        f.material_index = 1

    # ── NORMALS: recalculate after mixed-winding construction ──────────────
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    bm.to_mesh(mesh)
    bm.free()

    obj = new_object("hf_halfshell", mesh)
    obj["holoflow:facet"] = True             # holoflow_webxr_exporter flag

    mat_shell = make_material("hf_shell", (0.12, 0.22, 0.55))
    mat_cap   = make_material("hf_cap",   (0.88, 0.90, 0.95))
    mesh.materials.append(mat_shell)
    mesh.materials.append(mat_cap)
    return obj


# ── OBJECT 2: CUTAWAY ─────────────────────────────────────────────────────────
def build_cutaway() -> bpy.types.Object:
    """
    Subdivided cube bisected by a 45° tilted plane through its upper-front edge.
    clear_outer=True removes the upper-front wedge, revealing the interior.
    """
    mesh = bpy.data.meshes.new("hf_cutaway")
    bm   = bmesh.new()

    bmesh.ops.create_cube(bm, size=CUBE_SIZE * 2)

    # Subdivide edges twice to give bisect sufficient edge-crossing geometry.
    # Without subdivision the large quad faces would produce only a single
    # cut edge per face — a 4-edge ring — instead of a smooth diagonal section.
    bmesh.ops.subdivide_edges(bm,
        edges=bm.edges[:],
        cuts=2,
        use_grid_fill=True,
        use_single_divide=False)

    # ── BISECT at a 45° plane ─────────────────────────────────────────────
    # plane_co sits at the midpoint of the upper-front edge.
    # plane_no = normalised (0, sin45°, cos45°) tilts the cut 45° from +Z toward +Y.
    angle = math.radians(CUTAWAY_DEG)
    bisect_normal = Vector((0.0, math.sin(angle), math.cos(angle))).normalized()

    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        dist=BISECT_DIST,
        plane_co=Vector((0.0, 0.0, 0.0)),   # cuts through origin
        plane_no=bisect_normal,
        use_snap_center=False,
        clear_outer=True,   # removes the upper-front wedge
        clear_inner=False,  # keeps the lower-rear body
    )

    # Tag cut-ring edges so a second material can be assigned below.
    cut_edges = [e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]

    for f in bm.faces:
        f.smooth = False

    # Faces adjacent to the cut ring become the exposed cross-section face.
    # Assign material slot 1 to faces that share a cut edge.
    cut_edge_set = set(cut_edges)
    for e in cut_edges:
        for f in e.link_faces:
            f.material_index = 1

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    bm.to_mesh(mesh)
    bm.free()

    obj = new_object("hf_cutaway", mesh)
    obj["holoflow:facet"] = True

    mat_body    = make_material("hf_body",    (0.08, 0.08, 0.10))
    mat_section = make_material("hf_section", (0.80, 0.35, 0.10))
    mesh.materials.append(mat_body)
    mesh.materials.append(mat_section)
    return obj


# ── EXPORT ────────────────────────────────────────────────────────────────────
def export():
    bpy.ops.object.select_all(action="SELECT")

    blend_path = os.path.join(OUTPUT_DIR, BLEND_NAME)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[bisect] Saved blend: {blend_path}")

    glb_path = os.path.join(OUTPUT_DIR, GLB_NAME)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,                # bake flat normals into NORMAL accessor
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_extras=True,               # preserves holoflow:facet custom props
    )
    print(f"[bisect] Exported GLB: {glb_path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
clear_scene()

halfshell = build_halfshell()
cutaway   = build_cutaway()

halfshell.location = Vector((-0.75, 0.0, 0.0))
cutaway.location   = Vector(( 0.75, 0.0, 0.0))

bpy.context.view_layer.update()
export()
