"""
record.py — Viewport animation for the Parametric Bead Necklace.
Blender 5.1  |  CC0  |  Holoflow Studio

Run AFTER blueprint.py.  The camera orbits 140° around the necklace over
90 frames (3 s at 30 fps) while the necklace ring rotates 90° in the
same direction, giving a parallax reveal that exposes the bead alignment
and string thickness from multiple angles.  Output: viewport.mp4.

Usage (headless):
  blender --background bead_necklace.blend --python record.py
"""

import bpy
import math
import os

OUT_DIR  = "//../../videos/geometry-nodes/gn-curve-to-points-bead-necklace-instance-align/"
OUT_FILE = OUT_DIR + "viewport"
FPS      = 30
FRAMES   = 90          # 3 s

CAM_RADIUS = 4.8
CAM_TILT   = math.radians(22)        # elevation above equator

# Camera sweeps from -70° to +70° (140° total arc)
CAM_START  = math.radians(-70)
CAM_END    = math.radians(70)

# Necklace path rotates 90° to show underside bead alignment
PATH_ROT_DEG = 90


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine            = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x      = 1920
    sc.render.resolution_y      = 1080
    sc.render.fps               = FPS
    sc.frame_start              = 1
    sc.frame_end                = FRAMES
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format     = 'MPEG4'
    sc.render.ffmpeg.codec      = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath          = bpy.path.abspath(OUT_FILE)
    sc.eevee.taa_render_samples = 64
    sc.eevee.use_gtao            = True


def animate_camera() -> None:
    cam = bpy.data.objects.get("Camera")
    if cam is None:
        return

    cam.animation_data_create()
    action = bpy.data.actions.new("CamOrbit")
    cam.animation_data.action = action

    for f in range(FRAMES + 1):
        t     = f / FRAMES
        angle = CAM_START + (CAM_END - CAM_START) * t
        x     = CAM_RADIUS * math.sin(angle)
        y     = -CAM_RADIUS * math.cos(angle) * math.cos(CAM_TILT)
        z     = CAM_RADIUS * math.sin(CAM_TILT)

        cam.location = (x, y, z)
        dx, dy, dz = -x, -y, -z
        pitch = math.atan2(dz, math.sqrt(dx*dx + dy*dy))
        yaw   = math.atan2(dx, -dy)
        cam.rotation_euler = (math.pi/2 - pitch, 0, yaw)

        frame = f + 1
        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)


def animate_necklace() -> None:
    path = bpy.data.objects.get("NecklacePath")
    if path is None:
        return

    path.rotation_euler = (0, 0, 0)
    path.keyframe_insert('rotation_euler', frame=1)
    path.rotation_euler = (0, 0, math.radians(PATH_ROT_DEG))
    path.keyframe_insert('rotation_euler', frame=FRAMES)

    if path.animation_data and path.animation_data.action:
        for fc in path.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def ensure_output_dir() -> None:
    abs_path = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_path, exist_ok=True)


if __name__ == "__main__":
    setup_render()
    animate_camera()
    animate_necklace()
    ensure_output_dir()
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 → {bpy.path.abspath(OUT_FILE)}.mp4")
