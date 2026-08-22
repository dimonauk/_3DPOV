"""
record.py — Viewport animation render for GP3 Line Art tutorial (Blender 5.1)
==============================================================================
Run AFTER blueprint.py has saved the .blend.  This script:
  - Opens that .blend
  - Sets up a solid-shading viewport render (Workbench) at 1280×720 30fps
  - Renders frames 1-72 (3-second turntable) to viewport.mp4
  - Uses bpy.ops.render.opengl() which captures the 3D viewport including
    realtime Line Art strokes — the approachto record the GP overlay.

Output
------
  public/library/videos/scripting/python-gp3-lineart-modifier-toon-outline-batch-vrm/viewport.mp4
"""

import bpy
import os

BLEND_FILE   = os.path.join(os.path.dirname(__file__), "gp3_lineart_vrm_proxy.blend")
OUTPUT_DIR   = os.path.abspath(
    os.path.join(os.path.dirname(__file__),
    "../../../../public/library/videos/scripting/python-gp3-lineart-modifier-toon-outline-batch-vrm/")
)
OUTPUT_PATH  = os.path.join(OUTPUT_DIR, "viewport")   # FFmpeg appends .mp4
FRAME_START  = 1
FRAME_END    = 72   # 3 s at 24 fps; use 72 for a full 3× turntable
FPS          = 24

os.makedirs(OUTPUT_DIR, exist_ok=True)

# open the saved blend
bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)

scene = bpy.context.scene
scene.render.resolution_x    = 1280
scene.render.resolution_y    = 720
scene.render.resolution_percentage = 100
scene.render.fps             = FPS
scene.frame_start            = FRAME_START
scene.frame_end              = FRAME_END

# output to FFmpeg H.264
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

# use Workbench so GP strokes render on top of solid shading in opengl capture
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light             = "STUDIO"
scene.display.shading.color_type        = "MATERIAL"
scene.display.shading.show_cavity       = True

# find 3D viewport and set it to SOLID so GP strokes are visible
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        area.spaces.active.shading.type = "SOLID"
        area.spaces.active.overlay.show_overlays = True
        break

# WHY opengl render: bpy.ops.render.render() uses the engine pipeline which
# does NOT capture viewport GP overlays in Workbench mode.  opengl=True
# screenshots each frame from the actual 3D viewport, giving us the realtime
# Line Art strokes exactly as they appear during normal use.
with bpy.context.temp_override(scene=scene):
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)

print(f"[record] viewport animation → {OUTPUT_PATH}.mp4")
