"""
blueprint.py — bmesh.ops.grid_fill: Structured Quad Fill for a Hard-Surface Display Panel
══════════════════════════════════════════════════════════════════════════════════════════
Outputs:
  hf_grid_fill_display.blend  — saved Blender 5.1 file
  hf_grid_fill_display.glb    — Draco L6 / WebP GLB for WebXR

TECHNIQUE: GRID_FILL
────────────────────
bmesh.ops.grid_fill closes a rectangular hole in a mesh with a clean N×M quad
patch.  It is the context-free kernel behind Blender's "Grid Fill" mesh tool
(F key in Edge select mode with a structured loop selected).

Unlike bmesh.ops.holes_fill (which triangulates arbitrary n-gons) grid_fill
produces ALL quads and respects the rail count, making it ideal for:
  — display screens inside bezels
  — window panes inside architectural frames
  — LCD panel faces inside device bodies
  — any hole where downstream UV unwrapping or animation needs clean flow

PREREQUISITE: the boundary edge loop must form a RECTANGLE in topological terms.
That means it must be splittable into two pairs of opposing rails where each
pair shares the same edge count:
  len(top_rail) == len(bottom_rail)   ← horizontal count
  len(left_rail) == len(right_rail)   ← vertical count
If this invariant is violated, grid_fill returns an empty face list with NO
Python exception — always assert len(result['faces']) > 0 to catch silent fails.

CONSTRUCTION STRATEGY
─────────────────────
  1. bmesh.ops.create_grid  → PANEL_COLS × PANEL_ROWS uniform quad surface
  2. Identify inner "screen" faces by centroid coordinate bounds
  3. Record which edges are on the perimeter of that face cluster BEFORE deletion
     (edges shared by exactly one screen face = the future hole boundary)
  4. bmesh.ops.delete(context='FACES') removes screen faces and interior danglers
  5. bmesh.ops.grid_fill(edges=hole_edges) fills the hole with the screen quad patch
  6. bmesh.ops.extrude_face_region + translate gives the panel body depth
"""

import os
from collections import Counter

import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
PANEL_COLS  = 8     # quad columns across the full panel (X)
PANEL_ROWS  = 6     # quad rows across the full panel (Y)
PANEL_SIZE  = 1.0   # half-extent for create_grid (panel spans −1 → +1 in unit space)

# Stretch to a 16:10 display aspect: 3.2 m wide × 2.0 m tall × 0.10 m deep
SCALE_X     = 1.60  # final half-width
SCALE_Y     = 1.00  # final half-height
PANEL_DEPTH = 0.10  # extrusion depth of the body (−Z direction)

BEZEL_CELLS = 1     # bezel thickness in grid cells (1 cell ring all round)

SCREEN_COLS = PANEL_COLS - 2 * BEZEL_CELLS  # = 6  (horizontal screen quads)
SCREEN_ROWS = PANEL_ROWS - 2 * BEZEL_CELLS  # = 4  (vertical screen quads)

MAT_BEZEL  = 0
MAT_SCREEN = 1

_here      = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(_here, "hf_grid_fill_display.blend")
GLB_PATH   = os.path.join(_here, "hf_grid_fill_display.glb")

# ── SCENE RESET ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col   = bpy.data.collections.new("HF_GridFill")
scene.collection.children.link(col)

# ── MATERIALS ──────────────────────────────────────────────────────────────────
mat_bezel = bpy.data.materials.new("HF_Bezel")
mat_bezel.use_nodes = True
pb = mat_bezel.node_tree.nodes["Principled BSDF"]
pb.inputs["Base Color"].default_value = (0.18, 0.20, 0.22, 1.0)
pb.inputs["Metallic"].default_value   = 0.60
pb.inputs["Roughness"].default_value  = 0.35

mat_screen = bpy.data.materials.new("HF_Screen")
mat_screen.use_nodes = True
nt = mat_screen.node_tree
for nd in list(nt.nodes):
    nt.nodes.remove(nd)
out_node  = nt.nodes.new("ShaderNodeOutputMaterial")
emit_node = nt.nodes.new("ShaderNodeEmission")
emit_node.inputs["Color"].default_value    = (0.02, 0.40, 0.72, 1.0)  # teal display glow
emit_node.inputs["Strength"].default_value = 1.4
nt.links.new(emit_node.outputs["Emission"], out_node.inputs["Surface"])

# ── BUILD PANEL SURFACE IN BMESH ───────────────────────────────────────────────
bm = bmesh.new()

# create_grid: x_segments/y_segments = edge-loop counts = quad face counts per axis
# size = half-extent; verts span [−size, +size] on both axes
bmesh.ops.create_grid(bm, x_segments=PANEL_COLS, y_segments=PANEL_ROWS,
                      size=PANEL_SIZE, calc_uvs=False)

# Scale to target aspect ratio (applied directly to vertex positions)
for v in bm.verts:
    v.co.x *= SCALE_X
    v.co.y *= SCALE_Y

# ── IDENTIFY SCREEN FACES BY CENTROID ──────────────────────────────────────────
# Cell dimensions in scaled space:
cx = 2.0 * SCALE_X / PANEL_COLS   # width of one bezel cell
cy = 2.0 * SCALE_Y / PANEL_ROWS   # height of one bezel cell

