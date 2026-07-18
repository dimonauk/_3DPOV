"""
record.py — viewport animation for bmesh.ops.grid_fill tutorial
═══════════════════════════════════════════════════════════════
Runs blueprint.py, then renders a 90-frame camera orbit to:
  public/library/videos/scripting/python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr/viewport.mp4

Run headless:
  blender --background --python record.py

The camera arcs from above-left to above-right, pausing in front to show
both the bezel structure and the clean quad patch of the screen face.
"""

import math
import os
import bpy
from mathutils import Vector

# ── EXEC BLUEPRINT ─────────────────────────────────────────────────────────────
_here = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_here, "blueprint.py")).read())

# ── RENDER SETTINGS ────────────────────────────────────────────────────────────
TOTAL_FRAMES = 90
FRAME_START  = 1
FRAME_END    = TOTAL_FRAMES
ORBIT_RADIUS = 4.0
ORBIT_HEIGHT = 1.8
ORBIT_DEG    = 180.0   # pan 180° — side → front → other side

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = 30

# ── OUTPUT ─────────────────────────────────────────────────────────────────────
out_dir = os.path.join(
    _here,
    "..", "..", "..", "..",          # public/library root
    "videos", "scripting",
    "python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr",
)
os.makedirs(out_dir, exist_ok=True)
scene.render.filepath                       = os.path.join(out_dir, "viewport")
scene.render.image_settings.file_format     = "FFMPEG"
scene.render.ffmpeg.format                  = "MPEG4"
scene.render.ffmpeg.codec                   = "H264"
scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
scene.render.resolution_x                  = 1920
scene.render.resolution_y                  = 1080
scene.render.resolution_percentage         = 100

# ── LIGHTING ───────────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"

sun = bpy.data.lights.new("RecordSun", "SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("RecordSun", sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(50), 0, math.radians(30))

# Second fill light from below to catch the screen emission on the chassis underside
fill = bpy.data.lights.new("RecordFill", "AREA")
fill.energy = 40.0
fill.size   = 2.0
fill_obj = bpy.data.objects.new("RecordFill", fill)
scene.collection.objects.link(fill_obj)
fill_obj.location = (0.0, 0.0, -2.0)
fill_obj.rotation_euler = (math.radians(180), 0, 0)

# ── CAMERA ─────────────────────────────────────────────────────────────────────
cam_data       = bpy.data.cameras.new("RecordCam")
cam_data.lens  = 50
cam = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

TARGET = Vector((0.0, 0.0, 0.0))

for frame in range(FRAME_START, FRAME_END + 1):
    t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
    angle = math.radians(-90 + ORBIT_DEG * t)   # −90° (left) → +90° (right)
    cam.location = Vector((
        ORBIT_RADIUS * math.cos(angle),
        ORBIT_RADIUS * math.sin(angle),
        ORBIT_HEIGHT,
    ))
    direction = (TARGET - cam.location).normalized()
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── RENDER ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport recording saved → {scene.render.filepath}")
