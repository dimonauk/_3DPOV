"""
record.py — viewport animation for the Klein Bottle poi head.
Run AFTER blueprint.py has saved hf_klein_bottle.blend.

Opens the .blend, configures a 192-frame Workbench render (Vertex-Colour mode),
orbits the camera 1.5 turns around the object, and cycles through the four
shape keys so the viewer sees the figure-8 tube, wide form, flat disc, and
tall wand morphs in sequence.

Output →
  public/library/videos/scripting/
    python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr/
      viewport.mp4
"""

import bpy, math
from pathlib import Path

HERE    = Path(__file__).parent
BLEND   = HERE / "hf_klein_bottle.blend"
OUT_DIR = (
    Path(__file__).parents[4]
    / "videos/scripting"
    / "python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "viewport"

FPS          = 24
TOTAL_FRAMES = 192     # 8 s: orbit + SK morphs
ORBIT_TURNS  = 1.5     # 1.5 full rotations — camera crosses the self-intersection plane
CAM_ELEV_DEG = 22      # elevation above equatorial plane
CAM_DIST     = 0.26    # metres from origin

# Shape-key phases: (name, start_frame, peak_frame, end_frame)
SK_PHASES = [
    ("SK_Wide", 40,  60,  80),
    ("SK_Flat", 96, 116, 136),
    ("SK_Tall", 152, 168, 184),
]


def _ease(t: float) -> float:
    """Smooth-step: 0→1 with zero derivative at endpoints."""
    return t * t * (3.0 - 2.0 * t)


def build_anim():
    # ── Load scene ───────────────────────────────────────────────────────
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end   = TOTAL_FRAMES - 1

    # ── Workbench: vertex-colour mode ────────────────────────────────────
    scene.render.engine  = "BLENDER_WORKBENCH"
    scene.display.shading.light      = "MATCAP"
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

    # ── Find poi-head object ─────────────────────────────────────────────
    obj = next(
        (o for o in scene.objects if o.get("holoflow:category") == "poi-head"),
        scene.objects[0],
    )

    # ── Camera + track-to target ─────────────────────────────────────────
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    target      = bpy.context.active_object
    target.name = "KleinTarget"

    cam_data = bpy.data.cameras.new("RecordCam"); cam_data.lens = 85.0
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    ttc = cam_obj.constraints.new("TRACK_TO")
    ttc.target     = target
    ttc.track_axis = "TRACK_NEGATIVE_Z"
    ttc.up_axis    = "UP_Y"

    elev = math.radians(CAM_ELEV_DEG)

    # ── Shape-key dictionary ─────────────────────────────────────────────
    sk_dict = {}
    if obj.data.shape_keys:
        sk_dict = {sk.name: sk for sk in obj.data.shape_keys.key_blocks}

    def _set_sk(frame, name, val):
        if name in sk_dict:
            sk_dict[name].value = val
            sk_dict[name].keyframe_insert("value", frame=frame)

    def _set_cam(frame, angle):
        cam_obj.location = (
            CAM_DIST * math.cos(angle) * math.cos(elev),
            CAM_DIST * math.sin(angle) * math.cos(elev),
            CAM_DIST * math.sin(elev),
        )
        cam_obj.keyframe_insert("location", frame=frame)

    # ── Keyframe: reset all SKs to 0 at frame 0 ─────────────────────────
    for sk_name in ["SK_Wide", "SK_Flat", "SK_Tall"]:
        _set_sk(0, sk_name, 0.0)

    # ── Orbit keyframes (every 4 frames) ─────────────────────────────────
    for f in range(0, TOTAL_FRAMES, 4):
        angle = 2.0 * math.pi * ORBIT_TURNS * f / TOTAL_FRAMES
        _set_cam(f, angle)

    # ── Shape-key triangle ramps ─────────────────────────────────────────
    for sk_name, f_start, f_peak, f_end in SK_PHASES:
        for f in range(f_start, f_peak + 1):
            t = (f - f_start) / max(1, f_peak - f_start)
            _set_sk(f, sk_name, _ease(t))
        for f in range(f_peak, f_end + 1):
            t = (f - f_peak) / max(1, f_end - f_peak)
            _set_sk(f, sk_name, 1.0 - _ease(t))
        _set_sk(f_end + 1, sk_name, 0.0)

    # ── Render ───────────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] Rendered → {OUT_FILE}.mp4")


if __name__ == "__main__":
    build_anim()
