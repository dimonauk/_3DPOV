"""
record.py — Viewport animation for Mist Pass + Z-Depth Defocus tutorial
Outputs: public/library/videos/rendering/compositor-mist-pass-z-depth-defocus-atmospheric/viewport.mp4

Animation: camera dolly from front (minimum DOF) to side (shows mist gradient
building across the three orbs), 120 frames at 24 fps (5 seconds).
Frame 1:  camera faces mid_orb dead-on, near and far are clearly blurred/hazed.
Frame 60: camera is slightly elevated, revealing the full depth corridor.
Frame 120: same framing but focus shifts to far_orb (focus_distance animated).

Run inside Blender: bpy.ops.script.python_file_run(filepath="/path/to/record.py")
Assumes blueprint.py has already been executed to build the scene.
"""

import bpy
import math

TOTAL_FRAMES  = 120
FPS           = 24
OUTPUT_PATH   = "//../../videos/rendering/compositor-mist-pass-z-depth-defocus-atmospheric/viewport"


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    cam_obj = scene.camera
    if cam_obj is None:
        print("[record] No camera in scene. Run blueprint.py first.")
        return

    cam_data = cam_obj.data

    # Animate camera position: gentle arc from -Z height pull-back
    # Frame 1: close, slightly right
    cam_obj.location  = (1.5, -10.0, 2.5)
    cam_obj.keyframe_insert("location", frame=1)

    # Frame 60: centred, slightly higher
    cam_obj.location  = (0.0, -10.0, 4.0)
    cam_obj.keyframe_insert("location", frame=60)

    # Frame 120: left sweep, horizon level
    cam_obj.location  = (-1.5, -10.0, 2.5)
    cam_obj.keyframe_insert("location", frame=120)

    # Animate focus_distance: mid_orb (5.0 world units) → far_orb (9.0)
    cam_data.dof.focus_distance = 5.0
    cam_data.dof.keyframe_insert("focus_distance", frame=1)

    cam_data.dof.focus_distance = 9.0
    cam_data.dof.keyframe_insert("focus_distance", frame=120)

    # Smooth interpolation on both channels
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

    print(f"[record] Animation set: {TOTAL_FRAMES} frames, {FPS} fps.")


def configure_gl_render():
    scene = bpy.context.scene
    scene.render.filepath      = OUTPUT_PATH
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format          = "MPEG4"
    scene.render.ffmpeg.codec           = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"  # good quality
    scene.render.resolution_x   = 1280
    scene.render.resolution_y   = 720
    scene.render.resolution_percentage = 100


def run_viewport_render():
    """
    GL render (viewport animation) — no denoising, no full Cycles, but shows
    the compositor tree live including the Defocus + Mist mix. Good enough for
    the tutorial preview video that shows the effect animated.
    """
    configure_gl_render()
    bpy.ops.render.opengl(animation=True)
    print(f"[record] Viewport render complete → {bpy.context.scene.render.filepath}")


def main():
    setup_animation()
    run_viewport_render()


if __name__ == "__main__":
    main()
