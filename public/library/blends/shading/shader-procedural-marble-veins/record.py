"""
record.py — Viewport animation for marble_slab
================================================
Blender 5.1  ·  Run AFTER blueprint.py (same Blender session or fresh open of marble.blend)

The defining quality of polished marble is the CLEARCOAT SHEEN: a bright,
tight specular highlight from the Coat layer that moves across the surface as
the camera orbits, distinct from the broader diffuse Subsurface glow underneath.
A second important quality is how the vein pattern reads differently at low
grazing angles (veins appear darker against the bright coat highlight) versus
overhead (veins read as flat line pattern).

This recording captures both qualities in three phases:

  Phase 1 (frames 1–50):  Camera orbits from overhead down to a near-side view.
    The coat specular peak appears and sweeps across the tile as the camera
    approaches the Brewster angle for calcite IOR 1.486 (~56°).
  Phase 2 (frames 50–100): Camera swings laterally around the tile while
    maintaining the side angle, showing how veins flow across the full face
    and the specular highlight tracks with the camera.
  Phase 3 (frames 100–150): Camera rises back toward overhead while the Key
    light slowly dims — reveals the SSS amber glow at the slab edges as the
    direct specular disappears, showing the subsurface translucency.

150 frames, 30 fps = 5 seconds.

Output: public/library/videos/shading/shader-procedural-marble-veins/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── PATHS ─────────────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-procedural-marble-veins"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
MP4_OUT = VIDEO_DIR / "viewport.mp4"

# ── RENDER SETUP ──────────────────────────────────────────────────────────────
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

# ── OBJECTS ───────────────────────────────────────────────────────────────────
slab = bpy.data.objects.get("marble_slab")
if slab is None:
    raise RuntimeError("Run blueprint.py first — 'marble_slab' object not found.")

cam = bpy.data.objects.get("Camera")
if cam is None:
    raise RuntimeError("Camera not found — run blueprint.py first.")

key = bpy.data.objects.get("Key")

# ── CAMERA ORBIT HELPER ───────────────────────────────────────────────────────
RADIUS = 1.6   # metres from slab centre


def _cam_at(frame: int, elev_deg: float, azim_deg: float):
    """Place and keyframe camera at spherical coords around origin."""
    el = math.radians(elev_deg)
    az = math.radians(azim_deg)
    cam.location = (
        RADIUS * math.cos(el) * math.sin(az),
        -RADIUS * math.cos(el) * math.cos(az),
        RADIUS * math.sin(el),
    )
    cam.rotation_euler = (
        math.radians(90) - el,
        0.0,
        math.radians(azim_deg),
    )
    cam.keyframe_insert(data_path="location",       frame=frame)
    cam.keyframe_insert(data_path="rotation_euler", frame=frame)


# Phase 1: overhead → side — coat specular peak appears
_cam_at(1,   65, 200)   # overhead-ish starting view
_cam_at(50,  20, 200)   # near-grazing: Coat layer specular is brightest here

# Phase 2: lateral sweep — follow veins across the face
_cam_at(75,  20, 230)   # swing laterally
_cam_at(100, 20, 160)   # swing to opposite side

# Phase 3: rise back — reveal SSS edge glow
_cam_at(125, 40, 160)
_cam_at(150, 65, 200)   # return to start angle for seamless loop

# Smooth BEZIER easing through all camera poses
for fcurve in cam.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'BEZIER'

# ── KEY LIGHT ANIMATION ───────────────────────────────────────────────────────
# Dim the key light in Phase 3 to let SSS glow at slab edges become visible
if key:
    key.data.energy = 500
    key.data.keyframe_insert(data_path="energy", frame=1)
    key.data.energy = 500
    key.data.keyframe_insert(data_path="energy", frame=100)
    key.data.energy = 80   # dim significantly — SSS glow at edges becomes visible
    key.data.keyframe_insert(data_path="energy", frame=150)
    for fc in key.data.animation_data.action.fcurves:
        for kfp in fc.keyframe_points:
            kfp.interpolation = 'BEZIER'

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[marble record] → {MP4_OUT}")
