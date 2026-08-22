"""
Blender 5.1  —  record.py
Slug : modifier-data-transfer-smooth-normals
Outputs: public/library/videos/modifiers/modifier-data-transfer-smooth-normals/viewport.mp4

Animation (90 frames @ 30 fps = 3 seconds):
  F 1–30  : gem shown flat-shaded (no modifier)  — faceted silhouette AND flat interior
  F 31     : Data Transfer modifier visibility toggled ON via keyframe
  F 32–90 : gem shown smooth (modifier active)   — same geometry, smooth interior shading
  Camera slowly orbits 360° so the silhouette crispness is visible throughout.
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector, Euler

OUTPUT_PATH = pathlib.Path("//../../../../videos/modifiers/"
                           "modifier-data-transfer-smooth-normals/viewport.mp4")

# ── scene from blueprint ────────────────────────────────────────────────────────
exec(open(pathlib.Path(__file__).parent / "blueprint.py").read())

# After exec: gem, sphere objects exist; sphere is hidden.
# Retrieve objects by name.
gem_obj    = bpy.data.objects["gem_lowpoly"]
sphere_obj = bpy.data.objects["sphere_highpoly"]
dt_mod     = gem_obj.modifiers["DataTransfer"]

# ── restore flat shading for first 30 frames ────────────────────────────────────
for face in gem_obj.data.polygons:
    face.use_smooth = False
gem_obj.data.update()

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 90
scene.render.fps  = 30

# ── keyframe modifier show_in_viewport ─────────────────────────────────────────
# Frame 1:  modifier off, flat shading
scene.frame_set(1)
dt_mod.show_in_viewport = False
dt_mod.keyframe_insert("show_in_viewport", frame=1)

# Frame 30: still off — hold flat look
scene.frame_set(30)
dt_mod.keyframe_insert("show_in_viewport", frame=30)

# Frame 31: modifier on → smooth normals kick in
scene.frame_set(31)
dt_mod.show_in_viewport = True
dt_mod.keyframe_insert("show_in_viewport", frame=31)

# Also switch gem to smooth shading at frame 31 via a Python handler is complex.
# Simplest approach: use two copies of the gem instead.
# — gem_flat  (no modifier): visible F 1–30
# — gem_smooth (modifier active): visible F 31–90
# Build gem_smooth as a duplicate with modifier kept.
bpy.ops.object.select_all(action='DESELECT')
gem_obj.select_set(True)
bpy.context.view_layer.objects.active = gem_obj
bpy.ops.object.duplicate()
gem_smooth = bpy.context.active_object
gem_smooth.name = "gem_smooth"

# gem_smooth: smooth shading, modifier stays on (already duplicated)
for face in gem_smooth.data.polygons:
    face.use_smooth = True
gem_smooth.data.update()

# gem_flat (original): flat shading, no modifier
dt_flat = gem_obj.modifiers.get("DataTransfer")
if dt_flat:
    gem_obj.modifiers.remove(dt_flat)

# Hide both objects at frame 1; reveal each at correct frame
scene.frame_set(1)
gem_obj.hide_viewport    = False
gem_smooth.hide_viewport = True
gem_obj.keyframe_insert("hide_viewport", frame=1)
gem_smooth.keyframe_insert("hide_viewport", frame=1)

scene.frame_set(31)
gem_obj.hide_viewport    = True
gem_smooth.hide_viewport = False
gem_obj.keyframe_insert("hide_viewport", frame=31)
gem_smooth.keyframe_insert("hide_viewport", frame=31)

# ── camera orbit ───────────────────────────────────────────────────────────────
cam = scene.camera
cam.location = Vector((0.0, -0.65, 0.06))
cam.rotation_euler = Euler((math.radians(82), 0.0, 0.0), 'XYZ')

# parent camera to an empty that rotates
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
pivot = bpy.context.active_object
pivot.name = "CamPivot"
cam.parent = pivot

scene.frame_set(1)
pivot.rotation_euler.z = 0.0
pivot.keyframe_insert("rotation_euler", frame=1)

scene.frame_set(90)
pivot.rotation_euler.z = math.radians(360)
pivot.keyframe_insert("rotation_euler", frame=90)

# linear interpolation for camera rotation
for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── render settings ─────────────────────────────────────────────────────────────
scene.render.engine              = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x        = 1280
scene.render.resolution_y        = 720
scene.render.resolution_percentage = 100
scene.render.filepath            = str(OUTPUT_PATH)
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format       = 'MPEG4'
scene.render.ffmpeg.codec        = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'

bpy.ops.render.render(animation=True)
print("✓  viewport.mp4 written")
