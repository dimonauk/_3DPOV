"""
record.py — Viewport animation render for the particle spark trail scene.

Renders frames 1–120 of the baked simulation using EEVEE Next with Bloom.
Output: public/library/videos/physics/physics-particle-emitter-spark-trail-wind-deflector/viewport.mp4

IMPORTANT: Run this AFTER baking (Physics ▸ Bake All Dynamics in the Cache
panel). Running before bake produces empty frames — the particle positions
live in the cache, not in the .blend, until baked.

Clip breakdown (30 fps → 4 seconds):
  Frames  1–30: sparks accelerate away from emitter, wind begins deflecting arcs
  Frames 31–55: peak density — sphere deflection and ground scatter visible
  Frames 56–80: late emitter tail, most sparks already grounded
  Frames 81–120: only long-lifetime stragglers remain (lifetime=80 so oldest die)
"""

import bpy
import pathlib

# Resolve relative to this file's location — works regardless of CWD in Blender
OUTPUT_DIR = (
    pathlib.Path(__file__).resolve().parents[5]
    / "public" / "library" / "videos" / "physics"
    / "physics-particle-emitter-spark-trail-wind-deflector"
)


def configure_render():
    sc = bpy.context.scene

    sc.render.engine               = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x         = 1920
    sc.render.resolution_y         = 1080
    sc.render.resolution_percentage = 100
    sc.render.fps                  = 30
    sc.frame_start                 = 1
    sc.frame_end                   = 120

    # Bloom gives the Emission-shaded sparks a visible glow halo
    sc.eevee.use_bloom        = True
    sc.eevee.bloom_intensity  = 0.6
    sc.eevee.bloom_threshold  = 0.8   # only pixels above 0.8 luminance bloom
    sc.eevee.bloom_radius     = 5.0

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    mp4_path = str(OUTPUT_DIR / "viewport.mp4")

    sc.render.filepath                   = mp4_path
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.ffmpeg.audio_codec         = 'NONE'

    print(f"[HoloFlow] record.py configured → {mp4_path}")
    print("[HoloFlow] Render ▸ Render Animation to write the clip.")


configure_render()
