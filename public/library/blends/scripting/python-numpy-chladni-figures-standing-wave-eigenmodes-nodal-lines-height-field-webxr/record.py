"""
record.py — Chladni Figures viewport animation renderer
=========================================================
Animates the two Chladni mode morph targets over 90 frames (3 s at 30 fps):

  frames  1–1   : Basis ψ⁺(2,3) — 12-lobe plate
  frames  1–30  : mode_1_2_plus ramps in  (ψ⁺(1,2) — 4-lobe cross)
  frames 31–45  : mode_1_2_plus ramps out
  frames 46–75  : mode_3_4_minus ramps in (ψ⁻(3,4) — 24-lobe starburst)
  frames 76–90  : mode_3_4_minus ramps out → back to basis

Renders via Workbench SOLID / VERTEX colour — fastest, no shader compile.
Output: public/library/videos/scripting/
        python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr/
        viewport.mp4

Run AFTER blueprint.py.
"""

import bpy
import os

FPS    = 30
FRAMES = 90
OUT_DIR = (
    "//../../../../public/library/videos/scripting/"
    "python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr/"
)
OUT_FILE = os.path.join(OUT_DIR, "viewport")


def setup_render() -> None:
    scene  = bpy.context.scene
    render = scene.render

    render.engine                        = "BLENDER_WORKBENCH"
    scene.display.shading.type           = "SOLID"
    scene.display.shading.color_type     = "VERTEX"
    render.film_transparent              = False
    render.resolution_x                  = 1920
    render.resolution_y                  = 1080
    render.fps                           = FPS
    scene.frame_start                    = 1
    scene.frame_end                      = FRAMES

    render.image_settings.file_format    = "FFMPEG"
    render.ffmpeg.format                 = "MPEG4"
    render.ffmpeg.codec                  = "H264"
    render.ffmpeg.constant_rate_factor   = "HIGH"
    render.filepath                      = bpy.path.abspath(OUT_FILE)


def keyframe_shape_keys() -> None:
    obj = bpy.data.objects.get("chladni_plate")
    if obj is None or obj.data.shape_keys is None:
        print("[record] 'chladni_plate' not found — run blueprint.py first.")
        return

    keys  = obj.data.shape_keys.key_blocks
    scene = bpy.context.scene

    def sk(frame: int, name: str, val: float) -> None:
        scene.frame_set(frame)
        keys[name].value = val
        keys[name].keyframe_insert(data_path="value", frame=frame)

    # mode_1_2_plus: ease in (frame 1→30) then out (31→45)
    sk(1,  "mode_1_2_plus",   0.0)
    sk(30, "mode_1_2_plus",   1.0)
    sk(45, "mode_1_2_plus",   0.0)

    # mode_3_4_minus: ease in (frame 46→75) then out (76→90)
    sk(46, "mode_3_4_minus",  0.0)
    sk(75, "mode_3_4_minus",  1.0)
    sk(90, "mode_3_4_minus",  0.0)

    # Pin mode_3_4_minus to 0 during the first window to prevent bleed
    sk(1,  "mode_3_4_minus",  0.0)


def main() -> None:
    abs_dir = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_dir, exist_ok=True)

    setup_render()
    keyframe_shape_keys()

    bpy.ops.render.render(animation=True)
    print(f"[record] ✓ wrote {OUT_FILE}.mp4")


main()
