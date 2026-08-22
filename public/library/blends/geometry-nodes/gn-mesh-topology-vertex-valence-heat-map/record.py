"""
record.py — OpenGL viewport animation render for gn-mesh-topology-vertex-valence-heat-map
Outputs: public/library/videos/geometry-nodes/gn-mesh-topology-vertex-valence-heat-map/viewport.mp4

Run AFTER blueprint.py has saved vertex_valence_heat_map.blend in the same directory:
  blender vertex_valence_heat_map.blend --background --python record.py

The 60-frame clip (2.5 s at 24 fps) rotates the sphere a full 360° so the
viewer can clearly see:
  - Red caps (top and bottom): UV sphere poles, valence = UV_U = 8
  - Green equatorial band: ring vertices, valence = 4 (ideal quad)
  - Smooth gradient between them showing the topology gradient

EEVEE Next renders each frame in ~0.1–0.3 s on a mid-range GPU.
Total render time: under 30 seconds.
"""

import bpy
import os

_here = os.path.dirname(bpy.data.filepath)
VIDEO_DIR = os.path.normpath(os.path.join(
    _here,
    "../../../../public/library/videos/geometry-nodes/gn-mesh-topology-vertex-valence-heat-map",
))
os.makedirs(VIDEO_DIR, exist_ok=True)

sc = bpy.context.scene
sc.frame_start, sc.frame_end         = 1, 60
sc.render.fps                        = 24
sc.render.resolution_x               = 1280
sc.render.resolution_y               = 720
sc.render.resolution_percentage      = 100
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format              = 'MPEG4'
sc.render.ffmpeg.codec               = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.ffmpeg.audio_codec         = 'NONE'
sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[record] viewport.mp4 → {sc.render.filepath}")
