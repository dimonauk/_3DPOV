"""
record.py — Viewport animation for shader-principled-hair-bsdf-vrm
===================================================================
Blender 5.1  ·  Run AFTER blueprint.py (same session or re-open vrm_hair.blend)

The defining quality of the Principled Hair BSDF is the three-lobe model:
  – Front arc  (frames  1–50):  R lobe dominates — bright specular band on
    the cuticle surface, tilted slightly toward the roots by the Offset value.
  – Rear arc   (frames 75–100): TRT glint fires — a narrow bright rim where
    light from the back light enters, bounces off the strand's inner wall,
    and exits toward the camera.  The back light is boosted here.
  – Side arc   (frames 50–75, 100–150): TT softens — transmitted light
    gives a translucent glow to individual strands when viewed from the flank.

150 frames, 30 fps = 5 seconds.

Output: public/library/videos/shading/shader-principled-hair-bsdf-vrm/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-principled-hair-bsdf-vrm"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
MP4_OUT = VIDEO_DIR / "viewport.mp4"

# ── Scene ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.resolution_percentage       = 100
scene.render.filepath                    = str(MP4_OUT)

# ── Objects ───────────────────────────────────────────────────────────────────
cam  = bpy.data.objects.get("Camera")
back = next((o for o in bpy.data.objects if o.name == "Back"), None)
if cam is None:
    raise RuntimeError("Camera not found — run blueprint.py first.")

# ── Camera: full 360° orbit with constant elevation ──────────────────────────
RADIUS    = 0.42   # orbit radius around head
ELEVATION = 0.08   # camera height above sphere centre

def _key_cam(frame, angle_deg):
    a = math.radians(angle_deg)
    cam.location = (
        RADIUS * math.sin(a),
        -RADIUS * math.cos(a),
        ELEVATION,
    )
    # Yaw tracks the orbit; pitch held near-level for hair read
    cam.rotation_euler = (math.radians(82), 0.0, math.radians(angle_deg))
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)

_key_cam(1,    0)     # front — R lobe visible
_key_cam(38,  90)     # right flank — TT glow on backlit strands
_key_cam(75,  180)    # rear — TRT glint fires; back light faces camera
_key_cam(112, 270)    # left flank
_key_cam(150, 360)    # back to front

# Constant-velocity orbit throughout
for fcurve in cam.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'LINEAR'

# ── Back-light energy: ramp up during rear arc to amplify TRT glint ──────────
# The glint depends on light entering from behind the strand; boosting the back
# light during the rear arc makes the lobe clearly visible in the recording.
if back:
    back.data.energy = 800.0
    back.data.keyframe_insert("energy", frame=1)
    back.data.energy = 1600.0
    back.data.keyframe_insert("energy", frame=60)
    back.data.energy = 2400.0
    back.data.keyframe_insert("energy", frame=82)   # peak TRT at rear
    back.data.energy = 1600.0
    back.data.keyframe_insert("energy", frame=100)
    back.data.energy = 800.0
    back.data.keyframe_insert("energy", frame=130)

    for fcurve in back.data.animation_data.action.fcurves:
        for kfp in fcurve.keyframe_points:
            kfp.interpolation = 'BEZIER'

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[vrm_hair record] → {MP4_OUT}")
