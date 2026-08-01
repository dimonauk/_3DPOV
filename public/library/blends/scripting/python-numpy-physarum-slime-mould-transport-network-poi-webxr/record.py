# record.py — viewport animation for physarum_network
# Run AFTER blueprint.py has built the scene.
# Produces public/library/videos/scripting/python-numpy-physarum-slime-mould-transport-network-poi-webxr/viewport.mp4
# Blender 5.1 · EEVEE Next · CC0

import math
import bpy

FRAMES_TOTAL = 150     # 5 seconds at 30 fps
VIDEO_DIR    = "//../../../../videos/scripting/python-numpy-physarum-slime-mould-transport-network-poi-webxr/"

scene = bpy.context.scene
scene.render.engine            = "BLENDER_EEVEE_NEXT"
scene.render.fps               = 30
scene.frame_start              = 1
scene.frame_end                = FRAMES_TOTAL
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format     = "MPEG4"
scene.render.ffmpeg.codec      = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.resolution_x      = 1920
scene.render.resolution_y      = 1080
scene.render.filepath          = VIDEO_DIR + "viewport.mp4"

# --- WORLD ---
scene.world.use_nodes          = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.0, 0.0, 0.0, 1.0)   # pure black
    bg.inputs["Strength"].default_value = 0.0

# --- CAMERA ---
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50.0
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Phase 1 (F1-50): top-down looking straight down — reveals the 2-D pattern
# Phase 2 (F51-100): smooth pitch from 0° to 65° — shows the height-field relief
# Phase 3 (F101-150): 360° orbit at 65° elevation — full sculptural read
ORBIT_R  = 9.0      # metres from mesh centre
TOP_Z    = 11.0     # Z for top-down phase

def _set_cam_above(frame: int) -> None:
    cam_obj.location = (0.0, 0.0, TOP_Z)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)   # looking down
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

def _set_cam_orbit(frame: int, azimuth_deg: float, elev_deg: float) -> None:
    az  = math.radians(azimuth_deg)
    el  = math.radians(elev_deg)
    cam_obj.location = (
        ORBIT_R * math.cos(az) * math.cos(el),
        ORBIT_R * math.sin(az) * math.cos(el),
        ORBIT_R * math.sin(el),
    )
    # track to origin
    dx = -cam_obj.location[0]
    dy = -cam_obj.location[1]
    dz = -cam_obj.location[2]
    # Euler XYZ: pitch then yaw
    pitch = math.atan2(-dz, math.sqrt(dx**2 + dy**2))
    yaw   = math.atan2(dy, dx)
    cam_obj.rotation_euler = (math.pi / 2 - elev_deg * math.pi / 180,
                               0.0,
                               az + math.pi / 2)
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# Phase 1 keyframes
_set_cam_above(frame=1)
_set_cam_above(frame=50)

# Phase 2 transition keyframes
_set_cam_orbit(frame=51,  azimuth_deg=30.0, elev_deg=80.0)
_set_cam_orbit(frame=100, azimuth_deg=30.0, elev_deg=35.0)

# Phase 3: 360° orbit at elev=35°
for i in range(5):
    _set_cam_orbit(frame=101 + i * 10, azimuth_deg=i * 72.0, elev_deg=35.0)
_set_cam_orbit(frame=150, azimuth_deg=360.0, elev_deg=35.0)

# ease interpolation on all fcurves
for action in bpy.data.actions:
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "AUTO"

# --- RENDER ---
bpy.ops.render.render(animation=True, write_still=False)
