"""
record.py — viewport animation render for gn-active-camera-billboard-sprite-webxr-hud

Produces: public/library/videos/geometry-nodes/gn-active-camera-billboard-sprite-webxr-hud/viewport.mp4

Technique being recorded
------------------------
Camera orbits 360 degrees around the 3×3 billboard sprite grid in 60 frames.
Each frame, the GN Active Camera node updates; all nine sprites auto-rotate to
face the lens. The .mp4 shows the billboard-to-camera relationship holding solid
through a full revolution — the only trustworthy proof the setup is correct.

Usage
-----
Open Blender 5.1 with blueprint.py already run (the scene must be built).
Then run this script from a Scripting workspace text block, or:
  blender --background --python blueprint.py --python record.py
"""

import bpy
import math
import os

# ── output path ────────────────────────────────────────────────────────────────
_REPO_ROOT   = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
OUTPUT_DIR   = os.path.join(_REPO_ROOT, "public", "library", "videos",
                            "geometry-nodes",
                            "gn-active-camera-billboard-sprite-webxr-hud")
OUTPUT_FILE  = os.path.join(OUTPUT_DIR, "viewport.mp4")

# ── render settings ────────────────────────────────────────────────────────────
FRAME_START  = 1
FRAME_END    = 60       # 2 seconds at 30 fps
ORBIT_RADIUS = 5.0      # metres from origin
ORBIT_HEIGHT = 1.8      # camera Z height
TOTAL_TURNS  = 1        # full 360° orbit over 60 frames

RENDER_WIDTH  = 1920
RENDER_HEIGHT = 1080
RENDER_FPS    = 30


def _setup_render() -> None:
    scn = bpy.context.scene
    scn.frame_start = FRAME_START
    scn.frame_end   = FRAME_END

    rd = scn.render
    rd.resolution_x   = RENDER_WIDTH
    rd.resolution_y   = RENDER_HEIGHT
    rd.fps            = RENDER_FPS
    rd.image_settings.file_format = "FFMPEG"
    rd.ffmpeg.format  = "MPEG4"
    rd.ffmpeg.codec   = "H264"
    rd.ffmpeg.constant_rate_factor = "HIGH"
    rd.filepath       = OUTPUT_FILE

    # Workbench for fast OpenGL-style viewport render
    scn.display.shading.type = "SOLID"
    scn.display.shading.color_type = "MATERIAL"
    scn.display.shading.show_shadows = True


def _keyframe_camera_orbit() -> None:
    """
    Animate the camera orbiting around the origin at ORBIT_RADIUS.
    The camera always points at (0,0,0) via its rotation — updated per frame.
    """
    scn     = bpy.context.scene
    cam_ob  = scn.camera
    if cam_ob is None:
        raise RuntimeError("No scene camera found. Run blueprint.py first.")

    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = t * 2 * math.pi * TOTAL_TURNS

        # Camera position on the orbit circle
        x = math.sin(angle) * ORBIT_RADIUS
        y = -math.cos(angle) * ORBIT_RADIUS  # start behind (-Y) then orbit
        z = ORBIT_HEIGHT

        cam_ob.location = (x, y, z)
        cam_ob.keyframe_insert("location", frame=frame)

        # Camera always looks at origin: compute Euler from direction vector
        direction = (-x, -y, -z)
        magnitude = math.sqrt(sum(v*v for v in direction))
        if magnitude < 1e-6:
            continue
        dx, dy, dz = (v / magnitude for v in direction)
        pitch = math.asin(dz)              # elevation angle
        yaw   = math.atan2(dx, -dy)        # azimuth (Blender Z-up)
        cam_ob.rotation_euler = (math.pi * 0.5 - pitch, 0, yaw)
        cam_ob.keyframe_insert("rotation_euler", frame=frame)


def _render() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    _setup_render()
    _keyframe_camera_orbit()
    bpy.context.scene.frame_set(1)
    bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
    print(f"[record] Wrote viewport animation → {OUTPUT_FILE}")


if __name__ == "__main__":
    _render()
