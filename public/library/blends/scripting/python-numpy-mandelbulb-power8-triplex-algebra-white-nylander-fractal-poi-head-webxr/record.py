"""
record.py — Mandelbulb Power-8 Poi Head  (Blender 5.1)
=======================================================
Viewport animation: the sphere shape-key morphs into the Mandelbulb
over frames 1→60, holds for 30 frames, then morphs back.  A camera
orbits from front to three-quarter in 90 frames.  Renders to
public/library/videos/scripting/<slug>/viewport.mp4  (H.264, 30 fps).

Run from Blender's Scripting workspace after blueprint.py has been
executed in the same session (the object "hf_mandelbulb" must exist).
"""

import bpy
import math
import os

SLUG      = "hf_mandelbulb"
FPS       = 30
DURATION  = 90          # total frames
CAMERA_R  = 0.35        # orbit radius (metres)
OUT_DIR   = os.path.join(
    os.path.dirname(__file__),
    "../../..", "videos", "scripting",
    "python-numpy-mandelbulb-power8-triplex-algebra-"
    "white-nylander-fractal-poi-head-webxr",
)

# ── Verify object exists ─────────────────────────────────────────────
ob = bpy.data.objects.get(SLUG)
if ob is None:
    raise RuntimeError(f"Object '{SLUG}' not found — run blueprint.py first.")

sk_bulb = ob.data.shape_keys.key_blocks.get("Mandelbulb")
if sk_bulb is None:
    raise RuntimeError("Shape key 'Mandelbulb' not found on the object.")

# ── Scene settings ───────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps          = FPS
scene.frame_start         = 1
scene.frame_end           = DURATION
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format            = "MPEG4"
scene.render.ffmpeg.codec             = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

os.makedirs(OUT_DIR, exist_ok=True)
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# ── Shape-key animation: sphere → bulb → sphere ──────────────────────
sk_bulb.value = 0.0
sk_bulb.keyframe_insert(data_path="value", frame=1)

sk_bulb.value = 1.0
sk_bulb.keyframe_insert(data_path="value", frame=60)

sk_bulb.value = 1.0
sk_bulb.keyframe_insert(data_path="value", frame=75)

sk_bulb.value = 0.0
sk_bulb.keyframe_insert(data_path="value", frame=DURATION)

for fc in ob.data.shape_keys.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ── Camera orbit ─────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

for f in range(1, DURATION + 1):
    # Arc from front (angle=0) to three-quarter (angle=π/2) view
    angle = (f - 1) / (DURATION - 1) * math.pi * 0.5
    cam_ob.location = (
        CAMERA_R * math.sin(angle),
        -CAMERA_R * math.cos(angle),
        CAMERA_R * 0.35,
    )
    # Always point toward the origin (poi head)
    direction = -cam_ob.location.copy().normalized()
    cam_ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam_ob.keyframe_insert(data_path="location",       frame=f)
    cam_ob.keyframe_insert(data_path="rotation_euler", frame=f)

# ── Lighting ─────────────────────────────────────────────────────────
world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("RecordWorld")
    scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.3

# ── Render (OpenGL viewport render — no GPU required) ────────────────
bpy.ops.render.opengl(animation=True)
print(f"[record] viewport.mp4 → {scene.render.filepath}")
