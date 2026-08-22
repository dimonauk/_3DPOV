"""
record.py — Viewport animation render for Workbench assembly diagram.

Renders the 60-frame explode sequence using the Workbench engine and encodes
to viewport.mp4. Must be run from inside Blender after blueprint.py has been
executed (so the scene is already built and the engine is configured).

Requires ffmpeg on PATH for final MP4 encode step.
Run in Blender: Scripting workspace → Open record.py → Run Script.
"""

import bpy
import os
import subprocess

# ── CONFIG ───────────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 60
RESOLUTION   = (1280, 720)
FPS          = 30

FRAMES_DIR   = "//public/library/videos/rendering/workbench-cavity-outline-assembly-diagram/frames/"
MP4_PATH     = "//public/library/videos/rendering/workbench-cavity-outline-assembly-diagram/viewport.mp4"


def render_frames(scene):
    """
    Use Workbench engine (already configured by blueprint.py).
    Output each frame as PNG; ffmpeg assembles to MP4 afterwards.
    PNG roundtrip avoids Blender's FFMPEG codec quirks in headless contexts.
    """
    scene.render.engine              = "WORKBENCH"
    scene.render.resolution_x        = RESOLUTION[0]
    scene.render.resolution_y        = RESOLUTION[1]
    scene.render.fps                 = FPS
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath            = FRAMES_DIR
    scene.render.use_file_extension  = True
    scene.render.frame_map_old       = 1
    scene.frame_start                = FRAME_START
    scene.frame_end                  = FRAME_END

    # Render all frames
    bpy.ops.render.render(animation=True, use_viewport=False)


def encode_mp4():
    """
    Assemble PNG frames to MP4 with ffmpeg.
    libx264 + yuv420p = maximum browser/device compatibility for WebXR tutorial video.
    """
    frames_abs = bpy.path.abspath(FRAMES_DIR)
    mp4_abs    = bpy.path.abspath(MP4_PATH)

    os.makedirs(os.path.dirname(mp4_abs), exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_abs, "%04d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "fast",
        mp4_abs,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ffmpeg stderr:", result.stderr)
        raise RuntimeError("ffmpeg encode failed — check ffmpeg is on PATH")
    print(f"Encoded: {mp4_abs}")


def main():
    scene = bpy.context.scene
    render_frames(scene)
    encode_mp4()
    print("record.py complete → viewport.mp4")


main()
