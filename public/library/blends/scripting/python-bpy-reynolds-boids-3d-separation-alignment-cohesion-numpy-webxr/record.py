"""
record.py — viewport animation capture  (Blender 5.1)

Usage (after running blueprint.py to populate the scene):
  bpy.ops.text.run_script() from within Blender, or:
  blender boids_scene.blend --python record.py

Renders FRAMES opengl frames, encodes to viewport.mp4.
Camera orbits 30° over the animation so the 3D depth of the flock reads.
"""

import math

import bpy

FRAMES = 180
FPS = 24
OUTPUT_DIR = (
    "//../../../../public/library/videos/"
    "scripting/python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr/"
)

CAM_RADIUS = 24.0
CAM_HEIGHT = 7.0

sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end = FRAMES
sc.render.fps = FPS
sc.render.resolution_x = 1280
sc.render.resolution_y = 720

sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.eevee.use_bloom = True
sc.eevee.bloom_threshold = 0.55
sc.eevee.bloom_intensity = 1.6
sc.eevee.bloom_radius = 4.0

sc.render.filepath = OUTPUT_DIR + "viewport"
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format = "MPEG4"
sc.render.ffmpeg.codec = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"

# Gentle 30° orbit so the viewer can appreciate the full 3D flock volume
cam = sc.camera
if cam:
    cam.animation_data_clear()
    for f in range(1, FRAMES + 1):
        t = (f - 1) / max(FRAMES - 1, 1)
        angle = math.radians(t * 30.0)
        cam.location.x = CAM_RADIUS * math.sin(angle)
        cam.location.y = -CAM_RADIUS * math.cos(angle)
        cam.location.z = CAM_HEIGHT
        cam.keyframe_insert("location", frame=f)

bpy.ops.render.render(animation=True)
print("[record] Done.")
