"""
record.py — Viewport Animation for OSL Script Node Tutorial
Holoflow Studio | CC0

Animates the Script node's Scale input from 2.0 to 12.0 over 60 frames
to show the OSL turbulence changing crack density in real time.

Because OSL runs on CPU, the viewport render uses Cycles Render rather than
the OpenGL viewport — this correctly shows OSL results. Resolution is halved
for speed.

Output: public/library/videos/shading/shader-osl-script-node-cycles-custom-noise/viewport.mp4

Run AFTER blueprint.py in the same Blender session.
"""

import bpy
import os

# ── PARAMETERS ───────────────────────────────────────────────────────────────
TOTAL_FRAMES = 60
SCALE_START  = 2.0    # large, coarse cracks
SCALE_END    = 12.0   # fine, dense cracking

OUTPUT_DIR   = bpy.path.abspath(
    "//../../../../public/library/videos/"
    "shading/shader-osl-script-node-cycles-custom-noise/"
)
OUTPUT_FILE  = os.path.join(OUTPUT_DIR, "viewport")

# ── SCENE ────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = 30

# ── OUTPUT FORMAT ─────────────────────────────────────────────────────────────
os.makedirs(OUTPUT_DIR, exist_ok=True)
scene.render.filepath                   = OUTPUT_FILE
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 50   # 960×540 — faster Cycles render

# Reduce samples for animation recording — enough to show the pattern
scene.cycles.samples         = 32
scene.cycles.use_denoising  = False

# ── FIND THE SCRIPT NODE ─────────────────────────────────────────────────────
mat = bpy.data.materials.get("OslLavaCrack_Mat")
if mat is None:
    raise RuntimeError("OslLavaCrack_Mat not found — run blueprint.py first.")

script_nd = next(
    (n for n in mat.node_tree.nodes if n.type == 'SCRIPT'), None
)
if script_nd is None:
    raise RuntimeError("Script node not found in OslLavaCrack_Mat.")

# ── KEYFRAME SCALE SOCKET ────────────────────────────────────────────────────
# The Scale input is inputs[0] on the Script node (first non-hidden socket).
# We drive it with keyframes on default_value rather than wiring a driver so
# the animation is self-contained in the .blend without an extra Value node.
scale_input = script_nd.inputs[0]

for f in range(1, TOTAL_FRAMES + 1):
    t = (f - 1) / (TOTAL_FRAMES - 1)     # 0.0 → 1.0
    scale_input.default_value = SCALE_START + t * (SCALE_END - SCALE_START)
    scale_input.keyframe_insert(data_path='default_value', frame=f)

# ── RENDER ANIMATION ─────────────────────────────────────────────────────────
# OSL does not render in the OpenGL viewport (bpy.ops.render.opengl). We use
# the full Cycles render path — slower but correct for OSL evaluation.
bpy.ops.render.render(animation=True)

print(f"[record.py] Viewport animation → {OUTPUT_FILE}.mp4")
