"""
record.py — animate Sheen & Coat reveal for viewport recording.
Blender 5.1  ·  Holoflow Studio  ·  CC0

Run AFTER blueprint.py.  Animates Sheen Weight and Coat Weight on both
materials to demonstrate each layer's visual contribution in isolation.
Renders via OpenGL to:
  public/library/videos/shading/shader-principled-sheen-coat-velvet-lacquer-vrm/viewport.mp4

Phase breakdown (90 frames @ 24 fps ≈ 3.75 s)
  0  → 30   Sheen Weight 0→1 on VelvetJacket_Navy — edge bloom appears
  30 → 60   Sheen Roughness 0.21→0.95 on navy — velvet → microfibre
  60 → 90   Coat Weight 0→0.87 on LacquerBelt_Black — lacquer builds up
"""

import bpy
import os

TOTAL_FRAMES = 90
FPS          = 24
OUTPUT_PATH  = "public/library/videos/shading/shader-principled-sheen-coat-velvet-lacquer-vrm"
OUTPUT_FILE  = "viewport.mp4"
MAT_VELVET   = "VelvetJacket_Navy"
MAT_LACQUER  = "LacquerBelt_Black"


def get_pbsdf(mat_name: str) -> bpy.types.Node:
    mat = bpy.data.materials[mat_name]
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def kf(mat_name: str, socket: str, frame: int, val: float) -> None:
    node = get_pbsdf(mat_name)
    inp  = node.inputs[socket]
    inp.default_value = val
    inp.keyframe_insert("default_value", frame=frame)


def setup_animation() -> None:
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES

    # Phase 1 (0→30): Sheen Weight on velvet — edge bloom appears
    kf(MAT_VELVET, "Sheen Weight", 0,  0.0)
    kf(MAT_VELVET, "Sheen Weight", 30, 0.93)

    # Phase 2 (30→60): Sheen Roughness — velvet peak widens to microfibre
    kf(MAT_VELVET, "Sheen Roughness", 30, 0.21)
    kf(MAT_VELVET, "Sheen Roughness", 60, 0.95)

    # Phase 3 (60→90): Coat Weight on lacquer — glossy film builds up
    kf(MAT_LACQUER, "Coat Weight", 60, 0.0)
    kf(MAT_LACQUER, "Coat Weight", 90, 0.87)

    # Interpolation — ease-in-out for all channels
    for mat_name in (MAT_VELVET, MAT_LACQUER):
        mat = bpy.data.materials[mat_name]
        if mat.node_tree.animation_data:
            for fc in mat.node_tree.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"
                    kp.easing = "AUTO"


def setup_render(output_dir: str) -> None:
    scene = bpy.context.scene
    scene.render.engine         = "BLENDER_EEVEE_NEXT"
    scene.render.fps            = FPS
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    os.makedirs(output_dir, exist_ok=True)
    scene.render.filepath = os.path.join(output_dir, OUTPUT_FILE)


def main() -> None:
    output_dir = os.path.join(
        bpy.path.abspath("//"),
        os.path.relpath(OUTPUT_PATH),
    )
    setup_animation()
    setup_render(output_dir)
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 written → {output_dir}")


main()
