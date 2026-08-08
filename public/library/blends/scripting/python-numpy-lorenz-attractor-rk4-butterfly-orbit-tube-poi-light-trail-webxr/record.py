"""
record.py — Viewport animation recording for Lorenz Attractor
==============================================================
Renders a 7-second fly-around showing the butterfly double-wing structure.
Run AFTER blueprint.py in the same Blender session.

Output: public/library/videos/scripting/
        python-numpy-lorenz-attractor-rk4-butterfly-orbit-tube-poi-light-trail-webxr/
        viewport.mp4
"""

import bpy
import math

FPS           = 30
DURATION_SEC  = 7
FRAME_START   = 1
FRAME_END     = FPS * DURATION_SEC   # 210 frames
OUTPUT_PATH   = "//../../videos/scripting/" \
                "python-numpy-lorenz-attractor-rk4-butterfly-orbit-tube-poi-light-trail-webxr/" \
                "viewport.mp4"

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath        = bpy.path.abspath(OUTPUT_PATH)
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.resolution_percentage = 100

# ─── CAMERA ──────────────────────────────────────────────────────────────────
# The Lorenz attractor is centred near (0, 0, 0.25*MESH_SCALE*25 ≈ 1.5 m above origin).
# We orbit a pivot placed at the attractor centroid.
pivot = bpy.data.objects.new("RecordPivot", None)
scene.collection.objects.link(pivot)
pivot.location = (0, 0, 0.75)   # approximate centroid of Lorenz butterfly

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 45
cam_obj = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.parent = pivot
cam_obj.location = (0, -7.0, 1.2)
cam_obj.rotation_euler = (math.radians(80), 0, 0)
scene.camera = cam_obj

# Two-phase animation: first half — slow full orbit; second half — side-on dive
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", frame=FRAME_START)
pivot.rotation_euler = (0, 0, math.radians(270))
pivot.keyframe_insert("rotation_euler", frame=FRAME_END)

for fcurve in pivot.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "LINEAR"

# ─── LIGHTING ────────────────────────────────────────────────────────────────
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
    bg.inputs["Strength"].default_value = 0.0

for name, loc, energy in [
    ("Key",  (4.0, -3.0, 5.0), 600),
    ("Fill", (-3.5, 2.0, 2.0), 200),
    ("Rim",  (0.0, 4.0, -1.0), 150),
]:
    ld = bpy.data.lights.new(name, type="POINT"); ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo); lo.location = loc

# ─── EEVEE NEXT SETTINGS ─────────────────────────────────────────────────────
scene.render.engine  = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom         = True
scene.eevee.bloom_intensity   = 0.4
scene.eevee.bloom_threshold   = 0.4
scene.eevee.bloom_radius      = 6.5
scene.eevee.taa_render_samples = 32

print(f"[Lorenz record] Ready — Ctrl+F12 to render {FRAME_END} frames.")
print(f"[Lorenz record] Output → {bpy.path.abspath(OUTPUT_PATH)}")
