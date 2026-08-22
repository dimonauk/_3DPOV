# record.py — viewport animation renderer
# Blender 5.1 | CC0
#
# Animates Fillet_Radius from 0 → 0.22 → 0 over 90 frames to show
# the corners snapping from sharp kinks to smooth arcs and back.
# Run after blueprint.py: open neon_sign.blend, then run this script.
#
# Output: public/library/videos/geometry-nodes/
#         gn-fillet-curve-neon-sign/viewport.mp4

import bpy
import math

BLEND_PATH = (
    "public/library/blends/geometry-nodes/"
    "gn-fillet-curve-neon-sign/neon_sign.blend"
)
OUT_VIDEO = (
    "public/library/videos/geometry-nodes/"
    "gn-fillet-curve-neon-sign/viewport.mp4"
)

OBJ_NAME     = "neon_sign_star"
GNM_NAME     = "FilletCurveNeonSign"
TOTAL_FRAMES = 90
FPS          = 30
RADIUS_MIN   = 0.0
RADIUS_MAX   = 0.22


def _find_socket_id(ng: bpy.types.GeometryNodeTree, name: str) -> str:
    for item in ng.interface.items_tree:
        if item.name == name and item.in_out == "INPUT":
            return item.identifier
    raise RuntimeError(f"Socket '{name}' not found in {ng.name}")


def _ease_inout(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # Output to mp4 via FFmpeg
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_VIDEO

    obj = bpy.data.objects[OBJ_NAME]
    mod = obj.modifiers[GNM_NAME]
    ng  = mod.node_group
    sock_id = _find_socket_id(ng, "Fillet_Radius")

    # Keyframe Fillet_Radius: 0 → 0.22 at mid, back to 0
    for frame in range(1, TOTAL_FRAMES + 1):
        t_lin = (frame - 1) / (TOTAL_FRAMES - 1)
        t_tri = 1.0 - abs(t_lin * 2.0 - 1.0)   # 0→1→0 triangle
        t_ease = _ease_inout(t_tri)
        radius = RADIUS_MIN + t_ease * (RADIUS_MAX - RADIUS_MIN)

        mod[sock_id] = radius
        mod.keyframe_insert(data_path=f'["{sock_id}"]', frame=frame)

    # Viewport render — uses the scene's active camera (ortho, set in blueprint)
    bpy.ops.render.opengl(animation=True)
    print(f"✓ viewport animation written to {OUT_VIDEO}")


if __name__ == "__main__":
    main()
