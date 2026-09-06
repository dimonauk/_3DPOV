"""
record.py — Halvorsen Cyclic Attractor viewport animation
==========================================================
Run AFTER blueprint.py has built the scene.
Outputs:  public/library/videos/scripting/
            python-numpy-halvorsen-cyclic-attractor-2005-c3-quadratic-nonlinearity-constant-divergence-rk4-bishop-tube-poi-webxr/
              viewport.mp4
Duration: 10 s at 30 fps = 300 frames
Technique: slow camera orbit + shape-key sweep demonstrating C₃ trefoil arms.
"""

import bpy
import math

# ── Output path ───────────────────────────────────────────────────────────────
OUTPUT_PATH = (
    "//public/library/videos/scripting/"
    "python-numpy-halvorsen-cyclic-attractor-2005-c3-quadratic-nonlinearity-"
    "constant-divergence-rk4-bishop-tube-poi-webxr/viewport.mp4"
)

TOTAL_FRAMES = 300  # 10 s × 30 fps
FPS = 30

# Shape-key sweep schedule (frame ranges):
#   0-60:   Basis held
#   61-120: Basis → SK_LowA  (orbit opens outward)
#  121-180: SK_LowA held
#  181-240: SK_LowA → SK_HighA (orbit contracts)
#  241-300: SK_HighA → Basis (return)
SK_SCHEDULE = [
    # (frame_start, frame_end, from_key, to_key)
    (1,   60,  "Basis",    "Basis"),
    (61,  120, "Basis",    "SK_LowA"),
    (121, 180, "SK_LowA",  "SK_LowA"),
    (181, 240, "SK_LowA",  "SK_HighA"),
    (241, 300, "SK_HighA", "Basis"),
]

# ── Scene setup ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

# Render settings — EEVEE Next for speed
scene.render.engine               = "BLENDER_EEVEE_NEXT"
scene.render.fps                  = FPS
scene.render.resolution_x         = 1920
scene.render.resolution_y         = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format        = "MPEG4"
scene.render.ffmpeg.codec         = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath             = OUTPUT_PATH

# Bloom (EEVEE Next)
try:
    scene.eevee.use_bloom   = True
    scene.eevee.bloom_intensity = 0.30
    scene.eevee.bloom_radius    = 3.0
    scene.eevee.bloom_threshold = 0.50
except AttributeError:
    pass  # bloom API may differ by build

# ── Camera orbit ──────────────────────────────────────────────────────────────
cam_obj = scene.camera
if cam_obj is None:
    raise RuntimeError("No camera — run blueprint.py first.")

cam_obj.animation_data_clear()

# Orbit the camera around Z at distance ~5 m, elevation ~20°
RADIUS  = 5.0
ELEV    = math.radians(22)
NFRAMES = TOTAL_FRAMES

for fr in range(1, NFRAMES + 1):
    t   = (fr - 1) / (NFRAMES - 1)            # 0 → 1
    ang = math.radians(0) + t * math.radians(360)  # full orbit

    x = RADIUS * math.cos(ang) * math.cos(ELEV)
    y = RADIUS * math.sin(ang) * math.cos(ELEV)
    z = RADIUS * math.sin(ELEV)

    cam_obj.location = (x, y, z)
    # point camera at origin
    direction = (-x, -y, -z)
    mag = math.sqrt(sum(d*d for d in direction))
    norm = tuple(d/mag for d in direction)
    # Euler angles to look toward origin from position
    # Using look_at via rotation
    import mathutils
    q = mathutils.Vector(norm)
    # simple: always look at origin
    cam_obj.location = (x, y, z)
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(x*x+y*y), -z),   # pitch
        0.0,
        math.atan2(y, x) + math.pi/2,          # yaw + 90°
    )
    scene.frame_set(fr)
    cam_obj.keyframe_insert(data_path="location",       frame=fr)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=fr)

# ── Shape-key animation ───────────────────────────────────────────────────────
poi_obj = bpy.data.objects.get("hf_halvorsen_poi")
if poi_obj and poi_obj.data.shape_keys:
    kb = poi_obj.data.shape_keys.key_blocks
    key_names = [k.name for k in kb]

    for (f0, f1, from_k, to_k) in SK_SCHEDULE:
        if from_k not in key_names or to_k not in key_names:
            continue
        # set all keys to 0 at f0
        for k in kb:
            k.value = 0.0
            k.keyframe_insert("value", frame=f0)
        # set from_k=1 at f0, to_k=1 at f1 (if different), from_k=0 at f1
        kb[from_k].value = 1.0
        kb[from_k].keyframe_insert("value", frame=f0)
        if from_k != to_k:
            kb[from_k].value = 0.0
            kb[from_k].keyframe_insert("value", frame=f1)
            kb[to_k].value = 1.0
            kb[to_k].keyframe_insert("value", frame=f1)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"Viewport animation written to {OUTPUT_PATH}")
