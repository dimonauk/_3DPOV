"""
record.py — Deform Curves on Surface: viewport-animation render
Blender 5.1 · CC0 · Holoflow Studio

Run AFTER blueprint.py. Renders a 90-frame EEVEE viewport animation that:
  • Frames  1–30: head tilts forward 25 ° while hair strands track the scalp.
  • Frames 31–60: head returns to rest; hair springs back.
  • Frames 61–90: slow orbit around the posed frame so the 3-D tracking is legible.

Output: public/library/videos/geometry-nodes/gn-deform-curves-on-surface-vrm-hair/viewport.mp4
"""

import bpy
import math
import os

# ── Render parameters ─────────────────────────────────────────────────────────
FRAME_START   = 1
FRAME_END     = 90
RESOLUTION_X  = 1920
RESOLUTION_Y  = 1080
OUTPUT_DIR    = "//../../videos/geometry-nodes/gn-deform-curves-on-surface-vrm-hair/"
MP4_FILENAME  = "viewport"
CAM_DIST      = 0.40   # metres — tight head-and-shoulders framing
CAM_ELEV      = 0.06   # slight upward tilt
ORBIT_START   = 60     # frame at which the camera orbit begins
ORBIT_DEG     = 120    # total orbit degrees over frames 60–90


def _setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = RESOLUTION_X
    sc.render.resolution_y    = RESOLUTION_Y
    sc.render.fps             = 30
    sc.frame_start            = FRAME_START
    sc.frame_end              = FRAME_END
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    out = os.path.join(
        os.path.dirname(bpy.data.filepath),
        "..", "..", "videos",
        "geometry-nodes", "gn-deform-curves-on-surface-vrm-hair",
        MP4_FILENAME,
    )
    sc.render.filepath = out


def _setup_camera() -> bpy.types.Object:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("HF_Cam"):
            bpy.data.objects.remove(ob, do_unlink=True)

    cam_data       = bpy.data.cameras.new("HF_Cam")
    cam_data.lens  = 85   # portrait focal length — flattering for a head shot
    cam            = bpy.data.objects.new("HF_Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    cam.animation_data_create()
    cam.animation_data.action = bpy.data.actions.new("HF_CamOrbit")

    # Frames 1–59: fixed front view
    for frame in (1, 59):
        cam.location       = (0, -CAM_DIST, CAM_ELEV)
        cam.rotation_euler = (math.radians(88), 0, 0)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    # Frames 60–90: orbit 120° so viewer sees the 3-D hair tracking
    for i in range(31):
        frame = ORBIT_START + i
        frac  = i / 30
        angle = math.radians(frac * ORBIT_DEG)
        cam.location = (
            math.sin(angle) * CAM_DIST,
            -math.cos(angle) * CAM_DIST,
            CAM_ELEV,
        )
        cam.rotation_euler = (math.radians(88), 0, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    return cam


def main() -> None:
    _setup_render()
    _setup_camera()

    # Light: simple area lamp above-front for studio look
    for ob in list(bpy.data.objects):
        if ob.name.startswith("HF_Light"):
            bpy.data.objects.remove(ob, do_unlink=True)
    light_data          = bpy.data.lights.new("HF_Light", 'AREA')
    light_data.energy   = 120
    light_data.size     = 0.4
    light_ob            = bpy.data.objects.new("HF_Light", light_data)
    bpy.context.collection.objects.link(light_ob)
    light_ob.location      = (0.3, -0.25, 0.45)
    light_ob.rotation_euler = (math.radians(40), 0, math.radians(15))

    bpy.ops.render.render(animation=True)
    print("[HF] viewport.mp4 rendered to", bpy.context.scene.render.filepath)


if __name__ == "__main__":
    main()
