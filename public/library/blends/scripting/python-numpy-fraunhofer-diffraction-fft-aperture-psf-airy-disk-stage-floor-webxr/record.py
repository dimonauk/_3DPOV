"""
record.py — Viewport-animation recording script for the Fraunhofer PSF tutorial.
Blender 5.1 | bpy | CC0 | Holoflow Studio

Run this AFTER blueprint.py has built the scene.  It keyframes shape-key weights
and an overhead camera to produce a 150-frame viewport animation:
  F1–50   : Circular Airy disk (default state)
  F51–100 : Cross-fade to Hexagonal Spikes
  F101–150: Cross-fade to Annular Sharpened → loop back to Circular

Output: public/library/videos/scripting/
  python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr/
    viewport.mp4
"""

import bpy, math

# ─── Parameters ───────────────────────────────────────────────────────────────
FRAMES       = 150
FPS          = 24
VIDEO_PATH   = (
    "public/library/videos/scripting/"
    "python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr/"
    "viewport.mp4"
)
OBJ_NAME  = "HF_Fraunhofer_PSF"
KEY_CIRC  = "Circular_Airy"
KEY_HEXA  = "Hexagonal_Spikes"
KEY_ANNUL = "Annular_Sharpened"


def _kf(obj, data_path, frame, value):
    """Insert a keyframe with LINEAR interpolation."""
    obj.keyframe_insert(data_path=data_path, frame=frame)
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == data_path:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def setup_camera():
    """Overhead orthographic camera centred on the PSF mesh."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.type            = "ORTHO"
    cam_data.ortho_scale     = 1.2    # slightly wider than 1 m mesh
    cam_data.clip_start      = 0.01
    cam_data.clip_end        = 100.0

    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location    = (0.0, 0.0, 3.0)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)  # top-down view
    bpy.context.scene.camera = cam_obj
    return cam_obj


def keyframe_shape_keys(obj):
    """
    Morph sequence:
      F1       : Circular = 1.0, Hexagonal = 0.0, Annular = 0.0
      F50-51   : hold Circular
      F60-100  : Hexagonal rising 0→1, Circular falling 1→0
      F110-140 : Annular rising 0→1, Hexagonal falling 1→0
      F150     : back to Circular (loop cut)
    """
    kb = obj.data.shape_keys.key_blocks

    # Convenience: block reference by name
    circ  = kb[KEY_CIRC]
    hexa  = kb[KEY_HEXA]
    annul = kb[KEY_ANNUL]

    schedule = [
        # (frame, circ_val, hexa_val, annul_val)
        (1,   1.0, 0.0, 0.0),
        (50,  1.0, 0.0, 0.0),
        (80,  0.0, 1.0, 0.0),
        (110, 0.0, 1.0, 0.0),
        (140, 0.0, 0.0, 1.0),
        (150, 0.0, 0.0, 1.0),
    ]

    for frame, cv, hv, av in schedule:
        bpy.context.scene.frame_set(frame)
        circ.value  = cv;  circ.keyframe_insert("value",  frame=frame)
        hexa.value  = hv;  hexa.keyframe_insert("value",  frame=frame)
        annul.value = av;  annul.keyframe_insert("value", frame=frame)

    # Linear interpolation on all shape-key fcurves
    action = obj.data.shape_keys.animation_data.action
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES
    scene.render.fps  = FPS

    # Workbench renderer — vertex colour, no samples needed
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light       = "FLAT"
    scene.display.shading.color_type  = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x          = 1280
    scene.render.resolution_y          = 720
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format          = "MPEG4"
    scene.render.ffmpeg.codec           = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath               = VIDEO_PATH


def main():
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(
            f"Object '{OBJ_NAME}' not found — run blueprint.py first."
        )

    setup_camera()
    keyframe_shape_keys(obj)
    setup_render()

    print("[record] Rendering viewport.mp4 …")
    bpy.ops.render.render(animation=True)
    print("[record] Done.")


if __name__ == "__main__":
    main()
