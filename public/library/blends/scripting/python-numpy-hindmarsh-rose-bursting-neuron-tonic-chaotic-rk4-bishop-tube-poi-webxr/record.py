"""
record.py — Hindmarsh-Rose Bursting Neuron  (Blender 5.1 headless render)

Outputs to:
  public/library/videos/scripting/
  python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr/
  viewport.mp4

10 seconds · 24 fps · 240 frames.
Camera: 0.28 m orbit at slight elevation, one full 360° revolution.
Shape key transitions show three dynamical regimes.
Run *after* blueprint.py has produced the .blend and HR_Neuron object exists.
"""

import bpy, os, numpy as np

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "videos", "scripting",
    "python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr",
)
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOTAL_FRAMES = 240
CAM_RADIUS   = 0.28     # metres — orbit distance
CAM_ELEV     = 0.04     # metres above origin
LENS_MM      = 85       # telephoto isolates the form nicely

# ── Render settings  ─────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.render.engine                         = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x                   = 1920
scn.render.resolution_y                   = 1080
scn.render.fps                            = 24
scn.frame_start                           = 1
scn.frame_end                             = TOTAL_FRAMES
scn.render.image_settings.file_format     = "FFMPEG"
scn.render.ffmpeg.format                  = "MPEG4"
scn.render.ffmpeg.codec                   = "H264"
scn.render.ffmpeg.constant_rate_factor    = "HIGH"
scn.render.filepath                       = os.path.join(OUTPUT_DIR, "viewport.mp4")

eevee = scn.eevee
eevee.bloom_threshold = 0.28
eevee.bloom_intensity = 0.40
eevee.bloom_radius    = 5.0

# ── World  ───────────────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scn.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg is None:
    bg = world.node_tree.nodes.new("ShaderNodeBackground")
bg.inputs["Color"].default_value    = (0.012, 0.012, 0.025, 1.0)
bg.inputs["Strength"].default_value = 0.4

# ── Camera rig  ──────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = LENS_MM
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
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
# f1-59:   Basis (regular bursting)
# f60-100: morph → SK_Tonic
# f100-119: hold SK_Tonic
# f120-139: return → Basis
# f140-180: morph → SK_Chaotic
# f180-210: hold SK_Chaotic
# f210-230: return → Basis
# f230-240: morph → SK_Fast (teaser of dense spiking)
obj = bpy.data.objects["HR_Neuron"]
kb  = obj.data.shape_keys.key_blocks


def _kf(name, val, frame):
    kb[name].value = val
    kb[name].keyframe_insert("value", frame=frame)


for key in ("SK_Tonic", "SK_Chaotic", "SK_Fast"):
    _kf(key, 0.0, 1)

_kf("SK_Tonic",   0.0, 59);  _kf("SK_Tonic",   1.0, 100)
_kf("SK_Tonic",   1.0, 119); _kf("SK_Tonic",   0.0, 139)

_kf("SK_Chaotic", 0.0, 139); _kf("SK_Chaotic", 1.0, 180)
_kf("SK_Chaotic", 1.0, 210); _kf("SK_Chaotic", 0.0, 230)

_kf("SK_Fast",    0.0, 230); _kf("SK_Fast",    1.0, 240)

# ── Render  ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("viewport.mp4 written →", OUTPUT_DIR)
