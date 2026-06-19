"""
record.py — Viewport animation render for GOL mesh-faces tutorial.
Blender 5.1  ·  CC0  ·  Holoflow Studio

Runs blueprint.main() to build the scene, then renders frames 0–80 to
public/library/videos/geometry-nodes/gn-simulation-zone-game-of-life-mesh-faces/viewport.mp4
using EEVEE Next with the default orthographic top-down camera.

Usage (from a terminal in this directory):
  blender --background --python record.py

The .mp4 is produced by Blender's FFmpeg output via the Sequencer, so
no external tools are required.  The render resolution matches blueprint.py
(1080×1080) at 24 fps — adjust FPS below if your OBS recording targets 30 fps.
"""

import sys, os
import bpy

# ── Locate and import blueprint from the same directory ───────────────────────
HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import importlib, blueprint as bp
importlib.reload(bp)

# ── Recording parameters ──────────────────────────────────────────────────────
RECORD_START = 0
RECORD_END   = 80       # 80 frames — enough for GOL to evolve visibly
FPS          = 24
OUTPUT_DIR   = os.path.join(HERE, '..', '..', '..', '..', 'videos',
                            'geometry-nodes',
                            'gn-simulation-zone-game-of-life-mesh-faces')
OUTPUT_PATH  = os.path.join(OUTPUT_DIR, 'viewport.mp4')


def configure_output(scn: bpy.types.Scene):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    scn.render.fps           = FPS
    scn.frame_start          = RECORD_START
    scn.frame_end            = RECORD_END
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format              = 'MPEG4'
    scn.render.ffmpeg.codec               = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'HIGH'  # CRF ~18, visually lossless
    scn.render.ffmpeg.audio_codec         = 'NONE'
    scn.render.filepath      = OUTPUT_PATH
    scn.render.use_sequencer = False  # render direct from 3D scene


def main():
    bp.main()                              # build GOL scene via blueprint
    scn = bpy.context.scene
    configure_output(scn)

    # Warm the simulation cache for RECORD_END frames so every frame is
    # fully evaluated before the render pass reads it.
    # Without warming, the Simulation Zone may show a stale single-frame result.
    for f in range(RECORD_START, RECORD_END + 1):
        scn.frame_set(f)
        bpy.context.view_layer.update()

    scn.frame_set(RECORD_START)
    bpy.ops.render.render(animation=True, use_viewport=False)
    print(f"Render complete → {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
