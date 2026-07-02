#!/usr/bin/env python3
"""
record.py — Viewport animation render for GN Interpolate Domain tutorial.
Blender 5.1 | CC0 | Holoflow Studio

Produces: public/library/videos/geometry-nodes/
            gn-interpolate-domain-face-normal-vertex-colour-toon/viewport.mp4
Duration: 8 seconds at 24 fps = 192 frames
Sequence:
  Frames  1-24   Static flat-grey icosphere (no modifier yet) — baseline.
  Frames 25-72   GN modifier added → vertex colours snap in → object slow-spins.
  Frames 73-192  Finished gem rotating 270° — gradient travels across faces.

Run:
    blender --background --python record.py
"""

import bpy
import math
from pathlib import Path

HERE    = Path(__file__).parent
OUT_DIR = HERE.parents[3] / "videos" / "geometry-nodes" \
          / "gn-interpolate-domain-face-normal-vertex-colour-toon"
OUT_MP4 = OUT_DIR / "viewport.mp4"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES = 192
FPS          = 24

# ============================================================
# Scene bootstrap via blueprint
# ============================================================
# Import the blueprint to share object/material creation code.
import importlib.util, sys

bp_path = HERE / "blueprint.py"
spec = importlib.util.spec_from_file_location("blueprint", bp_path)
bp   = importlib.util.module_from_spec(spec)
sys.modules["blueprint"] = bp
spec.loader.exec_module(bp)

scene = bpy.context.scene
obj   = bpy.data.objects[bp.MESH_NAME]
obj.location = (0, 0, 0)

# ============================================================
# Camera + lighting
# ============================================================
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location    = (3.2, -2.8, 2.5)
cam_obj.rotation_euler = (1.05, 0.0, 0.85)   # tilt down toward object

sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 2.5
sun_obj = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (0.6, 0.2, 1.2)

# ============================================================
# Keyframe spin (Z rotation)
# ============================================================
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=1)

# No spin during grey phase
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=24)

# Spin 270° across the coloured phase
obj.rotation_euler = (0, 0, math.radians(270))
obj.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)

# Set easing to linear for mechanical rotation
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ============================================================
# Render settings — EEVEE viewport quality
# ============================================================
scene.render.engine      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps          = FPS
scene.render.filepath     = str(OUT_MP4)
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] Viewport animation → {OUT_MP4}")
