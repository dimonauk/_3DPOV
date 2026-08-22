#!/usr/bin/env python3
"""
record.py — Viewport animation for GN Shortest Edge Path: Circuit Trace Network
Blender 5.1 | CC0 | Holoflow Studio

Opens the .blend saved by blueprint.py and keyframes the "Start Density"
group socket (Input_2) from 0.0 → 0.60 → 0.60 → 0.0 over 72 frames (3 s at
24 fps).  The circuit traces materialise across the sphere and then retract,
demonstrating both the incremental reveal and the topology of the path network.

Outputs:
    public/library/videos/geometry-nodes/gn-shortest-edge-path-circuit-trace/viewport.mp4

Run:
    blender --background circuit_trace_sphere.blend --python record.py
"""

import bpy
from pathlib import Path

HERE      = Path(__file__).parent
BLEND_IN  = HERE / "circuit_trace_sphere.blend"
VIDEO_OUT = (
    HERE.parents[2]
    / "videos"
    / "geometry-nodes"
    / "gn-shortest-edge-path-circuit-trace"
    / "viewport.mp4"
)

FRAMES_TOTAL  = 72   # 3 s at 24 fps
FRAMES_REVEAL = 30   # frames to reach full density
FRAMES_HOLD   = 12   # hold at peak before retract

# ─── Load blend ───────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.frame_start   = 1
scene.frame_end     = FRAMES_TOTAL

obj = bpy.data.objects[MESH_NAME := "circuit_trace_sphere"]
mod = obj.modifiers["GNCircuitTrace"]

# ─── Keyframe Start Density ───────────────────────────────────────────────────
# Input_2 maps to the first user-defined group socket (Start Density).
# Keyframing via modifier data_path is the canonical approach for GN inputs.
def key_density(frame: int, value: float) -> None:
    mod["Input_2"] = value
    mod.keyframe_insert(data_path='["Input_2"]', frame=frame)


FRAME_PEAK  = 1 + FRAMES_REVEAL
FRAME_HOLD_END = FRAME_PEAK + FRAMES_HOLD

key_density(1,              0.0)   # no traces at start
key_density(FRAME_PEAK,     0.60)  # full circuit network
key_density(FRAME_HOLD_END, 0.60)  # beat of pause
key_density(FRAMES_TOTAL,   0.0)   # retract

# Smooth BEZIER easing on all keyframe handles
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
