"""
record.py — Viewport animation render for the cotangent Laplacian fairing demo.
Outputs: public/library/videos/scripting/
         python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr/
         viewport.mp4

Phases:
  F 001-060  Taubin shape key morphs from 0 → 1 (Basis → Taubin)
  F 061-120  Taubin key holds at 1; 180° camera orbit
  F 121-180  Taubin → Implicit cross-fade (Taubin: 1→0, Implicit: 0→1)
  F 181-240  Implicit holds; reverse-orbit 180° back to start

Run from Blender's Text Editor after blueprint.py has created the scene.
"""

import bpy
import math

OUTPUT_DIR = "//../../videos/scripting/" \
             "python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr/"
FPS        = 24
FRAMES     = 240


def _ensure_camera() -> bpy.types.Object:
    if "HF_Camera" not in bpy.data.objects:
        bpy.ops.object.camera_add(location=(0, -4.0, 0))
        cam = bpy.context.object
        cam.name = "HF_Camera"
        cam.data.name = "HF_Camera"
    else:
        cam = bpy.data.objects["HF_Camera"]
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam
    return cam


def _ensure_light() -> None:
    if "HF_Light" not in bpy.data.objects:
        bpy.ops.object.light_add(type="SUN", location=(3, -3, 5))
        bpy.context.object.name = "HF_Light"
        bpy.context.object.data.energy = 3.0


def _keyframe_shape_keys(obj: bpy.types.Object) -> None:
    """Animate morph targets: Basis→Taubin (F1-60) then Taubin→Implicit (F121-180)."""
    sk = obj.data.shape_keys
    if sk is None:
        return
    kb_taubin   = sk.key_blocks.get("Taubin")
    kb_implicit = sk.key_blocks.get("Implicit")
    if not (kb_taubin and kb_implicit):
        return

    def _set_key(kb, frame: int, value: float) -> None:
        kb.value = value
        kb.keyframe_insert("value", frame=frame)

    # Taubin morphs in
    _set_key(kb_taubin, 1,   0.0)
    _set_key(kb_taubin, 60,  1.0)
    _set_key(kb_taubin, 120, 1.0)
    _set_key(kb_taubin, 180, 0.0)
    _set_key(kb_taubin, 240, 0.0)

    # Implicit cross-fades in from F121
    _set_key(kb_implicit, 1,   0.0)
    _set_key(kb_implicit, 120, 0.0)
    _set_key(kb_implicit, 180, 1.0)
    _set_key(kb_implicit, 240, 1.0)

    # LINEAR interpolation — no easing on morph for direct comparison
    for kb in [kb_taubin, kb_implicit]:
        if kb.id_data.animation_data:
            for fc in kb.id_data.animation_data.action.fcurves:
                for kfp in fc.keyframe_points:
                    kfp.interpolation = "LINEAR"


def _keyframe_camera_orbit(cam: bpy.types.Object) -> None:
    """Two 180° arcs: F61-120 and F181-240 (reverse)."""
    import math
    radius = 4.0
    height = 0.5

    def _place(frame: int, angle_deg: float) -> None:
        a = math.radians(angle_deg)
        cam.location = (radius * math.sin(a), -radius * math.cos(a), height)
        # point camera at world origin
        cam.rotation_euler = (
            math.atan2(height, radius),
            0.0,
            a,
        )
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    _place(61,  0)
    _place(120, 180)
    _place(181, 180)
    _place(240, 0)

    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kfp in fc.keyframe_points:
                kfp.interpolation = "LINEAR"


def _configure_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES
    sc.render.fps  = FPS
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format  = "FFMPEG"
    sc.render.ffmpeg.format               = "MPEG4"
    sc.render.ffmpeg.codec                = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath = OUTPUT_DIR + "viewport"

    sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.eevee.use_bloom = True
    sc.eevee.bloom_threshold  = 0.8
    sc.eevee.bloom_intensity  = 0.12

    # World: black so emission materials pop
    bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = (
        0.0, 0.0, 0.0, 1.0
    )


if __name__ == "__main__":
    obj = bpy.data.objects.get("HF_Fairing")
    if obj is None:
        raise RuntimeError("Run blueprint.py first to create HF_Fairing.")

    cam = _ensure_camera()
    _ensure_light()
    _configure_render()
    _keyframe_shape_keys(obj)
    _keyframe_camera_orbit(cam)
    bpy.ops.render.render(animation=True)
    print("record.py complete — check OUTPUT_DIR for viewport.mp4")
