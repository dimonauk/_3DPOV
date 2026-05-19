"""
Viewport Recording — Geometry Nodes: Low-Poly Faceted Rock
===========================================================
Renders a 5-second, 30-fps OpenGL viewport animation that spins the rock
360° under a key light. No full Cycles/EEVEE render — this is the quick
thumbnail / preview clip for the library card.

Outputs to:
  public/library/videos/geometry/low-poly-faceted-rock/viewport.mp4

Run AFTER blueprint.py has been executed in the same session:
  1. Run blueprint.py  (Alt+P in the Text Editor)
  2. Run record.py     (Alt+P again)

Or chain them from a shell script that invokes Blender headless.
"""

import bpy
import math

# ── parameters ────────────────────────────────────────────────────────────────
FRAMES      = 150    # 5 seconds at 30fps: one full rotation
FPS         = 30
OUTPUT_PATH = "//../../videos/geometry/low-poly-faceted-rock/viewport.mp4"
RES_X, RES_Y = 1280, 720
CAM_DIST    = 3.5    # distance of camera from origin
CAM_ELEV    = 0.40   # elevation in radians above the equator
KEY_ENERGY  = 4.0    # sun lamp energy
# ──────────────────────────────────────────────────────────────────────────────


def setup_scene_output() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES
    scene.render.fps  = FPS
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_PATH


def place_camera() -> bpy.types.Object:
    """
    Position a camera at (0, -CAM_DIST, height) looking at the origin.
    We tilt slightly down so the rock reads from a three-quarter view —
    the angle that shows off the facets most clearly.
    """
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)

    height = CAM_DIST * math.sin(CAM_ELEV)
    horiz  = CAM_DIST * math.cos(CAM_ELEV)
    cam_obj.location      = (0.0, -horiz, height)
    cam_obj.rotation_euler = (math.pi / 2 - CAM_ELEV, 0.0, 0.0)

    bpy.context.scene.camera = cam_obj
    return cam_obj


def place_key_light() -> None:
    """Single sun lamp from upper-left. Raking angle pops facet edges."""
    light_data = bpy.data.lights.new("KeyLight", 'SUN')
    light_obj  = bpy.data.objects.new("KeyLight", light_data)
    bpy.context.collection.objects.link(light_obj)
    light_data.energy      = KEY_ENERGY
    # 45° elevation, 30° to the left — the classic 'key' position
    light_obj.rotation_euler = (math.radians(45), math.radians(-30), 0.0)


def set_world_colour() -> None:
    """Mid-dark grey background so the rock silhouette reads clearly."""
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[0].default_value = (
        0.08, 0.08, 0.10, 1.0
    )


def animate_rock(obj: bpy.types.Object) -> None:
    """
    One full Z-rotation over FRAMES frames, linear interpolation.
    We keep the small X tilt constant so the three-quarter view is stable.
    """
    obj.rotation_euler = (0.25, 0.0, 0.0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0.25, 0.0, math.tau)   # tau = 2π = full turn
    obj.keyframe_insert("rotation_euler", frame=FRAMES)

    # Force linear — no ease-in/ease-out on a looping spin
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


if __name__ == "__main__":
    rock = bpy.data.objects.get("rock_faceted")
    if rock is None:
        raise RuntimeError(
            "rock_faceted not found. Run blueprint.py in this session first."
        )

    setup_scene_output()
    place_camera()
    place_key_light()
    set_world_colour()
    animate_rock(rock)

    # opengl=True renders the 3D viewport, not the full Cycles/EEVEE engine.
    # Fast enough for a thumbnail; Cycles would add minutes for no benefit here.
    bpy.ops.render.opengl(animation=True)
    print(f"[record] Viewport animation written → {OUTPUT_PATH}")
