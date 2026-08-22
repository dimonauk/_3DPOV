"""
record.py — Viewport render for Kuramoto tutorial.
Run AFTER blueprint.py in the same Blender session.

Outputs:
  public/library/videos/scripting/python-kuramoto-coupled-oscillators-phase-sync-poi-webxr/viewport.mp4

Technique: EEVEE Next with Bloom enabled captures emissive sphere glow.
The 240-frame animation shows three phases:
  0–80  : random colours, independent orbits   (K = 0)
  80–160: colours converge, cluster forms       (K ramps)
  160–240: single coherent blob, one colour     (K = K_FINAL)
"""

import bpy

OUTPUT_REL = (
    "//../../../../public/library/videos/"
    "scripting/python-kuramoto-coupled-oscillators-phase-sync-poi-webxr/viewport"
)

scene = bpy.context.scene

scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_REL
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 240

# Bloom makes the emissive oscillators glow against the dark field
scene.eevee.use_bloom = True
scene.eevee.bloom_threshold = 0.5
scene.eevee.bloom_intensity = 0.8
scene.eevee.bloom_radius = 4.0

bpy.ops.render.render(animation=True)
print("Kuramoto viewport.mp4 render done.")
