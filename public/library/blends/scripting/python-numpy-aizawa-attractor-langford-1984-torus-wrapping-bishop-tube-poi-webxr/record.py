"""
record.py — Viewport animation renderer for the Aizawa attractor tutorial.
===========================================================================
Run this script inside Blender (Text Editor → Run Script) AFTER blueprint.py
has been executed.  It morphs the shape key from Basis → SK_HighD over 5 s,
then holds for 2 s, then reverses — demonstrating the toroidal winding density
change as rotation rate d increases from 3.5 to 5.5.

Output: public/library/videos/scripting/
  python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr/
    viewport.mp4

Duration: 90 frames @ 30 fps = 3 seconds (tight, focused)
"""

import bpy, os

# ─── paths ────────────────────────────────────────────────────────────────────
REPO_ROOT = bpy.path.abspath("//").rstrip("/\\")
# If run outside a saved .blend, REPO_ROOT may be empty; fall back to CWD.
if not REPO_ROOT:
    REPO_ROOT = os.getcwd()

OUT_DIR = os.path.join(
    REPO_ROOT,
    "public", "library", "videos", "scripting",
    "python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr"
)
os.makedirs(OUT_DIR, exist_ok=True)
OUT_PATH = os.path.join(OUT_DIR, "viewport")   # Blender appends .mp4

# ─── scene / render settings ──────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine        = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.fps            = 30
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.filepath       = OUT_PATH

TOTAL_FRAMES = 90
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

# ─── lighting ─────────────────────────────────────────────────────────────────
# Dark environment so FLOAT_COLOR emission glows
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.01, 0.01, 0.02, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# ─── camera ──────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Position: orbit slightly above equator to see toroidal wrapping
cam_obj.location    = (0.0, -0.28, 0.06)
cam_obj.rotation_euler = (1.48, 0.0, 0.0)   # ≈85° tilt

# ─── shape key animation ──────────────────────────────────────────────────────
# Morph Basis → SK_HighD over frames 1..60, hold 60..90
poi = bpy.data.objects.get("hf_aizawa_poi")
if poi and poi.data.shape_keys:
    keys = poi.data.shape_keys.key_blocks
    basis   = keys.get("Basis")
    sk_hd   = keys.get("SK_HighD")

    if basis and sk_hd:
        # frame 1: Basis=1, SK_HighD=0
        scene.frame_set(1)
        basis.value   = 1.0;  basis.keyframe_insert("value", frame=1)
        sk_hd.value   = 0.0;  sk_hd.keyframe_insert("value", frame=1)

        # frame 60: Basis=0, SK_HighD=1
        scene.frame_set(60)
        basis.value   = 0.0;  basis.keyframe_insert("value", frame=60)
        sk_hd.value   = 1.0;  sk_hd.keyframe_insert("value", frame=60)

        # frame 90: hold
        scene.frame_set(90)
        basis.value   = 0.0;  basis.keyframe_insert("value", frame=90)
        sk_hd.value   = 1.0;  sk_hd.keyframe_insert("value", frame=90)

# slow object rotation — 0→120° over 90 frames
if poi:
    poi.rotation_euler = (0, 0, 0)
    poi.keyframe_insert("rotation_euler", frame=1)
    import math
    poi.rotation_euler = (0, 0, math.radians(120))
    poi.keyframe_insert("rotation_euler", frame=90)

# ─── render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Rendered → {OUT_PATH}.mp4")
