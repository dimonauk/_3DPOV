"""
record.py — Viewport Animation Renderer for the Peregrine Breather
==================================================================
Outputs:
    public/library/videos/scripting/
        python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr/
            viewport.mp4

Run AFTER blueprint.py (object `hf_peregrine_poi` must exist in the scene).

    blender --python blueprint.py --python record.py

Technique: morph the Basis → SK_Perturb → SK_Flat cycle over 90 frames
while the camera orbits 180°.  This shows the rogue wave "appearing from
a calm sea and returning to calm" — the physical narrative of the Peregrine
solution in a 12-second clip at 30 fps.
"""

import bpy
import os

# ──────────────────────── settings ──────────────────────────────────────────
SLUG     = "hf_peregrine_poi"
FPS      = 30
DURATION = 12            # seconds
N_FRAMES = FPS * DURATION   # 360 frames

OUT_DIR  = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))),   # repo root
    "public", "library", "videos", "scripting",
    "python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr",
)
os.makedirs(OUT_DIR, exist_ok=True)

# ──────────────────────── scene setup ───────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# Use EEVEE for speed; the vertex-colour palette looks correct under EEVEE
scene.render.engine = "BLENDER_EEVEE_NEXT"

# Output
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

# ──────────────────────── camera ────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Place camera above the poi disc, looking down at angle
import mathutils
cam_obj.location = (0.0, -1.8, 1.4)
cam_obj.rotation_euler = mathutils.Euler((0.92, 0.0, 0.0), "XYZ")

# Orbit: animate camera location around Z over full duration
for f in range(1, N_FRAMES + 1):
    t  = (f - 1) / (N_FRAMES - 1)    # 0 → 1
    angle = t * 3.14159               # 0 → π  (half-orbit, dramatic arc)
    r  = 1.8
    cam_obj.location = (
        r * mathutils.Matrix.Rotation(angle, 4, "Z") @ mathutils.Vector((0, -r, 0))
    )[:]
    cam_obj.keyframe_insert("location", frame=f)

# ──────────────────────── shape-key animation ────────────────────────────────
obj = bpy.data.objects.get(SLUG)
if obj is None:
    raise RuntimeError(f"Object '{SLUG}' not found — run blueprint.py first.")

keys  = obj.data.shape_keys
basis = keys.key_blocks["Basis"]
sk_p  = keys.key_blocks["SK_Perturb"]
sk_f  = keys.key_blocks["SK_Flat"]

# Animation sequence:
#  F1–60    calm background  (SK_Flat ↑, Basis ↓)
#  F61–120  wave appears     (SK_Flat ↓, Basis ↑)
#  F121–180 full peak        (Basis = 1)
#  F181–240 peak recedes     (Basis ↓, SK_Perturb ↑)
#  F241–300 perturbation     (SK_Perturb full)
#  F301–360 return to calm   (SK_Perturb ↓, SK_Flat ↑)

def set_sk(key_block, value, frame):
    key_block.value = value
    key_block.keyframe_insert("value", frame=frame)

# Initialise all at 0
for skb in keys.key_blocks:
    set_sk(skb, 0.0, 1)

# Calm sea
set_sk(sk_f, 1.0, 1)
set_sk(sk_f, 1.0, 60)

# Wave appears
set_sk(sk_f,  0.0, 120)
set_sk(basis, 1.0, 120)

# Full peak held
set_sk(basis, 1.0, 180)

# Peak recedes into perturbation-only view
set_sk(basis, 0.0, 240)
set_sk(sk_p,  1.0, 240)

# Perturbation held briefly
set_sk(sk_p, 1.0, 280)

# Return to calm
set_sk(sk_p, 0.0, N_FRAMES)
set_sk(sk_f, 1.0, N_FRAMES)

# ──────────────────────── lighting ──────────────────────────────────────────
sun = bpy.data.lights.new("RecordSun", "SUN")
sun.energy = 3.0
sun_obj = bpy.data.objects.new("RecordSun", sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = mathutils.Euler((0.6, 0.2, 0.8), "XYZ")

# ──────────────────────── render ────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record.py] Viewport animation written to {scene.render.filepath}")
