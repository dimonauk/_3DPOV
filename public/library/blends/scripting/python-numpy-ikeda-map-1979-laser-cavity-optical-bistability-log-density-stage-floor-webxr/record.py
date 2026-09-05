# ─────────────────────────────────────────────────────────────────────────────
# record.py  —  Ikeda Map  —  Viewport animation for screen recording
# ─────────────────────────────────────────────────────────────────────────────
# Run this script inside Blender AFTER blueprint.py has built ikeda_floor.
# It sets up a 210-frame (7 s at 30 fps) EEVEE animation:
#   f 1–50   — establish view, Basis shape key (μ=0.90)
#   f51–100  — morph to SK_MuHigh (μ=0.95) denser filaments appear
#   f101–150 — morph to SK_MuMid  (μ=0.85) scrolls thin out
#   f151–210 — morph to SK_MuLow  (μ=0.70) near-ordered sparse peaks
# Camera orbits overhead at 45° elevation, completing 1.4 revolutions.
# Output: public/library/videos/scripting/
#         python-numpy-ikeda-map.../viewport.mp4
# ─────────────────────────────────────────────────────────────────────────────

import bpy, math, os

TOTAL_FRAMES  = 210
FPS           = 30
CAM_DIST      = 10.0   # metres
CAM_ELEV      = 0.72   # radians (~41°)
CAM_REVS      = 1.4    # full orbits over the animation
BLOOM_THR     = 0.30
BLOOM_INT     = 0.55

OBJ_NAME = "ikeda_floor"
OUTPUT_REL = "//../../videos/scripting/" \
             "python-numpy-ikeda-map-1979-laser-cavity-optical-bistability-log-density-stage-floor-webxr/" \
             "viewport"


def setup_render() -> None:
    scn = bpy.context.scene
    scn.render.engine            = "BLENDER_EEVEE_NEXT"
    scn.render.fps               = FPS
    scn.frame_start              = 1
    scn.frame_end                = TOTAL_FRAMES
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format     = "MPEG4"
    scn.render.ffmpeg.codec      = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.resolution_x      = 1920
    scn.render.resolution_y      = 1080
    scn.render.filepath          = OUTPUT_REL

    eevee = scn.eevee
    eevee.use_bloom              = True
    eevee.bloom_threshold        = BLOOM_THR
    eevee.bloom_intensity        = BLOOM_INT
    eevee.bloom_radius           = 5.0


def ensure_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.get("RecordCam") or bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_ob = bpy.data.objects.get("RecordCam") or bpy.data.objects.new("RecordCam", cam_data)
    if cam_ob.name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob
    return cam_ob


def ensure_light() -> None:
    if not bpy.data.objects.get("RecordLight"):
        ld = bpy.data.lights.new("RecordLight", "AREA")
        ld.energy = 800
        ld.size   = 6.0
        lo = bpy.data.objects.new("RecordLight", ld)
        bpy.context.collection.objects.link(lo)
        lo.location = (4, -4, 8)


def orbit_camera(cam: bpy.types.Object, frame: int) -> None:
    t     = (frame - 1) / (TOTAL_FRAMES - 1)   # 0 → 1
    angle = 2.0 * math.pi * CAM_REVS * t
    cam.location.x = CAM_DIST * math.cos(angle) * math.cos(CAM_ELEV)
    cam.location.y = CAM_DIST * math.sin(angle) * math.cos(CAM_ELEV)
    cam.location.z = CAM_DIST * math.sin(CAM_ELEV)
    # Point camera at origin
    dx, dy, dz = -cam.location.x, -cam.location.y, -cam.location.z
    cam.rotation_euler[0] = math.atan2(math.sqrt(dx*dx+dy*dy), dz)
    cam.rotation_euler[2] = math.atan2(dy, dx) + math.pi / 2


def keyframe_shape_keys(ob: bpy.types.Object) -> None:
    """
    Set up shape-key value keyframes for the four-stage morph sequence.
    Each SK rises from 0 to 1 over 20 frames, then holds for 30 frames.
    """
    sks = ob.data.shape_keys.key_blocks
    sk_names = ["SK_MuHigh", "SK_MuMid", "SK_MuLow"]
    segments = [
        (51,  70,  "SK_MuHigh"),
        (101, 120, "SK_MuMid"),
        (151, 170, "SK_MuLow"),
    ]

    def zero_all(frame: int) -> None:
        for nm in sk_names:
            sk = sks.get(nm)
            if sk:
                sk.value = 0.0
                sk.keyframe_insert("value", frame=frame)

    # Start: everything at zero
    zero_all(1)

    for fade_start, fade_end, active in segments:
        prev_sk = None
        for other in sk_names:
            if other != active:
                sk = sks.get(other)
                if sk:
                    sk.value = 0.0
                    sk.keyframe_insert("value", frame=fade_start)
                    sk.keyframe_insert("value", frame=fade_end)
            else:
                sk = sks.get(other)
                if sk:
                    sk.value = 0.0
                    sk.keyframe_insert("value", frame=fade_start)
                    sk.value = 1.0
                    sk.keyframe_insert("value", frame=fade_end)

    # Hold last shape key to end
    sk = sks.get("SK_MuLow")
    if sk:
        sk.value = 1.0
        sk.keyframe_insert("value", frame=TOTAL_FRAMES)


def animate_camera(cam: bpy.types.Object) -> None:
    for frame in range(1, TOTAL_FRAMES + 1):
        orbit_camera(cam, frame)
        cam.keyframe_insert(data_path="location",       frame=frame)
        cam.keyframe_insert(data_path="rotation_euler", frame=frame)


def main() -> None:
    ob = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        raise RuntimeError(f"[record.py] Object '{OBJ_NAME}' not found — run blueprint.py first.")

    os.makedirs(os.path.dirname(bpy.path.abspath(OUTPUT_REL + ".mp4")), exist_ok=True)

    setup_render()
    cam = ensure_camera()
    ensure_light()
    animate_camera(cam)

    if ob.data.shape_keys and ob.data.shape_keys.key_blocks:
        keyframe_shape_keys(ob)

    bpy.ops.render.render(animation=True)
    print("[record.py] Render complete →", OUTPUT_REL + ".mp4")


main()
