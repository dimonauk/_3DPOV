"""
record.py — Viewport Animation Render
GN Simulation Zone — Spring-Pendulum Poi Lissajous
====================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run this AFTER blueprint.py has built the scene.
Produces: public/library/videos/geometry-nodes/
          gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting/
          viewport.mp4

Strategy: render the existing ribbon geometry as a static pose into PNG frames,
then stitch with FFmpeg inside Blender's VSE.  The animation camera orbits
slowly so the 3-D structure of the Lissajous trace is apparent.
"""

import bpy
import math
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
RENDER_DIR  = "//viewport_frames/"
OUTPUT_MP4  = "//viewport.mp4"
W, H        = 1920, 1080
FPS         = 30
ORBIT_SECS  = 10          # total camera orbit duration
N_FRAMES    = FPS * ORBIT_SECS

# ---------------------------------------------------------------------------
# Camera setup — orbiting rig
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Empty at origin for the camera to orbit around
empty = bpy.data.objects.new("CamTarget", None)
empty.empty_display_type = "PLAIN_AXES"
bpy.context.collection.objects.link(empty)

track = cam_obj.constraints.new("TRACK_TO")
track.target    = empty
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis   = "UP_Y"

# Keyframe camera orbit (radius=2.5 m, elevation=0.6 m)
R_ORB = 2.5
Z_ELV = 0.6
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = N_FRAMES

for fi in range(1, N_FRAMES + 1):
    t     = (fi - 1) / N_FRAMES
    angle = 2 * math.pi * t
    cam_obj.location = (
        R_ORB * math.cos(angle),
        R_ORB * math.sin(angle),
        Z_ELV,
    )
    cam_obj.keyframe_insert("location", frame=fi)

# Smooth interpolation for all fcurves
for fc in (cam_obj.animation_data.action.fcurves if cam_obj.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ---------------------------------------------------------------------------
# Render settings — EEVEE Next, PNG frames
# ---------------------------------------------------------------------------
scene = bpy.context.scene
scene.render.engine         = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x   = W
scene.render.resolution_y   = H
scene.render.fps            = FPS
scene.render.image_settings.file_format  = "PNG"
scene.render.image_settings.color_mode  = "RGB"
scene.render.filepath = RENDER_DIR

# EEVEE: bloom so emission colours glow like light painting
scene.eevee.use_bloom   = True
scene.eevee.bloom_intensity  = 0.15
scene.eevee.bloom_radius     = 4.0
scene.eevee.bloom_threshold  = 0.8

# Dark background — emissive strands pop against black
scene.world = bpy.data.worlds.new("RecordWorld")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.0, 0.0, 0.0, 1.0)
    bg.inputs["Strength"].default_value = 0.0

# Render all frames
bpy.ops.render.render(animation=True)

# ---------------------------------------------------------------------------
# Stitch PNG → MP4 via VSE (no external FFmpeg call needed)
# ---------------------------------------------------------------------------
scene.sequence_editor_create()
se = scene.sequence_editor
se.sequences.new_image(
    name    = "frames",
    filepath= RENDER_DIR + "0001.png",
    channel = 1,
    frame_start = 1,
)
# Expand to all frames
img_strip = se.sequences["frames"]
img_strip.frame_final_end = N_FRAMES + 1

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.ffmpeg.ffmpeg_preset        = "GOOD"
scene.render.filepath = OUTPUT_MP4

bpy.ops.render.render(animation=True)
print(f"viewport.mp4 written → {OUTPUT_MP4}")
