"""
record.py — Viewport animation render for GN Bake Node — Crystal Spread
Blender 5.1  ·  CC0  ·  Holoflow Studio

Renders frames 1–60 of the crystal activation spread to viewport.mp4.
Run AFTER blueprint.py (which builds the scene and exports a static GLB).
The simulation zone is evaluated frame-by-frame here; no disk bake is
required for this render — the point-cache is built implicitly as frames
advance.

Output: public/library/videos/geometry-nodes/gn-bake-node-simulation-growth/viewport.mp4
"""

import bpy
import os

OUTPUT_PATH = "//../../../../videos/geometry-nodes/gn-bake-node-simulation-growth/viewport"

RENDER_FPS    = 24
RENDER_WIDTH  = 1920
RENDER_HEIGHT = 1080
FRAME_START   = 1
FRAME_END     = 60


def configure_render() -> None:
    sc  = bpy.context.scene
    rd  = sc.render

    rd.engine         = 'BLENDER_EEVEE_NEXT'
    rd.resolution_x   = RENDER_WIDTH
    rd.resolution_y   = RENDER_HEIGHT
    rd.resolution_percentage = 100
    rd.fps            = RENDER_FPS
    rd.image_settings.file_format = 'FFMPEG'
    rd.ffmpeg.format          = 'MPEG4'
    rd.ffmpeg.codec           = 'H264'
    rd.ffmpeg.constant_rate_factor = 'HIGH'
    rd.filepath       = OUTPUT_PATH

    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END

    sc.eevee.use_bloom     = True
    sc.eevee.bloom_threshold = 0.8
    sc.eevee.bloom_radius    = 4.0

    # Camera arc: starts above-right, sweeps to above-front
    cam = bpy.data.cameras.get("Camera")
    if cam is None:
        bpy.ops.object.camera_add(location=(3.5, -3.5, 2.8))
        cam_obj = bpy.context.active_object
    else:
        cam_obj = bpy.data.objects['Camera']
        cam_obj.location = (3.5, -3.5, 2.8)

    cam_obj.rotation_euler = (1.05, 0.0, 0.785)
    sc.camera = cam_obj

    # Gentle orbit: camera sweeps 35° around Z over 60 frames
    cam_obj.keyframe_insert(data_path='rotation_euler', frame=1)
    cam_obj.rotation_euler[2] += 0.61  # 35° in radians
    cam_obj.keyframe_insert(data_path='rotation_euler', frame=FRAME_END)

    # Smooth interpolation
    if cam_obj.animation_data and cam_obj.animation_data.action:
        for fc in cam_obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'

    # World: dark backdrop so cyan activation glows
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or \
         world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.005, 0.005, 0.01, 1.0)
    bg.inputs['Strength'].default_value = 0.0
    sc.world = world

    # Key light: slight warm fill so dormant side is not pitch-black
    key = bpy.data.lights.get("CS_Key") or bpy.data.lights.new("CS_Key", 'AREA')
    key.energy = 40.0
    key.color  = (1.0, 0.95, 0.85)
    key.size   = 2.0
    if "CS_Key" not in bpy.data.objects:
        key_obj = bpy.data.objects.new("CS_Key", key)
        sc.collection.objects.link(key_obj)
    else:
        key_obj = bpy.data.objects["CS_Key"]
    key_obj.location       = (3.0, -2.0, 4.0)
    key_obj.rotation_euler = (0.9, 0.2, 0.8)


def render_animation() -> None:
    configure_render()
    bpy.ops.render.render(animation=True)
    print(f"Rendered to {OUTPUT_PATH}")


if __name__ == "__main__":
    render_animation()
