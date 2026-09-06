"""
record.py — Sprott O Attractor viewport animation
==================================================
Run from Blender's Python console AFTER blueprint.py has executed.
Outputs: public/library/videos/scripting/
  python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr/viewport.mp4

Duration: 5 s at 30 fps = 150 frames
Camera: orbit 360°, elevation 0.35 rad, distance 7.5 m
Shape-key morph: Basis → SK_LowB → SK_HighB → SK_NearP → Basis
Renderer: WORKBENCH (flat vertex colours, no light setup needed)
"""

import bpy, math, os

# ── output path ──────────────────────────────────────────────────────────────
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "public/library/videos/scripting/"
    "python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-"
    "shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr"
)
os.makedirs(OUT_DIR, exist_ok=True)

# ── render settings ──────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine          = 'BLENDER_WORKBENCH'
scn.render.resolution_x    = 1920
scn.render.resolution_y    = 1080
scn.render.fps             = 30
scn.render.frame_start     = 1
scn.render.frame_end       = 150
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format   = 'MPEG4'
scn.render.ffmpeg.codec    = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath        = os.path.join(OUT_DIR, "viewport.mp4")

# workbench: flat vertex colour, no HDRI needed
scn.display.shading.type          = 'SOLID'
scn.display.shading.color_type    = 'VERTEX'
scn.display.shading.light         = 'FLAT'

# ── camera ───────────────────────────────────────────────────────────────────
CAM_DIST  = 7.5   # metres from origin
CAM_ELEV  = 0.35  # radians above equator

cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scn.camera = cam_obj

# ── camera orbit keyframes ───────────────────────────────────────────────────
def set_cam(frame: int, theta: float):
    """Position camera at azimuth theta (radians) around Z-axis."""
    x = CAM_DIST * math.cos(theta)
    y = CAM_DIST * math.sin(theta)
    z = CAM_DIST * math.sin(CAM_ELEV)
    cam_obj.location = (x, y, z)
    # point at origin
    dx, dy, dz = -x, -y, -z
    dist_xy = math.sqrt(dx*dx + dy*dy)
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy + dz*dz) - abs(dz),
                   math.sqrt(dx*dx + dy*dy)),  # pitch
        0.0,
        math.atan2(dy, dx) + math.pi / 2       # yaw
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# Full 360° over 150 frames (5 s), starting from front
for fr in range(1, 151, 10):
    theta = 2 * math.pi * (fr - 1) / 150
    set_cam(fr, theta)

# smooth spline interpolation
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ── shape-key morph keyframes ─────────────────────────────────────────────────
# Locate the attractor object
obj = bpy.data.objects.get("hf_sprott_o_poi")
if obj and obj.data.shape_keys:
    kb = obj.data.shape_keys.key_blocks

    def sk_val(name: str, frame: int, val: float):
        kb[name].value = val
        kb[name].keyframe_insert("value", frame=frame)

    # Each shape key has zero value by default; animate one at a time
    for sk_name in ("SK_LowB", "SK_HighB", "SK_NearP"):
        kb[sk_name].value = 0.0

    # Basis (f1-37): no morph — pure canonical orbit
    # SK_LowB (f38-75): transition to wider b=2.0 orbit
    sk_val("SK_LowB",  1,  0.0)
    sk_val("SK_LowB",  38, 1.0)
    sk_val("SK_LowB",  75, 0.0)
    # SK_HighB (f76-112): tighter b=3.5 orbit
    sk_val("SK_HighB", 75, 0.0)
    sk_val("SK_HighB", 76, 1.0)
    sk_val("SK_HighB", 112, 0.0)
    # SK_NearP (f113-150): near-P topology b=1.7
    sk_val("SK_NearP", 112, 0.0)
    sk_val("SK_NearP", 113, 1.0)
    sk_val("SK_NearP", 150, 0.0)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[SprottO record] Rendered → {scn.render.filepath}")
