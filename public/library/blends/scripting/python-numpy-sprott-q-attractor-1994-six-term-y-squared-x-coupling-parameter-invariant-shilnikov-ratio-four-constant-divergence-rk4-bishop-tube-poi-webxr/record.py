"""
record.py — Viewport animation for Sprott Q Attractor
======================================================
5-second orbital render, morphing through shape keys,
output to public/library/videos/scripting/<slug>/viewport.mp4.
Run AFTER blueprint.py in the Blender Scripting workspace.
"""

import bpy
import math

FPS        = 30
DURATION_S = 5
N_FRAMES   = FPS * DURATION_S   # 150

SLUG = (
    "python-numpy-sprott-q-attractor-1994-six-term-y-squared-"
    "x-coupling-parameter-invariant-shilnikov-ratio-four-"
    "constant-divergence-rk4-bishop-tube-poi-webxr"
)
OUTPUT_PATH = f"//public/library/videos/scripting/{SLUG}/viewport"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = OUTPUT_PATH

# ── Camera ─────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

pivot = bpy.data.objects.new("CamPivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0, 0, 0)

cam_obj.parent = pivot
cam_obj.location = (0, -16, 5)   # slightly further — Q orbit is wider than S
track = cam_obj.constraints.new("TRACK_TO")
track.target       = pivot
track.track_axis   = "TRACK_NEGATIVE_Z"
track.up_axis      = "UP_Y"

# Orbit 90° over 150 frames
for frame, angle in [(1, 0.0), (N_FRAMES, 90.0)]:
    pivot.rotation_euler.z = math.radians(angle)
    pivot.keyframe_insert("rotation_euler", index=2, frame=frame)

# ── Lighting ───────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun", "SUN")
sun_data.energy = 4.0
sun_obj = bpy.data.objects.new("RecordSun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(50), 0, math.radians(-40))

fill_data = bpy.data.lights.new("RecordFill", "AREA")
fill_data.energy = 1.5
fill_obj = bpy.data.objects.new("RecordFill", fill_data)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location = (8, 5, 6)

# ── Shape-key morph ────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_sprott_q_poi")
if obj and obj.data.shape_keys:
    sks = obj.data.shape_keys.key_blocks
    for sk in sks:
        sk.value = 0.0
        sk.keyframe_insert("value", frame=1)

    morph_schedule = [
        ("SK_LowA",      30,  50,  65,  80),   # wider orbit
        ("SK_HighA",     75,  95, 110, 125),   # tighter orbit
        ("SK_NearTorus", 120, 135, 145, 150),  # near quasi-periodic
    ]
    for name, f_in, f_peak, f_out, f_end in morph_schedule:
        if name not in sks:
            continue
        sk = sks[name]
        for fr, val in [(f_in, 0.0), (f_peak, 1.0), (f_out, 1.0), (f_end, 0.0)]:
            sk.value = val
            sk.keyframe_insert("value", frame=fr)

bpy.ops.render.render(animation=True)
print(f"Rendered {N_FRAMES} frames → {OUTPUT_PATH}.mp4")
