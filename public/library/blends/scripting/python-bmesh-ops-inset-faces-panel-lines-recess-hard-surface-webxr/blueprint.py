"""
blueprint.py — bmesh.ops.inset_faces: Panel-Line Grooves & Recessed Faces
══════════════════════════════════════════════════════════════════════════
Produces one hard-surface console-panel prop in a single headless session:
  hf_inset_panel.blend  — saved Blender file
  hf_inset_panel.glb   — Draco-compressed WebXR GLB

bmesh.ops.inset_faces is the context-free kernel behind Blender's Inset
Faces operator (I key).  Unlike the operator it requires no 3D Viewport
or active selection — faces are passed as explicit Python lists, so it
runs safely inside headless scripts and Geometry Nodes post-processing.

THREE DEMONSTRATION ZONES on one panel:
  Zone A — Panel-line border: collective inset (use_individual=False)
            → one groove ring around a group of faces
  Zone B — Button cluster:    individual inset (use_individual=True)
            + depth push to create per-button recesses
  Zone C — Vent grille:       narrow collective inset on alternating
            columns for a louvred slot effect

MECHANICS
─────────
inset_faces traces each input face inward by `thickness` world-units,
inserting a loop of narrow quad faces along the original perimeter —
the "panel line" ring.  The inner face is returned in result['faces'].

depth acts RELATIVE TO THE FACE NORMAL, not world Z.  On the +Z top
surface, depth < 0 pushes the inner face away from you (into the mesh).
On a +Y side face the same value pushes it in Y.  Keep this in mind
when porting to curved or rotated geometry.

use_individual=False (default)
  All selected faces are treated as ONE polygon.  inset_faces traces a
  single inset boundary around the entire selection perimeter, not each
  face individually.  Interior shared edges are dissolved — you get a
  tidy outer groove and a large flat inner panel.

use_individual=True
  Each face is inset in isolation.  Every face gets its own four-sided
  groove ring regardless of neighbours.  Adjacent grooves share no verts
  — they are separate quad loops, which is exactly what a button grid
  needs.  The seam between button recesses is the boundary between two
  parallel groove loops.
"""

import math
import bpy
import bmesh
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────

COLS          = 6       # quad columns across the panel (X)
ROWS          = 4       # quad rows along the panel (Y)
GRID_SIZE     = 0.9     # half-extent of create_grid (→ 1.8 × 1.8 m total panel)
PANEL_DEPTH   = 0.08    # panel body thickness (metres, extruded downward)

# Zone A — panel-line border
PANEL_LINE_THICK  = 0.025   # groove width in metres
PANEL_LINE_DEPTH  = -0.006  # slight recess of the inner panel face
# Zone B — button cluster
BTN_THICK    = 0.030   # button face border ring width
BTN_DEPTH    = -0.018  # how far each button face is pressed in
# Zone C — vent grille (alternating columns)
VENT_THICK   = 0.010   # narrow louver gap (thin panel line)
VENT_DEPTH   = -0.004  # barely perceptible recess

EXPORT_PATH  = "//hf_inset_panel.glb"   # relative to .blend file

# ── SCENE RESET ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col   = bpy.data.collections.new("HF_InsetPanel")
scene.collection.children.link(col)

# ── BUILD PANEL SURFACE IN BMESH ──────────────────────────────────────────────
bm = bmesh.new()

# create_grid builds a COLS × ROWS quad grid in the XY plane, centred at origin.
# x_segments and y_segments set the number of edge loops in each direction.
# With x_segments=6, y_segments=4 we get 6 × 4 = 24 quads (COLS × ROWS).
bmesh.ops.create_grid(
    bm,
    x_segments=COLS,
    y_segments=ROWS,
    size=GRID_SIZE,
    calc_uvs=False,
)

# Record the top faces BEFORE extrusion so we can reference them after.
# After extrude_face_region the BMFace pointers for the originals remain valid;
# the new geometry (sides + bottom) is in ext['geom'].
top_faces = list(bm.faces)   # all 24 faces at Z=0, facing +Z

# Give the panel physical depth: extrude downward by PANEL_DEPTH.
ext = bmesh.ops.extrude_face_region(bm, geom=top_faces, use_keep_orig=False)
bot_verts = [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=bot_verts, vec=Vector((0.0, 0.0, -PANEL_DEPTH)))

# After extrusion top_faces still point to the Z=0 faces.
# Sort them by (row, column) so we can partition by position cleanly.
top_faces.sort(key=lambda f: (round(f.calc_center_median().y, 4),
                               round(f.calc_center_median().x, 4)))
# top_faces[0]  = bottom-left face, top_faces[-1] = top-right face.

