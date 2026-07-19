"""
blueprint.py — bmesh.ops.subdivide_edges: Support Loops, Fractal Stone & INNER_VERT Panel
══════════════════════════════════════════════════════════════════════════════════════════════
Outputs: hf_sub_plinth.blend · hf_sub_plinth.glb

TECHNIQUE: SUBDIVIDE_EDGES
───────────────────────────
bmesh.ops.subdivide_edges inserts new vertices along selected edges without a
modifier stack or UI context.  Unlike bpy.ops.mesh.subdivide it is headless,
accepts a precise per-edge selection, and returns structured result geometry.
Three production patterns are shown:

  Object 1 — hf_sub_cap   : STRAIGHT_CUT + cuts=2 on vertical edges only
                             → headless loop-cut pair for SubD support loops
  Object 2 — hf_sub_shaft : fractal + seed on ALL edges
                             → rough-stone surface noise without a modifier
  Object 3 — hf_sub_base  : INNER_VERT + cuts=1 on top-face perimeter
                             → recessed panel inset via centre-vert fan

RETURN DICT KEYS
────────────────
  geom_inner — new verts/edges created INSIDE face patches (interior geometry)
  geom_split — new sub-edge segments that replace each original selected edge
  geom       — union of both (every element the op created)

KEY PARAMETERS
──────────────
  edges                  — list[BMEdge]  targeted selection, not always bm.edges[:]
  cuts         (int)     — new vertices PER edge; cuts=2 → two interior verts
  smooth       (float)   — Catmull-Clark-style smoothing of interior verts [0,1]
  fractal      (float)   — random displacement amplitude (Blender units × edge len)
  fractal_along_normal   — displacement fraction along face normal direction
  seed         (int)     — deterministic seed; 0 = fixed internal default
  quad_corner_type       — 'STRAIGHT_CUT' | 'INNER_VERT' | 'PATH' | 'FAN'
  use_grid_fill (bool)   — fill subdivided face interior as a regular quad grid
  use_sphere   (bool)    — project new verts toward the selection's bounding sphere
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
CAP_W          = 1.10   # cap plate width and depth (Blender units)
CAP_H          = 0.18   # cap plate height
CAP_CUTS       = 2      # support loop count per vertical edge

SHAFT_W        = 0.78   # stone shaft cross-section
SHAFT_H        = 1.05   # stone shaft height
FRACTAL_AMT    = 0.055  # fractal displacement amplitude (world units × edge length)
FRACTAL_NORMAL = 0.030  # additional normal-direction displacement
FRACTAL_CUTS   = 3      # cuts per edge — more cuts → denser noise
FRACTAL_SEED   = 7      # deterministic seed for reproducible stone texture

BASE_W         = 1.42   # base plinth width and depth
BASE_H         = 0.28   # base plinth height

OUTPUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..")
)
BLEND_NAME = "hf_sub_plinth.blend"
GLB_NAME   = "hf_sub_plinth.glb"


# ── UTILITIES ─────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for b in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[b])


def new_obj(name: str, mesh: bpy.types.Mesh) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def make_mat(name: str, rgba: tuple) -> bpy.types.Material:
    m = bpy.data.materials.new(name)
    m.use_nodes = False
    m.diffuse_color = rgba
    return m


def box_bm(w: float, d: float, h: float) -> bmesh.types.BMesh:
    """Build a six-face quad box in a new BMesh, outward normals."""
    bm = bmesh.new()
    hw, hd, hh = w / 2, d / 2, h / 2
    v = [bm.verts.new(Vector(c)) for c in [
        (-hw, -hd, -hh), ( hw, -hd, -hh), ( hw,  hd, -hh), (-hw,  hd, -hh),
        (-hw, -hd,  hh), ( hw, -hd,  hh), ( hw,  hd,  hh), (-hw,  hd,  hh),
    ]]
    # Face winding chosen so recalc_face_normals yields outward normals.
    for idx in [(0,1,2,3), (7,6,5,4), (0,4,5,1), (1,5,6,2), (2,6,7,3), (3,7,4,0)]:
        bm.faces.new([v[i] for i in idx])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def tag_all_sharp(bm: bmesh.types.BMesh):
    """Flat-shade every face and mark every edge hard — fully faceted look."""
    sl = bm.edges.layers.bool.get("sharp_edge") or bm.edges.layers.bool.new("sharp_edge")
    for e in bm.edges:
        e[sl] = True
    for f in bm.faces:
        f.smooth = False


# ── OBJECT 1: SUPPORT LOOPS VIA STRAIGHT_CUT ──────────────────────────────────
def build_cap() -> bpy.types.Object:
    """
    Targeted edge selection + STRAIGHT_CUT + cuts=2 on the 4 vertical edges.

    WHY: bpy.ops.mesh.subdivide requires active Edit Mode context and processes
    ALL selected edges.  bmesh.ops.subdivide_edges runs headlessly and accepts
    an arbitrary edge list — giving per-edge targeting with zero UI overhead.

    geom_inner after this call contains the two new horizontal ring edges that
    link the newly inserted midpoint verts around the box perimeter.  These are
    the support loops a SubD workflow needs to hold the silhouette of a flat lid.
    """
    bm = box_bm(CAP_W, CAP_W, CAP_H)
    bm.edges.ensure_lookup_table()

    # Select only edges that run along the Z axis (vertical corner edges).
    z_up = Vector((0, 0, 1))
    vert_edges = [
        e for e in bm.edges
        if abs((e.verts[1].co - e.verts[0].co).normalized().dot(z_up)) > 0.98
    ]  # exactly 4 vertical edges on a box

    res = bmesh.ops.subdivide_edges(
        bm,
        edges=vert_edges,
        cuts=CAP_CUTS,
        quad_corner_type="STRAIGHT_CUT",
        use_grid_fill=True,
        smooth=0.0,
        fractal=0.0,
    )

    # geom_inner holds the new horizontal ring edges — tag them as panel lines.
    sl = bm.edges.layers.bool.new("sharp_edge")
    for elem in res["geom_inner"]:
        if isinstance(elem, bmesh.types.BMEdge):
            elem[sl] = True
    # Tag pre-existing horizontal top/bottom loops sharp (full hard-surface cap).
    for e in bm.edges:
        if abs((e.verts[1].co - e.verts[0].co).normalized().dot(z_up)) < 0.1:
            e[sl] = True
    for f in bm.faces:
        f.smooth = False

    mesh = bpy.data.meshes.new("hf_sub_cap")
    bm.to_mesh(mesh)
    bm.free()

    obj = new_obj("hf_sub_cap", mesh)
    obj["holoflow:facet"] = True
    mesh.materials.append(make_mat("cap_mat", (0.88, 0.84, 0.80, 1.0)))
    return obj


# ── OBJECT 2: FRACTAL STONE NOISE ─────────────────────────────────────────────
def build_shaft() -> bpy.types.Object:
    """
    fractal= on ALL edges: random displacement proportional to edge length.

    fractal displaces each new vert laterally (perpendicular to edge direction).
    fractal_along_normal adds height-field displacement along face normal.
    seed= makes the result fully deterministic — same seed → same stone texture
    every time the script runs, which is critical for reproducible GLB exports.

    CAUTION: fractal amplitude is multiplied by the EDGE LENGTH.  Longer edges
    produce bigger displacement; subdivide first (cuts=FRACTAL_CUTS) so each
    sub-edge is short enough that the noise stays sub-centimetre scale.
    """
    bm = box_bm(SHAFT_W, SHAFT_W, SHAFT_H)
    bm.edges.ensure_lookup_table()

    bmesh.ops.subdivide_edges(
        bm,
        edges=bm.edges[:],
        cuts=FRACTAL_CUTS,
        quad_corner_type="STRAIGHT_CUT",
        use_grid_fill=True,
        smooth=0.0,
        fractal=FRACTAL_AMT,
        fractal_along_normal=FRACTAL_NORMAL,
        seed=FRACTAL_SEED,
    )

    # Smooth-shade the stone: flat-shade would make it look cut-gem, not weathered.
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        f.smooth = True

    mesh = bpy.data.meshes.new("hf_sub_shaft")
    bm.to_mesh(mesh)
    bm.free()

    obj = new_obj("hf_sub_shaft", mesh)
    obj["holoflow:facet"] = False
    mesh.materials.append(make_mat("shaft_mat", (0.62, 0.58, 0.53, 1.0)))
    return obj


# ── OBJECT 3: INNER_VERT RECESSED PANEL ───────────────────────────────────────
def build_base() -> bpy.types.Object:
    """
    INNER_VERT on the top face perimeter edges only.

    INNER_VERT places a new centre vertex inside each quad patch created by the
    subdivision, connecting to all four corners of the patch.  For a single quad
    (the top face) cut once on all 4 edges this produces a 4-triangle star fan —
    visually equivalent to bmesh.ops.poke but with fractional offset control.

    By selecting ONLY the top face edges, all side and bottom faces remain
    unchanged — demonstrating the per-face targeting capability.
    """
    bm = box_bm(BASE_W, BASE_W, BASE_H)
    bm.faces.ensure_lookup_table()

    top_face = max(bm.faces, key=lambda f: f.calc_center_bounds().z)

    res = bmesh.ops.subdivide_edges(
        bm,
        edges=list(top_face.edges),
        cuts=1,
        quad_corner_type="INNER_VERT",
        use_grid_fill=True,
        smooth=0.0,
        fractal=0.0,
    )

    # Tag the new inner fan edges sharp — crisp star inset on the top face.
    sl = bm.edges.layers.bool.new("sharp_edge")
    for elem in res["geom_inner"]:
        if isinstance(elem, bmesh.types.BMEdge):
            elem[sl] = True
    # Side and bottom faces: flat-shade for hard-surface plinth silhouette.
    for f in bm.faces:
        f.smooth = False
    for e in bm.edges:
        if not isinstance(e.get(sl, None), bool):
            e[sl] = True  # tag all non-new edges sharp too

    mesh = bpy.data.meshes.new("hf_sub_base")
    bm.to_mesh(mesh)
    bm.free()

    obj = new_obj("hf_sub_base", mesh)
    obj["holoflow:facet"] = True
    mesh.materials.append(make_mat("base_mat", (0.74, 0.70, 0.64, 1.0)))
    return obj


# ── EXPORT ────────────────────────────────────────────────────────────────────
def export():
    bpy.ops.object.select_all(action="SELECT")
    blend_path = os.path.join(OUTPUT_DIR, BLEND_NAME)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[subdivide_edges] Saved blend: {blend_path}")
    glb_path = os.path.join(OUTPUT_DIR, GLB_NAME)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_extras=True,
    )
    print(f"[subdivide_edges] Exported GLB: {glb_path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
clear_scene()

cap   = build_cap()
shaft = build_shaft()
base  = build_base()

# Side-by-side for comparison; adjust Z so each object sits at its centroid.
cap.location   = Vector((-1.80, 0.0, 0.0))
shaft.location = Vector(( 0.00, 0.0, 0.0))
base.location  = Vector(( 1.80, 0.0, 0.0))

bpy.context.view_layer.update()
export()
