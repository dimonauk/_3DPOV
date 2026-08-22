"""
record.py — Viewport animation for retopology-polybuild-shrinkwrap
==================================================================
Renders a 5-second viewport animation (120 frames @ 24 fps):
  Frames   1–40 : sculpt reference only (orange semi-transparent)
  Frames  41–80 : retopo mesh fades in over the sculpt
  Frames  81–120: both visible; camera orbits 90° to show snapping

Run AFTER blueprint.py.  Output:
  public/library/videos/sculpting/retopology-polybuild-shrinkwrap/viewport.mp4

Requires the .blend to be saved (bpy.data.filepath must be set).
"""

import bpy
import math
import os

OUTPUT_SUBDIR = "//../../videos/sculpting/retopology-polybuild-shrinkwrap/"
FPS           = 24
TOTAL_FRAMES  = 120


def keyframe_alpha(mat: bpy.types.Material, frame: int, value: float) -> None:
    """Insert a keyframe on the Principled BSDF Alpha socket."""
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    bpy.context.scene.frame_set(frame)
    bsdf.inputs["Alpha"].default_value = value
    bsdf.inputs["Alpha"].keyframe_insert("default_value", frame=frame)


def setup_animation() -> None:
    scene              = bpy.context.scene
    scene.frame_start  = 1
    scene.frame_end    = TOTAL_FRAMES
    scene.render.fps   = FPS

    sculpt = bpy.data.objects.get("sculpt_ref")
    retopo = bpy.data.objects.get("retopo_mesh")

    if sculpt is None or retopo is None:
        raise RuntimeError(
            "[HF] Objects 'sculpt_ref' / 'retopo_mesh' not found. "
            "Run blueprint.py first."
        )

    # Retopo material must be BLEND to support alpha animation
    retopo_mat = retopo.data.materials[0]
    retopo_mat.blend_method = "BLEND"

    # Phase 1 (frames 1–40): retopo invisible
    keyframe_alpha(retopo_mat, frame=1,  value=0.0)
    keyframe_alpha(retopo_mat, frame=40, value=0.0)
    # Phase 2 (frames 41–80): retopo fades in
    keyframe_alpha(retopo_mat, frame=80, value=1.0)
    # Phase 3 (frames 81–120): retopo fully visible (hold)
    keyframe_alpha(retopo_mat, frame=TOTAL_FRAMES, value=1.0)

    # Camera orbit: 0° → 90° across all frames
    cam = bpy.data.objects.get("Camera")
    if cam:
        for frame, angle_deg in ((1, 0), (TOTAL_FRAMES, 90)):
            scene.frame_set(frame)
            cam.rotation_euler[2] = math.radians(angle_deg)
            cam.keyframe_insert("rotation_euler", index=2, frame=frame)

    scene.frame_set(1)


def render_animation() -> None:
    output_abs = bpy.path.abspath(OUTPUT_SUBDIR)
    os.makedirs(output_abs, exist_ok=True)

    scene                               = bpy.context.scene
    scene.render.filepath               = os.path.join(output_abs, "viewport")
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format          = "MPEG4"
    scene.render.ffmpeg.codec           = "H264"
    scene.render.ffmpeg.audio_codec     = "NONE"
    scene.render.ffmpeg.constant_rate_factor = 18    # visually lossless
    scene.render.resolution_x           = 1280
    scene.render.resolution_y           = 720
    scene.render.resolution_percentage  = 100

    # OpenGL viewport render — fast, shows materials and wireframe overlay
    bpy.ops.render.opengl(animation=True)
    print(f"[HF] Viewport animation → {output_abs}viewport.mp4")


def main() -> None:
    if not bpy.data.filepath:
        raise RuntimeError(
            "[HF] .blend file not saved. "
            "Call bpy.ops.wm.save_as_mainfile() first."
        )
    setup_animation()
    render_animation()


main()
