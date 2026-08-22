"""
record.py — Viewport Animation Render
mathutils.geometry CDT Stage Floor
===================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py has built the scene.
Output: public/library/videos/scripting/
        python-mathutils-geometry-delaunay-2d-cdt-convex-hull-stage-floor-webxr/
        viewport.mp4

Strategy: top-down and oblique orbit passes over the triangulated floor so
the Delaunay facets and circumradius colouring are fully visible.
"""

import bpy, math
from pathlib import Path

RENDER_DIR = "//viewport_frames/"
OUTPUT_MP4 = "//viewport.mp4"
W, H       = 1920, 1080
FPS        = 30
DURATION   = 10       # seconds
N_FRAMES   = FPS * DURATION

# ── Camera rig ───────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 35
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

target = bpy.data.objects.new("CamTarget", None)
bpy.context.collection.objects.link(target)
target.location = (0.0, 0.0, 0.0)

trk = cam_obj.constraints.new("TRACK_TO")
trk.target     = target
trk.track_axis = "TRACK_NEGATIVE_Z"
trk.up_axis    = "UP_Y"

# Orbit: start top-down (Z axis), tilt to 35° elevation over first 3 s,
# then complete a full 360° horizontal orbit at that elevation.
R = 7.0
Z = 5.0
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = N_FRAMES

for fi in range(1, N_FRAMES + 1):
    t     = (fi - 1) / N_FRAMES
    # Tilt from 90° (top-down) to 35° over first 30% of duration
    elev  = math.radians(90) - math.radians(55) * min(t / 0.3, 1.0)
    angle = 2 * math.pi * t
    cam_obj.location = (
        R * math.cos(angle) * math.cos(elev),
        R * math.sin(angle) * math.cos(elev),
        R * math.sin(elev),
    )
    cam_obj.keyframe_insert("location", frame=fi)

for fc in (cam_obj.animation_data.action.fcurves if cam_obj.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ── Render settings ───────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x        = W
scene.render.resolution_y        = H
scene.render.fps                 = FPS
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode  = "RGB"
scene.render.filepath = RENDER_DIR

# Neutral environment — let the facet colours read clearly
scene.world = bpy.data.worlds.new("RecordWorld")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.02, 0.02, 0.03, 1.0)
    bg.inputs["Strength"].default_value = 0.4

# ── Render frames + stitch ───────────────────────────────────────────────────
bpy.ops.render.render(animation=True)

scene.sequence_editor_create()
se = scene.sequence_editor
se.sequences.new_image(
    name="frames", filepath=RENDER_DIR + "0001.png", channel=1, frame_start=1
)
se.sequences["frames"].frame_final_end = N_FRAMES + 1

scene.render.image_settings.file_format   = "FFMPEG"
scene.render.ffmpeg.format                = "MPEG4"
scene.render.ffmpeg.codec                 = "H264"
scene.render.ffmpeg.constant_rate_factor  = "HIGH"
scene.render.ffmpeg.ffmpeg_preset         = "GOOD"
scene.render.filepath = OUTPUT_MP4

bpy.ops.render.render(animation=True)
print(f"[holoflow] record complete → {OUTPUT_MP4}")
