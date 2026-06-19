"""
record.py — Viewport animation for gn-image-texture-heightmap-terrain
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py has built the scene. Animates the camera in a 60-frame
arc sweeping over the terrain surface — starts from a wide overhead angle and
pushes toward the ridge. Renders using OpenGL (viewport) to
  public/library/videos/geometry-nodes/gn-image-texture-heightmap-terrain/viewport.mp4

Usage inside Blender:
  exec(open('record.py').read())
"""

import bpy
import math

# ── Settings ───────────────────────────────────────────────────────────────────
FRAMES       = 60
FPS          = 24
OUTPUT_PATH  = "//../../videos/geometry-nodes/gn-image-texture-heightmap-terrain/viewport_"
ORBIT_RADIUS = 14.0   # camera distance from terrain centre
START_ELEV   = math.radians(60)   # elevation angle at frame 1
END_ELEV     = math.radians(35)   # dips toward horizon by end
START_AZ     = math.radians(30)   # azimuth at frame 1
END_AZ       = math.radians(90)   # 60° sweep across the ridge


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES
    sc.render.fps  = FPS
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = OUTPUT_PATH


def _animate_camera() -> None:
    cam = bpy.data.objects.get("Cam")
    if cam is None:
        # Fallback: find any camera in the scene
        cams = [o for o in bpy.data.objects if o.type == "CAMERA"]
        if not cams:
            raise RuntimeError("No camera found — run blueprint.py first.")
        cam = cams[0]

    cam.animation_data_clear()

    for f in range(1, FRAMES + 1):
        t   = (f - 1) / (FRAMES - 1)   # 0 → 1

        az  = START_AZ  + (END_AZ  - START_AZ)  * t
        el  = START_ELEV + (END_ELEV - START_ELEV) * t

        # Spherical → Cartesian, terrain centred at origin
        x = ORBIT_RADIUS * math.cos(el) * math.cos(az)
        y = ORBIT_RADIUS * math.cos(el) * math.sin(az)
        z = ORBIT_RADIUS * math.sin(el)

        cam.location = (x, y, z)

        # Point camera at terrain centre (0, 0, HEIGHT_SCALE * 0.5 approx)
        look_target = (0.0, 0.0, 1.25)
        dx, dy, dz = (look_target[i] - cam.location[i] for i in range(3))
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        pitch = math.asin(dz / dist)
        yaw   = math.atan2(dy, dx)
        cam.rotation_euler = (math.pi / 2 - pitch, 0.0, yaw + math.pi / 2)

        cam.keyframe_insert(data_path="location",        frame=f)
        cam.keyframe_insert(data_path="rotation_euler",  frame=f)

    # Set keyframe interpolation to Linear for constant-speed orbit
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def _render() -> None:
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
    print(f"Viewport animation rendered → {OUTPUT_PATH}*.mp4")


if __name__ == "__main__":
    _setup_render()
    _animate_camera()
    _render()
