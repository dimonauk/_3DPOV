"""
record.py — animate PBSDF v2 parameter sweep for viewport recording.
Blender 5.1  ·  Holoflow Studio  ·  CC0

Run AFTER blueprint.py.  Keyframes Roughness, Metallic, Coat Weight,
and Sheen Weight across 90 frames to demonstrate each layer in isolation.
Renders via OpenGL to:
  public/library/videos/shading/shader-principled-bsdf-v2-gltf-pbr-webxr/viewport.mp4

Phase breakdown (90 frames at 24 fps = 3.75 s):
  0→30   Roughness: polished (0.05) → matte (0.95)  — shows rough/smooth range
  30→60  Metallic:  0.0 (plastic) → 1.0 (mirror metal)
  60→90  Coat:      0.0 → 1.0 → settles at 0.65     — clearcoat layer reveal
  0→90   Sheen:     single pulse 0→0.35→0            — edge velvet flash
"""

import bpy
import os

TOTAL_FRAMES = 90
FPS          = 24
MAT_NAME     = "hs_pbr_v2_mat"
OUTPUT_PATH  = "public/library/videos/shading/shader-principled-bsdf-v2-gltf-pbr-webxr"
OUTPUT_FILE  = "viewport.mp4"


def get_pbsdf(mat: bpy.types.Material) -> bpy.types.Node:
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def kf(mat: bpy.types.Material, socket: str, frame: int, val) -> None:
    """Insert a single keyframe on a PBSDF socket."""
    node = get_pbsdf(mat)
    inp  = node.inputs[socket]
    if isinstance(val, (list, tuple)) and not isinstance(val, float):
        inp.default_value[:] = val
    else:
        inp.default_value = val
    inp.keyframe_insert("default_value", frame=frame)


def set_bezier_ease(mat: bpy.types.Material) -> None:
    if not mat.node_tree.animation_data:
        return
    for fc in mat.node_tree.animation_data.action.fcurves:
        for kfp in fc.keyframe_points:
            kfp.interpolation = "BEZIER"
            kfp.easing = "AUTO"


def animate(mat: bpy.types.Material) -> None:
    # Roughness sweep 0→30 frames, settle at base value
    kf(mat, "Roughness", 0,  0.05)
    kf(mat, "Roughness", 30, 0.95)
    kf(mat, "Roughness", 60, 0.26)

    # Metallic sweep 30→60 frames
    kf(mat, "Metallic", 0,  0.0)
    kf(mat, "Metallic", 30, 0.0)
    kf(mat, "Metallic", 60, 1.0)
    kf(mat, "Metallic", 90, 0.82)

    # Coat reveal 60→90 frames
    kf(mat, "Coat Weight", 60, 0.0)
    kf(mat, "Coat Weight", 75, 1.0)
    kf(mat, "Coat Weight", 90, 0.65)

    # Sheen pulse across full duration
    kf(mat, "Sheen Weight", 0,  0.0)
    kf(mat, "Sheen Weight", 45, 0.35)
    kf(mat, "Sheen Weight", 90, 0.0)

    set_bezier_ease(mat)


def configure_render(output_abs: str) -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = TOTAL_FRAMES
    sc.render.fps  = FPS

    sc.render.image_settings.file_format    = "FFMPEG"
    sc.render.ffmpeg.format                 = "MPEG4"
    sc.render.ffmpeg.codec                  = "H264"
    sc.render.ffmpeg.constant_rate_factor   = "HIGH"
    sc.render.resolution_x                  = 1920
    sc.render.resolution_y                  = 1080
    sc.render.filepath = os.path.join(output_abs, OUTPUT_FILE)


def main() -> None:
    mat = bpy.data.materials.get(MAT_NAME)
    if mat is None:
        raise RuntimeError(f"Material '{MAT_NAME}' not found — run blueprint.py first.")

    abs_out = bpy.path.abspath(f"//{OUTPUT_PATH}")
    os.makedirs(abs_out, exist_ok=True)

    animate(mat)
    configure_render(abs_out)

    bpy.ops.render.opengl(animation=True, view_context=True)
    print(f"[record] → {abs_out}/{OUTPUT_FILE}")


if __name__ == "__main__":
    main()
