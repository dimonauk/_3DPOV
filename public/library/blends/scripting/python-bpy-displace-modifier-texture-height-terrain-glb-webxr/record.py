"""
Viewport animation recorder — DisplaceModifier height-field terrain
Outputs: public/library/videos/scripting/
         python-bpy-displace-modifier-texture-height-terrain-glb-webxr/viewport.mp4

Run AFTER blueprint.py so the baked terrain object already exists in the scene.
This script does NOT re-run the full build; it reads the existing scene,
sets up camera + lighting, keyframes a turntable, and renders via OpenGL.
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
OUTPUT_DIR  = "//../../../../videos/scripting/" \
              "python-bpy-displace-modifier-texture-height-terrain-glb-webxr/"
FRAME_START = 1
FRAME_END   = 90            # 3 s at 30 fps — enough for one full orbit
FPS         = 30
RES_X       = 1280
RES_Y       = 720

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = FRAME_END
scene.render.fps  = FPS
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath = bpy.path.abspath(OUTPUT_DIR) + "viewport"

os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Position above and to the side, pointing at terrain centre
cam_obj.location = (4.5, -4.5, 3.8)
cam_obj.rotation_euler = (math.radians(58), 0, math.radians(45))

# Turntable: camera orbits terrain centre on a 5 m radius
RADIUS = 6.0
for f in range(FRAME_START, FRAME_END + 1):
    t     = (f - FRAME_START) / (FRAME_END - FRAME_START)
    angle = 2 * math.pi * t
    cam_obj.location.x = RADIUS * math.sin(angle)
    cam_obj.location.y = -RADIUS * math.cos(angle)
    cam_obj.location.z = 3.8
    # Always point at the terrain centre (origin)
    direction = cam_obj.location.copy()
    direction.z -= 1.0          # aim slightly below centre for horizon feel
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# ── Lighting — simple sun ─────────────────────────────────────────────────────
sun_data = bpy.data.lights.new("RecordSun", 'SUN')
sun_data.energy = 3.0
sun_data.angle  = math.radians(5)
sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
sun_obj.rotation_euler = (math.radians(55), 0, math.radians(30))
scene.collection.objects.link(sun_obj)

# ── Workbench render (no GPU required, fast OpenGL) ───────────────────────────
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light     = 'MATCAP'
scene.display.shading.show_shadows = True

bpy.ops.render.opengl(animation=True)
print("[HF] Viewport recording done →", scene.render.filepath)
