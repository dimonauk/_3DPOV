#!/usr/bin/env python3
"""
record.py — viewport animation for GN Capture Attribute demo
Blender 5.1 | CC0 | Holoflow Studio

Rotates the camera 360° around the scatter field of coloured spheres so
the per-instance rainbow hues are legible from every angle.  The camera
completes one full orbit in 5 seconds (150 frames at 30 fps).

Outputs to:
  public/library/videos/geometry-nodes/gn-capture-attribute/viewport.mp4

Run after blueprint.py:
    blender --background colour_scatter.blend --python record.py
"""

import bpy
import math
from pathlib import Path

# ============================================================
# Render settings
# ============================================================
HERE        = Path(__file__).parent
VIDEO_DIR   = HERE.parents[3] / "videos" / "geometry-nodes" / "gn-capture-attribute"
VIDEO_OUT   = VIDEO_DIR / "viewport"   # Blender appends frame numbers + extension

FPS          = 30
TOTAL_FRAMES = 150   # 5 seconds

VIDEO_DIR.mkdir(parents=True, exist_ok=True)

scene                        = bpy.context.scene
scene.frame_start            = 1
scene.frame_end              = TOTAL_FRAMES
scene.render.fps             = FPS
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath        = str(VIDEO_OUT)

# ============================================================
# Camera orbit — 360° around Z axis at fixed radius and elevation
# The scatter field is centred at the world origin (MeshGrid is centred).
# Camera keeps a fixed elevation of 5 m and orbits at a radius of 8 m.
#
# Keyframe layout:
#   Frame 1   → angle  0°   (front-right view)
#   Frame 38  → angle  90°  (left view)
#   Frame 75  → angle 180°  (back-right view)
#   Frame 113 → angle 270°  (right view)
#   Frame 150 → angle 360°  (= 0°, completes the loop)
# ============================================================
ORBIT_RADIUS    = 8.0
ORBIT_ELEVATION = 5.0
ORBIT_TARGET    = (0.0, 0.0, 0.0)

cam_obj = bpy.data.objects.get("Camera")
if cam_obj is None:
    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

cam_obj.animation_data_clear()

orbit_frames = [1, 38, 75, 113, 150]
orbit_angles = [0, 90, 180, 270, 360]

for frame, deg in zip(orbit_frames, orbit_angles):
    rad = math.radians(deg)
    x   = ORBIT_RADIUS * math.cos(rad)
    y   = ORBIT_RADIUS * math.sin(rad)
    z   = ORBIT_ELEVATION
    cam_obj.location = (x, y, z)

    # Point camera at origin
    dx, dy, dz = (ORBIT_TARGET[0] - x, ORBIT_TARGET[1] - y, ORBIT_TARGET[2] - z)
    dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    pitch = math.atan2(-dz, math.sqrt(dx*dx + dy*dy))
    yaw   = math.atan2(dy, dx)
    cam_obj.rotation_euler = (math.pi/2 - pitch, 0.0, yaw + math.pi/2)

    cam_obj.keyframe_insert(data_path="location",       frame=frame)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

# Linear interpolation keeps a constant orbit speed
if cam_obj.animation_data and cam_obj.animation_data.action:
    for fcurve in cam_obj.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"

# ============================================================
# Viewport shading — MATERIAL mode so the Emission shader shows colours
# ============================================================
for area in (bpy.context.screen.areas if bpy.context.screen else []):
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type            = "MATERIAL"
                space.shading.use_scene_lights = True
                break

# ============================================================
# Render
# ============================================================
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"✓  viewport animation → {VIDEO_OUT}")
