"""
record.py — Mantaflow Dam Break: orbiting Cycles render
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER baking the simulation (Physics → Fluid → Bake All in the UI):
  blender --background dam_break.blend --python record.py

Orbits the camera 130° from a left-front quarter to a right-front quarter
over 120 frames.  This arc reveals the full collapse sequence: left water
column, centre step impact, right overflow — all in one continuous pull.

Output: public/library/videos/physics/physics-mantaflow-liquid-dam-break/viewport.mp4
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FPS          = 24
TOTAL_FRAMES = 120

ORBIT_RADIUS = 3.8
ORBIT_HEIGHT = 0.85
LOOK_TARGET  = Vector((0.05, 0.0, 0.55))
# Arc from left-front to right-front (130° sweep, not full 360°)
ORBIT_START  = math.radians(-115)
ORBIT_END    = math.radians(15)

OUTPUT_DIR   = "//../../videos/physics/physics-mantaflow-liquid-dam-break/"


# ── Camera orbit keyframes ─────────────────────────────────────────────────────
def add_orbit_keyframes() -> None:
    scene = bpy.context.scene
    cam   = scene.camera
    if cam is None:
        raise RuntimeError("No camera in scene — run blueprint.py first.")

    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    for frame in range(1, TOTAL_FRAMES + 1):
        t     = (frame - 1) / (TOTAL_FRAMES - 1)   # 0.0 → 1.0
        angle = ORBIT_START + t * (ORBIT_END - ORBIT_START)
        x     = ORBIT_RADIUS * math.sin(angle)
        y     = ORBIT_RADIUS * math.cos(angle)
        cam.location      = Vector((x, y, ORBIT_HEIGHT))
        direction         = (LOOK_TARGET - cam.location).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # Linear interpolation: smooth constant-speed arc, no ease-in/out wobble
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


# ── Render configuration ───────────────────────────────────────────────────────
def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine              = 'CYCLES'
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.fps                 = FPS
    scene.cycles.samples             = 64     # preview quality; raise to 256 for final
    scene.cycles.use_denoising       = True   # Intel/NVidia OIDN denoiser
    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath            = OUTPUT_DIR + "viewport"


if __name__ == '__main__':
    add_orbit_keyframes()
    configure_render()
    bpy.ops.render.render(animation=True)
