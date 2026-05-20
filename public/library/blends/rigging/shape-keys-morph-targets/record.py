"""
record.py — Viewport animation for shape-keys-morph-targets
public/library/blends/rigging/shape-keys-morph-targets/record.py

Cycles through each of the five expression shape keys (blink_L, blink_R,
happy, angry, aa), animating each from 0 → 1 → 0 in sequence.  The
resulting 10-second clip shows all five expressions in the order a VRM
runtime might trigger them.

Run AFTER blueprint.py (or with the saved .blend loaded):
    blender --background face_vrm.blend --python record.py

Output:
    ../../videos/rigging/shape-keys-morph-targets/viewport.mp4
"""

import bpy
from pathlib import Path

OUT_MP4 = (
    Path(__file__).parent.parent.parent.parent
    / "videos" / "rigging" / "shape-keys-morph-targets" / "viewport.mp4"
)
OUT_MP4.parent.mkdir(parents=True, exist_ok=True)

# ── Timing constants ──────────────────────────────────────────────────────────
FPS            = 30
HOLD_FRAMES    = 10   # frames at peak value (expression fully active)
TRANSITION     = 8    # frames to ease in and ease out

# Expressions in order: name matches the shape key added by blueprint.py
EXPRESSIONS = [
    "Fcl_EYE_Close_L",
    "Fcl_EYE_Close_R",
    "Fcl_ALL_Joy",
    "Fcl_ALL_Angry",
    "Fcl_MTH_A",
]

SCENE = bpy.context.scene
SCENE.render.fps = FPS
SCENE.render.image_settings.file_format = "FFMPEG"
SCENE.render.ffmpeg.format             = "MPEG4"
SCENE.render.ffmpeg.codec              = "H264"
SCENE.render.ffmpeg.constant_rate_factor = "HIGH"
SCENE.render.filepath = str(OUT_MP4)

# ── Find the face object and its shape key action ─────────────────────────────
face_obj = bpy.data.objects.get("face_vrm")
if face_obj is None:
    raise RuntimeError("face_vrm object not found — run blueprint.py first")

keys = face_obj.data.shape_keys
if keys is None:
    raise RuntimeError("No shape keys on face_vrm — run blueprint.py first")

# Ensure all keys start at 0 and are keyframed at frame 1
for kb in keys.key_blocks:
    kb.value = 0.0

# ── Build the animation ───────────────────────────────────────────────────────
frame = 1
# Brief hold at neutral before first expression
neutral_hold = FPS  # 1 second of rest pose
SCENE.frame_set(frame)
for kb in keys.key_blocks[1:]:   # skip Basis
    kb.value = 0.0
    kb.keyframe_insert("value", frame=frame)
frame += neutral_hold

for expr_name in EXPRESSIONS:
    kb = keys.key_blocks.get(expr_name)
    if kb is None:
        print(f"[record] warning: shape key '{expr_name}' not found, skipping")
        continue

    # Ease in to peak
    peak_start = frame + TRANSITION
    SCENE.frame_set(frame)
    kb.value = 0.0
    kb.keyframe_insert("value", frame=frame)

    SCENE.frame_set(peak_start)
    kb.value = 1.0
    kb.keyframe_insert("value", frame=peak_start)

    # Hold at peak
    peak_end = peak_start + HOLD_FRAMES
    kb.keyframe_insert("value", frame=peak_end)

    # Ease out back to 0
    out_end = peak_end + TRANSITION
    SCENE.frame_set(out_end)
    kb.value = 0.0
    kb.keyframe_insert("value", frame=out_end)

    # Brief inter-expression gap
    frame = out_end + 6

SCENE.frame_start = 1
SCENE.frame_end   = frame

# ── Camera — framed on the face, orthographic front ──────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 2.0
cam_obj = bpy.data.objects.new("record_cam", cam_data)
cam_obj.location = (0, -3.5, 0)
cam_obj.rotation_euler = (1.5708, 0, 0)   # 90° around X → looking toward +Y
bpy.context.collection.objects.link(cam_obj)
SCENE.camera = cam_obj

# ── Render resolution ─────────────────────────────────────────────────────────
SCENE.render.resolution_x = 1280
SCENE.render.resolution_y = 720
SCENE.render.engine        = "BLENDER_EEVEE_NEXT"

bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 → {OUT_MP4}")
