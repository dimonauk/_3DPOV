#!/usr/bin/env python3
"""
record.py — viewport animation for GN Repeat Zone Crystal Cluster
Blender 5.1 | CC0 | Holoflow Studio

Animation: Crystal Count keyframed from 1 → 12 over 60 frames.
Each integer step adds one shard in Fermat-spiral order, showing
the accumulation loop at work. Interpolation set to CONSTANT so no
fractional shard counts appear mid-frame.

Run AFTER blueprint.py has written crystal_cluster.blend:
    blender --background crystal_cluster.blend --python record.py
"""

import bpy
from pathlib import Path

SLUG         = "gn-repeat-zone-crystal-cluster"
TOPIC        = "geometry-nodes"
MESH_NAME    = "crystal_cluster"
CRYSTAL_COUNT = 12
TOTAL_FRAMES  = 60

VIDEO_OUT = (
    Path(__file__).parent.parents[3]
    / "videos" / TOPIC / SLUG / "viewport.mp4"
)
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

scene = bpy.context.scene
obj   = bpy.data.objects[MESH_NAME]
mod   = obj.modifiers["HoloflowGNCrystal"]

# ============================================================
# Camera orbit — 10° rotation over the animation so the 3D depth reads
# ============================================================
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

cam_o = scene.camera
cam_o.rotation_euler = (1.1, 0.0, 0.8)
cam_o.keyframe_insert(data_path="rotation_euler", frame=1)
cam_o.rotation_euler = (1.1, 0.0, 0.8 + 0.175)  # +10°
cam_o.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# ============================================================
# Crystal Count keyframes — one crystal appears every 5 frames
# ============================================================
frames_per_crystal = TOTAL_FRAMES // CRYSTAL_COUNT   # 5

for i in range(1, CRYSTAL_COUNT + 1):
    frame = 1 + (i - 1) * frames_per_crystal
    scene.frame_set(frame)
    mod["Input_2"] = i
    mod.keyframe_insert(data_path='["Input_2"]', frame=frame)

# Set CONSTANT interpolation: no fractional shard counts between keyframes
if obj.animation_data and obj.animation_data.action:
    for fc in obj.animation_data.action.fcurves:
        if "Input_2" in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"

# ============================================================
# Render settings — EEVEE Next, H.264 MP4, 1920×1080, 30 fps
# ============================================================
scene.render.engine                             = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format         = "FFMPEG"
scene.render.ffmpeg.format                      = "MPEG4"
scene.render.ffmpeg.codec                       = "H264"
scene.render.ffmpeg.constant_rate_factor        = "MEDIUM"
scene.render.resolution_x                       = 1920
scene.render.resolution_y                       = 1080
scene.render.fps                                = 30
scene.render.filepath                           = str(VIDEO_OUT)

bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 written → {VIDEO_OUT}")
