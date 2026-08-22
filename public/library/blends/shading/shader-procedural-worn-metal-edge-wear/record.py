"""
record.py — Viewport animation for worn_metal
==============================================
Blender 5.1  ·  Run AFTER blueprint.py (in the same Blender session)

Rotates the Suzanne mesh 360° over 120 frames (4 s at 30 fps) so the
EEVEE Bevel node's screen-space curvature detection visibly shifts as
the eye-socket creases and snout ridges rotate in and out of frame.
The camera remains static; a key light subtly orbits 20° to emphasise
the specular lobe movement on the clean vs worn regions.

Output: public/library/videos/shading/shader-procedural-worn-metal-edge-wear/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── PATHS ─────────────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-procedural-worn-metal-edge-wear"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
MP4_OUT = VIDEO_DIR / "viewport.mp4"

# ── SCENE SETTINGS ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 120
scene.render.fps  = 30

scene.render.image_settings.file_format     = 'FFMPEG'
scene.render.ffmpeg.format                  = 'MPEG4'
scene.render.ffmpeg.codec                   = 'H264'
scene.render.ffmpeg.constant_rate_factor    = 'MEDIUM'
scene.render.resolution_x                   = 1280
scene.render.resolution_y                   = 720
scene.render.resolution_percentage          = 100
scene.render.filepath                       = str(MP4_OUT)

# ── FIND OBJECTS ──────────────────────────────────────────────────────────────
monkey = bpy.data.objects.get("worn_metal")
if monkey is None:
    raise RuntimeError("Run blueprint.py first — 'worn_metal' object not found.")

key_light = next(
    (o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type == 'AREA'
     and o.location.x > 0),
    None,
)

# ── MESH ROTATION KEYFRAMES ───────────────────────────────────────────────────
monkey.rotation_euler = (0.0, 0.0, 0.0)
monkey.keyframe_insert(data_path="rotation_euler", frame=1)

monkey.rotation_euler = (0.0, 0.0, math.radians(360))
monkey.keyframe_insert(data_path="rotation_euler", frame=120)

# Linear interpolation: constant rotation speed (no ease-in/out)
for fcurve in monkey.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'LINEAR'

# ── KEY LIGHT SUBTLE ORBIT ────────────────────────────────────────────────────
# 20° arc keeps the specular lobe moving independently of the mesh rotation,
# preventing the viewer from predicting the highlight path.
if key_light is not None:
    key_light.location = (3.0, -2.0, 4.0)
    key_light.keyframe_insert(data_path="location", frame=1)

    key_light.location = (2.3, -2.7, 4.0)
    key_light.keyframe_insert(data_path="location", frame=60)

    key_light.location = (3.0, -2.0, 4.0)
    key_light.keyframe_insert(data_path="location", frame=120)

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"✓ Rendered  {MP4_OUT}")
