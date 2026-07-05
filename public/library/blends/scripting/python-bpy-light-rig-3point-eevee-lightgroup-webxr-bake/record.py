# record.py — Viewport render animation: 3-Point Light Rig
# Run AFTER blueprint.py in the same Blender session.
# Orbits the camera 180° around the lit sphere to show key/fill/rim behaviour.
# Output: public/library/videos/scripting/
#         python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake/viewport.mp4

import bpy
import math

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 96   # 4 s at 24 fps
scene.render.fps  = 24

# Camera — starts side-on where the key is brightest, sweeps to the fill side
bpy.ops.object.camera_add(location=(7.0, -2.5, 2.0))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(78), 0.0, math.radians(68))
scene.camera = cam

cam.animation_data_create()
action = bpy.data.actions.new("light_rig_orbit")
cam.animation_data.action = action

KEYS = [
    (1,  (math.radians(78), 0.0, math.radians(68))),   # key-side three-quarter
    (32, (math.radians(82), 0.0, math.radians(20))),   # front — both key and fill visible
    (64, (math.radians(78), 0.0, math.radians(-68))),  # fill side
    (96, (math.radians(75), 0.0, math.radians(-140))), # rim side — silhouette edge lit
]
for frame, rot in KEYS:
    cam.rotation_euler = rot
    cam.keyframe_insert("rotation_euler", frame=frame)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation     = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# World — deep grey so rim halo reads cleanly
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.02, 0.02, 0.02, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# Shading: MATERIAL Preview uses scene lights
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type             = 'MATERIAL'
        space.shading.use_scene_lights = True
        break

scene.render.filepath = (
    "//../../videos/scripting/"
    "python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake/viewport"
)
scene.render.image_settings.file_format  = 'FFMPEG'
scene.render.ffmpeg.format               = 'MPEG4'
scene.render.ffmpeg.codec                = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.audio_codec          = 'NONE'
scene.render.resolution_x                = 1280
scene.render.resolution_y                = 720
scene.render.resolution_percentage       = 100

bpy.ops.render.opengl(animation=True, write_still=False)
print("viewport.mp4 written.")
