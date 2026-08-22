"""
record.py — viewport camera animation for subdivision surface comparison panels.
Run in the same Blender session after blueprint.py.
Outputs:
  public/library/videos/modifiers/modifier-subdivision-surface-crease-support-loops-webxr/viewport.mp4

The camera sweeps a 180° arc around both panels, staying low to emphasise the
glancing-light shading difference between the crease (Panel_A) and Bevel+Subsurf
(Panel_B) approaches.
"""

import bpy
import math

FRAME_START  = 1
FRAME_END    = 90          # 3 s at 30 fps — enough to show both panels
ORBIT_RADIUS = 2.2         # distance from world origin to camera
ORBIT_HEIGHT = 0.15        # slight upward angle to read panel depth
VIDEO_PATH   = ("//../../videos/modifiers/"
                "modifier-subdivision-surface-crease-support-loops-webxr/viewport")

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.fps = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = bpy.path.abspath(VIDEO_PATH)

cam = scene.camera
if cam is None:
    raise RuntimeError("No active camera. Run blueprint.py first.")

cam.animation_data_clear()

for frame in range(FRAME_START, FRAME_END + 1):
    t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
    angle = math.radians(t * 180)   # 0° → 180° arc (front-left to front-right)

    # Camera position on a hemisphere in front of the panels
    cam.location = (
        math.sin(angle) * ORBIT_RADIUS,
        -math.cos(angle) * ORBIT_RADIUS,
        ORBIT_HEIGHT,
    )
    # Always face world origin (midpoint between the two panels)
    dx = -cam.location.x
    dy = -cam.location.y
    cam.rotation_euler = (
        math.radians(87),           # near-level tilt
        0.0,
        math.atan2(dx, dy),         # yaw to track origin
    )
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# Constant-speed orbit — linear interpolation on all keyframes
if cam.animation_data and cam.animation_data.action:
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

bpy.ops.render.render(animation=True, write_still=False)
print(f"record.py complete — viewport.mp4 → {VIDEO_PATH}")
