"""
record.py — Viewport animation render for gn-sample-curve-track-sleepers
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py.  Animates a slow 360° camera orbit around the sleeper
oval and renders 120 frames (5 s @ 24 fps) to:
  public/library/videos/geometry-nodes/gn-sample-curve-track-sleepers/viewport.mp4

Technique: bpy.ops.render.opengl captures the 3D viewport in EEVEE rather than
invoking a full Cycles render — fast enough to run headlessly in a CI session.
"""

import bpy
import math
import os

OUT_DIR  = "//../../videos/geometry-nodes/gn-sample-curve-track-sleepers/"
OUT_FILE = "viewport"
ORBIT_R  = 13.0    # camera orbit radius (metres)
ORBIT_Z  =  6.5    # camera height above track plane
FRAME_END = 120


def _ensure_dir() -> str:
    blend_dir = bpy.path.abspath("//")
    parts     = [".."] * 2 + ["videos", "geometry-nodes",
                               "gn-sample-curve-track-sleepers"]
    out = os.path.join(blend_dir, *parts)
    os.makedirs(out, exist_ok=True)
    return bpy.path.relpath(out) + "/"


def setup_render(out_dir: str) -> None:
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.render.filepath        = out_dir + OUT_FILE
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.resolution_percentage = 100
    scene.render.fps             = 24
    scene.frame_start            = 1
    scene.frame_end              = FRAME_END


def animate_camera() -> None:
    scene = bpy.context.scene
    cam   = scene.camera
    if cam is None:
        return

    cam.animation_data_clear()
    for fr in range(1, FRAME_END + 1):
        angle = 2 * math.pi * (fr - 1) / FRAME_END
        cam.location.x = ORBIT_R * math.sin(angle)
        cam.location.y = -ORBIT_R * math.cos(angle)
        cam.location.z = ORBIT_Z
        # Point at origin
        dx = -cam.location.x
        dy = -cam.location.y
        dz = -cam.location.z
        horiz = math.sqrt(dx*dx + dy*dy)
        cam.rotation_euler.z = math.atan2(dx, -dy)
        cam.rotation_euler.x = math.pi/2 - math.atan2(dz, -horiz)
        cam.rotation_euler.y = 0.0
        cam.keyframe_insert('location', frame=fr)
        cam.keyframe_insert('rotation_euler', frame=fr)


def main() -> None:
    out_dir = _ensure_dir()
    setup_render(out_dir)
    animate_camera()
    # Viewport render captures EEVEE shading without a full render pipeline.
    # Requires a visible 3D viewport in the Blender window.
    bpy.ops.render.opengl(animation=True)
    print(f"[record] Rendered {FRAME_END} frames → {out_dir}{OUT_FILE}")


if __name__ == '__main__':
    main()
