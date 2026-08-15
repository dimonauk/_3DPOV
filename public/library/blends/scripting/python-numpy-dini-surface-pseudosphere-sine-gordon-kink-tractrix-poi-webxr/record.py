# ===========================================================================
# record.py — Viewport render for Dini's Surface poi head
# Run AFTER blueprint.py.  Outputs viewport.mp4 (90 frames, 30 fps, 3 s).
#
# Animation: shape key morphs from Basis (pseudosphere, b=0) through
# SK_Moderate (b=0.65) to SK_Drill (b=2.40) and back, while the camera
# orbits 270° around the object.  This reveals the kink soliton riding
# along the helical surface as it tightens.
# ===========================================================================

import math
import bpy

# ── Constants ────────────────────────────────────────────────────────────────
FRAMES      = 90
FPS         = 30
OUTPUT_PATH = "//../../videos/scripting/python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr/viewport"

# ── Find the object ───────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_dini_poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create hf_dini_poi.")

sk = obj.data.shape_keys
if sk is None:
    raise RuntimeError("Shape keys missing — re-run blueprint.py.")

# ── Clear existing keyframes ─────────────────────────────────────────────────
for key in sk.key_blocks:
    key.value = 0.0
    if key.name != "Basis":
        key.keyframe_insert("value", frame=1)
        key.keyframe_insert("value", frame=FRAMES)

# ── Shape key animation ───────────────────────────────────────────────────────
# Morph sequence (frame → {sk_name: value}):
#   1:  Basis (pseudosphere)
#  15:  Gentle (b=0.30)  rises
#  30:  Moderate (b=0.65) peak
#  50:  Tight (b=1.25) peak
#  70:  Drill (b=2.40) peak
#  85:  back to Moderate
#  90:  back to Basis

def set_sk_frame(frame: int, values: dict) -> None:
    """Set shape key values at a keyframe."""
    bpy.context.scene.frame_set(frame)
    for name, val in values.items():
        key = sk.key_blocks.get(name)
        if key:
            key.value = val
            key.keyframe_insert("value", frame=frame)

zero = {n: 0.0 for n in ["SK_Gentle", "SK_Moderate", "SK_Tight", "SK_Drill"]}

set_sk_frame(1,  {**zero})
set_sk_frame(15, {**zero, "SK_Gentle":   1.0})
set_sk_frame(30, {**zero, "SK_Moderate": 1.0})
set_sk_frame(50, {**zero, "SK_Tight":    1.0})
set_sk_frame(70, {**zero, "SK_Drill":    1.0})
set_sk_frame(85, {**zero, "SK_Moderate": 1.0})
set_sk_frame(90, {**zero})

# ── Camera orbit ─────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

RADIUS   = 0.38    # metres — close enough to show kink colour detail
ELEVATION = 0.06   # slight upward offset

for frame in range(1, FRAMES + 1):
    t     = (frame - 1) / (FRAMES - 1)        # 0 → 1
    angle = math.radians(270.0 * t - 135.0)   # orbit −135° → +135°
    cam_obj.location = (
        RADIUS * math.cos(angle),
        RADIUS * math.sin(angle),
        ELEVATION,
    )
    # Always look at world origin (object centre after finalise)
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz),   # tilt
        0.0,
        math.atan2(dy, dx) + math.pi,                 # pan
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.resolution_percentage = 100
scene.render.filepath        = OUTPUT_PATH

# Workbench for fast renders — shows vertex colours without full PBR
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type       = "VERTEX"
scene.display.shading.light            = "STUDIO"
scene.display.shading.show_backface_culling = False

bpy.ops.render.render(animation=True)
print("✓ viewport.mp4 rendered →", OUTPUT_PATH)
