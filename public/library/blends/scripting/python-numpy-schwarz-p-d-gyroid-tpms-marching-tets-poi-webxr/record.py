"""
record.py — Viewport animation render for TPMS trio (Blender 5.1)
==================================================================
Outputs: public/library/videos/scripting/
         python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr/viewport.mp4

Sequence (120 frames @ 24 fps = 5 seconds):
  f001–030  Camera orbit up from ground plane, all three poi heads in frame
  f031–070  Dolly-in to the Gyroid (centre), slow 180° rotation around it
  f071–090  Pull back to reveal all three; Gyroid colour-cycles iso-level morph
  f091–120  Top-down view; camera spirals out as trio is highlighted

Run AFTER blueprint.py has created the 'schwarz_p', 'gyroid', 'schwarz_d' objects.
"""

import bpy, math
from mathutils import Vector, Euler

SLUG     = "python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
OUT_DIR  = f"//../../../../videos/scripting/{SLUG}/"
FPS      = 24
FRAMES   = 120

# ── Scene setup ──────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps              = FPS
scene.frame_start             = 1
scene.frame_end               = FRAMES
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.film_transparent = False

# Workbench engine for fast render with cavity + vertex colour
scene.render.engine           = 'BLENDER_WORKBENCH'
shading = scene.display.shading
shading.light                 = 'MATCAP'
shading.color_type            = 'VERTEX'
shading.cavity_type           = 'BOTH'
shading.cavity_ridge_factor   = 1.2
shading.cavity_valley_factor  = 1.2
shading.show_cavity           = True

# ── Camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

def set_cam(frame, loc, rot_deg):
    cam_ob.location = Vector(loc)
    cam_ob.rotation_euler = Euler(
        [math.radians(r) for r in rot_deg], 'XYZ'
    )
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Low-angle orbit approach
set_cam(  1, ( 0.55,  -0.55,  0.18), (72,  0,  30))
set_cam( 30, ( 0.00,  -0.40,  0.20), (80,  0,   0))
# Dolly in to Gyroid
set_cam( 40, ( 0.00,  -0.20,  0.12), (82,  0,   0))
set_cam( 70, ( 0.20,  -0.20,  0.08), (82,  0,  15))
# Pull back
set_cam( 90, ( 0.00,  -0.42,  0.22), (78,  0,   0))
# Top-down spiral out
set_cam(100, ( 0.10,  -0.10,  0.45), (15,  0,  20))
set_cam(120, ( 0.25,  -0.25,  0.55), (15,  0,  55))

# ── World light ──────────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
bg.inputs["Strength"].default_value = 1.0
scene.world = world

# ── Output ───────────────────────────────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = OUT_DIR + "viewport.mp4"

print(f"Rendering {FRAMES} frames → {scene.render.filepath}")
bpy.ops.render.render(animation=True)
print("Done.")
