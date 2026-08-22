"""
record.py — viewport animation render for gn-delete-geometry-noise-mask-erosion-webxr-rock
============================================================================================
Animates the Erosion Threshold socket from 0.0 (intact sphere) to 0.72 (heavily
pockmarked asteroid) over 60 frames, with a slow camera orbit, and renders each frame
to public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/
as a PNG sequence.  Combine externally with ffmpeg:
    ffmpeg -r 24 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p viewport.mp4

Run after blueprint.py has been executed in the same Blender session so the
eroded_asteroid object and its GN modifier already exist.
"""

import bpy

OUTPUT_DIR   = "//public/library/videos/geometry-nodes/gn-delete-geometry-noise-mask-erosion-webxr-rock/"
TOTAL_FRAMES = 60
FPS          = 24
OBJ_NAME     = "eroded_asteroid"
MOD_NAME     = "GN_DeleteErosion"

# threshold goes from 0.0 → 0.72 (dramatic erosion without fully destroying mesh)
THRESHOLD_START = 0.00
THRESHOLD_END   = 0.72


def set_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine               = 'BLENDER_WORKBENCH'
    scene.render.film_transparent     = False
    scene.render.resolution_x         = 1920
    scene.render.resolution_y         = 1080
    scene.render.fps                  = FPS
    scene.frame_start                 = 1
    scene.frame_end                   = TOTAL_FRAMES

    # Workbench: object-colour + cavity shading for depth readability
    shading = scene.display.shading
    shading.type           = 'SOLID'
    shading.color_type     = 'MATERIAL'
    shading.show_cavity    = True
    shading.cavity_type    = 'SCREEN'
    shading.cavity_ridge_factor = 0.8

    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath                   = OUTPUT_DIR + "frame_"
    scene.render.use_file_extension         = True
    scene.render.use_render_cache           = False


def add_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens     = 50
    cam_data.clip_end = 100
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    # position looking at origin from a gentle angle
    import mathutils
    cam.location = mathutils.Vector((2.8, -2.8, 1.6))
    cam.rotation_euler = mathutils.Euler((1.1, 0.0, 0.785), 'XYZ')

    # orbit path: animate camera around Z with 30° total arc
    cam.keyframe_insert('rotation_euler', frame=1)
    cam.rotation_euler.z = 0.785 + 0.524   # +30°
    cam.keyframe_insert('rotation_euler', frame=TOTAL_FRAMES)

    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

    return cam


def add_light() -> None:
    light_data = bpy.data.lights.new("SunLight", type='SUN')
    light_data.energy = 5.0
    light_obj = bpy.data.objects.new("SunLight", light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    import mathutils
    light_obj.rotation_euler = mathutils.Euler((0.6, 0.0, 0.9), 'XYZ')


def animate_erosion(obj: bpy.types.Object) -> None:
    """Keyframe the Erosion Threshold socket on the GN modifier."""
    mod = obj.modifiers.get(MOD_NAME)
    if mod is None:
        print(f"[record] WARNING: modifier '{MOD_NAME}' not found on '{obj.name}'")
        return

    tree = mod.node_group
    iface = tree.interface
    threshold_id = next(
        (item.identifier for item in iface.items_tree
         if item.name == 'Erosion Threshold' and item.in_out == 'INPUT'),
        None,
    )
    if threshold_id is None:
        print("[record] WARNING: 'Erosion Threshold' socket not found")
        return

    # frame 1 → 0.0 (intact sphere)
    mod[threshold_id] = THRESHOLD_START
    mod.keyframe_insert(data_path=f'["{threshold_id}"]', frame=1)

    # frame 60 → 0.72 (heavily eroded)
    mod[threshold_id] = THRESHOLD_END
    mod.keyframe_insert(data_path=f'["{threshold_id}"]', frame=TOTAL_FRAMES)

    # smooth easing
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def render() -> None:
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[record] frames rendered → {OUTPUT_DIR}")


def main() -> None:
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print(f"[record] ERROR: '{OBJ_NAME}' not in scene — run blueprint.py first.")
        return

    set_scene()
    add_camera()
    add_light()
    animate_erosion(obj)
    render()
    print("[record] done — combine PNGs to viewport.mp4 with ffmpeg.")


if __name__ == "__main__":
    main()
