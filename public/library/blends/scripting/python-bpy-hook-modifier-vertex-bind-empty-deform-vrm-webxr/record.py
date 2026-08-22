"""
HookModifier earring — 360° orbit viewport capture
Blender 5.1 · CC0 · Holoflow Studio

Run:
  blender --background hf_hook_earring.blend --python record.py
Produces:
  /tmp/hf_hook_earring_orbit_####.png  (72 frames)
"""

import math
import bpy

RADIUS = 1.8
Z_CAM  = -0.55
FRAMES = 72
OUT    = "/tmp/hf_hook_earring_orbit_"


def orbit_camera() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES

    cam = scene.camera
    if cam is None:
        raise RuntimeError("No camera in scene — run blueprint.py first")

    scene.render.filepath        = OUT
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x    = 1080
    scene.render.resolution_y    = 1080
    scene.render.engine           = "BLENDER_WORKBENCH"

    for f in range(1, FRAMES + 1):
        angle = 2 * math.pi * (f - 1) / FRAMES
        cam.location = (
            RADIUS * math.sin(angle),
            -RADIUS * math.cos(angle),
            Z_CAM,
        )
        cam.rotation_euler = (math.radians(90), 0, angle)

        scene.frame_set(f)
        bpy.ops.render.render(write_still=True)
        print(f"[record] frame {f}/{FRAMES}")


if __name__ == "__main__":
    orbit_camera()
