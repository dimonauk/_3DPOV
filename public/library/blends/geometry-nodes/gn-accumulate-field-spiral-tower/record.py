#!/usr/bin/env python3
"""
record.py — Viewport animation for GN Accumulate Field Spiral Tower
Blender 5.1 | CC0 | Holoflow Studio

Animates the Pillar Count socket from 1 to 28 over 90 frames (3 s at 30 fps),
revealing each pillar in spiral order.  Outputs viewport.mp4 via FFMPEG.

Run after blueprint.py (re-uses the saved .blend):
    blender --background spiral_tower.blend --python record.py
"""

import bpy
from pathlib import Path

HERE     = Path(__file__).parent
BLEND_IN = HERE / "spiral_tower.blend"
VIDEO_OUT = HERE.parents[3] / "videos" / "geometry-nodes" / \
            "gn-accumulate-field-spiral-tower" / "viewport.mp4"

FRAMES     = 90
FPS        = 30
MAX_PILLARS = 28

# ─── Load blend ───────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))
scene = bpy.context.scene
obj   = bpy.data.objects["spiral_tower"]
mod   = obj.modifiers["HoloflowGNSpiralTower"]

# ─── Animate Input_2 (Pillar Count) from 1 → MAX_PILLARS ─────────────────────
# GN modifier inputs are keyframed via data_path on the modifier.
# Input_2 is the "Pillar Count" socket (index matches blueprint.py mod assignment).
scene.frame_start = 1
scene.frame_end   = FRAMES

for frame in range(1, FRAMES + 1):
    t = (frame - 1) / (FRAMES - 1)
    count = max(1, round(1 + t * (MAX_PILLARS - 1)))
    scene.frame_set(frame)
    mod["Input_2"] = count
    mod.keyframe_insert(data_path='["Input_2"]', frame=frame)

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
scene.render.fps            = FPS
scene.render.engine         = "BLENDER_EEVEE_NEXT"

# ─── Run render ───────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, use_viewport=True)
print(f"[holoflow] viewport.mp4 written → {VIDEO_OUT}")
