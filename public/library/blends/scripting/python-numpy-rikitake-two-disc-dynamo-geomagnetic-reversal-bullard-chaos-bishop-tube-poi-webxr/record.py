# SPDX-License-Identifier: CC0-1.0
"""
record.py — Rikitake Two-Disc Dynamo  (Blender 5.1)
====================================================
Run AFTER blueprint.py.  Configures Eevee Next, sets up a 10-second
viewport animation, and renders to:
  public/library/videos/scripting/
    python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-bullard-chaos-bishop-tube-poi-webxr/
      viewport.mp4

Animation structure (300 frames @ 30 fps = 10 s)
-------------------------------------------------
  F  1 – 80  : 240° orbit, camera starts front (+Y), sweeps counter-clockwise
  F 80 – 160 : morph Basis → SK_HighFriction   (polarity tightens)
  F160 – 220 : morph SK_HighFriction → Basis   (restore)
  F220 – 280 : morph Basis → SK_LowFriction    (looser, longer epochs)
  F280 – 300 : return to Basis
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/scripting/" \
              "python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-" \
              "bullard-chaos-bishop-tube-poi-webxr/viewport"

FPS        = 30
N_FRAMES   = 300
CAM_DIST   = 0.26    # metres — fits 0.082 m poi-radius object with 85 mm lens
CAM_ELEV   = 0.28    # radians elevation above equator


def setup_render():
    sc = bpy.context.scene
    sc.render.engine          = "BLENDER_EEVEE_NEXT"
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = N_FRAMES
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format   = "MPEG4"
    sc.render.ffmpeg.codec    = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.filepath        = OUTPUT_PATH

    # Eevee Next bloom
    sc.eevee.use_bloom        = True
    sc.eevee.bloom_threshold  = 0.30
    sc.eevee.bloom_intensity  = 0.22
    sc.eevee.bloom_radius     = 3.0

    # Black world background
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
        bg.inputs["Strength"].default_value = 0.0


def setup_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # orbit track: empty at origin
    empty = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(empty)
    tc = cam_obj.constraints.new("TRACK_TO")
    tc.target      = empty
    tc.track_axis  = "TRACK_NEGATIVE_Z"
    tc.up_axis     = "UP_Y"
    return cam_obj


def insert_cam_keys(cam_obj):
    """Keyframe the camera orbit: 240° sweep in first 80 frames, then hold."""
    for f, angle_deg in [(1, 0), (80, 240), (N_FRAMES, 360)]:
        angle = math.radians(angle_deg)
        cam_obj.location = (
            CAM_DIST * math.sin(angle) * math.cos(CAM_ELEV),
            -CAM_DIST * math.cos(angle) * math.cos(CAM_ELEV),
            CAM_DIST * math.sin(CAM_ELEV),
        )
        bpy.context.scene.frame_set(f)
        cam_obj.keyframe_insert("location", frame=f)


def insert_shapekey_keys(obj):
    """Animate shape key values across the 300-frame sequence."""
    kb = obj.data.shape_keys.key_blocks

    def sk_key(name, frame, value):
        kb[name].value = value
        kb[name].keyframe_insert("value", frame=frame)

    # All start at Basis=1
    sk_key("Basis",          1,   1.0)
    sk_key("SK_HighFriction", 1,  0.0)
    sk_key("SK_LowFriction",  1,  0.0)

    # F80-160: morph to SK_HighFriction
    sk_key("Basis",           80,  1.0);  sk_key("Basis",          160, 0.0)
    sk_key("SK_HighFriction",  80, 0.0);  sk_key("SK_HighFriction", 160, 1.0)

    # F160-220: return to Basis
    sk_key("Basis",           220, 1.0);  sk_key("SK_HighFriction", 220, 0.0)

    # F220-280: morph to SK_LowFriction
    sk_key("Basis",           220, 1.0);  sk_key("Basis",          280, 0.0)
    sk_key("SK_LowFriction",  220, 0.0);  sk_key("SK_LowFriction", 280, 1.0)

    # F280-300: return
    sk_key("Basis",           300, 1.0);  sk_key("SK_LowFriction", 300, 0.0)


def main():
    setup_render()
    cam = setup_camera()
    insert_cam_keys(cam)

    obj = bpy.data.objects.get("rikitake_dynamo")
    if obj is None:
        print("ERROR: run blueprint.py first — rikitake_dynamo object not found.")
        return

    insert_shapekey_keys(obj)
    bpy.ops.render.render(animation=True)
    print("Render complete →", OUTPUT_PATH)


main()
