"""
Grease Pencil 3 — Programmatic 2D Ink: Stroke Data Model, Fill Materials,
Thickness + Smooth Modifiers, EEVEE Transparent Export (Blender 5.1)

Technique summary
-----------------
Blender 4.3 introduced the GP3 rewrite: new internal data model under the same
bpy.types.GreasePencil type, but with a mesh-aligned modifier stack, layer
groups, and direct positional strokes stored as 3D point sequences. GP2 strokes
lived in frame.strokes[] as polylines tagged with colour slots; GP3 strokes keep
positional data in GP-native attribute arrays accessed via the Python API. This
blueprint builds a stylised ink logo mark programmatically — no draw operators
called — then configures a GP3 modifier stack and renders with EEVEE to a
transparent PNG sequence ready for tutorial title-card compositing.

Key GP3 distinctions
--------------------
1. Layer tint vs material colour: GP3 layers carry a "tint_factor" float and
   "tint_color" (RGBA) that blend OVER the material colour — useful for passes
   without duplicating materials. Use the material for the canonical ink colour.
2. Modifier stack: GP3 uses obj.modifiers.new(name, type) with types prefixed
   GREASE_PENCIL_*. This is the same stack mesh objects use, enabling shared
   modifier logic and future GN-based GP3 modifiers.
3. Fill inside strokes: fill is per-material (mat.grease_pencil.fill_color).
   The GP3 engine auto-fills closed stroke loops; no separate fill stroke needed.
4. Pressure / strength: stored per-point as .pressure and .strength floats.
   These multiply the modifier-stack output; set them carefully or the modifier
   stack's thickness curve won't behave as designed.

Blueprint structure
-------------------
Section A — Scene reset + GP3 object creation
Section B — Material: stroke + fill
Section C — Layer + frame + strokes (logo geometry)
Section D — Modifier stack: Smooth, Thickness
Section E — Camera + EEVEE render settings
Section F — PNG render to output/
"""

import bpy
import math
import os

# ── parameters ────────────────────────────────────────────────────────────────
SLUG               = "grease-pencil-3-stroke-drawing-fill-taper-export"
OUTPUT_DIR         = os.path.join(os.path.dirname(__file__), "output")
STROKE_COLOR       = (0.04, 0.04, 0.04, 1.0)   # near-black ink
FILL_COLOR         = (0.96, 0.55, 0.10, 1.0)   # holoflow amber
BG_COLOR           = (0.0, 0.0, 0.0, 0.0)      # transparent
STROKE_THICKNESS   = 4.0     # pixels at 100% strength
SMOOTH_ITERATIONS  = 3
RENDER_RES_X       = 1920
RENDER_RES_Y       = 1080
RENDER_SAMPLES     = 16      # fast EEVEE pass; GP3 renders are shader-light
CANVAS_SCALE       = 2.0     # GP3 object scale in world units

# ── A: scene reset ─────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

# ── B: material ────────────────────────────────────────────────────────────
def build_material(name: str, stroke_rgba: tuple, fill_rgba: tuple):
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)   # promote to GP material
    gp = mat.grease_pencil
    gp.show_stroke      = True
    gp.color            = stroke_rgba             # stroke colour RGBA
    gp.show_fill        = True
    gp.fill_color       = fill_rgba               # fill colour RGBA
    return mat

def build_stroke_only_material(name: str, stroke_rgba: tuple):
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gp = mat.grease_pencil
    gp.show_stroke  = True
    gp.color        = stroke_rgba
    gp.show_fill    = False
    return mat

# ── C: GP3 object + strokes ────────────────────────────────────────────────
def add_stroke(frame, points_2d: list[tuple[float, float]],
               mat_index: int = 0, pressure: float = 1.0) -> None:
    """
    Append one closed or open stroke to the GP3 frame.

    points_2d: list of (x, y) in object-local space; z = 0 (flat canvas).
    GP3 points live in 3D; we embed the 2D artwork on the XY plane so the
    camera looking down -Z captures it in full without perspective distortion.
    closed: auto-determined by whether first == last point; the GP3 fill
    engine fills any stroke whose point count >= 3.
    """
    stroke = frame.drawing.add_strokes(1)
    # strokes collection access in GP3 Python API:
    s = frame.drawing.strokes[-1]
    s.material_index = mat_index

    # Allocate the point array before writing co-ordinates.
    s.resize(len(points_2d))
    for i, (px, py) in enumerate(points_2d):
        s.points[i].position   = (px, py, 0.0)
        s.points[i].radius     = pressure          # GP3: radius drives thickness
        s.points[i].opacity    = 1.0

