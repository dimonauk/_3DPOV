"""
Blender 5.1 — record.py: Viewport animation for GN Repeat Zone tutorial
========================================================================
Run AFTER blueprint.py has been executed in the same Blender session
(or load branch_ball.blend first).

Animates the Iterations modifier input from 0 → 5 over 90 frames
so the spike ball grows pass-by-pass. Renders to:
  public/library/videos/geometry-nodes/gn-repeat-zone-iterative-lsystem-branch-growth/viewport.mp4

Run headless:
  blender --background branch_ball.blend --python record.py

Licence: CC0 1.0 Universal — Holoflow Studio
"""

import bpy
import math

OBJECT_NAME  = "branch_ball"
GROUP_NAME   = "HF_RepeatBranch"
MAX_ITER     = 5
TOTAL_FRAMES = 90           # 3 s @ 30 fps: each of 5 passes gets ~18 frames
OUTPUT_PATH  = "//../../videos/geometry-nodes/gn-repeat-zone-iterative-lsystem-branch-growth/viewport"

# ── Locate object + modifier ──────────────────────────────────────────────────
obj = bpy.data.objects.get(OBJECT_NAME)
if obj is None:
    raise RuntimeError("Run blueprint.py first to create branch_ball")

mod = obj.modifiers.get(GROUP_NAME)
if mod is None:
    raise RuntimeError(f"Modifier {GROUP_NAME!r} not found on {OBJECT_NAME!r}")

ng  = mod.node_group

# Find the Iterations socket identifier
iterations_id = None
for item in ng.interface.items_tree:
    if item.item_type == "SOCKET" and item.in_out == "INPUT" and item.name == "Iterations":
        iterations_id = item.identifier
        break
if iterations_id is None:
    raise RuntimeError("Could not find 'Iterations' socket in node group interface")

data_path = f'modifiers["{GROUP_NAME}"]["{iterations_id}"]'

# ── Keyframe Iterations: step function 0,1,2,3,4,5 ───────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

frames_per_step = TOTAL_FRAMES // (MAX_ITER + 1)

for step in range(MAX_ITER + 1):
    frame = 1 + step * frames_per_step
    mod[iterations_id] = step
    obj.keyframe_insert(data_path=data_path, frame=frame)

# Last keyframe holds MAX_ITER for remaining frames
mod[iterations_id] = MAX_ITER
obj.keyframe_insert(data_path=data_path, frame=TOTAL_FRAMES)

# Make keyframes CONSTANT (step, not interpolated) so viewport shows clean passes
action = obj.animation_data.action
for fcurve in action.fcurves:
    if data_path in fcurve.data_path:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "CONSTANT"

# ── Render settings for opengl viewport ──────────────────────────────────────
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.fps            = 30
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format  = "MPEG4"
scene.render.ffmpeg.codec   = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath       = OUTPUT_PATH

# Viewport shading: solid mode with studio light
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type          = "SOLID"
                space.shading.light         = "STUDIO"
                space.shading.color_type    = "MATERIAL"
                space.overlay.show_overlays = False   # hide grid/axes
        break

# ── Render ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, write_still=False)
print(f"✓ Viewport animation written to {OUTPUT_PATH}.mp4")
