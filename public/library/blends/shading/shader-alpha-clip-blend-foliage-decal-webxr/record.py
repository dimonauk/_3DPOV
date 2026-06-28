"""
record.py — viewport animation for alpha clip vs blend tutorial.
Blender 5.1  ·  Holoflow Studio  ·  CC0

Run AFTER blueprint.py.  Animates the scene to demonstrate:
  0–50:  Camera orbits leaf cluster at ground level; leaf shadow on floor clearly
         visible, shaped by the CLIP mask.
  50–90: Camera tilts up to show the hologram disc glowing; emission strength pulses.
  90–120: Wide two-shot: both props in frame; camera pulls back slowly.

Output: public/library/videos/shading/shader-alpha-clip-blend-foliage-decal-webxr/viewport.mp4
Duration: 120 frames @ 24 fps = 5 seconds.
"""

import bpy
import os

TOTAL_FRAMES  = 120
FPS           = 24
OUTPUT_PATH   = "public/library/videos/shading/shader-alpha-clip-blend-foliage-decal-webxr"
OUTPUT_FILE   = "viewport.mp4"


def get_node(mat_name: str, node_type: str) -> bpy.types.Node | None:
    mat = bpy.data.materials.get(mat_name)
    if mat is None:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == node_type), None)


def insert_socket_kf(mat_name: str, node_type: str,
                     socket: str, frame: int, val) -> None:
    node = get_node(mat_name, node_type)
    if node is None:
        return
    inp = node.inputs[socket]
    if isinstance(val, (list, tuple)):
        inp.default_value[:] = val
    else:
        inp.default_value = val
    inp.keyframe_insert("default_value", frame=frame)


def animate_holo_emission() -> None:
    """
    Pulse the hologram's emission strength to simulate a live signal.
    Starts at full brightness, dims at mid-point, brightens again.
    """
    for frame, val in [(1, 1.8), (50, 0.6), (70, 2.4), (90, 1.8), (120, 1.8)]:
        insert_socket_kf("hs_holo_blend", "BSDF_PRINCIPLED",
                         "Emission Strength", frame, val)

    mat = bpy.data.materials.get("hs_holo_blend")
    if mat and mat.node_tree.animation_data:
        for fc in mat.node_tree.animation_data.action.fcurves:
            for kfp in fc.keyframe_points:
                kfp.interpolation = "BEZIER"


def animate_camera() -> None:
    """
    Three-phase camera move wired directly to the camera object keyframes.
    Phase 1 (0–50):  wide orbit around the leaf cluster to show clipped shadow.
    Phase 2 (50–90): pivot to the hologram disc.
    Phase 3 (90–120): pull back to reveal both props.
    """
    cam_obj = bpy.data.objects.get("hs_cam")
    if cam_obj is None:
        return

    def kf_loc_rot(frame: int, loc: tuple, rot_deg: tuple) -> None:
        import math
        cam_obj.location       = loc
        cam_obj.rotation_euler = tuple(math.radians(d) for d in rot_deg)
        cam_obj.keyframe_insert("location",       frame=frame)
        cam_obj.keyframe_insert("rotation_euler", frame=frame)

    kf_loc_rot(1,   (2.2, -2.6, 1.8), (60, 0, 40))
    kf_loc_rot(50,  (0.5, -2.4, 1.2), (78, 0, 10))
    kf_loc_rot(90,  (2.4, -1.8, 1.2), (70, 0, 55))
    kf_loc_rot(120, (3.8, -3.2, 2.2), (55, 0, 45))

    if cam_obj.animation_data:
        for fc in cam_obj.animation_data.action.fcurves:
            for kfp in fc.keyframe_points:
                kfp.interpolation = "BEZIER"


def configure_render(output_abs: str) -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = TOTAL_FRAMES
    sc.render.fps  = FPS

    sc.render.image_settings.file_format   = "FFMPEG"
    sc.render.ffmpeg.format                = "MPEG4"
    sc.render.ffmpeg.codec                 = "H264"
    sc.render.ffmpeg.constant_rate_factor  = "HIGH"
    sc.render.resolution_x                 = 1920
    sc.render.resolution_y                 = 1080
    sc.render.filepath = os.path.join(output_abs, OUTPUT_FILE)


def main() -> None:
    # Validate scene has been set up
    leaf = bpy.data.objects.get("leaf_0")
    if leaf is None:
        raise RuntimeError("leaf_0 not found — run blueprint.py first.")

    abs_out = bpy.path.abspath(f"//{OUTPUT_PATH}")
    os.makedirs(abs_out, exist_ok=True)

    animate_holo_emission()
    animate_camera()
    configure_render(abs_out)

    bpy.ops.render.opengl(animation=True, view_context=True)
    print(f"[record] → {abs_out}/{OUTPUT_FILE}")


if __name__ == "__main__":
    main()
