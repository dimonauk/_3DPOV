"""
record.py — Viewport animation recorder for GP3 Line Art Toon Outline
Blender 5.1 | Licence: CC0

Renders a 90-frame (3 s at 30 fps) 360° rotation of the gem so the recording
shows the CONTOUR strokes migrating as the silhouette boundary moves while
CREASE strokes remain fixed — illustrating the view-dependent vs. geometry-
dependent distinction between edge categories.

Run blueprint.py first, then run this script.
Output: public/library/videos/grease-pencil/grease-pencil-3-line-art-toon-outline/viewport.mp4
"""

import bpy
import math
import os

OUTPUT_SUBPATH = (
    "public/library/videos/grease-pencil/"
    "grease-pencil-3-line-art-toon-outline/viewport"
)
FRAME_START = 1
FRAME_END   = 90    # 3 seconds at 30 fps — full 360° rotation


def setup_animation() -> None:
    """
    Animate gem Z-rotation 0° → 360° linearly over FRAME_START..FRAME_END.
    LINEAR interpolation ensures constant angular velocity — the viewer can
    judge exactly how CONTOUR strokes migrate per degree of rotation.
    """
    gem = bpy.data.objects.get("gem")
    if gem is None:
        raise RuntimeError(
            "[record] 'gem' object not found.  Run blueprint.py first."
        )

    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    gem.rotation_euler.z = 0.0
    gem.keyframe_insert("rotation_euler", frame=FRAME_START)

    gem.rotation_euler.z = math.radians(360.0)
    gem.keyframe_insert("rotation_euler", frame=FRAME_END)

    # Force LINEAR (not BEZIER) so no ease-in / ease-out disguises the relationship
    if gem.animation_data and gem.animation_data.action:
        for fc in gem.animation_data.action.fcurves:
            if fc.data_path == "rotation_euler" and fc.array_index == 2:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def setup_output() -> None:
    """
    Resolve output path relative to blend file location, then configure
    EEVEE Next + H.264 MPEG-4 render.  EEVEE is required because Shader to
    RGB (used in the cel material) only evaluates correctly in EEVEE.
    """
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.fps    = 30

    blend_dir = bpy.path.abspath("//")
    repo_root = os.path.normpath(
        os.path.join(blend_dir, "..", "..", "..", "..", "..")
    )
    abs_out = os.path.join(repo_root, OUTPUT_SUBPATH)
    os.makedirs(os.path.dirname(abs_out), exist_ok=True)

    scene.render.filepath = abs_out
    scene.render.image_settings.file_format   = 'FFMPEG'
    scene.render.ffmpeg.format                = 'MPEG4'
    scene.render.ffmpeg.codec                 = 'H264'
    scene.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
    scene.render.resolution_x                 = 1920
    scene.render.resolution_y                 = 1080
    scene.render.resolution_percentage        = 100


def main() -> None:
    setup_animation()
    setup_output()
    bpy.ops.render.render(animation=True)
    print("[record] Render complete.")
    print(f"  Output: {OUTPUT_SUBPATH}.mp4")


if __name__ == "__main__":
    main()
