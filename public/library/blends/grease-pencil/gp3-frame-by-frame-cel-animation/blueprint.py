"""
Grease Pencil 3 — Frame-by-Frame Cel Animation:
Bouncing Ball with Squash & Stretch, Onion Skinning & PNG Sequence Render
(Blender 5.1)

Technique summary
-----------------
Frame-by-frame cel animation pre-dates computers by a century. In GP3 (Blender
4.3+) it maps directly onto the layer/frame data model: you place a drawing on
specific frame numbers and the renderer holds that drawing until the next one.
The canonical test is a bouncing ball — it encodes four principles at once:
squash, stretch, arc of motion, and timing (frame spacing = perceived speed).

GP3 data-model distinctions that trip up GP2 users
---------------------------------------------------
1. Frames are NOT NLA keyframes. gpd.layers[n].frames.new(N) places a GP
   'drawing keyframe' at timeline frame N. In the NLA, nothing is keyed;
   the GP layer owns the drawings directly. Animating position of the whole
   GP object requires separate NLA keyframes on the object transform — the
   two systems are independent.
2. Between two drawn frames, GP3 renders the LAST drawn frame (HOLD).
   This is correct for smear-free traditional animation; to get smooth
   mathematical in-betweening you would add the GREASE_PENCIL_BUILD modifier
   or insert hand-drawn tweens.
3. Per-layer onion skinning opt-out: each layer has use_onion_skinning.
   The BG/floor layer sets it False to avoid ghosted floor lines cluttering
   the viewport.
4. Squash & stretch lives in the point data, not the modifier stack.
   Different point arrays per frame encode the shape change. The modifier
   stack (smooth, thickness) runs on top of whatever points you provide,
   so it amplifies the authored shape rather than overriding it.

Blueprint structure
-------------------
A  Scene reset + GP3 object creation
B  Materials: solid fill + shadow material
C  Layer 'BG'  — floor line, frame 1 (held forever), onion off
D  Layer 'Ball' — 5 keyframes with squash/stretch variants
E  Layer 'Shadow' — proximity shadow at ground, matches ball height
F  Onion skinning configuration
G  Modifier stack: Smooth + Thickness
H  Camera (orthographic, top-down-ish) + EEVEE render settings
I  Save .blend + render PNG sequence

Outside sources
---------------
Blender Manual: Grease Pencil Layers (CC-BY-SA-4.0, Blender Foundation)
https://docs.blender.org/manual/en/latest/grease_pencil/animation/layers.html
bpy.types.GreasePencil Python API (CC-BY-SA-4.0, Blender Foundation)
https://docs.blender.org/api/current/bpy.types.GreasePencil.html
njanakiev/blender-scripting (MIT, Nicolas Janakiev)
https://github.com/njanakiev/blender-scripting
"""

import bpy
import math
import os

# ── parameters ────────────────────────────────────────────────────────────────
SLUG         = "gp3-frame-by-frame-cel-animation"
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "output")

# animation timing (frame numbers of drawn keyframes)
# spacing: closer = slower; further apart = faster
# frames 1→7 is the fast fall (ball accelerating downward)
# frames 7→12 is the fast impact (closing fast near ground)
# frames 12→14 is the sharp rebound (quick elastic bounce)
# frames 14→24 is the slow rise (decelerating upward)
FRAME_KEYS   = [1, 7, 12, 14, 24]

RENDER_RES_X = 1080
RENDER_RES_Y = 1080
RENDER_FPS   = 24
RENDER_START = 1
RENDER_END   = 24    # one full bounce cycle
SAMPLES      = 8     # fast EEVEE preview; GP3 is shader-light

# ball geometry per keyframe: (cy, rx, ry) — y-centre, x-radius, y-radius
# squash at impact: wider and flatter; stretch at rebound: taller and narrower
BALL_SHAPES  = {
    1:  (1.50, 0.28, 0.28),   # apex — round
    7:  (0.35, 0.28, 0.28),   # mid-fall — round (slight pre-impact anticipation)
    12: (-0.82, 0.50, 0.13),  # impact — squashed
    14: (-0.50, 0.18, 0.44),  # rebound — stretched
    24: (1.20, 0.25, 0.25),   # second apex — slightly smaller (energy loss)
}

FLOOR_Y      = -0.92      # y-coordinate of the ground line

