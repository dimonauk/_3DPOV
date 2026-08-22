# =============================================================================
# record.py — Viewport animation for the Menger Sponge poi head
# Blender 5.1  |  Run AFTER blueprint.py has been executed in the same session.
#
# WHAT IT DOES
#   Renders a 150-frame (5-second @ 30fps) OpenGL viewport animation showing:
#     • Frames 1–60:   Static display — sponge slowly rotates, revealing tunnels
#     • Frames 61–100: Shape-key SK_Exploded blends in (cubes separating)
#     • Frames 101–150: Shape-key blends back out, full rotation continues
#
#   Output: public/library/videos/scripting/
#           python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr/
#           viewport.mp4
# =============================================================================

import os
import bpy

# ── Output path ───────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.normpath(os.path.join(
    bpy.path.abspath("//"),
    "../../videos/scripting/"
    "python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr/",
))
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── Scene settings ────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = 150
scn.render.fps  = 30
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "PERC_LOSSLESS"
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080
scn.render.filepath      = OUTPUT_MP4

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -0.45, 0.12)
cam_obj.rotation_euler = (1.48, 0.0, 0.0)
scn.camera = cam_obj

# ── Lighting ──────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05
bpy.context.scene.world = world

for name, loc, energy, colour in [
    ("Key",  ( 0.25, -0.30, 0.30), 8.0, (0.9, 0.9, 1.0)),
    ("Fill", (-0.25,  0.20, 0.20), 3.0, (0.6, 0.7, 1.0)),
    ("Rim",  ( 0.0,   0.30, 0.0 ), 5.0, (1.0, 0.6, 0.4)),
]:
    ld = bpy.data.lights.new(name, "POINT")
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    bpy.context.collection.objects.link(lo)
    lo.location = loc

# ── Keyframe rotation ─────────────────────────────────────────────────────────
obj = bpy.data.objects.get("menger_sponge")
if obj is None:
    raise RuntimeError("Run blueprint.py first — menger_sponge object not found.")

import math

# Full slow rotation over 150 frames (one turn)
for frame, angle in [(1, 0.0), (150, math.tau)]:
    scn.frame_set(frame)
    obj.rotation_euler = (0.0, angle, 0.0)
    obj.keyframe_insert("rotation_euler")

# Shape-key animation: SK_Exploded pulses in and out
sk = obj.data.shape_keys.key_blocks["SK_Exploded"]
for frame, val in [(1, 0.0), (60, 0.0), (100, 1.0), (150, 0.0)]:
    scn.frame_set(frame)
    sk.value = val
    sk.keyframe_insert("value")

# ── Render ────────────────────────────────────────────────────────────────────
scn.frame_set(1)
bpy.ops.render.opengl(animation=True)
print(f"Viewport animation written to {OUTPUT_MP4}")
