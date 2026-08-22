"""
record.py — Render Chladni wave animation to viewport.mp4 (Blender 5.1).

Run after blueprint.py has built and saved the .blend file:
  blender hf_chladni_wave.blend --background --python record.py

Outputs 120 frames (5 s at 24 fps) to:
  public/library/videos/geometry-nodes/
  gn-simulation-zone-wave-equation-chladni-standing-waves/viewport.mp4

Camera looks straight down at the plate; EEVEE Next renders emission
with bloom so nodal lines appear black against glowing peaks and troughs.
"""

import bpy, os

SLUG      = "gn-simulation-zone-wave-equation-chladni-standing-waves"
FRAME_END = 120


def main():
    out_dir = os.path.join(
        bpy.path.abspath('//'),
        f'public/library/videos/geometry-nodes/{SLUG}/')
    os.makedirs(out_dir, exist_ok=True)

    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAME_END

    sc.render.engine                        = 'BLENDER_EEVEE_NEXT'
    sc.render.image_settings.file_format    = 'FFMPEG'
    sc.render.ffmpeg.format                 = 'MPEG4'
    sc.render.ffmpeg.codec                  = 'H264'
    sc.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
    sc.render.filepath                      = os.path.join(out_dir, 'viewport.mp4')
    sc.render.resolution_x                  = 1920
    sc.render.resolution_y                  = 1080
    sc.render.fps                           = 24

    sc.eevee.use_bloom       = True
    sc.eevee.bloom_intensity = 0.6
    sc.eevee.bloom_threshold = 0.3

    bpy.ops.render.render(animation=True)
    print(f'[record.py] saved → {sc.render.filepath}')


if __name__ == '__main__':
    main()
