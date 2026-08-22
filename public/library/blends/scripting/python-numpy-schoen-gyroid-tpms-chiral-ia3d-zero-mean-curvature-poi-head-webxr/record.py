# SPDX-License-Identifier: CC0-1.0
"""
Gyroid TPMS — viewport recording script
========================================
Run this AFTER blueprint.py has been executed (the gyroid mesh + shape keys
must already exist in the scene).

Output: public/library/videos/scripting/
  python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr/
  viewport.mp4

Animation (90 frames @ 30 fps = 3 seconds):
  Frames  1–30 : orbit 0° → 120° around Z while SK_LevelP4 ramps 0 → 1
  Frames 31–60 : orbit 120° → 240°, SK_LevelP4 returns to 0, SK_LevelN4 ramps 0 → 1
  Frames 61–90 : orbit 240° → 360°, SK_LevelN4 returns to 0 (back to Basis)

The camera orbits at elevation 25° so both the top channel network
and the lateral chiral channels are visible.
"""

import bpy, math
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
HERE  = Path(__file__).parent
SLUG  = "python-numpy-schoen-gyroid-tpms-chiral-ia3d-zero-mean-curvature-poi-head-webxr"
VID_OUT = (HERE.parents[3] / "videos" / "scripting" / SLUG / "viewport.mp4")
VID_OUT.parent.mkdir(parents=True, exist_ok=True)

# ── Scene ─────────────────────────────────────────────────────────────────────
scn  = bpy.context.scene
scn.render.fps          = 30
scn.frame_start         = 1
scn.frame_end           = 90
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080
scn.render.filepath     = str(VID_OUT)
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format              = 'MPEG4'
scn.render.ffmpeg.codec               = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# ── Camera setup ──────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0, 0, 0))
cam_ob = bpy.context.active_object
cam_ob.name = "RecordCam"
scn.camera = cam_ob

CAM_R   = 0.28      # metres — poi head is 8.2 cm radius; keep camera back
CAM_EL  = math.radians(25)

def _cam_pos(az_deg):
    az = math.radians(az_deg)
    x  = CAM_R * math.cos(CAM_EL) * math.cos(az)
    y  = CAM_R * math.cos(CAM_EL) * math.sin(az)
    z  = CAM_R * math.sin(CAM_EL)
    return x, y, z

# Track-to constraint so camera always faces origin
track = cam_ob.constraints.new(type='TRACK_TO')
track.target      = bpy.data.objects.get("hf_gyroid") or bpy.data.objects[0]
track.track_axis  = 'TRACK_NEGATIVE_Z'
track.up_axis     = 'UP_Y'

# Keyframe camera orbit (every 5 frames)
for frame in range(1, 91, 5):
    az = (frame - 1) / 89.0 * 360.0
    cam_ob.location = _cam_pos(az)
    cam_ob.keyframe_insert(data_path="location", frame=frame)

# ── Shape-key animation ───────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_gyroid")
if obj and obj.data.shape_keys:
    sk_keys  = obj.data.shape_keys.key_blocks
    sk_p4    = sk_keys.get("SK_LevelP4")
    sk_n4    = sk_keys.get("SK_LevelN4")

    def _kf(sk, val, frame):
        if sk:
            sk.value = val
            sk.keyframe_insert(data_path="value", frame=frame)

    # P4 ramps up 1–30, down 31–60; N4 ramps up 31–60, down 61–90
    _kf(sk_p4,  0.0,  1); _kf(sk_p4,  1.0, 30)
    _kf(sk_p4,  0.0, 60); _kf(sk_n4,  0.0,  1)
    _kf(sk_n4,  0.0, 30); _kf(sk_n4,  1.0, 60)
    _kf(sk_n4,  0.0, 90)

# ── Light ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(0.3, -0.3, 0.5))
sun = bpy.context.active_object
sun.data.energy = 3.5
sun.data.angle  = math.radians(5)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport recording saved → {VID_OUT}")
