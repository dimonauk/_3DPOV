"""
record.py — Viewport animation for the Aref Blinking Vortex floor.
Outputs: public/library/videos/scripting/
  aref-blinking-vortex-1984-chaotic-advection-poincare-stroboscopic/viewport.mp4

Run *after* blueprint.py has built the scene.  The animation morphs through
the four μ shape keys (Basis → SK_Ordered → SK_Islands → SK_Turbulent →
Basis) while the camera arcs overhead, showing the KAM-island/chaotic-sea
transition in 240 frames (8 s at 30 fps).
"""

import bpy
import math

FPS        = 30
DURATION_S = 8          # total runtime
N_FRAMES   = FPS * DURATION_S  # 240

OUTPUT_DIR  = "//../../videos/scripting/aref-blinking-vortex-1984-chaotic-advection-poincare-stroboscopic/"
OUTPUT_FILE = OUTPUT_DIR + "viewport"


def _keyframe_shape_key(ob: bpy.types.Object,
                        key_name: str,
                        frame: int,
                        value: float) -> None:
    sk_block = ob.data.shape_keys.key_blocks[key_name]
    sk_block.value = value
    sk_block.keyframe_insert(data_path="value", frame=frame)


def main() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = N_FRAMES
    scene.render.fps  = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUTPUT_FILE

    # Find the floor object
    ob = bpy.data.objects.get("Aref_BlinkingVortex_Floor")
    if ob is None:
        print("[record.py] Object 'Aref_BlinkingVortex_Floor' not found — run blueprint.py first.")
        return

    SK_NAMES = ["SK_Ordered", "SK_Islands", "SK_Turbulent"]

    # Zero all shape keys at frame 1
    for sk_name in SK_NAMES:
        _keyframe_shape_key(ob, sk_name, 1, 0.0)

    # Morph sequence: each SK fades in then out over 60 frames
    segs = [
        (1,   60,  "SK_Ordered"),    # ordered → peak at frame 30
        (61,  120, "SK_Islands"),    # island chains → peak at frame 90
        (121, 180, "SK_Turbulent"),  # turbulent → peak at frame 150
        (181, 240, None),            # return to Basis (all SK = 0)
    ]

    for (f_start, f_end, sk_name) in segs:
        f_mid = (f_start + f_end) // 2
        for other in SK_NAMES:
            _keyframe_shape_key(ob, other, f_start, 0.0)
            _keyframe_shape_key(ob, other, f_end,   0.0)
        if sk_name:
            _keyframe_shape_key(ob, sk_name, f_start, 0.0)
            _keyframe_shape_key(ob, sk_name, f_mid,   1.0)
            _keyframe_shape_key(ob, sk_name, f_end,   0.0)

    # Camera orbit: rotate 120° over the full animation
    cam = scene.camera
    if cam:
        for fr in range(1, N_FRAMES + 1):
            t = (fr - 1) / (N_FRAMES - 1)
            angle = math.radians(-60 + 120 * t)
            radius = 8.0
            height = 5.5
            cam.location = (
                radius * math.sin(angle),
                -radius * math.cos(angle),
                height,
            )
            cam.rotation_euler = (math.radians(55), 0.0, angle)
            cam.keyframe_insert(data_path="location",       frame=fr)
            cam.keyframe_insert(data_path="rotation_euler", frame=fr)

    bpy.ops.render.render(animation=True)
    print("[record.py] Render complete.")


if __name__ == "__main__":
    main()
