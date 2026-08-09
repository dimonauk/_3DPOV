"""
record.py — Jacobi Elliptic Poi Head: Viewport Animation (Blender 5.1)
=======================================================================
Run AFTER blueprint.py has been executed in the same Blender session.

Renders a 150-frame Workbench animation sweeping the shape keys from
k=0 (sphere) → k=50 (mild elliptic) → k=80 → k=95 → k=99.9 (hourglass)
and back, illustrating the dn-modulation morphology in motion.

OUTPUT:
  public/library/videos/scripting/
    python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr/
    viewport.mp4

Render settings: Workbench, 1280×720, 30 fps, Solid + MatCap, output MP4.
"""

import bpy
import math

SLUG    = "hf_jacobi_poi"
FPS     = 30
FRAMES  = 150
OUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr/"
)
OUT_PATH = OUT_DIR + "viewport"

obj = bpy.data.objects.get(SLUG)
if obj is None:
    raise RuntimeError("Run blueprint.py first — object 'hf_jacobi_poi' not found.")

keys = obj.data.shape_keys.key_blocks

# ── Camera: 35° oblique, looking at origin ────────────────────────────────────
bpy.ops.object.camera_add(location=(0.12, -0.12, 0.08))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(50), 0, math.radians(45))
bpy.context.scene.camera = cam

# Slow orbit: rotate camera around z-axis over the full clip
cam_action = bpy.data.actions.new("cam_orbit")
cam.animation_data_create()
cam.animation_data.action = cam_action
fcx = cam_action.fcurves.new("rotation_euler", index=2)
fcx.keyframe_points.insert(1,   math.radians(45))
fcx.keyframe_points.insert(150, math.radians(45 + 180))
for kfp in fcx.keyframe_points:
    kfp.interpolation = 'LINEAR'

# ── Area light ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(0.18, -0.10, 0.22))
light = bpy.context.active_object
light.data.energy = 40.0
light.data.size   = 0.35

# ── Silence all shape keys at frame 1 ────────────────────────────────────────
bpy.context.scene.frame_set(1)
for kb in keys:
    kb.value = 0.0

def set_key(frame: int, name: str, val: float):
    bpy.context.scene.frame_set(frame)
    if name in keys:
        keys[name].value = val
        keys[name].keyframe_insert("value", frame=frame)

# Key schedule (shape-key names match K_VALUES[1:] in blueprint):
# k_050, k_080, k_095, k_099  (int(k*100):03d → 050, 080, 095, 099)
SCHEDULE = [
    # (frame, key_name, value)
    (  1, "Basis",  1.0), (  1, "k_050", 0.0), (  1, "k_080", 0.0),
    ( 25, "Basis",  0.0), ( 25, "k_050", 1.0),
    ( 50, "k_050",  0.0), ( 50, "k_080", 1.0),
    ( 75, "k_080",  0.0), ( 75, "k_095", 1.0),
    (100, "k_095",  0.0), (100, "k_099", 1.0),
    (125, "k_099",  0.0), (125, "k_095", 1.0),
    (137, "k_095",  0.0), (137, "k_080", 1.0),
    (150, "k_080",  0.0), (150, "Basis", 1.0),
]
for frame, name, val in SCHEDULE:
    set_key(frame, name, val)

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = "BLENDER_WORKBENCH"
scene.display.shading.light = "MATCAP"
scene.render.resolution_x   = 1280
scene.render.resolution_y   = 720
scene.render.fps             = FPS
scene.frame_start            = 1
scene.frame_end              = FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = bpy.path.abspath(OUT_PATH)

bpy.ops.render.render(animation=True)
print(f"[holoflow] Recorded → {OUT_PATH}.mp4")
