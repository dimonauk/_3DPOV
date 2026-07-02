"""
Blender 5.1 — Viewport animation recorder for the Layer Brush Stencil tutorial.

Produces: public/library/videos/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm/viewport.mp4

Sequence (120 frames at 30 fps = 4 s):
  Frames   1– 40  Zoom in from overview to close-up of the weave texture
  Frames  40– 80  360° orbit around the jacket torso at close focal distance
  Frames  80–120  Ramp Multires viewport level 1 → 3 to reveal detail build-up

Run from Scripting workspace after blueprint.py has completed.
"""

import bpy
import math

# ─── parameters ──────────────────────────────────────────────────────────────
OUTPUT_PATH  = "//../../videos/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm/viewport.mp4"
FPS          = 30
FRAME_TOTAL  = 120

ORBIT_RADIUS_FAR  = 0.70   # m — establishing shot distance
ORBIT_RADIUS_NEAR = 0.38   # m — close-up distance

# ─── render settings ─────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start  = 1
scene.frame_end    = FRAME_TOTAL
scene.render.fps   = FPS

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.resolution_x               = 1920
scene.render.resolution_y               = 1080
scene.render.resolution_percentage      = 100
scene.render.filepath                   = bpy.path.abspath(OUTPUT_PATH)

# ─── camera ──────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.camera_add(location=(ORBIT_RADIUS_FAR, 0, 0))
cam_obj = bpy.context.active_object
cam_obj.name = "REC_Camera"
scene.camera = cam_obj
cam = cam_obj.data
cam.lens = 85   # longer focal length flattens perspective; reads well for detail

# Point camera at torso centre (Z = 0 = mid-torso)
tc = cam_obj.constraints.new('TRACK_TO')
tc.target      = bpy.data.objects.get("VRM_Jacket") or bpy.context.scene.objects[0]
tc.track_axis  = 'TRACK_NEGATIVE_Z'
tc.up_axis     = 'UP_Y'

# ─── lighting ────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(3, -2, 4))
sun = bpy.context.active_object
sun.data.energy = 2.5
sun.data.angle  = math.radians(5.0)

# ─── Multires reference ───────────────────────────────────────────────────────
torso = bpy.data.objects.get("VRM_Jacket")
mr    = torso.modifiers.get("Multires") if torso else None

def set_cam_pose(frame, radius, angle_deg, height):
    """Position camera at (radius, angle_deg in XY plane, height Z)."""
    a = math.radians(angle_deg)
    cam_obj.location = (math.cos(a) * radius, math.sin(a) * radius, height)
    cam_obj.keyframe_insert('location', frame=frame)

# ─── phase 1: zoom in (frames 1–40) ─────────────────────────────────────────
# Camera starts far, spirals inward to close-up position
set_cam_pose(1,  ORBIT_RADIUS_FAR,  20, 0.08)
set_cam_pose(40, ORBIT_RADIUS_NEAR, 30, 0.04)

# ─── phase 2: 360° orbit (frames 40–80) ──────────────────────────────────────
set_cam_pose(40,  ORBIT_RADIUS_NEAR,  30, 0.04)
set_cam_pose(80,  ORBIT_RADIUS_NEAR, 390, 0.04)   # 390 = 30 + 360

# ─── phase 3: Multires level ramp (frames 80–120) ────────────────────────────
# Slowly raise viewport level to reveal increasing micro-detail resolution
set_cam_pose(80,  ORBIT_RADIUS_NEAR, 30, 0.04)
set_cam_pose(120, ORBIT_RADIUS_NEAR, 80, 0.10)    # drift slightly upward

if mr:
    for f, level in [(80, 1), (96, 2), (112, 3)]:
        mr.levels = level
        mr.keyframe_insert('levels', frame=f)
    mr.keyframe_insert('levels', frame=120)

# Smooth all camera fcurves
for obj in [cam_obj]:
    if obj.animation_data:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'

# ─── render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written.")
