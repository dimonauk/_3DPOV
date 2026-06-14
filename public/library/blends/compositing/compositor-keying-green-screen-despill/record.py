# ──────────────────────────────────────────────────────────────────────────────
# RECORD.PY — viewport animation render for Keying Node tutorial
# Output: public/library/videos/compositor/compositor-keying-green-screen-despill/viewport.mp4
#
# Run via Blender Text Editor (Alt+P) after opening a blank scene.
# Renders 150 frames (5 s at 30 fps) showing Suzanne sliding left-to-right
# so viewers can watch the keyed edge quality change as she crosses the frame.
# ──────────────────────────────────────────────────────────────────────────────

import bpy
import math

# Re-use scene-setup constants from blueprint
GREEN_EMISSION_COL = (0.0, 0.70, 0.0, 1.0)
SUZANNE_ALBEDO     = (0.72, 0.30, 0.15, 1.0)
SPILL_LIGHT_COL    = (0.2, 1.0, 0.2)
CAM_POS            = (0.0, -5.0, 0.0)
CAM_ROT_RAD        = (math.pi / 2, 0.0, 0.0)
SCREEN_POS         = (0.0, 2.5, 0.0)
SCREEN_ROT_RAD     = (math.pi / 2, 0.0, 0.0)
SCREEN_SCALE       = (4.0, 4.0, 1.0)
KEY_LIGHT_POS      = (-3.0, -2.0, 3.0)
SPILL_LIGHT_POS    = (2.0, 1.0, -0.5)

KEY_SCREEN_COLOR   = (0.0, 0.70, 0.0)
KEY_SCREEN_BAL     = 0.5
KEY_CLIP_BLACK     = 0.20
KEY_CLIP_WHITE     = 0.85
KEY_DESPILL_FAC    = 0.80
KEY_DESPILL_BAL    = 0.50
KEY_BLUR_PRE       = 1
KEY_BLUR_POST      = 2
KEY_DILATE         = -2
KEY_EDGE_RADIUS    = 3
NEW_BG_COLOR       = (0.04, 0.09, 0.28, 1.0)

# Animation
FRAME_TOTAL   = 150
FPS           = 30
SUZANNE_SCALE = 1.2
# Suzanne enters from left (-3.2), pauses centre (frames 50-100), exits right
KEYFRAMES = {
    1:   (-3.2, 0.0, 0.0),  # off-screen left
    50:  ( 0.0, 0.0, 0.0),  # centre (matte quality clearly visible)
    100: ( 0.0, 0.0, 0.0),  # hold centre
    150: ( 3.2, 0.0, 0.0),  # off-screen right
}


def _clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


def _build_scene() -> bpy.types.Object:
    # Suzanne
    bpy.ops.mesh.primitive_monkey_add(size=SUZANNE_SCALE, location=(0, 0, 0))
    suz = bpy.context.active_object
    suz.name = "suzanne_subject"
    for poly in suz.data.polygons:
        poly.use_smooth = False

    # Green screen plane
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=SCREEN_POS)
    gs = bpy.context.active_object
    gs.name = "green_screen_plane"
    gs.rotation_euler = SCREEN_ROT_RAD
    gs.scale = SCREEN_SCALE

    # Key light
    bpy.ops.object.light_add(type='AREA', location=KEY_LIGHT_POS)
    key = bpy.context.active_object
    key.data.energy = 900.0
    key.data.size   = 2.5
    key.rotation_euler = (math.pi / 4, -math.pi / 6, -math.pi / 4)

    # Spill light
    bpy.ops.object.light_add(type='POINT', location=SPILL_LIGHT_POS)
    sp = bpy.context.active_object
    sp.data.energy = 18.0
    sp.data.color  = SPILL_LIGHT_COL

    # Camera
    bpy.ops.object.camera_add(location=CAM_POS, rotation=CAM_ROT_RAD)
    cam = bpy.context.active_object
    cam.data.lens = 50.0
    bpy.context.scene.camera = cam

    # Materials
    for obj, col, kind in [(gs, GREEN_EMISSION_COL, 'emit'), (suz, SUZANNE_ALBEDO, 'bsdf')]:
        mat = bpy.data.materials.new(obj.name + "_mat")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        if kind == 'emit':
            n = nt.nodes.new('ShaderNodeEmission')
            n.inputs['Color'].default_value    = col
            n.inputs['Strength'].default_value = 5.0
            out = nt.nodes.new('ShaderNodeOutputMaterial')
            nt.links.new(n.outputs['Emission'], out.inputs['Surface'])
        else:
            n = nt.nodes.new('ShaderNodeBsdfPrincipled')
            n.inputs['Base Color'].default_value = col
            n.inputs['Roughness'].default_value  = 0.55
            out = nt.nodes.new('ShaderNodeOutputMaterial')
            nt.links.new(n.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)

    return suz


