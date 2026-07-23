"""
record.py — Viewport animation render for Abelian Sandpile GN tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Runs blueprint.main() to build the scene, then renders frames 0–200 to
public/library/videos/geometry-nodes/gn-simulation-zone-abelian-sandpile-soc-fractal-cascade/viewport.mp4
at 1920×1080, 30 fps, EEVEE Next engine.

The camera sits directly overhead, looking straight down at the flat grid so
the fractal diamond pattern fills the frame symmetrically.  At frame 0 only
the centre face is lit (N_GRAINS >> 3, renders near-white on the colour ramp).
The avalanche spreads out visibly from ~frame 5 onwards; the diamond silhouette
is clear by ~frame 80; the internal fractal detail settles ~frame 180.

Invoke from Blender's scripting workspace or via:
  blender --background --python record.py
"""

import bpy
import sys
import os

# ── Build scene if not already present ───────────────────────────────────────
if 'sandpile_grid' not in bpy.data.objects:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    import blueprint
    blueprint.main()

# ── Render parameters ─────────────────────────────────────────────────────────
FRAME_START = 0
FRAME_END   = 200
FPS         = 30
OUTPUT_PATH = (
    '//../../videos/geometry-nodes/'
    'gn-simulation-zone-abelian-sandpile-soc-fractal-cascade/viewport'
)

scene = bpy.context.scene
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.resolution_percentage       = 100
scene.render.fps                         = FPS
scene.frame_start                        = FRAME_START
scene.frame_end                          = FRAME_END
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath                    = OUTPUT_PATH

# ── Camera: top-down orthographic, centred on grid ───────────────────────────
# Orthographic removes perspective distortion so every face appears equal size
# — the correct view for a cellular automaton whose spatial scale has no meaning.
bpy.ops.object.camera_add(location=(0.0, 0.0, 9.0))
cam = bpy.context.active_object
cam.name = 'SandpileCam'
cam.rotation_euler = (0.0, 0.0, 0.0)   # straight down
cam.data.type               = 'ORTHO'
cam.data.ortho_scale        = 5.2       # slightly wider than GRID_SCALE=5.0
cam.data.clip_start         = 0.1
cam.data.clip_end           = 20.0
scene.camera = cam

# ── World: black void so emission palette pops ───────────────────────────────
world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
if bg:
    bg.inputs['Color'].default_value    = (0.0, 0.0, 0.0, 1.0)
    bg.inputs['Strength'].default_value = 0.0
scene.world = world

# ── Ensure output directory exists ───────────────────────────────────────────
out_abs = bpy.path.abspath(OUTPUT_PATH + '.mp4')
os.makedirs(os.path.dirname(out_abs), exist_ok=True)

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written.")
