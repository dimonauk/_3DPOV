"""
record.py — Viewport animation render for Double Pendulum poi head
==================================================================
Blender 5.1  ·  Run from Scripting workspace after blueprint.py

Renders 180 frames at 30 fps (6 s) to:
  public/library/videos/scripting/
    python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr/
      viewport.mp4

Sequence:
  F001–060  camera orbits 0°→120°, object stationary (Basis shape key)
  F060–100  shape-key morph Basis → SK_Chaotic
  F100–140  camera tilts down, shape key holds SK_Chaotic
  F140–170  shape-key morph SK_Chaotic → SK_WideSwing
  F170–180  hold final pose, slow bloom fade
"""

import bpy, math

# ── Output paths ─────────────────────────────────────────────────────────────
VIDEO_PATH = "//../../videos/scripting/" \
             "python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr/" \
             "viewport"

# ── Scene settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 180
scene.render.fps  = 30
scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.filepath            = VIDEO_PATH
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format       = "MPEG4"
scene.render.ffmpeg.codec        = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# Bloom (Eevee Next)
scene.eevee.use_bloom           = True
scene.eevee.bloom_threshold     = 0.32
scene.eevee.bloom_intensity     = 0.22
scene.eevee.bloom_radius        = 5.0

# ── Camera ──────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

CAM_DIST = 0.26   # distance from origin
CAM_ELEV = 0.36   # elevation angle (radians) ≈ 21°

def _set_cam(frame, az_deg, elev):
    az = math.radians(az_deg)
    cam_obj.location = (
        CAM_DIST * math.cos(elev) * math.sin(az),
        -CAM_DIST * math.cos(elev) * math.cos(az),
        CAM_DIST * math.sin(elev),
    )
    # Point at origin
    dx = -cam_obj.location[0]
    dy = -cam_obj.location[1]
    dz = -cam_obj.location[2]
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz),
        0.0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

_set_cam(1,    0.0,  CAM_ELEV)
_set_cam(60,  120.0, CAM_ELEV)
_set_cam(100, 150.0, 0.15)        # tilt down
_set_cam(180, 240.0, 0.15)

# ── Lighting ─────────────────────────────────────────────────────────────────
def _sun(name, az_deg, elev_deg, energy, colour=(1,1,1)):
    ld = bpy.data.lights.new(name, "SUN")
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    az  = math.radians(az_deg)
    elv = math.radians(elev_deg)
    lo.rotation_euler = (math.pi/2 - elv, 0, az)

_sun("Key",  45,  55, 3.5, (1.0, 0.98, 0.92))
_sun("Fill", 200, 30, 1.2, (0.80, 0.88, 1.00))
_sun("Rim",  -70, 15, 0.8, (1.00, 0.72, 0.30))

# ── Shape-key animation ───────────────────────────────────────────────────────
obj = bpy.data.objects.get("DoublePendulum_Poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks

    def _sk_kf(name, frame, val):
        if name in kb:
            kb[name].value = val
            kb[name].keyframe_insert("value", frame=frame)

    # Basis visible F001–060
    _sk_kf("Basis",      1,   1.0); _sk_kf("SK_Chaotic", 1, 0.0)
    _sk_kf("SK_WideSwing", 1, 0.0)

    # Morph → SK_Chaotic F060–100
    _sk_kf("Basis",      60,  1.0); _sk_kf("SK_Chaotic", 60, 0.0)
    _sk_kf("Basis",     100,  0.0); _sk_kf("SK_Chaotic", 100, 1.0)

    # Hold SK_Chaotic F100–140 (no keyframe needed — already at 1.0)
    # Morph → SK_WideSwing F140–170
    _sk_kf("SK_Chaotic",  140, 1.0); _sk_kf("SK_WideSwing", 140, 0.0)
    _sk_kf("SK_Chaotic",  170, 0.0); _sk_kf("SK_WideSwing", 170, 1.0)
    _sk_kf("SK_WideSwing", 180, 1.0)

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete → viewport.mp4")
