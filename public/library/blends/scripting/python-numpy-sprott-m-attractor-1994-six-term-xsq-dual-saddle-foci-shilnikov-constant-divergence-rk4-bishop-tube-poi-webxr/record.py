"""
record.py — Sprott M Attractor viewport render
===============================================
Run after blueprint.py.  Outputs:
  public/library/videos/scripting/
    python-numpy-sprott-m-attractor.../viewport.mp4

Timeline: 300 frames @ 30 fps = 10 seconds
  F0–80:   orbit rotates 0→120°, Basis shape
  F80–160: Basis → SK_WeakA morph (fixed-point migration)
  F160–220: SK_WeakA → SK_HighC morph (orbit broadens)
  F220–300: SK_HighC → Basis return + full 360° spin completes
"""

import bpy
import os

# ── output path ───────────────────────────────────────────────────────────────
REPO_ROOT  = bpy.path.abspath("//../../../../..")   # adjust if run from blend dir
OUTPUT_DIR = os.path.join(
    REPO_ROOT,
    "public", "library", "videos", "scripting",
    "python-numpy-sprott-m-attractor-1994-six-term-xsq-dual-saddle-foci-"
    "shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

SCENE = bpy.context.scene
OBJ   = bpy.data.objects.get("hf_sprott_m_poi")

if OBJ is None:
    raise RuntimeError("Run blueprint.py first — 'hf_sprott_m_poi' not found.")

# ── render settings ───────────────────────────────────────────────────────────
SCENE.render.engine          = 'BLENDER_EEVEE_NEXT'
SCENE.render.resolution_x    = 1920
SCENE.render.resolution_y    = 1080
SCENE.render.fps             = 30
SCENE.frame_start            = 1
SCENE.frame_end              = 300
SCENE.render.image_settings.file_format = 'FFMPEG'
SCENE.render.ffmpeg.format   = 'MPEG4'
SCENE.render.ffmpeg.codec    = 'H264'
SCENE.render.ffmpeg.constant_rate_factor = 'MEDIUM'
SCENE.render.filepath        = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── EEVEE bloom ───────────────────────────────────────────────────────────────
eevee = SCENE.eevee
eevee.use_bloom            = True
eevee.bloom_threshold      = 0.30
eevee.bloom_intensity      = 0.22
eevee.bloom_radius         = 4.0

# ── camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
SCENE.collection.objects.link(cam_obj)
SCENE.camera = cam_obj
cam_obj.location = (0.0, -0.30, 0.06)
cam_obj.rotation_euler = (1.4835298641951802, 0.0, 0.0)   # ≈85° tilt

# ── world (dark void) ─────────────────────────────────────────────────────────
SCENE.world.use_nodes = True
bg = SCENE.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.008, 0.008, 0.012, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# ── shape-key animation ───────────────────────────────────────────────────────
def insert_sk_value(block_name, frame, value):
    sk = OBJ.data.shape_keys.key_blocks.get(block_name)
    if sk:
        sk.value = value
        sk.keyframe_insert("value", frame=frame)

# Basis → SK_WeakA  (F80→160)
insert_sk_value("SK_WeakA",  80, 0.0)
insert_sk_value("SK_WeakA", 160, 1.0)
# SK_WeakA → SK_HighC  (F160→220)
insert_sk_value("SK_WeakA", 220, 0.0)
insert_sk_value("SK_HighC", 160, 0.0)
insert_sk_value("SK_HighC", 220, 1.0)
# SK_HighC → Basis return  (F220→300)
insert_sk_value("SK_HighC", 300, 0.0)

# ── object rotation animation (full 360° over 300 frames) ────────────────────
OBJ.rotation_euler = (0.0, 0.0, 0.0)
OBJ.keyframe_insert("rotation_euler", frame=1)
OBJ.rotation_euler = (0.0, 0.0, 6.283185307179586)   # 2π
OBJ.keyframe_insert("rotation_euler", frame=300)

# set to LINEAR interpolation so spin is constant
for fc in OBJ.animation_data.action.fcurves:
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[SprottM record] written → {SCENE.render.filepath}")
