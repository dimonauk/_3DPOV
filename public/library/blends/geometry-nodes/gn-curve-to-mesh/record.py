"""
Holoflow Studio — Viewport Recording Script
GN Curve to Mesh · gn-curve-to-mesh · Blender 5.1

Animates the cable Radius modifier input from thin → thick → thin over
60 frames, demonstrating the live parametric control of Curve to Mesh.
Camera orbits around the cable to show the 3D form.

Output:
    public/library/videos/geometry-nodes/gn-curve-to-mesh/viewport.mp4

Usage:
    1. Run blueprint.py to produce cable_pipe.blend.
    2. Open cable_pipe.blend in Blender.
    3. Open this file in the Scripting workspace.
    4. Adjust OUTPUT_PATH if your clone root differs.
    5. Alt+R to run. Blender renders 60 frames → MP4.
"""

import bpy
import math
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────
OUTPUT_PATH  = "//../../videos/geometry-nodes/gn-curve-to-mesh/viewport.mp4"
OBJECT_NAME  = "cable_pipe"
MODIFIER_ID  = "HoloflowCableCtM"
FRAME_START  = 1
FRAME_END    = 60
FPS          = 24

# Radius (Input_1) animation: thin → thick → thin arc shows GN live control
# Input_1 = first non-Geometry socket (Radius is socket index 1 after Geometry)
RADIUS_KEY = "Input_1"
RADIUS_KEYFRAMES = [
    (1,  0.025),   # default cable thickness
    (20, 0.085),   # grow to chunky pipe
    (40, 0.085),   # hold at maximum
    (60, 0.025),   # shrink back to cable
]

CAMERA_ORBIT_Z_DEG = 60   # total camera sweep over the full animation


# ── Camera setup ───────────────────────────────────────────────────────────────

def setup_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    cam_data = bpy.data.cameras.new(name="RecordCam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new(name="RecordCam", object_data=cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Position the camera so the full cable fits at ~70% frame height
    cam.location = (4.0, -3.5, 1.2)
    cam.rotation_euler = (math.radians(78), 0.0, math.radians(49))
    return cam


def keyframe_orbit(cam: bpy.types.Object, scene: bpy.types.Scene) -> None:
    """Gentle orbit by rotating the camera's Z euler across the clip."""
    import mathutils
    start_z = math.radians(49)
    end_z   = math.radians(49 + CAMERA_ORBIT_Z_DEG)

    scene.frame_set(FRAME_START)
    cam.rotation_euler[2] = start_z
    cam.keyframe_insert(data_path="rotation_euler", index=2)

    scene.frame_set(FRAME_END)
    cam.rotation_euler[2] = end_z
    cam.keyframe_insert(data_path="rotation_euler", index=2)


# ── Modifier animation ─────────────────────────────────────────────────────────

def keyframe_radius(obj: bpy.types.Object, scene: bpy.types.Scene) -> None:
    """
    Drive the Radius GN input (Input_1) via keyframes.
    mod["Input_1"] accesses the first non-Geometry socket by its internal
    identifier — the same label the modifier panel uses for slider storage.
    keyframe_insert with data_path='["Input_1"]' writes the F-curve into
    the modifier's action so the render timeline evaluates it correctly.
    """
    mod = obj.modifiers.get(MODIFIER_ID)
    if mod is None:
        raise RuntimeError(f"Modifier '{MODIFIER_ID}' not found on '{obj.name}'.")

    for frame, value in RADIUS_KEYFRAMES:
        scene.frame_set(frame)
        mod[RADIUS_KEY] = value
        mod.keyframe_insert(data_path=f'["{RADIUS_KEY}"]', frame=frame)


# ── Render settings ────────────────────────────────────────────────────────────

def setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUTPUT_PATH
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = FPS
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    scene = bpy.context.scene
    obj   = bpy.data.objects.get(OBJECT_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJECT_NAME}' not found. Run blueprint.py first.")

    cam = setup_camera(scene)
    keyframe_orbit(cam, scene)
    keyframe_radius(obj, scene)
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print("[record] Render complete →", OUTPUT_PATH)


main()
