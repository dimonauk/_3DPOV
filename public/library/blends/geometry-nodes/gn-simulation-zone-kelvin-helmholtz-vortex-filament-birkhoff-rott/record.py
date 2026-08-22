"""
record.py — Viewport animation render for KH Vortex Filament (Blender 5.1)
===========================================================================
Run AFTER blueprint.py in the same Blender session.
Renders frames 1–200 as an EEVEE animation to:
  public/library/videos/geometry-nodes/
    gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott/viewport.mp4

The render shows a wavy line of N=24 glowing filaments at frame 1 that
progressively rolls into a bright orange-and-blue spiral by frame 200 —
the classic Kelvin-Helmholtz cat's-eye vortex against black.
"""

import bpy, os

SLUG      = "gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott"
VIDEO_DIR = os.path.join(
    bpy.path.abspath('//'),
    f'public/library/videos/geometry-nodes/{SLUG}/')
os.makedirs(VIDEO_DIR, exist_ok=True)

scene = bpy.context.scene

scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format                = 'MPEG4'
scene.render.ffmpeg.codec                 = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
scene.render.filepath = os.path.join(VIDEO_DIR, 'viewport')

scene.render.resolution_x          = 1280
scene.render.resolution_y          = 720
scene.render.resolution_percentage = 100
scene.render.fps                    = 24
scene.frame_start                   = 1
scene.frame_end                     = 200

# Black world — emission tube pops against the void
if not scene.world:
    scene.world = bpy.data.worlds.new('KHWorld')
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value    = (0, 0, 0, 1)
    bg.inputs['Strength'].default_value = 0.0

scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom             = True
scene.eevee.bloom_intensity       = 0.9
scene.eevee.bloom_threshold       = 0.3
scene.eevee.bloom_radius          = 4.0

bpy.ops.render.render(animation=True)
print(f'[record] → {VIDEO_DIR}viewport.mp4')
