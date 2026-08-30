"""
record.py — Rucklidge Attractor  (Blender 5.1 headless render)

Outputs to:
  public/library/videos/scripting/
  python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr/
  viewport.mp4

10 seconds · 24 fps · 240 frames.
Camera: 0.28 m orbit at slight elevation, one full 360° revolution.
Shape key transitions move through: Basis → SK_Hopf → SK_Dense → SK_HighDrive.
Run *after* blueprint.py has produced the .blend with the Rucklidge object.
"""

import bpy, os, numpy as np

SLUG = "python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr"
OUTPUT_DIR = os.path.join(bpy.path.abspath("//"), "..", "..", "videos", "scripting", SLUG)
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOTAL_FRAMES = 240
CAM_RADIUS   = 0.28
CAM_ELEV     = 0.04
LENS_MM      = 85

# ── Render settings  ─────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine                      = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x                = 1920
scn.render.resolution_y                = 1080
scn.render.fps                         = 24
scn.frame_start                        = 1
scn.frame_end                          = TOTAL_FRAMES
scn.render.image_settings.file_format  = "FFMPEG"
scn.render.ffmpeg.format               = "MPEG4"
scn.render.ffmpeg.codec                = "H264"
scn.render.ffmpeg.constant_rate_factor = "HIGH"
scn.render.filepath                    = os.path.join(OUTPUT_DIR, "viewport.mp4")

eevee = scn.eevee
eevee.bloom_threshold = 0.26
eevee.bloom_intensity = 0.45
eevee.bloom_radius    = 5.0

# ── World  ───────────────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scn.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg is None:
    bg = world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value    = (0.010, 0.010, 0.022, 1.0)
bg.inputs["Strength"].default_value = 0.3

# ── Camera rig (360° orbit)  ──────────────────────────────────────────────────
cam_data      = bpy.data.cameras.new("RecordCam")
cam_data.lens = LENS_MM
cam_obj       = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scn.camera = cam_obj

for f in range(1, TOTAL_FRAMES + 1):
    angle = 2.0*np.pi * (f - 1) / TOTAL_FRAMES
    cam_obj.location = (
        CAM_RADIUS * np.cos(angle),
        CAM_RADIUS * np.sin(angle),
        CAM_ELEV,
    )
    cam_obj.rotation_euler = (
        np.pi/2 - np.arctan2(CAM_ELEV, CAM_RADIUS),
        0.0,
        angle + np.pi/2,
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Shape key timeline  ───────────────────────────────────────────────────────
# f  1– 59:  Basis (canonical κ=2, λ=6.7 chaos)
# f 60–100:  morph → SK_Hopf  (limit cycle)
# f100–120:  hold SK_Hopf
# f120–140:  return → Basis
# f140–180:  morph → SK_Dense  (lower damping)
# f180–210:  hold SK_Dense
# f210–230:  return → Basis
# f230–240:  morph → SK_HighDrive (teaser of dense chaos)
obj = bpy.data.objects["Rucklidge"]
kb  = obj.data.shape_keys.key_blocks


def _kf(name, val, frame):
    kb[name].value = val
    kb[name].keyframe_insert("value", frame=frame)


for key in ("SK_Hopf", "SK_Dense", "SK_HighDrive"):
    _kf(key, 0.0, 1)

_kf("SK_Hopf",     0.0,  59);  _kf("SK_Hopf",     1.0, 100)
_kf("SK_Hopf",     1.0, 120);  _kf("SK_Hopf",     0.0, 140)

_kf("SK_Dense",    0.0, 140);  _kf("SK_Dense",    1.0, 180)
_kf("SK_Dense",    1.0, 210);  _kf("SK_Dense",    0.0, 230)

_kf("SK_HighDrive",0.0, 230);  _kf("SK_HighDrive",1.0, 240)

# ── Render  ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("viewport.mp4 written →", OUTPUT_DIR)
