"""
record.py — Viewport animation for the keying set VRM capture tutorial.
Sequences a head-nod into a happy expression into a blink, demonstrating
that all channels (bone + shape key) share a single keyed timeline.

Run after blueprint.py has produced keying_set_vrm_capture.blend:
  blender keying_set_vrm_capture.blend --background --python record.py

Output: public/library/videos/scripting/python-bpy-keying-set-vrm-auto-key-capture/viewport.mp4
"""
import bpy
import math
import os

SLUG      = "python-bpy-keying-set-vrm-auto-key-capture"
VIDEO_DIR = "public/library/videos/scripting/" + SLUG + "/"
# Four "../" steps climb from public/library/blends/scripting/<slug>/ back to repo root
VIDEO_PATH = "//" + "../../" * 4 + VIDEO_DIR + "viewport.mp4"
FPS       = 24

sc = bpy.context.scene

# ── Camera ────────────────────────────────────────────────────────────────────
cam_d  = bpy.data.cameras.new("rec_cam")
cam_ob = bpy.data.objects.new("rec_cam", cam_d)
sc.collection.objects.link(cam_ob)
cam_ob.location       = (0.0, -4.2, 0.95)
cam_ob.rotation_euler = (math.radians(82), 0.0, 0.0)
cam_d.lens            = 85.0
sc.camera             = cam_ob

# ── Lights ────────────────────────────────────────────────────────────────────
def add_light(name, kind, loc, energy, colour=(1.0, 1.0, 1.0)):
    ld = bpy.data.lights.new(name, kind)
    lo = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = loc
    ld.energy   = energy
    ld.color    = colour
    return lo

add_light("key",  'AREA', (-1.5, -2.5, 2.0), 130.0, (1.00, 0.97, 0.93))
add_light("fill", 'AREA', ( 1.5, -1.5, 1.0),  52.0, (0.80, 0.88, 1.00))
add_light("rim",  'SPOT', ( 0.0,  2.5, 2.5),  88.0, (1.00, 0.94, 0.85))

# ── World ─────────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("rec_world")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.03, 0.05, 1.0)
sc.world = world

# ── Render settings ───────────────────────────────────────────────────────────
sc.render.engine                     = 'BLENDER_EEVEE_NEXT'
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.fps                        = FPS
sc.render.resolution_x               = 1280
sc.render.resolution_y               = 720
sc.render.filepath                   = bpy.path.abspath(VIDEO_PATH)

os.makedirs(bpy.path.abspath("//" + "../../" * 4 + VIDEO_DIR), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[{SLUG}] viewport animation → {VIDEO_PATH}")
