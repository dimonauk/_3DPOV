"""
record.py — Liu Attractor viewport animation renderer
======================================================
Run AFTER blueprint.py has built hf_liu_poi in the scene.
Outputs: public/library/videos/scripting/
           python-numpy-liu-attractor-2004-.../viewport.mp4

Usage:
  blender --background hf_liu_poi.blend --python record.py

The script animates a 360° orbit of the Liu attractor over 10 seconds
(300 frames at 30 fps), then renders to an MP4 via FFMPEG.
"""

import bpy, math

# ── SETTINGS ──────────────────────────────────────────────────────────────────
FPS          = 30
DURATION_S   = 10
N_FRAMES     = FPS * DURATION_S          # 300
OUTPUT_PATH  = ("//../../videos/scripting/"
                "python-numpy-liu-attractor-2004-lorenz-variant-x-squared-z-"
                "driving-z2-symmetry-constant-divergence-rk4-bishop-tube-poi-webxr/"
                "viewport")

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS

# Output: FFMPEG H.264 MP4
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath      = bpy.path.abspath(OUTPUT_PATH)

# ── CAMERA ────────────────────────────────────────────────────────────────────
# Add camera if not present
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# Place camera at a fixed distance on the XZ-plane (attractor is in Z-up space,
# but blueprint.py already rotated it to Y-up; we view from positive X)
cam_distance = 0.55        # metres — attractor fits in POI_R=0.09 m sphere
cam_ob.location = (cam_distance, 0.0, 0.0)
cam_ob.rotation_euler = (math.radians(90), 0.0, math.radians(90))

# Animate the attractor object rotating 360° around Z (world Y in glTF coords)
target = bpy.data.objects.get("hf_liu_poi")
if target is None:
    raise RuntimeError("hf_liu_poi not found — run blueprint.py first")

target.rotation_euler = (0, 0, 0)
target.keyframe_insert("rotation_euler", frame=1)
target.rotation_euler = (0, 0, math.radians(360))
target.keyframe_insert("rotation_euler", frame=N_FRAMES)

# Linear interpolation (no easing) for constant rotation speed
for fc in target.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── WORLD LIGHTING ────────────────────────────────────────────────────────────
# Minimal HDRI-style background — dark with subtle ambient
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg_node = world.node_tree.nodes["Background"]
bg_node.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
bg_node.inputs["Strength"].default_value = 0.5
scene.world = world

# ── RENDER ENGINE ─────────────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 16     # fast, still anti-aliased

# ── RENDER ────────────────────────────────────────────────────────────────────
print("[record.py] Rendering Liu attractor orbit animation …")
bpy.ops.render.render(animation=True)
print(f"[record.py] Done → {bpy.path.abspath(OUTPUT_PATH)}.mp4")
