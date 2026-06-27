"""
record.py — Viewport animation render for gn-volume-to-mesh-point-cloud-blob-reconstruction
============================================================================================
Blender 5.1 | Holoflow Studio | CC0

Run AFTER blueprint.py. Rotates the blob object across 120 frames to show the
reconstructed Marching Cubes surface from multiple angles, then renders an
OpenGL MP4 viewport animation at:
  public/library/videos/geometry-nodes/gn-volume-to-mesh-point-cloud-blob-reconstruction/viewport.mp4

Material Preview (MATERIAL) shading is used — faster than Rendered and shows the
teal-cyan BlobOrganic material with the facing/emission mix legibly without
waiting for a Cycles path trace.
"""

import bpy
import math
import os

OUTPUT_DIR = os.path.join(
    bpy.path.abspath("//"),
    "../../../../public/library/videos/geometry-nodes/"
    "gn-volume-to-mesh-point-cloud-blob-reconstruction"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")
TOTAL_FRAMES = 120
FPS          = 24

os.makedirs(OUTPUT_DIR, exist_ok=True)

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = TOTAL_FRAMES
scn.render.fps  = FPS
scn.render.resolution_x             = 1920
scn.render.resolution_y             = 1080
scn.render.resolution_percentage    = 100
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format              = 'MPEG4'
scn.render.ffmpeg.codec               = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath = OUTPUT_FILE

# Rotate blob object 360° across 120 frames so all surface features are visible
blob = bpy.data.objects.get("blob_source")
if blob:
    blob.animation_data_create()
    blob.rotation_euler = (0, 0, 0)
    blob.keyframe_insert(data_path='rotation_euler', index=2, frame=1)
    blob.rotation_euler = (0, 0, math.radians(360))
    blob.keyframe_insert(data_path='rotation_euler', index=2, frame=TOTAL_FRAMES)

    # Linear interpolation so rotation is constant-speed
    if blob.animation_data and blob.animation_data.action:
        for fc in blob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

# Set viewport shading to Material Preview in the first 3D view
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'
        break

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record.py] Rendered {TOTAL_FRAMES} frames → {OUTPUT_FILE}.mp4")
