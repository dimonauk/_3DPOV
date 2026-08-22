# =============================================================================
# record.py — Viewport animation render for hf_poi_performance
# Renders a 240-frame viewport animation to viewport.mp4.
# Run AFTER blueprint.py has been executed and the .blend saved.
# Blender 5.1 | CC0-1.0 | Holoflow Studio
# =============================================================================

import bpy
import os

OUTPUT_DIR = "//../../videos/scripting/python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr/"
OUTPUT_FILE = "viewport"

RESOLUTION_X = 1280
RESOLUTION_Y = 720
FPS          = 24
FRAME_START  = 1
FRAME_END    = 240


def configure_viewport_render() -> None:
    scene = bpy.context.scene

    scene.render.resolution_x           = RESOLUTION_X
    scene.render.resolution_y           = RESOLUTION_Y
    scene.render.resolution_percentage  = 100
    scene.render.fps                    = FPS
    scene.frame_start                   = FRAME_START
    scene.frame_end                     = FRAME_END

    # FFmpeg output: H.264 in .mp4 container
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.ffmpeg_preset       = 'GOOD'

    scene.render.filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILE)


def setup_viewport_shading() -> None:
    """
    Switch the 3D viewport to MATERIAL_PREVIEW (LookDev) so the emissive
    poi ball glows. SOLID mode does not evaluate emission strength.
    """
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'
                    # Show floor + world background for spatial reference
                    space.overlay.show_floor   = True
                    space.overlay.show_axis_x  = False
                    space.overlay.show_axis_y  = False
                    space.overlay.show_cursor  = False
            break


def position_camera() -> None:
    """
    Place a tracking camera at a fixed position facing HAND_POS.
    Uses a Track To constraint so the poi ball always stays centred.
    """
    bpy.ops.object.camera_add(location=(4.0, -4.0, 2.5))
    cam = bpy.context.active_object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam

    # Track To constraint: camera always looks toward the poi ball
    poi = bpy.data.objects.get("hf_poi_ball")
    if poi:
        con = cam.constraints.new(type='TRACK_TO')
        con.target    = poi
        con.track_axis = 'TRACK_NEGATIVE_Z'
        con.up_axis    = 'UP_Y'


def render_viewport_animation() -> None:
    """
    bpy.ops.render.opengl(animation=True) renders the active 3D viewport
    (not the Cycles / EEVEE pipeline) — fast, no light bounces, shows
    overlays. viewport.mp4 records shading + NLA-driven motion.
    """
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)


def run() -> None:
    configure_viewport_render()
    setup_viewport_shading()
    position_camera()
    render_viewport_animation()
    print("✓ record.py done — viewport.mp4 written to", OUTPUT_DIR)


run()
