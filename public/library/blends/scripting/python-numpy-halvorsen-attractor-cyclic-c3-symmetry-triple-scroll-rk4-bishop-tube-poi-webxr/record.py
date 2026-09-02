"""
record.py — Viewport animation render for the Halvorsen Attractor entry.
Holoflow Studio / Blender 5.1

Run AFTER blueprint.py (the mesh object "hf_halvorsen_poi" must exist).
This script:
  1. Configures EEVEE Next with bloom for the cobalt–amber emission tube.
  2. Sets a 300-frame / 30 fps animation (10 s).
  3. Orbits the camera 270° while fading through four shape keys:
       frames   1– 60  Basis       (canonical a=1.89 triple-scroll)
       frames  60–120  SK_Wide     (a=1.40  wider onset orbit)
       frames 120–180  SK_Tight    (a=2.30  tighter compressed lobes)
       frames 180–240  SK_Trans    (a=1.60  intermediate period-cascade)
       frames 240–300  Basis       (return)
  4. Renders to public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
import os

# ── Output path ───────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll"
    "-rk4-bishop-tube-poi-webxr"
)
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR   = os.path.join(
    SCRIPT_DIR, "..", "..", "..", "..", "videos", "scripting", SLUG
)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(VIDEO_DIR, "viewport")   # Blender appends .mp4

# ── Render settings ───────────────────────────────────────────────────────────
FPS      = 30
N_FRAMES = 300

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.engine                         = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format     = 'FFMPEG'
scene.render.ffmpeg.format                  = 'MPEG4'
scene.render.ffmpeg.codec                   = 'H264'
scene.render.ffmpeg.constant_rate_factor    = 'HIGH'
scene.render.resolution_x                   = 1920
scene.render.resolution_y                   = 1080
scene.render.filepath                        = OUTPUT_PATH

eevee = scene.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = 0.35
eevee.bloom_intensity = 0.22
eevee.bloom_radius    = 5.0

# ── Camera ────────────────────────────────────────────────────────────────────
CAM_DIST = 18.0   # Halvorsen attractor spans ≈±12 units; pull back for full view
CAM_ELEV = 25.0   # degrees above equatorial plane (shows C₃ symmetry well)

if "Camera" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("Camera")
    cam_ob   = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_ob)
else:
    cam_ob = bpy.data.objects["Camera"]

scene.camera = cam_ob
cam_ob.data.lens = 35   # mild tele — keeps tube width readable

def set_camera(frame, angle_deg):
    """Position camera on a horizontal orbit at CAM_ELEV degrees elevation."""
    a   = math.radians(angle_deg)
    el  = math.radians(CAM_ELEV)
    r_h = CAM_DIST * math.cos(el)
    cam_ob.location = (r_h * math.cos(a), r_h * math.sin(a), CAM_DIST * math.sin(el))
    # Point at origin
    dx = -cam_ob.location.x
    dy = -cam_ob.location.y
    dz = -cam_ob.location.z
    cam_ob.rotation_euler = (
        math.atan2(math.sqrt(dx**2 + dy**2), -dz),
        0.0,
        math.atan2(dy, dx) + math.pi / 2.0,
    )
    cam_ob.keyframe_insert("location",        frame=frame)
    cam_ob.keyframe_insert("rotation_euler",  frame=frame)

# 270° orbit over 300 frames — chosen so the C₃ symmetry is visible at three
# distinct viewing angles (0°, 90°, 180° all show a different dominant lobe).
for f in range(1, N_FRAMES + 1):
    set_camera(f, angle_deg=30.0 + (f - 1) * 270.0 / (N_FRAMES - 1))

# ── Light ─────────────────────────────────────────────────────────────────────
if "Sun" not in bpy.data.objects:
    sun_data = bpy.data.lights.new("Sun", type='SUN')
    sun_ob   = bpy.data.objects.new("Sun", sun_data)
    bpy.context.collection.objects.link(sun_ob)
else:
    sun_ob = bpy.data.objects["Sun"]
sun_ob.data.energy = 2.0
sun_ob.location     = (5, 5, 10)

# ── Shape key animation ───────────────────────────────────────────────────────
ob = bpy.data.objects.get("hf_halvorsen_poi")
if ob and ob.data.shape_keys:
    keys = ob.data.shape_keys.key_blocks
    sk_names = ["Basis", "SK_Wide", "SK_Tight", "SK_Trans"]

    # Zero all keys at frame 1
    for name in sk_names:
        if name in keys:
            keys[name].value = 0.0
            keys[name].keyframe_insert("value", frame=1)

    def blend_keys(frame, active, value=1.0):
        for name in sk_names:
            if name not in keys:
                continue
            keys[name].value = value if name == active else 0.0
            keys[name].keyframe_insert("value", frame=frame)

    # Segment schedule
    schedule = [
        (1,   60,  "Basis"),
        (60,  120, "SK_Wide"),
        (120, 180, "SK_Tight"),
        (180, 240, "SK_Trans"),
        (240, 300, "Basis"),
    ]
    for (f_start, f_end, key_name) in schedule:
        blend_keys(f_start, key_name, 1.0)
        blend_keys(f_end,   key_name, 1.0)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[Holoflow] Viewport render complete → {OUTPUT_PATH}.mp4")
