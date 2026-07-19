"""
Holoflow Studio — Blender 5.1
record.py — EEVEE turntable render for
python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr

Outputs a 5-second 360° turntable to:
  public/library/videos/scripting/
    python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr/viewport.mp4

Run headless:
  blender --background --python record.py
"""

import bpy
import bmesh
import math

FRAME_COUNT  = 150   # 5 s @ 30 fps
FPS          = 30
OUTPUT_PATH  = (
    "//../../../../videos/scripting/"
    "python-bmesh-ops-wireframe-edge-tube-crystal-cage-webxr/viewport.mp4"
)


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def build_cage() -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, calc_uvs=False)
    result = bmesh.ops.wireframe(
        bm,
        faces               = list(bm.faces),
        thickness           = 0.045,
        offset              = 0.005,
        use_even_offset     = True,
        use_replace         = True,
        use_boundary        = False,
        use_crease          = False,
        use_relative_offset = False,
        material_offset     = 0,
    )
    for f in result['faces']:
        f.smooth = False
    bm.normal_update()
    for e in bm.edges:
        e.smooth = False

    me = bpy.data.meshes.new("rec_cage")
    bm.to_mesh(me)
    bm.free()
    me.update()

    mat = bpy.data.materials.new("rec_wire")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value       = (0.04, 0.55, 0.98, 1.0)
    bsdf.inputs["Metallic"].default_value         = 0.9
    bsdf.inputs["Roughness"].default_value        = 0.12
    bsdf.inputs["Emission Strength"].default_value = 2.5
    bsdf.inputs["Emission Color"].default_value   = (0.04, 0.55, 0.98, 1.0)
    me.materials.append(mat)

    obj = bpy.data.objects.new("rec_cage", me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def setup_scene() -> None:
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.fps = FPS
    scn.frame_start = 1
    scn.frame_end = FRAME_COUNT
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format = 'MPEG4'
    scn.render.ffmpeg.codec = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scn.render.filepath = OUTPUT_PATH
    scn.eevee.use_bloom = True
    scn.world = bpy.data.worlds.new("rec_world")
    scn.world.use_nodes = True
    scn.world.node_tree.nodes["Background"].inputs[0].default_value = (
        0.02, 0.02, 0.04, 1.0
    )


def setup_camera() -> None:
    cam_data = bpy.data.cameras.new("rec_cam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("rec_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    cam_obj.location = (0.0, -3.6, 0.5)
    cam_obj.rotation_euler = (math.radians(82), 0.0, 0.0)
    bpy.context.scene.camera = cam_obj


def setup_key_light() -> None:
    light_data = bpy.data.lights.new("rec_key", 'AREA')
    light_data.energy = 350
    light_data.color  = (0.6, 0.8, 1.0)
    light_data.size   = 2.0
    light_obj = bpy.data.objects.new("rec_key", light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.location = (3.0, -2.0, 4.0)


def setup_turntable(obj: bpy.types.Object) -> None:
    pivot = bpy.data.objects.new("rec_pivot", None)
    bpy.context.scene.collection.objects.link(pivot)
    obj.parent = pivot

    pivot.rotation_euler = (0.0, 0.0, 0.0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0.0, 0.0, math.radians(360.0))
    pivot.keyframe_insert("rotation_euler", frame=FRAME_COUNT)

    fc = pivot.animation_data.action.fcurves.find("rotation_euler", index=2)
    for kfp in fc.keyframe_points:
        kfp.interpolation = 'LINEAR'


def main() -> None:
    purge_scene()
    cage = build_cage()
    setup_scene()
    setup_camera()
    setup_key_light()
    setup_turntable(cage)
    bpy.ops.render.render(animation=True)
    print("[holoflow] record.py → viewport.mp4 done")


main()
