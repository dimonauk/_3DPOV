"""
record.py — Viewport animation capture for Action Slots tutorial  (Blender 5.1)
================================================================================
Run this script in the Scripting workspace AFTER blueprint.py.
It sets up a camera, applies cel-shade look-dev materials, and renders a
5-second viewport playblast (frames 1–60 at 12 fps → 5 s) to:
    public/library/videos/animation/animation-action-slots-multi-id-shared/viewport.mp4

The render shows the armature rotating its forearm while the prop cube
rises independently — making the independent-slot animation visible.
"""

import bpy
import math

OUTPUT_PATH = "//../../../../public/library/videos/animation/animation-action-slots-multi-id-shared/viewport"
FPS         = 12
FRAME_START = 1
FRAME_END   = 60


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(
        location=(1.6, -2.0, 1.2),
        rotation=(math.radians(72), 0, math.radians(40)),
    )
    cam = bpy.context.active_object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam
    return cam


def apply_flat_shading(obj: bpy.types.Object, colour: tuple) -> None:
    mat = bpy.data.materials.new(obj.name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.9
    bsdf.inputs["Metallic"].default_value   = 0.0
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def setup_render() -> None:
    sc  = bpy.context.scene
    rd  = sc.render

    # Workbench renderer for fast colour-by-object playblast
    sc.render.engine       = "BLENDER_WORKBENCH"
    sc.display.shading.light = "STUDIO"
    sc.display.shading.color_type = "OBJECT"

    rd.resolution_x        = 1920
    rd.resolution_y        = 1080
    rd.resolution_percentage = 100
    rd.fps                 = FPS
    rd.image_settings.file_format = "FFMPEG"
    rd.ffmpeg.format       = "MPEG4"
    rd.ffmpeg.codec        = "H264"
    rd.ffmpeg.constant_rate_factor = "HIGH"
    rd.filepath            = OUTPUT_PATH

    sc.frame_start = FRAME_START
    sc.frame_end   = FRAME_END


def add_light() -> None:
    bpy.ops.object.light_add(type="SUN", location=(2, -2, 4))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))


def main() -> None:
    setup_camera()
    add_light()

    # Colour objects so slots are visually distinct
    arm_obj  = bpy.data.objects.get("body_rig")
    prop_obj = bpy.data.objects.get("sword_prop")
    face_obj = bpy.data.objects.get("face_mesh")

    if prop_obj:
        apply_flat_shading(prop_obj, (0.2, 0.6, 0.9))   # blue prop
    if face_obj:
        apply_flat_shading(face_obj, (0.9, 0.6, 0.2))   # amber face plane

    setup_render()

    # Render the animation
    bpy.ops.render.render(animation=True)
    print("Viewport capture complete →", OUTPUT_PATH + ".mp4")


main()
