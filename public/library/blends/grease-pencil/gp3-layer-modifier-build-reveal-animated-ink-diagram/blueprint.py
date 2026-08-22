"""
GP3 Layer Modifier Stack — Build + Noise + Smooth for Animated Ink Diagram
Blender 5.1  |  CC0 — no rights reserved

Builds a three-layer Grease Pencil 3 object whose strokes form a WebXR
pipeline diagram (Blender → GLB → WebXR).  Three GP3 modifier types drive
the animated reveal:

  Build  — SEQUENTIAL / GROW: strokes appear one by one as a "pen" draws them.
            Three instances with layer_filter restrict each to its own layer,
            giving independent timing per stage.
  Noise  — subtle organic wobble (factor 0.03) on all strokes; use_random=True
            updates the field each frame so the ink "breathes" after settling.
  Smooth — one light pass counters noise-introduced kinks at low point counts.

Why separate layers instead of one flat list?
  The Build modifier's layer_filter property (string, exact layer name) lets
  you assign different frame_start / frame_end to each diagram stage without
  duplicating strokes into time-offset frames.  Boxes draw first (long beats),
  arrows second (medium), labels last (fast — small strokes read quickly).

GP3 drawing API (Blender 4.3 → 5.1):
  Unlike GP2 where frame.strokes.new() created an editable stroke object, GP3
  frames expose a .drawing handle.  frame.drawing.add_strokes(n) allocates n
  new stroke records; frame.drawing.strokes[-1] retrieves the last one.
  s.resize(count) sets point count before any point attribute writes.

References:
  Blender 5.1 Manual — Grease Pencil Modifiers (Build)
  https://docs.blender.org/manual/en/latest/grease_pencil/modifiers/generate/build.html
  Licence: CC-BY-4.0 — Blender Foundation
"""

import bpy, math

# ── scene constants ────────────────────────────────────────────────────────────
SCENE_START = 1
SCENE_END   = 100

# Box layout (world units)
BOX_W, BOX_H = 0.70, 0.35       # half-width, half-height
BOX_CENTERS  = [(-3.0, 0.0), (0.0, 0.0), (3.0, 0.0)]
BOX_LABELS   = ["blender", "glb", "webxr"]

# Arrow geometry
ARROW_GAP     = 0.05             # space between box edge and arrow tip/tail
ARROW_HEAD_L  = 0.16             # arrowhead arm length
ARROW_HEAD_W  = 0.09             # arrowhead half-width at base

# Build modifier frame ranges — slight overlaps for visual flow continuity
BUILD_BOXES_S,  BUILD_BOXES_E  = 1,  42
BUILD_ARROWS_S, BUILD_ARROWS_E = 36, 66
BUILD_LABELS_S, BUILD_LABELS_E = 60, 90

# Stroke styling
PEN_RADIUS_THICK = 0.028         # box outlines
PEN_RADIUS_MED   = 0.022         # arrows
PEN_RADIUS_THIN  = 0.016         # label lines

# Noise / Smooth parameters
NOISE_FACTOR     = 0.03          # position wobble strength in world units
NOISE_SCALE      = 1.4           # spatial frequency; higher = tighter jitter
NOISE_SEED       = 7
SMOOTH_FACTOR    = 0.3           # one pass, light
SMOOTH_REPEAT    = 1


# ── helpers ───────────────────────────────────────────────────────────────────
def _new_stroke(drawing, material_idx, radius, n_pts, cyclic=False):
    """Allocate one stroke and set constant per-point properties."""
    drawing.add_strokes(1)
    s = drawing.strokes[-1]
    s.use_cyclic      = cyclic
    s.material_index  = material_idx
    s.resize(n_pts)
    for p in s.points:
        p.radius  = radius
        p.opacity = 1.0
    return s


def _set_points(stroke, coords):
    """Write a list of (x,y,z) tuples into stroke.points."""
    for i, (x, y, z) in enumerate(coords):
        stroke.points[i].position = (x, y, z)


