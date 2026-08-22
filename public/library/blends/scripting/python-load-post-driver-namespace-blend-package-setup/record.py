"""
record.py — viewport animation recorder
Topic  : scripting / python-load-post-driver-namespace-blend-package-setup
Blender: 5.1  |  CC0

Outputs 120-frame (5 s @ 24 fps) viewport render showing the hs_breathe
driver oscillating the crystal's Z scale. Run AFTER blueprint.py has been
executed and the scene is live.

Outputs: public/library/videos/scripting/
         python-load-post-driver-namespace-blend-package-setup/viewport.mp4
"""

import math
import os
import bpy

OUTPUT_PATH  = "//../../videos/scripting/" \
               "python-load-post-driver-namespace-blend-package-setup/viewport"
FRAME_START  = 1
FRAME_END    = 120
FPS          = 24
RES_X        = 1280
RES_Y        = 720


def ensure_output_dir() -> None:
    rel = OUTPUT_PATH + ".mp4"
    abs_path = bpy.path.abspath(rel)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)


def configure_viewport_render(scene: bpy.types.Scene) -> None:
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.resolution_percentage = 100

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.audio_codec          = "NONE"
    scene.render.filepath = OUTPUT_PATH


def add_orbit_animation(cam: bpy.types.Object) -> None:
    """Slowly orbit the camera around the crystal for 120 frames."""
    radius = 5.0
    height = 2.5
    for f in range(FRAME_START, FRAME_END + 1):
        t     = (f - 1) / (FRAME_END - FRAME_START)
        angle = t * math.pi * 0.4
        cam.location = (
            radius * math.sin(angle),
            -radius * math.cos(angle),
            height,
        )
        cam.keyframe_insert("location", frame=f)

    if not cam.constraints.get("TrackTo"):
        empty = bpy.data.objects.new("cam_target", None)
        bpy.context.scene.collection.objects.link(empty)
        empty.location = (0, 0, 0.45)
        ct = cam.constraints.new("TRACK_TO")
        ct.target       = empty
        ct.track_axis   = "TRACK_NEGATIVE_Z"
        ct.up_axis      = "UP_Y"


def main() -> None:
    scene = bpy.context.scene

    cam = scene.camera
    if cam is None:
        bpy.ops.object.camera_add(location=(5.0, -4.0, 2.5))
        cam = bpy.context.active_object
        scene.camera = cam

    ensure_output_dir()
    configure_viewport_render(scene)
    add_orbit_animation(cam)

    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"[record.py] Done → {bpy.path.abspath(OUTPUT_PATH + '.mp4')}")


if __name__ == "__main__":
    main()
