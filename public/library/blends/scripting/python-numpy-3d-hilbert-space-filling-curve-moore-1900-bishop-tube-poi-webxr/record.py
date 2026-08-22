"""
record.py — Viewport animation render for the 3D Hilbert poi head.

Outputs: public/library/videos/scripting/
         python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr/
         viewport.mp4

Run AFTER blueprint.py has built the scene.  The animation shows three acts:
  Act 1 (frames  1–60): slow turntable — lets the serpentine tube read clearly.
  Act 2 (frames 61–120): camera sweeps to a diagonal close-up revealing the
         space-filling density — the tubes pack tightly with no visible gap.
  Act 3 (frames 121–180): pull back to show the full sphere of the poi head
         rotating in place.

Total: 180 frames at 30 fps = 6 seconds.
"""

import bpy
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
FPS      = 30
FRAMES   = 180
OUT_DIR  = "//../../videos/scripting/" \
           "python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr/"
FILENAME = "viewport"

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end   = FRAMES

# Output
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUT_DIR + FILENAME
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# EEVEE Next for speed
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold  = 0.5
scene.eevee.bloom_intensity  = 0.8
scene.eevee.bloom_radius     = 4.0

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

def set_cam(frame, loc, euler_deg):
    """Keyframe camera location and Euler XYZ rotation in degrees."""
    cam_ob.location = loc
    cam_ob.rotation_euler = [math.radians(d) for d in euler_deg]
    cam_ob.keyframe_insert("location", frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Act 1: orbit start position
set_cam(1,   (0.0, -2.0,  0.5), (85, 0,   0))
# Act 1 end: 60° around
set_cam(60,  (1.73, -1.0, 0.5), (85, 0,  60))
# Act 2: diagonal close-up
set_cam(61,  (0.9, -0.9,  0.9), (55, 0,  45))
set_cam(120, (0.6, -0.6,  0.6), (55, 0,  60))
# Act 3: pull back, keep rotating
set_cam(121, (0.0, -2.2,  0.0), (90, 0,  60))
set_cam(180, (0.0, -2.2,  0.0), (90, 0, 120))

# ── LIGHTING ──────────────────────────────────────────────────────────────────
# Key light
key_data  = bpy.data.lights.new("Key", type="SUN")
key_data.energy = 4.0
key_data.color  = (1.0, 0.95, 0.85)
key_ob   = bpy.data.objects.new("Key", key_data)
key_ob.rotation_euler = [math.radians(d) for d in (45, 0, -30)]
bpy.context.collection.objects.link(key_ob)

# Fill light (cool blue, low intensity)
fill_data = bpy.data.lights.new("Fill", type="SUN")
fill_data.energy = 1.2
fill_data.color  = (0.6, 0.75, 1.0)
fill_ob  = bpy.data.objects.new("Fill", fill_data)
fill_ob.rotation_euler = [math.radians(d) for d in (60, 0, 150)]
bpy.context.collection.objects.link(fill_ob)

# World background — near-black cobalt
world = bpy.data.worlds.new("RecordWorld")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value   = (0.01, 0.02, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.3
scene.world = world

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print("[Hilbert record.py] viewport.mp4 written.")
