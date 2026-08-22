"""
record.py — viewport animation for the Boy Surface poi head.
Run AFTER blueprint.py has saved hf_boy_surface.blend.

Opens the .blend, configures a 180-frame Workbench render (Vertex-Colour
mode), orbits the camera 360° around the object, and interpolates through
the three shape keys so the viewer sees all three morphs.
Output → public/library/videos/scripting/
           python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr/
             viewport.mp4
"""

import bpy, math
from pathlib import Path

HERE    = Path(__file__).parent
BLEND   = HERE / "hf_boy_surface.blend"
OUT_DIR = (
    Path(__file__).parents[4]
    / "videos/scripting"
    / "python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "viewport"

FPS          = 24
TOTAL_FRAMES = 180   # 7.5 s: orbit + SK demos
ORBIT_TURNS  = 1.25  # 1.25 full rotations during sequence
CAM_ELEV_DEG = 28    # camera elevation above equatorial plane

# Shape-key phases: (name, start_frame, peak_frame, end_frame)
SK_PHASES = [
    ("SK_Oblate",  50,  70,  90),
    ("SK_Prolate", 100, 120, 140),
    ("SK_Tight",   150, 162, 175),
]


def _ease(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def build_anim():
    # ── Load scene ──────────────────────────────────────────────────────
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES - 1

    # ── Workbench: vertex-colour mode ───────────────────────────────────
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light    = "MATCAP"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps             = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath        = str(OUT_FILE)

    # ── Locate the poi-head object ───────────────────────────────────────
    obj = next((o for o in scene.objects if o.get("holoflow:category") == "poi-head"), None)
    if obj is None:
        obj = scene.objects[0]

    # ── Camera + tracking empty ──────────────────────────────────────────
    # Place a track-to target at the object's bounding-box centre.
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    target = bpy.context.active_object
    target.name = "BoyTarget"

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    elev = math.radians(CAM_ELEV_DEG)
    cam_dist = 0.24   # metres from origin

    ttc = cam_obj.constraints.new("TRACK_TO")
    ttc.target   = target
    ttc.track_axis  = "TRACK_NEGATIVE_Z"
    ttc.up_axis     = "UP_Y"

    # ── Keyframe: orbit + shape-key morphs ───────────────────────────────
    shape_keys = obj.data.shape_keys.key_blocks if obj.data.shape_keys else []
    sk_dict    = {sk.name: sk for sk in shape_keys}

    def _set_sk(frame, name, val):
        if name in sk_dict:
            sk_dict[name].value = val
            sk_dict[name].keyframe_insert("value", frame=frame)

    def _set_cam(frame, angle):
        cam_obj.location = (
            cam_dist * math.cos(angle) * math.cos(elev),
            cam_dist * math.sin(angle) * math.cos(elev),
            cam_dist * math.sin(elev),
        )
        cam_obj.keyframe_insert("location", frame=frame)

    # Reset all SKs to 0 at frame 0
    for skn in ["SK_Oblate", "SK_Prolate", "SK_Tight"]:
        _set_sk(0, skn, 0.0)

    # Orbit keyframes
    for f in range(0, TOTAL_FRAMES, 6):
        angle = 2 * math.pi * ORBIT_TURNS * f / TOTAL_FRAMES
        _set_cam(f, angle)

    # Shape-key ramp: triangle profile (up then down over the phase)
    for sk_name, f_start, f_peak, f_end in SK_PHASES:
        # Ramp up
        for f in range(f_start, f_peak + 1):
            t = (f - f_start) / max(1, f_peak - f_start)
            _set_sk(f, sk_name, _ease(t))
        # Ramp down
        for f in range(f_peak, f_end + 1):
            t = (f - f_peak) / max(1, f_end - f_peak)
            _set_sk(f, sk_name, 1.0 - _ease(t))
        # Ensure zero at end
        _set_sk(f_end + 1, sk_name, 0.0)

    # ── Render ───────────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] Rendered → {OUT_FILE}.mp4")


if __name__ == "__main__":
    build_anim()
