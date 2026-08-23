"""
record.py — Viviani Curve Viewport Animation
============================================
Run INSIDE a Blender 5.1 session AFTER executing blueprint.py.

Animation schedule (9 s total, 30 fps, 270 frames):
  Frames   1 – 60   : Basis resting pose — slow camera approach
  Frames  60 – 120  : SK_Contracted morphs in (tighter figure-8)
  Frames 120 – 180  : SK_Expanded morphs in (wider figure-8)
  Frames 180 – 240  : SK_Thick morphs in (plump tube)
  Frames 240 – 270  : All morph out; 90° camera orbit

Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy, math
import mathutils

SLUG = (
    "python-numpy-viviani-curve-sphere-cylinder-intersection"
    "-bishop-tube-figure8-poi-webxr"
)
VIDEO_DIR  = f"//../../../../videos/scripting/{SLUG}"
VIDEO_PATH = f"{VIDEO_DIR}/viewport.mp4"

FPS    = 30
FRAMES = 270

# ─── Scene render settings ────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.fps          = FPS
sc.frame_start         = 1
sc.frame_end           = FRAMES
sc.render.filepath     = bpy.path.abspath(VIDEO_PATH)
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080

sc.render.engine = 'BLENDER_EEVEE_NEXT'
eevee = sc.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = 0.35
eevee.bloom_intensity = 0.90

# ─── Object & shape keys ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("viviani_poi")
if not obj or not obj.data.shape_keys:
    raise RuntimeError("Run blueprint.py first — viviani_poi not found.")

keys = obj.data.shape_keys.key_blocks

# Zero out all non-basis keys
for k in keys[1:]:
    k.value = 0.0

def keyframe_sk(key_name, f_start, f_peak, f_end):
    """Animate a single shape key from 0 → 1 → 0."""
    k = keys[key_name]
    k.value = 0.0; k.keyframe_insert("value", frame=f_start)
    k.value = 1.0; k.keyframe_insert("value", frame=f_peak)
    k.value = 0.0; k.keyframe_insert("value", frame=f_end)
    # Linearise FCurve to remove Bézier easing
    action = obj.data.shape_keys.animation_data.action
    for fc in action.fcurves:
        if f'key_blocks["{key_name}"]' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

keyframe_sk("SK_Contracted",  1,  60, 120)
keyframe_sk("SK_Expanded",  120, 160, 210)
keyframe_sk("SK_Thick",     210, 240, 265)

# ─── Camera orbit (frames 240–270) ───────────────────────────────────────────
cam = sc.camera or bpy.data.objects.get("Camera")
if cam:
    centre  = mathutils.Vector((0.5, 0.0, 0.0))  # sphere centre approx
    radius  = 3.2
    z_cam   = 1.4
    ang_start = math.radians(48)
    ang_end   = math.radians(138)

    for frame in range(240, FRAMES + 1):
        frac  = (frame - 240) / max(1, FRAMES - 240)
        angle = ang_start + (ang_end - ang_start) * frac
        cam.location = centre + mathutils.Vector((
            radius * math.cos(angle),
           -radius * math.sin(angle),
            z_cam,
        ))
        cam.keyframe_insert("location", frame=frame)

# ─── Render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[viviani] ✓ Rendered → {VIDEO_PATH}")
