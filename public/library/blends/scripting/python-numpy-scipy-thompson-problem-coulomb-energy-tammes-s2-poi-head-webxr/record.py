"""
record.py — Viewport animation for Thompson's Problem poi head  (Blender 5.1)
=============================================================================
Expects blueprint.py to have been run first so 'hf_thompson_poi' exists.

Renders 150 frames (≈ 6.25 s at 24 fps):
  Frames   0–29   : Optimal shape, camera orbiting
  Frames  30–89   : Morph Optimal → Mid_Energy → Random (disordering trajectory)
  Frames  90–149  : Morph back: Random → Mid_Energy → Optimal (re-crystallising)

Renderer: Workbench (vertex colour / MatCap) for speed — no lighting computation.
Output: public/library/videos/scripting/.../viewport.mp4 (H.264, CRF 20).
"""

import bpy
import os

TOTAL_FRAMES = 150
FPS          = 24
OUTPUT_REL   = "//../../../../videos/scripting/python-numpy-scipy-thompson-problem-coulomb-energy-tammes-s2-poi-head-webxr/viewport.mp4"

def setup_render() -> None:
    sc = bpy.context.scene
    sc.frame_start = 0
    sc.frame_end   = TOTAL_FRAMES - 1
    sc.render.fps  = FPS

    sc.render.engine           = "BLENDER_WORKBENCH"
    sc.display.shading.color_type = "VERTEX"
    sc.display.shading.light   = "FLAT"

    sc.render.image_settings.file_format  = "FFMPEG"
    sc.render.ffmpeg.format               = "MPEG4"
    sc.render.ffmpeg.codec                = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = bpy.path.abspath(OUTPUT_REL)

    # Ensure output directory exists
    out_dir = os.path.dirname(bpy.path.abspath(OUTPUT_REL))
    os.makedirs(out_dir, exist_ok=True)


def insert_shape_key_keyframes(ob: bpy.types.Object) -> None:
    """Keyframe shape key values to animate the disordering / re-ordering."""
    sk_data = ob.data.shape_keys.key_blocks

    def kf(name: str, frame: int, val: float) -> None:
        sk_data[name].value = val
        sk_data[name].keyframe_insert("value", frame=frame)

    # Frame 0–29: pure Optimal, all others = 0
    for nm in ("Mid_Energy", "Random"):
        kf(nm, 0, 0.0); kf(nm, 29, 0.0)

    # Frames 30–60: Optimal → Mid_Energy
    kf("Mid_Energy", 30, 0.0); kf("Mid_Energy", 60, 1.0)

    # Frames 60–89: Mid_Energy → Random
    kf("Mid_Energy", 60, 1.0); kf("Mid_Energy", 89, 0.0)
    kf("Random",     60, 0.0); kf("Random",     89, 1.0)

    # Frames 90–119: Random → Mid_Energy (re-crystallisation)
    kf("Random",     90, 1.0); kf("Random",     119, 0.0)
    kf("Mid_Energy", 90, 0.0); kf("Mid_Energy", 119, 1.0)

    # Frames 119–149: Mid_Energy → Optimal
    kf("Mid_Energy", 119, 1.0); kf("Mid_Energy", 149, 0.0)

    # Smooth interpolation
    if ob.data.shape_keys.animation_data:
        for fc in ob.data.shape_keys.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def orbit_camera(cam: bpy.types.Object) -> None:
    """Slow 120° orbit around Z axis over the full animation."""
    import math
    cam.rotation_euler = (1.5708, 0, 0)
    cam.keyframe_insert("rotation_euler", frame=0)
    cam.rotation_euler.z = math.radians(120)
    cam.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES - 1)
    if cam.animation_data:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def main() -> None:
    ob  = bpy.data.objects.get("hf_thompson_poi")
    cam = bpy.context.scene.camera
    if ob is None:
        raise RuntimeError("hf_thompson_poi not found — run blueprint.py first.")

    setup_render()
    insert_shape_key_keyframes(ob)
    if cam:
        orbit_camera(cam)

    bpy.ops.render.render(animation=True)
    print("[thompson] viewport.mp4 rendered.")


main()
