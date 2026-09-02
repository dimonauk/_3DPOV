"""
record.py — Kelvin–Helmholtz Instability viewport render
=========================================================
Outputs viewport.mp4 to:
  public/library/videos/scripting/
    python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr/

Run headlessly after blueprint.py:
    blender --background --python blueprint.py --python record.py

Or with an existing blend:
    blender --background kelvin_helmholtz_kh.blend --python record.py

Duration: 60 frames @ 30 fps = 2 s.  Each 15-frame segment holds one
shape-key snapshot (Basis → SK_t20 → SK_t40 → SK_t60), giving 0.5 s per
stage.  Camera is orthographic top-down so the full vorticity height field
is visible as a plan view — consistent with how the instability is shown in
fluid-mechanics textbooks.
"""

import bpy, os, sys

# ─── Paths ──────────────────────────────────────────────────────────────────

_HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(
    _HERE,
    "../../../../videos/scripting/"
    "python-numpy-kelvin-helmholtz-shear-instability-"
    "spectral-vorticity-height-field-stage-floor-webxr",
))
os.makedirs(OUT_DIR, exist_ok=True)

# ─── Ensure scene exists ─────────────────────────────────────────────────────

obj = bpy.data.objects.get("KH_StageFloor")
if obj is None:
    bp = os.path.join(_HERE, "blueprint.py")
    with open(bp) as fh:
        exec(compile(fh.read(), bp, 'exec'), {})   # run blueprint in this session
    obj = bpy.data.objects.get("KH_StageFloor")
    if obj is None:
        sys.exit("record.py: blueprint.py did not create KH_StageFloor — aborting.")

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 60
scene.render.fps  = 30

# ─── Animate shape keys — step-hold per snapshot ─────────────────────────────

sk_blocks = obj.data.shape_keys.key_blocks
sk_names  = [k.name for k in sk_blocks]   # ["Basis", "SK_t20", "SK_t40", "SK_t60"]
HOLD      = 15                             # frames each key dominates

# Reset all weights
for sk in sk_blocks:
    sk.value = 0.0

# Key frame 1: Basis dominant, others zero
for frame in range(1, scene.frame_end + 1):
    idx = min((frame - 1) // HOLD, len(sk_names) - 1)
    for i, sk in enumerate(sk_blocks):
        sk.value = 1.0 if i == idx else 0.0
        sk.keyframe_insert("value", frame=frame)

# ─── Camera — orthographic plan view ─────────────────────────────────────────

cam_data = bpy.data.cameras.new("KH_Cam")
cam_data.type        = 'ORTHO'
cam_data.ortho_scale = 5.0            # matches MESH_SZ=4.0 with small margin
cam_obj  = bpy.data.objects.new("KH_Cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location       = (0.0, 0.0, 8.0)
cam_obj.rotation_euler = (0.0, 0.0, 0.0)
scene.camera = cam_obj

# ─── World — dark background, single key light ───────────────────────────────

world = bpy.data.worlds.new("KH_World")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (
    0.02, 0.02, 0.06, 1.0)
scene.world = world

lamp_d = bpy.data.lights.new("KH_Key", type='AREA')
lamp_d.energy = 600
lamp_o = bpy.data.objects.new("KH_Key", lamp_d)
bpy.context.collection.objects.link(lamp_o)
lamp_o.location = (3.0, 3.0, 9.0)

# ─── Render settings ─────────────────────────────────────────────────────────

scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.render.filepath             = os.path.join(OUT_DIR, "viewport")
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format        = 'MPEG4'
scene.render.ffmpeg.codec         = 'H264'
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.resolution_percentage = 100

bpy.ops.render.render(animation=True)
print(f"record.py: rendered viewport.mp4 → {OUT_DIR}")
