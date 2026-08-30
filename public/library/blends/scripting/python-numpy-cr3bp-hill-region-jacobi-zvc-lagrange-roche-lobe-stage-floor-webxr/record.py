"""
record.py — CR3BP Hill Regions: viewport-animation renderer
============================================================
Run AFTER blueprint.py.  Animates a morph from Basis → SK_L1Open → SK_L2Open
→ SK_Wide → Basis over 120 frames and renders viewport.mp4 via the
OpenGL viewport renderer.

Output: public/library/videos/scripting/
        python-numpy-cr3bp-hill-region-jacobi-zvc-lagrange-roche-lobe-stage-floor-webxr/
        viewport.mp4
Blender 5.1 · CC0
"""

import bpy, os, pathlib

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
SCRIPT_DIR = pathlib.Path(__file__).parent
VIDEO_DIR  = (SCRIPT_DIR.parents[3]
              / "videos" / "scripting"
              / "python-numpy-cr3bp-hill-region-jacobi-zvc-lagrange-roche-lobe-stage-floor-webxr")
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH = str(VIDEO_DIR / "viewport")   # Blender appends frame number + extension

# ── SCENE SETTINGS ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 120
scene.render.fps  = 24

# Find the mesh object
ob = bpy.data.objects.get("CR3BP_Hill_Floor")
if ob is None:
    raise RuntimeError("Run blueprint.py first — CR3BP_Hill_Floor not found.")

keys = ob.data.shape_keys
if keys is None:
    raise RuntimeError("Shape keys not found on CR3BP_Hill_Floor.")

basis    = keys.key_blocks["Basis"]
sk_l1    = keys.key_blocks["SK_L1Open"]
sk_l2    = keys.key_blocks["SK_L2Open"]
sk_wide  = keys.key_blocks["SK_Wide"]

# Reset all values to 0
for kb in keys.key_blocks:
    kb.value = 0.0

# ── KEYFRAME SCHEDULE ────────────────────────────────────────────────────────
# Frames 1-30   : Basis (closed Roche lobe)
# Frames 30-60  : morph to SK_L1Open (L1 neck opens)
# Frames 60-90  : morph to SK_L2Open (L2 escape route opens)
# Frames 90-120 : morph to SK_Wide   (full space accessible)
schedule = [
    (1,  basis,   1.0, sk_l1, 0.0, sk_l2, 0.0, sk_wide, 0.0),
    (30, basis,   1.0, sk_l1, 0.0, sk_l2, 0.0, sk_wide, 0.0),
    (60, basis,   0.0, sk_l1, 1.0, sk_l2, 0.0, sk_wide, 0.0),
    (90, basis,   0.0, sk_l1, 0.0, sk_l2, 1.0, sk_wide, 0.0),
    (120,basis,   0.0, sk_l1, 0.0, sk_l2, 0.0, sk_wide, 1.0),
]

for (fr, b, bv, l1, l1v, l2, l2v, w, wv) in schedule:
    scene.frame_set(fr)
    b.value  = bv;  b.keyframe_insert("value",  frame=fr)
    l1.value = l1v; l1.keyframe_insert("value", frame=fr)
    l2.value = l2v; l2.keyframe_insert("value", frame=fr)
    w.value  = wv;  w.keyframe_insert("value",  frame=fr)

# ── RENDER SETTINGS ──────────────────────────────────────────────────────────
scene.render.filepath         = OUTPUT_PATH
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format    = 'MPEG4'
scene.render.ffmpeg.codec     = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x     = 1280
scene.render.resolution_y     = 720
scene.render.resolution_percentage = 100

# Use EEVEE for speed
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

# Rotate camera slowly to show the 3-D topology
cam = scene.camera
for fr in (1, 120):
    scene.frame_set(fr)
    cam.rotation_euler.z = (fr - 1) / 119 * 0.6
    cam.keyframe_insert("rotation_euler", frame=fr)

# ── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print(f"[CR3BP] Viewport animation written to {VIDEO_DIR / 'viewport.mp4'}")
