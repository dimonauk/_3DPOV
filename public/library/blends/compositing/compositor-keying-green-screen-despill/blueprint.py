# ──────────────────────────────────────────────────────────────────────────────
# COMPOSITOR — KEYING NODE: CHROMA KEY, DESPILL & EDGE MATTE (Blender 5.1)
# Holoflow Studio · CC0 · blends/compositing/compositor-keying-green-screen-despill/
# ──────────────────────────────────────────────────────────────────────────────
#
# Technique: The Keying compositor node removes a solid-colour backdrop by
# converting each pixel to a luminance-weighted opponent-colour difference
# against a chosen screen colour — pixels that "look green" (or blue, or
# whatever you pick) produce high matte values (background); pixels that don't
# produce low matte values (foreground). Clip Black / Clip White threshold that
# floating-point matte into a soft alpha, and a built-in Despill pass corrects
# the green-channel contamination that real screen-bounce light deposits on the
# subject's near edges.
#
# Run: open Blender 5.1 › Text Editor › paste › Alt+P
# ──────────────────────────────────────────────────────────────────────────────

import bpy
import math

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
RENDER_RES_X = 1280
RENDER_RES_Y = 720
FRAME_START  = 1
FRAME_END    = 1   # blueprint = static reference; record.py drives animation

# Scene layout (all in metres, +Y = away from camera)
CAM_POS         = (0.0, -5.0, 0.0)
CAM_ROT_RAD     = (math.pi / 2, 0.0, 0.0)  # look in +Y direction
SUZANNE_POS     = (0.0, 0.0, 0.0)
SUZANNE_SCALE   = 1.2
SCREEN_POS      = (0.0, 2.5, 0.0)
SCREEN_ROT_RAD  = (math.pi / 2, 0.0, 0.0)  # plane normal faces -Y (toward cam)
SCREEN_SCALE    = (4.0, 4.0, 1.0)           # 8 m wide × 8 m tall at Y=2.5
KEY_LIGHT_POS   = (-3.0, -2.0, 3.0)
SPILL_LIGHT_POS = (2.0, 1.0, -0.5)

# Material colours (scene-linear sRGB)
GREEN_EMISSION_COL = (0.0, 0.70, 0.0, 1.0)  # ITU chrome-green screen
SUZANNE_ALBEDO     = (0.72, 0.30, 0.15, 1.0) # warm terracotta — high contrast
SPILL_LIGHT_COL    = (0.2, 1.0, 0.2)         # simulated screen-bounce green

# Keying node parameters
KEY_SCREEN_COLOR   = (0.0, 0.70, 0.0)  # must match GREEN_EMISSION_COL RGB
KEY_SCREEN_BAL     = 0.5   # 0=Red-dominant, 0.5=balanced, 1=Blue-dominant
KEY_CLIP_BLACK     = 0.20  # matte <= this → foreground (alpha=1)
KEY_CLIP_WHITE     = 0.85  # matte >= this → background (alpha=0)
KEY_DESPILL_FAC    = 0.80  # fraction of green contamination to remove
KEY_DESPILL_BAL    = 0.50  # which non-screen channel fills the removed green
KEY_BLUR_PRE       = 1     # px: smooth screen texture noise before keying
KEY_BLUR_POST      = 2     # px: feather the resolved alpha edge
KEY_DILATE         = -2    # px: negative shrinks matte to remove green fringe
KEY_EDGE_RADIUS    = 3     # px: edge-detection kernel radius

# New background composited behind the keyed subject
NEW_BG_COLOR = (0.04, 0.09, 0.28, 1.0)  # deep-navy photographic studio void


# ─── SCENE SETUP ──────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for bl in list(bpy.data.meshes) + list(bpy.data.lights) + list(bpy.data.cameras):
        bl.user_clear()
        try:
            bl.id_data
        except Exception:
            pass


def create_suzanne() -> bpy.types.Object:
    bpy.ops.mesh.primitive_monkey_add(size=SUZANNE_SCALE, location=SUZANNE_POS)
    obj = bpy.context.active_object
    obj.name = "suzanne_subject"
    # Flat shading exposes hard normal boundaries — shows the green fringe
    # most visibly on the thin ear-edge geometry
    for poly in obj.data.polygons:
        poly.use_smooth = False
    return obj


def create_green_screen() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=SCREEN_POS)
    obj = bpy.context.active_object
    obj.name = "green_screen_plane"
    obj.rotation_euler = SCREEN_ROT_RAD
    obj.scale = SCREEN_SCALE
    return obj


def create_lights() -> None:
    # Key light: large warm area from upper-left, primary subject illumination
    bpy.ops.object.light_add(type='AREA', location=KEY_LIGHT_POS)
    key = bpy.context.active_object
    key.name = "key_light"
    key.data.energy = 900.0
    key.data.size = 2.5
    # Aim manually — context avoids track-to constraint overhead
    key.rotation_euler = (math.pi / 4, -math.pi / 6, -math.pi / 4)

    # Spill light: low-energy green point from screen side simulates the
    # real-world bounce that contaminates the subject's right cheek and ear.
    # Without this the despill has nothing to correct — the demo is less
    # instructive on a perfectly-lit subject.
    bpy.ops.object.light_add(type='POINT', location=SPILL_LIGHT_POS)
    spill = bpy.context.active_object
    spill.name = "screen_spill_light"
    spill.data.energy = 18.0
    spill.data.color = SPILL_LIGHT_COL
    spill.data.shadow_soft_size = 0.3


def create_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=CAM_POS, rotation=CAM_ROT_RAD)
    cam = bpy.context.active_object
    cam.name = "cam_main"
    cam.data.lens = 50.0
    bpy.context.scene.camera = cam
    return cam


