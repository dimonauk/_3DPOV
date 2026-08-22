#!/usr/bin/env python3
"""
record.py — viewport animation for gn-sample-index-echo-grid (Blender 5.1)
Holoflow Studio | CC0 | 2026-06-02

Animates the Echo Scale group socket from 0 → 1 → 0 over 120 frames so the
interference pattern builds up and fades back to the base noise, demonstrating
the destructive / constructive transition.  Renders 5 s @ 24 fps to:
  public/library/videos/geometry-nodes/gn-sample-index-echo-grid/viewport.mp4

Run from the terminal:
  blender --background echo_grid.blend --python record.py

Requires: blueprint.py has already been run and echo_grid.blend exists.
"""

import bpy
import math
import os

# ── Output path ───────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", "..", ".."))
OUTPUT_DIR  = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "geometry-nodes", "gn-sample-index-echo-grid",
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport")

FRAME_START = 1
FRAME_END   = 120   # 5 s @ 24 fps
FPS         = 24
RESOLUTION  = (1920, 1080)

# GN modifier socket identifier for Echo Scale (second INPUT socket created)
ECHO_KEY    = "Input_2"


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine           = "BLENDER_EEVEE_NEXT"
    scene.render.fps              = FPS
    scene.frame_start             = FRAME_START
    scene.frame_end               = FRAME_END
    scene.render.resolution_x     = RESOLUTION[0]
    scene.render.resolution_y     = RESOLUTION[1]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format    = "MPEG4"
    scene.render.ffmpeg.codec     = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath         = OUTPUT_FILE

    # Simple 3-point light rig
    def add_light(name, loc, energy, light_type="AREA"):
        bpy.ops.object.light_add(type=light_type, location=loc)
        light = bpy.context.active_object
        light.name = name
        light.data.energy = energy
        return light

    add_light("KeyLight",  ( 4.0,  -4.0,  6.0), 800)
    add_light("FillLight", (-4.0,   2.0,  3.0), 200)
    add_light("RimLight",  ( 0.0,   5.0,  2.0), 150)


def keyframe_echo_scale() -> None:
    """Sweep Echo Scale 0 → 1 → 0 over the animation, then back."""
    grid = bpy.data.objects.get("EchoGrid")
    if grid is None:
        raise RuntimeError("EchoGrid object not found — run blueprint.py first.")

    mod = grid.modifiers.get("GNEchoGrid")
    if mod is None:
        raise RuntimeError("GNEchoGrid modifier not found on EchoGrid.")

    keyframes = [
        (1,   0.00),   # start flat
        (30,  0.40),   # echo starts building
        (60,  1.00),   # full interference
        (90,  0.40),   # subsiding
        (120, 0.00),   # back to base noise
    ]
    for frame, value in keyframes:
        bpy.context.scene.frame_set(frame)
        mod[ECHO_KEY] = value
        mod.keyframe_insert(data_path=f'["{ECHO_KEY}"]', frame=frame)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    setup_render()
    keyframe_echo_scale()

    # Slow camera orbit — gentle 45° arc over the animation
    cam = bpy.context.scene.camera
    if cam:
        cam.rotation_euler = (math.radians(52), 0, math.radians(45))
        cam.keyframe_insert("rotation_euler", frame=1)
        cam.rotation_euler = (math.radians(48), 0, math.radians(70))
        cam.keyframe_insert("rotation_euler", frame=120)

    bpy.context.scene.frame_set(1)
    bpy.ops.render.render(animation=True)
    print("✓ Viewport animation rendered →", OUTPUT_FILE + ".mp4")


if __name__ == "__main__":
    main()
