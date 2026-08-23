"""
record.py — Neovius Surface viewport render (Blender 5.1)
=========================================================
Runs blueprint.py to build the scene, then renders a 5-second
animation showing:
  0–49  : orbit 360° around the stage floor (technique reveal)
  50–89 : morph through SK_Expand → SK_Compress → Basis
  90–119: close fly-over showing channel topology

Output: public/library/videos/scripting/
          python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr/
            viewport.mp4
"""
import bpy, math, pathlib, sys

# ── point to blueprint ───────────────────────────────────────────────────────
HERE = pathlib.Path(__file__).parent
exec(compile((HERE / "blueprint.py").read_text(), "blueprint.py", "exec"))

scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps            = 30
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format             = "MPEG4"
scene.render.ffmpeg.codec              = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

TOTAL   = 120
OUT_DIR = (HERE.parents[4] / "videos" / "scripting" /
           "python-numpy-neovius-surface-im3m-genus-9-primitive-cubic-stage-floor-webxr")
OUT_DIR.mkdir(parents=True, exist_ok=True)
scene.render.filepath = str(OUT_DIR / "viewport.mp4")
scene.frame_start = 1
scene.frame_end   = TOTAL

obj = bpy.data.objects["neovius_floor"]
sk  = obj.data.shape_keys

# ── camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

# orbit empty
empty = bpy.data.objects.new("CamTarget", None)
empty.location = (0.6, 0.6, 0.12)
scene.collection.objects.link(empty)
track = cam.constraints.new("TRACK_TO")
track.target  = empty
track.track_axis  = "TRACK_NEGATIVE_Z"
track.up_axis     = "UP_Y"

# ── lighting ─────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.5
sun = bpy.data.objects.new("Sun", sun_data)
sun.rotation_euler = (math.radians(50), 0, math.radians(30))
scene.collection.objects.link(sun)
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03,0.03,0.06,1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4

# ── keyframes ────────────────────────────────────────────────────────────────
def set_cam(f, radius, elev_deg, az_deg):
    scene.frame_set(f)
    cam.location = (
        empty.location.x + radius*math.cos(math.radians(elev_deg))*math.cos(math.radians(az_deg)),
        empty.location.y + radius*math.cos(math.radians(elev_deg))*math.sin(math.radians(az_deg)),
        empty.location.z + radius*math.sin(math.radians(elev_deg)),
    )
    cam.keyframe_insert("location")

# Phase 1: 360° orbit
for i in range(50):
    set_cam(i+1, radius=2.4, elev_deg=35, az_deg=i*7.2)

# Phase 2: pull in, morph shape keys
set_cam(51, radius=1.5, elev_deg=50, az_deg=200)
set_cam(89, radius=1.5, elev_deg=50, az_deg=340)

# Shape-key morph   [50–89]
def sk_kf(frame, key_name, val):
    scene.frame_set(frame)
    sk.key_blocks[key_name].value = val
    sk.key_blocks[key_name].keyframe_insert("value")

sk_kf(50,  "SK_Expand",   0.0); sk_kf(65,  "SK_Expand",   1.0)
sk_kf(75,  "SK_Expand",   0.0)
sk_kf(65,  "SK_Compress", 0.0); sk_kf(80,  "SK_Compress", 1.0)
sk_kf(90,  "SK_Compress", 0.0)
sk_kf(75,  "SK_Wide",     0.0); sk_kf(89,  "SK_Wide",     1.0)
sk_kf(120, "SK_Wide",     0.0)

# Phase 3: close fly-over   [90–119]
for i in range(30):
    set_cam(90+i, radius=1.0, elev_deg=70, az_deg=340+i*4)

# ── render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[Neovius record] viewport.mp4 → {scene.render.filepath}")
