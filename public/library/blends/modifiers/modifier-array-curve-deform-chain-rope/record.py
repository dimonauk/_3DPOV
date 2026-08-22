"""
record.py — viewport animation recorder
Array + Curve Deform Chain/Rope Tutorial
Blender 5.1  |  CC0  |  Holoflow Studio

Run AFTER blueprint.py (or inside the same session after main() has been called).
Drives a 120-frame turntable + guide-curve reshape animation, then renders to
public/library/videos/modifiers/modifier-array-curve-deform-chain-rope/viewport.mp4

Output: 5-second clip at 24fps showing the chain snaking around the path as a
Bezier handle is animated.  The Array link-count auto-updates live as the curve
lengthens.
"""

import bpy
import math

# ── OUTPUT PATH ───────────────────────────────────────────────────────────────
OUT_PATH = "//../../videos/modifiers/modifier-array-curve-deform-chain-rope/viewport.mp4"
FRAMES   = 120     # 5 s at 24 fps
FPS      = 24

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# ── OUTPUT: viewport opengl render ────────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath  = OUT_PATH
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# ── VIEWPORT SHADING ─────────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type         = 'MATERIAL'
                space.shading.use_scene_lights = True
                break

# ── CAMERA TURNTABLE ─────────────────────────────────────────────────────────
cam_obj = bpy.context.scene.camera
if cam_obj is None:
    raise RuntimeError("No camera found — run blueprint.py first.")

# Animate camera Z-rotation: one full revolution over FRAMES
cam_obj.rotation_euler.x = math.radians(66)
cam_obj.rotation_euler.z = math.radians(0)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

cam_obj.rotation_euler.z = math.radians(360)
cam_obj.keyframe_insert(data_path="rotation_euler", frame=FRAMES)

# Make rotation linear (no ease-in/out)
for fcurve in cam_obj.animation_data.action.fcurves:
    if "rotation_euler" in fcurve.data_path and fcurve.array_index == 2:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'

# ── CURVE HANDLE ANIMATION ────────────────────────────────────────────────────
# Animate the middle control point Z-value so the chain lifts as it turns.
# This shows Array Fit Curve updating count in real time.
guide = bpy.data.objects.get("guide_path")
if guide and guide.data.splines:
    spline = guide.data.splines[0]
    if len(spline.bezier_points) >= 3:
        mid_pt = spline.bezier_points[2]

        # Frame 1: original Z=0
        mid_pt.co.z = 0.0
        mid_pt.keyframe_insert(data_path="co", index=2, frame=1)

        # Frame 60: lifted to Z=0.8 (chain stretches, Array adds links)
        mid_pt.co.z = 0.8
        mid_pt.keyframe_insert(data_path="co", index=2, frame=60)

        # Frame 120: back to Z=0
        mid_pt.co.z = 0.0
        mid_pt.keyframe_insert(data_path="co", index=2, frame=120)

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print("[holoflow] viewport.mp4 written →", bpy.path.abspath(OUT_PATH))
