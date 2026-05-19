"""
Faceted Gem — viewport recording blueprint
==========================================
Runs blueprint.py, then renders a 5-second turntable animation of the
gem to public/library/videos/low-poly-stylised/faceted-gem-webxr/viewport.mp4.

Run inside Blender:  Text Editor → Run Script
or headless:         blender --background --python record.py

Output: 150 frames at 30 fps = 5 s turntable, 1920×1080, FFmpeg H.264.
The gem rotates one full turn so every crown and pavilion facet is visible.
"""

import bpy
import math
import sys
import os

# ── locate blueprint.py in the same directory ─────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BLUEPRINT_PY = os.path.join(SCRIPT_DIR, "blueprint.py")
OUTPUT_PATH  = os.path.join(
    SCRIPT_DIR, "..", "..", "..", "..", "public", "library",
    "videos", "low-poly-stylised", "faceted-gem-webxr", "viewport"
)   # Blender appends frame number + extension

# ── recording constants ───────────────────────────────────────────────────────
FPS          = 30
DURATION_S   = 5
FRAME_COUNT  = FPS * DURATION_S   # 150 frames
TURNS        = 1.0                 # full 360° over the clip


def run_blueprint():
    """Execute the blueprint in Blender's Python namespace."""
    with open(BLUEPRINT_PY, "r") as fh:
        exec(compile(fh.read(), BLUEPRINT_PY, "exec"), {"__name__": "__main__"})


def setup_turntable(gem_name="gem_cobalt"):
    """Keyframe a Z-axis rotation on the gem object for a 1-turn spin."""
    obj = bpy.data.objects.get(gem_name)
    if obj is None:
        print(f"[record] object '{gem_name}' not found — skipping turntable", file=sys.stderr)
        return

    obj.rotation_mode = 'XYZ'

    # Frame 1: 0°
    obj.rotation_euler[2] = 0.0
    obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)

    # Frame FRAME_COUNT: 360°
    obj.rotation_euler[2] = math.radians(360.0 * TURNS)
    obj.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAME_COUNT)

    # Linear interpolation — constant angular velocity throughout
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == "rotation_euler" and fc.array_index == 2:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def configure_render():
    """Set render to 1920×1080 FFmpeg H.264 for the preview video."""
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_COUNT
    scene.render.fps  = FPS

    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    # Ensure output directory exists before render
    out_dir = os.path.dirname(OUTPUT_PATH)
    os.makedirs(out_dir, exist_ok=True)

    scene.render.filepath = OUTPUT_PATH


def main():
    run_blueprint()
    setup_turntable()
    configure_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[record] animation rendered → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()
