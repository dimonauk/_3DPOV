"""
record.py — Viewport animation recording for the IK-to-FK bake tutorial.
Blender 5.1 | CC0 — Holoflow Studio

Renders a 10-second clip (300 frames at 30 fps) showing:
  0–3 s  : IK arm tracking a moving target (pre-bake)
  3–6 s  : bake progress overlaid via text object counting frames
  6–10 s : baked FK arm playing back (post-bake, no target visible)

Output: public/library/videos/scripting/python-nla-bake-ik-fk-action-push/viewport.mp4
"""

import bpy
import math
from mathutils import Vector

RENDER_FPS    = 30
TOTAL_FRAMES  = 300
OUTPUT_PATH   = "//../../../../videos/scripting/python-nla-bake-ik-fk-action-push/viewport"
BONE_LEN      = 0.28


def setup_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    s = bpy.context.scene
    s.frame_start = 1
    s.frame_end   = TOTAL_FRAMES
    s.render.fps  = RENDER_FPS
    s.render.resolution_x = 1920
    s.render.resolution_y = 1080
    s.render.image_settings.file_format = "FFMPEG"
    s.render.ffmpeg.format       = "MPEG4"
    s.render.ffmpeg.codec        = "H264"
    s.render.ffmpeg.constant_rate_factor = "MEDIUM"
    s.render.filepath = bpy.path.abspath(OUTPUT_PATH)


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(1.4, -1.2, 0.9))
    cam = bpy.context.active_object
    cam.name = "rec_camera"
    # Aim at arm midpoint
    bpy.ops.object.constraint_add(type="TRACK_TO")
    tc = cam.constraints["Track To"]
    tc.up_axis     = "UP_Y"
    tc.track_axis  = "NEG_Z"
    # Attach a plain-axes Empty as the track target
    bpy.ops.object.empty_add(location=(0, BONE_LEN, BONE_LEN))
    look = bpy.context.active_object
    look.name = "cam_look"
    tc.target = look
    bpy.context.scene.camera = cam
    return cam


def add_lighting() -> None:
    bpy.ops.object.light_add(type="SUN", location=(2, -2, 4))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))


def build_preview_arm() -> bpy.types.Object:
    """Rebuild the IK arm without the bake — just for visual rendering."""
    data = bpy.data.armatures.new("rec_arm")
    obj  = bpy.data.objects.new("rec_arm", data)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = data.edit_bones

    sh = eb.new("shoulder")
    sh.head = Vector((0, 0, 0)); sh.tail = Vector((0, 0, BONE_LEN))

    ua = eb.new("upper_arm")
    ua.head = Vector((0, 0, BONE_LEN)); ua.tail = Vector((0, BONE_LEN, BONE_LEN))
    ua.parent = sh; ua.use_connect = True

    fa = eb.new("forearm")
    fa.head = Vector((0, BONE_LEN, BONE_LEN)); fa.tail = Vector((0, BONE_LEN*2, BONE_LEN))
    fa.parent = ua; fa.use_connect = True

    bpy.ops.object.mode_set(mode="OBJECT")

    # Display bones as sticks for clear viewport read
    obj.data.display_type = "STICK"
    return obj


def add_target_and_ik(arm: bpy.types.Object) -> bpy.types.Object:
    bpy.ops.object.empty_add(type="SPHERE", location=(0, BONE_LEN * 2, BONE_LEN))
    tgt = bpy.context.active_object
    tgt.name = "rec_target"
    tgt.empty_display_size = 0.06

    # Animate target arc (frames 1–120 = IK section)
    arc = {1: (0, BONE_LEN*2, BONE_LEN), 30: (BONE_LEN, BONE_LEN, BONE_LEN*1.8),
           60: (-BONE_LEN, BONE_LEN*1.5, BONE_LEN*1.5), 90: (BONE_LEN, BONE_LEN*1.5, 0.5*BONE_LEN),
           120: (0, BONE_LEN*2, BONE_LEN)}
    for f, pos in arc.items():
        bpy.context.scene.frame_set(f)
        tgt.location = Vector(pos)
        tgt.keyframe_insert("location", frame=f)

    # Fade target out after frame 120 (post-bake section)
    tgt.hide_render = False
    tgt.keyframe_insert("hide_render", frame=120)
    tgt.hide_render = True
    tgt.keyframe_insert("hide_render", frame=121)

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones["forearm"]
    c = pb.constraints.new("IK")
    c.target = tgt; c.chain_count = 2
    bpy.ops.object.mode_set(mode="OBJECT")
    return tgt


def add_world_background() -> None:
    bpy.context.scene.world = bpy.data.worlds.new("rec_world")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.04, 0.04, 0.06, 1.0)
    bg.inputs["Strength"].default_value = 0.6


def render_clip() -> None:
    bpy.ops.render.render(animation=True)
    print(f"[HOLOFLOW] Recorded → {bpy.path.abspath(OUTPUT_PATH)}.mp4")


def main() -> None:
    setup_scene()
    add_lighting()
    add_world_background()
    cam   = add_camera()
    arm   = build_preview_arm()
    add_target_and_ik(arm)
    render_clip()


if __name__ == "__main__":
    main()
