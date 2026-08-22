"""
Geodesic Sphere — Viewport Recording Script
Blender 5.1 | CC0 | Holoflow Studio 2026-07-26

Outputs:
  public/library/videos/scripting/
  python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr/
  viewport.mp4  (300 frames, 30 fps, 10 s)

Strategy:
  The sphere rotates 360° about the Z axis (full spin), and a 3-point key/fill/rim
  light rig casts shadows across the faceted extrude accent, making the geodesic
  face distribution visible.  The camera arc from equatorial (0°) to overhead
  (50°) elevation over the first 150 frames shows the pentagon/hexagon distribution
  at the poles vs. equator.

Prerequisites: blueprint.py must have been run first (GeodesicSphere in scene).
"""

import bpy
import math
from mathutils import Vector

# ── Constants ─────────────────────────────────────────────────────────────────
SLUG     = "python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
OUT_PATH = f"//../../videos/scripting/{SLUG}/viewport"
FPS      = 30
FRAMES   = 300   # 10 seconds

# ── Scene ─────────────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUT_PATH

# ── Sphere spin animation ──────────────────────────────────────────────────────
obj = bpy.data.objects.get("GeodesicSphere")
if obj is None:
    raise RuntimeError("[HF] GeodesicSphere not found — run blueprint.py first.")

obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert("rotation_euler", frame=1)
obj.rotation_euler = (0.0, 0.0, math.tau)
obj.keyframe_insert("rotation_euler", frame=FRAMES)

for fc in obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Camera ─────────────────────────────────────────────────────────────────────
if "RecordCam" not in bpy.data.objects:
    bpy.ops.object.camera_add()
    bpy.context.object.name = "RecordCam"
cam = bpy.data.objects["RecordCam"]
scene.camera = cam
cam.data.lens = 85   # telephoto — sphere fills frame without perspective distortion


def set_cam_frame(frame: int, elev_rad: float) -> None:
    """Position camera on a sphere of radius 0.50 m at given elevation."""
    r = 0.50
    cam.location       = Vector((0.0, -r * math.cos(elev_rad), r * math.sin(elev_rad)))
    cam.rotation_euler = (math.pi / 2 - elev_rad, 0.0, 0.0)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)


set_cam_frame(1,       0.0)                    # start: equatorial view
set_cam_frame(150,     math.radians(50))       # mid: near-overhead
set_cam_frame(FRAMES,  math.radians(20))       # end: slight elevation

# ── Three-point lighting ───────────────────────────────────────────────────────
lights = {
    "HF_Key":  {"loc": ( 0.40,  -0.40,  0.50), "energy": 80},
    "HF_Fill": {"loc": (-0.35,  -0.20,  0.20), "energy": 30},
    "HF_Rim":  {"loc": ( 0.00,   0.30,  0.40), "energy": 55},
}
for name, cfg in lights.items():
    if name not in bpy.data.objects:
        bpy.ops.object.light_add(type="AREA")
        bpy.context.object.name = name
    lt = bpy.data.objects[name]
    lt.location       = Vector(cfg["loc"])
    lt.data.energy    = cfg["energy"]
    lt.data.size      = 0.25   # sharp shadows on facets

# ── Render instructions ────────────────────────────────────────────────────────
print("[HF] record.py configured.")
print("     To render: Render > Render Animation  (or F12 → Ctrl+F12)")
print(f"     Output: {bpy.path.abspath(OUT_PATH)}.mp4")
