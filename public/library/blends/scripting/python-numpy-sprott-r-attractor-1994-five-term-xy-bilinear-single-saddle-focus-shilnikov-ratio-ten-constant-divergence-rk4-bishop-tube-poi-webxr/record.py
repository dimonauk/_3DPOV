"""
record.py — Viewport animation for Sprott R Attractor
======================================================
5-second orbital render morphing through shape keys.
Output: public/library/videos/scripting/<slug>/viewport.mp4
Run AFTER blueprint.py in the Blender Scripting workspace.
"""

import bpy
import math

FPS        = 30
DURATION_S = 5
N_FRAMES   = FPS * DURATION_S   # 150

SLUG = (
    "python-numpy-sprott-r-attractor-1994-five-term-xy-bilinear-"
    "single-saddle-focus-shilnikov-ratio-ten-constant-divergence-"
    "rk4-bishop-tube-poi-webxr"
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

# ── Camera ──────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

pivot = bpy.data.objects.new("CamPivot", None)
bpy.context.collection.objects.link(pivot)
pivot.location = (0, 0, 0)

cam_obj.parent   = pivot
cam_obj.location = (0, -14, 4)   # R orbit is moderate — pulled back from N/S
track = cam_obj.constraints.new("TRACK_TO")
track.target      = pivot
track.track_axis  = "TRACK_NEGATIVE_Z"
track.up_axis     = "UP_Y"

# 90° orbit over full clip
for frame, angle in [(1, 0.0), (N_FRAMES, 90.0)]:
    pivot.rotation_euler.z = math.radians(angle)
    pivot.keyframe_insert("rotation_euler", index=2, frame=frame)

# ── Lighting ─────────────────────────────────────────────────────────────────
sun_data        = bpy.data.lights.new("RecordSun", "SUN")
sun_data.energy = 4.0
sun_obj         = bpy.data.objects.new("RecordSun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (0.8, 0.3, 0.5)

fill_data        = bpy.data.lights.new("RecordFill", "AREA")
fill_data.energy = 60.0
fill_obj         = bpy.data.objects.new("RecordFill", fill_data)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location      = (8, -6, 6)
fill_obj.rotation_euler = (-0.8, 0.6, 0.4)

# ── World (dark) ──────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.8
scene.world = world

# ── Renderer (EEVEE Next for speed) ──────────────────────────────────────────
scene.render.engine                        = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom                      = True
scene.eevee.bloom_threshold                = 0.28
scene.eevee.bloom_intensity                = 0.25
scene.eevee.taa_render_samples             = 64

# ── Shape-key animation (morph Basis → SK_HighA mid-clip) ───────────────────
poi = bpy.data.objects.get("SprottR_Poi")
if poi and poi.data.shape_keys:
    keys = poi.data.shape_keys.key_blocks
    for sk in keys:
        sk.value = 0.0
    if "SK_HighA" in keys:
        sk_hi = keys["SK_HighA"]
        sk_hi.value = 0.0
        sk_hi.keyframe_insert("value", frame=1)
        sk_hi.value = 1.0
        sk_hi.keyframe_insert("value", frame=N_FRAMES // 2)
        sk_hi.value = 0.0
        sk_hi.keyframe_insert("value", frame=N_FRAMES)

bpy.ops.render.render(animation=True)
print("Sprott R viewport render complete →", OUTPUT_PATH)
