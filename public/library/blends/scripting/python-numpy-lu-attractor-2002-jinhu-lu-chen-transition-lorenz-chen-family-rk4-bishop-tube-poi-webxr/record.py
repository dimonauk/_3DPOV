# SPDX-License-Identifier: CC0-1.0
"""
record.py — viewport animation render for the Lü attractor tutorial
====================================================================
Holoflow Studio · Blender 5.1

Run this script AFTER blueprint.py has created the lu_attractor object.
It sets up a 5-second viewport render (150 frames at 30 fps) that shows
the shape-key journey through the attractor's parameter space:

  frames  0–50   Basis    (a=36, b=3, c=20) — canonical Lü
  frames 50–80   SK_LowC  (a=36, b=3, c=14) — limit cycle regime
  frames 80–110  SK_HighC (a=36, b=3, c=28) — dense chaos, Chen-like
  frames 110–150 SK_LowA  (a=20, b=3, c=20) — broader orbit

Output: public/library/videos/scripting/
        python-numpy-lu-attractor-2002-jinhu-lu-chen.../viewport.mp4
"""

import bpy
import os

# ── Output path ────────────────────────────────────────────────────────────────
SLUG = ("python-numpy-lu-attractor-2002-jinhu-lu-chen-"
        "transition-lorenz-chen-family-rk4-bishop-tube-poi-webxr")
OUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos", "scripting", SLUG
)
os.makedirs(OUT_DIR, exist_ok=True)

# ── Scene settings ─────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150           # 5 s at 30 fps
scene.render.fps  = 30
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# ── Get object ─────────────────────────────────────────────────────────────────
obj = bpy.data.objects.get("lu_attractor")
if obj is None:
    raise RuntimeError("Run blueprint.py first — lu_attractor object not found.")

kb = obj.data.shape_keys.key_blocks

def clear_keys(frame):
    """Zero all shape key values at this frame (no previous leakage)."""
    for k in kb:
        k.value = 0.0
        k.keyframe_insert("value", frame=frame)

def set_key(name, val, frame):
    kb[name].value = val
    kb[name].keyframe_insert("value", frame=frame)


# ── Keyframes ──────────────────────────────────────────────────────────────────
# Frame 1: pure Basis
clear_keys(1)

# Frame 50: begin blending to SK_LowC
clear_keys(50)

# Frame 65: SK_LowC fully active (limit cycle)
clear_keys(65)
set_key("SK_LowC", 1.0, 65)

# Frame 85: transition to SK_HighC
clear_keys(85)
set_key("SK_HighC", 1.0, 85)

# Frame 110: pure SK_HighC
clear_keys(110)
set_key("SK_HighC", 1.0, 110)

# Frame 125: blending to SK_LowA
clear_keys(125)
set_key("SK_LowA", 1.0, 125)

# Frame 150: SK_LowA settled
clear_keys(150)
set_key("SK_LowA", 1.0, 150)

# ── Spin object continuously (one full revolution over 150 frames) ─────────────
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0, 0, 6.2832)   # 2π
obj.keyframe_insert("rotation_euler", frame=150)
for fc in obj.animation_data.action.fcurves:
    if fc.data_path == "rotation_euler" and fc.array_index == 2:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# ── Camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location       = (0.0, -0.35, 0.0)
cam_obj.rotation_euler = (1.5707963, 0.0, 0.0)
cam_data.lens          = 50
scene.camera           = cam_obj

# ── World colour for black background ──────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.05, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
scene.world = world

print(f"Record configured → {scene.render.filepath}")
print("Run: bpy.ops.render.render(animation=True)")
