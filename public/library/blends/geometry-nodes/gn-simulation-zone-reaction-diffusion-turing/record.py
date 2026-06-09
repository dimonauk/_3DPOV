"""
record.py — viewport animation for gn-simulation-zone-reaction-diffusion-turing
Outputs: public/library/videos/geometry-nodes/gn-simulation-zone-reaction-diffusion-turing/viewport.mp4

Run AFTER blueprint.py has saved reaction_diffusion.blend:
  blender reaction_diffusion.blend --background --python record.py

The clip renders frames 1–120 from the top-down orthographic camera, showing
the pattern's evolution from a blank teal substrate through early branching
(frames 30–60) to an emerging labyrinthine Turing structure (frames 80–120).
Note: the Simulation Zone evaluates sequentially, so all 120 frames must render
in order — the render will be slower than a static-geometry clip of the same length.
"""

import bpy, os

_here    = os.path.dirname(bpy.data.filepath)
VIDEO_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes"
    "/gn-simulation-zone-reaction-diffusion-turing",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start, sc.frame_end = 1, 120   # pattern visibly forms by frame 120
sc.render.fps                    = 24
sc.render.resolution_x           = 1280
sc.render.resolution_y           = 720
sc.render.resolution_percentage  = 100
sc.render.image_settings.file_format    = "FFMPEG"
sc.render.ffmpeg.format                 = "MPEG4"
sc.render.ffmpeg.codec                  = "H264"
sc.render.ffmpeg.constant_rate_factor   = "HIGH"
sc.render.ffmpeg.audio_codec            = "NONE"
sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")

# EEVEE Next is fast and reads Named Attributes from GN modifiers correctly;
# no need for Cycles for a technique-preview clip of a flat shaded grid.
sc.render.engine = "BLENDER_EEVEE_NEXT"

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
