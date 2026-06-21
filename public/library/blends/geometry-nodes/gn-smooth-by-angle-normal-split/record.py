"""
record.py — Viewport Animation for GN Smooth by Angle Tutorial
Holoflow Studio | CC0

Animates the Smooth Angle group socket from 5° to 90° over 60 frames.
The prism transitions from fully faceted (5°, every edge sharp) through
the inflection point (~22.5°, sides just become smooth) to silky-smooth
sides with only cap edges marked sharp (90°+).

Output: viewport.mp4 in public/library/videos/geometry-nodes/
        gn-smooth-by-angle-normal-split/

Run AFTER blueprint.py has been run in the same Blender session.
"""

import bpy
import math
import os

# ── PARAMETERS ───────────────────────────────────────────────────────────────
TOTAL_FRAMES  = 60
OUTPUT_DIR    = bpy.path.abspath(
    "//../../../../public/library/videos/"
    "geometry-nodes/gn-smooth-by-angle-normal-split/"
)
OUTPUT_FILE   = os.path.join(OUTPUT_DIR, "viewport.mp4")
ANGLE_START   = math.radians(5.0)    # fully faceted
ANGLE_END     = math.radians(90.0)   # fully smooth sides, sharp caps only
GN_MOD_NAME   = "SmoothByAngle_GN"

# ── SCENE ────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = 30

# ── OUTPUT ───────────────────────────────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)
scene.render.filepath              = OUTPUT_FILE
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format         = 'MPEG4'
scene.render.ffmpeg.codec          = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x          = 1920
scene.render.resolution_y          = 1080
scene.render.resolution_percentage = 50   # 960×540 for quick viewport render

# ── FIND OBJECT ──────────────────────────────────────────────────────────────
obj = bpy.data.objects.get("smooth_prism")
if obj is None:
    raise RuntimeError("smooth_prism not found — run blueprint.py first.")

mod = obj.modifiers.get(GN_MOD_NAME)
if mod is None:
    raise RuntimeError(f"Modifier '{GN_MOD_NAME}' not found on smooth_prism.")

# ── KEYFRAME THE ANGLE SOCKET ────────────────────────────────────────────────
# The GN modifier stores group input values under mod["Input_N"].
# Input_2 is the Smooth Angle socket (index 1 in the interface, but
# modifier dict keys start from "Input_1" for the first non-geometry socket).
for f in range(1, TOTAL_FRAMES + 1):
    t = (f - 1) / (TOTAL_FRAMES - 1)          # 0.0 → 1.0
    angle = ANGLE_START + t * (ANGLE_END - ANGLE_START)
    mod["Input_2"] = angle
    mod.keyframe_insert(data_path='["Input_2"]', frame=f)

# ── RENDER ───────────────────────────────────────────────────────────────────
# Render viewport rather than full render — captures EEVEE Next normal split
# in real time without a full compositing pass.
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        with bpy.context.temp_override(area=area):
            bpy.ops.render.opengl(animation=True)
        break

print(f"[record.py] Viewport animation → {OUTPUT_FILE}")
