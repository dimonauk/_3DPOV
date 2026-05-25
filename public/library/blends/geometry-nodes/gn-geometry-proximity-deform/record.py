#!/usr/bin/env python3
"""
record.py — viewport animation for GN Geometry Proximity Deform
Blender 5.1 | CC0 | Holoflow Studio

Animates the influence sphere descending toward the grid, creating a growing
deformation dome, then lifting away and allowing the grid to return flat.
Outputs a 5-second 30fps OpenGL viewport render to:
  public/library/videos/geometry-nodes/gn-geometry-proximity-deform/viewport.mp4

Run after blueprint.py:
    blender --background proximity_deform.blend --python record.py
"""

import bpy
import math
from pathlib import Path

# ============================================================
# Render settings
# ============================================================
HERE        = Path(__file__).parent
VIDEO_DIR   = HERE.parents[3] / "videos" / "geometry-nodes" / "gn-geometry-proximity-deform"
VIDEO_OUT   = VIDEO_DIR / "viewport"   # Blender appends frame numbers + extension

FPS         = 30
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
# Sphere animation keyframes
# The sphere starts high (no deformation), descends to near-contact
# (full dome), holds, then lifts away to return the grid to flat.
#
# Frame layout (150 total, 30fps):
#   1       — sphere at SPHERE_HIGH (1.8 m above plane)   flat grid
#   30      — sphere descending (ease in via BEZIER)
#   60      — sphere at SPHERE_LOW (0.18 m — full dome)   peak depress
#   90      — sphere holds at low
#   120     — sphere ascending
#   150     — sphere back at SPHERE_HIGH                   flat grid
# ============================================================
SPHERE_HIGH = 1.80   # Z height, no influence on grid
SPHERE_LOW  = 0.18   # Z height, deepest deformation

sphere_obj = bpy.data.objects.get("influence_sphere")
if sphere_obj is None:
    raise RuntimeError("influence_sphere not found — run blueprint.py first")

# Clear existing keyframes on location
sphere_obj.animation_data_clear()

keyframes = [
    (1,   SPHERE_HIGH),
    (60,  SPHERE_LOW),
    (90,  SPHERE_LOW),
    (150, SPHERE_HIGH),
]

for frame, z in keyframes:
    sphere_obj.location = (0.0, 0.0, z)
    sphere_obj.keyframe_insert(data_path="location", frame=frame)

# Smooth interpolation on all inserted keyframes
if sphere_obj.animation_data and sphere_obj.animation_data.action:
    for fcurve in sphere_obj.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing        = "AUTO"

# ============================================================
# Camera — fixed angle, positioned for a clean 3/4 view
# ============================================================
cam_obj = bpy.data.objects.get("Camera")
if cam_obj is None:
    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

cam_obj.location       = (4.0, -4.0, 3.5)
cam_obj.rotation_euler = (math.radians(55), 0.0, math.radians(45))

# ============================================================
# Viewport shading for OpenGL render
# ============================================================
for area in bpy.context.screen.areas if bpy.context.screen else []:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type       = "MATERIAL"
                space.shading.use_scene_lights  = True
                space.shading.use_scene_world   = False
                break

# ============================================================
# Render
# ============================================================
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"✓  viewport animation written to {VIDEO_OUT}*.mp4")
