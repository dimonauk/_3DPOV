# record.py — Viewport render animation for the 3D Font Sign tutorial
# Run AFTER blueprint.py in the same Blender session.
# Orbits the camera around the sign to show extruded depth and bevel highlights.
# Output: public/library/videos/scripting/python-bpy-text-curve-3d-font-signage-webxr/viewport.mp4

import bpy
import math

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 96   # 4 seconds at 24 fps
scene.render.fps  = 24

# Camera — at camera-left, sweeps to camera-right to reveal the extrusion depth
bpy.ops.object.camera_add(location=(0.0, -5.2, 0.7))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(81), 0.0, 0.0)
scene.camera = cam

cam.animation_data_create()
action = bpy.data.actions.new("sign_orbit")
cam.animation_data.action = action

KEYFRAMES = [
    (1,  math.radians(-20)),
    (48, math.radians(0)),
    (96, math.radians(20)),
]
for frame, rot_y in KEYFRAMES:
    cam.rotation_euler = (math.radians(81), rot_y, 0.0)
    cam.keyframe_insert("rotation_euler", frame=frame)

# Smooth all tangents
for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# Key area light — above-right of camera, casts bevel highlights
bpy.ops.object.light_add(type='AREA', location=(3.5, -3.0, 4.5))
key = bpy.context.active_object
key.data.energy = 480.0
key.data.size   = 2.0
key.rotation_euler = (math.radians(52), 0.0, math.radians(25))

# Rim area light — top-left, picks out the plate edge
bpy.ops.object.light_add(type='AREA', location=(-3.5, 1.5, 3.5))
rim = bpy.context.active_object
rim.data.energy = 110.0
rim.data.size   = 1.5

# World background — dark grey keeps focus on the sign
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.02, 0.02, 0.03, 1.0)
    bg.inputs["Strength"].default_value = 0.25

# Viewport shading: Material Preview for PBR surface response
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type             = 'MATERIAL'
        space.shading.use_scene_lights = True
        break

# Output — filepath is a prefix; Blender appends the frame number
scene.render.filepath = (
    "//../../videos/scripting/"
    "python-bpy-text-curve-3d-font-signage-webxr/viewport"
)
scene.render.image_settings.file_format   = 'FFMPEG'
scene.render.ffmpeg.format                = 'MPEG4'
scene.render.ffmpeg.codec                 = 'H264'
scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
scene.render.ffmpeg.audio_codec           = 'NONE'
scene.render.resolution_x                 = 1280
scene.render.resolution_y                 = 720
scene.render.resolution_percentage        = 100

bpy.ops.render.opengl(animation=True, write_still=False)
print("viewport.mp4 written.")
