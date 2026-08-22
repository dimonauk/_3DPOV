"""
record.py — Viewport animation render for GN Socket Panels tutorial.

Animates the Noise Scale parameter of the HF_PoiEnergyRibbon modifier
from 1.0 → 10.0 → 1.0 over 120 frames, producing a shimmering
morphing-ribbon effect that demonstrates the modifier's live response
to panel parameter changes.

Run AFTER blueprint.py. Output: viewport.mp4 at 30 fps, 4 seconds.
"""

import bpy
import math
import os

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

N_FRAMES = 120
FPS = 30
OUTPUT_REL = "//../../videos/geometry-nodes/gn-socket-panels-interface-collapsible-modifier-ui/viewport"

ob   = bpy.data.objects.get("hf_poi_energy_ribbon")
mod  = ob.modifiers.get("HF_PoiEnergyRibbon") if ob else None

if ob is None or mod is None:
    raise RuntimeError("Run blueprint.py first — object/modifier not found.")


# ---------------------------------------------------------------------------
# Keyframe Noise Scale on the modifier
# ---------------------------------------------------------------------------

# Identify the socket identifier for "Noise Scale".
# interface.items_tree lists ALL interface items (panels + sockets) in order.
noise_scale_id = None
for item in mod.node_group.interface.items_tree:
    if getattr(item, 'name', None) == "Noise Scale":
        noise_scale_id = item.identifier
        break

if noise_scale_id is None:
    raise RuntimeError("'Noise Scale' socket not found in interface.")

# Animate: 1.0 at frame 1, 10.0 at frame 60, 1.0 at frame 120
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = N_FRAMES
scene.render.fps = FPS

for frame, value in [(1, 1.0), (60, 10.0), (120, 1.0)]:
    scene.frame_set(frame)
    mod[noise_scale_id] = value
    mod.keyframe_insert(data_path=f'["{noise_scale_id}"]', frame=frame)


# ---------------------------------------------------------------------------
# Render settings for OpenGL viewport render
# ---------------------------------------------------------------------------

scene.render.filepath = OUTPUT_REL
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

# Ensure output directory exists
out_dir = bpy.path.abspath(os.path.dirname(OUTPUT_REL))
os.makedirs(out_dir, exist_ok=True)


# ---------------------------------------------------------------------------
# Set viewport shading and render
# ---------------------------------------------------------------------------

# Use solid + EEVEE rendering via OpenGL
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'RENDERED'
        break

bpy.ops.render.opengl(animation=True, view_context=True)

print(f"[HF] Viewport render complete → {OUTPUT_REL}")