COLOUR_BALL_FILL   = (0.97, 0.55, 0.08, 1.0)  # holoflow amber
COLOUR_BALL_STROKE = (0.05, 0.05, 0.05, 1.0)  # near-black ink
COLOUR_FLOOR       = (0.12, 0.12, 0.16, 1.0)  # dark slate
COLOUR_SHADOW      = (0.05, 0.02, 0.00, 0.45) # translucent warm shadow

ELLIPSE_POINTS = 32   # enough points to look round at the render resolution

# ── A: scene reset ─────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

# ── B: materials ───────────────────────────────────────────────────────────
def gp_material(name: str, stroke_rgba: tuple, fill_rgba: tuple | None = None):
    mat = bpy.data.materials.new(name)
    bpy.data.materials.create_gpencil_data(mat)
    gp = mat.grease_pencil
    gp.show_stroke = True
    gp.color       = stroke_rgba
    if fill_rgba:
        gp.show_fill  = True
        gp.fill_color = fill_rgba
    else:
        gp.show_fill  = False
    return mat

# ── ellipse helper ─────────────────────────────────────────────────────────
def ellipse_pts(cx: float, cy: float, rx: float, ry: float,
                n: int = ELLIPSE_POINTS) -> list:
    """
    Approximate an ellipse as a closed polyline with n evenly-spaced points.
    We duplicate point[0] at the end so the GP3 fill engine sees a closed loop.
    In GP3, any stroke whose first and last points are within ~0.001 world units
    is filled automatically — but explicit closure is more reliable.
    """
    pts = []
    for i in range(n):
        theta = 2.0 * math.pi * i / n
        pts.append((cx + rx * math.cos(theta),
                    cy + ry * math.sin(theta)))
    pts.append(pts[0])   # close
    return pts

# ── stroke write ───────────────────────────────────────────────────────────
def add_stroke(frame, points_2d: list, mat_index: int = 0,
               radius: float = 1.0) -> None:
    frame.drawing.add_strokes(1)
    s = frame.drawing.strokes[-1]
    s.material_index = mat_index
    s.resize(len(points_2d))
    for i, (px, py) in enumerate(points_2d):
        pt = s.points[i]
        pt.position = (px, py, 0.0)
        pt.radius   = radius
        pt.opacity  = 1.0

# ── C: BG layer — floor ────────────────────────────────────────────────────
def build_bg_layer(gp, mat_idx_floor: int) -> None:
    layer = gp.layers.new("BG", set_active=False)
    layer.use_onion_skinning = False  # floor line should not ghost
    f = layer.frames.new(frame_number=1)
    # floor: one horizontal stroke spanning the canvas width
    add_stroke(f, [(-1.6, FLOOR_Y), (1.6, FLOOR_Y)], mat_index=mat_idx_floor,
               radius=0.5)

# ── D: Ball layer — 5 squash/stretch keyframes ────────────────────────────
def build_ball_layer(gp, mat_idx_ball: int) -> None:
    layer = gp.layers.new("Ball", set_active=True)
    layer.use_onion_skinning = True   # the layer we want to ghost
    for fn in FRAME_KEYS:
        cy, rx, ry = BALL_SHAPES[fn]
        f = layer.frames.new(frame_number=fn)
        add_stroke(f, ellipse_pts(0.0, cy, rx, ry), mat_index=mat_idx_ball,
                   radius=0.9)

# ── E: Shadow layer ────────────────────────────────────────────────────────
def build_shadow_layer(gp, mat_idx_shadow: int) -> None:
    """
    Cast shadow: a flattened ellipse at floor level whose x-radius scales
    inversely with ball height. This encodes the light-proximity relationship
    without any light simulation — a purely drawn convention inherited from
    cel animation where shadows were painted separately.
    Ball at y=1.5 → tiny shadow; ball at y=-0.82 → large shadow.
    """
    layer = gp.layers.new("Shadow", set_active=False)
    layer.use_onion_skinning = False
    for fn in FRAME_KEYS:
        cy, _, _ = BALL_SHAPES[fn]
        # proximity: map cy from [-1, 1.5] to shadow_rx [0.40, 0.10]
        t = (cy - (-1.0)) / (1.5 - (-1.0))      # 0 at floor, 1 at apex
        shadow_rx = 0.10 + (1.0 - t) * 0.30
        shadow_ry = shadow_rx * 0.18             # very flat
        f = layer.frames.new(frame_number=fn)
        add_stroke(f, ellipse_pts(0.0, FLOOR_Y - 0.04, shadow_rx, shadow_ry),
                   mat_index=mat_idx_shadow, radius=0.6)

