"""
record.py — Viewport animation render for the Halton/Fibonacci/Random scatter demo.
Outputs: public/library/videos/scripting/
         python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr/
         viewport.mp4

Animation:
  F 001-060   Halton cluster: 360° orbit, camera flies around the blue sphere.
  F 061-120   Fibonacci cluster: orbit with a slow pull-back to reveal the sunflower lattice.
  F 121-180   All three side-by-side: camera rises above and tilts down for a top view.

Run from Blender's Text Editor after blueprint.py has created the scene.
"""

import bpy
import math

OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr/"
)
FPS         = 24
FRAMES      = 180
CLUSTER_GAP = 5.0
CAM_DIST    = 6.5     # orbit radius
CAM_HEIGHT  = 1.2     # height during single-cluster orbits


def _ensure_camera() -> bpy.types.Object:
    if "HF_RecCam" not in bpy.data.objects:
        bpy.ops.object.camera_add(location=(CAM_DIST, 0, CAM_HEIGHT))
        cam = bpy.context.object
        cam.name = "HF_RecCam"
    else:
        cam = bpy.data.objects["HF_RecCam"]
    bpy.context.scene.camera = cam
    return cam


def _ensure_light() -> None:
    if "HF_RecLight" not in bpy.data.objects:
        bpy.ops.object.light_add(type="SUN", location=(5, -5, 8))
        bpy.context.object.name = "HF_RecLight"
        bpy.context.object.data.energy = 3.0


def _point_camera_at(cam: bpy.types.Object, target: tuple) -> None:
    """Aim camera toward (tx, ty, tz) using a Track-To constraint (no bpy.ops needed)."""
    if "TrackTo" not in cam.constraints:
        tc = cam.constraints.new("TRACK_TO")
        tc.name = "TrackTo"
        tc.track_axis = "TRACK_NEGATIVE_Z"
        tc.up_axis    = "UP_Y"
    # place a temporary Empty as the target
    if "HF_TrackTarget" not in bpy.data.objects:
        bpy.ops.object.empty_add(location=target)
        e = bpy.context.object
        e.name = "HF_TrackTarget"
    else:
        e = bpy.data.objects["HF_TrackTarget"]
        e.location = target
    cam.constraints["TrackTo"].target = e


def _orbit_keyframes(cam: bpy.types.Object,
                     center_y: float,
                     radius: float,
                     height: float,
                     frame_start: int,
                     frame_end: int,
                     angle_start: float = 0.0,
                     angle_end: float = 2 * math.pi) -> None:
    """Insert location keyframes for a circular orbit around (0, center_y, 0)."""
    n_keys = 12
    for i in range(n_keys + 1):
        t     = i / n_keys
        angle = angle_start + t * (angle_end - angle_start)
        frame = int(frame_start + t * (frame_end - frame_start))
        cam.location = (
            radius * math.cos(angle),
            center_y + radius * math.sin(angle),
            height,
        )
        cam.keyframe_insert("location", frame=frame)


def main() -> None:
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES

    # render settings
    sc.render.engine              = "BLENDER_EEVEE_NEXT"
    sc.render.fps                 = FPS
    sc.render.resolution_x        = 1920
    sc.render.resolution_y        = 1080
    sc.render.filepath            = OUTPUT_DIR
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format       = "MPEG4"
    sc.render.ffmpeg.codec        = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"

    cam = _ensure_camera()
    _ensure_light()
    _point_camera_at(cam, (0, -CLUSTER_GAP, 0))

    # Phase 1: orbit Halton cluster (blue)
    _orbit_keyframes(cam, -CLUSTER_GAP, CAM_DIST, CAM_HEIGHT, 1, 60)

    # Phase 2: orbit Fibonacci cluster (gold)  — camera re-aims mid-shot
    bpy.data.objects["HF_TrackTarget"].location = (0, 0, 0)
    bpy.data.objects["HF_TrackTarget"].keyframe_insert("location", frame=60)
    _orbit_keyframes(cam, 0.0, CAM_DIST, CAM_HEIGHT, 61, 120)

    # Phase 3: rise above all three clusters for a top-down comparison
    cam.location = (0, 0, 14)
    cam.keyframe_insert("location", frame=120)
    cam.location = (0, 0, 14)
    cam.keyframe_insert("location", frame=180)
    bpy.data.objects["HF_TrackTarget"].location = (0, 0, 0)
    bpy.data.objects["HF_TrackTarget"].keyframe_insert("location", frame=120)
    bpy.data.objects["HF_TrackTarget"].keyframe_insert("location", frame=180)

    bpy.ops.render.render(animation=True)
    print(f"[HF] record.py → {OUTPUT_DIR}viewport.mp4")


main()