def build_gp3_object() -> bpy.types.Object:
    # bpy.ops.object.grease_pencil_add creates a GP3 object in Blender 5.1
    # type='EMPTY' gives a bare GP3 data-block; type='STROKE' adds sample strokes
    bpy.ops.object.grease_pencil_add(type="EMPTY")
    obj = bpy.context.active_object
    obj.name = "gp3_ink_logo"
    obj.scale = (CANVAS_SCALE, CANVAS_SCALE, CANVAS_SCALE)

    gp: bpy.types.GreasePencil = obj.data

    # Attach materials
    mat_filled  = build_material("GP_FillStroke", STROKE_COLOR, FILL_COLOR)
    mat_outline = build_stroke_only_material("GP_OutlineOnly", STROKE_COLOR)
    obj.data.materials.append(mat_filled)
    obj.data.materials.append(mat_outline)

    # Layer: one layer for filled shapes, one for accent strokes
    layer_fill    = gp.layers.new("Shapes", set_active=True)
    layer_strokes = gp.layers.new("Accents", set_active=False)

    # Frame at frame 1
    frame_fill    = layer_fill.frames.new(frame_number=1)
    frame_strokes = layer_strokes.frames.new(frame_number=1)

    # — diamond body (filled)
    R = 0.8
    diamond = [
        (  0,  R),
        ( R*0.6,  0),
        (  0, -R),
        (-R*0.6,  0),
        (  0,  R),   # close loop for fill
    ]
    add_stroke(frame_fill, diamond, mat_index=0, pressure=1.0)

    # — inner star accent (stroke-only, no fill)
    r = 0.35
    pts_inner = []
    for k in range(6):
        angle = math.radians(k * 60 - 90)
        pts_inner.append((r * math.cos(angle), r * math.sin(angle)))
    pts_inner.append(pts_inner[0])  # close
    add_stroke(frame_strokes, pts_inner, mat_index=1, pressure=0.6)

    # — three horizontal rule strokes (accent lines below diamond)
    for i, (w, y_pos) in enumerate([(0.6, -1.1), (0.45, -1.25), (0.3, -1.4)]):
        add_stroke(frame_strokes, [(-w, y_pos), (w, y_pos)], mat_index=1,
                   pressure=0.8 - i * 0.15)

    return obj

# ── D: modifier stack ──────────────────────────────────────────────────────
def add_gp3_modifiers(obj: bpy.types.Object) -> None:
    """
    GP3 modifier types (Blender 5.1):
      GREASE_PENCIL_SMOOTH    — Laplacian smooth of point positions per-stroke
      GREASE_PENCIL_THICKNESS — Global multiplier + optional per-point falloff
      GREASE_PENCIL_NOISE     — Random offset; NOT used here (we want clean ink)

    Order matters: Smooth fires first (clean positions), then Thickness
    evaluates the smoothed radii. Reversing this would over-inflate radius
    before smoothing washes it out.
    """
    # Smooth: position only, leave radius and strength untouched
    sm = obj.modifiers.new("Smooth", "GREASE_PENCIL_SMOOTH")
    sm.iterations     = SMOOTH_ITERATIONS
    sm.smooth_factor  = 0.5
    sm.use_smooth_position  = True
    sm.use_smooth_radius    = False   # keep hand-authored radius profile
    sm.use_smooth_opacity   = False

    # Thickness: global scale + start/end taper via a custom curve
    tk = obj.modifiers.new("Thickness", "GREASE_PENCIL_THICKNESS")
    tk.thickness            = STROKE_THICKNESS
    tk.use_custom_curve     = True   # enable falloff curve for taper effect
    # Custom curve: Map 0 (stroke start) → 0.0 weight, 0.5 → 1.0, 1.0 → 0.0
    # This makes strokes taper at both ends — classic ink brush feel.
    crv = tk.custom_curve
    crv.curves[0].points.new(0.0, 0.0)
    crv.curves[0].points.new(0.5, 1.0)
    crv.curves[0].points.new(1.0, 0.0)
    crv.update()

# ── E: camera + world ──────────────────────────────────────────────────────
def setup_camera_and_world() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, 0, 5))
    cam_obj = bpy.context.active_object
    cam_obj.data.type  = "ORTHO"
    cam_obj.data.ortho_scale = CANVAS_SCALE * 4.0   # frame the canvas
    bpy.context.scene.camera = cam_obj

    world = bpy.data.worlds["World"]
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = BG_COLOR

    return cam_obj

# ── F: render settings ─────────────────────────────────────────────────────
def configure_render() -> None:
    sc = bpy.context.scene
    sc.render.engine          = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x    = RENDER_RES_X
    sc.render.resolution_y    = RENDER_RES_Y
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True       # alpha pass for compositing
    sc.render.image_settings.file_format    = "PNG"
    sc.render.image_settings.color_mode     = "RGBA"
    sc.render.image_settings.compression    = 15    # fast lossless
    sc.render.filepath        = os.path.join(OUTPUT_DIR, "gp3_ink_logo_####")

    # EEVEE Next: samples
    sc.eevee.taa_render_samples = RENDER_SAMPLES

    # Frame range: static single frame
    sc.frame_start = 1
    sc.frame_end   = 1

# ── main ───────────────────────────────────────────────────────────────────
def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    reset_scene()
    gp_obj = build_gp3_object()
    add_gp3_modifiers(gp_obj)
    setup_camera_and_world()
    configure_render()

    # Light: GP3 in EEVEE renders via its own shader pipeline —
    # a sun lamp prevents total black on fill colours in viewport,
    # but for EEVEE NEXT the GP3 material is unlit by default (matches GP2 behaviour).
    bpy.ops.object.light_add(type="SUN", location=(3, 3, 5))
    sun = bpy.context.active_object
    sun.data.energy = 2.0

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(__file__),
                                                        "gp3_ink_logo.blend"))
    bpy.ops.render.render(write_still=True)
    print(f"[HFS] GP3 blueprint complete → {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
