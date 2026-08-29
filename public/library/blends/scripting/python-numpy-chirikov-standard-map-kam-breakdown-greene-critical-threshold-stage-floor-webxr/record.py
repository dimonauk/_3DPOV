"""
record.py — Viewport animation recorder for the Chirikov Standard Map
Blender 5.1 scripting context

Outputs: public/library/videos/scripting/
    python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr/
        viewport.mp4

Run AFTER blueprint.py has placed the StandardMap_KAM object in the scene.
Duration: 240 frames at 24 fps = 10 seconds.

Animation sequence:
    F1   – F48   (0–2 s):  Basis (K_critical, last KAM curve)
    F49  – F120  (2–5 s):  Shape-key cross-fade to SK_Integrable (K=0.1)
    F121 – F168  (5–7 s):  Hold SK_Integrable — nearly-integrable tori visible
    F169 – F216  (7–9 s):  Cross-fade to SK_Chaotic (K=2.0)
    F217 – F240  (9–10 s): Hold SK_Chaotic then fade back to Basis
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/scripting/" \
    "python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr/" \
    "viewport.mp4"

FPS   = 24
TOTAL = 240   # frames


def clear_animation(obj: bpy.types.Object) -> None:
    """Remove any existing shape-key animation on obj."""
    if obj.data.shape_keys and obj.data.shape_keys.animation_data:
        obj.data.shape_keys.animation_data_clear()


def key(obj: bpy.types.Object, sk_name: str, value: float, frame: int) -> None:
    """Insert a keyframe on shape key 'sk_name' at 'frame'."""
    kb = obj.data.shape_keys.key_blocks[sk_name]
    kb.value = value
    kb.keyframe_insert("value", frame=frame)


def setup_camera() -> None:
    """Position camera for a 45° top-down view of the 6m stage floor."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)

    cam_obj.location = (0.0, -7.5, 7.5)
    cam_obj.rotation_euler = (math.radians(45), 0.0, 0.0)
    cam_data.lens = 35.0
    bpy.context.scene.camera = cam_obj


def setup_render(output_path: str) -> None:
    sc = bpy.context.scene
    sc.frame_start  = 1
    sc.frame_end    = TOTAL
    sc.render.fps   = FPS
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.resolution_x  = 1920
    sc.render.resolution_y  = 1080
    sc.render.filepath       = output_path
    # Eevee Next for fast preview renders; Cycles for final quality
    sc.render.engine = 'BLENDER_EEVEE_NEXT'


def animate_shape_keys(obj: bpy.types.Object) -> None:
    """Encode the four-regime animation described in the module docstring."""
    clear_animation(obj)
    skb = obj.data.shape_keys.key_blocks

    # Helper: zero all non-Basis keys at a given frame
    non_basis = [k.name for k in skb if k.name not in ("Basis",)]

    def zero_all(frame: int) -> None:
        for name in non_basis:
            key(obj, name, 0.0, frame)

    # F1–F48: Basis (K_critical) — all deform keys at 0
    zero_all(1)
    zero_all(48)

    # F49–F120: cross-fade to SK_Integrable
    zero_all(49)
    key(obj, "SK_Integrable", 0.0, 49)
    zero_all(120)
    key(obj, "SK_Integrable", 1.0, 120)

    # F121–F168: hold SK_Integrable
    key(obj, "SK_Integrable", 1.0, 168)

    # F169–F216: cross-fade to SK_Chaotic
    key(obj, "SK_Integrable", 1.0, 169)
    key(obj, "SK_Chaotic",    0.0, 169)
    key(obj, "SK_Integrable", 0.0, 216)
    key(obj, "SK_Chaotic",    1.0, 216)

    # F217–F240: hold SK_Chaotic then snap back
    key(obj, "SK_Chaotic", 1.0, 217)
    key(obj, "SK_Chaotic", 0.0, 240)
    zero_all(240)


def main() -> None:
    obj = bpy.data.objects.get("StandardMap_KAM")
    if obj is None:
        raise RuntimeError("StandardMap_KAM not found — run blueprint.py first.")

    setup_camera()
    setup_render(OUTPUT_PATH)
    animate_shape_keys(obj)

    bpy.ops.render.render(animation=True)
    print("[record] Wrote:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
