"""
record.py — Render LJ crystal nucleation animation to viewport.mp4 (Blender 5.1).

Run after blueprint.py has built the .blend file:
  blender hf_lj_crystal.blend --background --python record.py

Outputs 240 frames (10 s at 24 fps) to:
  public/library/videos/scripting/
  python-lennard-jones-md-crystal-nucleation-berendsen/viewport.mp4

Orthographic top-down view, EEVEE Next + Bloom:
  Frame   1–80:  white-hot scattered particles (disordered liquid)
  Frame  80–160: cyan — clustering begins, short-range order emerges
  Frame 160–240: violet — hexagonal crystal domains visible
"""

import bpy, os

SLUG      = "python-lennard-jones-md-crystal-nucleation-berendsen"
FRAME_END = 240


def main() -> None:
    out_dir = os.path.join(
        bpy.path.abspath('//'),
        f'public/library/videos/scripting/{SLUG}/')
    os.makedirs(out_dir, exist_ok=True)

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, FRAME_END

    sc.render.engine                      = 'BLENDER_EEVEE_NEXT'
    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format               = 'MPEG4'
    sc.render.ffmpeg.codec                = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath                    = os.path.join(out_dir, 'viewport.mp4')
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.render.fps                         = 24

    sc.eevee.use_bloom       = True
    sc.eevee.bloom_threshold = 0.22
    sc.eevee.bloom_intensity = 1.3
    sc.eevee.bloom_radius    = 4.0

    bpy.ops.render.render(animation=True)
    print(f'[record.py] saved → {sc.render.filepath}')


if __name__ == '__main__':
    main()
