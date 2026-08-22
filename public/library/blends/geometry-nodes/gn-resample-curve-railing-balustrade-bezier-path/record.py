"""
record.py — Viewport animation render for the railing balustrade tutorial.

Outputs: public/library/videos/geometry-nodes/gn-resample-curve-railing-balustrade-bezier-path/viewport.mp4
Duration: 120 frames @ 24 fps = 5 seconds
  F001–030  camera orbits to show the full S-curve railing from side angle
  F031–060  camera pushes in close — baluster regularity visible
  F061–090  camera pulls back to reveal the whole 5 m run
  F091–120  slow rotation showing the chrome handrail catching light

Run from Blender Scripting workspace AFTER blueprint.py has been executed.
"""

import bpy
import math
from mathutils import Vector

FPS        = 24
TOTAL      = 120
OUT_PATH   = "//../../videos/geometry-nodes/gn-resample-curve-railing-balustrade-bezier-path/viewport"

scene = bpy.context.scene
scene.render.fps            = FPS
scene.frame_start           = 1
scene.frame_end             = TOTAL
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format             = 'MPEG4'
scene.render.ffmpeg.codec              = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = OUT_PATH

# ── camera path ───────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_data.lens = 35

def set_cam(frame: int, loc: tuple, look_at: Vector) -> None:
    cam_obj.location = loc
    direction = look_at - Vector(loc)
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert('location',       frame=frame)
    cam_obj.keyframe_insert('rotation_euler', frame=frame)

rail_centre = Vector((2.5, 1.0, 0.45))   # rough mid-point + half rail height

# Wide establishing shot from high angle
set_cam(  1, ( 8.0, -5.0, 4.0), rail_centre)
# Orbit to side view
set_cam( 30, (-0.5, -6.0, 2.8), rail_centre)
# Push in — close on individual balusters
set_cam( 60, ( 2.0, -2.5, 1.4), Vector((2.5, 1.0, 0.5)))
# Pull back — full length visible
set_cam( 90, ( 2.5, -7.5, 3.5), rail_centre)
# End: dramatic low angle showing chrome handrail
set_cam(120, ( 5.5, -3.0, 0.6), Vector((2.5, 0.8, 0.9)))

# smooth interpolation
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ── viewport shading ──────────────────────────────────────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type        = 'MATERIAL'
        space.shading.use_scene_lights       = True
        space.shading.use_scene_world        = False
        space.shading.studio_light           = 'studio.exr'
        space.shading.studiolight_intensity  = 1.2
        break

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True, sequencer=False)
print("[HF] record.py done → viewport.mp4")