# ─── MATERIALS ────────────────────────────────────────────────────────────────

def build_green_screen_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new("mat_green_screen")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    # Emission-only: no lighting calculation, no shadows, always pure green.
    # Strength=5 keeps it safely HDR-bright so it reads as colour-accurate
    # even after AgX tone-mapping — lower values drift toward grey at horizon.
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = GREEN_EMISSION_COL
    emit.inputs['Strength'].default_value = 5.0
    emit.location = (-200, 0)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (0, 0)
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def build_suzanne_mat() -> bpy.types.Material:
    mat = bpy.data.materials.new("mat_suzanne")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = SUZANNE_ALBEDO
    bsdf.inputs['Roughness'].default_value  = 0.55
    bsdf.inputs['Metallic'].default_value   = 0.0
    bsdf.location = (-200, 0)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (0, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ─── RENDER ───────────────────────────────────────────────────────────────────

def setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine          = 'CYCLES'
    scene.cycles.samples         = 64
    scene.cycles.use_denoising   = False
    scene.render.resolution_x    = RENDER_RES_X
    scene.render.resolution_y    = RENDER_RES_Y
    scene.render.film_transparent = False  # render green plane, not alpha bg
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.use_nodes   = True  # compositor active
    scene.render.use_compositing = True


# ─── COMPOSITOR ───────────────────────────────────────────────────────────────

def setup_compositor(scene: bpy.types.Scene) -> None:
    nt = scene.node_tree
    nt.nodes.clear()

    # ── Input
    rl = nt.nodes.new('CompositorNodeRLayers')
    rl.location = (-600, 150)

    # ── Keying node — the heart of the pipeline ──
    keying = nt.nodes.new('CompositorNodeKeying')
    keying.location = (-250, 150)

    # screen_color is the RGB triple the node uses as opponent-colour reference.
    # In the UI you set it with the eyedropper on the Image. In Python, set it
    # directly. Must be scene-linear (not gamma-corrected) to match the render.
    keying.screen_color = KEY_SCREEN_COLOR

    # Opponent-colour axis: 0.5 weights Red and Blue equally. Shift toward 0
    # if your screen has red contamination; toward 1 if it has blue overspill.
    keying.screen_balance = KEY_SCREEN_BAL

    # Inner/outer matte: the keyer produces a soft [0,1] value. Pixels below
    # clip_black go fully opaque; above clip_white go fully transparent. The
    # soft zone between holds semi-transparent edges (hair, thin ears).
    keying.clip_black = KEY_CLIP_BLACK
    keying.clip_white = KEY_CLIP_WHITE

    # Despill: replaces the over-represented green channel on foreground edges
    # with a weighted average of the remaining channels (Red, Blue).
    # despill_balance=0.5 splits the replacement equally between R and B.
    keying.despill_factor  = KEY_DESPILL_FAC
    keying.despill_balance = KEY_DESPILL_BAL

    # Edge refinement: pre-blur smooths noisy screen texture before the key
    # decision is made; post-blur feathers the resolved alpha; dilate_distance
    # negative shrinks the matte so the green fringe falls outside it.
    keying.blur_pre       = KEY_BLUR_PRE
    keying.blur_post      = KEY_BLUR_POST
    keying.dilate_distance = KEY_DILATE
    keying.edge_kernel_radius = KEY_EDGE_RADIUS

    # ── New background colour
    bg = nt.nodes.new('CompositorNodeRGB')
    bg.location = (-250, -120)
    bg.outputs[0].default_value = NEW_BG_COLOR

    # ── Alpha Over: key=bottom bg, keyed subject=top with its alpha ──
    ao = nt.nodes.new('CompositorNodeAlphaOver')
    ao.location = (120, 150)
    ao.inputs[0].default_value = 1.0  # Factor = full compositing weight

    # ── Output nodes ──
    composite = nt.nodes.new('CompositorNodeComposite')
    composite.location = (380, 150)
    viewer = nt.nodes.new('CompositorNodeViewer')
    viewer.location = (380, -50)
    matte_v = nt.nodes.new('CompositorNodeViewer')
    matte_v.location = (380, -250)
    matte_v.name = "MatteViewer"

    # ── Links ──
    lk = nt.links
    lk.new(rl.outputs['Image'],   keying.inputs['Image'])
    lk.new(bg.outputs[0],         ao.inputs[1])            # background (bottom)
    lk.new(keying.outputs['Image'], ao.inputs[2])          # foreground (top)
    lk.new(ao.outputs['Image'],   composite.inputs['Image'])
    lk.new(ao.outputs['Image'],   viewer.inputs['Image'])
    lk.new(keying.outputs['Matte'], matte_v.inputs['Image'])  # matte debug view


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main() -> None:
    scene = bpy.context.scene
    clear_scene()

    suzanne    = create_suzanne()
    gs_plane   = create_green_screen()
    create_lights()
    create_camera()

    gs_mat   = build_green_screen_mat()
    suz_mat  = build_suzanne_mat()
    gs_plane.data.materials.append(gs_mat)
    suzanne.data.materials.append(suz_mat)

    setup_render(scene)
    setup_compositor(scene)

    print("=== KEYING BLUEPRINT READY ===")
    print(f"  Subject     : {suzanne.name}")
    print(f"  Green plane : {gs_plane.name}")
    print(f"  Screen color: {KEY_SCREEN_COLOR}")
    print(f"  Clip Black  : {KEY_CLIP_BLACK}  Clip White: {KEY_CLIP_WHITE}")
    print(f"  Despill     : {KEY_DESPILL_FAC}")
    print("  Press F12 to render and activate the compositor.")


main()
