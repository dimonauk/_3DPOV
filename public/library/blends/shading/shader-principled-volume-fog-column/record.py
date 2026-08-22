"""
record.py — Viewport orbit animation for fog_column tutorial.
Output: public/library/videos/shading/shader-principled-volume-fog-column/viewport.mp4

Run AFTER blueprint.py in the same Blender 5.1 session.
Camera orbits 216° around the fog column while the Spot Light god-ray is visible.
Duration: 6 s @ 24 fps = 144 frames.  Resolution: 1280 × 720.
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────

OUTPUT_RELATIVE = "//../../../../../../public/library/videos/shading/shader-principled-volume-fog-column/viewport.mp4"
FPS             = 24
DURATION_S      = 6
ORBIT_R         = 4.5     # m from origin
ORBIT_BASE_H    = 1.8     # m base camera height
ORBIT_BOB       = 0.8     # m gentle vertical oscillation amplitude
TARGET_Z        = 2.0     # m — look-at point (column centre, 2 m up)
ORBIT_SWEEP     = 0.6     # fraction of full circle (0.6 = 216°)

# ── Animation ─────────────────────────────────────────────────────────────────

def animate_orbit():
    cam = bpy.data.objects.get("main_camera")
    if cam is None:
        raise RuntimeError("Run blueprint.py first — 'main_camera' not found.")

    # Remove Track To so we drive rotation manually per keyframe
    for c in list(cam.constraints):
        cam.constraints.remove(c)
    cam.animation_data_clear()

    total = FPS * DURATION_S
    for f in range(total + 1):
        t     = f / total
        angle = t * 2 * math.pi * ORBIT_SWEEP - math.pi / 6
        x     = ORBIT_R * math.cos(angle)
        y     = ORBIT_R * math.sin(angle)
        z     = ORBIT_BASE_H + math.sin(t * math.pi) * ORBIT_BOB

        cam.location = (x, y, z)
        cam.keyframe_insert('location', frame=f)

        # Point at TARGET_Z on world Z axis
        dx, dy, dz = -x, -y, TARGET_Z - z
        dist  = math.sqrt(dx*dx + dy*dy + dz*dz)
        pitch = math.asin(dz / dist)
        yaw   = math.atan2(dy, dx) + math.pi
        cam.rotation_euler = (math.pi / 2 - pitch, 0, yaw)
        cam.keyframe_insert('rotation_euler', frame=f)

    # Smooth Bezier on all curves
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'


def setup_render(scene: bpy.types.Scene):
    scene.render.fps         = FPS
    scene.frame_start        = 0
    scene.frame_end          = FPS * DURATION_S
    scene.render.image_settings.file_format       = 'FFMPEG'
    scene.render.ffmpeg.format                    = 'MPEG4'
    scene.render.ffmpeg.codec                     = 'H264'
    scene.render.ffmpeg.constant_rate_factor      = 'HIGH'
    scene.render.resolution_x                     = 1280
    scene.render.resolution_y                     = 720
    scene.render.resolution_percentage            = 100

    abs_path = bpy.path.abspath(OUTPUT_RELATIVE)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    scene.render.filepath = OUTPUT_RELATIVE


def main():
    scene = bpy.context.scene
    animate_orbit()
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print(f"[record] Orbit animation rendered → {bpy.path.abspath(OUTPUT_RELATIVE)}")


main()
