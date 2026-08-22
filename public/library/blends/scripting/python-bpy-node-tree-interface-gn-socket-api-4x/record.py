"""
record.py — Viewport animation recording for NodeTreeInterface tutorial
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py has created the scene. Animates the Blade Count
modifier input from 3 → 9 → 16 over 90 frames, producing a fan reveal.
Output: public/library/videos/scripting/python-bpy-node-tree-interface-gn-socket-api-4x/viewport.mp4
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/scripting/python-bpy-node-tree-interface-gn-socket-api-4x/viewport"
FPS         = 30
FRAME_END   = 90

# Blade Count keyframe schedule: (frame, count)
COUNT_KEYS  = [(1, 3), (30, 6), (60, 9), (90, 16)]


def find_fan_object() -> bpy.types.Object:
    for ob in bpy.data.objects:
        for mod in ob.modifiers:
            if mod.type == "NODES" and mod.node_group and "Fan" in mod.node_group.name:
                return ob
    raise RuntimeError("radial_fan object not found — run blueprint.py first")


def find_count_identifier(mod: bpy.types.NodesModifier) -> str:
    ng = mod.node_group
    for item in ng.interface.items_tree:
        if hasattr(item, "default_value") and item.name == "Blade Count":
            return item.identifier
    raise RuntimeError("'Blade Count' socket not found in node group interface")


def keyframe_count(ob: bpy.types.Object, mod: bpy.types.NodesModifier,
                   ident: str) -> None:
    ob.animation_data_create()
    if ob.animation_data.action is None:
        ob.animation_data.action = bpy.data.actions.new(name="fan_anim")

    for frame, count in COUNT_KEYS:
        bpy.context.scene.frame_set(frame)
        mod[ident] = count
        mod.keyframe_insert(data_path=f'["{ident}"]', frame=frame)


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    render = scene.render
    render.resolution_x    = 1920
    render.resolution_y    = 1080
    render.fps             = FPS
    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format   = "MPEG4"
    render.ffmpeg.codec    = "H264"
    render.ffmpeg.constant_rate_factor = "MEDIUM"
    render.filepath        = OUTPUT_PATH

    # Workbench renderer is fastest for viewport recording
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"


def orient_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob
    cam_ob.location = (0, -1.4, 0.9)
    cam_ob.rotation_euler = (math.radians(52), 0, 0)


def main() -> None:
    scene = bpy.context.scene
    ob    = find_fan_object()
    mod   = next(m for m in ob.modifiers if m.type == "NODES")
    ident = find_count_identifier(mod)

    keyframe_count(ob, mod, ident)
    setup_render()
    orient_camera()

    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 rendered → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
