"""
record.py — Genesio–Tesi Attractor Viewport Animation — Blender 5.1
====================================================================
Run this AFTER blueprint.py has built the hf_genesio_tesi_poi object.
Outputs: public/library/videos/scripting/
         python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr/
         viewport.mp4

Duration: 5 seconds at 24 fps = 120 frames
Technique: animate the SK_DenseWrap shape-key value 0→1→0 (one full morphing
           loop showing how weaker dissipation expands the attractor orbit)
           while the camera orbits the object.
"""

import bpy, math, os, pathlib

# ── paths ────────────────────────────────────────────────────────────────
REPO_ROOT  = pathlib.Path(bpy.path.abspath("//")).parent
SLUG       = "python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
OUT_DIR    = REPO_ROOT / "public" / "library" / "videos" / "scripting" / SLUG
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH   = str(OUT_DIR / "viewport.mp4")

OBJ_NAME   = "hf_genesio_tesi_poi"
FPS        = 24
DURATION_S = 5
N_FRAMES   = FPS * DURATION_S   # 120

# ── scene / render setup ──────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps          = FPS
scene.frame_start         = 1
scene.frame_end           = N_FRAMES
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath     = OUT_PATH
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# use EEVEE Next for fast viewport-quality render
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ── get attractor object ──────────────────────────────────────────────────
ob = bpy.data.objects.get(OBJ_NAME)
if ob is None:
    raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

# ── clear existing animation on the object ────────────────────────────────
ob.animation_data_clear()
sk_block = ob.data.shape_keys
if sk_block:
    for kb in sk_block.key_blocks:
        kb.value = 0.0
        kb.keyframe_delete("value", frame=1)   # clear any stale keys

# set Basis permanently active
if "Basis" in sk_block.key_blocks:
    sk_block.key_blocks["Basis"].value = 1.0

# ── animate SK_DenseWrap: 0 → 1 (peak at frame 60) → 0 ───────────────────
# This visually shows how reducing c₃ from 0.44 to 0.30 expands the orbit:
# at peak the attractor fills a notably larger region, demonstrating the
# c₃ control over dissipation and orbital volume.
sk_dense = sk_block.key_blocks.get("SK_DenseWrap")
if sk_dense:
    sk_dense.value = 0.0
    sk_dense.keyframe_insert("value", frame=1)
    sk_dense.value = 1.0
    sk_dense.keyframe_insert("value", frame=60)
    sk_dense.value = 0.0
    sk_dense.keyframe_insert("value", frame=N_FRAMES)
    # smooth interpolation
    if sk_dense.id_data.animation_data:
        for fc in sk_dense.id_data.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"

# ── camera orbit ──────────────────────────────────────────────────────────
# Place camera 5 units out, orbiting +Z axis over full duration
cam_data = bpy.data.cameras.new("RecordCam_GT")
cam_ob   = bpy.data.objects.new("RecordCam_GT", cam_data)
bpy.context.collection.objects.link(cam_ob)
cam_ob.animation_data_create()

ORBIT_R  = 5.0
ORBIT_Z  = 1.5    # slight elevation — Genesio-Tesi lobe sits around z ∈ [-2, 3]

for f in range(1, N_FRAMES + 1):
    angle = 2 * math.pi * (f - 1) / N_FRAMES   # full revolution
    cam_ob.location = (ORBIT_R * math.cos(angle),
                       ORBIT_R * math.sin(angle),
                       ORBIT_Z)
    # point toward attractor centre (approx barycentre near (0.5, 0, 0))
    dx = 0.5 - cam_ob.location[0]
    dy = 0.0 - cam_ob.location[1]
    dz = 0.0 - cam_ob.location[2]
    cam_ob.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz),  # elevation
        0.0,
        math.atan2(dy, dx) + math.pi,               # azimuth
    )
    cam_ob.keyframe_insert("location",       frame=f)
    cam_ob.keyframe_insert("rotation_euler", frame=f)

scene.camera = cam_ob

# ── lighting: simple sun ──────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun_GT", "SUN")
sun_data.energy = 3.0
sun_ob   = bpy.data.objects.new("RecordSun_GT", sun_data)
sun_ob.location = (3, 3, 6)
bpy.context.collection.objects.link(sun_ob)

# ── render ────────────────────────────────────────────────────────────────
print(f"Rendering {N_FRAMES} frames → {OUT_PATH}")
bpy.ops.render.render(animation=True)
print("record.py: done.")
