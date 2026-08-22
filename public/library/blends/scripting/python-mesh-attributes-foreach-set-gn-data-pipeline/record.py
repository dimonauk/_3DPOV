# record.py — viewport animation render for attribute_planet
# Run in Blender 5.1 Scripting workspace AFTER blueprint.py.
# Renders a 3-second camera orbit showing the biome-coloured icosphere
# in Vertex Paint / Solid shading mode.
#
# Output: public/library/videos/scripting/
#         python-mesh-attributes-foreach-set-gn-data-pipeline/viewport.mp4

import bpy, math

FRAME_START = 1
FRAME_END   = 90     # 3 s at 30 fps — full orbit + colour reveal
RADIUS      = 3.2
OUTPUT = (
    "//../../../../public/library/videos/scripting/"
    "python-mesh-attributes-foreach-set-gn-data-pipeline/viewport"
)

sc = bpy.context.scene
sc.frame_start = FRAME_START
sc.frame_end   = FRAME_END
sc.render.fps  = 30
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.image_settings.file_format   = 'FFMPEG'
sc.render.ffmpeg.format                = 'MPEG4'
sc.render.ffmpeg.codec                 = 'H264'
sc.render.ffmpeg.constant_rate_factor  = 'HIGH'
sc.render.filepath = OUTPUT

# ── CAMERA ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.get("RecordCam") or bpy.data.cameras.new("RecordCam")
cam = bpy.data.objects.get("RecordCam")
if cam is None:
    cam = bpy.data.objects.new("RecordCam", cam_data)
    sc.collection.objects.link(cam)
sc.camera = cam

# ── VIEWPORT SHADING — show face_colour attribute as vertex colour ────────────
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        shading = area.spaces.active.shading
        shading.type       = 'SOLID'
        shading.color_type = 'VERTEX'   # displays active colour attribute
        break

# ── CAMERA ORBIT KEYFRAMES ────────────────────────────────────────────────────
for f in range(FRAME_START, FRAME_END + 1):
    t   = (f - FRAME_START) / max(1, FRAME_END - FRAME_START)
    ang = t * math.tau                  # 0 → 2π full orbit
    cam.location = (
        math.sin(ang) * RADIUS,
        -math.cos(ang) * RADIUS,
        RADIUS * 0.30,                  # slight elevation to show poles
    )
    dx = -cam.location[0]
    dy = -cam.location[1]
    dz = -cam.location[2]
    yaw   = math.atan2(dx, -dy)
    pitch = math.atan2(-dz, math.sqrt(dx * dx + dy * dy))
    cam.rotation_euler = (math.pi / 2 + pitch, 0.0, yaw)
    cam.keyframe_insert("location",       frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

bpy.ops.render.opengl(animation=True, write_still=False)
print("[holoflow] record complete.")
