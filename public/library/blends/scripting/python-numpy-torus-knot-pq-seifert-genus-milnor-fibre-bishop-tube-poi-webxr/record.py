"""
record.py — Viewport render for Torus Knot T(p,q) blueprint.
Output: public/library/videos/scripting/
        python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr/
        viewport.mp4

Run from the Blender 5.1 Scripting panel AFTER blueprint.py has completed.
9 seconds at 30 fps: camera orbits 1.5 times whilst shape keys morph
T(2,3) → T(2,5) → T(3,4) → T(3,5).
"""

import bpy
import numpy as np

# ── OUTPUT ────────────────────────────────────────────────────────────────────
OUTPUT = (
    "//../../../../public/library/videos/scripting/"
    "python-numpy-torus-knot-pq-seifert-genus-milnor-fibre-bishop-tube-poi-webxr/"
    "viewport.mp4"
)
FRAMES = 270   # 9 s at 30 fps
FPS    = 30

# ── SCENE ─────────────────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, FRAMES
sc.render.fps = FPS

sc.render.engine = "BLENDER_EEVEE_NEXT"
ev = sc.eevee
ev.use_bloom          = True
ev.bloom_threshold    = 0.32
ev.bloom_intensity    = 0.45
ev.bloom_radius       = 4.5
ev.taa_render_samples = 64

sc.render.resolution_x               = 1920
sc.render.resolution_y               = 1080
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format              = "MPEG4"
sc.render.ffmpeg.codec               = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
sc.render.filepath = OUTPUT

# ── WORLD ─────────────────────────────────────────────────────────────────────
world = bpy.data.worlds.new("RecWorld")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
bg.inputs["Strength"].default_value = 0.55

# ── CAMERA ────────────────────────────────────────────────────────────────────
CAM_R    = 0.30    # orbit radius (≈ POI_R × 3.7)
CAM_ELEV = 0.05    # slight upward tilt so the knot topology is visible

cd  = bpy.data.cameras.new("RecCam")
cd.lens = 85.0
cam = bpy.data.objects.new("RecCam", cd)
sc.collection.objects.link(cam)
sc.camera = cam

# 1.5 revolutions over FRAMES frames — slow enough to read the knot crossings
for f in range(1, FRAMES + 1):
    theta = 2.0 * np.pi * 1.5 * (f - 1) / FRAMES
    cam.location = (CAM_R * np.cos(theta), CAM_R * np.sin(theta), CAM_ELEV)
    # Point-at-origin: pitch = arctan(elev/r), yaw = theta+90°
    cam.rotation_euler = (
        np.pi / 2.0 - np.arctan2(CAM_ELEV, CAM_R),
        0.0,
        theta + np.pi / 2.0,
    )
    cam.keyframe_insert("location",       frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

# ── SHAPE KEY MORPH SCHEDULE ──────────────────────────────────────────────────
obj = bpy.data.objects["TorusKnot"]
kb  = obj.data.shape_keys.key_blocks
KEYS = ["Basis", "SK_Cinq", "SK_T34", "SK_T35"]


def kf(name: str, frame: int, val: float) -> None:
    kb[name].value = val
    kb[name].keyframe_insert("value", frame=frame)


# All keys zero at start
for k in KEYS:
    kf(k, 1, 0.0)
kf("Basis", 1, 1.0)

# F1–50   hold Basis (T(2,3) trefoil)
kf("Basis", 50, 1.0)
# F50–90  fade Basis → SK_Cinq (T(2,5) cinquefoil)
kf("Basis", 90, 0.0);  kf("SK_Cinq", 50, 0.0);  kf("SK_Cinq", 90, 1.0)
# F90–120 hold SK_Cinq
kf("SK_Cinq", 120, 1.0)
# F120–160 fade SK_Cinq → SK_T34 (T(3,4))
kf("SK_Cinq", 160, 0.0);  kf("SK_T34", 120, 0.0);  kf("SK_T34", 160, 1.0)
# F160–195 hold SK_T34
kf("SK_T34", 195, 1.0)
# F195–235 fade SK_T34 → SK_T35 (T(3,5))
kf("SK_T34", 235, 0.0);  kf("SK_T35", 195, 0.0);  kf("SK_T35", 235, 1.0)
# F235–270 hold SK_T35
kf("SK_T35", 270, 1.0)

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete →", OUTPUT)
