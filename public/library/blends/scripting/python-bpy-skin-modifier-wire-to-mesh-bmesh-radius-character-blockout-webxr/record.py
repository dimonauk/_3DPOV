"""
record.py — Viewport animation render for SkinModifier tutorial
Output: public/library/videos/scripting/
        python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr/viewport.mp4

Animation: HF_SkinBlockout rotates 360° around Z over 96 frames (4 s at 24 fps).
A warm key + cool fill light pair shows the 3D silhouette from all angles so Dimona
can judge proportions before opening the .blend file.

Run from Blender's Script Editor AFTER blueprint.py has been executed.
"""

import bpy
import math
import os
import pathlib
from mathutils import Vector

TOTAL_FRAMES = 96     # 4 s at 24 fps — one full rotation
SLUG = "python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr"
OUT_SUBPATH  = f"public/library/videos/scripting/{SLUG}"

# ── Scene timing ──────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = TOTAL_FRAMES
scn.render.fps  = 24

# ── Output format ─────────────────────────────────────────────────────────────
scn.render.resolution_x                   = 1280
scn.render.resolution_y                   = 720
scn.render.resolution_percentage          = 100
scn.render.image_settings.file_format     = "FFMPEG"
scn.render.ffmpeg.format                  = "MPEG4"
scn.render.ffmpeg.codec                   = "H264"
scn.render.ffmpeg.constant_rate_factor    = "HIGH"

abs_out = bpy.path.abspath("//" + OUT_SUBPATH)
os.makedirs(abs_out, exist_ok=True)
scn.render.filepath = os.path.join(abs_out, "viewport.mp4")

# ── Object: 360° spin ─────────────────────────────────────────────────────────
obj = bpy.data.objects.get("HF_SkinBlockout")
if obj is None:
    raise RuntimeError("Run blueprint.py first — HF_SkinBlockout not found.")

obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0.0, 0.0, math.radians(360))
obj.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)

# Linear interpolation → constant spin rate with no ease-in/out stutter
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Camera: eye-level at chest height, reading from +X side ──────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)

# Position gives a three-quarter view: side angle + slight elevation
cam_ob.location = (2.2, -0.8, 0.65)
target          = Vector((0.0, 0.0, 0.55))   # chest centre
direction       = target - cam_ob.location
cam_ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
scn.camera = cam_ob

# ── Lighting ──────────────────────────────────────────────────────────────────
# Warm key sun from upper-right to show form with strong contrast
key_data = bpy.data.lights.new("RecordKey", "SUN")
key_data.energy = 3.0
key_data.color  = (1.0, 0.92, 0.80)
key_ob = bpy.data.objects.new("RecordKey", key_data)
bpy.context.collection.objects.link(key_ob)
key_ob.location       = (2.0, -1.5, 3.0)
key_ob.rotation_euler = (math.radians(45), 0.0, math.radians(30))

# Cool fill sun from opposite side — separates back from background
fill_data = bpy.data.lights.new("RecordFill", "SUN")
fill_data.energy = 1.0
fill_data.color  = (0.60, 0.70, 1.0)
fill_ob = bpy.data.objects.new("RecordFill", fill_data)
bpy.context.collection.objects.link(fill_ob)
fill_ob.location       = (-2.0,  1.5, 1.5)
fill_ob.rotation_euler = (math.radians(30), 0.0, math.radians(210))

# ── World: dark studio background ────────────────────────────────────────────
scn.world = bpy.data.worlds.new("RecordWorld")
scn.world.use_nodes = True
bg = scn.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 1.0

# ── Render engine: Eevee Next (Blender 5.1) ──────────────────────────────────
scn.render.engine = "BLENDER_EEVEE_NEXT"

# ── Fire render ───────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow] record.py complete → {scn.render.filepath}")
