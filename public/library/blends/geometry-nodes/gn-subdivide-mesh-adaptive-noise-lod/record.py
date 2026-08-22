"""
record.py — Viewport animation render for adaptive LOD terrain
Blender 5.1 | CC0 | Holoflow Studio

Renders a 120-frame sequence showing the density threshold animating 0.2 → 0.8 → 0.2,
so dense patches grow to cover the terrain then recede. Output: viewport.mp4 via
OpenGL render. Run AFTER blueprint.py has been executed in the same session.

Requires ffmpeg on PATH for final encode. Frames land in /tmp/adaptive_lod_frames/.
"""

import bpy
import os
import math

OUTPUT_DIR  = "/tmp/adaptive_lod_frames"
VIDEO_OUT   = bpy.path.abspath("//../../videos/geometry-nodes/gn-subdivide-mesh-adaptive-noise-lod/viewport.mp4")
FRAME_START = 1
FRAME_END   = 120
FPS         = 24
RES_X       = 1280
RES_Y       = 720

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VIDEO_OUT), exist_ok=True)

scene = bpy.context.scene
scene.frame_start  = FRAME_START
scene.frame_end    = FRAME_END
scene.render.fps   = FPS
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y

# Locate the GN modifier's Compare node threshold input
obj = bpy.data.objects.get("adaptive_terrain")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'adaptive_terrain' object not found.")

tree = None
for mod in obj.modifiers:
    if mod.type == 'NODES' and mod.node_group:
        tree = mod.node_group
        break

cmp_node = None
if tree:
    for n in tree.nodes:
        if n.bl_idname == "FunctionNodeCompare":
            cmp_node = n
            break

if cmp_node is None:
    raise RuntimeError("Compare node not found in GN tree. Check blueprint.py output.")

# Keyframe threshold: 0.2 → 0.8 → 0.2 (cosine ease)
cmp_node.inputs[1].default_value = 0.2
cmp_node.inputs[1].keyframe_insert(data_path="default_value", frame=1)

cmp_node.inputs[1].default_value = 0.8
cmp_node.inputs[1].keyframe_insert(data_path="default_value", frame=60)

cmp_node.inputs[1].default_value = 0.2
cmp_node.inputs[1].keyframe_insert(data_path="default_value", frame=120)

# Apply cosine easing to both keyframes
for fc in obj.modifiers["AdaptiveLOD"].node_group.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'
        kp.handle_left_type  = 'AUTO'
        kp.handle_right_type = 'AUTO'

# Camera setup — top-side angle to show terrain topology
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35.0
cam = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location    = (4.5, -4.5, 4.0)
cam.rotation_euler = (math.radians(52), 0, math.radians(45))
scene.camera = cam

# Sun lamp
sun_data = bpy.data.lights.new("Sun", 'SUN')
sun_data.energy = 3.5
sun = bpy.data.objects.new("Sun", sun_data)
bpy.context.collection.objects.link(sun)
sun.rotation_euler = (math.radians(60), 0, math.radians(-25))

# EEVEE render settings
scene.render.engine           = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 16
scene.render.image_settings.file_format = 'PNG'

# Render each frame
for f in range(FRAME_START, FRAME_END + 1):
    scene.frame_set(f)
    scene.render.filepath = os.path.join(OUTPUT_DIR, f"frame_{f:04d}.png")
    bpy.ops.render.render(write_still=True)

# Encode to mp4 with ffmpeg
ffmpeg_cmd = (
    f'ffmpeg -y -framerate {FPS} '
    f'-i "{OUTPUT_DIR}/frame_%04d.png" '
    f'-c:v libx264 -pix_fmt yuv420p -crf 22 '
    f'"{VIDEO_OUT}"'
)
ret = os.system(ffmpeg_cmd)
if ret == 0:
    print(f"record.py: viewport.mp4 written to {VIDEO_OUT}")
else:
    print(f"record.py: ffmpeg encode failed (code {ret}). Frames in {OUTPUT_DIR}.")