def _make_material(name, stroke_rgba, show_fill=False):
    mat = bpy.data.materials.new(name)
    # GP3 uses the same create_gpencil_data helper as GP2 to attach the
    # grease_pencil property group; in 5.1 the same call applies to both.
    if not mat.is_grease_pencil:
        bpy.data.materials.create_gpencil_data(mat)
    mat.grease_pencil.show_stroke = True
    mat.grease_pencil.show_fill   = show_fill
    mat.grease_pencil.color       = stroke_rgba    # stroke RGBA
    return mat


# ── 1. scene reset ────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene      = bpy.context.scene
scene.name = "ink_diagram"
scene.frame_start = SCENE_START
scene.frame_end   = SCENE_END
scene.render.fps  = 24


# ── 2. materials ──────────────────────────────────────────────────────────────
mat_box   = _make_material("M_InkBox",   (0.07, 0.07, 0.10, 1.0))   # dark navy
mat_arrow = _make_material("M_InkArrow", (0.18, 0.35, 0.82, 1.0))   # Holoflow blue
mat_label = _make_material("M_InkLabel", (0.25, 0.25, 0.35, 1.0))   # cool grey


# ── 3. GP3 object ─────────────────────────────────────────────────────────────
bpy.ops.object.grease_pencil_add(type='EMPTY')
gp_obj    = bpy.context.active_object
gp_obj.name = "pipeline_diagram"
gp_data   = gp_obj.data
gp_data.name = "pipeline_diagram"

for m in (mat_box, mat_arrow, mat_label):
    gp_data.materials.append(m)
# Material indices: 0=box, 1=arrow, 2=label


# ── 4. Layer "boxes" — three closed rectangles ────────────────────────────────
layer_boxes = gp_data.layers.new("boxes")
layer_boxes.color = (0.07, 0.07, 0.10)   # tint visible in the layer list
frame_boxes = layer_boxes.frames.new(1)
drw_b = frame_boxes.drawing

for cx, cy in BOX_CENTERS:
    s = _new_stroke(drw_b, 0, PEN_RADIUS_THICK, 4, cyclic=True)
    _set_points(s, [
        (cx - BOX_W, cy - BOX_H, 0),
        (cx + BOX_W, cy - BOX_H, 0),
        (cx + BOX_W, cy + BOX_H, 0),
        (cx - BOX_W, cy + BOX_H, 0),
    ])


# ── 5. Layer "arrows" — two horizontal arrows with arrowheads ─────────────────
layer_arrows = gp_data.layers.new("arrows")
layer_arrows.color = (0.18, 0.35, 0.82)
frame_arrows = layer_arrows.frames.new(1)
drw_a = frame_arrows.drawing

for i in range(len(BOX_CENTERS) - 1):
    cx0, cy0 = BOX_CENTERS[i]
    cx1, _   = BOX_CENTERS[i + 1]
    x_tail   = cx0 + BOX_W + ARROW_GAP
    x_tip    = cx1 - BOX_W - ARROW_GAP
    y        = cy0

    # Arrow shaft
    s = _new_stroke(drw_a, 1, PEN_RADIUS_MED, 2)
    _set_points(s, [(x_tail, y, 0), (x_tip, y, 0)])

    # Arrowhead upper arm
    s = _new_stroke(drw_a, 1, PEN_RADIUS_MED, 2)
    _set_points(s, [
        (x_tip - ARROW_HEAD_L, y + ARROW_HEAD_W, 0),
        (x_tip, y, 0),
    ])

    # Arrowhead lower arm
    s = _new_stroke(drw_a, 1, PEN_RADIUS_MED, 2)
    _set_points(s, [
        (x_tip - ARROW_HEAD_L, y - ARROW_HEAD_W, 0),
        (x_tip, y, 0),
    ])


# ── 6. Layer "labels" — three label lines per box ─────────────────────────────
layer_labels = gp_data.layers.new("labels")
layer_labels.color = (0.25, 0.25, 0.35)
frame_labels = layer_labels.frames.new(1)
drw_l = frame_labels.drawing

