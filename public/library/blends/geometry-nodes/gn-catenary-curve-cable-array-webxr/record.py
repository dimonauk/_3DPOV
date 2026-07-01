# record.py — Viewport animation recording for the catenary cable tutorial
# Blender 5.1 | CC0 | Holoflow Studio Library
#
# Run AFTER blueprint.py.  Animates the 'Sag Parameter' group input from a
# near-taut value (a=4.0) down to heavy droop (a=0.4) and back up, producing
# a 90-frame clip that demonstrates the catenary shape continuously shifting.
#
# Output: public/library/videos/geometry-nodes/gn-catenary-curve-cable-array-webxr/viewport.mp4
# Run:    blender --background cable_array.blend --python record.py
# Or:     open cable_array.blend, open a Text Editor panel, run this script.

import bpy
import math

OUTPUT_PATH = "//../../../../../../videos/geometry-nodes/gn-catenary-curve-cable-array-webxr/viewport"
FRAME_START = 1
FRAME_END   = 90
FPS         = 30

SAG_KEYFRAMES = [
    (1,  4.0),    # near-taut
    (30, 0.60),   # gentle droop
    (60, 0.25),   # heavy droop
    (90, 4.0),    # return to taut
]

CAMERA_LOCATION = (0.0, -5.5, 1.0)
CAMERA_ROTATION = (math.radians(80), 0.0, 0.0)


def find_sag_identifier(mod: bpy.types.NodesModifier) -> str:
    for item in mod.node_group.interface.items_tree:
        if item.name == "Sag Parameter" and item.in_out == "INPUT":
            return item.identifier
    raise RuntimeError("'Sag Parameter' socket not found in node group interface")


def setup_camera(scene: bpy.types.Scene):
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = CAMERA_LOCATION
    cam_obj.rotation_euler = CAMERA_ROTATION
    cam_data.lens = 50.0
    scene.camera = cam_obj


def setup_light(scene: bpy.types.Scene):
    light_data = bpy.data.lights.new("Key", "AREA")
    light_data.energy = 200.0
    light_data.size   = 2.0
    light_obj  = bpy.data.objects.new("Key", light_data)
    light_obj.location = (2.0, -2.0, 4.0)
    scene.collection.objects.link(light_obj)


def keyframe_sag(scene: bpy.types.Scene):
    cable_mods = []
    for obj in scene.objects:
        if obj.name.startswith("cable_") and obj.modifiers.get("CatenaryCable"):
            cable_mods.append(obj.modifiers["CatenaryCable"])

    if not cable_mods:
        raise RuntimeError("No cable objects found.  Run blueprint.py first.")

    sock_id = find_sag_identifier(cable_mods[0])
    for frame, sag_val in SAG_KEYFRAMES:
        scene.frame_set(frame)
        for mod in cable_mods:
            mod[sock_id] = sag_val
            mod.keyframe_insert(data_path=f'["{sock_id}"]', frame=frame)


def configure_render(scene: bpy.types.Scene):
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine              = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples   = 16
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format       = "MPEG4"
    scene.render.ffmpeg.codec        = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath            = OUTPUT_PATH


def main():
    scene = bpy.context.scene

    # remove default cube/light/camera if present
    for name in ("Cube", "Light", "Camera"):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)

    setup_camera(scene)
    setup_light(scene)
    keyframe_sag(scene)
    configure_render(scene)

    bpy.ops.render.render(animation=True, use_viewport=False)
    print(f"Viewport animation → {OUTPUT_PATH}.mp4")


main()
