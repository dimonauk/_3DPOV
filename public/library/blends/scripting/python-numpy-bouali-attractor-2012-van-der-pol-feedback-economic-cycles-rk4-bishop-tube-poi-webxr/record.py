# SPDX-License-Identifier: CC0-1.0
"""
record.py — Bouali Attractor  (Blender 5.1)
============================================
Run AFTER blueprint.py.  Configures Eevee Next with bloom, builds a 10-second
orbit animation with shape-key sweeps, and renders to:

  public/library/videos/scripting/
    python-numpy-bouali-attractor-2012-van-der-pol-feedback-economic-cycles-
    rk4-bishop-tube-poi-webxr/viewport.mp4

Animation structure  (300 frames @ 30 fps = 10 s)
--------------------------------------------------
  F  1 – 75  : 270° camera orbit, tube in Basis shape
  F 75 – 130 : morph Basis → SK_FastZ   (z-coupling expands)
  F130 – 160 : hold SK_FastZ
  F160 – 215 : morph SK_FastZ → Basis   (return)
  F215 – 255 : morph Basis → SK_WeakGrowth   (near-periodic, orbit contracts)
  F255 – 300 : morph SK_WeakGrowth → Basis + full-circle orbit completes
"""

import bpy
import math

OUTPUT_PATH = ("//../../videos/scripting/"
               "python-numpy-bouali-attractor-2012-van-der-pol-feedback-"
               "economic-cycles-rk4-bishop-tube-poi-webxr/viewport")

FPS       = 30
N_FRAMES  = 300
CAM_DIST  = 0.30       # metres — fits 0.085 m poi with 85 mm lens
CAM_ELEV  = 0.30       # radians above equator
OBJ_NAME  = "bouali_attractor"


def setup_render(sc):
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.render.fps    = FPS
    sc.frame_start   = 1
    sc.frame_end     = N_FRAMES
    sc.render.image_settings.file_format   = "FFMPEG"
    sc.render.ffmpeg.format                = "MPEG4"
    sc.render.ffmpeg.codec                 = "H264"
    sc.render.ffmpeg.constant_rate_factor  = "HIGH"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.filepath     = OUTPUT_PATH
    # Eevee Next bloom parameters
    sc.eevee.use_bloom       = True
    sc.eevee.bloom_threshold = 0.28
    sc.eevee.bloom_intensity = 0.25
    sc.eevee.bloom_radius    = 3.5


def setup_world(sc):
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
        bg.inputs["Strength"].default_value = 0.0


def add_camera(sc):
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.data.lens = 85.0      # mm — tele for clean background separation
    cam.data.clip_end = 100.0
    sc.camera = cam
    return cam


def add_lights():
    # Key: soft rim from upper-right
    bpy.ops.object.light_add(type="AREA",
                             location=(0.28, -0.18, 0.22))
    key = bpy.context.object
    key.data.energy = 6.0
    key.data.size   = 0.15
    # Fill: cool bounce from left
    bpy.ops.object.light_add(type="AREA",
                             location=(-0.20, 0.10, 0.08))
    fill = bpy.context.object
    fill.data.energy = 1.8
    fill.data.color  = (0.6, 0.7, 1.0)
    fill.data.size   = 0.20


def keyframe_camera_orbit(cam, n_frames, dist, elev):
    """Full 360° orbit over n_frames, plus camera-track empty at origin."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    target = bpy.context.object
    con = cam.constraints.new("TRACK_TO")
    con.target     = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis    = "UP_Y"
    for f in range(1, n_frames + 1):
        angle = 2 * math.pi * (f - 1) / n_frames
        cam.location.x = dist * math.cos(angle)
        cam.location.y = dist * math.sin(angle) * math.cos(elev)
        cam.location.z = dist * math.sin(elev)
        cam.keyframe_insert("location", frame=f)


def keyframe_shape_keys(obj, n_frames):
    """Sweep shape keys: Basis → SK_FastZ → Basis → SK_WeakGrowth → Basis."""
    sk = obj.data.shape_keys
    if sk is None:
        return
    keys = {kb.name: kb for kb in sk.key_blocks}
    schedule = [
        # (frame_start, frame_end, key_from, key_to)
        (75,  130, "Basis",        "SK_FastZ"),
        (160, 215, "SK_FastZ",     "Basis"),
        (215, 255, "Basis",        "SK_WeakGrowth"),
        (255, 300, "SK_WeakGrowth","Basis"),
    ]
    # Initialise all key values to 0 at frame 1
    for kb in sk.key_blocks[1:]:
        kb.value = 0.0
        kb.keyframe_insert("value", frame=1)

    for f_start, f_end, from_key, to_key in schedule:
        if from_key in keys and from_key != "Basis":
            keys[from_key].value = 1.0
            keys[from_key].keyframe_insert("value", frame=f_start)
        if to_key in keys and to_key != "Basis":
            keys[to_key].value = 0.0
            keys[to_key].keyframe_insert("value", frame=f_start)
            keys[to_key].value = 1.0
            keys[to_key].keyframe_insert("value", frame=f_end)
        if from_key in keys and from_key != "Basis":
            keys[from_key].value = 0.0
            keys[from_key].keyframe_insert("value", frame=f_end)


def main():
    sc = bpy.context.scene
    setup_render(sc)
    setup_world(sc)
    cam = add_camera(sc)
    add_lights()
    keyframe_camera_orbit(cam, N_FRAMES, CAM_DIST, CAM_ELEV)
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj:
        keyframe_shape_keys(obj, N_FRAMES)
    bpy.ops.render.render(animation=True)


main()
