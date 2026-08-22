"""
record.py — Viewport animation for context_override_demo
Blender 5.1 · Holoflow Studio · CC0

Renders a 5-second viewport animation: a rounded cube spins into frame
while a text overlay cycles through the three main context field groups,
illustrating which field combination each step requires.

Output: public/library/videos/scripting/
        python-bpy-context-temp-override-ops-headless-scripting/viewport.mp4
"""

import bpy
import math
import os

# ── PARAMETERS ───────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath),
    "..", "..", "..", "..", "videos", "scripting",
    "python-bpy-context-temp-override-ops-headless-scripting",
)
FPS        = 30
DURATION_S = 6
FRAMES     = FPS * DURATION_S

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUTPUT_DIR, "viewport.mp4")

# Camera
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("RecCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob
cam_ob.location = (2.8, -2.8, 1.8)
cam_ob.rotation_euler = (math.radians(64), 0, math.radians(45))

# Subject: rounded cube built with bmesh
import bmesh as _bm
me = bpy.data.meshes.new("demo_cube")
ob = bpy.data.objects.new("demo_cube", me)
scene.collection.objects.link(ob)

bm = _bm.new()
_bm.ops.create_cube(bm, size=1.0)
bm.to_mesh(me)
bm.free()

bevel = ob.modifiers.new("Bevel", "BEVEL")
bevel.width = 0.04; bevel.segments = 3; bevel.limit_method = "ANGLE"
bevel.angle_limit = 0.523599

mat = bpy.data.materials.new("cube_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.08, 0.55, 0.72, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.20
me.materials.append(mat)

# Spin-in animation: 0° → 360° Y over FRAMES
ob.rotation_mode = "XYZ"
ob.rotation_euler = (0, 0, 0)
ob.keyframe_insert("rotation_euler", frame=1)
ob.rotation_euler = (0, math.radians(360), 0)
ob.keyframe_insert("rotation_euler", frame=FRAMES)
for fc in ob.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# Key light
key_data = bpy.data.lights.new("Key", "AREA")
key_data.energy = 400
key_ob = bpy.data.objects.new("Key", key_data)
scene.collection.objects.link(key_ob)
key_ob.location = (3, -1, 4)

# Render
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow:record] viewport.mp4 → {OUTPUT_DIR}")
