"""
record.py — Viewport animation capture for FLIP Fluid Mantaflow tutorial.

Prerequisite: blueprint.py has been run and the fluid simulation baked
(Cache Type = ALL, Bake All clicked, progress bar completed).

Output: public/library/videos/physics/physics-flip-fluid-mantaflow-ocean-pour/viewport.mp4

Run from Blender Scripting workspace: open this file → Run Script (Alt+P).
"""

import bpy
import os
import pathlib

# ─── Config ──────────────────────────────────────────────────────────────────
OUTPUT_DIR  = str(
    pathlib.Path(__file__).resolve().parent.parent.parent.parent.parent
    / "public/library/videos/physics/physics-flip-fluid-mantaflow-ocean-pour"
)
START_FRAME = 1
END_FRAME   = 80
FPS         = 24


def configure_output(scene: bpy.types.Scene) -> None:
    """Point the render output at the library videos folder as MP4."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    scene.render.filepath                          = os.path.join(OUTPUT_DIR, "viewport")
    scene.render.image_settings.file_format        = 'FFMPEG'
    scene.render.ffmpeg.format                     = 'MPEG4'
    scene.render.ffmpeg.codec                      = 'H264'
    scene.render.ffmpeg.constant_rate_factor       = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset              = 'GOOD'
    scene.render.fps          = FPS
    scene.frame_start         = START_FRAME
    scene.frame_end           = END_FRAME
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100


def find_3d_area() -> bpy.types.Area:
    """Return the first VIEW_3D area on the current screen."""
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            return area
    raise RuntimeError("No VIEW_3D area found — open a 3D Viewport before running.")


def set_camera_view(area: bpy.types.Area) -> None:
    """Lock the viewport to the scene camera and hide overlays for a clean capture."""
    space = area.spaces.active
    space.region_3d.view_perspective = 'CAMERA'
    space.overlay.show_overlays      = False  # remove gizmos/grid from capture
    space.shading.type               = 'RENDERED'  # full EEVEE shading


def run() -> None:
    scene = bpy.context.scene
    configure_output(scene)

    area = find_3d_area()
    set_camera_view(area)

    # Flush fluid cache to ensure all frames are loaded from disk, not re-simulated
    bpy.context.view_layer.update()

    with bpy.context.temp_override(area=area):
        bpy.ops.render.opengl(animation=True, write_still=False)

    print(f"Viewport capture complete → {OUTPUT_DIR}/viewport.mp4")


if __name__ == "__main__":
    run()
