"""
record.py — Miura-Ori Poi Disc viewport render
==============================================
Run from Blender's scripting panel AFTER blueprint.py has executed.
Outputs: public/library/videos/scripting/
         python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr/
         viewport.mp4
Duration: 10 s @ 30 fps = 300 frames
Technique: EEVEE_NEXT, 1920×1080, Bloom + GTAO ambient occlusion.

Sequence:
  0–79   (0.0–2.6 s) — turntable 360°, flat Basis state, slow arc
  80–149 (2.7–5.0 s) — camera dips to 10° elevation, fold begins (SK_ThirdFold ramps 0→1)
  150–209 (5.0–7.0 s) — SK_ThirdFold → SK_TwoThirdFold (panels clearly tented)
  210–269 (7.0–9.0 s) — SK_TwoThirdFold → SK_Compact (sheet almost closed)
  270–299 (9.0–10.0 s)— hold compact, final orbit reveal
"""

import bpy, math, os

# ─── PATHS ─────────────────────────────────────────────────────────────────────
SLUG   = "python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr"
OUTDIR = bpy.path.abspath(
    f"//../../videos/scripting/{SLUG}/"
)
os.makedirs(OUTDIR, exist_ok=True)
OUTPUT = os.path.join(OUTDIR, "viewport")

# ─── RENDER SETTINGS ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine             = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x       = 1920
scene.render.resolution_y       = 1080
scene.render.fps                = 30
scene.frame_start               = 1
scene.frame_end                 = 300
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format      = "MPEG4"
scene.render.ffmpeg.codec       = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath           = OUTPUT

# EEVEE Next quality
eevee = scene.eevee
eevee.use_bloom                 = True
eevee.bloom_threshold           = 0.6
eevee.use_gtao                  = True
eevee.gtao_distance             = 0.30
eevee.taa_render_samples        = 64

# ─── CAMERA ────────────────────────────────────────────────────────────────────
if "RecordCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("RecordCamData")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["RecordCam"]

scene.camera = cam_obj
cam_obj.data.lens = 50.0

# ─── LIGHT ─────────────────────────────────────────────────────────────────────
if "RecordKey" not in bpy.data.objects:
    ld   = bpy.data.lights.new("RecordKeyData", "AREA")
    lo   = bpy.data.objects.new("RecordKey", ld)
    bpy.context.scene.collection.objects.link(lo)
else:
    lo = bpy.data.objects["RecordKey"]
lo.location = (1.2, -1.8, 2.0)
lo.data.energy  = 800.0
lo.data.size    = 0.6

# ─── OBJECT REFERENCE ──────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_miura_ori_poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first — hf_miura_ori_poi not found.")

sk = obj.data.shape_keys
keys = {k.name: k for k in sk.key_blocks}

def zero_keys():
    for k in sk.key_blocks:
        k.value = 0.0
    keys["Basis"].value = 1.0

# ─── ANIMATION HELPER ──────────────────────────────────────────────────────────
def lerp_key(key_name: str, frame_a: int, frame_b: int, val_a: float, val_b: float):
    key = keys[key_name]
    key.value = val_a
    key.keyframe_insert("value", frame=frame_a)
    key.value = val_b
    key.keyframe_insert("value", frame=frame_b)

def cam_orbit(frame: int, azimuth_deg: float, elevation_deg: float, radius: float = 1.4):
    az  = math.radians(azimuth_deg)
    el  = math.radians(elevation_deg)
    cam_obj.location = (
        radius * math.cos(el) * math.sin(az),
        -radius * math.cos(el) * math.cos(az),
        radius * math.sin(el),
    )
    # Point toward origin
    dx = -cam_obj.location[0]
    dy = -cam_obj.location[1]
    dz = -cam_obj.location[2]
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx**2+dy**2), -dz) if dz else math.pi/2,
        0.0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ─── KEYFRAMES ─────────────────────────────────────────────────────────────────
# Clear existing
for act in list(bpy.data.actions):
    if "Miura" in act.name:
        bpy.data.actions.remove(act)

zero_keys()

# Phase 1: 0–79 — 360° turntable at 35° elevation (flat Basis state)
for f in range(1, 81, 10):
    az = (f - 1) / 79 * 360
    cam_orbit(f, az, 35, 1.4)

# Phase 2: 80–149 — camera dips + ThirdFold morph in
for f in range(80, 150, 10):
    az = 360 + (f - 80) / 69 * 60  # continues orbit
    el = 35 - (f - 80) / 69 * 25   # dip to 10°
    cam_orbit(f, az, el, 1.4)
lerp_key("SK_ThirdFold", 80, 149, 0.0, 1.0)

# Phase 3: 150–209 — TwoThirdFold
lerp_key("SK_ThirdFold",    150, 209, 1.0, 0.0)
lerp_key("SK_TwoThirdFold", 150, 209, 0.0, 1.0)
for f in range(150, 210, 10):
    az = 420 + (f - 150) / 59 * 90
    cam_orbit(f, az, 12, 1.35)

# Phase 4: 210–269 — Compact morph
lerp_key("SK_TwoThirdFold", 210, 269, 1.0, 0.0)
lerp_key("SK_Compact",      210, 269, 0.0, 1.0)
for f in range(210, 270, 10):
    az = 510 + (f - 210) / 59 * 90
    cam_orbit(f, az, 20, 1.3)

# Phase 5: 270–300 — hold compact, final reveal orbit at high elevation
lerp_key("SK_Compact", 270, 300, 1.0, 1.0)
for f in range(270, 301, 10):
    az = 600 + (f - 270) / 30 * 45
    cam_orbit(f, az, 40, 1.5)

# ─── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] rendered to {OUTPUT}.mp4")
