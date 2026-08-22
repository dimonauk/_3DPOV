"""
record.py — Newton Fractal viewport animation renderer
=======================================================
Animates the roots_3 and roots_7 shape keys over 90 frames (3 s at 30 fps):

  frames  1–1   : Basis (degree-5)
  frames  1–30  : roots_3 ramps in (z^3−1 basin topology)
  frames 31–45  : roots_3 ramps out
  frames 46–75  : roots_7 ramps in (z^7−1 — 7 basins)
  frames 76–90  : roots_7 ramps out → back to degree-5

Renders via Workbench (SOLID / VERTEX colour) — fastest, no shader compile.
Output: public/library/videos/.../viewport.mp4

Run AFTER blueprint.py.
"""

import bpy
import os

FPS     = 30
FRAMES  = 90
OUT_DIR = (
    "//../../../../public/library/videos/scripting/"
    "python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr/"
)
OUT_FILE = os.path.join(OUT_DIR, "viewport")


def setup_render() -> None:
    scene  = bpy.context.scene
    render = scene.render

    render.engine               = "BLENDER_WORKBENCH"
    scene.display.shading.type  = "SOLID"
    scene.display.shading.color_type = "VERTEX"
    render.film_transparent     = False
    render.resolution_x         = 1920
    render.resolution_y         = 1080
    render.fps                  = FPS
    scene.frame_start           = 1
    scene.frame_end             = FRAMES

    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format        = "MPEG4"
    render.ffmpeg.codec         = "H264"
    render.ffmpeg.constant_rate_factor = "HIGH"
    render.filepath             = bpy.path.abspath(OUT_FILE)


def keyframe_shape_keys() -> None:
    obj = bpy.data.objects.get("newton_basin")
    if obj is None or obj.data.shape_keys is None:
        print("[record] 'newton_basin' not found — run blueprint.py first.")
        return

    keys  = obj.data.shape_keys.key_blocks
    scene = bpy.context.scene

    def sk(frame: int, name: str, val: float) -> None:
        scene.frame_set(frame)
        keys[name].value = val
        keys[name].keyframe_insert(data_path="value", frame=frame)

    # roots_3: ease in then out
    sk(1,  "roots_3", 0.0)
    sk(30, "roots_3", 1.0)
    sk(45, "roots_3", 0.0)

    # roots_7: ease in then out
    sk(46, "roots_7", 0.0)
    sk(75, "roots_7", 1.0)
    sk(90, "roots_7", 0.0)

    # Ensure roots_7 starts at 0 during roots_3 window
    sk(1,  "roots_7", 0.0)


def main() -> None:
    abs_dir = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_dir, exist_ok=True)

    setup_render()
    keyframe_shape_keys()

    bpy.ops.render.render(animation=True)
    print(f"[record] ✓ wrote {OUT_FILE}.mp4")


main()
