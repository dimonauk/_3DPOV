"""
record.py — viewport animation for the Steiner Roman Surface poi head.
Run AFTER blueprint.py has saved hf_roman_surface.blend.

Opens the .blend, configures a 192-frame Workbench render (Vertex-Colour
mode), orbits the camera 360° and interpolates through the three shape keys
so the viewer sees all morphs and the three double-line segments.
Output → public/library/videos/scripting/
           python-numpy-roman-surface-steiner-rp2-whitney-umbrella-poi-head-webxr/
             viewport.mp4
"""

import bpy
import math
from pathlib import Path

HERE    = Path(__file__).parent
BLEND   = HERE / "hf_roman_surface.blend"
OUT_DIR = (
    Path(__file__).parents[4]
    / "videos/scripting"
    / "python-numpy-roman-surface-steiner-rp2-whitney-umbrella-poi-head-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "viewport"

FPS          = 24
TOTAL_FRAMES = 192   # 8 s: orbit + all three shape-key demos
ORBIT_TURNS  = 1.33  # 1⅓ rotations — exposes all three double-line segments
CAM_RADIUS   = 0.35  # metres
CAM_ELEV_DEG = 32

# Shape-key morph schedule: (name, start_frame, peak_frame, end_frame)
SK_PHASES = [
    ("SK_Oblate",   42,  60,  80),
    ("SK_Elongate", 100, 120, 140),
    ("SK_Compact",  155, 168, 180),
]


def _ease(t: float) -> float:
    """Smoothstep — keeps shape-key transitions from feeling abrupt."""
    return t * t * (3.0 - 2.0 * t)


def build_anim():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES - 1

    # ── Workbench: vertex-colour passthrough ─────────────────────────────
    scene.render.engine               = "BLENDER_WORKBENCH"
    scene.display.shading.light       = "MATCAP"
    scene.display.shading.color_type  = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps          = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = str(OUT_FILE)

    # ── Locate the object ─────────────────────────────────────────────────
    obj = bpy.data.objects.get("hf_roman_surface")
    if obj is None:
        raise RuntimeError("hf_roman_surface not found in scene")

    # ── Camera empty (orbit pivot) ────────────────────────────────────────
    pivot = bpy.data.objects.new("_orbit_pivot", None)
    scene.collection.objects.link(pivot)
    pivot.location = (0.0, 0.0, 0.0)

    cam_data = bpy.data.cameras.new("_orbit_cam")
    cam_data.lens = 85.0
    cam_obj = bpy.data.objects.new("_orbit_cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    elev_rad  = math.radians(CAM_ELEV_DEG)
    cam_y     = -CAM_RADIUS * math.cos(elev_rad)
    cam_z     =  CAM_RADIUS * math.sin(elev_rad)
    cam_obj.location = (0.0, cam_y, cam_z)
    cam_obj.parent   = pivot

    track = cam_obj.constraints.new("TRACK_TO")
    track.target    = obj
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis    = "UP_Y"

    # ── Orbit keyframes ───────────────────────────────────────────────────
    for frame in range(TOTAL_FRAMES):
        t     = frame / (TOTAL_FRAMES - 1)
        angle = ORBIT_TURNS * 2.0 * math.pi * t
        pivot.rotation_euler = (0.0, 0.0, angle)
        pivot.keyframe_insert("rotation_euler", frame=frame)

    for fcurve in pivot.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"

    # ── Shape-key morph keyframes ─────────────────────────────────────────
    skeys = obj.data.shape_keys
    if skeys is None:
        print("[record] Warning: no shape keys found on object")
        return

    all_sk_names = [b.name for b in skeys.key_blocks]

    def _set_all_zero(frame):
        for b in skeys.key_blocks:
            if b.name == "Basis":
                continue
            b.value = 0.0
            b.keyframe_insert("value", frame=frame)

    _set_all_zero(0)

    for sk_name, f_start, f_peak, f_end in SK_PHASES:
        if sk_name not in all_sk_names:
            continue
        sk = skeys.key_blocks[sk_name]

        # zero → peak → zero within phase window
        for frame, val in [(f_start, 0.0), (f_peak, 1.0), (f_end, 0.0)]:
            _set_all_zero(frame)
            sk.value = val
            sk.keyframe_insert("value", frame=frame)

    # Apply easing to all shape-key FCurves
    if skeys.animation_data and skeys.animation_data.action:
        for fc in skeys.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"

    # ── Render ────────────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True)
    print(f"[Roman record] → {OUT_FILE}.mp4")


if __name__ == "__main__":
    build_anim()
