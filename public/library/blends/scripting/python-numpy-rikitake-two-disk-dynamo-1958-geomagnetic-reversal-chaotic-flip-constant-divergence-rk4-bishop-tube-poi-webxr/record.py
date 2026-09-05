"""
record.py — Viewport animation for Rikitake Two-Disk Dynamo
============================================================
Output: public/library/videos/scripting/<slug>/viewport.mp4
Run AFTER blueprint.py in the Blender Scripting workspace.

The 10-second clip slowly orbits the camera while morphing the Basis
shape key into SK_HighA — the larger-coupling topology — then back,
conveying how the attractor's reversal geometry changes with coupling.
"""

import bpy
import math

FPS        = 30
DURATION_S = 10
N_FRAMES   = FPS * DURATION_S   # 300

SLUG = (
    "python-numpy-rikitake-two-disk-dynamo-1958-geomagnetic-reversal-"
    "chaotic-flip-constant-divergence-rk4-bishop-tube-poi-webxr"
)
OUTPUT_PATH = f"//public/library/videos/scripting/{SLUG}/viewport"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = OUTPUT_PATH

# ── Camera — slow 120° orbit, elevated to see the two-lobe geometry ──────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

pivot = bpy.data.objects.new("CamPivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0, 0, 0.4)   # slightly above origin — z* ≈ 5.70 * SCALE = 1.03

cam_obj.parent   = pivot
cam_obj.location = (0, -12, 3.0)
track = cam_obj.constraints.new("TRACK_TO")
track.target     = pivot
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

# 120° orbit so both lobes + the connecting arc are visible at some point
for frame, angle in [(1, -20.0), (N_FRAMES, 100.0)]:
    pivot.rotation_euler.z = math.radians(angle)
    pivot.keyframe_insert("rotation_euler", index=2, frame=frame)

for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape key morph — Basis → SK_HighA → Basis ───────────────────────────────
# Shows how larger coupling constant a changes the reversal period visually.
ob = bpy.data.objects.get("Rikitake_Poi")
if ob and ob.data.shape_keys:
    keys = ob.data.shape_keys.key_blocks
    if "SK_HighA" in keys:
        sk = keys["SK_HighA"]
        sk.value = 0.0
        sk.keyframe_insert("value", frame=1)
        sk.value = 1.0
        sk.keyframe_insert("value", frame=N_FRAMES // 2)
        sk.value = 0.0
        sk.keyframe_insert("value", frame=N_FRAMES)

# ── Lighting — three-point rig for poi head ───────────────────────────────────
sun_data        = bpy.data.lights.new("RecordSun", "SUN")
sun_data.energy = 3.5
sun_obj         = bpy.data.objects.new("RecordSun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), math.radians(-30), 0)

fill_data        = bpy.data.lights.new("RecordFill", "AREA")
fill_data.energy = 80.0
fill_data.size   = 4.0
fill_obj         = bpy.data.objects.new("RecordFill", fill_data)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location = (-4.0, 3.0, 2.0)

# ── World — near-black ground  ────────────────────────────────────────────────
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("RecordWorld")
    bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (
    0.012, 0.012, 0.016, 1.0
)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6

# ── Render engine ─────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"

print(f"record.py ready — {N_FRAMES} frames at {FPS} fps → {OUTPUT_PATH}.mp4")
