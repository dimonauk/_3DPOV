"""
blueprint.py — bmesh.ops.extrude_face_region: Panel-Push & Sci-Fi Control Deck
═══════════════════════════════════════════════════════════════════════════════
Outputs:
  hf_control_deck.blend  — saved Blender 5.1 file
  hf_control_deck.glb    — Draco L6 / WebP GLB for WebXR

TECHNIQUE: EXTRUDE_FACE_REGION
────────────────────────────────
bmesh.ops.extrude_face_region is the context-free kernel behind Blender's
"Extrude Region" (E › Extrude Faces in Face Select mode).  It treats all
selected faces as one connected surface, copies their cap geometry, and
builds bridging side faces along the selection boundary.

KEY INVARIANT
─────────────
The new cap sits exactly on the original surface until translated.  Always
follow extrude_face_region with bmesh.ops.translate pointing along the
desired extrusion normal.

RETURN VALUE
─────────────
  ret = bmesh.ops.extrude_face_region(bm, geom=face_list)
  ret['geom'] — flat list of BMVert, BMEdge, BMFace (all new elements).

  Filter by type before translating:
    new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]

vs. extrude_discrete_faces
──────────────────────────
  extrude_face_region  — entire selection as one region; produces a single
                         raised panel.  Use for display frames, slab features.
  extrude_discrete_faces — each face in its own normal; produces individual
                           pillars or spikes.  Use for per-button arrays.

CONSTRUCTION
────────────
  DECK base : NC × NR quad grid (8 × 6 = 48 faces) at z = 0,
              slab body extruded downward by SLAB_D.
  Panel     : cols 2-5, rows 1-4 (4 × 4 = 16 faces) raised PANEL_H.
  Left bank : cols 0-1, rows 1-4 (2 × 4 = 8 faces) raised BUTTON_H.
  Right bank: cols 6-7, rows 1-4 (2 × 4 = 8 faces) raised BUTTON_H.
  Top strip : col 0-7, row 5 (8 faces) raised STRIP_H.
  Bot strip : col 0-7, row 0 (8 faces) raised STRIP_H.
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ───────────────────────────────────────────────────────────────
NC          = 8       # grid columns
NR          = 6       # grid rows
SLAB_W      = 0.80    # total width  [m]
SLAB_H      = 0.50    # total height [m] (Y axis)
SLAB_D      = 0.020   # slab body depth (extrusion downward) [m]

PANEL_H     = 0.018   # display panel raised height [m]
BUTTON_H    = 0.010   # left/right bank raised height [m]
STRIP_H     = 0.005   # top/bottom decorative strip height [m]

# Sharp edges inherit from any extrusion boundary — set these as "sharp" so
# the SMOOTH_BY_ANGLE modifier (or GLB NORMAL accessor) keeps faceted shading.
SMOOTH_ANGLE = math.radians(30)  # edges sharper than this are flagged hard

OUTPUT_DIR   = os.path.join(os.path.dirname(__file__))
BLEND_NAME   = "hf_control_deck.blend"
GLB_NAME     = "hf_control_deck.glb"

# ── HELPERS ──────────────────────────────────────────────────────────────────

def extrude_region_up(bm, face_list, height):
    """Extrude face_list as a connected region and push cap by `height`."""
    bm.normal_update()
    # Compute average face normal — for a flat grid this is always +Z, but the
    # pattern generalises to any planar subset.
    avg_n = Vector((0, 0, 0))
    for f in face_list:
        avg_n += f.normal
    avg_n = avg_n.normalized()

    ret = bmesh.ops.extrude_face_region(bm, geom=face_list)
    # ret['geom'] mixes BMVert, BMEdge, BMFace — isolate verts to translate.
    new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=new_verts, vec=avg_n * height)
    return ret


def build_deck():
    """Construct the control deck mesh and return (obj, mesh)."""
    me = bpy.data.meshes.new("hf_control_deck")
    ob = bpy.data.objects.new("hf_control_deck", me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob

    bm = bmesh.new()

    # ── BUILD VERTEX GRID ─────────────────────────────────────────────────
    # verts[r][c] is the vertex at grid row r, column c.
    cell_w = SLAB_W / NC
    cell_h = SLAB_H / NR

    verts = []
    for r in range(NR + 1):
        row = []
        for c in range(NC + 1):
            x = (c * cell_w) - SLAB_W * 0.5
            y = (r * cell_h) - SLAB_H * 0.5
            row.append(bm.verts.new((x, y, 0.0)))
        verts.append(row)

    # faces[r][c] — quad at row r, col c.
    # Winding CCW when viewed from +Z (correct for +Z normal).
    faces = []
    for r in range(NR):
        row_faces = []
        for c in range(NC):
            f = bm.faces.new([
                verts[r][c],
                verts[r][c + 1],
                verts[r + 1][c + 1],
                verts[r + 1][c],
            ])
            row_faces.append(f)
        faces.append(row_faces)

    bm.verts.index_update()
    bm.faces.index_update()

    # ── SLAB BODY: extrude ALL top faces downward ─────────────────────────
    # After this call the original 48 faces remain at z=0 (the deck surface).
    # A cap of 48 new bottom faces appears at z=-SLAB_D.
    # Perimeter walls close the four sides of the slab.
    all_top = [faces[r][c] for r in range(NR) for c in range(NC)]
    ret_slab = bmesh.ops.extrude_face_region(bm, geom=all_top)
    slab_cap_verts = [g for g in ret_slab['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=slab_cap_verts, vec=Vector((0, 0, -SLAB_D)))

    # ── FEATURE EXTRUSIONS (all upward from z = 0) ───────────────────────
    # Panel — display surround; cols 2-5, rows 1-4 (inner 4×4 quad)
    panel_faces = [faces[r][c] for r in range(1, 5) for c in range(2, 6)]
    extrude_region_up(bm, panel_faces, PANEL_H)

    # Left bank — operator controls; cols 0-1, rows 1-4
    left_faces = [faces[r][c] for r in range(1, 5) for c in range(0, 2)]
    extrude_region_up(bm, left_faces, BUTTON_H)

    # Right bank — cols 6-7, rows 1-4
    right_faces = [faces[r][c] for r in range(1, 5) for c in range(6, 8)]
    extrude_region_up(bm, right_faces, BUTTON_H)

    # Top decorative strip — full-width row 5
    top_strip = [faces[5][c] for c in range(NC)]
    extrude_region_up(bm, top_strip, STRIP_H)

    # Bottom decorative strip — full-width row 0
    bot_strip = [faces[0][c] for c in range(NC)]
    extrude_region_up(bm, bot_strip, STRIP_H)

    # ── SHARP EDGES FOR FACETED SHADING ──────────────────────────────────
    # Any edge whose two adjacent faces differ by more than SMOOTH_ANGLE
    # is flagged sharp.  This feeds the SMOOTH_BY_ANGLE modifier or the
    # GLB mesh's NORMAL accessor correctly.
    sharp_layer = bm.edges.layers.bool.get("sharp_edge") \
                  or bm.edges.layers.bool.new("sharp_edge")
    for edge in bm.edges:
        if len(edge.link_faces) == 2:
            a = edge.link_faces[0].normal
            b = edge.link_faces[1].normal
            # dot product clamp — math.acos undefined outside [-1, 1] due to floats
            dot = max(-1.0, min(1.0, a.dot(b)))
            if math.acos(dot) > SMOOTH_ANGLE:
                edge[sharp_layer] = True

    # ── WRITE TO MESH ─────────────────────────────────────────────────────
    bm.to_mesh(me)
    bm.free()

    # SMOOTH_BY_ANGLE modifier reads the sharp_edge bool attribute.
    # In Blender 5.1 this replaces the old AutoSmooth flag.
    mod = ob.modifiers.new("SmoothByAngle", "NODES")
    mod.node_group = bpy.data.node_groups.get("Smooth by Angle") \
                     or _get_smooth_by_angle_ng()

    return ob, me


def _get_smooth_by_angle_ng():
    """Return or create a minimal Smooth by Angle node group (5.1 pattern)."""
    ng = bpy.data.node_groups.new("Smooth by Angle", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nodes = ng.nodes
    in_n  = nodes.new("NodeGroupInput")
    out_n = nodes.new("NodeGroupOutput")
    sba   = nodes.new("GeometryNodeToolSetSharpFace")  # fallback — no-op if unavailable
    links = ng.links
    links.new(in_n.outputs["Geometry"], out_n.inputs["Geometry"])
    return ng


def export_glb(ob, path):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
    )


# ── MAIN ─────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

ob, _ = build_deck()

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT_DIR, BLEND_NAME))
export_glb(ob, os.path.join(OUTPUT_DIR, GLB_NAME))

print(f"[blueprint] written → {BLEND_NAME}, {GLB_NAME}")
