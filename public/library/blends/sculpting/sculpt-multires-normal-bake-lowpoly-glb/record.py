"""
record.py — Viewport animation: Multires level reveal + 360° rotation
Blender 5.1 · CC0 · Holoflow Studio

Run this script in the same Blender session AFTER blueprint.py has completed.
The script inserts keyframes on the Multires modifier's 'levels' property to
animate a 0→4 level ramp over frames 1–60, then holds at level 4 for a
full 360° rotation from frames 60–150.  Output: viewport.mp4 at 30 fps.

Design intent for the camera:
  The level ramp shows the polygonal base mesh solidifying into smooth
  high-frequency detail — the core visual argument for Multires vs Dyntopo.
  The subsequent rotation lets the baked normal-map shading speak for itself
  at level 0 vs the true subdivided geometry at level 4.
"""

import bpy, math, os

SLUG     = "sculpt-multires-normal-bake-lowpoly-glb"
FPS      = 30
TOTAL_F  = 150   # 5 s: 60 f level ramp + 90 f full rotation at level 4

# ── locate objects from blueprint ─────────────────────────────────────────────
low = bpy.data.objects.get("talisman_low")
if low is None:
    raise RuntimeError("Run blueprint.py first — 'talisman_low' not found.")

mr = low.modifiers.get("Multires")
if mr is None:
    raise RuntimeError("Multires modifier missing from talisman_low.")

scene = bpy.context.scene

# ── scene frame range ─────────────────────────────────────────────────────────
scene.frame_start   = 1
scene.frame_end     = TOTAL_F
scene.render.fps    = FPS

# ── render settings (viewport OpenGL, MP4) ────────────────────────────────────
scene.render.resolution_x            = 1920
scene.render.resolution_y            = 1080
scene.render.resolution_percentage   = 100
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format           = "MPEG4"
scene.render.ffmpeg.codec            = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

here  = os.path.dirname(os.path.abspath(__file__))
video_dir = os.path.normpath(
    os.path.join(here, "..", "..", "..", "..",
                 "videos", "sculpting", SLUG)
)
os.makedirs(video_dir, exist_ok=True)
scene.render.filepath = os.path.join(video_dir, "viewport")

# ── keyframe Multires 'levels' property (integer — snaps, no interpolation) ───
# Frame  1  : level 0  (raw 96-face sphere — starkly faceted)
# Frame  12 : level 1  (384 faces, first rounding)
# Frame  24 : level 2  (1536 faces, clearly smooth at silhouette)
# Frame  36 : level 3  (6144 faces, detail visible in diffuse shading)
# Frame  60 : level 4  (24576 faces — full sculpted detail, hold here)
# Frame 150 : level 4  (end of rotation sequence)
def key_level(frame: int, level: int) -> None:
    scene.frame_set(frame)
    mr.levels = level
    mr.keyframe_insert(data_path="levels", frame=frame)

key_level(1,  0)
key_level(12, 1)
key_level(24, 2)
key_level(36, 3)
key_level(60, 4)
key_level(TOTAL_F, 4)

# Force CONSTANT interpolation on the levels F-curve (stair-step, not smooth blend)
action = bpy.data.actions.get(f"{low.name}ModifierAction")
if action is None:
    # Find the modifier action via the animation data
    if low.animation_data and low.animation_data.action:
        action = low.animation_data.action
if action:
    for fc in action.fcurves:
        if "levels" in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"

# ── object rotation: 360° over frames 60–150 ──────────────────────────────────
low.rotation_euler = (0, 0, 0)
low.keyframe_insert(data_path="rotation_euler", frame=1)
low.keyframe_insert(data_path="rotation_euler", frame=60)

scene.frame_set(TOTAL_F)
low.rotation_euler = (0, 0, math.radians(360))
low.keyframe_insert(data_path="rotation_euler", frame=TOTAL_F)

# Linear Z-rotation interpolation
if low.animation_data and low.animation_data.action:
    for fc in low.animation_data.action.fcurves:
        if fc.data_path == "rotation_euler" and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

scene.frame_set(1)

# ── render viewport animation ─────────────────────────────────────────────────
# Requires a display context (run interactively in Blender).
bpy.ops.render.opengl(animation=True, sequencer=False)
print(f"[holoflow] viewport.mp4 → {video_dir}/viewport.mp4")
