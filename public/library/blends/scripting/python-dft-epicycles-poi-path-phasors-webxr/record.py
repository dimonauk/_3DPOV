"""
Holoflow Studio | DFT Epicycles record.py | Blender 5.1
────────────────────────────────────────────────────────
Viewport OpenGL animation capture — run AFTER blueprint.py has built
the scene. Outputs to:
    public/library/videos/scripting/
    python-dft-epicycles-poi-path-phasors-webxr/viewport.mp4

Resolution: 1920 × 1080, 30 fps, 6 seconds (FRAMES = 180).
Render engine: Workbench (fast, no ray-tracing needed for viewport capture).
"""

import bpy, math

# ─── OUTPUT PATH ─────────────────────────────────────────────────────────────
OUTPUT = "//../../../../videos/scripting/python-dft-epicycles-poi-path-phasors-webxr/viewport"

# ─── RENDER SETTINGS ─────────────────────────────────────────────────────────
scene  = bpy.context.scene
render = scene.render

render.engine          = 'BLENDER_WORKBENCH'
render.resolution_x    = 1920
render.resolution_y    = 1080
render.resolution_percentage = 100
render.fps             = 30
render.image_settings.file_format = 'FFMPEG'
render.ffmpeg.format           = 'MPEG4'
render.ffmpeg.codec            = 'H264'
render.ffmpeg.constant_rate_factor = 'MEDIUM'
render.filepath        = OUTPUT

# ─── WORKBENCH LOOK ──────────────────────────────────────────────────────────
# Studio mode renders emission materials correctly in Workbench.
shading = scene.display.shading
shading.light          = 'STUDIO'
shading.studio_light   = 'Default'
shading.color_type     = 'MATERIAL'
shading.show_specular_highlight = False
shading.background_type = 'WORLD'

# ─── CAMERA POSITION ─────────────────────────────────────────────────────────
# Top-down quarter view so both the chain and the trace are visible.
cam = scene.camera
if cam is None:
    bpy.ops.object.camera_add(
        location=(0, -6.5, 4.5),
        rotation=(math.radians(52), 0, 0),
    )
    scene.camera = bpy.context.object
    cam = scene.camera

cam.location = (0, -6.5, 4.5)
cam.rotation_euler = (math.radians(52), 0, 0)
cam.data.lens = 35  # standard focal length avoids perspective distortion

# ─── FRAME RANGE ─────────────────────────────────────────────────────────────
scene.frame_start = 1
scene.frame_end   = 180

# ─── RENDER ANIMATION ────────────────────────────────────────────────────────
# bpy.ops.render.opengl renders the 3-D viewport directly — no full Cycles/EEVEE
# pass required. Use animation=True for a multi-frame sequence → FFmpeg encodes.
bpy.ops.render.opengl(animation=True)
print("Viewport render complete → viewport.mp4")
