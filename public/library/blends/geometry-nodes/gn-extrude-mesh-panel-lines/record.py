"""
Holoflow Studio — Viewport Recording Script
GN Extrude Mesh Panel Lines · gn-extrude-mesh-panel-lines · Blender 5.1

Animates the Panel Depth modifier input from 0.0 (flat) to -0.07 (deep recess)
and back over 60 frames. A gentle camera arc shows the 3-D panel geometry.
The Panel Inset is also animated to appear half-way through, revealing the
chamfer step as a distinct second beat.

Output:
    public/library/videos/geometry-nodes/gn-extrude-mesh-panel-lines/viewport.mp4

Usage:
    1. Run blueprint.py to produce panel_lines.blend.
    2. Open panel_lines.blend in Blender.
    3. Open this file in the Scripting workspace.
    4. Adjust OUTPUT_PATH if your clone root differs.
    5. Alt+R to run. Blender renders 60 frames → MP4.
"""

import bpy
import math
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────
OUTPUT_PATH   = "//../../videos/geometry-nodes/gn-extrude-mesh-panel-lines/viewport.mp4"
OBJECT_NAME   = "panel_wall"
MODIFIER_ID   = "HoloflowPanelLines"
FRAME_START   = 1
FRAME_END     = 60
FPS           = 24

# Panel Depth (Input_1) animation: flat → deep → flat
DEPTH_KEY = "Input_1"
DEPTH_KEYFRAMES = [
    (1,  0.000),   # start flat
    (20, -0.070),  # recess fully to demonstrate depth
    (40, -0.070),  # hold at maximum depth
    (60,  0.000),  # return to flat
]

# Panel Inset (Input_2) animation: no chamfer → full chamfer
# Starts animating at frame 25 to create a distinct second visual beat
INSET_KEY = "Input_2"
INSET_KEYFRAMES = [
    (1,  1.000),   # no chamfer (scale = 1.0 = no change)
    (25, 1.000),   # still no chamfer
    (45, 0.820),   # chamfer appears
    (60, 0.820),   # hold chamfered state
]

CAMERA_TILT_DEG = 35  # camera Z-rotation sweep over full clip


# ── Camera ────────────────────────────────────────────────────────────────────

def setup_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    cam_data = bpy.data.cameras.new(name="RecordCam")
    cam_data.lens = 45.0
    cam = bpy.data.objects.new(name="RecordCam", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (2.2, -2.2, 2.0)
    cam.rotation_euler = (math.radians(55), 0.0, math.radians(45))
    return cam


def keyframe_camera_orbit(cam: bpy.types.Object, scene: bpy.types.Scene) -> None:
    start_z = math.radians(45)
    end_z   = math.radians(45 + CAMERA_TILT_DEG)
    scene.frame_set(FRAME_START)
    cam.rotation_euler[2] = start_z
    cam.keyframe_insert(data_path="rotation_euler", index=2)
    scene.frame_set(FRAME_END)
    cam.rotation_euler[2] = end_z
    cam.keyframe_insert(data_path="rotation_euler", index=2)


# ── Modifier animation ─────────────────────────────────────────────────────────

def keyframe_modifier_input(
    obj: bpy.types.Object,
    scene: bpy.types.Scene,
    input_key: str,
    keyframes: list[tuple[int, float]],
) -> None:
    """
    Drive a GN modifier float input via keyframes.

    mod["Input_N"] accesses the live modifier value dict.
    data_path='["Input_N"]' writes the F-curve in bracket-index notation,
    which is required because the inputs are dict entries, not named
    object attributes. Standard dotted data_path syntax does not work here.
    """
    mod = obj.modifiers.get(MODIFIER_ID)
    if mod is None:
        raise RuntimeError(f"Modifier '{MODIFIER_ID}' not found on '{obj.name}'.")
    for frame, value in keyframes:
        scene.frame_set(frame)
        mod[input_key] = value
        mod.keyframe_insert(data_path=f'["{input_key}"]', frame=frame)


# ── Render settings ────────────────────────────────────────────────────────────

def setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine                         = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format     = "FFMPEG"
    scene.render.ffmpeg.format                  = "MPEG4"
    scene.render.ffmpeg.codec                   = "H264"
    scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
    scene.render.filepath                       = OUTPUT_PATH
    scene.render.resolution_x                  = 1920
    scene.render.resolution_y                  = 1080
    scene.render.fps                            = FPS
    scene.frame_start                           = FRAME_START
    scene.frame_end                             = FRAME_END


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    scene = bpy.context.scene
    obj   = bpy.data.objects.get(OBJECT_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJECT_NAME}' not found. Run blueprint.py first.")

    cam = setup_camera(scene)
    keyframe_camera_orbit(cam, scene)
    keyframe_modifier_input(obj, scene, DEPTH_KEY, DEPTH_KEYFRAMES)
    keyframe_modifier_input(obj, scene, INSET_KEY, INSET_KEYFRAMES)
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print("[record] Render complete →", OUTPUT_PATH)


main()
