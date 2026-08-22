"""
record.py — viewport animation render for edge_heat data bridge tutorial
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py (or open the saved .blend).  Animates the EMIT_STR value
from 0 → 3.2 → 0 over 72 frames at 24fps (3 seconds) so the edge glow pulses
on and off, demonstrating the live attribute connection with no bake required.

Output: public/library/videos/geometry-nodes/gn-store-named-attribute-shader-data-bridge/viewport.mp4
"""

import bpy
import math
import os

SLUG       = "hull_edge_heat"
OUT_DIR    = "public/library/videos/geometry-nodes/gn-store-named-attribute-shader-data-bridge/"
FRAMES     = 72
FPS        = 24
EMIT_PEAK  = 3.2

# ── Locate the hull panel and its material ────────────────────────────────────
panel = bpy.data.objects.get(SLUG)
if panel is None:
    raise RuntimeError("Run blueprint.py first to create the hull panel object.")

mat = panel.data.materials[0]
nt  = mat.node_tree
mul_node = next(
    (n for n in nt.nodes if n.type == "MATH" and n.operation == "MULTIPLY"),
    None,
)
if mul_node is None:
    raise RuntimeError("Could not find MULTIPLY node in material — check material wiring.")

# ── Animate EMIT_STR via keyframes on the Multiply node's second input ────────
# WHY keyframe the multiply node, not the Principled BSDF emission strength:
# The Principled BSDF Emission Strength socket is driven by the Multiply
# node's output (value = Fac × EMIT_PEAK).  Keying the Multiply factor
# directly is the cleanest single-node animation target.

scene = bpy.context.scene
scene.render.fps     = FPS
scene.frame_start    = 1
scene.frame_end      = FRAMES
scene.render.engine  = "BLENDER_EEVEE_NEXT"  # fast viewport-quality render

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100

abs_out = bpy.path.abspath("//" + OUT_DIR)
os.makedirs(abs_out, exist_ok=True)
scene.render.filepath = abs_out + "viewport"

# Keyframe: pulse from 0 → peak at frame 24 → 0 → peak at 48 → 0 at 72
pulse_frames = [
    (1,  0.0),
    (18, EMIT_PEAK),
    (36, 0.0),
    (54, EMIT_PEAK),
    (72, 0.0),
]
for frame, value in pulse_frames:
    scene.frame_set(frame)
    mul_node.inputs[1].default_value = value
    mul_node.inputs[1].keyframe_insert("default_value", frame=frame)

# Ease in/out on all keyframes
for fcu in mat.node_tree.animation_data.action.fcurves:
    for kfp in fcu.keyframe_points:
        kfp.interpolation = "SINUSOIDAL"

# ── Camera slow arc (optional) — rotate camera 15° around Z ──────────────────
cam = scene.camera
cam.keyframe_insert(data_path="location", frame=1)
cam.keyframe_insert(data_path="rotation_euler", frame=1)
# Rotate 15° around Z by frame 72 for a slow reveal
import mathutils
start_rot = mathutils.Euler(cam.rotation_euler)
scene.frame_set(FRAMES)
cam.rotation_euler[2] = math.radians(15)
cam.location = (
    cam.location.x * math.cos(math.radians(-15)) - cam.location.y * math.sin(math.radians(-15)),
    cam.location.x * math.sin(math.radians(-15)) + cam.location.y * math.cos(math.radians(-15)),
    cam.location.z,
)
cam.keyframe_insert(data_path="location", frame=FRAMES)
cam.keyframe_insert(data_path="rotation_euler", frame=FRAMES)
scene.frame_set(1)

# ── Render animation ─────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"✓  Viewport animation rendered to {abs_out}viewport.mp4")
