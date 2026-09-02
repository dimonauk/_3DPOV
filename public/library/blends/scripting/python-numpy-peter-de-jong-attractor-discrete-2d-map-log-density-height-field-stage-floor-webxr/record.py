"""
record.py — Viewport animation render for the de Jong Attractor
Blender 5.1 | EEVEE-Next | outputs viewport.mp4

Run this AFTER blueprint.py has built the DeJong_Attractor object.
Renders 300 frames at 30 fps → 10-second clip.

Animation design (per library convention):
  F001–075   Basis shape (paisley) → camera orbits 0°→90°
  F076–150   morph to SK_Web       → camera orbits 90°→180°
  F151–225   morph to SK_Star      → camera orbits 180°→270°
  F226–300   morph to SK_Spiral    → camera orbits 270°→360° (full orbit)
"""

import bpy
import math
import os

OUTPUT_PATH = "//../../videos/scripting/" \
    "python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr" \
    "/viewport.mp4"

OBJ_NAME   = "DeJong_Attractor"
FPS        = 30
N_FRAMES   = 300
CAM_DIST   = 9.0     # metres, height field spans ±3m
CAM_ELEV   = 4.5     # metres above floor plane


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine        = "BLENDER_EEVEE_NEXT"
    sc.render.fps           = FPS
    sc.frame_start          = 1
    sc.frame_end            = N_FRAMES
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec  = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.filepath      = OUTPUT_PATH
    sc.render.resolution_x  = 1920
    sc.render.resolution_y  = 1080

    # EEVEE-Next bloom for the cobalt-amber glow
    sc.eevee.use_bloom            = True
    sc.eevee.bloom_threshold      = 0.32
    sc.eevee.bloom_intensity      = 0.45
    sc.eevee.bloom_radius         = 6.5


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -CAM_DIST, CAM_ELEV))
    cam = bpy.context.active_object
    cam.name = "DeJong_Cam"
    # track-to constraint keeps camera aimed at floor centre
    tc = cam.constraints.new("TRACK_TO")
    tc.target    = bpy.data.objects.get("DeJong_Attractor")
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"
    return cam


def add_lighting() -> None:
    # three-point rig: key, fill, rim
    positions = [
        ("Key",  (  6.0,  -5.0, 8.0), 800.0),
        ("Fill", ( -4.0,   4.0, 5.0), 200.0),
        ("Rim",  (  0.0,   7.0, 2.0), 400.0),
    ]
    for name, loc, energy in positions:
        bpy.ops.object.light_add(type="AREA", location=loc)
        lt = bpy.context.active_object
        lt.name = f"DeJong_{name}"
        lt.data.energy = energy
        lt.data.size   = 3.0


def key_shape_morph(obj: bpy.types.Object,
                    key_name: str,
                    frame_in: int,
                    frame_out: int) -> None:
    """
    Animate a single shape key from 0 → 1 over [frame_in, frame_out],
    holding all other shape keys at 0 from frame_out onward.
    """
    sk_block = obj.data.shape_keys.key_blocks.get(key_name)
    if sk_block is None:
        return
    sk_block.value = 0.0
    sk_block.keyframe_insert(data_path="value", frame=frame_in)
    sk_block.value = 1.0
    sk_block.keyframe_insert(data_path="value", frame=frame_out)


def animate_camera_orbit(cam: bpy.types.Object) -> None:
    """Rotate camera around Z-axis over N_FRAMES for a full 360° orbit."""
    for f in range(1, N_FRAMES + 1):
        angle = 2.0 * math.pi * (f - 1) / N_FRAMES
        cam.location.x = CAM_DIST * math.sin(angle)
        cam.location.y = -CAM_DIST * math.cos(angle)
        cam.location.z = CAM_ELEV
        cam.keyframe_insert(data_path="location", frame=f)


def main() -> None:
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError("Run blueprint.py first to build the DeJong_Attractor mesh.")

    bpy.context.scene.camera = None
    setup_render()
    cam = add_camera()
    bpy.context.scene.camera = cam
    add_lighting()
    animate_camera_orbit(cam)

    # shape key morphs
    key_schedule = [
        ("SK_Web",    75,  130),
        ("SK_Star",  155,  210),
        ("SK_Spiral", 235,  290),
    ]
    for key_name, f_in, f_out in key_schedule:
        key_shape_morph(obj, key_name, f_in, f_out)

    os.makedirs(os.path.dirname(bpy.path.abspath(OUTPUT_PATH)), exist_ok=True)
    bpy.ops.render.render(animation=True)
    print("[record.py] render complete →", OUTPUT_PATH)


if __name__ == "__main__":
    main()
