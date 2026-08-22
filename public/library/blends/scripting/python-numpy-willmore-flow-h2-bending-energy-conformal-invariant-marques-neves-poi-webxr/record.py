# SPDX-License-Identifier: CC0-1.0
"""
record.py — Viewport render for Willmore Flow tutorial
=======================================================
Holoflow Studio · Blender 5.1

Animates shape-key value from Basis → SK_Step120 over 90 frames,
renders to: public/library/videos/scripting/
  python-numpy-willmore-flow-h2-bending-energy-conformal-invariant-marques-neves-poi-webxr/
  viewport.mp4

Run AFTER blueprint.py (assumes Willmore_Torus object + shape keys exist).
Requires: FFmpeg in PATH for mp4 output.
"""

import bpy
import os

# ── Output path ───────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-willmore-flow-h2-bending-energy-conformal-invariant-marques-neves-poi-webxr"
)
OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..",
    "public", "library", "videos", "scripting", SLUG,
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Scene ─────────────────────────────────────────────────────────────────────
scene   = bpy.context.scene
FRAMES  = 90

scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_data.lens = 50.0
cam_obj.location = (3.5, -3.5, 2.0)
import mathutils
cam_obj.rotation_euler = mathutils.Euler((1.1, 0.0, 0.78), "XYZ")
scene.camera = cam_obj

# ── Eevee lighting ────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
sun_data   = bpy.data.lights.new("Sun", type="SUN")
sun_obj    = bpy.data.objects.new("Sun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = mathutils.Euler((0.6, 0.0, 0.4), "XYZ")
sun_data.energy = 3.0
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)  # near-black

# ── Animate shape-key blend from Basis → SK_Step120 ──────────────────────────
obj = bpy.data.objects.get("Willmore_Torus")
if obj is None:
    raise RuntimeError("Run blueprint.py first — Willmore_Torus not found.")

keys = obj.data.shape_keys.key_blocks
sk_names = ["SK_Step015", "SK_Step040", "SK_Step070", "SK_Step120"]

# Frame mapping: each shape key fades in then out as we scrub through steps
# Basis: frames 1-1  (starting pose, always 1.0 at frame 1)
# We blend through each SK sequentially
# Frame 1 → 25: Basis → SK_Step015
# Frame 25 → 50: SK_Step015 → SK_Step040
# Frame 50 → 65: SK_Step040 → SK_Step070
# Frame 65 → 90: SK_Step070 → SK_Step120

def _insert(key, frame, value):
    key.value = value
    key.keyframe_insert("value", frame=frame)

# Reset all to 0
for sk in keys:
    sk.value = 0.0

# SK_Step015 fades in 1-25, stays 25, fades out 25-50
k015 = keys["SK_Step015"]
_insert(k015, 1, 0.0)
_insert(k015, 25, 1.0)
_insert(k015, 50, 0.0)

# SK_Step040 fades in 25-50, fades out 50-65
k040 = keys["SK_Step040"]
_insert(k040, 25, 0.0)
_insert(k040, 50, 1.0)
_insert(k040, 65, 0.0)

# SK_Step070 fades in 50-65, fades out 65-80
k070 = keys["SK_Step070"]
_insert(k070, 50, 0.0)
_insert(k070, 65, 1.0)
_insert(k070, 80, 0.0)

# SK_Step120 fades in 65-90 and holds
k120 = keys["SK_Step120"]
_insert(k120, 65, 0.0)
_insert(k120, 90, 1.0)

# Constant turntable rotation of the object
obj.rotation_euler = mathutils.Euler((0.0, 0.0, 0.0), "XYZ")
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = mathutils.Euler((0.0, 0.0, 6.2832), "XYZ")   # 2π
obj.keyframe_insert("rotation_euler", frame=FRAMES)
for fcurve in obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Render ────────────────────────────────────────────────────────────────────
print(f"Rendering {FRAMES} frames → {OUTPUT_PATH}")
bpy.ops.render.render(animation=True)
print("✓ viewport.mp4 complete")
