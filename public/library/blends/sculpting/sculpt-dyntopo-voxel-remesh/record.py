"""
Blender 5.1 — record.py
Camera orbit around the voxel-remeshed sculpt.

Run AFTER blueprint.py (or open the saved .blend).
Outputs: public/library/videos/sculpting/sculpt-dyntopo-voxel-remesh/viewport.mp4

Technique: empty-driven camera orbit with Track To constraint.
Frame range: 0–90 @ 30 fps = 3 seconds, one full revolution.
"""

import bpy
import math

# ─── parameters ──────────────────────────────────────────────────────────────
FRAME_START   = 0
FRAME_END     = 90
FPS           = 30
ORBIT_RADIUS  = 1.8      # camera distance from origin
ORBIT_HEIGHT  = 0.25     # camera height above equator

OUTPUT_PATH = "//../../videos/sculpting/sculpt-dyntopo-voxel-remesh/viewport"

# ─── render settings ─────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.render.fps           = FPS
scene.frame_start          = FRAME_START
scene.frame_end            = FRAME_END

scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)

# ─── find sculpt mesh ────────────────────────────────────────────────────────
sculpt_obj = bpy.data.objects.get("sculpt_organic_head")
if sculpt_obj is None:
    raise RuntimeError("sculpt_organic_head not found — run blueprint.py first")

# ─── orbit empty ─────────────────────────────────────────────────────────────
# Camera is parented to the empty; animating the empty's Z-rotation
# creates a smooth orbit without needing path curves.
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
orbit_empty = bpy.context.active_object
orbit_empty.name = "CameraOrbit"

# ─── camera ──────────────────────────────────────────────────────────────────
cam_obj = bpy.data.objects.get("Camera")
if cam_obj is None:
    bpy.ops.object.camera_add()
    cam_obj = bpy.context.active_object

cam_obj.location = (ORBIT_RADIUS, 0.0, ORBIT_HEIGHT)

# Parent camera to orbit empty
cam_obj.parent = orbit_empty

# Track To constraint — camera always looks at the sculpt
track = cam_obj.constraints.new('TRACK_TO')
track.target    = sculpt_obj
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis   = 'UP_Y'

scene.camera = cam_obj

# ─── orbit animation ─────────────────────────────────────────────────────────
orbit_empty.rotation_euler = (0, 0, 0)
orbit_empty.keyframe_insert(data_path='rotation_euler', frame=FRAME_START)

orbit_empty.rotation_euler = (0, 0, math.radians(360))
orbit_empty.keyframe_insert(data_path='rotation_euler', frame=FRAME_END)

# Linear interpolation for constant angular velocity
for fcurve in orbit_empty.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'LINEAR'

# ─── EEVEE Next scene settings ───────────────────────────────────────────────
eevee = scene.eevee
eevee.taa_render_samples   = 32    # fast enough for a 3-second orbit
eevee.use_gtao              = True  # ambient occlusion highlights surface detail
eevee.gtao_distance         = 0.15
eevee.use_bloom             = False

# ─── render ──────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[record] Orbit render complete → {OUTPUT_PATH}.mp4")
