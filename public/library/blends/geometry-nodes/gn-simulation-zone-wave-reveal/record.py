#!/usr/bin/env python3
"""
record.py — viewport animation for GN Simulation Zone Wave Reveal
Blender 5.1 | CC0 | Holoflow Studio

Animation: 120 frames at 24 fps. The wave expands from the grid centre
outward, reaching the corners at ~85 frames. The camera slowly tilts
downward over the full length to keep the spreading front in frame.
Requires wave_reveal_grid.blend (built by blueprint.py) to already exist.

Run AFTER blueprint.py:
    blender --background wave_reveal_grid.blend --python record.py
"""

import bpy
from pathlib import Path

SLUG         = "gn-simulation-zone-wave-reveal"
TOPIC        = "geometry-nodes"
MESH_NAME    = "wave_reveal_grid"
TOTAL_FRAMES = 120

VIDEO_OUT = (
    Path(__file__).parent.parents[3]
    / "videos" / TOPIC / SLUG / "viewport.mp4"
)
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

# Camera tilt: starts looking slightly downward, settles into a top-down angle
cam_o = scene.camera
cam_o.location       = (0.0, -4.8, 3.8)
cam_o.rotation_euler = (0.88, 0.0, 0.0)
cam_o.keyframe_insert(data_path="rotation_euler", frame=1)

cam_o.rotation_euler = (1.05, 0.0, 0.0)   # steeper top-down by end
cam_o.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# Smooth camera easing — default BEZIER is fine here
if cam_o.animation_data and cam_o.animation_data.action:
    for fc in cam_o.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

# ============================================================
# Render settings — EEVEE Next, H.264 MP4, 1920×1080, 24 fps
# ============================================================
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.fps                         = 24
scene.render.filepath                    = str(VIDEO_OUT)

# Simulation zones compute state incrementally; the .blend built by blueprint.py
# starts at frame 1. Blender's animation render loops frames sequentially, so
# the simulation cache is populated automatically during render.
bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 written → {VIDEO_OUT}")
