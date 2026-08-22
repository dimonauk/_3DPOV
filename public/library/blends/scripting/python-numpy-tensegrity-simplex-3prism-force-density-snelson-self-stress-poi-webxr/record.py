"""
record.py — Viewport animation recording for the Tensegrity T3 poi head.

Outputs: public/library/videos/scripting/
         python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr/
         viewport.mp4

Duration: ~10 seconds at 30 fps (300 frames).
Animation: shape key driver sweeps Extended → Compressed → Inverted → Extended,
           while the object slowly rotates 360° on Z.

Run AFTER blueprint.py has built the scene.
"""

import bpy
import numpy as np

FPS       = 30
DURATION  = 10        # seconds
N_FRAMES  = FPS * DURATION
OUTPUT_DIR = "//../../videos/scripting/" \
             "python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr/"

# ── Locate the object ─────────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_tensegrity_t3_poi")
if obj is None:
    raise RuntimeError("Run blueprint.py first — object 'hf_tensegrity_t3_poi' not found.")

sk_keys = obj.data.shape_keys.key_blocks

# ── Scene settings ─────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = N_FRAMES
scene.render.fps  = FPS

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                   = OUTPUT_DIR + "viewport"

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Use EEVEE for fast viewport render
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ── Rotation animation (full 360° over 10 s) ──────────────────────────────────
obj.rotation_euler = (0, 0, 0)
obj.keyframe_insert(data_path="rotation_euler", frame=1)
obj.rotation_euler = (0, 0, np.radians(360))
obj.keyframe_insert(data_path="rotation_euler", frame=N_FRAMES)

# Make rotation linear
for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Shape-key animation ───────────────────────────────────────────────────────
# Segment plan (frames):
#  1 – 75    : Extended (hold)
#  75 – 125  : Extended → Compressed
#  125 – 175 : Compressed (hold)
#  175 – 225 : Compressed → Inverted
#  225 – 275 : Inverted (hold)
#  275 – 300 : Inverted → Extended

def sk_anim(sk, keyframes):
    """Keyframe a shape key value: keyframes = [(frame, value), ...]"""
    for frame, val in keyframes:
        sk.value = val
        sk.keyframe_insert(data_path="value", frame=frame)
    for fc in obj.data.shape_keys.animation_data.action.fcurves:
        if fc.data_path.endswith(f'key_blocks["{sk.name}"].value'):
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


sk_ext = sk_keys.get("SK_Extended")
sk_cmp = sk_keys.get("SK_Compressed")
sk_inv = sk_keys.get("SK_Inverted")

# SK_Extended: on from 1→125, off by 175
sk_anim(sk_ext, [(1, 1.0), (75, 1.0), (125, 0.0), (300, 0.0)])
# SK_Compressed: ramp up 75→125, hold, ramp down 175→225
sk_anim(sk_cmp, [(1, 0.0), (75, 0.0), (125, 1.0), (175, 1.0), (225, 0.0), (300, 0.0)])
# SK_Inverted: ramp up 175→225, hold, ramp down 275→300
sk_anim(sk_inv, [(1, 0.0), (175, 0.0), (225, 1.0), (275, 1.0), (300, 0.0)])

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(2, -2, 4))
sun = bpy.context.active_object
sun.data.energy = 3.0
sun.data.color  = (1.0, 0.92, 0.80)

bpy.ops.object.light_add(type="POINT", location=(-1, 1, 0.3))
fill = bpy.context.active_object
fill.data.energy = 30.0
fill.data.color  = (0.20, 0.40, 1.0)   # cool cobalt fill

print("✓ record.py set up. Run: bpy.ops.render.render(animation=True)")
print(f"  Output: {OUTPUT_DIR}viewport.mp4")
