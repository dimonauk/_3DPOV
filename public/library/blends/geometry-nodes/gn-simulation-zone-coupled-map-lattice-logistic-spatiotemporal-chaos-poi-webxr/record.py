"""
record.py — EEVEE Next viewport render for the CML Poi Ring (Blender 5.1)
Outputs: public/library/videos/geometry-nodes/
         gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr/
         viewport.mp4
Run after blueprint.py has built the scene.
"""

import bpy, os

SLUG      = "gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr"
OUT_DIR   = os.path.join(
    os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp",
    "../../../../videos/geometry-nodes", SLUG
)
FRAME_END = 180
FPS       = 30

os.makedirs(OUT_DIR, exist_ok=True)

sc = bpy.context.scene
sc.render.engine        = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x  = 1920
sc.render.resolution_y  = 1080
sc.render.fps           = FPS
sc.frame_start          = 1
sc.frame_end            = FRAME_END

sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

sc.eevee.use_bloom       = True
sc.eevee.bloom_intensity = 0.5
sc.eevee.bloom_radius    = 3.0
sc.eevee.taa_render_samples = 16

bpy.ops.render.render(animation=True)
print(f"[record] Rendered → {sc.render.filepath}")
