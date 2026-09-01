"""
record.py — Viewport animation render for the Dadras Attractor entry.
Holoflow Studio / Blender 5.1

Run AFTER blueprint.py has been executed (the mesh object "hf_dadras_poi"
must exist in the scene).  This script:
  1. Configures EEVEE Next with bloom for the cobalt–amber emission tube.
  2. Sets a 300-frame 30 fps animation (10 s).
  3. Orbits the camera 240° around the attractor while interpolating shape keys:
       frames   1– 60  Basis      (canonical 4-scroll)
       frames  60–120  SK_TwoScroll
       frames 120–180  SK_Compact
       frames 180–240  SK_WidePinch
       frames 240–300  Basis      (return)
  4. Renders to public/library/videos/scripting/<slug>/viewport.mp4

The output path is relative to the blend file's directory; adjust if running
headless from a different working directory.
"""

import bpy
import math
import os

# ── Output path ───────────────────────────────────────────────────────────────
SLUG = "python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR  = os.path.join(SCRIPT_DIR, "..", "..", "..", "..", "videos", "scripting", SLUG)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(VIDEO_DIR, "viewport")   # Blender appends .mp4

# ── Render settings ───────────────────────────────────────────────────────────
FPS     = 30
N_FRAMES = 300   # 10 s at 30 fps

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.engine            = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format     = 'MPEG4'
scene.render.ffmpeg.codec      = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.filepath           = OUTPUT_PATH

# EEVEE bloom — brings out the emission gradient
eevee = scene.eevee
eevee.use_bloom          = True
eevee.bloom_threshold    = 0.35
eevee.bloom_intensity    = 0.20
eevee.bloom_radius       = 4.0

# ── Camera ────────────────────────────────────────────────────────────────────
CAM_DIST = 6.0    # world units from origin
CAM_ELEV = 30.0   # degrees above horizontal

if "Camera" not in bpy.data.objects:
    bpy.ops.object.camera_add()
cam_ob = bpy.data.objects["Camera"]
scene.camera = cam_ob

# ── Shape-key animation ────────────────────────────────────────────────────────
ob = bpy.data.objects.get("hf_dadras_poi")
if ob is None:
    raise RuntimeError("Run blueprint.py first — 'hf_dadras_poi' not found.")

key_block = ob.data.shape_keys
if key_block is None:
    raise RuntimeError("No shape keys found on hf_dadras_poi.")

shape_names = [kb.name for kb in key_block.key_blocks]

# Zero all shape keys at every keyframe window
def zero_all(frame):
    for kb in key_block.key_blocks:
        kb.value = 0.0
        kb.keyframe_insert("value", frame=frame)

# Segment: (start_fr, end_fr, active_key_name)
segments = [
    (1,   60,  "Basis"),
    (60,  120, "SK_TwoScroll"),
    (120, 180, "SK_Compact"),
    (180, 240, "SK_WidePinch"),
    (240, 300, "Basis"),
]

for (f_start, f_end, key_name) in segments:
    if key_name not in shape_names:
        continue
    zero_all(f_start)
    kb = key_block.key_blocks[key_name]
    kb.value = 1.0
    kb.keyframe_insert("value", frame=f_start)
    kb.keyframe_insert("value", frame=f_end)

# Smooth interpolation on all shape-key fcurves
if key_block.animation_data and key_block.animation_data.action:
    for fc in key_block.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── Camera orbit keyframes ────────────────────────────────────────────────────
START_AZ = 0.0    # degrees
END_AZ   = 240.0  # total orbit

for fr in range(1, N_FRAMES + 1):
    t   = (fr - 1) / (N_FRAMES - 1)
    az  = math.radians(START_AZ + t * END_AZ)
    el  = math.radians(CAM_ELEV)
    cam_ob.location.x = CAM_DIST * math.cos(az) * math.cos(el)
    cam_ob.location.y = CAM_DIST * math.sin(az) * math.cos(el)
    cam_ob.location.z = CAM_DIST * math.sin(el)
    # Point camera at origin
    direction = -cam_ob.location.normalized()
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_ob.rotation_euler = rot_quat.to_euler()
    cam_ob.keyframe_insert("location",        frame=fr)
    cam_ob.keyframe_insert("rotation_euler",  frame=fr)

# ── Lighting ─────────────────────────────────────────────────────────────────
# Remove existing lights and use world ambient only (emission tube is self-lit)
for obj in list(bpy.data.objects):
    if obj.type == 'LIGHT':
        bpy.data.objects.remove(obj, do_unlink=True)

world = scene.world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Strength"].default_value = 0.05
    bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)

# ── Render ────────────────────────────────────────────────────────────────────
print(f"[record.py] Rendering {N_FRAMES} frames → {OUTPUT_PATH}.mp4")
bpy.ops.render.render(animation=True)
print("[record.py] Done.")
