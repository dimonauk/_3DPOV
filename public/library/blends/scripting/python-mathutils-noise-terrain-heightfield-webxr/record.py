# record.py — viewport animation for python-mathutils-noise-terrain-heightfield-webxr
# Run AFTER blueprint.py (requires terrain_heightfield object in scene).
# Output: public/library/videos/scripting/
#           python-mathutils-noise-terrain-heightfield-webxr/viewport.mp4
# Duration: 240 frames @ 24 fps = 10 seconds.
# Shot: camera arcs from top-down overhead down to an eye-level sweep so the
# terrain silhouette is visible across the full clip length.

import bpy
import math

FRAMES   = 240
FPS      = 24
OUT_PATH = "//../../../../videos/scripting/python-mathutils-noise-terrain-heightfield-webxr/viewport.mp4"

# ── scene ─────────────────────────────────────────────────────────────────────
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = FRAMES
bpy.context.scene.render.fps  = FPS

r = bpy.context.scene.render
r.image_settings.file_format     = 'FFMPEG'
r.ffmpeg.format                  = 'MPEG4'
r.ffmpeg.codec                   = 'H264'
r.ffmpeg.constant_rate_factor    = 'MEDIUM'
r.ffmpeg.audio_codec             = 'NONE'
r.filepath                       = bpy.path.abspath(OUT_PATH)
r.resolution_x                   = 1280
r.resolution_y                   = 720
r.resolution_percentage          = 100

# ── camera ────────────────────────────────────────────────────────────────────
cam_data       = bpy.data.cameras.new("terrain_cam")
cam_data.lens  = 28.0   # wide angle to capture terrain spread
cam            = bpy.data.objects.new("terrain_cam", cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam

# ── look-at target ────────────────────────────────────────────────────────────
tgt = bpy.data.objects.new("cam_target", None)
bpy.context.collection.objects.link(tgt)
tgt.location = (0.0, 0.0, 1.2)   # terrain mid-height focus point

ct = cam.constraints.new('TRACK_TO')
ct.target     = tgt
ct.track_axis = 'TRACK_NEGATIVE_Z'
ct.up_axis    = 'UP_Y'

# ── keyframed orbit ───────────────────────────────────────────────────────────
# Arc from directly above (frame 1) through a 210° horizontal sweep down to
# near-eye-level (frame 240) to show the terrain silhouette profile.
def key_cam(frame, azimuth_deg, radius, height):
    bpy.context.scene.frame_set(frame)
    a = math.radians(azimuth_deg)
    cam.location = (math.cos(a) * radius, math.sin(a) * radius, height)
    cam.keyframe_insert('location', frame=frame)

key_cam(1,    0,  12, 18.0)   # top-down overview
key_cam(80,  60,  13, 11.0)   # mid-arc, 45° elevation
key_cam(160, 130, 14,  5.5)   # descending sweep
key_cam(240, 210, 16,  3.5)   # near-eye-level silhouette

# Smooth BEZIER interpolation for cinematic arc
for fc in cam.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation      = 'BEZIER'
        kp.handle_left_type   = 'AUTO_CLAMPED'
        kp.handle_right_type  = 'AUTO_CLAMPED'

# ── viewport shading: SOLID + VERTEX colour + cavity ─────────────────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        sp = area.spaces.active
        sp.shading.type               = 'SOLID'
        sp.shading.color_type         = 'VERTEX'     # reads terrain_colour attr
        sp.shading.show_cavity        = True
        sp.shading.cavity_type        = 'WORLD'
        sp.shading.cavity_ridge_factor  = 0.65
        sp.shading.cavity_valley_factor = 0.40
        sp.overlay.show_floor   = False
        sp.overlay.show_axis_x  = False
        sp.overlay.show_axis_y  = False
        sp.overlay.show_cursor  = False
        break

# ── render viewport animation ─────────────────────────────────────────────────
bpy.ops.render.opengl(animation=True)
print("[terrain record.py] viewport.mp4 written.")
