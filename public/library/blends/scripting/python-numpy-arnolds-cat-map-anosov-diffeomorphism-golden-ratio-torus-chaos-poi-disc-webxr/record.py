"""
record.py — viewport animation for Arnold's Cat Map poi disc (Blender 5.1)
=========================================================================
Renders a 10-second viewport animation showing the scramble landscape
morphing through K=1→2→3→5→8 steps, then returning to flat.

Run:  blender --background hf_arnold_cat.blend --python record.py
Output: ../../videos/scripting/
        python-numpy-arnolds-cat-map.../viewport.mp4  (1920×1080, 30 fps)
"""

import bpy
import os
import math

# ─────────────── output path ─────────────────────────────────────────────────
SLUG     = "hf_arnold_cat"
OUT_DIR  = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "videos", "scripting",
    "python-numpy-arnolds-cat-map-anosov-diffeomorphism-golden-ratio-torus-chaos-poi-disc-webxr",
)
os.makedirs(OUT_DIR, exist_ok=True)
OUT_FILE = os.path.join(OUT_DIR, "viewport.mp4")

# ─────────────── scene ───────────────────────────────────────────────────────
scene        = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 300        # 10 s at 30 fps
scene.render.fps  = 30

# EEVEE Next — fast path, good for vertex colours
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom             = True
scene.eevee.bloom_threshold       = 0.35
scene.eevee.bloom_intensity       = 0.55
scene.eevee.use_gtao              = True

# output
scene.render.image_settings.file_format      = "FFMPEG"
scene.render.ffmpeg.format                   = "MPEG4"
scene.render.ffmpeg.codec                    = "H264"
scene.render.ffmpeg.constant_rate_factor     = "MEDIUM"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUT_FILE

# ─────────────── camera ──────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Top-front 3/4 view looking down at the disc
cam_obj.location = (0.0, -1.4, 1.1)
cam_obj.rotation_euler = (math.radians(52), 0.0, 0.0)

# ─────────────── find shape keys ─────────────────────────────────────────────
obj = bpy.data.objects.get(f"{SLUG}")
if obj is None or obj.data.shape_keys is None:
    raise RuntimeError("Run blueprint.py first to build the mesh.")

sk = obj.data.shape_keys.key_blocks

# zero all shape keys at start
for kb in sk:
    kb.value = 0.0
    kb.keyframe_insert("value", frame=1)

# ─────────────── shape-key animation ─────────────────────────────────────────
# Sequence: flat → SK_Step1 → SK_Step2 → SK_Step3 → SK_Step5 → SK_Step8 → flat
KEYFRAMES = [
    (1,   None,        0.0),   # all flat
    (30,  "SK_Step1",  1.0),
    (60,  "SK_Step1",  0.0),
    (70,  "SK_Step2",  1.0),
    (100, "SK_Step2",  0.0),
    (110, "SK_Step3",  1.0),
    (160, "SK_Step3",  0.0),
    (170, "SK_Step5",  1.0),
    (210, "SK_Step5",  0.0),
    (220, "SK_Step8",  1.0),
    (260, "SK_Step8",  0.0),
    (300, None,        0.0),   # all flat — full orbit
]

for frame, key_name, value in KEYFRAMES:
    if key_name and key_name in sk:
        sk[key_name].value = value
        sk[key_name].keyframe_insert("value", frame=frame)

# ─────────────── slow turntable rotation ─────────────────────────────────────
# Rotate the disc object 180° over the full clip (half orbit)
obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0.0, 0.0, math.pi)
obj.keyframe_insert("rotation_euler", frame=300)

# smooth interpolation
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ─────────────── lights ──────────────────────────────────────────────────────
light_data = bpy.data.lights.new("KeyLight", type="SUN")
light_data.energy = 3.5
light_data.color  = (1.0, 0.97, 0.90)
light_obj  = bpy.data.objects.new("KeyLight", light_data)
bpy.context.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(55), math.radians(-30), math.radians(20))

# ─────────────── render ───────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] → {OUT_FILE}")
