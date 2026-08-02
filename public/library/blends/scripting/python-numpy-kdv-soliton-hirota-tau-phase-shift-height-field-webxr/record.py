"""
record.py — Viewport animation render for KdV Soliton tutorial (Blender 5.1).
Outputs: public/library/videos/scripting/python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr/viewport.mp4

Run AFTER blueprint.py has been executed (mesh + shape keys must exist).
Duration: frames 1–150 (5 s at 30 fps).
Animation: shape-key values interpolated across the five snapshots so the
viewer watches the two solitons approach, collide, and separate with phase shift.
"""

import bpy
import numpy as np
import os

OUTPUT_DIR   = "//../../videos/scripting/python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr/"
OUTPUT_FILE  = "viewport"
MESH_NAME    = "hf_kdv_stage"
FRAME_COUNT  = 150
FPS          = 30
# time snapshots encoded into shape-key index (Basis + 5 keys → indices 1..5)
SK_TIMES     = [-5.0, -2.0, 0.0, 2.0, 5.0]

# ── Ensure output dir ────────────────────────────────────────────────────────
abs_dir = bpy.path.abspath(OUTPUT_DIR)
os.makedirs(abs_dir, exist_ok=True)

# ── Scene setup ──────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAME_COUNT
scene.render.fps  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = bpy.path.abspath(OUTPUT_DIR + OUTPUT_FILE)

# ── Camera position ──────────────────────────────────────────────────────────
if "RecordCam" not in bpy.data.objects:
    bpy.ops.object.camera_add(location=(0.0, -18.0, 8.0))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.rotation_euler = (np.radians(55), 0, 0)
else:
    cam = bpy.data.objects["RecordCam"]
scene.camera = cam

# ── World/environment ────────────────────────────────────────────────────────
scene.world = scene.world or bpy.data.worlds.new("RecordWorld")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.01, 0.01, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# ── EEVEE Next bloom for emissive mesh ───────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
eevee = scene.eevee
eevee.bloom_threshold   = 0.60
eevee.bloom_intensity   = 0.35
eevee.bloom_radius      = 5.0
eevee.use_bloom         = True

# ── Animate shape keys ───────────────────────────────────────────────────────
ob = bpy.data.objects.get(MESH_NAME)
if ob and ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks
    # Insert keyframes: ramp each shape key from 0 → 1 → 0 across its frame window
    windows = np.linspace(1, FRAME_COUNT, len(SK_TIMES) + 1)
    for ki, t_val in enumerate(SK_TIMES):
        sk_name = f"t={t_val:+.1f}"
        if sk_name not in kb:
            continue
        key = kb[sk_name]
        peak_frame = int((windows[ki] + windows[ki + 1]) / 2)
        for frame, val in [(int(windows[ki]), 0.0), (peak_frame, 1.0),
                           (int(windows[ki + 1]), 0.0)]:
            scene.frame_set(frame)
            key.value = val
            key.keyframe_insert("value")

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"✓ Viewport render → {bpy.path.abspath(OUTPUT_DIR + OUTPUT_FILE + '.mp4')}")
