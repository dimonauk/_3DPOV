#!/usr/bin/env python3
"""
record.py — viewport animation for GN Raycast Shadow Mask
Blender 5.1 | CC0 | Holoflow Studio

Animates the blocker sphere in a slow circle above the ground grid so the
shadow footprint sweeps across the plane. The camera holds a fixed elevated
angle looking down. Renders 72 frames at 24fps → 3 seconds.

The key teaching moment: as the sphere moves, the Raycast GN re-evaluates
each frame and the shadow_mask attribute updates in real time. No re-baking.
No simulation. A simple position change on the blocker propagates through
the ObjectInfo → Raycast → Switch → StoreNamedAttribute chain automatically.

Run headlessly (after blueprint.py has been run):
    blender --background raycast_shadow_grid.blend --python record.py
Or from scratch (rebuilds scene first):
    blender --background --python record.py
"""

import bpy
import math
from pathlib import Path

HERE      = Path(__file__).parent
BLEND_SRC = HERE / "raycast_shadow_grid.blend"
VIDEO_OUT = HERE.parents[3] / "videos" / "geometry-nodes" / "gn-raycast-shadow-mask" / "viewport.mp4"
VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

TOTAL_FRAMES  = 72      # 3 s at 24 fps
ORBIT_RADIUS  = 1.4     # m — lateral orbit radius of the blocker
ORBIT_HEIGHT  = 2.5     # m — fixed Z height during orbit

# ============================================================
# Load or rebuild the scene
# ============================================================
if BLEND_SRC.exists():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_SRC))
else:
    exec(compile(open(HERE / "blueprint.py").read(), "blueprint.py", "exec"))

scene             = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES

# ============================================================
# Animate the blocker on a horizontal circle
# One full revolution over TOTAL_FRAMES frames — the shadow
# sweeps a full 360° arc across the ground plane.
# ============================================================
blocker = bpy.data.objects.get("shadow_blocker")
if blocker is None:
    raise RuntimeError("shadow_blocker object not found. Run blueprint.py first.")

blocker.animation_data_create()
blocker.animation_data.action = bpy.data.actions.new("BlockerOrbit")

for f in range(1, TOTAL_FRAMES + 1):
    t     = (f - 1) / TOTAL_FRAMES          # 0..1 over animation
    angle = 2.0 * math.pi * t               # full circle
    x     = ORBIT_RADIUS * math.cos(angle)
    y     = ORBIT_RADIUS * math.sin(angle)
    blocker.location = (x, y, ORBIT_HEIGHT)
    blocker.keyframe_insert("location", frame=f)

# ============================================================
# Render settings — EEVEE Next for speed
# ============================================================
render = scene.render
render.fps           = 24
render.resolution_x  = 1920
render.resolution_y  = 1080
render.image_settings.file_format = 'FFMPEG'
render.ffmpeg.format              = 'MPEG4'
render.ffmpeg.codec               = 'H264'
render.ffmpeg.constant_rate_factor = 'HIGH'
render.filepath       = str(VIDEO_OUT)

scene.eevee.taa_render_samples = 16   # fast, shadow mask is flat-colour

# ============================================================
# Camera — fixed elevated view, grid fills frame
# ============================================================
cam = scene.camera
if cam is None:
    cam_data = bpy.data.cameras.new("Cam")
    cam      = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

cam.location       = (3.0, -3.5, 6.5)
cam.rotation_euler = (0.85, 0.0, 0.60)

# ============================================================
# Render animation
# ============================================================
bpy.ops.render.render(animation=True, write_still=False)
print(f"[record] Viewport animation → {VIDEO_OUT}")
