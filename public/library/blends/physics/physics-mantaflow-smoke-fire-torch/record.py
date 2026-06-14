"""
record.py — Mantaflow Smoke & Fire Torch: slow-orbit EEVEE render
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER opening flame_torch.blend in the UI and completing Bake All:
  blender --background flame_torch.blend --python record.py

Orbits the camera 180° from the left-front quarter to right-front, over 100
frames.  The arc shows the full three-dimensional flame column: flickering base,
tapered waist, and diffusing smoke cap — all visible in a single continuous pull.

Output: public/library/videos/physics/physics-mantaflow-smoke-fire-torch/viewport.mp4
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FPS          = 24
TOTAL_FRAMES = 100          # matches FRAME_END in blueprint.py

ORBIT_RADIUS = 2.2          # camera distance from scene origin
ORBIT_HEIGHT = 0.40         # camera elevation (near flame mid-height)
LOOK_TARGET  = Vector((0.0, 0.0, 0.30))   # slightly above torch head
ORBIT_START  = math.radians(-140)
ORBIT_END    = math.radians(40)           # 180° sweep

OUTPUT_DIR = "//../../videos/physics/physics-mantaflow-smoke-fire-torch/"


def add_orbit_keyframes() -> None:
    scene = bpy.context.scene
    cam = scene.camera
    if cam is None:
        raise RuntimeError("No camera in scene — run blueprint.py first.")

    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    for frame in range(1, TOTAL_FRAMES + 1):
        t     = (frame - 1) / (TOTAL_FRAMES - 1)
        angle = ORBIT_START + t * (ORBIT_END - ORBIT_START)
        x = ORBIT_RADIUS * math.sin(angle)
        y = ORBIT_RADIUS * math.cos(angle)
        cam.location = Vector((x, y, ORBIT_HEIGHT))
        direction    = (LOOK_TARGET - cam.location).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # Linear interpolation: no ease-in/ease-out, constant angular velocity
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def configure_render() -> None:
    scene = bpy.context.scene
    # EEVEE is the correct choice for gas sims: renders each volume frame in
    # roughly 1/10th the time Cycles requires for equivalent smoke quality.
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = FPS

    eevee = scene.eevee
    eevee.volumetric_samples   = 128
    eevee.volumetric_tile_size = '2'
    eevee.use_volumetric_lights = True

    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_DIR + "viewport"


if __name__ == '__main__':
    add_orbit_keyframes()
    configure_render()
    bpy.ops.render.render(animation=True)
