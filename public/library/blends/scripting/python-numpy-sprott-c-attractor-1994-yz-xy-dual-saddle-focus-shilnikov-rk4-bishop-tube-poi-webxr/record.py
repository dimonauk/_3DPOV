"""
record.py — Viewport animation render for the Sprott C Attractor
Outputs:  public/library/videos/scripting/
          python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-
          shilnikov-rk4-bishop-tube-poi-webxr/viewport.mp4

Run AFTER blueprint.py has built the scene.
Duration: 300 frames @ 30 fps = 10 seconds.

Camera orbits the attractor while shape keys cycle:
  frames  0–59   Basis     (c=1.0 canonical)
  frames 60–119  SK_cLow   (c=0.7 contracted)
  frames 120–179 SK_cHigh  (c=1.5 expanded)
  frames 180–239 SK_cWide  (c=2.0 near-bifurcation)
  frames 240–299 return to Basis (fade-back)
"""

import bpy
import math
import os

TOTAL_FRAMES = 300
FPS          = 30
CAM_DIST     = 4.5     # metres from origin — Sprott C fits in ≈ 4 m cube
CAM_ELEV     = 0.55    # radians above horizontal
OBJ_NAME     = "SprottC_Attractor"

# ── frame helpers ─────────────────────────────────────────────────────────────
def set_cam(frame: int, angle: float, elev: float, dist: float) -> None:
    cam = bpy.data.objects["Camera"]
    x   = dist * math.cos(elev) * math.cos(angle)
    y   = dist * math.cos(elev) * math.sin(angle)
    z   = dist * math.sin(elev)
    cam.location = (x, y, z)
    cam.keyframe_insert("location", frame=frame)


def set_sk(frame: int, ob: bpy.types.Object,
           sk_name: str, val: float = 1.0) -> None:
    """Set one shape-key value and insert keyframe."""
    keys = ob.data.shape_keys.key_blocks
    for k in keys:
        k.value = 0.0
    if sk_name in keys:
        keys[sk_name].value = val
    keys[sk_name].keyframe_insert("value", frame=frame)


# ── scene setup ───────────────────────────────────────────────────────────────
def build_record() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # EEVEE Next for fast viewport-grade render
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom = True
    scene.eevee.bloom_intensity = 0.28
    scene.eevee.bloom_radius    = 5.0

    # output path
    out_dir = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..", "..", "..",
        "videos", "scripting",
        "python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-"
        "shilnikov-rk4-bishop-tube-poi-webxr",
    )
    os.makedirs(out_dir, exist_ok=True)

    scene.render.filepath        = os.path.join(out_dir, "viewport")
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080

    # camera target: point at origin
    if "Camera" not in bpy.data.objects:
        bpy.ops.object.camera_add()
    cam = bpy.data.objects["Camera"]
    cam.data.lens = 85  # 85 mm for tight portrait-style composition

    # track-to constraint keeps camera looking at origin
    if "TrackTo" not in cam.constraints:
        tc = cam.constraints.new("TRACK_TO")
        tc.name = "TrackTo"
        tc.target = bpy.data.objects.get("Empty") or (
            bpy.ops.object.empty_add(location=(0, 0, 0))
            or bpy.context.active_object
        )
        tc.track_axis  = "TRACK_NEGATIVE_Z"
        tc.up_axis     = "UP_Y"

    # keyframe camera orbit: one full revolution over 300 frames
    N_CAM_KEYS = 9
    for i in range(N_CAM_KEYS + 1):
        fr    = int(i * TOTAL_FRAMES / N_CAM_KEYS) + 1
        angle = 2 * math.pi * i / N_CAM_KEYS
        set_cam(fr, angle, CAM_ELEV, CAM_DIST)

    # shape-key animation
    ob = bpy.data.objects.get(OBJ_NAME)
    if ob and ob.data.shape_keys:
        sk_schedule = [
            (1,   "Basis"),
            (60,  "SK_cLow"),
            (120, "SK_cHigh"),
            (180, "SK_cWide"),
            (240, "Basis"),
            (300, "Basis"),
        ]
        for fr, name in sk_schedule:
            set_sk(fr, ob, name, val=1.0)

    # render
    bpy.ops.render.render(animation=True)
    print(f"[record.py] Rendered {TOTAL_FRAMES} frames → {scene.render.filepath}")


if __name__ == "__main__":
    build_record()
