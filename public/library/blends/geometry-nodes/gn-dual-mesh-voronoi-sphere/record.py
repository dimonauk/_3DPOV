#!/usr/bin/env python3
"""
Record: GN Dual Mesh — Geodesic Voronoi Sphere — viewport animation
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py. Opens dual_mesh_voronoi_sphere.blend, inserts a
360° camera orbit at constant elevation over 96 frames (4 s at 24 fps),
and renders to:
    public/library/videos/geometry-nodes/gn-dual-mesh-voronoi-sphere/viewport.mp4

The orbit starts front-centre and sweeps anticlockwise. At the 0° view the
twelve pentagons at the poles are visible; at 90° the equatorial hex band
reads as a pure geodesic lattice. The cobalt-blue Emission material with
EEVEE Next bloom makes each flat panel glow as a distinct facet.

Run headlessly (no display required):
    blender --background --python record.py
"""

import bpy
import math
from pathlib import Path

# ─── Paths ───────────────────────────────────────────────────────────────────
HERE      = Path(__file__).parent
LIB       = HERE.parents[3]
BLEND_IN  = HERE / "dual_mesh_voronoi_sphere.blend"
VIDEO_OUT = LIB / "videos" / "geometry-nodes" / "gn-dual-mesh-voronoi-sphere" / "viewport.mp4"

# ─── Constants ────────────────────────────────────────────────────────────────
FRAMES     = 96       # 4 s at 24 fps — enough for a full 360° orbit
FPS        = 24
ORBIT_DEG  = 360.0
RADIUS     = 3.2      # camera distance from origin
CAM_HEIGHT = 1.2      # constant Z elevation
CAM_TILT   = 1.05     # rotation_euler.x in radians (≈60° down from horizontal)

# ─── Load blend ───────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))
scene             = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

# ─── Camera setup ─────────────────────────────────────────────────────────────
cam_obj = scene.camera
if cam_obj is None:
    bpy.ops.object.camera_add(location=(0, -RADIUS, CAM_HEIGHT))
    cam_obj = bpy.context.active_object
    scene.camera = cam_obj
else:
    cam_obj.location = (0, -RADIUS, CAM_HEIGHT)

if cam_obj.animation_data:
    cam_obj.animation_data_clear()

cam_obj.rotation_euler = (CAM_TILT, 0, 0)

# ─── Keyframe orbit ───────────────────────────────────────────────────────────
# Camera traces a circle of radius RADIUS at height CAM_HEIGHT, pointing
# toward the origin every frame. START_DEG = -90 places frame 1 directly
# in front of the sphere (+Y direction looking toward -Y).
START_DEG = -90.0

for frame in range(1, FRAMES + 1):
    t     = (frame - 1) / FRAMES   # 0.0 → (FRAMES-1)/FRAMES, never reaches 1.0
    angle = math.radians(START_DEG + t * ORBIT_DEG)

    cam_obj.location = (
        RADIUS * math.cos(angle),
        RADIUS * math.sin(angle),
        CAM_HEIGHT,
    )

    # Recalculate camera rotation to face origin each frame.
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    dz = -cam_obj.location.z
    yaw   = math.atan2(-dx, -dy)
    dist  = math.sqrt(dx * dx + dy * dy)
    pitch = math.atan2(-dz, dist)

    cam_obj.rotation_euler = (math.pi / 2 + pitch, 0, yaw)
    cam_obj.keyframe_insert(data_path="location",       frame=frame)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

# ─── Render settings ─────────────────────────────────────────────────────────
render             = scene.render
render.resolution_x = 1920
render.resolution_y = 1080
render.fps          = FPS

ffmpeg             = render.ffmpeg
ffmpeg.format      = "MPEG4"
ffmpeg.codec       = "H264"
ffmpeg.constant_rate_factor = "MEDIUM"
ffmpeg.audio_codec  = "NONE"

VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)
render.filepath = str(VIDEO_OUT)
render.image_settings.file_format = "FFMPEG"

# ─── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Viewport animation → {VIDEO_OUT}")
