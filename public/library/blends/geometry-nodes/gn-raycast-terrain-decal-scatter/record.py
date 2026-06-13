"""
record.py — Viewport animation recorder for gn-raycast-terrain-decal-scatter
Blender 5.1  |  Run AFTER blueprint.py  |  CC0 / Holoflow Studio
=================================================================================
Animates a slow camera orbit around the scatter terrain (frames 1–90, 3 s at 30 fps).
The decals are static — the arc reveals the surface-hugging alignment from multiple
angles, which is the single most important thing to show: every quad lies flush to
whatever slope lies beneath it.

Output: public/library/videos/geometry-nodes/gn-raycast-terrain-decal-scatter/viewport.mp4
"""

import bpy
import math
import os
from pathlib import Path
from mathutils import Euler

# ── Output path ───────────────────────────────────────────────────────────────
REPO_ROOT   = Path(__file__).resolve().parents[5]
OUTPUT_PATH = str(
    REPO_ROOT / "public" / "library" / "videos" /
    "geometry-nodes" / "gn-raycast-terrain-decal-scatter" / "viewport.mp4"
)
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

FPS          = 30
TOTAL_FRAMES = 90   # 3 s
CAM_RADIUS   = 4.2
CAM_HEIGHT   = 2.8
ARC_DEGREES  = 80   # total sweep angle for the camera orbit


def animate_camera() -> None:
    cam_ob = bpy.context.scene.camera
    if cam_ob is None:
        print("WARN: no scene camera found — skipping camera animation.")
        return

    cam_ob.animation_data_create()
    # Arc sweep: −40° → +40° around the Y axis
    start_a = math.radians(-ARC_DEGREES / 2 - 90)
    end_a   = math.radians( ARC_DEGREES / 2 - 90)

    for frame, angle in [(1, start_a), (TOTAL_FRAMES, end_a)]:
        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        z = CAM_HEIGHT
        cam_ob.location = (x, y, z)

        # Point toward terrain centre (origin)
        dx = -x
        dy = -y
        yaw   = math.atan2(dx, -dy)
        pitch = -math.atan2(z, math.sqrt(dx * dx + dy * dy)) + math.pi * 0.5
        cam_ob.rotation_euler = Euler((pitch, 0.0, yaw))

        cam_ob.keyframe_insert(data_path="location",       frame=frame)
        cam_ob.keyframe_insert(data_path="rotation_euler", frame=frame)

    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type  = 'AUTO_CLAMPED'
            kp.handle_right_type = 'AUTO_CLAMPED'


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 32
    scene.eevee.use_bloom = True          # catch emissive glow on decals
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps          = FPS
    scene.frame_start         = 1
    scene.frame_end           = TOTAL_FRAMES
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath = OUTPUT_PATH


def main() -> None:
    terrain = bpy.data.objects.get("terrain_mesh")
    scatter = bpy.data.objects.get("decal_scatter")
    if terrain is None or scatter is None:
        print("ERROR: terrain_mesh / decal_scatter not found. Run blueprint.py first.")
        return

    animate_camera()
    configure_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"Viewport animation written to:\n  {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
