"""
record.py — Viewport-animation recorder for KS stage-floor blueprint.
Run AFTER blueprint.py has built ks_floor in the active scene.

Output: public/library/videos/scripting/
        python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr/
        viewport.mp4   (12 s at 24 fps = 288 frames)

What the animation shows (288 frames):
  Frames   1–72  Basis shape key (canonical turbulence, overhead orbit 0°→90°)
  Frames  73–144 SK_Early (cells forming, camera drifts forward)
  Frames 145–216 SK_SmL  (quasi-periodic near-onset)
  Frames 217–288 SK_LgL  (large-domain multi-scale, camera pulls back)
  Background: black; EEVEE Next bloom at 0.35 / 0.18 intensity.
"""

import bpy
import math
import os

OUTPUT_DIR = os.path.join(
    os.path.dirname(bpy.data.filepath) or "/tmp",
    "../../../../../../public/library/videos/scripting/"
    "python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-"
    "height-field-stage-floor-webxr",
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FPS        = 24
N_FRAMES   = 288          # 12 seconds
CAM_DIST   = 11.0         # camera distance [m]
CAM_ELEV   = math.radians(52)

# ── Scene / Render setup ────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.fps            = FPS
scene.frame_start           = 1
scene.frame_end             = N_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.filepath       = OUTPUT_FILE
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080

# EEVEE bloom
eevee = scene.eevee
eevee.bloom_threshold  = 0.35
eevee.bloom_intensity  = 0.18
eevee.bloom_radius     = 5.0

# World background — black so the cobalt-amber glow reads clearly
world = bpy.data.worlds.new("KS_World")
world.use_nodes = True
scene.world = world
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
bg.inputs["Strength"].default_value = 0.0

# ── Camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("KS_Cam")
cam_data.lens = 55
cam_obj = bpy.data.objects.new("KS_Cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# ── Target object ──────────────────────────────────────────────────────────────
obj = bpy.data.objects.get("ks_floor")
if obj is None:
    raise RuntimeError("Run blueprint.py first to create ks_floor.")

sk = obj.data.shape_keys
key_names  = ["Basis", "SK_Early", "SK_SmL", "SK_LgL"]
PHASE_LEN  = N_FRAMES // len(key_names)   # 72 frames per phase

def set_shape_key(frame, active_name):
    """Set named key value to 1, all others to 0, insert keyframes."""
    for kb in sk.key_blocks:
        v = 1.0 if kb.name == active_name else 0.0
        kb.value = v
        kb.keyframe_insert("value", frame=frame)

# Keyframe shape key transitions
for phase_i, name in enumerate(key_names):
    f_start = 1 + phase_i * PHASE_LEN
    f_end   = f_start + PHASE_LEN - 1
    set_shape_key(f_start, name)
    set_shape_key(f_end,   name)

# ── Camera orbit keyframes ─────────────────────────────────────────────────────
def place_cam(frame, azimuth_deg):
    az = math.radians(azimuth_deg)
    cam_obj.location = (
        CAM_DIST * math.sin(az),
        -CAM_DIST * math.cos(az) * math.cos(CAM_ELEV),
        CAM_DIST * math.sin(CAM_ELEV),
    )
    # Point at origin
    import mathutils
    direction = mathutils.Vector((0, 0, 0)) - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

place_cam(1,   0)
place_cam(72,  90)
place_cam(144, 180)
place_cam(216, 270)
place_cam(288, 360)

# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[KS] ✓ Viewport render → {OUTPUT_FILE}.mp4")
