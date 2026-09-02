"""
record.py — Finance Attractor Viewport Animation
==================================================
Run this in Blender 5.1 (Text Editor → Run Script) AFTER blueprint.py.
Output: public/library/videos/scripting/
        python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos-rk4-bishop-tube-poi-webxr/
        viewport.mp4

Sequence (270 frames @ 30 fps = 9 seconds):
  0–90 fr   : camera orbits, object at Basis (canonical chaos)
  90–180 fr : shape-key blend → SK_Thrift (low-savings tighter orbit)
  180–270 fr: shape-key blend → SK_Rigid  (inelastic price, wide z-excursion)
"""

import bpy, math

# ── scene setup ──────────────────────────────────────────────────────────────
TOTAL_FRAMES = 270
FPS          = 30
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos-rk4-bishop-tube-poi-webxr/viewport.mp4"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# EEVEE Next for real-time quality
scene.render.engine             = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom           = True
scene.render.resolution_x       = 1920
scene.render.resolution_y       = 1080
scene.render.filepath           = OUTPUT_PATH
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format      = "MPEG4"
scene.render.ffmpeg.codec       = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"

# ── camera ────────────────────────────────────────────────────────────────────
CAM_RADIUS = 3.2
ELEVATION  = 1.2
FOCAL_MM   = 50.0

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = FOCAL_MM
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# Keyframe a full orbit
for fr in (1, TOTAL_FRAMES // 2, TOTAL_FRAMES):
    frac = (fr - 1) / (TOTAL_FRAMES - 1)
    angle = frac * 2.0 * math.pi
    cam_ob.location = (
        CAM_RADIUS * math.cos(angle),
        CAM_RADIUS * math.sin(angle),
        ELEVATION,
    )
    cam_ob.keyframe_insert("location", frame=fr)

# Always look at origin
track = cam_ob.constraints.new("TRACK_TO")
track.target    = scene.objects.get("hf_finance_attractor_poi")
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

# ── shape-key animation ────────────────────────────────────────────────────────
ob = scene.objects.get("hf_finance_attractor_poi")
if ob and ob.data.shape_keys:
    keys = ob.data.shape_keys.key_blocks

    def _set(name: str, val: float, fr: int) -> None:
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=fr)

    # All at 0 at start
    for k in ["SK_Thrift", "SK_LowCost", "SK_Rigid"]:
        _set(k, 0.0, 1)

    # Blend to SK_Thrift over frames 90–150
    _set("SK_Thrift", 0.0, 90)
    _set("SK_Thrift", 1.0, 150)

    # Blend back, then to SK_Rigid over frames 180–240
    _set("SK_Thrift", 0.0, 180)
    _set("SK_Rigid",  0.0, 180)
    _set("SK_Rigid",  1.0, 240)
    _set("SK_Rigid",  1.0, TOTAL_FRAMES)

# ── lighting ──────────────────────────────────────────────────────────────────
# Remove default light if any
for o in list(scene.objects):
    if o.type == "LIGHT":
        bpy.data.objects.remove(o, do_unlink=True)

sun_data = bpy.data.lights.new("Sun", type="SUN")
sun_data.energy = 2.0
sun_ob = bpy.data.objects.new("Sun", sun_data)
sun_ob.rotation_euler = (math.radians(45), 0, math.radians(30))
scene.collection.objects.link(sun_ob)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[finance-attractor record.py] render complete →", OUTPUT_PATH)
