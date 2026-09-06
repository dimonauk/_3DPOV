"""
record.py — Viewport animation render for Sprott N Attractor
=============================================================
Outputs: public/library/videos/scripting/sprott-n-attractor-1994/viewport.mp4

Run this script AFTER blueprint.py has built the scene.
In Blender: Scripting workspace → Run Script.
Or headless:  blender --background sprott_n.blend --python record.py

Duration: 8 seconds at 30 fps = 240 frames.
Animation: shape-key weight morphs Basis→SK_LowB→SK_HighB→SK_WideB→Basis,
           with a slow camera orbit showing the tube from all angles.
"""

import bpy
import math
import os

# ── output paths ───────────────────────────────────────────────────────────────
TOPIC    = "scripting"
SLUG     = "sprott-n-attractor-1994"
OUT_DIR  = os.path.join(
    os.path.dirname(bpy.data.filepath) or ".",
    "..", "..", "..", "..", "..", "videos", TOPIC, SLUG
)
os.makedirs(OUT_DIR, exist_ok=True)

OUTPUT_PATH = os.path.join(OUT_DIR, "viewport.mp4")

FPS      = 30
DURATION = 8          # seconds
N_FRAMES = FPS * DURATION   # 240

# ── render settings (Eevee Next, 720p for speed) ───────────────────────────────
scene = bpy.context.scene
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.fps           = FPS
scene.frame_start          = 1
scene.frame_end            = N_FRAMES
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath      = OUTPUT_PATH

# ── locate the attractor object ────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_sprott_n_poi")
if obj is None:
    raise RuntimeError("hf_sprott_n_poi not found — run blueprint.py first")

# ── camera setup: elevated arc orbit ──────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# One full orbit over 8 s; camera 1.8 m out, 30° elevation
CAM_R   = 1.8
CAM_Z   = 0.6
for f in range(1, N_FRAMES + 1):
    t     = (f - 1) / (N_FRAMES - 1)
    angle = t * 2 * math.pi
    cam_obj.location = (
        CAM_R * math.cos(angle),
        CAM_R * math.sin(angle),
        CAM_Z
    )
    # always point at origin
    dx = -cam_obj.location[0]
    dy = -cam_obj.location[1]
    dz = -cam_obj.location[2]
    yaw   = math.atan2(dy, dx)
    pitch = math.atan2(dz, math.sqrt(dx*dx + dy*dy))
    cam_obj.rotation_euler = (math.pi/2 - pitch, 0, yaw + math.pi/2)
    cam_obj.keyframe_insert("location",        frame=f)
    cam_obj.keyframe_insert("rotation_euler",  frame=f)

# ── shape-key animation: Basis → SK_LowB → SK_HighB → SK_WideB → Basis ────────
if obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks
    sk_names = ["Basis", "SK_LowB", "SK_HighB", "SK_WideB", "Basis"]
    checkpoints = [1, 60, 120, 180, N_FRAMES]

    # zero all weights
    for key in kb:
        key.value = 0.0

    for frame_n, sk_name in zip(checkpoints, sk_names):
        for key in kb:
            key.value = 1.0 if key.name == sk_name else 0.0
            key.keyframe_insert("value", frame=frame_n)

# ── world background ──────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.01, 0.01, 0.02, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
scene.world = world

# ── render ─────────────────────────────────────────────────────────────────────
print(f"[SprottN record] Rendering {N_FRAMES} frames → {OUTPUT_PATH}")
bpy.ops.render.render(animation=True)
print("[SprottN record] Done.")
