# =============================================================================
# record.py — EEVEE Next Light Probes: 120-frame camera orbit viewport render
# Blender 5.1
#
# Opens probe_scene.blend (built by blueprint.py) and renders a camera orbit
# showing the chrome sphere's reflections, gold ellipsoid, and brushed cylinder.
# The rendered PNGs are saved to frames/ then encoded to viewport.mp4 via ffmpeg.
#
# IMPORTANT: probe baking requires a GPU context. This script performs a
# viewport render (bpy.ops.render.opengl) rather than a full Cycles/EEVEE
# render to work in --background without X display, but reflections will not
# appear in the output unless probes were baked first interactively.
# To bake: open probe_scene.blend → Render Properties → Bake All Light Probes.
# =============================================================================

import bpy
import math
import os
import subprocess

BLEND_IN = bpy.path.abspath("//probe_scene.blend")
FRAMES_DIR = bpy.path.abspath("//frames/")
VIDEO_OUT  = bpy.path.abspath("//../../videos/rendering/eevee-light-probes-sphere-reflection-irradiance-webxr/viewport.mp4")
TOTAL_FRAMES = 120
ORBIT_RADIUS = 8.0
ORBIT_HEIGHT = 3.2
ORBIT_TILT_DEG = 65.0   # camera tilt toward scene centre

# ── ensure output directory exists ───────────────────────────────────────────
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

# ── load the blend built by blueprint.py ─────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=BLEND_IN)
scn = bpy.context.scene
cam_obj = scn.camera

# ── render settings for the orbit ────────────────────────────────────────────
scn.render.engine              = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x        = 1280
scn.render.resolution_y        = 720
scn.render.resolution_percentage = 100
scn.eevee.taa_render_samples   = 32   # faster for preview; increase for final
scn.render.image_settings.file_format = "PNG"
scn.render.filepath = FRAMES_DIR + "frame_"
scn.frame_start = 1
scn.frame_end   = TOTAL_FRAMES

# ── animate camera orbit around scene centre ──────────────────────────────────
for frame in range(1, TOTAL_FRAMES + 1):
    angle = (2 * math.pi * (frame - 1)) / TOTAL_FRAMES
    # WHY negative angle: camera orbits counter-clockwise when viewed from above
    cam_obj.location.x = ORBIT_RADIUS * math.cos(-angle)
    cam_obj.location.y = ORBIT_RADIUS * math.sin(-angle)
    cam_obj.location.z = ORBIT_HEIGHT
    # always look at scene centre (0, 0, 0.8 = mid-height of hero objects)
    dx = 0.0 - cam_obj.location.x
    dy = 0.0 - cam_obj.location.y
    dz = 0.8 - cam_obj.location.z
    yaw   = math.atan2(dy, dx) + math.radians(90)
    pitch = -math.atan2(-dz, math.sqrt(dx**2 + dy**2))
    cam_obj.rotation_euler = (pitch, 0.0, yaw)
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── render all frames ─────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Rendered {TOTAL_FRAMES} frames to {FRAMES_DIR}")

# ── encode to mp4 via ffmpeg ──────────────────────────────────────────────────
cmd = [
    "ffmpeg", "-y",
    "-framerate", "24",
    "-i", FRAMES_DIR + "frame_%04d.png",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    VIDEO_OUT,
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print("Encoded viewport.mp4 →", VIDEO_OUT)
else:
    print("ffmpeg error:", result.stderr)
    print("Frames are in:", FRAMES_DIR)
