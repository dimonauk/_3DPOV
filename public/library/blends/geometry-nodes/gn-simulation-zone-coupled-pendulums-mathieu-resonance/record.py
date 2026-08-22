"""
record.py — Viewport animation render for Coupled Pendulums tutorial
=====================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Renders frames 1–240 of the baked pendulum simulation from a fixed
side-view camera to public/library/videos/geometry-nodes/
gn-simulation-zone-coupled-pendulums-mathieu-resonance/viewport.mp4

Prerequisites: run blueprint.py first and bake the Simulation Zone
(Properties > Geometry Nodes Cache > Bake All) before running this script.

Output: 240 frames × 1920×1080 × 24 fps → 10-second MP4
"""

import bpy
import os

# -- Output path (resolved relative to the blend file) -------------------
OUTPUT_DIR = "//../../videos/geometry-nodes/" \
             "gn-simulation-zone-coupled-pendulums-mathieu-resonance/"
OUTPUT_FILE = OUTPUT_DIR + "viewport"   # Blender appends #### and extension

# -- Render settings -----------------------------------------------------
FRAME_START = 1
FRAME_END   = 240
FPS         = 24
RES_X       = 1920
RES_Y       = 1080


def configure_render() -> None:
    scene = bpy.context.scene
    scene.frame_start   = FRAME_START
    scene.frame_end     = FRAME_END
    scene.render.fps    = FPS
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUTPUT_FILE

    # EEVEE Next for fast preview render
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 16

    # Ensure output directory exists
    abs_dir = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(abs_dir, exist_ok=True)


def set_material() -> None:
    """Apply a simple emission material to the instanced bobs."""
    mat = bpy.data.materials.get("PendulumBob")
    if mat is None:
        mat = bpy.data.materials.new("PendulumBob")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = (0.3, 0.8, 1.0, 1.0)  # icy blue
        emit.inputs["Strength"].default_value = 2.0
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    # Assign to the pendulum object (instances pick up object material)
    obj = bpy.data.objects.get("CoupledPendulums")
    if obj and len(obj.data.materials) == 0:
        obj.data.materials.append(mat)


def main() -> None:
    configure_render()
    set_material()

    # Verify camera is set
    if bpy.context.scene.camera is None:
        print("record.py: no camera in scene — run blueprint.py first")
        return

    print(f"record.py: rendering frames {FRAME_START}–{FRAME_END} → {OUTPUT_FILE}")
    bpy.ops.render.render(animation=True)
    print("record.py: render complete.")


if __name__ == "__main__":
    main()
