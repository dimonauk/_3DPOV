"""
Mandelbulb — viewport animation render
=======================================
Run AFTER blueprint.py has built the scene.

Adds an orbiting camera on a 360° path, sets up a dark world, and
renders 120 frames to:
  public/library/videos/scripting/
    python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr/viewport.mp4

Render engine: EEVEE Next (fast; unlit vertex colours need no RT lighting).
Duration: 5 s at 24 fps.
"""

import bpy
import math

# ── settings ────────────────────────────────────────────────────────────────
FRAMES      = 120
FPS         = 24
CAM_RADIUS  = 5.5    # orbit radius in metres
CAM_HEIGHT  = 1.2    # vertical offset
OUTPUT_PATH = "//public/library/videos/scripting/" \
              "python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr/viewport"


def setup_render():
    sc = bpy.context.scene
    sc.render.engine              = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x        = 1920
    sc.render.resolution_y        = 1080
    sc.render.fps                 = FPS
    sc.frame_start                = 1
    sc.frame_end                  = FRAMES
    sc.render.filepath            = OUTPUT_PATH
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format       = "MPEG4"
    sc.render.ffmpeg.codec        = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"


def setup_world():
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.005, 0.005, 0.01, 1.0)
        bg.inputs["Strength"].default_value = 0.3


def setup_camera():
    """Orbit camera: keyframe location per frame, Track-To constraint."""
    cam_data = bpy.data.cameras.new("cam_mandelbulb")
    cam_data.lens      = 50
    cam_data.clip_end  = 100.0
    cam = bpy.data.objects.new("cam_mandelbulb", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # Empty at world origin — camera will track to it
    target = bpy.data.objects.new("cam_target", None)
    target.location = (0.0, 0.0, 0.0)
    bpy.context.scene.collection.objects.link(target)

    tc           = cam.constraints.new("TRACK_TO")
    tc.target    = target
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"

    for fr in range(1, FRAMES + 1):
        t   = (fr - 1) / FRAMES * 2.0 * math.pi
        cam.location = (
            CAM_RADIUS * math.cos(t),
            CAM_RADIUS * math.sin(t),
            CAM_HEIGHT,
        )
        cam.keyframe_insert("location", frame=fr)


def run():
    setup_render()
    setup_world()
    setup_camera()
    bpy.ops.render.render(animation=True)
    print(f"[Mandelbulb record] Done → {OUTPUT_PATH}.mp4")


run()
