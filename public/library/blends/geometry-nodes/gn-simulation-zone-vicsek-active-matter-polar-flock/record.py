"""
record.py — Vicsek viewport render (Blender 5.1)
=================================================
Run AFTER blueprint.py in the same Blender session.
Output: public/library/videos/geometry-nodes/
          gn-simulation-zone-vicsek-active-matter-polar-flock/viewport.mp4

280 frames at 30 fps (≈ 9.3 s).  The colour-wheel lattice transitions from
random-rainbow noise (disordered phase) to large coherent teal/violet domains
(ordered phase) as η cools linearly from 2.20 → 0.10.
"""

import bpy, os

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "videos",
    "geometry-nodes",
    "gn-simulation-zone-vicsek-active-matter-polar-flock",
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport")
os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene
scene.render.engine                        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                  = 1920
scene.render.resolution_y                  = 1080
scene.render.fps                           = 30
scene.frame_start                          = 1
scene.frame_end                            = 280
scene.render.image_settings.file_format    = 'FFMPEG'
scene.render.ffmpeg.format                 = 'MPEG4'
scene.render.ffmpeg.codec                  = 'H264'
scene.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
scene.render.filepath                      = OUTPUT_PATH

eevee = scene.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = 0.4
eevee.bloom_intensity = 0.9
eevee.bloom_radius    = 4.0

if scene.world is None:
    scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = False
scene.world.color     = (0.0, 0.0, 0.0)

cam_ob = scene.camera
if cam_ob is None:
    raise RuntimeError("No active camera — run blueprint.py first.")

print(f"[record] Rendering 280 frames → {OUTPUT_PATH}.mp4")
bpy.ops.render.render(animation=True, use_viewport=False)
print("[record] Done — viewport.mp4 written.")
