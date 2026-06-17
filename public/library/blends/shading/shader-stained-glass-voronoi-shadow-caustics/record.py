"""
record.py — Viewport animation for shader-stained-glass-voronoi-shadow-caustics
Output: public/library/videos/shading/shader-stained-glass-voronoi-shadow-caustics/viewport.mp4

Animation sequence (8 seconds at 30 fps = 240 frames):
  F001–F090  Camera dolly: push in from 4 m → 2.2 m, showing the full stained-glass
             pattern with lead lines and per-cell colour variation.
  F091–F180  Sun slow-orbit: rotate Sun_Caustic 120° around Z at constant speed,
             shifting the caustic projection across the floor and changing which glass
             cells are lit from behind.  This is the key technique demo — the caustic
             pattern follows the sun.
  F181–F240  Camera pull back to start position; holds on final frame.

Run AFTER blueprint.py has populated the scene.
"""

import math
import os
import bpy

OUTPUT_DIR  = "//../../../../videos/shading/shader-stained-glass-voronoi-shadow-caustics/"
OUTPUT_FILE = OUTPUT_DIR + "viewport"
FPS         = 30
FRAME_END   = 240


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine                      = 'BLENDER_EEVEE_NEXT'
    sc.eevee.use_shadows                  = True
    sc.render.filepath                    = OUTPUT_FILE
    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format               = 'MPEG4'
    sc.render.ffmpeg.codec                = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.fps                         = FPS
    sc.frame_start                        = 1
    sc.frame_end                          = FRAME_END
    sc.render.resolution_x                = 1920
    sc.render.resolution_y                = 1080


def keyframe_camera_dolly() -> None:
    """Push in toward panel, then pull back."""
    cam = bpy.data.objects.get("Camera")
    if cam is None:
        return

    def kf(frame: int, y: float) -> None:
        cam.location.y = y
        cam.keyframe_insert("location", frame=frame)

    kf(1,   -4.0)   # start: 4 m from panel
    kf(90,  -2.2)   # close: 2.2 m — fills frame with glass detail
    kf(180, -2.2)   # hold during sun orbit
    kf(240, -4.0)   # pull back

    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            if "location" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'
                    kp.handle_left_type  = 'AUTO_CLAMPED'
                    kp.handle_right_type = 'AUTO_CLAMPED'


def keyframe_sun_orbit() -> None:
    """
    Rotate sun around Z by 120° over F90–F180.
    This shifts the direction of back-lit illumination, making the caustic
    pattern on the floor visibly migrate — the essential technique demonstration.
    """
    sun = bpy.data.objects.get("Sun_Caustic")
    if sun is None:
        return

    base_z = math.radians(-25)

    def kf(frame: int, extra_z: float) -> None:
        sun.rotation_euler[2] = base_z + extra_z
        sun.keyframe_insert("rotation_euler", frame=frame)

    kf(1,   0)
    kf(90,  0)                          # hold during camera dolly
    kf(180, math.radians(120))          # rotate 120° over F90–F180
    kf(240, math.radians(120))          # hold through camera pull-back

    if sun.animation_data and sun.animation_data.action:
        for fc in sun.animation_data.action.fcurves:
            if "rotation_euler" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def ensure_output_dir() -> None:
    abs_path = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(abs_path, exist_ok=True)


def main() -> None:
    setup_render()
    keyframe_camera_dolly()
    keyframe_sun_orbit()
    ensure_output_dir()
    bpy.ops.render.render(animation=True)
    print(f"record.py: {FRAME_END} frames rendered → {OUTPUT_FILE}.mp4")


if __name__ == "__main__":
    main()
