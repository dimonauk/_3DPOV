"""
record.py — Viewport animation render for Predator-Prey GN tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Runs blueprint.main() to build the scene, then renders frames 0–120 to
public/library/videos/geometry-nodes/gn-simulation-zone-predator-prey-lotka-volterra-ecosystem/viewport.mp4
using the EEVEE Next engine at 1920×1080, 30 fps.

Invoke from Blender's scripting workspace or via:
  blender --background --python record.py
"""

import bpy
import sys
import os

# ── Run blueprint first if scene is empty ─────────────────────────────────────
if 'pp_grid' not in bpy.data.objects:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, script_dir)
    import blueprint
    blueprint.main()

# ── Render parameters ─────────────────────────────────────────────────────────
FRAME_START = 0
FRAME_END   = 120
FPS         = 30
OUTPUT_PATH = '//../../videos/geometry-nodes/gn-simulation-zone-predator-prey-lotka-volterra-ecosystem/viewport'

scene = bpy.context.scene
scene.render.engine            = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.resolution_percentage = 100
scene.render.fps               = FPS
scene.frame_start              = FRAME_START
scene.frame_end                = FRAME_END
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format     = 'MPEG4'
scene.render.ffmpeg.codec      = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath          = OUTPUT_PATH

# ── Camera: top-down, slightly angled, sees the whole grid ───────────────────
bpy.ops.object.camera_add(location=(0, -4.0, 8.5))
cam = bpy.context.active_object
cam.rotation_euler = (1.05, 0.0, 0.0)  # ~60° tilt — nice perspective on spirals
scene.camera = cam

# ── World: black void so emission colours pop ─────────────────────────────────
bpy.data.worlds['World'].node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
bpy.data.worlds['World'].node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0

# ── Render ────────────────────────────────────────────────────────────────────
os.makedirs(os.path.dirname(bpy.path.abspath(OUTPUT_PATH + '.mp4')), exist_ok=True)
bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written.")