def _keyframe_suzanne(suz: bpy.types.Object) -> None:
    suz.animation_data_create()
    suz.animation_data.action = bpy.data.actions.new("suzanne_slide")
    for frame, loc in KEYFRAMES.items():
        suz.location = loc
        suz.keyframe_insert(data_path='location', frame=frame)
    # Linear interpolation — constant-speed slide
    if suz.animation_data and suz.animation_data.action:
        for fc in suz.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def _setup_compositor(scene: bpy.types.Scene) -> None:
    scene.use_nodes = True
    nt = scene.node_tree
    nt.nodes.clear()

    rl     = nt.nodes.new('CompositorNodeRLayers')
    keying = nt.nodes.new('CompositorNodeKeying')
    bg     = nt.nodes.new('CompositorNodeRGB')
    ao     = nt.nodes.new('CompositorNodeAlphaOver')
    comp   = nt.nodes.new('CompositorNodeComposite')

    keying.screen_color       = KEY_SCREEN_COLOR
    keying.screen_balance     = KEY_SCREEN_BAL
    keying.clip_black         = KEY_CLIP_BLACK
    keying.clip_white         = KEY_CLIP_WHITE
    keying.despill_factor     = KEY_DESPILL_FAC
    keying.despill_balance    = KEY_DESPILL_BAL
    keying.blur_pre           = KEY_BLUR_PRE
    keying.blur_post          = KEY_BLUR_POST
    keying.dilate_distance    = KEY_DILATE
    keying.edge_kernel_radius = KEY_EDGE_RADIUS

    bg.outputs[0].default_value  = NEW_BG_COLOR
    ao.inputs[0].default_value   = 1.0

    lk = nt.links
    lk.new(rl.outputs['Image'],     keying.inputs['Image'])
    lk.new(bg.outputs[0],           ao.inputs[1])
    lk.new(keying.outputs['Image'], ao.inputs[2])
    lk.new(ao.outputs['Image'],     comp.inputs['Image'])


def _setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine           = 'CYCLES'
    scene.cycles.samples          = 32  # lower for speed; enough for colour-accuracy
    scene.cycles.use_denoising    = False
    scene.render.resolution_x     = 1280
    scene.render.resolution_y     = 720
    scene.render.film_transparent = False
    scene.render.use_compositing  = True
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL
    scene.render.fps  = FPS

    # MP4 output
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format     = 'MPEG4'
    scene.render.ffmpeg.codec      = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = (
        "//../../../../videos/compositor/"
        "compositor-keying-green-screen-despill/viewport"
    )


def main() -> None:
    scene = bpy.context.scene
    _clear_scene()
    suz = _build_scene()
    _keyframe_suzanne(suz)
    _setup_compositor(scene)
    _setup_render(scene)
    print("=== RECORD SETUP COMPLETE — rendering 150 frames ===")
    bpy.ops.render.render(animation=True)
    print("=== viewport.mp4 written ===")


main()
