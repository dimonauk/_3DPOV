"""
record.py — Viewport animation for woven_fabric
================================================
Blender 5.1  ·  Run AFTER blueprint.py (same Blender session)

The defining quality of the Sheen lobe is its dependence on viewing angle:
sheen is dimmest when you look straight down at a surface, and brightest
when your line of sight nearly grazes it.  This recording demonstrates that
by slowly tilting the camera from a 45° overhead view down to ~18° elevation
while the key light holds position — the micro-fibre bloom visibly spreads
across the cloth as the viewing angle shallows.

120 frames, 30 fps = 4 seconds.

Output: public/library/videos/shading/shader-procedural-woven-fabric/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── PATHS ─────────────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-procedural-woven-fabric"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
MP4_OUT = VIDEO_DIR / "viewport.mp4"

# ── SCENE ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 120
scene.render.fps  = 30

scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.resolution_percentage       = 100
scene.render.filepath                    = str(MP4_OUT)

# ── OBJECTS ───────────────────────────────────────────────────────────────────
fabric = bpy.data.objects.get("woven_fabric")
if fabric is None:
    raise RuntimeError("Run blueprint.py first — 'woven_fabric' object not found.")

cam = bpy.data.objects.get("Camera")
if cam is None:
    raise RuntimeError("Camera not found — run blueprint.py first.")

# ── CAMERA: tilt from overhead down to grazing elevation ─────────────────────
# Elevation angles: 45° → 18°, then hold and return to 35° at end.
# The camera orbits a radius of 3.2 m around the fabric centre.
RADIUS = 3.2

def _cam_pose(elev_deg, azim_deg=180):
    """Return (location, rotation_euler) for given elevation + azimuth."""
    el = math.radians(elev_deg)
    az = math.radians(azim_deg)
    x = RADIUS * math.cos(el) * math.sin(az)
    y = -RADIUS * math.cos(el) * math.cos(az)
    z = RADIUS * math.sin(el)
    # Rotation: point camera at origin from (x, y, z)
    pitch = math.radians(90) - el
    return (x, y, z), (pitch, 0.0, math.radians(azim_deg - 180))

def _key_cam(frame, elev, azim=180):
    loc, rot = _cam_pose(elev, azim)
    cam.location = loc
    cam.rotation_euler = rot
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)

# Phase 1 (1→50): overhead tilt down — sheen gradually spreads
_key_cam(1,   45.0)
_key_cam(50,  18.0)
# Phase 2 (50→80): hold at low grazing angle — maximum sheen visible
_key_cam(80,  18.0)
# Phase 3 (80→120): rise back up — sheen recedes
_key_cam(120, 40.0)

# Smooth interpolation: ease-in/out on the grazing approach, linear on return
for fcurve in cam.animation_data.action.fcurves:
    for i, kfp in enumerate(fcurve.keyframe_points):
        kfp.interpolation = 'BEZIER'

# ── KEY LIGHT: slight side-swing to show colour contrast across threads ───────
key = next(
    (o for o in bpy.data.objects if o.type == 'LIGHT' and o.name == 'Key'),
    None,
)
if key:
    key.location = (3.0, -1.5, 3.5)
    key.keyframe_insert(data_path="location", frame=1)
    key.location = (2.0, -2.5, 3.5)
    key.keyframe_insert(data_path="location", frame=60)
    key.location = (3.0, -1.5, 3.5)
    key.keyframe_insert(data_path="location", frame=120)

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[woven_fabric record] → {MP4_OUT}")
