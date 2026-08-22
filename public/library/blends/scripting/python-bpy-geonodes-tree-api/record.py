# ============================================================
# Holoflow Studio — record.py
# Python bpy GN Tree API — Spike-Ball Viewport Animation
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# Animates the spike_ball rotating 360° while the Density
# parameter ramps from 2 → 24 spikes/m² over 90 frames.
# Demonstrates keyframing a Geometry Nodes modifier input
# via its socket identifier string.
#
# Output: public/library/videos/scripting/
#         python-bpy-geonodes-tree-api/viewport.mp4
#
# Run AFTER blueprint.py from the Scripting workspace.
# ============================================================

import math
import bpy

OUTPUT_PATH   = "//public/library/videos/scripting/python-bpy-geonodes-tree-api/viewport.mp4"
FRAME_START   = 1
FRAME_END     = 90
FPS           = 30
OBJ_NAME      = "spike_ball"
TREE_NAME     = "HS_SpikeBall"
DENSITY_START = 2.0
DENSITY_END   = 24.0


def find_socket_id(tree_name: str, socket_name: str) -> str:
    """Return the modifier dict-key identifier for a named group socket."""
    tree = bpy.data.node_groups.get(tree_name)
    if tree is None:
        raise RuntimeError(f"Node group '{tree_name}' not found — run blueprint.py first.")
    for item in tree.interface.items_tree:
        if item.in_out == "INPUT" and item.name == socket_name:
            return item.identifier
    raise RuntimeError(f"Socket '{socket_name}' not found in '{tree_name}'.")


def setup_scene(ob: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    # 360° Z rotation — linear interpolation avoids ease-in/out wobble
    ob.rotation_euler = (0, 0, 0)
    ob.keyframe_insert("rotation_euler", frame=FRAME_START)
    ob.rotation_euler = (0, 0, math.tau)
    ob.keyframe_insert("rotation_euler", frame=FRAME_END)
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    # Density ramp — keyframe the modifier input by socket identifier
    # In Blender 4.x/5.x, GN modifier inputs are dicts keyed by
    # socket identifier strings ("Socket_1", "Socket_2", …).
    # The identifier is stable across file saves; the socket index
    # in the UI is NOT stable when sockets are reordered.
    density_id = find_socket_id(TREE_NAME, "Density")
    mod = ob.modifiers["SpikeBall_GN"]
    mod[density_id] = DENSITY_START
    mod.keyframe_insert(f'["{density_id}"]', frame=FRAME_START)
    mod[density_id] = DENSITY_END
    mod.keyframe_insert(f'["{density_id}"]', frame=FRAME_END)


def setup_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    cam_ob.location       = (0.0, -3.6, 0.0)
    cam_ob.rotation_euler = (math.radians(90), 0.0, 0.0)
    cam_data.lens         = 85
    bpy.context.scene.camera = cam_ob


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine                         = "BLENDER_EEVEE_NEXT"
    scene.render.filepath                       = OUTPUT_PATH
    scene.render.image_settings.file_format     = "FFMPEG"
    scene.render.ffmpeg.format                  = "MPEG4"
    scene.render.ffmpeg.codec                   = "H264"
    scene.render.ffmpeg.constant_rate_factor    = "HIGH"
    scene.render.resolution_x                   = 1920
    scene.render.resolution_y                   = 1080
    scene.render.resolution_percentage          = 100

    world = bpy.context.scene.world
    world.node_tree.nodes["Background"].inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25


if __name__ == "__main__":
    ob = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

    setup_scene(ob)
    setup_camera()
    setup_render()

    bpy.ops.render.render(animation=True)
    print(f"[HS] Viewport animation rendered → {OUTPUT_PATH}")
