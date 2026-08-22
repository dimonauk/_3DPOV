"""
record.py — viewport animation render for energy_beam (Blender 5.1)
Produces a 150-frame (5 s @ 30 fps) slow orbit around the Frenet beam trail.
The camera sweeps from low-right to high-left, showing the S-curve from multiple
angles so the viewer can see both the tube geometry and the beam's 3-D trajectory.

Run AFTER blueprint.py has been executed in the same session.

Output:
  public/library/videos/geometry-nodes/
  gn-curve-tangent-normal-frenet-ribbon-beam-webxr/viewport.mp4
"""

import bpy
import math
import os

FRAMES      = 150
FPS         = 30
RESOLUTION  = (1920, 1080)
ORBIT_R     = 5.0
Z_START     = 1.0
Z_END       = 3.5
OUTPUT_DIR  = (
    "//../../videos/geometry-nodes/"
    "gn-curve-tangent-normal-frenet-ribbon-beam-webxr/"
)
OUTPUT_FILE = "viewport"

scn = bpy.context.scene
scn.render.engine                       = "BLENDER_EEVEE_NEXT"
scn.render.fps                          = FPS
scn.frame_start                         = 1
scn.frame_end                           = FRAMES
scn.render.resolution_x                 = RESOLUTION[0]
scn.render.resolution_y                 = RESOLUTION[1]
scn.render.resolution_percentage        = 100
scn.render.film_transparent             = False
scn.render.image_settings.file_format   = "FFMPEG"
scn.render.ffmpeg.format                = "MPEG4"
scn.render.ffmpeg.codec                 = "H264"
scn.render.ffmpeg.constant_rate_factor  = "HIGH"
scn.render.filepath = bpy.path.abspath(
    os.path.join(OUTPUT_DIR, OUTPUT_FILE)
)

# Re-use or create orbit camera
cam_name = "RecordCam"
if cam_name not in bpy.data.objects:
    cam_data      = bpy.data.cameras.new(cam_name)
    cam_data.lens = 55
    cam_obj       = bpy.data.objects.new(cam_name, cam_data)
    scn.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects[cam_name]
scn.camera = cam_obj

# Eevee bloom — makes emission material glow visibly in renders
scn.eevee.use_bloom       = True
scn.eevee.bloom_threshold = 0.6
scn.eevee.bloom_intensity = 0.85
scn.eevee.bloom_radius    = 5.0

TARGET = (0.0, 0.0, 1.5)   # orbit focus at the midpoint of the beam path

def _place_cam(frame: int) -> None:
    """Position camera on an arc from 30° to 120°, rising from Z_START to Z_END."""
    t         = (frame - 1) / (FRAMES - 1)           # 0 → 1
    angle_deg = 30 + t * 90                           # 30° → 120° azimuth sweep
    rad       = math.radians(angle_deg)
    z         = Z_START + t * (Z_END - Z_START)

    cam_obj.location = (
        math.sin(rad) * ORBIT_R,
        -math.cos(rad) * ORBIT_R,
        z,
    )
    # Point camera at orbit target
    dx = TARGET[0] - cam_obj.location.x
    dy = TARGET[1] - cam_obj.location.y
    dz = TARGET[2] - cam_obj.location.z
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz) - math.pi,
        0,
        math.atan2(dx, -dy),
    )
    cam_obj.keyframe_insert("location",        frame=frame)
    cam_obj.keyframe_insert("rotation_euler",  frame=frame)

# Insert keyframes at start, mid, and end for a smooth orbit
for f in (1, FRAMES // 2, FRAMES):
    _place_cam(f)

# Set interpolation to smooth bezier
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

bpy.ops.render.render(animation=True)
print(f"[Holoflow] Recorded: {OUTPUT_DIR}{OUTPUT_FILE}.mp4")