# Screen bounds: shrink from the outer edges by BEZEL_CELLS cell widths/heights
sx_min = -SCALE_X + BEZEL_CELLS * cx + 1e-6
sx_max =  SCALE_X - BEZEL_CELLS * cx - 1e-6
sy_min = -SCALE_Y + BEZEL_CELLS * cy + 1e-6
sy_max =  SCALE_Y - BEZEL_CELLS * cy - 1e-6

screen_faces = [
    f for f in bm.faces
    if sx_min < f.calc_center_median().x < sx_max
    and sy_min < f.calc_center_median().y < sy_max
]

assert len(screen_faces) == SCREEN_COLS * SCREEN_ROWS, (
    f"Expected {SCREEN_COLS * SCREEN_ROWS} screen faces, found {len(screen_faces)}"
)

# Assign bezel material to ALL current faces; screen patch will override MAT_SCREEN
for f in bm.faces:
    f.material_index = MAT_BEZEL

# ── RECORD HOLE BOUNDARY EDGES BEFORE DELETING SCREEN FACES ───────────────────
# An edge appears in exactly ONE screen face if it sits on the screen perimeter
# (shared with a bezel face).  An interior edge appears in TWO screen faces.
# Collect these boundary edges NOW before deletion removes the screen faces.
edge_in_screen: Counter = Counter()
for f in screen_faces:
    for e in f.edges:
        edge_in_screen[e] += 1

hole_edges = [e for e, cnt in edge_in_screen.items() if cnt == 1]

# Topological sanity: a SCREEN_COLS × SCREEN_ROWS rectangle has this many boundary edges
expected_boundary = 2 * SCREEN_COLS + 2 * SCREEN_ROWS
assert len(hole_edges) == expected_boundary, (
    f"Boundary edge count {len(hole_edges)} ≠ expected {expected_boundary}\n"
    "grid_fill will fail silently if rails are uneven — check BEZEL_CELLS / PANEL_COLS / PANEL_ROWS"
)

# ── DELETE SCREEN FACES → OPEN THE HOLE ───────────────────────────────────────
# context='FACES' removes faces AND any edges/vertices that lose all their faces
# (interior screen edges/verts disappear; hole boundary edges stay because their
# bezel neighbour face still holds a reference to them)
bmesh.ops.delete(bm, geom=screen_faces, context='FACES')

# Guard: every hole edge must still have exactly one link_face (the bezel side)
for e in hole_edges:
    assert e.is_valid, "A hole boundary edge was unexpectedly removed"
    assert len(e.link_faces) == 1, (
        f"Hole edge has {len(e.link_faces)} faces after delete; expected 1"
    )

# ── GRID_FILL: CLOSE HOLE WITH A STRUCTURED QUAD PATCH ────────────────────────
# use_interp_simple=False  → cubic Bezier interpolation between opposing rails.
#   On a flat panel the result is identical to linear, but it makes grid_fill
#   follow natural surface curvature if the boundary lies on a curved mesh.
# use_interp_simple=True   → strict linear, useful when you need perfectly
#   straight interior rows on a curved boundary (rare hard-surface case).
result = bmesh.ops.grid_fill(
    bm,
    edges=hole_edges,
    mat_nr=MAT_SCREEN,
    use_smooth=False,
    use_interp_simple=False,
)
screen_patch = result['faces']
assert len(screen_patch) == SCREEN_COLS * SCREEN_ROWS, (
    f"grid_fill returned {len(screen_patch)} faces; expected {SCREEN_COLS * SCREEN_ROWS}\n"
    "Likely cause: rails are uneven (opposing sides have different edge counts)"
)

# ── FLAT-SHADE ALL FACES ───────────────────────────────────────────────────────
for f in bm.faces:
    f.smooth = False

# ── EXTRUDE PANEL BODY ─────────────────────────────────────────────────────────
# Extrude every face backward (−Z) to give the panel chassis thickness.
# extrude_face_region duplicates the face geometry and builds connecting side walls.
# Translate only the NEWLY created verts in ret['geom'] — the original front face stays at Z=0.
ret = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces[:]))
new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0.0, 0.0, -PANEL_DEPTH)))

# Recalculate normals after extrusion (side walls may have inverted winding)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces[:]))

# ── APPLY BMESH → MESH OBJECT ──────────────────────────────────────────────────
me = bpy.data.meshes.new("HF_GridFillDisplay")
bm.to_mesh(me)
bm.free()

me.materials.append(mat_bezel)
me.materials.append(mat_screen)
me.update()

obj = bpy.data.objects.new("HF_GridFillDisplay", me)
col.objects.link(obj)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj["holoflow:facet"] = True  # studio per-object export flag

# ── SAVE .BLEND ────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

# ── EXPORT GLB ─────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format='GLB',
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)

print("✓ hf_grid_fill_display.blend saved")
print(f"✓ hf_grid_fill_display.glb exported  (Draco L6, WebP, +Y up)")
print(f"  Bezel faces   : {PANEL_COLS * PANEL_ROWS - SCREEN_COLS * SCREEN_ROWS}")
print(f"  Screen patch  : {len(screen_patch)}  ({SCREEN_COLS} cols × {SCREEN_ROWS} rows)")
print(f"  Boundary edges: {len(hole_edges)}")