# ── F: onion skinning ──────────────────────────────────────────────────────
def configure_onion_skinning(gp) -> None:
    """
    GP3 onion skinning is per-GreasePencil datablock.
    mode='RELATIVE' shows N frames before/after the current frame number
    regardless of whether they are drawn keyframes.
    mode='ABSOLUTE' shows only the N nearest drawn keyframes.
    For frame-by-frame animation, 'ABSOLUTE' mode is more informative —
    it skips empty hold frames and shows the N actual drawings nearest in time.
    factor controls the opacity of the ghost drawings (0=invisible, 1=full).
    """
    gp.use_onion_skinning    = True
    gp.onion_mode            = "ABSOLUTE"  # show N nearest drawn frames
    gp.onion_before_range    = 2           # ghost up to 2 previous drawings
    gp.onion_after_range     = 1           # ghost 1 upcoming drawing
    gp.onion_factor          = 0.45        # translucent enough to see through
    gp.onion_color_before    = (0.145, 0.475, 0.850)  # blue tint — past
    gp.onion_color_after     = (0.765, 0.122, 0.122)  # red tint — future
    # keyframe type 'ALL' means ghost all keyframe types, not just breakdown etc.
    gp.onion_keyframe_type   = "ALL"

# ── G: modifier stack ──────────────────────────────────────────────────────
def add_modifiers(obj) -> None:
    sm = obj.modifiers.new("Smooth", "GREASE_PENCIL_SMOOTH")
    sm.iterations            = 2
    sm.smooth_factor         = 0.3
    sm.use_smooth_position   = True
    sm.use_smooth_radius     = False  # keep authored squash/stretch radii

    tk = obj.modifiers.new("Thickness", "GREASE_PENCIL_THICKNESS")
    tk.thickness             = 3.0    # px at radius=1.0
    tk.use_custom_curve      = False  # uniform thickness; taper not needed here

# ── H: camera + render ─────────────────────────────────────────────────────
def setup_camera_and_render() -> None:
    bpy.ops.object.camera_add(location=(0.0, -6.0, 0.0),
                               rotation=(math.radians(90), 0, 0))
    cam = bpy.context.active_object
    cam.data.type        = "ORTHO"
    cam.data.ortho_scale = 3.8         # frames ±1.9 world units wide
    bpy.context.scene.camera = cam

    sc = bpy.context.scene
    sc.render.engine               = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x         = RENDER_RES_X
    sc.render.resolution_y         = RENDER_RES_Y
    sc.render.resolution_percentage = 100
    sc.render.fps                  = RENDER_FPS
    sc.frame_start                 = RENDER_START
    sc.frame_end                   = RENDER_END
    sc.render.film_transparent     = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode  = "RGBA"
    sc.render.filepath = os.path.join(OUTPUT_DIR, "bounce_####")
    sc.eevee.taa_render_samples    = SAMPLES

    # World: transparent background for compositing onto reference footage
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0,0,0,0)

# ── main ───────────────────────────────────────────────────────────────────
def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    reset_scene()

    bpy.ops.object.grease_pencil_add(type="EMPTY")
    obj = bpy.context.active_object
    obj.name = "gp3_bounce_ball"
    gp = obj.data

    mat_ball   = gp_material("GP_Ball",   COLOUR_BALL_STROKE, COLOUR_BALL_FILL)
    mat_floor  = gp_material("GP_Floor",  COLOUR_FLOOR)
    mat_shadow = gp_material("GP_Shadow", (0,0,0,0), COLOUR_SHADOW)

    obj.data.materials.append(mat_ball)
    obj.data.materials.append(mat_floor)
    obj.data.materials.append(mat_shadow)

    build_bg_layer(gp, mat_idx_floor=1)
    build_ball_layer(gp, mat_idx_ball=0)
    build_shadow_layer(gp, mat_idx_shadow=2)
    configure_onion_skinning(gp)
    add_modifiers(obj)
    setup_camera_and_render()

    blend_path = os.path.join(os.path.dirname(__file__),
                              "bounce_ball.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.render.render(animation=True)
    print(f"[HFS] blueprint complete — {RENDER_END} frames → {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
