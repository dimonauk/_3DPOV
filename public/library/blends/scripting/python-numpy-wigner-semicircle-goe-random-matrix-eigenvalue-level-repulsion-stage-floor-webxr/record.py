"""
record.py — Viewport animation recorder for the Wigner GOE Floor
Blender 5.1 scripting context

Outputs: public/library/videos/scripting/
    python-numpy-wigner-semicircle-goe-random-matrix-eigenvalue-level-repulsion-stage-floor-webxr/
        viewport.mp4

Run AFTER blueprint.py has placed the WignerGOE_Floor object in the scene.
Duration: 240 frames at 24 fps = 10 seconds.

Animation sequence:
    F1   – F48   (0–2 s):  Basis (N=100 GOE, clear Wigner ridge, s=0 depleted)
    F49  – F96   (2–4 s):  Cross-fade Basis → SK_Pois (Poisson: s=0 peak, no repulsion)
    F97  – F144  (4–6 s):  Hold SK_Pois — exponential spacing density, s=0 unconstrained
    F145 – F192  (6–8 s):  Cross-fade SK_Pois → SK_Small (N=20 GOE, noisy, broad ridge)
    F193 – F216  (8–9 s):  Cross-fade SK_Small → SK_Med (N=50, intermediate convergence)
    F217 – F240  (9–10 s): Cross-fade SK_Med → Basis (N=100 GOE, recover full Wigner peak)
"""

import bpy
import math

OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-wigner-semicircle-goe-random-matrix-eigenvalue-level-repulsion-stage-floor-webxr/"
    "viewport.mp4"
)

FPS   = 24
TOTAL = 240   # frames
OBJ   = "WignerGOE_Floor"


def clear_animation(obj: bpy.types.Object) -> None:
    """Remove any existing shape-key animation on obj."""
    if obj.data.shape_keys and obj.data.shape_keys.animation_data:
        obj.data.shape_keys.animation_data_clear()


def key(obj: bpy.types.Object, sk_name: str, value: float, frame: int) -> None:
    """Insert a keyframe on shape key 'sk_name' at 'frame'."""
    kb = obj.data.shape_keys.key_blocks[sk_name]
    kb.value = value
    kb.keyframe_insert("value", frame=frame)


def zero_deform_keys(obj: bpy.types.Object, frame: int) -> None:
    """Set all non-Basis shape keys to 0 at 'frame'."""
    for kb in obj.data.shape_keys.key_blocks:
        if kb.name == "Basis":
            continue
        kb.value = 0.0
        kb.keyframe_insert("value", frame=frame)


def setup_camera() -> None:
    """Position camera for a 45° top-down view of the 6 m stage floor.

    The floor lies in the Blender XZ plane after transform_apply (was XY with
    −90°X rotation applied).  Camera at (0, −7.5, 7.5) looks along Y+Z at 45°,
    giving a clear view of both the eigenvalue ridge (X axis) and spacing axis
    (Z axis) simultaneously.
    """
    cam_data = bpy.data.cameras.new("WignerRecordCam")
    cam_obj  = bpy.data.objects.new("WignerRecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)

    cam_obj.location       = (0.0, -7.5, 7.5)
    cam_obj.rotation_euler = (math.radians(45), 0.0, 0.0)
    cam_data.lens          = 35.0
    bpy.context.scene.camera = cam_obj


def animate_camera() -> None:
    """Slow quarter-orbit around Z during the full 240 frames."""
    cam = bpy.data.objects.get("WignerRecordCam")
    if cam is None:
        return
    import math
    # Start: (0, −7.5, 7.5); end: (7.5, 0, 7.5) — 90° orbit
    for f, angle_deg in [(1, -90), (240, 0)]:
        a = math.radians(angle_deg)
        r = 7.5 * math.sqrt(2)
        cam.location = (r * math.cos(a + math.pi / 2),
                        r * math.sin(a + math.pi / 2),
                        7.5)
        cam.keyframe_insert("location", frame=f)


def setup_render(output_path: str) -> None:
    sc = bpy.context.scene
    sc.frame_start  = 1
    sc.frame_end    = TOTAL
    sc.render.fps   = FPS
    sc.render.image_settings.file_format   = 'FFMPEG'
    sc.render.ffmpeg.format                = 'MPEG4'
    sc.render.ffmpeg.codec                 = 'H264'
    sc.render.ffmpeg.constant_rate_factor  = 'MEDIUM'
    sc.render.resolution_x  = 1920
    sc.render.resolution_y  = 1080
    sc.render.filepath       = output_path
    sc.render.engine         = 'BLENDER_EEVEE_NEXT'


def animate_shape_keys(obj: bpy.types.Object) -> None:
    """Encode the six-phase animation sequence described in the docstring."""
    clear_animation(obj)

    # F1–F48: Basis (N=100 GOE, clear Wigner ridge)
    zero_deform_keys(obj, 1)
    zero_deform_keys(obj, 48)

    # F49–F96: cross-fade Basis → SK_Pois
    zero_deform_keys(obj, 49)
    key(obj, "SK_Pois", 0.0, 49)
    zero_deform_keys(obj, 96)
    key(obj, "SK_Pois", 1.0, 96)

    # F97–F144: hold SK_Pois (exponential density, s=0 peak visible)
    key(obj, "SK_Pois", 1.0, 144)

    # F145–F192: cross-fade SK_Pois → SK_Small (N=20 GOE)
    key(obj, "SK_Pois",  1.0, 145)
    key(obj, "SK_Small", 0.0, 145)
    key(obj, "SK_Pois",  0.0, 192)
    key(obj, "SK_Small", 1.0, 192)

    # F193–F216: cross-fade SK_Small → SK_Med (N=50 GOE)
    key(obj, "SK_Small", 1.0, 193)
    key(obj, "SK_Med",   0.0, 193)
    key(obj, "SK_Small", 0.0, 216)
    key(obj, "SK_Med",   1.0, 216)

    # F217–F240: cross-fade SK_Med → Basis (return to N=100 GOE)
    key(obj, "SK_Med", 1.0, 217)
    key(obj, "SK_Med", 0.0, 240)
    zero_deform_keys(obj, 240)


def main() -> None:
    obj = bpy.data.objects.get(OBJ)
    if obj is None:
        raise RuntimeError(f"{OBJ} not found — run blueprint.py first.")

    setup_camera()
    animate_camera()
    setup_render(OUTPUT_PATH)
    animate_shape_keys(obj)

    bpy.ops.render.render(animation=True)
    print("[record] Wrote:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
