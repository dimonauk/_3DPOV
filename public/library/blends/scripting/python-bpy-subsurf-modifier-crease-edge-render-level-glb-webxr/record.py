"""
record.py — Viewport Animation Recorder
Topic: SubsurfModifier crease-controlled subdivision
Output: public/library/videos/scripting/
        python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr/viewport.mp4

Run AFTER blueprint.py has built the scene.
Duration: 10 seconds at 24 fps = 240 frames

Animation sequence:
  F001–060  Object in control-cage mode (show_only_control_edges=True, levels=0)
            Camera orbits slowly — viewer sees the raw quad topology.
  F061–120  show_only_control_edges flips False, levels=1 kicks in.
            Subdivision lines appear; edges with crease=1.0 stay sharp.
  F121–180  levels bumps to 2; render-quality smoothing visible.
  F181–240  Camera pulls back to reveal full panel; freeze on hero pose.
"""

import bpy
import math

SLUG    = "python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
FPS     = 24
FRAMES  = 240
OUT     = f"//../../videos/scripting/{SLUG}/viewport"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = bpy.path.abspath(OUT)
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

# ── Camera setup ───────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

cam_obj.location = (3.0, -3.5, 1.8)
cam_obj.rotation_euler = (math.radians(68), 0.0, math.radians(40))

# ── Animate modifier on the panel object ──────────────────────────────────
panel = bpy.data.objects.get("hf_console_panel")
if panel:
    mod = panel.modifiers.get("SubSurf")
    if mod:
        # F001: control cage — no subdivision shown
        scene.frame_set(1)
        mod.show_only_control_edges = True
        mod.levels = 0
        mod.keyframe_insert("levels", frame=1)

        # F061: switch to subdivided view at level 1
        scene.frame_set(61)
        mod.show_only_control_edges = False
        mod.levels = 1
        mod.keyframe_insert("levels", frame=61)

        # F121: bump to render quality
        scene.frame_set(121)
        mod.levels = 2
        mod.keyframe_insert("levels", frame=121)

        # F181–240: hold
        scene.frame_set(181)
        mod.keyframe_insert("levels", frame=181)

# ── Slow camera orbit around the panel ────────────────────────────────────
for f in range(1, FRAMES + 1):
    angle = math.radians(40) + (f / FRAMES) * math.radians(60)
    radius = 3.5 - (f / FRAMES) * 0.5   # gentle zoom
    cam_obj.location.x = radius * math.sin(angle) * 1.5
    cam_obj.location.y = -radius * math.cos(angle)
    cam_obj.keyframe_insert("location", frame=f)

# Smoothing
for fcurve in cam_obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Render ────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport.mp4 rendered → {bpy.path.abspath(OUT)}.mp4")
