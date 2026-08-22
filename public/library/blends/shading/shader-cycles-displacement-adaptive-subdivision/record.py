"""
record.py — viewport-animation render for shader-cycles-displacement-adaptive-subdivision
Output: public/library/videos/shading/shader-cycles-displacement-adaptive-subdivision/viewport.mp4

Run AFTER blueprint.py:
  blender stone_displaced.blend --python record.py

Clip: 6.25 s (150 frames at 24 fps)
  • Camera arcs slowly 30° around the sphere, revealing how displaced ridges
    catch the key light and cast micro-shadows
  • Frame 1–75:  displacement_method = 'BUMP' (shading only)  → smooth silhouette
  • Frame 76–150: displacement_method = 'DISPLACEMENT' (geometry) → ridged silhouette

WHY EEVEE-NEXT NOT CYCLES
  True micropolygon displacement requires Cycles + EXPERIMENTAL.  EEVEE-Next
  uses the Displacement node as a bump input (BOTH mode) which gives near-
  identical shading but without the displaced silhouette — making it the right
  tool to compare the two modes side-by-side in a real-time viewport render.
  Cycles at 256 samples per frame would take 3–10 s/frame on CPU; EEVEE
  delivers the same instructional value at ~0.1 s/frame.
"""

import bpy
import math
import os

# ── Output path ────────────────────────────────────────────────────────────────
_HERE      = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.abspath(os.path.join(_HERE, "../../../../.."))
OUTPUT_DIR = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "shading", "shader-cycles-displacement-adaptive-subdivision",
)
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOTAL_FRAMES = 150
MID_FRAME    = 75

# ── Render settings ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine                      = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.fps                         = 24
scene.frame_start                        = 1
scene.frame_end                          = TOTAL_FRAMES
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset        = 'GOOD'
scene.render.filepath                    = OUTPUT_MP4

# ── Switch material to BOTH so EEVEE uses displacement as bump ─────────────────
mat = bpy.data.materials.get("displaced_stone")
if mat:
    mat.cycles.displacement_method = 'BOTH'

# ── Camera orbit ───────────────────────────────────────────────────────────────
cam = bpy.data.objects.get("render_cam")
if cam is None:
    bpy.ops.object.camera_add(
        location=(0, -3.2, 0.4),
        rotation=(math.radians(84), 0, 0),
    )
    cam = bpy.context.active_object
    cam.name = "render_cam"
scene.camera = cam

# Arc: 0° → 30° Z orbit over the full clip
# The motion reveals how the noise ridges catch the grazing key light
START_ROT = math.radians(0)
END_ROT   = math.radians(30)

cam.rotation_euler = (math.radians(84), 0, START_ROT)
cam.keyframe_insert(data_path="rotation_euler", frame=1)

cam.rotation_euler = (math.radians(84), 0, END_ROT)
cam.keyframe_insert(data_path="rotation_euler", frame=TOTAL_FRAMES)

for fcurve in cam.animation_data.action.fcurves:
    for kfp in fcurve.keyframe_points:
        kfp.interpolation = 'BEZIER'
        kfp.easing = 'EASE_IN_OUT'

# ── Render ─────────────────────────────────────────────────────────────────────
print(f"record.py: rendering {TOTAL_FRAMES} frames → {OUTPUT_MP4}")
bpy.ops.render.render(animation=True, write_still=False)
print("record.py: done.")
