"""
record.py — Viewport animation for ks_flame_floor.blend
Outputs: public/library/videos/scripting/
         python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-etd2rk-spectral-flame-front-stage-floor-webxr/
         viewport.mp4

Run AFTER blueprint.py has created and saved the .blend file.
Duration: 10 s at 30 fps = 300 frames.

Animation plan
  0 – 60   Basis    (L=64 canonical chaos)      overhead → 35° elevation
  60 – 120  SK_Onset (L=22 near-onset)           side tracking shot
  120 – 180 SK_Short (L=32 sparse chaos)         return to 3/4 view
  180 – 240 SK_Long  (L=96 dense turbulence)     orbit low pass
  240 – 300 Basis fade back, camera eases to start position
"""

import bpy
from math import pi, sin, cos, radians

FRAME_END   = 300
FPS         = 30
CAM_DIST    = 12.0    # metres from floor centre
CAM_ELEV_LO = radians(20)
CAM_ELEV_HI = radians(45)

# ── Scene setup ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = (
    "//../../videos/scripting/"
    "python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-etd2rk-spectral-flame-front-stage-floor-webxr/"
    "viewport"
)

# Use EEVEE Next for bloom on emission material
scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.use_bloom        = True
eevee.bloom_threshold  = 0.30
eevee.bloom_intensity  = 0.18
eevee.bloom_radius     = 4.0

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 50
cam = bpy.data.objects.new("RecCam", cam_data)
bpy.context.collection.objects.link(cam)
scene.camera = cam

# Find the floor object
floor = next((o for o in bpy.data.objects if o.name.startswith("ks_flame_floor")), None)
if floor is None:
    raise RuntimeError("[record.py] Could not find ks_flame_floor — run blueprint.py first")

# Floor centre in world space
cx = 128 * 0.055 / 2
cy = 64  * 0.13  / 2
CENTRE = (cx, cy, 0.0)

def set_cam(frame, azimuth_deg, elev_rad, dist=CAM_DIST, target=CENTRE):
    az = radians(azimuth_deg)
    x = target[0] + dist * cos(elev_rad) * cos(az)
    y = target[1] + dist * cos(elev_rad) * sin(az)
    z = target[2] + dist * sin(elev_rad)
    cam.location = (x, y, z)
    # Point camera at target
    dx, dy, dz = target[0]-x, target[1]-y, target[2]-z
    import mathutils, math
    vec = mathutils.Vector((dx, dy, dz)).normalized()
    rot = vec.to_track_quat("-Z", "Y")
    cam.rotation_euler = rot.to_euler()
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# ── Camera keyframes ──────────────────────────────────────────────────────────
set_cam(  1, azimuth_deg=200, elev_rad=CAM_ELEV_HI)   # start: overhead 3/4
set_cam( 60, azimuth_deg=240, elev_rad=CAM_ELEV_LO)   # low side sweep
set_cam(120, azimuth_deg=290, elev_rad=CAM_ELEV_HI)   # 3/4 from other side
set_cam(180, azimuth_deg=340, elev_rad=CAM_ELEV_LO)   # low tracking pass
set_cam(240, azimuth_deg= 20, elev_rad=CAM_ELEV_HI)   # rise overhead
set_cam(300, azimuth_deg= 60, elev_rad=CAM_ELEV_HI)   # return near start

# Smooth interpolation
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── Shape key animation ───────────────────────────────────────────────────────
# Key names in order: Basis(0), SK_Onset(1), SK_Short(2), SK_Long(3)
skeys = floor.data.shape_keys
if skeys is None:
    raise RuntimeError("[record.py] Shape keys missing — run blueprint.py first")

key_blocks = skeys.key_blocks
key_names  = [kb.name for kb in key_blocks]

def set_sk(frame, active_name, value=1.0):
    for kb in key_blocks:
        v = value if kb.name == active_name else 0.0
        kb.value = v
        kb.keyframe_insert("value", frame=frame)

# Segments: each shape key holds for ~60 frames
set_sk(  1, "Basis")
set_sk( 55, "Basis")
set_sk( 65, "SK_Onset")
set_sk(115, "SK_Onset")
set_sk(125, "SK_Short")
set_sk(175, "SK_Short")
set_sk(185, "SK_Long")
set_sk(235, "SK_Long")
set_sk(245, "Basis")
set_sk(300, "Basis")

# Easing
for fc in skeys.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[KS record.py] Viewport animation rendered.")
