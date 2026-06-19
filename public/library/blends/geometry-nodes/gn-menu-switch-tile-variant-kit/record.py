"""
record.py — Viewport animation for gn-menu-switch-tile-variant-kit
Output: public/library/videos/geometry-nodes/gn-menu-switch-tile-variant-kit/viewport.mp4

160 frames at 24 fps ≈ 6.7 seconds
  Frames   1–40:   Flat    — camera arc NE→SE
  Frames  41–80:   Raised  — camera arc SE→SW
  Frames  81–120:  Diamond — camera arc SW→NW
  Frames 121–160:  Grate   — camera arc NW→NE

Camera orbits at radius 2.8 m, Z=1.5 m, always aimed at the tile centre.
Each 40-frame block: one variant held constant while the camera sweeps 90°.
"""

import bpy
import math
import os
import sys

# Allow sibling blueprint.py to be imported when both files share a directory
_here = os.path.dirname(os.path.abspath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)
from blueprint import build_scene, VARIANT_NAMES

TOTAL_FRAMES      = 160
FPS               = 24
FRAMES_PER_BLOCK  = TOTAL_FRAMES // len(VARIANT_NAMES)   # 40
ORBIT_RADIUS      = 2.8
ORBIT_Z           = 1.5
ORBIT_START_DEG   = 45.0    # NE start angle


def _add_camera():
    cd  = bpy.data.cameras.new("RecordCam")
    cam = bpy.data.objects.new("RecordCam", cd)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def _cam_pose(cam, angle_deg):
    """Position camera on the orbit circle and aim at the world origin."""
    a = math.radians(angle_deg)
    cam.location = (
        ORBIT_RADIUS * math.cos(a),
        ORBIT_RADIUS * math.sin(a),
        ORBIT_Z,
    )
    # Euler that keeps the camera looking at (0, 0, 0)
    yaw   = math.atan2(-cam.location[1], -cam.location[0]) + math.radians(90)
    pitch = math.radians(60)
    cam.rotation_euler = (pitch, 0, yaw)


def _add_sun():
    ld = bpy.data.lights.new("Sun", type="SUN")
    ld.energy = 3.0
    lo = bpy.data.objects.new("Sun", ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.rotation_euler = (math.radians(50), 0, math.radians(30))


def run():
    obj, mod = build_scene()

    cam = _add_camera()
    _add_sun()

    sc             = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = TOTAL_FRAMES
    sc.render.fps  = FPS

    tree   = mod.node_group
    var_id = next(
        s.identifier for s in tree.interface.items_tree
        if getattr(s, "name", "") == "Tile Variant"
    )

    for vi, _v_name in enumerate(VARIANT_NAMES):
        f_start     = vi * FRAMES_PER_BLOCK + 1
        f_end       = (vi + 1) * FRAMES_PER_BLOCK
        angle_start = ORBIT_START_DEG + vi * 90
        angle_end   = angle_start + 90

        # Keyframe variant switch at start of each block
        sc.frame_set(f_start)
        mod[var_id] = vi
        mod.keyframe_insert(data_path=f'["{var_id}"]', frame=f_start)
        if vi > 0:
            mod[var_id] = vi
            mod.keyframe_insert(data_path=f'["{var_id}"]', frame=f_start - 1)

        # Keyframe camera at both ends of the 90° arc
        for f, ang in [(f_start, angle_start), (f_end, angle_end)]:
            sc.frame_set(f)
            _cam_pose(cam, ang)
            cam.keyframe_insert(data_path="location",       frame=f)
            cam.keyframe_insert(data_path="rotation_euler", frame=f)

    # ── Render output ──────────────────────────────────────────────────────────
    out_dir = os.path.normpath(
        os.path.join(_here, "..", "..", "..", "videos",
                     "geometry-nodes", "gn-menu-switch-tile-variant-kit")
    )
    os.makedirs(out_dir, exist_ok=True)

    sc.render.filepath                       = os.path.join(out_dir, "viewport")
    sc.render.image_settings.file_format     = "FFMPEG"
    sc.render.ffmpeg.format                  = "MPEG4"
    sc.render.ffmpeg.codec                   = "H264"
    sc.render.resolution_x                   = 1920
    sc.render.resolution_y                   = 1080
    sc.render.resolution_percentage          = 50

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"Viewport animation → {out_dir}/viewport.mp4")


if __name__ == "__main__":
    run()
