"""
record.py — EEVEE Next Volumetric Light Cone: viewport animation render
Blender 5.1 · CC0 · Holoflow Studio

Orbits the camera around the scene over 10 s (240 frames @ 24 fps) while
Bloom pulses the spot lights slightly, showing the god-ray cones from all
angles.  Output: public/library/videos/lighting/eevee-next-volumetric-light-cone/viewport.mp4

Run after blueprint.py has generated volumetric_light_cone.blend:
  blender --background volumetric_light_cone.blend --python record.py
"""

import bpy
import math
from mathutils import Vector

# ── parameters ───────────────────────────────────────────────────────────────
FPS          = 24
DURATION_SEC = 10
TOTAL_FRAMES = FPS * DURATION_SEC   # 240

ORBIT_RADIUS = 5.8    # camera distance from scene centre
ORBIT_HEIGHT = 2.4    # camera Z height during orbit
LOOK_TARGET  = Vector((0.0, 0.0, 0.9))  # orbit focus (top of pedestal)

# Light energy pulse: gentle 15% swell over 120 frames then back
PULSE_BASE_A  = 2800.0
PULSE_BASE_B  = 2200.0
PULSE_PEAK_A  = 3200.0
PULSE_PEAK_B  = 2500.0

OUTPUT_DIR = "//../../videos/lighting/eevee-next-volumetric-light-cone/"


def add_orbit_keyframes():
    scene = bpy.context.scene
    cam = scene.camera
    if cam is None:
        raise RuntimeError("No camera in scene — run blueprint.py first.")

    scene.frame_start = 1
    scene.frame_end = TOTAL_FRAMES

    for frame in range(1, TOTAL_FRAMES + 1):
        t = (frame - 1) / (TOTAL_FRAMES - 1)        # 0 → 1
        angle = -math.pi * 0.5 + t * math.pi * 2.0  # full 360°
        x = ORBIT_RADIUS * math.cos(angle)
        y = ORBIT_RADIUS * math.sin(angle)
        cam.location = Vector((x, y, ORBIT_HEIGHT))
        direction = (LOOK_TARGET - cam.location).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location', frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # Linear interpolation — no ease-in/out on a continuous orbit
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def add_light_pulse_keyframes():
    """Amber light swells to peak at frame 60, back by frame 120; teal mirrors."""
    for (name, base, peak) in (
        ('spot_amber', PULSE_BASE_A, PULSE_PEAK_A),
        ('spot_teal',  PULSE_BASE_B, PULSE_PEAK_B),
    ):
        obj = bpy.data.objects.get(name)
        if obj is None:
            continue
        ld = obj.data
        for frame, energy in ((1, base), (60, peak), (120, base),
                              (180, peak), (240, base)):
            ld.energy = energy
            ld.keyframe_insert('energy', frame=frame)
        for fc in ld.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = FPS
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_DIR + "viewport"


if __name__ == '__main__':
    add_orbit_keyframes()
    add_light_pulse_keyframes()
    configure_render()
    bpy.ops.render.render(animation=True)
