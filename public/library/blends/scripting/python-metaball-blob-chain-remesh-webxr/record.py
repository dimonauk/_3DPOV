# record.py — Viewport render animation for the MetaBall Blob Chain tutorial
# Run AFTER blueprint.py in the same Blender session.
# Orbits the camera 180° around the blob creature to show the isosurface merge
# across the body–head junction and the tail capsule.
# Output: public/library/videos/scripting/python-metaball-blob-chain-remesh-webxr/viewport.mp4

import bpy
import math

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 96   # 4 s at 24 fps
scene.render.fps  = 24

# Camera — starts side-on, rotates to three-quarter front to show body depth
bpy.ops.object.camera_add(location=(4.5, -2.0, 1.2))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(75), 0.0, math.radians(60))
scene.camera = cam

cam.animation_data_create()
action = bpy.data.actions.new("blob_orbit")
cam.animation_data.action = action

# Keyframes: sweep from side view (frame 1) through front (48) to opposite side (96)
KEYS = [
    (1,  (math.radians(75), 0.0, math.radians(60))),
    (48, (math.radians(80), 0.0, math.radians(0))),
    (96, (math.radians(75), 0.0, math.radians(-60))),
]
for frame, rot in KEYS:
    cam.rotation_euler = rot
    cam.keyframe_insert("rotation_euler", frame=frame)

for fc in action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation     = 'BEZIER'
        kp.handle_left_type  = 'AUTO_CLAMPED'
        kp.handle_right_type = 'AUTO_CLAMPED'

# Key light — warm, above right, casts secondary specular over the curvature
bpy.ops.object.light_add(type='AREA', location=(4.0, -1.5, 5.0))
key = bpy.context.active_object
key.data.energy = 550.0
key.data.size   = 2.5
key.rotation_euler = (math.radians(45), 0.0, math.radians(30))

# Fill light — cool, opposite side, keeps shadow detail readable
bpy.ops.object.light_add(type='AREA', location=(-3.0, 2.0, 3.0))
fill = bpy.context.active_object
fill.data.energy = 180.0
fill.data.size   = 3.0
fill.rotation_euler = (math.radians(60), 0.0, math.radians(-150))
fill.data.color  = (0.7, 0.85, 1.0)   # slightly cool

# World — near-black for studio clarity
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.025, 0.025, 0.03, 1.0)
    bg.inputs["Strength"].default_value = 0.15

# Material Preview shading — shows PBR surface response with scene lights
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        space = area.spaces.active
        space.shading.type             = 'MATERIAL'
        space.shading.use_scene_lights = True
        break

scene.render.filepath = (
    "//../../videos/scripting/"
    "python-metaball-blob-chain-remesh-webxr/viewport"
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
