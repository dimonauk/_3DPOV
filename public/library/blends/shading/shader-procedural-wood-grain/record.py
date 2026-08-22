"""
record.py — Viewport animation for wood_grain
===============================================
Blender 5.1  ·  Run AFTER blueprint.py (same Blender session)

The defining quality of this shader is the ANISOTROPIC HIGHLIGHT: a bright
band that sweeps across the plank surface in a direction parallel to the
grain, shifting position as the viewing angle changes.  This is the same
optical effect you see when you tilt a piece of timber under a single lamp —
a stripe of light moves across it.

This recording captures that effect in two phases:
  Phase 1 (frames 1–60):  Camera orbits from front-side view around to a
    near-grazing angle — the anisotropic band slowly sweeps to the edge and
    brightens because the Fresnel component peaks at shallow incidence.
  Phase 2 (frames 60–120):  Camera orbits back toward top-down — the band
    returns to the centre and softens, showing the grain pattern clearly.

A slow pan also reveals the face-grain (long face), edge-grain (narrow face),
and end-grain (cut end) views, so viewers can compare how the same shader
reads differently on each cross-section.

120 frames, 30 fps = 4 seconds.

Output: public/library/videos/shading/shader-procedural-wood-grain/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── PATHS ─────────────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-procedural-wood-grain"
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
plank = bpy.data.objects.get("wood_grain")
if plank is None:
    raise RuntimeError("Run blueprint.py first — 'wood_grain' object not found.")

cam = bpy.data.objects.get("Camera")
if cam is None:
    raise RuntimeError("Camera not found — run blueprint.py first.")

# ── CAMERA ORBIT ─────────────────────────────────────────────────────────────
RADIUS = 2.8  # metres from plank centre

def _cam_at(frame, elev_deg, azim_deg):
    """Place and keyframe camera at spherical coords (elev, azim) around origin."""
    el = math.radians(elev_deg)
    az = math.radians(azim_deg)
    cam.location = (
        RADIUS * math.cos(el) * math.sin(az),
        -RADIUS * math.cos(el) * math.cos(az),
        RADIUS * math.sin(el),
    )
    # Point-at-origin rotation: pitch = 90°-elevation, yaw = azimuth offset
    cam.rotation_euler = (
        math.radians(90) - el,
        0.0,
        math.radians(azim_deg - 180),
    )
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)

# Phase 1: side-to-grazing orbit — anisotropic band sweeps to edge
_cam_at(1,   28.0, 200)   # starting position: slight overhead, side view
_cam_at(30,  10.0, 185)   # low elevation: near-grazing highlight band peaks
_cam_at(60,  8.0,  165)   # very low, rotated slightly — band near far edge

# Phase 2: rise back, swing around to end-grain view
_cam_at(80,  22.0, 150)   # rising from grazing; end-grain coming into view
_cam_at(100, 35.0, 120)   # face-grain + end-grain composition
_cam_at(120, 28.0, 200)   # return to start (seamless loop if needed)

# Use BEZIER interpolation for smooth easing through all poses
for fcurve in cam.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'BEZIER'

# ── KEY LIGHT: sweep slightly to track anisotropic highlight ─────────────────
key = next((o for o in bpy.data.objects if o.type == 'LIGHT' and o.name == 'Key'), None)
if key:
    # Slight sweep so the bright band appears to travel along the grain
    key.location = (1.2, -1.8, 2.4)
    key.keyframe_insert(data_path="location", frame=1)
    key.location = (0.4, -2.0, 2.0)
    key.keyframe_insert(data_path="location", frame=60)
    key.location = (1.2, -1.8, 2.4)
    key.keyframe_insert(data_path="location", frame=120)
    for fc in key.animation_data.action.fcurves:
        for kfp in fc.keyframe_points:
            kfp.interpolation = 'BEZIER'

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[wood_grain record] → {MP4_OUT}")
