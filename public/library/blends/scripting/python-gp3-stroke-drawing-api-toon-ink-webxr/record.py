"""
record.py — Viewport animation render for GP3 toon wave tutorial.

Outputs:  public/library/videos/scripting/python-gp3-stroke-drawing-api-toon-ink-webxr/viewport.mp4

Run AFTER blueprint.py has been executed (the GP object must already exist
in the scene or the .blend must be open):
  blender gp3_ink_wave.blend --background --python record.py
"""

import bpy
import mathutils

sc  = bpy.context.scene
OUT = "//../../../../videos/scripting/python-gp3-stroke-drawing-api-toon-ink-webxr/"

# ─── render settings ─────────────────────────────────────────────────────────

sc.render.engine           = "BLENDER_WORKBENCH"
sc.render.resolution_x     = 1920
sc.render.resolution_y     = 1080
sc.render.fps              = 24
sc.render.film_transparent = True

sc.display.shading.light             = "FLAT"
sc.display.shading.color_type        = "MATERIAL"
sc.display.shading.show_object_outline = False
sc.display.shading.background_type  = "THEME"

sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format              = "MPEG4"
sc.render.ffmpeg.codec               = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
sc.render.filepath = OUT + "viewport.mp4"

# ─── camera ──────────────────────────────────────────────────────────────────

# Slight perspective pull-back so the depth of the two stroke layers reads.
cam = sc.camera
if cam is None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.type = "PERSP"
    cam_data.lens = 50.0
    cam      = bpy.data.objects.new("RecordCam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam

cam.location       = mathutils.Vector((0.0, -3.8, 1.8))
cam.rotation_euler = (mathutils.Matrix.Rotation(
    1.1, 4, "X").to_euler())

# ─── timeline ─────────────────────────────────────────────────────────────────

# Render frames 1–10 (covers all three keyframes: 1, 5, 10).
sc.frame_start = 1
sc.frame_end   = 10

bpy.ops.render.render(animation=True)
print("[record] viewport.mp4 written to", OUT)
