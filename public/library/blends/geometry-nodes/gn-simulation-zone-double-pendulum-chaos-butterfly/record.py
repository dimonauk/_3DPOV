"""
record.py — Double Pendulum Chaos viewport render (Blender 5.1)
===============================================================
Run AFTER blueprint.py has been executed in the same Blender session.
Outputs: public/library/videos/geometry-nodes/
           gn-simulation-zone-double-pendulum-chaos-butterfly/viewport.mp4

The render sweeps frames 1–250 at 60 fps (≈ 4.2 s) with EEVEE Next +
Bloom enabled. The black background makes the neon trails read as
long-exposure light-painting photographs.
"""

import bpy, os

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos",
    "geometry-nodes",
    "gn-simulation-zone-double-pendulum-chaos-butterfly",
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport")

os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene

# ── Render settings ────────────────────────────────────────────────────────────
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.fps                 = 60
scene.frame_start                = 1
scene.frame_end                  = 250
scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
scene.render.filepath            = OUTPUT_PATH

# ── EEVEE Next — Bloom for neon glow ─────────────────────────────────────────
eevee = scene.eevee
eevee.use_bloom        = True
eevee.bloom_threshold  = 0.25
eevee.bloom_intensity  = 1.5
eevee.bloom_radius     = 6.0
eevee.bloom_color      = (1.0, 1.0, 1.0)

# ── World: pure black background ──────────────────────────────────────────────
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = False
scene.world.color = (0.0, 0.0, 0.0)

# ── Verify camera and Build modifier configuration ───────────────────────────
cam_ob = scene.camera
if cam_ob is None:
    raise RuntimeError("No active camera — run blueprint.py first.")

# Ensure all Build modifiers start at frame 1
for ob in bpy.data.objects:
    for mod in ob.modifiers:
        if mod.type == 'BUILD':
            mod.frame_start    = 1.0
            mod.frame_duration = 250.0
            mod.use_random_order = False

print(f"[record] Rendering {scene.frame_end - scene.frame_start + 1} frames → {OUTPUT_PATH}.mp4")

# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, use_viewport=False)
print("[record] Done — viewport.mp4 written.")
