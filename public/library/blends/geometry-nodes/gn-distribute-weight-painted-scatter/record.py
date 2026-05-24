#!/usr/bin/env python3
"""
record.py — viewport animation for GN Distribute Weight-Painted Scatter
Blender 5.1 | CC0 | Holoflow Studio

Animation: 90 frames at 24 fps (~3.75 seconds). A camera orbits 60° above
the terrain and arcs 45° around the Z-axis, revealing how the rock density
falls off from the bright-green centre to the sparse outer ring.

Requires scatter_terrain.blend (built by blueprint.py) already on disk.

Run AFTER blueprint.py:
    blender --background scatter_terrain.blend --python record.py
"""

import bpy
import math
from pathlib import Path

SLUG         = "gn-distribute-weight-painted-scatter"
TOPIC        = "geometry-nodes"
TOTAL_FRAMES = 90

VIDEO_OUT = (
    Path(__file__).parent.parents[3]
    / "videos" / TOPIC / SLUG / "viewport.mp4"
)
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

scene             = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

# ============================================================
# Camera
# Start: overhead-ish angle from slightly behind the terrain.
# End: rotated 45° around Z, same altitude. Arc reveals the
# density gradient spreading outward from the centre.
# ============================================================
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

START_ANGLE = math.radians(15)
END_ANGLE   = math.radians(60)
CAM_DIST    = 5.8
CAM_Z       = 4.0

cam_obj.location       = (
    CAM_DIST * math.sin(START_ANGLE),
    -CAM_DIST * math.cos(START_ANGLE),
    CAM_Z,
)
cam_obj.rotation_euler = (math.radians(52), 0.0, START_ANGLE)
cam_obj.keyframe_insert(data_path="location",       frame=1)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

cam_obj.location       = (
    CAM_DIST * math.sin(END_ANGLE),
    -CAM_DIST * math.cos(END_ANGLE),
    CAM_Z,
)
cam_obj.rotation_euler = (math.radians(52), 0.0, END_ANGLE)
cam_obj.keyframe_insert(data_path="location",       frame=TOTAL_FRAMES)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# Smooth easing on all camera curves
if cam_obj.animation_data and cam_obj.animation_data.action:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

# ============================================================
# Sun light
# ============================================================
sun_data             = bpy.data.lights.new("RecordSun", type="SUN")
sun_data.energy      = 3.5
sun_data.angle       = math.radians(5)
sun_obj              = bpy.data.objects.new("RecordSun", sun_data)
sun_obj.rotation_euler = (math.radians(55), 0.0, math.radians(30))
scene.collection.objects.link(sun_obj)

# ============================================================
# World background — low ambient
# ============================================================
world           = bpy.data.worlds.new("RecordWorld")
scene.world     = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value   = (0.05, 0.06, 0.08, 1.0)
bg.inputs["Strength"].default_value = 0.3

# ============================================================
# Render settings — EEVEE Next, H.264 MP4, 1920×1080, 24 fps
# ============================================================
scene.render.engine                         = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format     = "FFMPEG"
scene.render.ffmpeg.format                  = "MPEG4"
scene.render.ffmpeg.codec                   = "H264"
scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
scene.render.resolution_x                   = 1920
scene.render.resolution_y                   = 1080
scene.render.fps                            = 24
scene.render.filepath                       = str(VIDEO_OUT)

bpy.ops.render.render(animation=True)
print(f"[record] video → {VIDEO_OUT}")
