"""
record.py — Viewport animation for Python Batch GLB Exporter tutorial
Blender 5.1  ·  CC0  ·  Holoflow Studio

Renders a 90-frame turntable over the three demo collections with a
progressive-reveal keyframe animation: each collection fades in during
a dedicated time window, then all objects hold visible for the orbit.

Output: public/library/videos/scripting/python-batch-glb-exporter/viewport.mp4
Run in Blender with the demo scene already built (run blueprint.py first).
"""

import bpy
import math
import os

# ── Config ────────────────────────────────────────────────────────────────────
FRAME_TOTAL  = 90
OUTPUT_PATH  = "//../../../../videos/scripting/python-batch-glb-exporter/viewport"
RESOLUTION_X = 1280
RESOLUTION_Y = 720
FPS          = 30


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_TOTAL
    scene.render.fps  = FPS
    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_PATH

    # EEVEE Next — fast preview render
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 16


def add_camera_and_light() -> bpy.types.Object:
    scene = bpy.context.scene

    # Camera on an orbit Empty
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.55))
    pivot = bpy.context.active_object
    pivot.name = "cam_pivot"

    bpy.ops.object.camera_add(location=(0, -3.2, 1.1))
    cam = bpy.context.active_object
    cam.name = "render_cam"
    cam.data.lens = 50

    # Parent camera to pivot for orbit animation
    cam.parent = pivot
    cam.matrix_parent_inverse = pivot.matrix_world.inverted()

    # Point camera at pivot (origin)
    ct = cam.constraints.new(type='TRACK_TO')
    ct.target       = pivot
    ct.track_axis   = 'TRACK_NEGATIVE_Z'
    ct.up_axis      = 'UP_Y'

    scene.camera = cam

    # One-point key light
    bpy.ops.object.light_add(type='SUN', location=(3, -2, 5))
    sun = bpy.context.active_object
    sun.name = "key_sun"
    sun.data.energy = 3.5
    sun.data.angle  = math.radians(5)

    return pivot


def keyframe_orbit(pivot: bpy.types.Object) -> None:
    """360-degree orbit over FRAME_TOTAL frames via Z rotation keyframes."""
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert(data_path='rotation_euler', frame=1)
    pivot.rotation_euler = (0, 0, math.radians(360))
    pivot.keyframe_insert(data_path='rotation_euler', frame=FRAME_TOTAL)

    # Linear interpolation for constant orbit speed
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def keyframe_collection_reveal() -> None:
    """
    Animate collection visibility: each collection appears at staggered frames.
      arch_column : visible from frame 1
      gem_cluster : appears at frame 20
      cable_bundle: appears at frame 40
    Each collection's objects are hidden for a window then revealed.
    """
    windows = {
        "HF_EXPORT_arch_column" : 1,
        "HF_EXPORT_gem_cluster" : 20,
        "HF_EXPORT_cable_bundle": 40,
    }

    for col_name, reveal_frame in windows.items():
        col = bpy.data.collections.get(col_name)
        if col is None:
            continue
        for obj in col.all_objects:
            if obj.type not in {'MESH', 'CURVE'}:
                continue
            # Hidden before reveal
            obj.hide_viewport = True
            obj.keyframe_insert(data_path='hide_viewport', frame=1)

            # Visible from reveal_frame onward
            obj.hide_viewport = True
            obj.keyframe_insert(data_path='hide_viewport', frame=reveal_frame - 1)
            obj.hide_viewport = False
            obj.keyframe_insert(data_path='hide_viewport', frame=reveal_frame)

            # Constant interpolation — snap, not blend
            if obj.animation_data and obj.animation_data.action:
                for fc in obj.animation_data.action.fcurves:
                    if 'hide_viewport' in fc.data_path:
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'CONSTANT'


def main() -> None:
    scene = bpy.context.scene
    setup_render()

    # Ensure output directory exists
    out_dir = os.path.dirname(bpy.path.abspath(OUTPUT_PATH + ".mp4"))
    os.makedirs(out_dir, exist_ok=True)

    pivot = add_camera_and_light()
    keyframe_orbit(pivot)
    keyframe_collection_reveal()

    # Render to file
    bpy.ops.render.render(animation=True)
    print("[record.py] Viewport render complete →", OUTPUT_PATH + ".mp4")


main()
