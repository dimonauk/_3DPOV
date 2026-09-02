"""
record.py — Hopf Fibration viewport animation recorder
=======================================================
Run this in Blender 5.1 AFTER blueprint.py has created hf_hopf_poi.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4
Duration: 8 seconds · 240 frames at 30 fps
Animation: slow rotation on Z axis, shape-key cycle Basis→SK_2Lat→Basis
"""

import bpy
import os

SLUG = "python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
OUT  = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "..",
    "public", "library", "videos", "scripting", SLUG, "viewport.mp4"
)
FPS       = 30
N_FRAMES  = 240    # 8 seconds — shows a full rotation
OBJ_NAME  = "hf_hopf_poi"

def setup_scene():
    scn = bpy.context.scene
    scn.frame_start, scn.frame_end = 1, N_FRAMES
    scn.render.fps = FPS
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format   = 'MPEG4'
    scn.render.ffmpeg.codec    = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'HIGH'
    scn.render.resolution_x, scn.render.resolution_y = 1920, 1080
    scn.render.filepath = OUT
    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)


def setup_camera():
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = (0, -7, 2.5)
    cam.rotation_euler = (1.22, 0, 0)   # ~70° tilt


def setup_light():
    # Three-point rig: key (warm), fill (cool), rim
    for name, loc, energy, col in [
        ("Key",  ( 4, -3, 5), 1200, (1.0, 0.92, 0.80)),
        ("Fill", (-3,  2, 2),  400, (0.70, 0.80, 1.0)),
        ("Rim",  ( 0,  4, 4),  600, (1.0, 1.0, 1.0)),
    ]:
        ld = bpy.data.lights.new(name, 'POINT')
        ld.energy = energy;  ld.color = col
        lo = bpy.data.objects.new(name, ld)
        bpy.context.scene.collection.objects.link(lo)
        lo.location = loc


def keyframe_rotation(obj):
    """Full 360° rotation over N_FRAMES on the Z axis."""
    import math
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.tau)
    obj.keyframe_insert("rotation_euler", frame=N_FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def keyframe_shape_keys(obj):
    """Cycle: Basis → SK_2Lat (peak at frame 80) → SK_Equat (peak 160) → Basis."""
    sks = obj.data.shape_keys.key_blocks
    sk_names = ["SK_CapN", "SK_Equat", "SK_2Lat"]
    for sk in sks:
        sk.value = 0.0
    sks["Basis"].value = 1.0
    # Animate shape key values with smooth ramps
    for i, name in enumerate(sk_names):
        peak = 60 + i * 60
        sks[name].value = 0.0;  sks[name].keyframe_insert("value", frame=1)
        sks[name].value = 1.0;  sks[name].keyframe_insert("value", frame=peak)
        sks[name].value = 0.0;  sks[name].keyframe_insert("value", frame=peak+60)


def main():
    setup_scene()
    setup_camera()
    setup_light()
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print(f"[record] '{OBJ_NAME}' not found — run blueprint.py first")
        return
    keyframe_rotation(obj)
    if obj.data.shape_keys:
        keyframe_shape_keys(obj)
    bpy.ops.render.render(animation=True)
    print(f"[record] Done → {OUT}")


main()
