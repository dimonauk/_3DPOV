"""
record.py — Viewport animation render for the Ising model (Blender 5.1)
========================================================================
Run this AFTER blueprint.py in the same Blender session.
Renders frames 1–200 as an EEVEE animation to:
  public/library/videos/geometry-nodes/
    gn-simulation-zone-ising-model-spin-lattice-phase-transition/viewport.mp4

The render captures the phase transition: disordered noise at frame 1
coalesces into growing magnetic domains by frame 100 and resolves to
near-monochromatic order by frame 200.
"""

import bpy, os

SLUG      = "gn-simulation-zone-ising-model-spin-lattice-phase-transition"
VIDEO_DIR = os.path.join(
    bpy.path.abspath('//'),
    f'public/library/videos/geometry-nodes/{SLUG}/')
os.makedirs(VIDEO_DIR, exist_ok=True)

scene = bpy.context.scene

# Output settings
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = os.path.join(VIDEO_DIR, 'viewport')

scene.render.resolution_x  = 1280
scene.render.resolution_y  = 1280
scene.render.resolution_percentage = 100
scene.render.fps            = 24
scene.frame_start           = 1
scene.frame_end             = 200

# World: pure black for emission contrast
if not scene.world:
    scene.world = bpy.data.worlds.new('IsingWorld')
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value  = (0, 0, 0, 1)
    bg.inputs['Strength'].default_value = 0.0

# EEVEE Next with bloom
scene.render.engine               = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_bloom             = True
scene.eevee.bloom_intensity       = 0.4
scene.eevee.bloom_threshold       = 0.5
scene.eevee.bloom_radius          = 3.0

bpy.ops.render.render(animation=True)
print(f'[record] → {VIDEO_DIR}viewport.mp4')
