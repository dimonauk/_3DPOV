# record.py — viewport animation renderer
# Blender 5.1 | CC0
#
# Animates the Iterations group socket from 1 → 24 → 1 over 90 frames,
# showing heat diffusing outward from the pole and then pulling back.
# Run after blueprint.py: open heat_diffusion_dome.blend, then run this.
#
# Output: public/library/videos/geometry-nodes/
#         gn-blur-attribute-heat-diffusion/viewport.mp4

import bpy
import math

BLEND_PATH  = ("public/library/blends/geometry-nodes/"
               "gn-blur-attribute-heat-diffusion/heat_diffusion_dome.blend")
OUT_VIDEO   = ("public/library/videos/geometry-nodes/"
               "gn-blur-attribute-heat-diffusion/viewport.mp4")

OBJ_NAME    = "heat_dome"
GNM_NAME    = "HeatDiffusion"

TOTAL_FRAMES = 90
FPS          = 30
ITER_MIN     = 1
ITER_MAX     = 24   # beyond 24, the 64-segment sphere is fully diffused to equator


def _find_iterations_identifier(ng: bpy.types.GeometryNodeTree) -> str:
    """Return the modifier key for the Iterations group input socket."""
    for item in ng.interface.items_tree:
        if item.name == "Iterations" and item.in_out == "INPUT":
            return item.identifier
    raise RuntimeError("Iterations socket not found in HeatDiffusion group")


def _ease_inout(t: float) -> float:
    """Smooth-step so the animation has no velocity pop at ends."""
    return t * t * (3.0 - 2.0 * t)


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    obj = bpy.data.objects[OBJ_NAME]
    mod = obj.modifiers[GNM_NAME]
    ng  = mod.node_group
    socket_id = _find_iterations_identifier(ng)

    # Keyframe Iterations: ease up to ITER_MAX at frame 45, back to ITER_MIN
    for frame in range(1, TOTAL_FRAMES + 1):
        t_raw = (frame - 1) / (TOTAL_FRAMES - 1)          # 0 → 1 linear
        # Triangle: 0→1 in first half, 1→0 in second half
        t_tri = 1.0 - abs(t_raw * 2.0 - 1.0)
        t_ease = _ease_inout(t_tri)
        iter_val = int(round(ITER_MIN + t_ease * (ITER_MAX - ITER_MIN)))

        scene.frame_set(frame)
        mod[socket_id] = iter_val
        mod.keyframe_insert(data_path=f'["{socket_id}"]', frame=frame)

    # Viewport render settings
    scene.render.engine            = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x     = 1280
    scene.render.resolution_y     = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_VIDEO

    # OpenGL render (viewport, not full render) — fast, no denoising
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)

    print(f"[record] Wrote viewport animation to {OUT_VIDEO}")


if __name__ == "__main__":
    main()
