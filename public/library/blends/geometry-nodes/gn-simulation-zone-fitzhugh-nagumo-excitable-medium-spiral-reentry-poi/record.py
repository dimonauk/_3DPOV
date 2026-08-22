"""
record.py — Viewport animation renderer for the FitzHugh-Nagumo tutorial.
Outputs to public/library/videos/geometry-nodes/
  gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi/viewport.mp4

Run AFTER blueprint.py has been executed (scene must already exist).
Press Alt+P in the Scripting workspace to render.
"""

import bpy, math, os

OUT_DIR = bpy.path.abspath(
    '//public/library/videos/geometry-nodes/'
    'gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi/')
os.makedirs(OUT_DIR, exist_ok=True)

# ── Render settings ───────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine         = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x   = 1280
sc.render.resolution_y   = 720
sc.render.fps            = 24
sc.frame_start           = 1
sc.frame_end             = 280
sc.render.filepath       = os.path.join(OUT_DIR, 'viewport')
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'

# ── EEVEE Next bloom — wavefronts glow ───────────────────────────────────────
eevee = sc.eevee
if hasattr(eevee, 'bloom_threshold'):
    eevee.use_bloom           = True
    eevee.bloom_threshold     = 0.4
    eevee.bloom_intensity     = 0.8
    eevee.bloom_radius        = 3.5

# ── Orbiting camera — reveals wavefront topology from all angles ──────────────
# A static top-down shot would miss the Z-lifted topography that shows refractory
# depth; a 270° orbit over 280 frames lets the spiral's 3-D bowl shape read clearly.
cam_obj = sc.camera
if cam_obj is None:
    raise RuntimeError("Run blueprint.py first to create the scene and camera.")

N    = 64; CELL = 0.12; centre = (N - 1) * CELL / 2.0
r    = 7.5; z_base = 9.0; tilt = math.radians(55)

for frm in range(1, 281):
    sc.frame_set(frm)
    t   = (frm - 1) / 279.0 * 1.5 * math.pi   # 270° orbit
    cam_obj.location = (
        centre + r * math.sin(t),
        centre - r * math.cos(t),
        z_base,
    )
    cam_obj.rotation_euler = (tilt, 0.0, t)
    cam_obj.keyframe_insert('location',       frame=frm)
    cam_obj.keyframe_insert('rotation_euler', frame=frm)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[FHN] viewport.mp4 written to {OUT_DIR}")
