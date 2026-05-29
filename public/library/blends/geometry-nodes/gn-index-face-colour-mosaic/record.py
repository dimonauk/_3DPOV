"""
Record: GN Index-Driven Per-Face Colour — viewport animation
Blender 5.1 | CC0 | Holoflow Studio

Run after blueprint.py. Opens the saved .blend, inserts a camera orbit
animation (90° arc over 72 frames at 24fps = 3 s), and renders to
public/library/videos/geometry-nodes/gn-index-face-colour-mosaic/viewport.mp4.

The animation shows the mosaic from the top-oblique entry angle then sweeps
sideways to reveal the flat-faceted geometry — one colour per quad, hard edges,
no interpolation bleed. At the mid-arc the grid reads as a pure pixel-art
palette; at a glancing angle the facet edges become visible.
"""

import bpy
import math
from pathlib import Path

# ─── Paths ──────────────────────────────────────────────────────────────────
_HERE    = Path(__file__).parent
_LIB     = _HERE.parent.parent.parent.parent
BLEND_IN = _LIB / "blends" / "geometry-nodes" / "gn-index-face-colour-mosaic" / "mosaic_tile.blend"
VIDEO_OUT = _LIB / "videos" / "geometry-nodes" / "gn-index-face-colour-mosaic" / "viewport.mp4"

# ─── Constants ──────────────────────────────────────────────────────────────
FRAMES     = 72     # 3 s at 24 fps
ORBIT_DEG  = 90.0   # sweep arc — enough to show the tile depth without full spin
RADIUS     = 5.5    # camera orbit radius
CAM_HEIGHT = 3.2    # constant Z height during orbit

# ─── Load blend ─────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

cam_obj = scene.camera
if cam_obj is None:
    raise RuntimeError("No camera found in scene — run blueprint.py first.")

# Remove any existing camera animation.
if cam_obj.animation_data:
    cam_obj.animation_data_clear()

# ─── Keyframe orbit ─────────────────────────────────────────────────────────
# Camera stays at constant height and looks at the grid centre (origin).
# It starts at angle START_DEG (front-ish), ends at START_DEG + ORBIT_DEG.
START_DEG = -45.0   # start at front-left corner of the grid

for frame in range(1, FRAMES + 1):
    t     = (frame - 1) / (FRAMES - 1)           # 0.0 → 1.0
    angle = math.radians(START_DEG + t * ORBIT_DEG)
    cam_obj.location.x = RADIUS * math.sin(angle)
    cam_obj.location.y = -RADIUS * math.cos(angle)
    cam_obj.location.z = CAM_HEIGHT
    # Point camera toward origin.
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    pitch = math.asin(dz / dist)                  # tilt down
    yaw   = math.atan2(dx, -dy)                   # azimuth
    cam_obj.rotation_euler = (math.pi/2 + pitch, 0.0, yaw)
    cam_obj.keyframe_insert(data_path="location",       frame=frame)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

# Linear interpolation — constant orbital speed, no ease-in/out wobble.
if cam_obj.animation_data and cam_obj.animation_data.action:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# ─── Render settings ────────────────────────────────────────────────────────
scene.render.engine           = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.fps              = 24
scene.render.image_settings.file_format     = "FFMPEG"
scene.render.ffmpeg.format                  = "MPEG4"
scene.render.ffmpeg.codec                   = "H264"
scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
scene.render.ffmpeg.audio_codec             = "NONE"

VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)
scene.render.filepath = str(VIDEO_OUT)

# ─── Render ─────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow] viewport.mp4 → {VIDEO_OUT}")
