"""
record.py — Three-Body Figure-8 Choreography Viewport Animation
================================================================
Run INSIDE a Blender 5.1 session AFTER executing blueprint.py.

Animation schedule (10 s total, 30 fps, 300 frames):
  Frames   1 –  60  : Basis pose — slow camera approach from above
  Frames  60 – 120  : SK_Wide morphs in (fat tube, emphasises figure-8 shape)
  Frames 120 – 180  : SK_Wide morphs out; SK_Thin morphs in (wire, shows orbit)
  Frames 180 – 240  : SK_Thin morphs out; back to Basis
  Frames 240 – 300  : 90° camera orbit around the figure-8 poi head

Output: public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy, math
import mathutils

SLUG = (
    "python-numpy-three-body-figure-8-choreography"
    "-chenciner-montgomery-bishop-tube-poi-webxr"
)
VIDEO_DIR  = f"//../../../../videos/scripting/{SLUG}"
VIDEO_PATH = f"{VIDEO_DIR}/viewport.mp4"

FPS    = 30
FRAMES = 300

# ─── Render settings ──────────────────────────────────────────────────────────
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

sc.render.engine      = 'BLENDER_EEVEE_NEXT'
eevee                 = sc.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = 0.30
eevee.bloom_intensity = 1.10

# ─── Object & shape keys ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("threebody_fig8_poi")
if not obj or not obj.data.shape_keys:
    raise RuntimeError("Run blueprint.py first — threebody_fig8_poi not found.")

keys = obj.data.shape_keys.key_blocks
for k in keys[1:]:
    k.value = 0.0


def keyframe_sk(key_name, f_start, f_peak, f_end):
    """Animate a shape key 0 → 1 → 0 with LINEAR interpolation."""
    k = keys[key_name]
    k.value = 0.0; k.keyframe_insert("value", frame=f_start)
    k.value = 1.0; k.keyframe_insert("value", frame=f_peak)
    k.value = 0.0; k.keyframe_insert("value", frame=f_end)
    action = obj.data.shape_keys.animation_data.action
    for fc in action.fcurves:
        if f'key_blocks["{key_name}"]' in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


# SK_Wide: fat tube — shows the figure-8 as a solid torus-knot-like form
keyframe_sk("SK_Wide",  60, 100, 160)
# SK_Thin: wire — draws attention to the orbit path's self-intersection
keyframe_sk("SK_Thin", 160, 200, 235)

# ─── Camera orbit (frames 240–300) ───────────────────────────────────────────
cam = sc.camera or bpy.data.objects.get("Camera")
if cam:
    # Orbit around the figure-8 centroid (approximately x=0, y=0)
    centre    = mathutils.Vector((0.0, 0.0, 0.0))
    radius    = 1.45
    z_cam     = 0.55
    ang_start = math.radians(25)
    ang_end   = math.radians(115)

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
print(f"[three-body] ✓ Rendered → {VIDEO_PATH}")
