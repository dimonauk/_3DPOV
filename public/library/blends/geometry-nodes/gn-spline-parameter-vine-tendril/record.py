#!/usr/bin/env python3
"""
record.py — Viewport animation for GN Spline Parameter: Vine Tendril
Blender 5.1 | CC0 | Holoflow Studio

Animates the "Leaf Threshold" group socket from 0.50 → 0.80 → 0.80 → 0.50
over 84 frames (3.5 s at 24 fps): leaves gradually retract toward the tips,
hold, then bloom back out — demonstrating the Spline Parameter gradient
field controlling instance visibility along the tendril length.

Output:
    public/library/videos/geometry-nodes/gn-spline-parameter-vine-tendril/viewport.mp4

Run:
    blender --background vine_tendril.blend --python record.py
"""

import bpy
from pathlib import Path

HERE      = Path(__file__).parent
BLEND_IN  = HERE / "vine_tendril.blend"
VIDEO_OUT = (
    HERE.parents[2]
    / "videos"
    / "geometry-nodes"
    / "gn-spline-parameter-vine-tendril"
    / "viewport.mp4"
)

FRAMES_TOTAL   = 84   # 3.5 s at 24 fps
FRAMES_RETRACT = 24   # frames to retract leaves to tips (0.50 → 0.80)
FRAMES_HOLD    = 18   # hold at tips-only (threshold = 0.80)
FRAMES_BLOOM   = 24   # leaves bloom back out (0.80 → 0.50)
# remaining 18 frames: hold at full-bloom for end card

bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = FRAMES_TOTAL

obj = bpy.data.objects["VineStrands"]
mod = obj.modifiers["GNVineTendril"]

# "Leaf Threshold" is the second interface socket (after Geometry),
# accessible as Input_2 in the pre-5.0 modifier key convention.
THRESH_KEY = "Input_2"


def key_thresh(frame: int, value: float) -> None:
    mod[THRESH_KEY] = value
    mod.keyframe_insert(data_path=f'["{THRESH_KEY}"]', frame=frame)


FRAME_RETRACT_END = 1 + FRAMES_RETRACT
FRAME_HOLD_END    = FRAME_RETRACT_END + FRAMES_HOLD
FRAME_BLOOM_END   = FRAME_HOLD_END + FRAMES_BLOOM

key_thresh(1,                0.50)   # all leaves visible (half-way threshold)
key_thresh(FRAME_RETRACT_END, 0.80)  # leaves retreated to top 20 % of tendril
key_thresh(FRAME_HOLD_END,   0.80)   # hold — show tip-only silhouette
key_thresh(FRAME_BLOOM_END,  0.50)   # bloom back out
key_thresh(FRAMES_TOTAL,     0.50)   # hold for end card

# Smooth BEZIER easing on all keyframes
action = obj.animation_data.action
for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# Render settings
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.ffmpeg.ffmpeg_preset        = "GOOD"
scene.render.filepath                    = str(VIDEO_OUT)
scene.render.resolution_x               = 1280
scene.render.resolution_y               = 720
scene.render.fps                         = 24

bpy.ops.render.render(animation=True, use_viewport=True)
print(f"[holoflow] viewport.mp4 → {VIDEO_OUT}")
