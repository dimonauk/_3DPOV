"""
record.py — viewport render animation for solidify tutorial
Output: public/library/videos/scripting/
          python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr/viewport.mp4
30 fps · 150 frames (~5 s) · 1280×720 · Workbench cavity shading

Run AFTER blueprint.py so hf_relic_case is present in the scene.
"""

import bpy, mathutils, os, math

# ── Output path ───────────────────────────────────────────────────────────────
_here      = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else "/tmp"
VIDEO_DIR  = os.path.normpath(os.path.join(
    _here, "..", "..", "..", "..", "videos", "scripting",
    "python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr",
))
os.makedirs(VIDEO_DIR, exist_ok=True)
VIDEO_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

# ── Scene setup ───────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 150

scene.render.resolution_x          = 1280
scene.render.resolution_y          = 720
scene.render.resolution_percentage = 100
scene.render.fps                    = 30
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath                    = VIDEO_PATH

# ── Workbench renderer — fast, cavity shows wall-thickness rim clearly ─────────
scene.render.engine = 'BLENDER_WORKBENCH'

# ── Camera — orbit 360° at slight downward tilt to reveal inner cavity ─────────
CAM_RADIUS    = 2.4
CAM_ELEVATION = math.radians(30)   # 30° above equator, enough to see open lid

cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("rec_cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

target = mathutils.Vector((0.0, 0.0, 0.0))

for fr in range(1, 151):
    az = math.radians((fr - 1) / 149 * 360.0)   # full orbit over 150 frames
    x  = CAM_RADIUS * math.cos(az) * math.cos(CAM_ELEVATION)
    y  = CAM_RADIUS * math.sin(az) * math.cos(CAM_ELEVATION)
    z  = CAM_RADIUS * math.sin(CAM_ELEVATION)

    cam_obj.location = (x, y, z)

    look      = target - mathutils.Vector((x, y, z))
    rot_quat  = look.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    cam_obj.keyframe_insert("location",       frame=fr)
    cam_obj.keyframe_insert("rotation_euler", frame=fr)

# ── Light ─────────────────────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("rec_sun", type='SUN')
sun_data.energy = 3.0
sun_obj  = bpy.data.objects.new("rec_sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0.0, math.radians(30))

# ── Render ─────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"[holoflow] rendered {VIDEO_PATH}")
