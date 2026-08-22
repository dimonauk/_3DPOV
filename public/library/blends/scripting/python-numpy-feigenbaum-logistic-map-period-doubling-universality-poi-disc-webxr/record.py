"""
record.py — Viewport render for Feigenbaum Bifurcation Disc
============================================================
Outputs: public/library/videos/scripting/
           python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr/
           viewport.mp4

Run from within the .blend (Text Editor → Run Script) or via:
    blender hf_feigenbaum_poi.blend --background --python record.py

The animation has three acts (150 frames at 30 fps = 5 s):
  Act 1 (frames  1-50)  — slow camera orbit, Basis shape (full diagram)
  Act 2 (frames 51-120) — shape keys animate in sequence, camera holds
  Act 3 (frames 121-150)— return to Basis, camera pulls back

Each shape key crossfades over 10 frames via value animation.
The disc is lit by two area lamps — cobalt side and amber fill — matching
the vertex colour palette.
"""

import bpy
import math

# ── Output path ──────────────────────────────────────────────────────────────
VIDEO_OUT = "//../../videos/scripting/" \
    "python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr/" \
    "viewport.mp4"

# ── Scene setup ──────────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = 150
sc.render.fps  = 30

sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format               = "MPEG4"
sc.render.ffmpeg.codec                = "H264"
sc.render.ffmpeg.constant_rate_factor = "HIGH"
sc.render.filepath                    = VIDEO_OUT

sc.render.resolution_x = 1920
sc.render.resolution_y = 1080

# Use EEVEE Next for speed — disc has no glass or volumetrics
sc.render.engine = "BLENDER_EEVEE_NEXT"

# ── Find disc object ─────────────────────────────────────────────────────────
disc = bpy.data.objects.get("hf_feigenbaum_poi") or \
       bpy.data.objects.get("Feigenbaum_Bifurcation_Disc")
if disc is None:
    raise RuntimeError("Run blueprint.py first to generate the disc.")

keys = disc.data.shape_keys
KEY_NAMES = ["Basis", "SK_FirstBifurc", "SK_Cascade", "SK_ChaoticOnset", "SK_Period3Win"]

# ── Clear prior keyframes ────────────────────────────────────────────────────
if keys:
    for kb in keys.key_blocks:
        kb.value = 0.0
        if kb.id_data.animation_data:
            kb.id_data.animation_data_clear()

# ── Helper: insert shape-key value keyframe ──────────────────────────────────
def key_sk(name: str, frame: int, val: float) -> None:
    kb = keys.key_blocks.get(name)
    if kb is None:
        return
    kb.value = val
    kb.keyframe_insert("value", frame=frame)


# ── Act 1: Basis displayed, camera orbits (frames 1-50) ─────────────────────
for name in KEY_NAMES:
    key_sk(name, 1, 1.0 if name == "Basis" else 0.0)
    key_sk(name, 50, 1.0 if name == "Basis" else 0.0)

# ── Act 2: Cycle through zoomed shape keys (frames 51-120) ──────────────────
SEQUENCE = ["SK_FirstBifurc", "SK_Cascade", "SK_ChaoticOnset", "SK_Period3Win"]
fade_in = 8   # frames to crossfade in
hold    = 8   # frames to hold

cursor = 51
# First deactivate Basis
key_sk("Basis", cursor,        1.0)
key_sk("Basis", cursor + fade_in, 0.0)

for sk_name in SEQUENCE:
    fade_start = cursor
    fade_end   = cursor + fade_in
    hold_end   = fade_end + hold

    key_sk(sk_name, fade_start, 0.0)
    key_sk(sk_name, fade_end,   1.0)
    key_sk(sk_name, hold_end,   1.0)
    key_sk(sk_name, hold_end + fade_in, 0.0)
    cursor = hold_end

# ── Act 3: return to Basis (frames 121-150) ──────────────────────────────────
for name in KEY_NAMES:
    key_sk(name, 121, 1.0 if name == "Basis" else 0.0)
    key_sk(name, 150, 1.0 if name == "Basis" else 0.0)

# ── Camera ──────────────────────────────────────────────────────────────────
cam_obj = bpy.data.objects.get("Camera")
if cam_obj is None:
    cam_data = bpy.data.cameras.new("Camera")
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    sc.camera = cam_obj

# Isometric-ish view from above-angle to reveal the height structure
cam_obj.location        = (0.0, -1.1, 0.80)
cam_obj.rotation_euler  = (math.radians(52), 0.0, 0.0)
cam_obj.keyframe_insert("location",       frame=1)
cam_obj.keyframe_insert("rotation_euler", frame=1)

# Gentle clockwise arc during Act 1 (frames 1→50)
cam_obj.location        = (1.1 * math.sin(math.radians(60)),
                           -1.1 * math.cos(math.radians(60)), 0.75)
cam_obj.rotation_euler  = (math.radians(50), 0.0, math.radians(60))
cam_obj.keyframe_insert("location",       frame=50)
cam_obj.keyframe_insert("rotation_euler", frame=50)

# Hold during Act 2
cam_obj.location        = (0.7, -0.9, 0.90)
cam_obj.rotation_euler  = (math.radians(48), 0.0, math.radians(38))
cam_obj.keyframe_insert("location",       frame=120)
cam_obj.keyframe_insert("rotation_euler", frame=120)

# Pull back for Act 3
cam_obj.location        = (0.0, -1.3, 0.90)
cam_obj.rotation_euler  = (math.radians(50), 0.0, 0.0)
cam_obj.keyframe_insert("location",       frame=150)
cam_obj.keyframe_insert("rotation_euler", frame=150)

# ── Lighting ────────────────────────────────────────────────────────────────
def add_area(name, location, rotation, colour, energy):
    existing = bpy.data.objects.get(name)
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)
    ld   = bpy.data.lights.new(name, "AREA")
    ld.color  = colour
    ld.energy = energy
    ld.size   = 0.9
    lo   = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    lo.location       = location
    lo.rotation_euler = rotation

add_area("Lamp_Cobalt", (-1.2, -0.5, 1.4),
         (math.radians(40), math.radians(-20), math.radians(-30)),
         (0.06, 0.14, 0.95), 180)
add_area("Lamp_Amber",  ( 1.0,  0.8, 1.2),
         (math.radians(35), math.radians(15), math.radians(45)),
         (1.00, 0.70, 0.10), 120)

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("[record.py] viewport.mp4 written.")
