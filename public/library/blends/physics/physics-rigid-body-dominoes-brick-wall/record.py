"""
record.py — Rigid Body Dominoes + Brick Wall: side-tracking EEVEE render
Blender 5.1  ·  CC0  ·  Holoflow Studio

Usage:
  1. Open domino_chain.blend in Blender UI.
  2. Scene Properties → Rigid Body World → Cache → Bake All.
     (Baking takes ~20–60 s for 120 frames at SUBSTEPS=20.)
  3. From a terminal:
       blender --background domino_chain.blend --python record.py
  4. Output lands at:
       public/library/videos/physics/physics-rigid-body-dominoes-brick-wall/viewport.mp4

Camera motion: starts wide on the first domino, tracks right as the chain
propagates, arriving at the brick wall just before impact.  A linear track
covers the full chain length in one continuous read — no cuts.  15 s total
at 24 fps = 360 frames, but the physics run to frame 120 so the camera covers
that window at a gentle 1× speed then holds on the wall rubble for frames 100–120.
"""

import bpy
import math
from mathutils import Vector

# ── Constants (must match blueprint.py values) ────────────────────────────────
FPS           = 24
TOTAL_FRAMES  = 120
DOM_SPACING   = 0.068
DOM_COUNT     = 16
WALL_DIST     = DOM_SPACING * DOM_COUNT + 0.04

OUTPUT_PATH = "//../../videos/physics/physics-rigid-body-dominoes-brick-wall/viewport.mp4"

TRACK_Y     = -1.80   # camera lateral position (same as blueprint)
TRACK_Z     =  0.22   # camera height

# Frame 1:  camera left, focussed on first domino
# Frame 80: camera arrived past wall, full collapse in view
# Frame 120: hold on rubble
TRACK_X_START = -0.15
TRACK_X_END   = WALL_DIST + 0.30


def setup_camera_track() -> None:
    scene = bpy.context.scene
    cam   = scene.camera
    if cam is None:
        raise RuntimeError("No camera found — run blueprint.py first.")

    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    # Two keyframes: frame 1 at chain start, frame 80 past wall.
    # Blender interpolates linearly between them.
    for frame, x_pos in [(1, TRACK_X_START), (80, TRACK_X_END), (120, TRACK_X_END)]:
        look_at = Vector((x_pos, 0.0, 0.08))
        cam.location = Vector((x_pos, TRACK_Y, TRACK_Z))
        cam.rotation_euler = (look_at - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    # Force LINEAR interpolation so the track is constant speed.
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.fps          = FPS

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath        = OUTPUT_PATH


def main() -> None:
    setup_camera_track()
    configure_render()
    # OpenGL viewport render — fast EEVEE real-time shading, no full ray-trace cost.
    # The rigid body cache drives geometry positions; no extra physics step here.
    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"Viewport render complete → {OUTPUT_PATH}")


main()
