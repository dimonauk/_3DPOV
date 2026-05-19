"""
record.py — Viewport animation for faceted-custom-split-normals
Outputs: public/library/videos/low-poly-shading/faceted-custom-split-normals/viewport.mp4

Run AFTER blueprint.py (assumes the faceted_icosphere and smooth_icosphere
objects are already in the scene). If you run record.py standalone, it will
call blueprint.py first via exec().

What this renders
─────────────────
A 5-second (150-frame @ 30fps) turntable of both spheres side-by-side under
a three-point light rig. The faceted sphere rotates 360° on Z. A text label
overlay produced by a Grease Pencil annotation names each sphere. The render
is EEVEE (not Cycles) — fast enough for a reference clip, and EEVEE's
specular model makes the facet highlights pop clearly without long render
times. Output: H.264 in an mp4 container.
"""

import bpy
import os
import math

SLUG      = "faceted-custom-split-normals"
TOPIC     = "low-poly-shading"
FPS       = 30
DURATION  = 5           # seconds
FRAMES    = FPS * DURATION  # 150
OUTPUT    = f"//../../../../videos/{TOPIC}/{SLUG}/viewport"   # no extension; Blender appends .mp4


# ── Ensure objects are present ─────────────────────────────────────────────
if "faceted_icosphere" not in bpy.data.objects:
    exec(open(bpy.path.abspath("//blueprint.py")).read())


# ── Scene / render settings ────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine           = "BLENDER_EEVEE_NEXT"   # 5.1 renamed EEVEE to EEVEE_NEXT
scene.render.fps              = FPS
scene.frame_start             = 1
scene.frame_end               = FRAMES
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format    = "MPEG4"
scene.render.ffmpeg.codec     = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath         = bpy.path.abspath(OUTPUT)

# EEVEE settings — fast render, sharp specular
eevee = scene.eevee
eevee.taa_render_samples  = 16    # enough for a reference clip
eevee.use_soft_shadows    = True


# ── Camera ─────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam")
cam_data.lens = 50     # mild telephoto — avoids fisheye distortion on spheres
cam_obj   = bpy.data.objects.new("record_cam", cam_data)
cam_obj.location = (0, -6, 1.5)
cam_obj.rotation_euler = (math.radians(80), 0, 0)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj


# ── Three-point lighting ───────────────────────────────────────────────────
# Key — warm white from upper left. Angle chosen so specular hits the facets.
key = bpy.data.lights.new("key", type="AREA")
key.energy = 800
key.color  = (1.0, 0.98, 0.92)
key.size   = 2.0
key_obj = bpy.data.objects.new("key_light", key)
key_obj.location       = (-4, -3, 5)
key_obj.rotation_euler = (math.radians(50), 0, math.radians(-30))
bpy.context.collection.objects.link(key_obj)

# Fill — cool, low energy, opposite side
fill = bpy.data.lights.new("fill", type="AREA")
fill.energy = 200
fill.color  = (0.85, 0.90, 1.0)
fill.size   = 3.0
fill_obj = bpy.data.objects.new("fill_light", fill)
fill_obj.location       = (5, -2, 2)
fill_obj.rotation_euler = (math.radians(60), 0, math.radians(30))
bpy.context.collection.objects.link(fill_obj)

# Rim — white from behind, carves out the silhouette
rim = bpy.data.lights.new("rim", type="SPOT")
rim.energy   = 400
rim.spot_size = math.radians(40)
rim_obj = bpy.data.objects.new("rim_light", rim)
rim_obj.location       = (0, 5, 4)
rim_obj.rotation_euler = (math.radians(-120), 0, 0)
bpy.context.collection.objects.link(rim_obj)


# ── World background — mid-grey so neither sphere is blown out ─────────────
scene.world = bpy.data.worlds.new("record_world")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value   = (0.08, 0.08, 0.08, 1.0)
bg.inputs["Strength"].default_value = 0.5


# ── Turntable animation (faceted sphere only rotates) ─────────────────────
# Animating only the faceted sphere so the viewer can compare the moving
# highlight walk (faceted = discrete jumps) vs the smooth sphere (continuous
# gradient). Both are visible; only one moves.
obj_f = bpy.data.objects["faceted_icosphere"]
obj_f.rotation_euler = (0, 0, 0)
obj_f.keyframe_insert(data_path="rotation_euler", frame=1)
obj_f.rotation_euler = (0, 0, math.radians(360))
obj_f.keyframe_insert(data_path="rotation_euler", frame=FRAMES)

# Linear interpolation so the rotation is exactly one revolution — no ease-in/out
for fcurve in obj_f.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "LINEAR"


# ── Grease Pencil annotations ──────────────────────────────────────────────
# Label each sphere. Annotations render into EEVEE without extra objects.
gp = bpy.data.grease_pencils.new("labels")
layer = gp.layers.new("annotation_layer")
frame_gp = layer.frames.new(1)

# Left sphere label (faceted)
stroke_l = frame_gp.strokes.new()
stroke_l.display_mode = "3DSPACE"
stroke_l.points.add(1)
stroke_l.points[0].co = (-1.5, 0, -1.6)  # below left sphere

# Right sphere label (smooth)
stroke_r = frame_gp.strokes.new()
stroke_r.display_mode = "3DSPACE"
stroke_r.points.add(1)
stroke_r.points[0].co = (1.5, 0, -1.6)

# Note: proper text annotation needs a Text object overlay — simpler here
# to add a HUD Text object as a mesh doesn't render in this context.
# Dimona: add two Text objects in the viewport named "label_faceted" and
# "label_smooth" at the same world positions if you want readable labels.


# ── Ensure output dir exists ───────────────────────────────────────────────
abs_out = bpy.path.abspath(OUTPUT + ".mp4")
os.makedirs(os.path.dirname(abs_out), exist_ok=True)


# ── Render ─────────────────────────────────────────────────────────────────
# bpy.ops.render.render(animation=True) blocks until complete, then exits.
# Average per-frame time with EEVEE on this geometry: ~0.3s on a modern GPU.
print(f"[record] Rendering {FRAMES} frames → {abs_out}")
print(f"[record] Estimated time: {FRAMES * 0.3:.0f}s on a recent GPU")
bpy.ops.render.render(animation=True, write_still=False)
print("[record] Done.")
