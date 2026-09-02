"""
record.py — Shimizu–Morioka Attractor viewport render
======================================================
Produces public/library/videos/scripting/
  python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr/
    viewport.mp4

Run AFTER blueprint.py has been executed (the mesh object must exist):
  blender --background hf_shimizu_morioka_poi.blend --python record.py

Duration  : 240 frames at 24 fps = 10 seconds
Camera    : orbits 300° around the poi head at elevation 28°
Shape keys: cycles Basis → SK_LowA → Basis → SK_HiA → Basis
Shading   : Workbench, flat vertex colour (no lighting dependency)
Output    : viewport.mp4 via FFmpeg H.264 high-quality preset
"""

import bpy
import math
import os

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(
    _THIS_DIR, "..", "..", "..", "..", "videos", "scripting",
    "python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
TOTAL_FRAMES = 240   # 10 s at 24 fps
CAM_DIST     = 0.52  # metres — poi head sits in a ~0.18m radius sphere
CAM_ELEV_DEG = 28.0  # elevation angle above the equator
ORBIT_DEG    = 300.0 # total orbit sweep (not a full 360 so motion is legible)

scene = bpy.context.scene
scene.render.engine            = "BLENDER_WORKBENCH"
scene.render.fps               = 24
scene.frame_start              = 1
scene.frame_end                = TOTAL_FRAMES
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format     = "MPEG4"
scene.render.ffmpeg.codec      = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath          = os.path.join(OUTPUT_DIR, "viewport.mp4")

# Workbench: flat vertex colour, no lighting interference
scene.display.shading.light      = "FLAT"
scene.display.shading.color_type = "VERTEX"
scene.display.shading.show_backface_culling = False

# ── OBJECT ────────────────────────────────────────────────────────────────────
ob = bpy.data.objects.get("hf_shimizu_morioka_poi")
if ob is None:
    raise RuntimeError("hf_shimizu_morioka_poi not found — run blueprint.py first")

sk_blocks = ob.data.shape_keys.key_blocks

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens      = 85        # telephoto compresses depth — cleaner poi read
cam_data.clip_end  = 100.0
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

elev_rad = math.radians(CAM_ELEV_DEG)

# ── ANIMATION ─────────────────────────────────────────────────────────────────

def set_camera(frame):
    """Orbit camera around the poi head."""
    t      = (frame - 1) / (TOTAL_FRAMES - 1)
    angle  = math.radians(ORBIT_DEG * t)
    cam_ob.location.x = CAM_DIST * math.cos(angle) * math.cos(elev_rad)
    cam_ob.location.y = CAM_DIST * math.sin(angle) * math.cos(elev_rad)
    cam_ob.location.z = CAM_DIST * math.sin(elev_rad)

    # always look at origin (where the poi sits)
    direction = -cam_ob.location.normalized()
    rot_q = direction.to_track_quat('-Z', 'Y')
    cam_ob.rotation_euler = rot_q.to_euler()
    cam_ob.keyframe_insert(data_path="location",       frame=frame)
    cam_ob.keyframe_insert(data_path="rotation_euler", frame=frame)


def set_shape_key(frame, key_name, value):
    """Insert shape key keyframe."""
    for block in sk_blocks:
        block.value = 0.0
    if key_name in sk_blocks:
        sk_blocks[key_name].value = value
    for block in sk_blocks:
        block.keyframe_insert(data_path="value", frame=frame)


# Camera keyframes (every 10 frames is sufficient for smooth orbit)
for f in range(1, TOTAL_FRAMES + 1, 10):
    set_camera(f)

# Shape key keyframes: Basis(1) → SK_LowA(60) → Basis(120) → SK_HiA(180) → Basis(240)
key_schedule = [
    (1,   "Basis",   1.0),
    (55,  "Basis",   1.0),
    (60,  "SK_LowA", 1.0),
    (115, "SK_LowA", 1.0),
    (120, "Basis",   1.0),
    (175, "Basis",   1.0),
    (180, "SK_HiA",  1.0),
    (235, "SK_HiA",  1.0),
    (240, "Basis",   1.0),
]
for (frame, key_name, val) in key_schedule:
    set_shape_key(frame, key_name, val)

# Set interpolation to ease-in/out for smooth key transitions
for block in sk_blocks:
    if block.id_data and hasattr(block.id_data, "animation_data"):
        anim = block.id_data.animation_data
        if anim and anim.action:
            for fc in anim.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"

bpy.ops.render.render(animation=True)
print(f"[record.py] Rendered {TOTAL_FRAMES} frames to {OUTPUT_DIR}/viewport.mp4")
