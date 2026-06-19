"""
record.py — viewport animation for GN Distribute Points on Faces scatter
Blender 5.1 · CC0 — Holoflow Studio

Run AFTER blueprint.py (which must have created scatter_terrain in the scene).
Outputs: public/library/videos/geometry-nodes/
           gn-distribute-points-faces-poisson-scatter/viewport.mp4

Timeline (150 frames @ 30 fps = 5 seconds)
  001–060  Density Max animates 0 → 6.0  (rocks pop in via Poisson disc)
  061–090  Hold full scatter
  091–150  Camera orbits 360° around the scatter field
"""

import bpy
import math

VIDEO_OUT = bpy.path.abspath(
    "//../../../../videos/geometry-nodes/"
    "gn-distribute-points-faces-poisson-scatter/viewport.mp4"
)
DENSITY_MAX  = 6.0
GN_TREE_NAME = "HF_ScatterDensityMask"

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150
scene.render.fps  = 30

# ── Output settings ───────────────────────────────────────────────────────────
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath                   = VIDEO_OUT

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

# Position camera so the 4 m terrain fills the frame
cam_ob.location = (0.0, -5.5, 3.8)
cam_ob.rotation_euler = (math.radians(55), 0.0, 0.0)

# ── Terrain modifier reference ────────────────────────────────────────────────
terrain_ob = bpy.data.objects.get("scatter_terrain")
if terrain_ob is None:
    raise RuntimeError("Run blueprint.py first to create scatter_terrain.")

mod = terrain_ob.modifiers.get(GN_TREE_NAME)
if mod is None:
    raise RuntimeError(f"Modifier '{GN_TREE_NAME}' not found on scatter_terrain.")

# The modifier input identifier for "Density Max" is the first float socket
# after Geometry (index 1 in 5.1 — verify via list(mod.keys()) if needed).
density_id = "Input_1"   # group-input socket identifier for "Density Max"

# ── Keyframe density growth ───────────────────────────────────────────────────
mod[density_id] = 0.0
mod.keyframe_insert(data_path=f'["{density_id}"]', frame=1)

mod[density_id] = DENSITY_MAX
mod.keyframe_insert(data_path=f'["{density_id}"]', frame=60)

# Ease-out: change F-Curve interpolation to EASE_OUT
try:
    action = terrain_ob.animation_data.action
    for fc in action.fcurves:
        if density_id in fc.data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_OUT'
except Exception:
    pass

# ── Camera orbit ──────────────────────────────────────────────────────────────
# Empty at origin acts as orbit pivot
pivot = bpy.data.objects.new("RecordPivot", None)
bpy.context.scene.collection.objects.link(pivot)
pivot.location = (0, 0, 0.3)

cns = cam_ob.constraints.new("CHILD_OF")
cns.target = pivot
cns.use_location_x = False
cns.use_location_y = False
cns.use_location_z = False
cns.use_rotation_x = False
cns.use_rotation_y = False
cns.use_rotation_z = True

# Track camera to scene centre
track = cam_ob.constraints.new("TRACK_TO")
track.target      = pivot
track.track_axis  = 'TRACK_NEGATIVE_Z'
track.up_axis     = 'UP_Y'

pivot.rotation_euler.z = 0.0
pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=91)
pivot.rotation_euler.z = math.tau
pivot.keyframe_insert(data_path="rotation_euler", index=2, frame=150)

try:
    p_action = pivot.animation_data.action
    for fc in p_action.fcurves:
        if fc.data_path == "rotation_euler" and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'
except Exception:
    pass

# ── Render ────────────────────────────────────────────────────────────────────
import os
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"✓ viewport.mp4 written → {VIDEO_OUT}")
