"""
RECORD.PY — Viewport animation for differential growth ruffle poi head.
Blender 5.1  |  bpy + bgl  |  CC0

Run this AFTER blueprint.py has produced hf_diff_growth.blend.
Opens that blend file, sets up a spinning camera rig, and renders
120 frames (4 s at 30 fps) to:
  public/library/videos/scripting/
    python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr/
      viewport.mp4

The animation rotates the camera 360° around the ruffled disc, starting
top-oblique (20° elevation) to show both the XY ruffle geometry and the
Z-wave pattern simultaneously.  Eevee is used for fast viewport-quality
render — the cel-shade gradient material needs no raytracing.
"""

import bpy, math, os

# ── CONFIG ─────────────────────────────────────────────────────────────────────
BLEND_NAME   = "hf_diff_growth.blend"
OUT_SUBPATH  = ("videos", "scripting",
                "python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr")
FRAME_COUNT  = 120        # 4 s at 30 fps
FRAME_RATE   = 30
CAM_DISTANCE = 0.24       # metres from origin to camera
CAM_ELEVATION = 22.0      # degrees above XY plane
RESOLUTION   = (1920, 1080)

# ── FIND BLEND FILE ────────────────────────────────────────────────────────────
script_dir  = os.path.dirname(os.path.abspath(__file__))
blend_path  = os.path.join(script_dir, BLEND_NAME)
if not os.path.exists(blend_path):
    raise FileNotFoundError(
        f"Run blueprint.py first to produce {BLEND_NAME}")

bpy.ops.wm.open_mainfile(filepath=blend_path)
scene = bpy.context.scene

# ── OUTPUT PATH ────────────────────────────────────────────────────────────────
repo_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".."))
out_dir   = os.path.join(repo_root, "public", "library", *OUT_SUBPATH)
os.makedirs(out_dir, exist_ok=True)
out_path  = os.path.join(out_dir, "viewport.mp4")

# ── RENDER SETTINGS ────────────────────────────────────────────────────────────
scene.render.engine          = 'BLENDER_EEVEE_NEXT'   # Blender 5.1 engine name
scene.render.resolution_x    = RESOLUTION[0]
scene.render.resolution_y    = RESOLUTION[1]
scene.render.resolution_percentage = 100
scene.render.fps             = FRAME_RATE
scene.frame_start            = 1
scene.frame_end              = FRAME_COUNT
scene.render.filepath        = out_path
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'   # CRF ~18

# EEVEE quality
scene.eevee.taa_render_samples = 16

# ── WORLD BACKGROUND ───────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.04, 0.04, 0.06, 1.0)  # dark navy
    bg.inputs[1].default_value = 1.0

# ── LIGHTING ───────────────────────────────────────────────────────────────────
# Three-point rig: key / fill / rim
def add_light(name, light_type, location, energy, colour=(1, 1, 1)):
    ld = bpy.data.lights.new(name, light_type)
    ld.energy = energy
    ld.color  = colour
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = location
    return lo

add_light("Key",  'AREA',  ( 0.25,  -0.20, 0.30), 120, (1.00, 0.95, 0.85))
add_light("Fill", 'AREA',  (-0.20,   0.15, 0.15),  40, (0.60, 0.70, 0.95))
add_light("Rim",  'POINT', ( 0.00,   0.25, -0.10), 30, (0.80, 0.30, 0.60))

# ── CAMERA RIG ─────────────────────────────────────────────────────────────────
# Empty at origin → camera parented to it → animate empty's Z rotation
empty = bpy.data.objects.new("CamRig", None)
scene.collection.objects.link(empty)
empty.location = (0, 0, 0)

cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 85          # mild telephoto flattens ruffle detail nicely
cam = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

elev_rad = math.radians(CAM_ELEVATION)
cam.location = (
    CAM_DISTANCE * math.cos(elev_rad),
    0.0,
    CAM_DISTANCE * math.sin(elev_rad),
)
cam.parent = empty

# Track-To constraint so camera always looks at origin
ttc = cam.constraints.new('TRACK_TO')
ttc.target       = empty
ttc.track_axis   = 'TRACK_NEGATIVE_Z'
ttc.up_axis      = 'UP_Y'

# Animate empty: 0° → 360° over FRAME_COUNT frames (full orbit)
empty.rotation_euler = (0, 0, 0)
empty.keyframe_insert(data_path="rotation_euler", frame=1)
empty.rotation_euler = (0, 0, math.radians(360))
empty.keyframe_insert(data_path="rotation_euler", frame=FRAME_COUNT)

# Set both keyframes to LINEAR interpolation for constant angular speed
for fc in empty.animation_data.action.fcurves:
    for kf in fc.keyframe_points:
        kf.interpolation = 'LINEAR'

# ── RENDER ─────────────────────────────────────────────────────────────────────
print(f"Rendering {FRAME_COUNT} frames → {out_path}")
bpy.ops.render.render(animation=True)
print("record.py complete.")
