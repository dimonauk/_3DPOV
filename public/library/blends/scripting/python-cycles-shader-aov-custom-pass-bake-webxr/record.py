"""
Holoflow Studio — Blender 5.1 Record Script
Cycles Shader AOV — Viewport Animation for viewport.mp4

Renders a 5-second turntable of the AOV sphere.  The AOV height gradient is
wired into the Principled BSDF Base Color so the data is visible in the
viewport.  The compositor AOV capture does NOT fire during a viewport render
(bpy.ops.render.render(animation=True) would, but we use EEVEE for speed).

Run AFTER blueprint.py has been executed in the same Blender session.
Output: public/library/videos/scripting/python-cycles-shader-aov-custom-pass-bake-webxr/viewport.mp4
"""

import bpy
import math

ANIM_FRAMES = 150      # 5 s at 30 fps
OUTPUT_PATH = "//viewport_frames/"
FINAL_MP4   = "//viewport.mp4"


def patch_material_for_preview() -> None:
    """Wire HeightGradient data into Base Color so the render shows AOV data."""
    ob = bpy.data.objects.get("aov_sphere")
    if ob is None:
        return
    mat = ob.active_material
    if mat is None or not mat.use_nodes:
        return
    nt = mat.node_tree

    # Find the height gradient MapRange and wire it to BSDF base colour.
    remap = next(
        (n for n in nt.nodes if n.type == 'MAP_RANGE'), None
    )
    bsdf = next(
        (n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None
    )
    if remap and bsdf:
        # Pack scalar → RGB.
        combine = next(
            (n for n in nt.nodes if n.type == 'COMBXYZ'), None
        )
        if combine:
            nt.links.new(combine.outputs['Vector'], bsdf.inputs['Base Color'])


def add_turntable(ob: bpy.types.Object) -> None:
    ob.animation_data_create()
    ob.animation_data.action = bpy.data.actions.new("turntable")
    fc = ob.animation_data.action.fcurves.new(
        data_path="rotation_euler", index=2
    )
    fc.keyframe_points.insert(1, 0.0).interpolation          = 'LINEAR'
    fc.keyframe_points.insert(ANIM_FRAMES, math.tau).interpolation = 'LINEAR'


def configure_eevee_render(scene: bpy.types.Scene) -> None:
    scene.render.engine         = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.fps            = 30
    scene.frame_start           = 1
    scene.frame_end             = ANIM_FRAMES
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath       = bpy.path.abspath(FINAL_MP4)


def add_camera_and_light() -> None:
    bpy.ops.object.camera_add(location=(0, -3.5, 0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='AREA', location=(2, -2, 3))
    light = bpy.context.active_object
    light.data.energy = 500
    light.data.size   = 2.0


def main() -> None:
    scene = bpy.context.scene
    ob    = bpy.data.objects.get("aov_sphere")
    if ob is None:
        print("Run blueprint.py first — aov_sphere not found")
        return

    patch_material_for_preview()
    add_turntable(ob)
    add_camera_and_light()
    configure_eevee_render(scene)
    bpy.ops.render.render(animation=True)
    print(f"Viewport animation written to {FINAL_MP4}")


if __name__ == "__main__":
    main()
