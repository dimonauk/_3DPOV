"""
record.py — Viewport animation for holographic_gem
===================================================
Blender 5.1  ·  Run AFTER blueprint.py

Animates the Wave Texture Scale keyframe so the rainbow iridescence
bands sweep across the gem over 90 frames (3 s at 30 fps):
  frame  1  → Scale = 14.0  (tight bands, full spectrum visible)
  frame 45  → Scale =  3.5  (wide bands, each colour dominates a zone)
  frame 90  → Scale = 14.0  (return — seamless loop)

The camera orbits 40° around Z to show how the iridescence intensity
varies with viewing angle — a physically correct consequence of the
Fresnel-weighted thin-film model.

Output: public/library/videos/shading/shader-principled-transmission-iridescence/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── PATHS ─────────────────────────────────────────────────────────────────────
_HERE    = Path(__file__).parent
VIDEO_DIR = (
    _HERE.parents[2]
    / "videos" / "shading" / "shader-principled-transmission-iridescence"
)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
MP4_OUT = VIDEO_DIR / "viewport.mp4"

# ── SCENE SETTINGS ────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 90
scene.render.fps  = 30

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1280
scene.render.resolution_y =  720
scene.render.resolution_percentage = 100
scene.render.filepath = str(MP4_OUT)

# ── FIND NODES ────────────────────────────────────────────────────────────────
gem  = bpy.data.objects.get("holographic_gem")
mat  = bpy.data.materials.get("HolographicGem")
if gem is None or mat is None:
    raise RuntimeError("Run blueprint.py first — holographic_gem / HolographicGem not found.")

wave_node = next(
    (n for n in mat.node_tree.nodes if n.type == 'TEX_WAVE'),
    None,
)
if wave_node is None:
    raise RuntimeError("TEX_WAVE node not found in HolographicGem material.")

scale_input = wave_node.inputs['Scale']

# ── KEYFRAME WAVE SCALE ───────────────────────────────────────────────────────
# Tight → wide → tight produces a breathing iridescence that clearly
# communicates the spectrum-sweep mechanism to a viewer watching the recording.
keyframes = [(1, 14.0), (45, 3.5), (90, 14.0)]
for frame, value in keyframes:
    scene.frame_set(frame)
    scale_input.default_value = value
    scale_input.keyframe_insert(data_path='default_value', frame=frame)

# Use EASE interpolation so the sweep accelerates naturally at midpoint.
for fcurve in mat.node_tree.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'EASE'

# ── CAMERA ORBIT ──────────────────────────────────────────────────────────────
cam = scene.camera
if cam is None:
    raise RuntimeError("No active camera in scene. Run blueprint.py first.")

# Keyframe camera Z rotation: 0° → 40° → 0° over the 90-frame window.
# Small orbit (not full 360) keeps the light direction nearly constant so
# the Coat specular highlight stays in frame throughout.
cam_keyframes = [(1, 0.0), (45, math.radians(40)), (90, 0.0)]
for frame, angle in cam_keyframes:
    scene.frame_set(frame)
    cam.rotation_euler[2] = angle
    cam.keyframe_insert(data_path='rotation_euler', index=2, frame=frame)

# ── RENDER ────────────────────────────────────────────────────────────────────
# Use EEVEE for the viewport recording (fast, handles transmission).
# Cycles would render correctly but takes ~10× longer per frame.
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.use_ssr            = True
scene.eevee.use_ssr_refraction = True
scene.eevee.taa_render_samples = 32

bpy.ops.render.render(animation=True)
print(f"[record] viewport.mp4 → {MP4_OUT}")
