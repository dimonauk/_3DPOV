"""
record.py — Viewport animation render for the LBO Eigenmodes tutorial.
Runs AFTER blueprint.py. Animates each shape key from Basis → peak → Basis
in sequence, cycling emission colour per mode. Renders to:
  public/library/videos/scripting/python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr/viewport.mp4

Duration: ~8 s at 24 fps = 192 frames (8 modes × 24 frames each).
"""

import bpy
import math

FRAMES_PER_MODE = 24     # one full inhale-exhale cycle per mode
FPS             = 24
OUTPUT_PATH     = "//public/library/videos/scripting/python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr/viewport"

PALETTE = [
    (0.95, 0.30, 0.10), (0.20, 0.60, 0.95), (0.15, 0.90, 0.45),
    (0.90, 0.75, 0.10), (0.75, 0.25, 0.90), (0.95, 0.55, 0.10),
    (0.10, 0.80, 0.80), (0.95, 0.20, 0.60),
]

scene = bpy.context.scene
scene.render.fps = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format     = "MPEG4"
scene.render.ffmpeg.codec      = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath = OUTPUT_PATH

obj = bpy.data.objects.get("poi_head")
if obj is None or obj.data.shape_keys is None:
    raise RuntimeError("Run blueprint.py first — poi_head with shape keys not found.")

keys = obj.data.shape_keys.key_blocks
# keys[0] = Basis, keys[1..8] = Mode_01..Mode_08
mode_keys = [k for k in keys if k.name.startswith("Mode_")]
K = len(mode_keys)

total_frames = K * FRAMES_PER_MODE
scene.frame_start = 1
scene.frame_end   = total_frames

mat   = obj.data.materials[0]
nodes = mat.node_tree.nodes
emit  = next(n for n in nodes if n.type == "EMISSION")

# Zero all shape keys at frame 1
for k in mode_keys:
    k.value = 0.0
    k.keyframe_insert("value", frame=1)

for m, sk in enumerate(mode_keys):
    f_start  = m * FRAMES_PER_MODE + 1
    f_peak   = f_start + FRAMES_PER_MODE // 2
    f_end    = (m + 1) * FRAMES_PER_MODE

    # Shape-key inhale
    sk.value = 0.0;  sk.keyframe_insert("value", frame=f_start)
    sk.value = 1.0;  sk.keyframe_insert("value", frame=f_peak)
    sk.value = 0.0;  sk.keyframe_insert("value", frame=f_end)

    # Emission colour matches the palette entry for this mode
    r, g, b = PALETTE[m % len(PALETTE)]
    col_input = emit.inputs["Color"]
    col_input.default_value = (r, g, b, 1.0)
    col_input.keyframe_insert("default_value", frame=f_start)
    col_input.keyframe_insert("default_value", frame=f_end)

# Slow camera orbit (360° over full duration)
cam = scene.camera
cam.rotation_mode = "XYZ"
cam.rotation_euler[2] = 0.0
cam.keyframe_insert("rotation_euler", frame=1)
cam.rotation_euler[2] = math.tau
cam.keyframe_insert("rotation_euler", frame=total_frames)
# Set LINEAR interpolation so orbit is uniform speed
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written.")
