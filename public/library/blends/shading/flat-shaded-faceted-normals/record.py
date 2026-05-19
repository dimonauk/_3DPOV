"""
record.py — Viewport animation for screen-capture recording
===========================================================
Holoflow Studio · library/blends/shading/flat-shaded-faceted-normals

Run AFTER blueprint.py has been executed in the same Blender session, or
open the saved faceted_sphere.blend and run this script from the Text Editor.

What it does:
  • Animates the sun lamp orbiting the sphere over 150 frames at 30 fps (5 s).
  • Renders the viewport to individual PNGs, then encodes to viewport.mp4.

Output path: public/library/videos/shading/flat-shaded-faceted-normals/
Adjust OUTPUT_DIR to match your local checkout root.

The intent is a 5-second clip showing the three cel-shading bands sliding
across the faceted sphere as the light angle changes — demonstrates the
technique without Dimona needing to narrate it.
"""

import bpy
import math
import os

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 150
FPS          = 30
SUN_NAME     = "studio_sun"
ORBIT_RADIUS = 7.0
ORBIT_HEIGHT = 5.0

# Absolute path to repo root — adjust if your checkout differs.
REPO_ROOT   = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
OUTPUT_DIR  = os.path.join(REPO_ROOT, "public", "library", "videos", "shading",
                           "flat-shaded-faceted-normals")
FRAME_DIR   = os.path.join(OUTPUT_DIR, "_frames")
OUTPUT_MP4  = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── SETUP ─────────────────────────────────────────────────────────────────────

def _ensure_dirs() -> None:
    os.makedirs(FRAME_DIR, exist_ok=True)


def _set_render_settings() -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(FRAME_DIR, "frame_")


def _keyframe_sun_orbit() -> None:
    """Insert rotation keyframes so the sun orbits 360° over FRAME_END frames."""
    sun = bpy.data.objects.get(SUN_NAME)
    if sun is None:
        print(f"[record] WARNING: light '{SUN_NAME}' not found — skipping orbit.")
        return

    for frame in range(FRAME_START, FRAME_END + 1):
        t = (frame - FRAME_START) / (FRAME_END - FRAME_START)
        angle = t * math.tau   # 0 → 2π
        x = math.cos(angle) * ORBIT_RADIUS
        y = math.sin(angle) * ORBIT_RADIUS
        z = ORBIT_HEIGHT

        bpy.context.scene.frame_set(frame)
        sun.location = (x, y, z)
        sun.keyframe_insert(data_path="location", index=-1)

        # Point the sun at the origin each frame.
        direction = (-x, -y, -z)
        from mathutils import Vector
        d = Vector(direction).normalized()
        sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        sun.keyframe_insert(data_path="rotation_euler", index=-1)

    bpy.context.scene.frame_set(FRAME_START)


def _render_frames() -> None:
    """Render every frame to PNG.  This is slow — expect ~30 s on a bench GPU."""
    bpy.ops.render.render(animation=True)


def _encode_mp4() -> None:
    """
    Encode PNGs → MP4 using ffmpeg if available on PATH.
    Falls back gracefully with a message if ffmpeg is not installed.
    """
    import subprocess
    pattern = os.path.join(FRAME_DIR, "frame_%04d.png")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", pattern,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        OUTPUT_MP4,
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"[record] viewport.mp4 written to {OUTPUT_MP4}")
    except FileNotFoundError:
        print("[record] ffmpeg not found — frames are in", FRAME_DIR)
        print("[record] Run manually: ffmpeg -framerate 30 -i frame_%04d.png -c:v libx264 viewport.mp4")
    except subprocess.CalledProcessError as e:
        print(f"[record] ffmpeg failed: {e}")


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _ensure_dirs()
    _set_render_settings()
    _keyframe_sun_orbit()
    _render_frames()
    _encode_mp4()
    print("[record] Done. Review viewport.mp4 before committing.")


if __name__ == "__main__":
    main()
