"""
record.py — Viewport animation render for Zaslavsky Stochastic Web
Blender 5.1  |  Run AFTER blueprint.py has built the scene.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4

Sequence (150 frames at 30 fps = 5 seconds):
  0–29   : overhead still of q=4 (basis, square web)
  30–74  : shape-key morph Basis → SK_Q3 (triangular corridors emerge)
  75–104 : hold SK_Q3
  105–149: shape-key morph SK_Q3 → SK_Q5 (quasi-crystal — aperiodic web
           strands displace, five-fold arms become visible)
Camera orbits 30° around z between frames 0 and 149 to show 3-D relief.
"""

import bpy
import os

SLUG = (
    "python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold"
    "-quasicrystal-stage-floor-webxr"
)

OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "videos", "scripting", SLUG,
)
os.makedirs(OUT_DIR, exist_ok=True)

scn   = bpy.context.scene
ob    = bpy.data.objects["Zaslavsky_Web"]
sk    = ob.data.shape_keys.key_blocks
cam   = bpy.data.objects["Cam"]

scn.render.resolution_x   = 1920
scn.render.resolution_y   = 1080
scn.render.fps             = 30
scn.render.image_settings.file_format  = 'FFMPEG'
scn.render.ffmpeg.format               = 'MPEG4'
scn.render.ffmpeg.codec                = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath        = os.path.join(OUT_DIR, "viewport.mp4")
scn.frame_start            = 1
scn.frame_end              = 150
scn.render.engine          = 'BLENDER_EEVEE_NEXT'


def clear_keys(frame_range):
    for f in frame_range:
        scn.frame_set(f)
        for block in sk:
            block.keyframe_delete("value", frame=f)


def key(frame, **kwargs):
    scn.frame_set(frame)
    for name, val in kwargs.items():
        sk[name].value = val
        sk[name].keyframe_insert("value", frame=frame)
    # camera slow 30° orbit
    angle = (frame / 150) * 0.524   # 0.524 rad ≈ 30°
    import math
    cam.location.x = 7.5 * math.sin(angle)
    cam.location.y = -7.5 * math.cos(angle)
    cam.location.z = 8.0
    cam.rotation_euler = (0.35, 0, angle)
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


# Zero out all shape keys at frame 1
for block in sk:
    block.value = 0.0
sk["Basis"].value = 1.0

# Keyframe sequence
key(1,   Basis=1.0, SK_Q3=0.0, SK_Q6=0.0, SK_Q5=0.0)
key(30,  Basis=1.0, SK_Q3=0.0, SK_Q6=0.0, SK_Q5=0.0)
key(74,  Basis=0.0, SK_Q3=1.0, SK_Q6=0.0, SK_Q5=0.0)
key(104, Basis=0.0, SK_Q3=1.0, SK_Q6=0.0, SK_Q5=0.0)
key(149, Basis=0.0, SK_Q3=0.0, SK_Q6=0.0, SK_Q5=1.0)

bpy.ops.render.render(animation=True)
print("Render complete →", scn.render.filepath)