LABEL_OFFSETS = [0.14, 0.0, -0.14]   # Y offsets for title + 2 detail lines
LABEL_WIDTHS  = [0.40, 0.52, 0.45]   # half-widths per line (title shorter)

for cx, cy in BOX_CENTERS:
    for yo, hw in zip(LABEL_OFFSETS, LABEL_WIDTHS):
        s = _new_stroke(drw_l, 2, PEN_RADIUS_THIN, 2)
        _set_points(s, [(cx - hw, cy + yo, 0), (cx + hw, cy + yo, 0)])


# ── 7. GP3 modifiers ──────────────────────────────────────────────────────────

# Build — boxes layer
mod_bb = gp_obj.modifiers.new("BuildBoxes", type='GREASE_PENCIL_BUILD')
mod_bb.mode                  = 'SEQUENTIAL'  # one stroke at a time
mod_bb.transition            = 'GROW'        # stroke tip grows from start point
mod_bb.use_restrict_frame_range = True
mod_bb.frame_start           = float(BUILD_BOXES_S)
mod_bb.frame_end             = float(BUILD_BOXES_E)
mod_bb.layer_filter          = "boxes"       # restrict to this layer only

# Build — arrows layer: overlaps box end so transitions feel continuous
mod_ba = gp_obj.modifiers.new("BuildArrows", type='GREASE_PENCIL_BUILD')
mod_ba.mode                  = 'SEQUENTIAL'
mod_ba.transition            = 'GROW'
mod_ba.use_restrict_frame_range = True
mod_ba.frame_start           = float(BUILD_ARROWS_S)
mod_ba.frame_end             = float(BUILD_ARROWS_E)
mod_ba.layer_filter          = "arrows"

# Build — labels layer: last to appear, fast strokes
mod_bl = gp_obj.modifiers.new("BuildLabels", type='GREASE_PENCIL_BUILD')
mod_bl.mode                  = 'SEQUENTIAL'
mod_bl.transition            = 'GROW'
mod_bl.use_restrict_frame_range = True
mod_bl.frame_start           = float(BUILD_LABELS_S)
mod_bl.frame_end             = float(BUILD_LABELS_E)
mod_bl.layer_filter          = "labels"

# Noise — organic ink wobble applied after Build so visible strokes still jitter.
# use_random=True re-evaluates the noise field each frame; seed is fixed so the
# wobble is deterministic across render passes and screen-recording retakes.
mod_n = gp_obj.modifiers.new("InkWobble", type='GREASE_PENCIL_NOISE')
mod_n.factor       = NOISE_FACTOR
mod_n.noise_scale  = NOISE_SCALE
mod_n.use_random   = True
mod_n.seed         = NOISE_SEED

# Smooth — one light pass to prevent staircase artifacts at arrowhead junctions.
mod_sm = gp_obj.modifiers.new("EdgeSmooth", type='GREASE_PENCIL_SMOOTH')
mod_sm.factor      = SMOOTH_FACTOR
mod_sm.iterations  = SMOOTH_REPEAT


# ── 8. Camera — orthographic looking down from Z ──────────────────────────────
bpy.ops.object.camera_add(location=(0, 0, 6))
cam       = bpy.context.active_object
cam.name  = "DiagramCam"
scene.camera = cam
cam.data.type        = 'ORTHO'
cam.data.ortho_scale = 9.0          # fits -4.5..4.5 X range comfortably


# ── 9. World + render ─────────────────────────────────────────────────────────
scene.world = bpy.data.worlds.new("World")
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (
    0.98, 0.97, 0.95, 1.0)          # off-white paper background
scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.film_transparent     = False
scene.render.image_settings.file_format = 'PNG'

print("✓ ink_diagram: 3 boxes / 2 arrows / 9 labels | "
      "Build×3 + Noise + Smooth | frames 1–90 reveal, 91–100 settled")
