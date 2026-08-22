"""
record.py — Viewport animation render for shader-voronoi-cracked-ceramic-iridescence
Output: public/library/videos/shading/shader-voronoi-cracked-ceramic-iridescence/viewport.mp4

Technique: slow Y-axis rotation of both bowls over 150 frames (5 seconds at 30 fps).
The rotation sweeps the viewer across both low and high Fresnel angles, which is the
only way to appreciate:
  (a) the crack network catching specular highlights at oblique incidence (Ceramic bowl)
  (b) the soap-film hue shift rolling across the cell faces (Soap bowl)
A stationary camera and key light mean all variation comes from surface angle change.
"""

import bpy
import os

OUTPUT_DIR  = "//../../../../videos/shading/shader-voronoi-cracked-ceramic-iridescence/"
OUTPUT_FILE = OUTPUT_DIR + "viewport"
FPS         = 30
FRAME_COUNT = 150   # 5 seconds


def setup_render() -> None:
    scene = bpy.context.scene
    scene.render.engine          = 'CYCLES'
    scene.cycles.samples         = 64      # reduced for speed; acceptable for preview
    scene.render.filepath        = OUTPUT_FILE
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format   = 'MPEG4'
    scene.render.ffmpeg.codec    = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.fps             = FPS
    scene.frame_start            = 1
    scene.frame_end              = FRAME_COUNT
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.film_transparent = False


def insert_rotation_keyframes() -> None:
    """Full 360° Y rotation over FRAME_COUNT frames for each bowl object."""
    import math
    for obj_name in ("celadon_bowl", "celadon_bowl_soap"):
        obj = bpy.data.objects.get(obj_name)
        if obj is None:
            continue
        obj.rotation_euler = (0, 0, 0)
        obj.keyframe_insert(data_path="rotation_euler", frame=1)
        obj.rotation_euler = (0, 0, math.tau)  # 2π = full rotation
        obj.keyframe_insert(data_path="rotation_euler", frame=FRAME_COUNT)
        # Linear interpolation for constant angular velocity
        if obj.animation_data and obj.animation_data.action:
            for fcurve in obj.animation_data.action.fcurves:
                for kp in fcurve.keyframe_points:
                    kp.interpolation = 'LINEAR'


def ensure_output_dir() -> None:
    abs_path = bpy.path.abspath(OUTPUT_DIR)
    os.makedirs(abs_path, exist_ok=True)


def main() -> None:
    # blueprint.py must have been run first to populate the scene
    setup_render()
    insert_rotation_keyframes()
    ensure_output_dir()
    bpy.ops.render.render(animation=True)
    print(f"record.py: rendered {FRAME_COUNT} frames → {OUTPUT_FILE}.mp4")


if __name__ == "__main__":
    main()
