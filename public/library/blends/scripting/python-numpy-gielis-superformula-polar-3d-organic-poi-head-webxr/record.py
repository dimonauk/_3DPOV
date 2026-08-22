"""
record.py — Viewport animation render for Gielis Superformula Poi  (Blender 5.1)
================================================================================
Prerequisite: run blueprint.py first so hf_superformula_poi exists in the scene.

Timeline (120 frames at 24 fps ≈ 5 s):
  F 0–10   : all shape-key weights at 0 (Basis — hexagonal blob)
  F 10–30  : ramp Starfish 0→1, all others 0
  F 30–50  : ramp Cross    0→1, Starfish 1→0
  F 50–70  : ramp Thorns   0→1, Cross    1→0
  F 70–90  : ramp Cube     0→1, Thorns   1→0
  F 90–110 : ramp back to Basis (all weights → 0)
  F 110–120: hold Basis

The object rotates 360° over the full 120 frames so every face angle is shown
during the morph.  Workbench (Solid) renderer used for deterministic single-pass
output with no ray-trace cost.
"""

import bpy
import os

# ── check scene ───────────────────────────────────────────────────────────────
OBJECT_NAME = "hf_superformula_poi"
if OBJECT_NAME not in bpy.data.objects:
    raise RuntimeError("Run blueprint.py first to create the superformula mesh.")

obj = bpy.data.objects[OBJECT_NAME]
keys = obj.data.shape_keys.key_blocks

# Morph key names in order (skip "Basis" at index 0)
MORPH_NAMES = ["Starfish", "Cross", "Thorns", "Cube"]

# ── clear existing animation data on shape keys ────────────────────────────────
anim_data = obj.data.shape_keys.animation_data
if anim_data and anim_data.action:
    obj.data.shape_keys.animation_data_clear()

for k in MORPH_NAMES:
    keys[k].value = 0.0

# Helper: insert a value keyframe on a shape key at a given frame
def kf(key_name, frame, val):
    sc = bpy.context.scene
    sc.frame_set(frame)
    keys[key_name].value = val
    keys[key_name].keyframe_insert(data_path="value", frame=frame)


# ── keyframe the morph sequence ───────────────────────────────────────────────
# Each morph occupies 20-frame ramp-in then 20-frame cross-fade to next
TIMELINE = [
    ("Starfish", 10, 30, 30, 50),   # ramp-in: 10–30; ramp-out: 30–50
    ("Cross",    30, 50, 50, 70),
    ("Thorns",   50, 70, 70, 90),
    ("Cube",     70, 90, 90, 110),
]

for name, f_start_in, f_full, f_start_out, f_out in TIMELINE:
    kf(name, f_start_in,  0.0)
    kf(name, f_full,      1.0)
    kf(name, f_start_out, 1.0)
    kf(name, f_out,       0.0)

# Set interpolation to BEZIER for smooth easing on all generated curves
sk_action = obj.data.shape_keys.animation_data.action
for fc in sk_action.fcurves:
    for pt in fc.keyframe_points:
        pt.interpolation = "BEZIER"
        pt.easing = "AUTO"

# ── rotation keyframes ────────────────────────────────────────────────────────
import math

obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path="rotation_euler", frame=1)
obj.rotation_euler = (0, 0, math.tau)
obj.keyframe_insert(data_path="rotation_euler", frame=120)

rot_action = obj.animation_data.action
for fc in rot_action.fcurves:
    for pt in fc.keyframe_points:
        pt.interpolation = "LINEAR"

# ── render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 120
scene.render.fps  = 24

scene.render.engine                    = "BLENDER_WORKBENCH"
scene.display.shading.light            = "STUDIO"
scene.display.shading.color_type       = "VERTEX"
scene.display.shading.show_cavity      = True
scene.display.shading.cavity_type      = "BOTH"

vid_dir = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "videos", "scripting",
    "python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr",
)
os.makedirs(vid_dir, exist_ok=True)

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x              = 1280
scene.render.resolution_y              = 720
scene.render.resolution_percentage     = 100

out_path = os.path.join(vid_dir, "viewport.mp4")
scene.render.filepath = out_path

bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[superformula/record] ✓ wrote {out_path}")
