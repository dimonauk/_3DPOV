"""
record.py — Viewport animation renderer for the Kuramoto tutorial.
Outputs to public/library/videos/geometry-nodes/
  gn-simulation-zone-kuramoto-coupled-phase-oscillators-mean-field-order-parameter-poi-ring-webxr/viewport.mp4

Run AFTER blueprint.py (scene must already exist).
Press Alt+P in the Scripting workspace.
"""

import bpy, math, os

SLUG = ("gn-simulation-zone-kuramoto-coupled-phase-oscillators-"
        "mean-field-order-parameter-poi-ring-webxr")
OUT_DIR = bpy.path.abspath(
    f'//public/library/videos/geometry-nodes/{SLUG}/')
os.makedirs(OUT_DIR, exist_ok=True)

# ── Render settings ───────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine                      = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x                = 1280
sc.render.resolution_y                = 720
sc.render.fps                         = 24
sc.frame_start                        = 1
sc.frame_end                          = 240
sc.render.filepath                    = os.path.join(OUT_DIR, 'viewport')
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'

# ── EEVEE Next bloom — glowing oscillator ring ────────────────────────────────
eevee = sc.eevee
if hasattr(eevee, 'bloom_threshold'):
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.3
    eevee.bloom_intensity = 1.2
    eevee.bloom_radius    = 4.0

# ── Camera animation ──────────────────────────────────────────────────────────
# The shot starts overhead (Z-axis view, full ring visible) and gently tilts
# to a 50° elevation angle by frame 120 — once the ring has mostly locked,
# the oblique angle reveals the order-parameter Z lift.
cam = sc.camera
if cam is None:
    raise RuntimeError("Run blueprint.py first.")

r_cam   = 3.5
z_start = 4.5
z_end   = 2.8
tilt_s  = math.radians(0)     # fully overhead
tilt_e  = math.radians(50)    # 50° tilt at end
spin    = math.radians(60)     # 60° slow orbit over full clip

for frm in range(1, 241):
    sc.frame_set(frm)
    t = (frm - 1) / 239.0           # 0 → 1
    angle = spin * t                 # slow anticlockwise orbit
    tilt  = tilt_s + (tilt_e - tilt_s) * t
    z     = z_start + (z_end - z_start) * t
    cam.location = (
        r_cam * math.sin(angle),
        -r_cam * math.cos(angle),
        z,
    )
    cam.rotation_euler = (tilt, 0.0, angle)
    cam.keyframe_insert('location',       frame=frm)
    cam.keyframe_insert('rotation_euler', frame=frm)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[Kuramoto] viewport.mp4 written → {OUT_DIR}")
