"""
record.py — Viewport animation render for the Ising floor tutorial.

Animates shape-key morphs across 120 frames:
  F1–40  :  Basis (T_high, disordered) → T_crit (critical fluctuations)
  F41–80 :  hold at T_crit
  F81–120:  T_crit → T_low (ferromagnetic ordered)

Renders with Workbench (fast, flat colours), outputs viewport.mp4 at 24 fps.
Run via Alt+P inside Blender's Text Editor after blueprint.py has been executed.
"""

import bpy

TARGET_OBJ = "hf_ising_floor"
OUTPUT_PATH = "//../../videos/scripting/python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr/viewport"
FPS        = 24
FRAME_END  = 120


def _set_key(kb, frame: int, value: float) -> None:
    kb.value = value
    kb.keyframe_insert("value", frame=frame)


def setup_animation(obj: bpy.types.Object) -> None:
    keys = obj.data.shape_keys
    kb_basis = keys.key_blocks["Basis"]     # noqa: F841 – implicit via interpolation
    kb_crit  = keys.key_blocks["T_crit"]
    kb_low   = keys.key_blocks["T_low"]

    # zero out all animated keys at frame 1
    for kb in (kb_crit, kb_low):
        _set_key(kb, 1, 0.0)

    # ramp T_crit in (1→40)
    _set_key(kb_crit, 40, 1.0)

    # hold T_crit (40→80) — already at 1.0
    _set_key(kb_crit, 80, 1.0)

    # cross-fade: T_crit out, T_low in (80→120)
    _set_key(kb_crit, 120, 0.0)
    _set_key(kb_low,  80,  0.0)
    _set_key(kb_low,  120, 1.0)

    for kb in (kb_crit, kb_low):
        for fc in keys.animation_data.action.fcurves:
            if fc.data_path.endswith(f'key_blocks["{kb.name}"].value'):
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"


def setup_render(scene: bpy.types.Scene) -> None:
    scene.render.engine        = "BLENDER_WORKBENCH"
    scene.display.shading.type = "SOLID"
    scene.display.shading.light = "FLAT"
    scene.display.shading.color_type = "VERTEX"

    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = FRAME_END
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath        = OUTPUT_PATH


def setup_camera(scene: bpy.types.Scene) -> None:
    """Overhead orthographic camera centred above the 6.4×6.4 m floor."""
    cam_data = bpy.data.cameras.new("ising_cam")
    cam_data.type           = "ORTHO"
    cam_data.ortho_scale    = 7.2
    cam_obj  = bpy.data.objects.new("ising_cam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location        = (3.2, 3.2, 10.0)
    cam_obj.rotation_euler  = (0.0, 0.0, 0.0)
    scene.camera            = cam_obj


def main() -> None:
    obj = bpy.data.objects.get(TARGET_OBJ)
    if obj is None:
        raise RuntimeError(f"[record] '{TARGET_OBJ}' not found — run blueprint.py first.")

    scene = bpy.context.scene
    setup_animation(obj)
    setup_camera(scene)
    setup_render(scene)

    print("[record] rendering 120 frames to viewport.mp4 …")
    bpy.ops.render.render(animation=True)
    print(f"[record] ✓ done → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
