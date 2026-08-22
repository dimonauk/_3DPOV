"""
record.py — Viewport animation render for corner-gradient gem tutorial
Blender 5.1  ·  Holoflow Studio
========================================================================
Renders a 5-second (150-frame) camera orbit around the faceted gem while
the corner_grad attribute gradient is visible. Outputs:
  public/library/videos/geometry-nodes/
    gn-corners-of-face-vertex-of-corner-faceted-gem-gradient/viewport.mp4

Run headless:
  blender --background --python record.py
"""

import bpy, math, os, sys

# ── Paths ────────────────────────────────────────────────────────────────────
REPO_ROOT  = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
VIDEO_DIR  = os.path.join(
    REPO_ROOT,
    "public", "library", "videos",
    "geometry-nodes",
    "gn-corners-of-face-vertex-of-corner-faceted-gem-gradient",
)
os.makedirs(VIDEO_DIR, exist_ok=True)
OUTPUT_MP4 = os.path.join(VIDEO_DIR, "viewport.mp4")

BLEND_DIR  = os.path.dirname(os.path.abspath(__file__))
BLUEPRINT  = os.path.join(BLEND_DIR, "blueprint.py")

# ── Execute blueprint to build the scene ─────────────────────────────────────
with open(BLUEPRINT, "r") as fh:
    exec(compile(fh.read(), BLUEPRINT, "exec"), {"__file__": BLUEPRINT})

scene = bpy.context.scene
gem   = bpy.data.objects["faceted_gem"]
cam   = scene.camera

# ── Camera orbit: 360° around the gem over 150 frames ───────────────────────
FRAMES     = 150
ORBIT_R    = 5.0
ORBIT_Z    = 2.0
ORBIT_TILT = math.radians(68)   # camera tilt toward gem

scene.frame_start = 1
scene.frame_end   = FRAMES

for f in range(1, FRAMES + 1):
    scene.frame_set(f)
    t   = (f - 1) / (FRAMES - 1)          # 0 → 1 over the animation
    ang = t * math.tau                     # full 360° orbit
    cam.location = (
        ORBIT_R * math.sin(ang),
        -ORBIT_R * math.cos(ang),
        ORBIT_Z,
    )
    cam.rotation_euler = (
        ORBIT_TILT,
        0.0,
        ang,                               # camera yaw follows orbit angle
    )
    cam.keyframe_insert("location",        frame=f)
    cam.keyframe_insert("rotation_euler",  frame=f)

# Make F-Curves linear so the orbit is perfectly constant-speed
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Render settings ──────────────────────────────────────────────────────────
scene.render.engine           = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.fps              = 30
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format    = "MPEG4"
scene.render.ffmpeg.codec     = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath         = OUTPUT_MP4

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)
print(f"[holoflow] viewport render → {OUTPUT_MP4}")