# Partition into COLS-wide rows (sorted bottom→top):
row_width = COLS   # faces per row
rows = [top_faces[i * row_width:(i + 1) * row_width] for i in range(ROWS)]
# rows[0] = bottom row, rows[ROWS-1] = top row

# ── ZONE A — PANEL-LINE BORDER (top row, collective inset) ────────────────────
# Selecting all 6 faces in the top row and insetting collectively creates ONE
# groove ring around the entire block.  Interior shared edges are absorbed —
# no per-face seams appear inside the panel.  This is the standard way to
# create a decorative panel groove that separates a surface section.

zone_a_faces = rows[ROWS - 1]   # top row

res_a = bmesh.ops.inset_faces(
    bm,
    faces=zone_a_faces,
    thickness=PANEL_LINE_THICK,
    depth=PANEL_LINE_DEPTH,
    use_boundary=True,          # extend groove to boundary (outer perimeter)
    use_even_offset=True,       # compensate for non-square face shapes
    use_individual=False,       # collective: one groove ring for the whole group
    use_outset=False,           # inset (inward), not outset (outward boss)
    use_select_inset=False,
    use_relative_offset=False,  # thickness in world units, not percentage
    use_interpolate=True,
    use_edge_rail=True,         # stabilise corner geometry
)
# result['faces'] — the inner panel faces (6 narrowed quads inside the groove)
inner_a = res_a["faces"]

# ── ZONE B — BUTTON CLUSTER (middle two rows, individual inset + depth) ────────
# use_individual=True gives every face its own isolated groove ring, simulating
# individual button outlines.  Adding BTN_DEPTH pushes each inner face inward,
# creating the physical recess that reads as a pressed button cavity.
#
# The depth value must be negative on a +Z-facing face to push inward.
# Positive depth raises the inner face above the surrounding surface (boss/stud).

zone_b_faces = rows[ROWS // 2 - 1] + rows[ROWS // 2]   # middle two rows

res_b = bmesh.ops.inset_faces(
    bm,
    faces=zone_b_faces,
    thickness=BTN_THICK,
    depth=BTN_DEPTH,
    use_boundary=True,
    use_even_offset=True,
    use_individual=True,        # per-face isolation — each button gets its own ring
    use_outset=False,
    use_select_inset=False,
    use_relative_offset=False,
    use_interpolate=True,
    use_edge_rail=True,
)
inner_b = res_b["faces"]

# ── ZONE C — VENT GRILLE (bottom row, alternating columns, collective) ─────────
# Selecting every other column in the bottom row and insetting collectively
# creates a row of louvred slots.  The un-selected column faces act as fins
# between slots.  The narrow VENT_THICK produces a hairline groove border
# rather than a wide decorative frame.

zone_c_faces = [f for i, f in enumerate(rows[0]) if i % 2 == 0]   # even columns

bmesh.ops.inset_faces(
    bm,
    faces=zone_c_faces,
    thickness=VENT_THICK,
    depth=VENT_DEPTH,
    use_boundary=True,
    use_even_offset=True,
    use_individual=False,       # collective: slots share the louvred boundary
    use_outset=False,
    use_select_inset=False,
    use_relative_offset=False,
    use_interpolate=True,
    use_edge_rail=False,        # no rail: allows sharp louvred corners
)

# ── FLAT SHADE (faceted look) ─────────────────────────────────────────────────
for f in bm.faces:
    f.smooth = False

# ── RECALC NORMALS ────────────────────────────────────────────────────────────
# Manual inset_faces + extrude may leave inward-wound faces at the extruded
# bottom.  Recalculate ensures consistent outward-facing normals for export.
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# ── MATERIALISE + SAVE ────────────────────────────────────────────────────────
me = bpy.data.meshes.new("hf_inset_panel")
bm.to_mesh(me)
bm.free()
me.update()

obj = bpy.data.objects.new("hf_inset_panel", me)
col.objects.link(obj)

# Three materials: top-panel grey, groove/button dark, vent slots accent
def _mat(name, r, g, b, roughness=0.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.6
    return m

mat_panel  = _mat("hf_panel_body",   0.55, 0.55, 0.60)
mat_groove = _mat("hf_panel_groove", 0.15, 0.15, 0.18, roughness=0.70)
mat_accent = _mat("hf_panel_accent", 0.20, 0.45, 0.70, roughness=0.30)

me.materials.append(mat_panel)
me.materials.append(mat_groove)
me.materials.append(mat_accent)

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_inset_panel.blend"))

# ── EXPORT GLB ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    export_format="GLB",
    export_apply=True,          # bake flat normals from f.smooth=False
    export_yup=True,            # glTF +Y-up convention for WebXR
    export_normals=True,
    export_materials="EXPORT",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    use_selection=False,
    use_active_collection=False,
)

print("hf_inset_panel.glb exported.")
