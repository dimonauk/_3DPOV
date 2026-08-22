"""
record.py — viewport render of the BZ Oregonator spiral-wave tutorial
Blender 5.1  |  CC0

Renders frames 0–180 of the Simulation Zone playback to:
    public/library/videos/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves/viewport.mp4

Must be run AFTER blueprint.py has built the scene (run main() first).
Output: 1920×1080, 30 fps, H.264 MP4, EEVEE Next, no audio.

The 180-frame span is chosen to capture:
    0–30    : seeding / wavefront nucleation
    30–80   : first spiral arms form and tighten
    80–180  : mature rotating spirals carpet the grid
"""

import bpy
import os

OUT_DIR  = "public/library/videos/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves"
OUT_FILE = "viewport.mp4"
FRAME_START = 0
FRAME_END   = 180
FPS         = 30


def setup_render():
    scene = bpy.context.scene
    render = scene.render

    render.engine          = 'BLENDER_EEVEE_NEXT'
    render.resolution_x    = 1920
    render.resolution_y    = 1080
    render.resolution_percentage = 100
    render.fps             = FPS
    render.image_settings.file_format   = 'FFMPEG'
    render.ffmpeg.format                = 'MPEG4'
    render.ffmpeg.codec                 = 'H264'
    render.ffmpeg.constant_rate_factor  = 'MEDIUM'
    render.ffmpeg.audio_codec           = 'NONE'

    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    abs_out = os.path.join(bpy.path.abspath("//"), OUT_DIR)
    os.makedirs(abs_out, exist_ok=True)
    render.filepath = os.path.join(abs_out, OUT_FILE)


def setup_camera():
    """Isometric-ish top-down camera at 45° elevation, centred on the grid."""
    bpy.ops.object.camera_add(
        location=(0, -5.5, 5.5),
        rotation=(0.785398, 0, 0)   # 45° X-tilt
    )
    cam = bpy.context.active_object
    cam.name = "HF_BZ_Cam"
    cam.data.type = 'PERSP'
    cam.data.lens = 50
    bpy.context.scene.camera = cam


def setup_lighting():
    """Single area light overhead for even emission visibility."""
    bpy.ops.object.light_add(
        type='AREA', location=(0, 0, 8)
    )
    light = bpy.context.active_object
    light.data.energy = 200
    light.data.size   = 10


def setup_world():
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("HF_BZ_World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value   = (0.003, 0.003, 0.01, 1.0)
        bg.inputs["Strength"].default_value = 0.0


def main():
    setup_camera()
    setup_lighting()
    setup_world()
    setup_render()

    print("[record.py] Starting BZ animation render …")
    bpy.ops.render.render(animation=True)
    print(f"[record.py] Done → {bpy.context.scene.render.filepath}")


if __name__ == "__main__":
    main()
