"""
record.py — Viewport animation recording script for Gray-Scott Morphogenesis Poi
=================================================================================
Run this AFTER blueprint.py has created gs_morphogenesis_poi in the scene.
It animates the shape key values so the poi head morphs through all five
reaction-diffusion regimes over a 180-frame arc, renders with OpenGL, and
writes the output to the expected video directory.

Usage (Blender CLI):
    blender gs_morphogenesis_poi.blend --python record.py --background

Output: public/library/videos/scripting/
        python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr/
        viewport.mp4
"""

import bpy
import math

# ─── Parameters ──────────────────────────────────────────────────────────────
OBJ_NAME    = "gs_morphogenesis_poi"
FPS         = 30
TOTAL_FRAMES = 180    # 6 seconds at 30fps — enough for one full morph cycle
OUTPUT_PATH = "//../../videos/scripting/python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr/viewport"

# Regime shape key names (matches blueprint.py REGIMES[1:])
SK_NAMES = ["worm_stripes", "labyrinthine", "holes", "fingerprints"]

# Animation plan: morph through each SK over ~40 frames, then fade back to base
# Frame map: 0=base, 40=worm, 80=labyrinthine, 120=holes, 160=fingerprints, 180=base


def clear_keyframes(obj):
    if obj.data.shape_keys and obj.data.shape_keys.animation_data:
        obj.data.shape_keys.animation_data_clear()


def ease(t):
    """Smooth-step easing — cubic Hermite s(t) = 3t² − 2t³."""
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# ─── Scene setup ─────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = TOTAL_FRAMES

# Render settings — viewport OpenGL recording (Workbench, anti-aliased)
scene.render.engine = "BLENDER_WORKBENCH"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT_PATH

shading = scene.display.shading
shading.type = "MATERIAL"
shading.show_backface_culling = False

# ─── Camera ──────────────────────────────────────────────────────────────────

cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -2.0, 0.4)
cam_obj.rotation_euler = (math.radians(80), 0, 0)
cam_data.lens = 50
scene.camera = cam_obj

# ─── Lighting ────────────────────────────────────────────────────────────────

sun_data = bpy.data.lights.new("RecordSun", type="SUN")
sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(50), math.radians(30), 0)
sun_data.energy = 3.0

# Slow rotation of poi object to show all sides
obj = bpy.data.objects.get(OBJ_NAME)
if obj is None:
    raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path="rotation_euler", frame=1)
obj.rotation_euler = (0, 0, math.radians(360))
obj.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

# ─── Shape-key morph animation ───────────────────────────────────────────────

clear_keyframes(obj)
shape_keys = obj.data.shape_keys.key_blocks

# Segment the 180 frames: each SK gets 40 frames (including crossfade)
# Frame 0 → 40: base → worm_stripes
# Frame 40 → 80: worm_stripes → labyrinthine
# etc.

segment = TOTAL_FRAMES // len(SK_NAMES)   # 45 frames each

for sk in shape_keys:
    if sk.name == "Basis":
        continue
    sk.value = 0.0
    sk.keyframe_insert(data_path="value", frame=1)

for seg_idx, sk_name in enumerate(SK_NAMES):
    if sk_name not in shape_keys:
        continue
    sk = shape_keys[sk_name]
    f_start = 1 + seg_idx * segment
    f_peak  = f_start + segment // 2
    f_end   = f_start + segment

    sk.value = 0.0
    sk.keyframe_insert(data_path="value", frame=f_start)
    sk.value = 1.0
    sk.keyframe_insert(data_path="value", frame=f_peak)
    sk.value = 0.0
    sk.keyframe_insert(data_path="value", frame=f_end)

# ─── Render ──────────────────────────────────────────────────────────────────

bpy.ops.render.opengl(animation=True)
print(f"Recording complete → {OUTPUT_PATH}.mp4")
