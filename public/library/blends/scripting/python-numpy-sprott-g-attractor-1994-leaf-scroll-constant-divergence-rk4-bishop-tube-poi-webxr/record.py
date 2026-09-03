"""
record.py — Viewport Animation Recorder for Sprott G Attractor
==============================================================
Outputs: public/library/videos/scripting/
           python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr/
             viewport.mp4

Pre-condition: blueprint.py has already been run; the file hf_sprott_g_poi.blend
is open (or run this script from within it via the Text Editor).

The recording animates the shape key Evaluation Time over 150 frames (5 s at 30 fps):
  Frames   1–30   : Basis (a=0.40 canonical leaf-scroll)
  Frames  31–60   : blend toward SK_LowA (stronger dissipation, tighter)
  Frames  61–90   : SK_LowA settled
  Frames  91–120  : blend toward SK_HighA (wider orbit)
  Frames 121–150  : SK_NearCons (near-conservative, large ring)

Viewport is set to Material Preview (SOLID with vertex colours) so the
cobalt→amber gradient is visible without a full Cycles render.
"""

import bpy

# ── OUTPUT PATH ──────────────────────────────────────────────────────────────────
OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-"
    "rk4-bishop-tube-poi-webxr/viewport.mp4"
)

# ── FRAME SETTINGS ───────────────────────────────────────────────────────────────
TOTAL_FRAMES = 150
FPS          = 30

# ── SCENE SETUP ──────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# Render to MP4 (H.264 in a QuickTime container)
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)

# ── VIEWPORT SHADING — Material Preview ──────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
                # Orbit view from slight elevation to show the leaf-scroll depth
                space.region_3d.view_distance = 18.0
                space.region_3d.view_rotation.x = 0.70  # ~45° tilt
                space.region_3d.view_rotation.z = 0.70
                break

# ── LOCATE THE TUBE OBJECT ────────────────────────────────────────────────────────
tube_obj = bpy.data.objects.get("hf_sprott_g_poi")
if tube_obj is None:
    raise RuntimeError("Run blueprint.py first — 'hf_sprott_g_poi' object not found.")

# ── KEYFRAME SHAPE KEY TRANSITIONS ───────────────────────────────────────────────
# Shape keys are driven by their individual .value (0 = off, 1 = fully blended).
# We cross-fade between them using paired insert_keyframe calls.
sk_block = tube_obj.data.shape_keys
if sk_block is None:
    raise RuntimeError("No shape keys found — run blueprint.py first.")

def get_sk(name):
    sk = sk_block.key_blocks.get(name)
    if sk is None:
        raise RuntimeError(f"Shape key '{name}' not found.")
    return sk

basis     = get_sk("Basis")
sk_low    = get_sk("SK_LowA")
sk_high   = get_sk("SK_HighA")
sk_near   = get_sk("SK_NearCons")

def set_and_key(sk, value, frame):
    sk.value = value
    sk.keyframe_insert("value", frame=frame)

# Frame 1: Basis fully on
set_and_key(basis,  1.0,  1)
set_and_key(sk_low, 0.0,  1)
set_and_key(sk_high, 0.0, 1)
set_and_key(sk_near, 0.0, 1)

# Frame 30→60: cross-fade Basis → SK_LowA
set_and_key(basis,  1.0, 30)
set_and_key(sk_low, 0.0, 30)
set_and_key(basis,  0.0, 60)
set_and_key(sk_low, 1.0, 60)
# Other keys stay off
set_and_key(sk_high, 0.0, 60)
set_and_key(sk_near, 0.0, 60)

# Frame 60–90: hold SK_LowA
set_and_key(sk_low, 1.0, 90)

# Frame 90→120: cross-fade SK_LowA → SK_HighA
set_and_key(sk_low,  1.0,  90)
set_and_key(sk_high, 0.0,  90)
set_and_key(sk_low,  0.0, 120)
set_and_key(sk_high, 1.0, 120)
set_and_key(sk_near, 0.0, 120)

# Frame 120→150: cross-fade SK_HighA → SK_NearCons
set_and_key(sk_high, 1.0, 120)
set_and_key(sk_near, 0.0, 120)
set_and_key(sk_high, 0.0, 150)
set_and_key(sk_near, 1.0, 150)

# ── RENDER ────────────────────────────────────────────────────────────────────────
print("[record.py] Rendering viewport.mp4 …")
bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[record.py] Done → {scene.render.filepath}")
