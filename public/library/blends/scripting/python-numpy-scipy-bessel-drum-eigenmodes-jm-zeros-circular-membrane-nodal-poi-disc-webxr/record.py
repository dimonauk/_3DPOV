"""
record.py — Bessel Drum Eigenmodes · Viewport Animation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run AFTER blueprint.py.  Cycles through each shape key — flat →
cupped → flat — to reveal every vibrational mode's nodal geometry.
Outputs: public/library/videos/scripting/<slug>/viewport.mp4
Blender 5.1 · CC0 · Holoflow Studio
"""

import bpy
import os

# ── Parameters ─────────────────────────────────────────────────────────────
SLUG     = ("python-numpy-scipy-bessel-drum-eigenmodes-jm-zeros"
            "-circular-membrane-nodal-poi-disc-webxr")
OBJ_NAME = "Bessel_Drum_Disc"
FPS      = 24
F_HOLD   = 6     # frames flat (weight 0) at start/end of each mode
F_PEAK   = 4     # frames at full weight (weight 1)
SK_NAMES = [
    "SK_Mode_0_1",   # fundamental — dome
    "SK_Mode_1_1",   # 1 diameter
    "SK_Mode_2_1",   # 2 diameters
    "SK_Mode_0_2",   # 1 circle
    "SK_Mode_3_1",   # 3 diameters
    "SK_Mode_1_2",   # 1 diameter + 1 circle
]

# Frames per mode: ramp-up (F_HOLD) + peak (F_PEAK) + ramp-down (F_HOLD)
F_PER_MODE = F_HOLD + F_PEAK + F_HOLD        # = 16 frames ≈ 0.67 s each
TOTAL_F    = len(SK_NAMES) * F_PER_MODE      # 96 frames ≈ 4 s

# ── Scene ───────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end   = TOTAL_F

output_dir = f"//../../videos/scripting/{SLUG}/"
os.makedirs(bpy.path.abspath(output_dir), exist_ok=True)
scene.render.filepath = output_dir + "viewport"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec  = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# ── Camera ──────────────────────────────────────────────────────────────────
# Isometric-ish top-front view: see the cupping and the nodal pattern.
for ob in bpy.context.scene.objects:
    if ob.type == "CAMERA":
        bpy.data.objects.remove(ob, do_unlink=True)

bpy.ops.object.camera_add(location=(0.0, -1.05, 0.70))
cam = bpy.context.active_object
cam.rotation_euler = (1.05, 0.0, 0.0)   # ~60° tilt
scene.camera = cam

# ── Lighting ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(2.0, -1.0, 4.0))
sun = bpy.context.active_object
sun.data.energy = 4.0

# ── Animate shape keys ──────────────────────────────────────────────────────
obj = bpy.data.objects.get(OBJ_NAME)

if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks

    # Zero-out all shape-key weights at frame 1 first
    for name in SK_NAMES:
        if name in kb:
            kb[name].value = 0.0
            kb[name].keyframe_insert("value", frame=1)

    for ki, sk_name in enumerate(SK_NAMES):
        if sk_name not in kb:
            continue
        key     = kb[sk_name]
        f_start = ki * F_PER_MODE + 1
        f_up    = f_start + F_HOLD          # reach peak
        f_down  = f_up + F_PEAK             # start falling
        f_end   = f_down + F_HOLD           # back to 0

        # This key: 0 → 1 → 0
        key.value = 0.0;  key.keyframe_insert("value", frame=f_start)
        key.value = 1.0;  key.keyframe_insert("value", frame=f_up)
        key.value = 1.0;  key.keyframe_insert("value", frame=f_down)
        key.value = 0.0;  key.keyframe_insert("value", frame=f_end)

        # All other keys: stay at 0 through this block
        for other in SK_NAMES:
            if other == sk_name or other not in kb:
                continue
            kb[other].value = 0.0
            kb[other].keyframe_insert("value", frame=f_start)
            kb[other].keyframe_insert("value", frame=f_end)

# ── Render ──────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] Done → {output_dir}viewport.mp4  ({TOTAL_F} frames @ {FPS}fps)")
