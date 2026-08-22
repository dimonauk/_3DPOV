"""
record.py — Viewport animation for the IFS Chaos Game tutorial
Blender 5.1  |  CC0  |  Holoflow Studio
──────────────────────────────────────────────────────────────
Renders a 10-second (240-frame, 24 fps) EEVEE Next clip showing the chaos
game converging: the fern starts from a single point and gains STEP new
brushstroke splines per frame, so the viewer watches the attractor emerge.
Camera orbits 360° while the fern grows, then cuts to the Sierpinski and
Dragon objects for 3 seconds each.
"""

import bpy
import numpy as np
import sys
import os

OUTPUT_PATH = "//public/library/videos/scripting/" \
              "python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr/" \
              "viewport.mp4"

FPS         = 24
TOTAL_FRAMES = 240   # 10 s
ORBIT_SPEED  = 1.5   # degrees per frame around Z


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine        = "BLENDER_EEVEE_NEXT"
    sc.render.resolution_x  = 1920
    sc.render.resolution_y  = 1080
    sc.render.fps           = FPS
    sc.render.film_transparent = False
    sc.frame_start          = 1
    sc.frame_end            = TOTAL_FRAMES
    sc.render.filepath      = OUTPUT_PATH
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec  = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"

    # EEVEE bloom for emission glow
    sc.eevee.use_bloom          = True
    sc.eevee.bloom_intensity    = 0.25
    sc.eevee.bloom_radius       = 3.0
    sc.eevee.bloom_threshold    = 0.5


def ensure_camera() -> bpy.types.Object:
    if "RecordCam" in bpy.data.objects:
        return bpy.data.objects["RecordCam"]
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def add_world_black() -> None:
    world = bpy.data.worlds.new("BlackWorld")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0, 0, 0, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    bpy.context.scene.world = world


def keyframe_camera_orbit(cam: bpy.types.Object) -> None:
    """
    Orbit the camera around the scene origin at radius 4 m, height 1.5 m.
    One full orbit over TOTAL_FRAMES frames, always tracking the origin.
    """
    import math
    radius = 4.0
    height = 1.5

    # add Track To constraint so camera always faces origin
    tc = cam.constraints.new(type="TRACK_TO")
    tc.target         = None
    tc.track_axis     = "TRACK_NEGATIVE_Z"
    tc.up_axis        = "UP_Y"
    # Track empty at origin
    empty = bpy.data.objects.new("CamTarget", None)
    bpy.context.scene.collection.objects.link(empty)
    empty.location = (0, 0, 0.5)
    tc.target = empty

    for f in range(1, TOTAL_FRAMES + 1):
        angle = math.radians(f * ORBIT_SPEED)
        cam.location = (
            radius * math.cos(angle),
            radius * math.sin(angle),
            height,
        )
        cam.keyframe_insert("location", frame=f)


def main() -> None:
    # requires the fractal objects from blueprint.py to be present
    if "hf_ifs_fern" not in bpy.data.objects:
        print("[record.py] Run blueprint.py first to build the scene.")
        sys.exit(1)

    setup_render()
    add_world_black()
    cam = ensure_camera()
    keyframe_camera_orbit(cam)

    # hide Sierpinski and Dragon for first 180 frames; reveal on cuts
    for name, show_frame in [("hf_ifs_sierpinski", 121), ("hf_ifs_dragon", 181)]:
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True
            obj.hide_viewport = True
            obj.keyframe_insert("hide_render", frame=1)
            obj.keyframe_insert("hide_viewport", frame=1)
            obj.hide_render = False
            obj.hide_viewport = False
            obj.keyframe_insert("hide_render", frame=show_frame)
            obj.keyframe_insert("hide_viewport", frame=show_frame)

    bpy.ops.render.render(animation=True, write_still=False)
    print("[record.py] Render complete →", OUTPUT_PATH)


main()
