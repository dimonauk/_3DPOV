"""
record.py — Viewport animation render for the Sprott D Attractor
Outputs: public/library/videos/scripting/
         python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-
         xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr/viewport.mp4

Run AFTER blueprint.py has built the scene.
Duration: 300 frames @ 30 fps = 10 seconds.

Camera orbits the attractor while shape keys cycle to show the
b-parameter family (b controls the y²-coupling strength):

  frames   0– 74   Basis   (b=3.0  canonical Sprott D)
  frames  75–149   SK_LoB  (b=1.5  weaker y², contracted orbit)
  frames 150–224   SK_HiB  (b=5.0  stronger y², inflated attractor)
  frames 225–299   SK_ExB  (b=8.0  extreme y², large chaotic transients)
"""

import bpy
import math
import os

TOTAL_FRAMES = 300
FPS          = 30
CAM_DIST     = 10.0     # Sprott D spans roughly 6–8 units at b=3
CAM_ELEV     = 0.38     # radians above horizontal
OBJ_NAME     = "SprottD_Attractor"

VIDEO_PATH = os.path.join(
    "public", "library", "videos", "scripting",
    "python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-"
    "xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr",
    "viewport.mp4",
)


def set_cam(frame: int, angle: float, elev: float, dist: float) -> None:
    cam = bpy.data.objects["Camera"]
    x   = dist * math.cos(elev) * math.cos(angle)
    y   = dist * math.cos(elev) * math.sin(angle)
    z   = dist * math.sin(elev)
    cam.location = (x, y, z)
    cam.keyframe_insert("location", frame=frame)


def set_sk(frame: int, ob: bpy.types.Object, sk_name: str) -> None:
    """Activate one shape key at frame; zero all others."""
    keys = ob.data.shape_keys.key_blocks
    for k in keys:
        k.value = 0.0
        k.keyframe_insert("value", frame=frame)
    if sk_name in keys:
        keys[sk_name].value = 1.0
        keys[sk_name].keyframe_insert("value", frame=frame)


def build_record() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    scene.render.engine          = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom        = True
    scene.eevee.bloom_intensity  = 0.38
    scene.eevee.bloom_radius     = 6.0
    scene.eevee.bloom_threshold  = 0.75

    scene.render.filepath        = "//" + VIDEO_PATH
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.resolution_percentage = 100

    ob = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        raise RuntimeError("Run blueprint.py first to build the attractor.")

    # Shape-key schedule — step transitions (value = 1.0 at start of segment)
    schedule = [
        (  1, "Basis"),
        ( 75, "SK_LoB"),
        (150, "SK_HiB"),
        (225, "SK_ExB"),
    ]
    for (frame, sk) in schedule:
        set_sk(frame, ob, sk)
        if frame + 1 <= TOTAL_FRAMES:
            set_sk(frame + 1, ob, sk)   # hold for at least one frame

    # Camera orbit — full 360° over 300 frames
    for f in range(1, TOTAL_FRAMES + 1, 15):
        angle = 2 * math.pi * (f - 1) / TOTAL_FRAMES
        set_cam(f, angle, CAM_ELEV, CAM_DIST)

    scene.frame_set(1)
    bpy.ops.render.render(animation=True, use_viewport=False)
    print(f"[SprottD record] Rendered → {VIDEO_PATH}")


build_record()
