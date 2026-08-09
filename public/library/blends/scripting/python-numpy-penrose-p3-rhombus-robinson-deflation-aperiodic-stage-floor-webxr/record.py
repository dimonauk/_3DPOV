"""
record.py — Viewport Animation for Penrose P3 Stage Floor  (Blender 5.1)
=========================================================================
Run this AFTER blueprint.py has created the 'penrose_p3_floor' object.
Outputs: public/library/videos/scripting/
          python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr/
          viewport.mp4

Animation (150 frames @ 30 fps = 5 seconds):
  0–30:   overhead plan view — reveals the 10-fold-ish symmetry
  31–90:  camera arcs to 35° elevation while rotating 144° in azimuth
          (intentionally 144° = 2×72° to dodge the true 5-fold axis
           and expose the non-periodic nature of the tiling)
  91–150: slow zoom toward a single fat rhombus to show vertex colour detail

Render engine: Workbench (VERTEX colour_type) for speed; no lights needed.
"""

import bpy
import mathutils
import math

SCENE      = bpy.context.scene
FPS        = 30
N_FRAMES   = 150
OUT_PATH   = "//../../videos/scripting/" \
             "python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr/" \
             "viewport.mp4"

# ─── Render settings ──────────────────────────────────────────────────────────
SCENE.render.fps       = FPS
SCENE.frame_start      = 1
SCENE.frame_end        = N_FRAMES
SCENE.render.filepath  = OUT_PATH
SCENE.render.image_settings.file_format   = "FFMPEG"
SCENE.render.ffmpeg.format                = "MPEG4"
SCENE.render.ffmpeg.codec                 = "H264"
SCENE.render.ffmpeg.constant_rate_factor  = "HIGH"
SCENE.render.resolution_x = 1920
SCENE.render.resolution_y = 1080

# ─── Workbench for speed ──────────────────────────────────────────────────────
SCENE.render.engine = "BLENDER_WORKBENCH"
SCENE.display.shading.color_type = "VERTEX"
SCENE.display.shading.light      = "STUDIO"
SCENE.display.shading.show_shadows = False

# ─── Track-To target ─────────────────────────────────────────────────────────
target = bpy.data.objects.get("PenroseTarget")
if target is None:
    target = bpy.data.objects.new("PenroseTarget", None)
    bpy.context.collection.objects.link(target)
target.location = (0.0, 0.0, 0.03)

# ─── Camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("PenroseCam")
cam_data.lens = 50.0          # mm — moderate telephoto shows pattern cleanly
cam      = bpy.data.objects.new("PenroseCam", cam_data)
bpy.context.collection.objects.link(cam)
SCENE.camera = cam

# Track-To constraint so camera always faces the target.
tt = cam.constraints.new(type="TRACK_TO")
tt.target     = target
tt.track_axis = "TRACK_NEGATIVE_Z"
tt.up_axis    = "UP_Y"

def cam_pos(azimuth_deg, elevation_deg, radius):
    """Return a (x,y,z) position for a given spherical orbit."""
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    return (radius * math.cos(el) * math.sin(az),
            radius * math.cos(el) * math.cos(az),
            radius * math.sin(el))

# ─── Keyframes ────────────────────────────────────────────────────────────────
# Frame 1 — overhead plan view.
SCENE.frame_set(1)
cam.location = cam_pos(0.0, 88.0, 5.5)
cam.keyframe_insert("location", frame=1)

# Frame 30 — still overhead (hold).
cam.keyframe_insert("location", frame=30)

# Frame 90 — medium-angle orbit (144° azimuth, 35° elevation).
SCENE.frame_set(90)
cam.location = cam_pos(144.0, 35.0, 6.5)
cam.keyframe_insert("location", frame=90)

# Frame 150 — zoom to a close-up near the disc edge (detail shot).
SCENE.frame_set(150)
cam.location = cam_pos(144.0, 20.0, 3.2)
cam.keyframe_insert("location", frame=150)

# Ease the F-curves (BEZIER handles give smooth acceleration).
for fcurve in cam.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = "BEZIER"
        kp.handle_left_type  = "AUTO_CLAMPED"
        kp.handle_right_type = "AUTO_CLAMPED"

print("record.py: keyframes set.  Render with:")
print("  bpy.ops.render.render(animation=True)")
