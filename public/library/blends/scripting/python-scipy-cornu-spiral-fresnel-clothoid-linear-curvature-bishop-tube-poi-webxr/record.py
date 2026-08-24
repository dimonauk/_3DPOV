"""
record.py — Cornu Spiral Viewport Animation
============================================
Run INSIDE a Blender 5.1 session AFTER executing blueprint.py.

Animation schedule (10 s total, 30 fps, 300 frames):
  Frames   1 –  60  : Basis pose — slow camera pull-back to show full S-spiral
  Frames  60 – 130  : SK_Helix morphs in (flat → 3-D helical clothoid)
  Frames 130 – 200  : SK_Tight morphs in then out (fewer coils variant)
  Frames 200 – 265  : SK_Fat morphs in (thick tube, emphasises cross-section)
  Frames 265 – 300  : All morph out + 90° camera orbit

Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
import mathutils

SLUG = (
    "python-scipy-cornu-spiral-fresnel-clothoid"
    "-linear-curvature-bishop-tube-poi-webxr"
)
VIDEO_DIR  = f"//../../../../videos/scripting/{SLUG}"
VIDEO_PATH = f"{VIDEO_DIR}/viewport.mp4"

FPS    = 30
FRAMES = 300

# ─── Render settings ─────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.fps              = FPS
sc.frame_start             = 1
sc.frame_end               = FRAMES
sc.render.filepath         = bpy.path.abspath(VIDEO_PATH)
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format    = 'MPEG4'
sc.render.ffmpeg.codec     = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.resolution_x     = 1920
sc.render.resolution_y     = 1080
sc.render.engine           = 'BLENDER_EEVEE_NEXT'
eevee = sc.eevee
eevee.use_bloom            = True
eevee.bloom_threshold      = 0.30
eevee.bloom_intensity      = 0.85

# ─── Object ───────────────────────────────────────────────────────────────────
obj = bpy.data.objects.get("cornu_poi")
if not obj or not obj.data.shape_keys:
    raise RuntimeError("Run blueprint.py first — cornu_poi not found.")

keys = obj.data.shape_keys.key_blocks
for k in keys[1:]:
    k.value = 0.0

def keyframe_sk(key_name, f_start, f_peak, f_end):
    """Animate shape key 0 → 1 → 0 with linear interpolation."""
    k = keys[key_name]
    k.value = 0.0; k.keyframe_insert("value", frame=f_start)
    k.value = 1.0; k.keyframe_insert("value", frame=f_peak)
    k.value = 0.0; k.keyframe_insert("value", frame=f_end)
    action = obj.data.shape_keys.animation_data.action
    for fc in action.fcurves:
        if f'key_blocks["{key_name}"]' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

keyframe_sk("SK_Helix",  60, 100, 130)
keyframe_sk("SK_Tight", 130, 160, 200)
keyframe_sk("SK_Fat",   200, 240, 265)

# ─── Camera motion ───────────────────────────────────────────────────────────
cam = sc.camera or bpy.data.objects.get("Camera")
if cam:
    # Pull-back frames 1–60: z 0.5 → 0.8, y stays at -2.8
    for frame in range(1, 61):
        frac = (frame - 1) / 59.0
        cam.location = mathutils.Vector((0.0, -2.8, 0.5 + 0.3 * frac))
        cam.keyframe_insert("location", frame=frame)

    # Orbit frames 265–300: 0° → 80° around Z, radius 2.8
    for frame in range(265, FRAMES + 1):
        frac  = (frame - 265) / max(1, FRAMES - 265)
        angle = math.radians(80.0 * frac)
        r = 2.8
        cam.location = mathutils.Vector((
            r * math.sin(angle),
           -r * math.cos(angle),
            0.8,
        ))
        cam.keyframe_insert("location", frame=frame)

    # Consistent look-at origin
    for frame in range(1, FRAMES + 1):
        sc.frame_set(frame)
        direction = -cam.location.normalized()
        rot_quat  = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        cam.keyframe_insert("rotation_euler", frame=frame)

# ─── Render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[cornu] ✓ Rendered → {VIDEO_PATH}")
