"""
record.py — Viewport animation render for the Sprott F Attractor
Outputs: public/library/videos/scripting/
         python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-
         saddle-focus-origin-rk4-bishop-tube-poi-webxr/viewport.mp4

Run AFTER blueprint.py has built the scene.
Duration: 300 frames @ 30 fps = 10 seconds.

Camera orbits the attractor while shape keys cycle:
  frames   0– 74   Basis      (a=0.50 canonical chaos)
  frames  75–149   SK_LoA     (a=0.25 weaker, broader orbit)
  frames 150–224   SK_HiA     (a=0.75 tighter spiral)
  frames 225–299   SK_NearCons (a=0.92 near-conservative, loose)
"""

import bpy
import math
import os

TOTAL_FRAMES = 300
FPS          = 30
CAM_DIST     = 8.0      # metres — Sprott F spans ≈ 6 units in x
CAM_ELEV     = 0.45     # radians above horizontal
OBJ_NAME     = "SprottF_Attractor"

VIDEO_PATH = os.path.join(
    "public", "library", "videos", "scripting",
    "python-numpy-sprott-f-attractor-1994-quadratic-jerk-shilnikov-"
    "saddle-focus-origin-rk4-bishop-tube-poi-webxr",
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

    # EEVEE Next — faster than Cycles, viewport-quality glow
    scene.render.engine          = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom        = True
    scene.eevee.bloom_intensity  = 0.32
    scene.eevee.bloom_radius     = 5.5
    scene.eevee.bloom_threshold  = 0.8

    # Output
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

    # ── camera orbit keyframes ─────────────────────────────────────────────
    full_rotation = 2 * math.pi
    for f in range(1, TOTAL_FRAMES + 1):
        t     = (f - 1) / (TOTAL_FRAMES - 1)
        angle = t * full_rotation * 1.25   # 1.25 × orbit
        set_cam(f, angle, CAM_ELEV, CAM_DIST)

    # ── camera target via track-to constraint ──────────────────────────────
    cam = bpy.data.objects["Camera"]
    if not any(c.type == "TRACK_TO" for c in cam.constraints):
        tc = cam.constraints.new("TRACK_TO")
        tc.target    = ob
        tc.track_axis = "TRACK_NEGATIVE_Z"
        tc.up_axis    = "UP_Y"

    # ── shape key animation ────────────────────────────────────────────────
    # 4 phases of 75 frames each, hard-cut at boundaries
    phases = [
        (1,   "Basis"),
        (76,  "SK_LoA"),
        (151, "SK_HiA"),
        (226, "SK_NearCons"),
    ]
    for start_f, sk_name in phases:
        set_sk(start_f, ob, sk_name)
        # Hold the shape key one frame before the next cut
        end_f = start_f + 73
        if end_f <= TOTAL_FRAMES:
            set_sk(end_f, ob, sk_name)

    bpy.ops.render.render(animation=True)
    print(f"[SprottF record] Rendered {TOTAL_FRAMES} frames → {VIDEO_PATH}")


build_record()
