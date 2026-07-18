"""
record.py — viewport animation for bmesh.ops.bridge_loops tutorial
═══════════════════════════════════════════════════════════════════
Runs blueprint.py, then renders a 90-frame camera orbit to:
  public/library/videos/scripting/
    python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr/viewport.mp4

Run headless:
  blender --background --python record.py

Camera orbits 180° around both port objects — starting side-on (showing the
taper profile of PORT_TAPER), swinging through front (showing the bore opening
of PORT_BORE), then finishing at the rear (showing both back caps).  Gentle
elevation so the top of each tube is visible throughout.
"""

import math
import os

import bpy
from mathutils import Vector

# ── EXEC BLUEPRINT ────────────────────────────────────────────────────────────
_here = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(_here, "blueprint.py")).read())

# ── RENDER SETTINGS ───────────────────────────────────────────────────────────
TOTAL_FRAMES  = 90
ORBIT_RADIUS  = 1.10
ORBIT_HEIGHT  = 0.38
ORBIT_DEG     = 180.0
ORBIT_OFFSET  = 90.0   # start angle in degrees (side view first)

scene             = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = 30

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
out_dir = os.path.join(
    _here,
    "..", "..", "..", "..",   # → public/library/
    "videos", "scripting",
    "python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr",
)
os.makedirs(out_dir, exist_ok=True)

scene.render.filepath                    = os.path.join(out_dir, "viewport")
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 100

# ── LIGHTING ─────────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"

sun         = bpy.data.lights.new("RecordSun", "SUN")
sun.energy  = 4.0
sun_obj     = bpy.data.objects.new("RecordSun", sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(50), 0.0, math.radians(30))

fill        = bpy.data.lights.new("RecordFill", "SUN")
fill.energy = 1.2
fill_obj    = bpy.data.objects.new("RecordFill", fill)
scene.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(70), 0.0, math.radians(210))

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Look-at target — midpoint between both port objects
target = Vector((0.0, 0.0, -0.06))

for frame in range(1, TOTAL_FRAMES + 1):
    t     = (frame - 1) / max(TOTAL_FRAMES - 1, 1)  # [0.0 → 1.0]
    angle = math.radians(ORBIT_OFFSET + t * ORBIT_DEG)

    cam_obj.location = Vector((
        ORBIT_RADIUS * math.cos(angle),
        ORBIT_RADIUS * math.sin(angle),
        ORBIT_HEIGHT,
    ))

    # Point camera at target
    direction = target - cam_obj.location
    rot_quat  = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot_quat.to_euler()

    cam_obj.keyframe_insert("location",        frame=frame)
    cam_obj.keyframe_insert("rotation_euler",  frame=frame)

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[HF] record → {out_dir}/viewport*.mp4")
