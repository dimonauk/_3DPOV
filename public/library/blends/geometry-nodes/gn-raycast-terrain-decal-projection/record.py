"""
record.py — Viewport Animation Recorder
GN Raycast — Terrain Decal Projection
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py (terrain_decal.blend must be open or passed as arg).
Renders a 120-frame camera orbit that sweeps 360° around the terrain + stamps
at 32° elevation, starting at front-left and completing the loop.

At frame 1 the camera is south-east of the terrain; by frame 120 it has
completed the full orbit.  The stamps conforming to the hillsides and the
missing patches on steep cliff-faces are visible throughout.

Usage:
  blender --background terrain_decal.blend --python record.py
"""

import bpy
import math
import os

_DIR      = os.path.dirname(os.path.abspath(__file__))
_REPO     = os.path.abspath(os.path.join(_DIR, "..", "..", "..", "..", ".."))
VIDEO_DIR = os.path.join(
    _REPO, "public", "library", "videos",
    "geometry-nodes", "gn-raycast-terrain-decal-projection",
)
VIDEO_PATH = os.path.join(VIDEO_DIR, "viewport.mp4")

FRAME_START = 1
FRAME_END   = 120
FPS         = 30
RES_X       = 1920
RES_Y       = 1080
CAM_DIST    = 11.0           # orbit radius (m)
CAM_ELEV    = math.radians(32)   # elevation above XY plane


def _orbit_camera():
    """Create an orbit camera with per-frame location + rotation keyframes."""
    cam_data      = bpy.data.cameras.new("RC_RecordCam")
    cam_data.type = 'PERSP'
    cam_data.lens = 38.0
    cam_ob        = bpy.data.objects.new("RC_RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    cos_e = math.cos(CAM_ELEV)
    sin_e = math.sin(CAM_ELEV)

    for f in range(FRAME_START, FRAME_END + 1):
        frac  = (f - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = frac * 2.0 * math.pi
        x = math.sin(angle) * CAM_DIST * cos_e
        y = -math.cos(angle) * CAM_DIST * cos_e
        z = CAM_DIST * sin_e

        cam_ob.location = (x, y, z)

        # Aim at origin: rotation so -Z of camera points at (0,0,0)
        dx, dy, dz = -x, -y, -z
        rx = math.atan2(math.hypot(dx, dy), -dz) + math.pi
        rz = math.atan2(dx, dy)
        cam_ob.rotation_euler = (rx, 0.0, rz)

        cam_ob.keyframe_insert("location",       frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)


def _configure_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    os.makedirs(VIDEO_DIR, exist_ok=True)
    scene.render.filepath = VIDEO_PATH


def main():
    _orbit_camera()
    _configure_render()
    bpy.ops.render.render(animation=True, use_viewport=False)
    print(f"[RC-record] → {VIDEO_PATH}")


if __name__ == "__main__":
    main()
