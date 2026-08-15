"""
record.py — viewport animation for the Hyperbolic {5,4} Tiling stage floor.
Run AFTER blueprint.py has saved hf_hyp_tiling_5_4.blend.

Renders a 180-frame Workbench animation in Vertex-Colour mode:
  • Camera orbits 30° above the stage floor looking down
  • Shape keys cycle: Dome → Bowl → Ripple → back to Flat
Output → public/library/videos/scripting/
           python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr/
             viewport.mp4
"""

import bpy, math
from pathlib import Path

HERE    = Path(__file__).parent
BLEND   = HERE / "hf_hyp_tiling_5_4.blend"
OUT_DIR = (
    Path(__file__).parents[4]
    / "videos/scripting"
    / "python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "viewport"

FPS          = 24
TOTAL_FRAMES = 180     # 7.5 s total
ORBIT_TURNS  = 0.75    # less than one full orbit to emphasise the pattern
CAM_ELEV_DEG = 35      # camera elevation above the floor

# (name, start_frame, peak_frame, end_frame)
SK_PHASES = [
    ("SK_Dome",   30,  55,  80),
    ("SK_Bowl",   90, 115, 140),
    ("SK_Ripple", 150, 162, 175),
]


def _ease(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def build_anim():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES - 1

    # Workbench: Vertex Colour mode (best for showcasing tiling pattern)
    scene.render.engine            = "BLENDER_WORKBENCH"
    scene.display.shading.light    = "FLAT"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x     = 1920
    scene.render.resolution_y     = 1080
    scene.render.fps              = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format    = "MPEG4"
    scene.render.ffmpeg.codec     = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath         = str(OUT_FILE)

    # Stage floor object
    obj = next((o for o in scene.objects if o.get("holoflow:category") == "stage-floor"), None)
    if obj is None:
        obj = scene.objects[0]

    # Track-to target at scene centre
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    target = bpy.context.active_object
    target.name = "TilingTarget"

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    elev     = math.radians(CAM_ELEV_DEG)
    cam_dist = 3.0    # metres (stage floor radius = 1.2 m)

    ttc = cam_obj.constraints.new("TRACK_TO")
    ttc.target     = target
    ttc.track_axis = "TRACK_NEGATIVE_Z"
    ttc.up_axis    = "UP_Y"

    sk_dict = {}
    if obj.data.shape_keys:
        for sk in obj.data.shape_keys.key_blocks:
            sk_dict[sk.name] = sk

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

    # Reset all SKs to 0
    for skn in [p[0] for p in SK_PHASES]:
        _set_sk(0, skn, 0.0)

    # Orbit keyframes
    for f in range(0, TOTAL_FRAMES, 6):
        angle = 2 * math.pi * ORBIT_TURNS * f / TOTAL_FRAMES
        _set_cam(f, angle)

    # Shape-key triangle profiles
    for sk_name, f_start, f_peak, f_end in SK_PHASES:
        for f in range(f_start, f_peak + 1):
            t = (f - f_start) / max(1, f_peak - f_start)
            _set_sk(f, sk_name, _ease(t))
        for f in range(f_peak, f_end + 1):
            t = (f - f_peak) / max(1, f_end - f_peak)
            _set_sk(f, sk_name, 1.0 - _ease(t))
        _set_sk(f_end + 1, sk_name, 0.0)

    bpy.ops.render.render(animation=True)
    print(f"[holoflow] Rendered → {OUT_FILE}.mp4")


if __name__ == "__main__":
    build_anim()
