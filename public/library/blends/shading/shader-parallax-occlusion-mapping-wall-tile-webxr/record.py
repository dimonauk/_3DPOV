"""
record.py — viewport render for POM Brick Wall
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py.  Animates a camera arc from straight overhead
(no parallax visible) to 30° elevation (strong parallax) over 60 frames at
30 fps, holds for 30 frames.  Total: 3 seconds.

Renders to:
  public/library/videos/shading/shader-parallax-occlusion-mapping-wall-tile-webxr/viewport.mp4
"""

import bpy, math, os

SLUG  = "shader-parallax-occlusion-mapping-wall-tile-webxr"
TOPIC = "shading"
FPS   = 30
F_END = 90     # 60 frames arc + 30 frames hold
CAM_D = 3.0    # camera distance from origin

OUT = bpy.path.abspath(
    f"//../../../../public/library/videos/{TOPIC}/{SLUG}/viewport.mp4"
)

# ── camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(0.0, -CAM_D, CAM_D))
cam = bpy.context.active_object
cam.name = "rec_cam"
bpy.context.scene.camera = cam

tc = cam.constraints.new('TRACK_TO')
tc.target     = bpy.data.objects["wall_tile_pom"]
tc.track_axis = 'TRACK_NEGATIVE_Z'
tc.up_axis    = 'UP_Y'

# ── keyframe arc ──────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = F_END

def cam_at(frame, elevation_deg):
    el = math.radians(elevation_deg)
    cam.location = (0.0, -CAM_D * math.cos(el), CAM_D * math.sin(el))
    cam.keyframe_insert("location", frame=frame)

cam_at(1,  90)   # overhead — zero parallax
cam_at(60, 30)   # 30° oblique — POM depth is strongest
cam_at(90, 30)   # hold on oblique

for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# ── add a directional light for readable depth on bricks ─────────────────────
bpy.ops.object.light_add(type='SUN', location=(3.0, -3.0, 5.0))
sun = bpy.context.active_object
sun.name = "rec_sun"
sun.data.energy = 3.0
sun.data.angle  = math.radians(5)

# ── render settings ───────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine                   = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x             = 1920
sc.render.resolution_y             = 1080
sc.render.fps                      = FPS
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format            = 'MPEG4'
sc.render.ffmpeg.codec             = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.eevee.use_shadows               = True

os.makedirs(os.path.dirname(OUT), exist_ok=True)
sc.render.filepath = OUT
bpy.ops.render.render(animation=True)
print(f"[holoflow] recorded → {OUT}")
