"""
record.py — viewport animation render for the Alembic VAT tutorial.
Blender 5.1  ·  Holoflow Studio  ·  CC0

Outputs: public/library/videos/scripting/python-alembic-mesh-sequence-cache-vat-webxr/viewport.mp4

Run AFTER blueprint.py has built and imported WaveGrid_vat.  The render
shows the Mesh Sequence Cache-driven wave animation from a 45° top-down
angle, with Workbench studio lighting so the wave displacement reads
clearly against a dark background.
"""

import os
import bpy

OUTPUT_PATH = "//public/library/videos/scripting/python-alembic-mesh-sequence-cache-vat-webxr/viewport.mp4"
RESOLUTION  = (1920, 1080)
FPS         = 30
N_FRAMES    = 32   # must match blueprint.py N_FRAMES


def ensure_output_dir() -> None:
    out_dir = os.path.dirname(bpy.path.abspath(OUTPUT_PATH))
    os.makedirs(out_dir, exist_ok=True)


def setup_camera(scene: bpy.types.Scene) -> None:
    bpy.ops.object.camera_add(location=(0.0, -2.0, 1.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.05, 0.0, 0.0)   # ~60° tilt
    cam.data.lens = 50
    scene.camera = cam


def add_lighting() -> None:
    """Single area lamp, angled to show the wave relief."""
    bpy.ops.object.light_add(
        type='AREA',
        location=(1.2, -0.8, 2.0),
    )
    lamp = bpy.context.active_object
    lamp.data.energy  = 80.0
    lamp.data.size    = 0.5
    lamp.rotation_euler = (0.6, 0.0, 0.5)


def setup_material(scene: bpy.types.Scene) -> None:
    """Wire the wave mesh to a flat cel material so the displacement pops."""
    obj = bpy.data.objects.get("WaveGrid_vat")
    if not obj:
        return
    mat = bpy.data.materials.new("vat_preview")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output  = nodes.new("ShaderNodeOutputMaterial")
    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (0.18, 0.55, 0.85, 1.0)   # studio blue
    links.new(diffuse.outputs["BSDF"], output.inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine       = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = RESOLUTION[0]
    scene.render.resolution_y = RESOLUTION[1]
    scene.render.fps          = FPS
    scene.frame_start         = 1
    scene.frame_end           = N_FRAMES
    scene.render.filepath     = OUTPUT_PATH

    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec          = 'NONE'

    # Workbench shading
    scene.display.shading.light        = 'STUDIO'
    scene.display.shading.color_type   = 'MATERIAL'
    scene.display.shading.show_cavity  = True
    scene.display.shading.cavity_type  = 'BOTH'


def run() -> None:
    scene = bpy.context.scene
    ensure_output_dir()
    setup_camera(scene)
    add_lighting()
    setup_material(scene)
    setup_render(scene)
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 rendered → {bpy.path.abspath(OUTPUT_PATH)}")


if __name__ == "__main__":
    run()
