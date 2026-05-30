#!/usr/bin/env python3
"""
record.py — Viewport animation for GN Mesh Island: Per-Island Colour
Blender 5.1 | CC0 | Holoflow Studio

Opens the .blend saved by blueprint.py and animates the "Lift Multiplier"
group socket from 0.0 → 1.0 → 0.0 over 96 frames (4 s at 24 fps).
Each tile rises to a different height because its island index seeds the
random lift, making every tile unique while the animation stays deterministic.

Outputs:
    public/library/videos/geometry-nodes/gn-mesh-island-per-island-colour/viewport.mp4

Run:
    blender --background mosaic_tiles.blend --python record.py
"""

import bpy
from pathlib import Path

HERE      = Path(__file__).parent
BLEND_IN  = HERE / "mosaic_tiles.blend"
VIDEO_OUT = (
    HERE.parents[3]
    / "videos"
    / "geometry-nodes"
    / "gn-mesh-island-per-island-colour"
    / "viewport.mp4"
)

FRAMES_TOTAL  = 96    # 4 s at 24 fps
FRAMES_RISE   = 36    # frames to reach peak lift
FRAMES_HOLD   = 24    # frames held at peak (tiles visible for a beat)
# descent = FRAMES_TOTAL - FRAMES_RISE - FRAMES_HOLD = 36 frames

# ─── Load blend ───────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = FRAMES_TOTAL

obj = bpy.data.objects["mosaic_tiles"]
mod = obj.modifiers["GNIslandColour"]

# ─── Keyframe Lift Multiplier ─────────────────────────────────────────────────
# Input_2 maps to the first user-defined group input ("Lift Multiplier").
# Keyframing via modifier data_path is the standard approach for GN inputs.
def key_lift(frame: int, value: float) -> None:
    mod["Input_2"] = value
    mod.keyframe_insert(data_path='["Input_2"]', frame=frame)


FRAME_PEAK_START = 1 + FRAMES_RISE
FRAME_PEAK_END   = FRAME_PEAK_START + FRAMES_HOLD

key_lift(1,                0.0)   # flat at start
key_lift(FRAME_PEAK_START, 1.0)   # fully lifted
key_lift(FRAME_PEAK_END,   1.0)   # hold
key_lift(FRAMES_TOTAL,     0.0)   # return to flat

# Apply smooth BEZIER easing on all keyframes.
action = obj.animation_data.action
for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ─── Render settings ──────────────────────────────────────────────────────────
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.ffmpeg.ffmpeg_preset        = "GOOD"
scene.render.filepath                    = str(VIDEO_OUT)
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.fps            = 24

# ─── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, use_viewport=True)
print(f"[holoflow] viewport.mp4 → {VIDEO_OUT}")
