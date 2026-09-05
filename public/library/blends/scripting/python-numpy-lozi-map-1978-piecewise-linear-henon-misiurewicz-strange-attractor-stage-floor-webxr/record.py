"""
record.py — Viewport animation for the Lozi Map tutorial
Outputs to:
  public/library/videos/scripting/
    python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr/
      viewport.mp4

Run AFTER blueprint.py has created the Lozi_Attractor object in the scene.
Duration: ~10 seconds at 24 fps = 240 frames.
"""

import bpy
import math
import os

OUTPUT_DIR = (
    "public/library/videos/scripting/"
    "python-numpy-lozi-map-1978-piecewise-linear-henon-misiurewicz-strange-attractor-stage-floor-webxr"
)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport.mp4")
FPS         = 24
DURATION_S  = 10
N_FRAMES    = FPS * DURATION_S   # 240

OBJ_NAME    = "Lozi_Attractor"
CAM_NAME    = "LoziBirdCam"


def _clear_animation(obj: bpy.types.Object) -> None:
    if obj.animation_data:
        obj.animation_data_clear()


def setup_camera() -> bpy.types.Object:
    """
    Slow orbit at 40° elevation shows both the V-fold ridge (top-down) and
    the height variation (oblique).  WHY not orthographic?  Perspective
    projection better communicates the height-field depth.
    """
    if CAM_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[CAM_NAME], do_unlink=True)

    cam_data = bpy.data.cameras.new(CAM_NAME)
    cam_data.type = "PERSP"
    cam_data.lens = 50.0
    cam = bpy.data.objects.new(CAM_NAME, cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def keyframe_camera(cam: bpy.types.Object) -> None:
    """
    Orbit 360° around the centre over 240 frames.
    Radius 9 m, elevation 5 m → 29° above horizon (good for a floor object).
    """
    radius  = 9.0
    elev    = 4.5

    for frame in range(1, N_FRAMES + 1):
        t     = (frame - 1) / N_FRAMES
        angle = 2.0 * math.pi * t           # full 360°

        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        z = elev

        cam.location = (x, y, z)

        # Point camera at scene origin
        dx, dy, dz = -x, -y, -z
        dist = math.sqrt(dx**2 + dy**2 + dz**2)
        pitch = math.asin(dz / dist)        # look-down angle
        yaw   = math.atan2(dy, dx)

        # Blender euler ZYX: Z is azimuth, Y not used, X is tilt
        cam.rotation_euler = (
            math.pi / 2 + pitch,   # X: tilt down
            0.0,                    # Y
            yaw + math.pi / 2,      # Z: face centre
        )

        cam.keyframe_insert(data_path="location", frame=frame)
        cam.keyframe_insert(data_path="rotation_euler", frame=frame)


def animate_shape_keys(obj: bpy.types.Object) -> None:
    """
    Cycle through shape keys:
      frames 1-60:   Basis (canonical)
      frames 61-120: SK_LowA (broader)
      frames 121-180: SK_HighA (compressed)
      frames 181-240: SK_LowB (stronger dissipation)
    Each transition uses a sharp step at the midpoint — no cross-fade,
    because log-density fields don't interpolate meaningfully between
    different (a,b) parameter sets.
    """
    if not obj.data.shape_keys:
        print("[record] No shape keys found on object — skipping.")
        return

    kb = obj.data.shape_keys.key_blocks
    key_names = [b.name for b in kb]
    schedule = [
        (1,   60,  "Basis"),
        (61,  120, "SK_LowA"),
        (121, 180, "SK_HighA"),
        (181, 240, "SK_LowB"),
    ]

    for start, end, target in schedule:
        for name in key_names:
            if name not in obj.data.shape_keys.key_blocks:
                continue
            blk = obj.data.shape_keys.key_blocks[name]
            val = 1.0 if name == target else 0.0
            blk.value = val
            blk.keyframe_insert("value", frame=start)
            blk.keyframe_insert("value", frame=end)


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine            = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x      = 1920
    scene.render.resolution_y      = 1080
    scene.render.fps                = FPS
    scene.frame_start               = 1
    scene.frame_end                 = N_FRAMES
    scene.render.filepath           = "//" + OUTPUT_FILE
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format      = "MPEG4"
    scene.render.ffmpeg.codec       = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"


def add_lighting() -> None:
    # Soft overhead sun
    if "LoziBlueSun" not in bpy.data.objects:
        sun_data = bpy.data.lights.new("LoziBlueSun", type="SUN")
        sun_data.energy = 3.0
        sun_data.color  = (0.6, 0.7, 1.0)
        sun_obj = bpy.data.objects.new("LoziBlueSun", sun_data)
        bpy.context.scene.collection.objects.link(sun_obj)
        sun_obj.rotation_euler = (0.4, 0.2, 0.0)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if OBJ_NAME not in bpy.data.objects:
        print(f"[record] '{OBJ_NAME}' not found — run blueprint.py first.")
        return

    obj = bpy.data.objects[OBJ_NAME]
    _clear_animation(obj)

    cam = setup_camera()
    keyframe_camera(cam)
    animate_shape_keys(obj)
    add_lighting()
    configure_render()

    bpy.ops.render.render(animation=True)
    print(f"[record] Rendered → {OUTPUT_FILE}")


main()
