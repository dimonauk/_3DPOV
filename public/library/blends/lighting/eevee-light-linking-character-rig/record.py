"""
record.py — viewport animation for light_linking_hero.blend
Blender 5.1  |  CC0

Animation: 90 frames @ 30 fps (3 seconds).
Camera orbits 30° around character (left to right arc) while two custom
properties animate the rim light energy: OFF for frames 1–30, ramping ON
from 30–60, fully ON for 60–90.  This before/after arc is the single most
instructive demonstration of what light-linking a rim light achieves —
the backdrop stays dark throughout while the character silhouette changes.

Run:
  blender light_linking_hero.blend --background --python record.py
Output:
  public/library/videos/lighting/eevee-light-linking-character-rig/viewport.mp4
"""

import bpy
import os
import math
from mathutils import Euler

OUTPUT_DIR   = "public/library/videos/lighting/eevee-light-linking-character-rig"
FRAME_START  = 1
FRAME_END    = 90
FPS          = 30


def keyframe(obj, data_path: str, frame: int):
    obj.keyframe_insert(data_path=data_path, frame=frame)


def setup_camera_orbit(cam):
    """Slow 30° orbit: camera sweeps left to right around the character."""
    cam.rotation_mode = 'XYZ'
    scene = bpy.context.scene

    positions = [
        (FRAME_START,       ( 0.55, -4.10, 1.25), (math.radians(80), 0, math.radians(7))),
        (FRAME_END // 2,    ( 0.00, -4.25, 1.25), (math.radians(80), 0, 0)),
        (FRAME_END,         (-0.55, -4.10, 1.25), (math.radians(80), 0, math.radians(-7))),
    ]
    for frame, loc, rot in positions:
        scene.frame_set(frame)
        cam.location       = loc
        cam.rotation_euler = Euler(rot)
        keyframe(cam, "location",       frame)
        keyframe(cam, "rotation_euler", frame)

    # Smooth interpolation
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'


def setup_rim_energy_animation():
    """
    Rim light energy: 0 → 0 → 380 → 380 across the three sections.
    This shows: flat-lit character, then dramatic rim wrapping the silhouette.
    The backdrop remains dark throughout, demonstrating the link in action.
    """
    scene = bpy.context.scene
    rim   = bpy.data.objects.get("light_rim")
    if not rim:
        print("Warning: light_rim not found — skipping energy animation")
        return

    energy_keys = [
        (1,  0.0),
        (30, 0.0),
        (60, 380.0),
        (90, 380.0),
    ]
    for frame, val in energy_keys:
        scene.frame_set(frame)
        rim.data.energy = val
        rim.data.keyframe_insert(data_path="energy", frame=frame)


def configure_render():
    scene = bpy.context.scene
    scene.render.engine            = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x      = 1920
    scene.render.resolution_y      = 1080
    scene.render.resolution_percentage = 100
    scene.render.fps               = FPS
    scene.frame_start              = FRAME_START
    scene.frame_end                = FRAME_END

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scene.render.filepath                    = os.path.join(OUTPUT_DIR, "viewport")
    scene.render.image_settings.file_format  = 'FFMPEG'
    scene.render.ffmpeg.format               = 'MPEG4'
    scene.render.ffmpeg.codec                = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec          = 'NONE'


def main():
    cam = bpy.context.scene.camera
    if not cam:
        print("No camera — run blueprint.py first")
        return

    setup_camera_orbit(cam)
    setup_rim_energy_animation()
    configure_render()

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"✓  viewport.mp4 → {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
