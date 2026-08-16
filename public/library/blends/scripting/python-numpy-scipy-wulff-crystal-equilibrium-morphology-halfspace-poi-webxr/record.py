"""
record.py — Viewport animation for Wulff Crystal morphology
============================================================
Blender 5.1  |  Run after blueprint.py has built hf_wulff_crystal.blend

Produces:
  public/library/videos/scripting/
    python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr/
      viewport.mp4  (12 s, 30 fps, 360 frames)

Animation in three acts:
  Act 1 (0–60):    Cube shape key fades in.  Camera orbits 90°.
  Act 2 (61–240):  Morphology sweep: cube → trunc_cube → cuboctahedron →
                   trunc_octa → octahedron over 180 frames.  Camera completes
                   a full 360° orbit.
  Act 3 (241–360): Octahedron held; close-up pull-in + slow final orbit.
"""
import bpy
import os

# ── paths ─────────────────────────────────────────────────────────────────
HERE     = os.path.dirname(bpy.data.filepath)
OUT_DIR  = os.path.normpath(os.path.join(
    HERE, "../../../../videos/scripting/"
    "python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr/"))
os.makedirs(OUT_DIR, exist_ok=True)
OUTPUT   = os.path.join(OUT_DIR, "viewport")

# ── scene ─────────────────────────────────────────────────────────────────
sc  = bpy.context.scene
sc.frame_start, sc.frame_end = 1, 360
sc.render.fps = 30
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.render.filepath = OUTPUT
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format = "MPEG4"
sc.render.ffmpeg.codec = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"

# ── camera ────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 90.0
cam = bpy.data.objects.new("RecordCam", cam_data)
sc.collection.objects.link(cam)
sc.camera = cam

import math
CAM_START_DIST = 0.38    # metres — wide shot
CAM_END_DIST   = 0.24    # metres — close-up
CAM_HEIGHT     = 0.12

def set_cam(frame: int, angle_deg: float, dist: float):
    a = math.radians(angle_deg)
    cam.location = (dist * math.sin(a), -dist * math.cos(a), CAM_HEIGHT)
    cam.keyframe_insert("location", frame=frame)

# ── aim camera at origin ──────────────────────────────────────────────────
track = cam.constraints.new("TRACK_TO")
track.target = sc.collection.objects.get("wulff_crystal_poi") or \
               sc.collection.all_objects[0]
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

# ── camera keyframes ──────────────────────────────────────────────────────
# Act 1: orbit 90° at wide distance
set_cam(1,    0.0, CAM_START_DIST)
set_cam(60,  90.0, CAM_START_DIST)
# Act 2: full 360° + start pulling in
set_cam(61,  90.0, CAM_START_DIST)
set_cam(240, 450.0, CAM_START_DIST * 0.85)
# Act 3: pull to close-up, slow rotation
set_cam(241, 450.0, CAM_START_DIST * 0.85)
set_cam(360, 540.0, CAM_END_DIST)

# ── shape key animation ───────────────────────────────────────────────────
ob = None
for o in sc.collection.all_objects:
    if o.type == "MESH" and o.data.shape_keys:
        ob = o
        break

if ob:
    keys = ob.data.shape_keys.key_blocks
    sk_names = ["cube", "trunc_cube", "cuboctahedron", "trunc_octa", "octahedron"]

    def zero_all(frame: int):
        for n in sk_names:
            if n in keys:
                keys[n].value = 0.0
                keys[n].keyframe_insert("value", frame=frame)

    def activate(name: str, frame: int, value: float = 1.0):
        if name in keys:
            keys[name].value = value
            keys[name].keyframe_insert("value", frame=frame)

    # Act 1: cube from 0→1
    zero_all(1);   activate("cube", 1, 0.0)
    zero_all(15);  activate("cube", 15, 1.0)

    # Act 2: morph cube→trunc_cube→cuboctahedron→trunc_octa→octahedron
    # Each transition takes 36 frames (36×5=180 frames)
    transitions = [
        (60,  96,  "cube",          "trunc_cube"),
        (96,  132, "trunc_cube",    "cuboctahedron"),
        (132, 168, "cuboctahedron", "trunc_octa"),
        (168, 204, "trunc_octa",    "octahedron"),
        (204, 240, "octahedron",    "octahedron"),   # hold
    ]
    for f_in, f_out, from_sk, to_sk in transitions:
        zero_all(f_in)
        activate(from_sk, f_in,  1.0)
        zero_all(f_out)
        if to_sk != from_sk:
            activate(to_sk, f_out, 1.0)
        else:
            activate(from_sk, f_out, 1.0)

    # Act 3: octahedron holds
    zero_all(241); activate("octahedron", 241, 1.0)
    zero_all(360); activate("octahedron", 360, 1.0)

# ── lighting ──────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("Sun", "SUN")
sun.energy = 5.0
sun_ob = bpy.data.objects.new("Sun", sun)
sc.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (math.radians(45), 0, math.radians(30))

fill = bpy.data.lights.new("Fill", "AREA")
fill.energy = 1.5
fill.size = 0.5
fill_ob = bpy.data.objects.new("Fill", fill)
sc.collection.objects.link(fill_ob)
fill_ob.location = (-0.3, 0.2, 0.3)

# ── render ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[Wulff record] → {OUTPUT}.mp4")
