"""
record.py — Viewport animation for the Vallis ENSO Attractor tutorial
Outputs to:
  public/library/videos/scripting/
    python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-thermocline-constant-divergence-rk4-bishop-tube-poi-webxr/
      viewport.mp4

Run AFTER blueprint.py has built the Vallis_ENSO_Poi object in the scene.
Duration: 12 seconds at 24 fps = 288 frames.

Camera path:
  Act 1 (F001–096, 4 s): slow 180° arc from the Pacific-looking angle,
    revealing the looping basin structure of the chaotic attractor.
  Act 2 (F097–192, 4 s): shape-key morph Basis → SK_Periodic, showing the
    orbit collapsing to a limit cycle as El Niño forcing drops from F=18 → F=11.
  Act 3 (F193–288, 4 s): return 180° arc with SK_Periodic active, contrasting
    the tight loop with the earlier chaotic tangle.
"""

import bpy
import math
import os

# ─── Constants ────────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-"
    "thermocline-constant-divergence-rk4-bishop-tube-poi-webxr"
)
OUTPUT_DIR  = f"public/library/videos/scripting/{SLUG}"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "viewport.mp4")

FPS        = 24
DURATION_S = 12
N_FRAMES   = FPS * DURATION_S   # 288

OBJ_NAME   = "Vallis_ENSO_Poi"
CAM_NAME   = "VallisOrbitCam"

# Camera orbit parameters
RADIUS = 0.90   # metres (Vallis orbit fits in ~0.8 m at SCALE=0.08)
ELEV   = 0.30   # 30 cm elevation above centroid


def _purge_camera():
    if CAM_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[CAM_NAME], do_unlink=True)


def setup_camera() -> bpy.types.Object:
    """
    Perspective camera, 50 mm lens.  WHY perspective?  The tube depth and
    crossing structure of the Vallis attractor reads as chaotic in perspective;
    orthographic collapses the z-depth and makes the orbit look planar.
    """
    _purge_camera()
    cam_data       = bpy.data.cameras.new(CAM_NAME)
    cam_data.type  = "PERSP"
    cam_data.lens  = 50.0
    cam = bpy.data.objects.new(CAM_NAME, cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


def _place_camera(cam, angle_rad):
    """Orbit around the scene origin at constant elevation."""
    x = RADIUS * math.cos(angle_rad)
    y = RADIUS * math.sin(angle_rad)
    z = ELEV
    cam.location = (x, y, z)

    dx, dy, dz = -x, -y, -z
    dist  = math.sqrt(dx**2 + dy**2 + dz**2)
    pitch = math.asin(dz / dist)
    yaw   = math.atan2(dy, dx)
    cam.rotation_euler = (
        math.pi / 2.0 + pitch,
        0.0,
        yaw + math.pi / 2.0,
    )


def keyframe_camera(cam):
    """
    Three acts — the camera angle and shape-key value are both keyframed.
    """
    obj = bpy.data.objects.get(OBJ_NAME)

    if obj and obj.data.shape_keys:
        keys = obj.data.shape_keys.key_blocks
        # Ensure Basis and SK_Periodic animation data exist
        if "SK_Periodic" in keys:
            sk_peri = keys["SK_Periodic"]
        else:
            sk_peri = None

    # Act 1: orbit from -30° to +150°, shape key Basis (value=0)
    for frame in range(1, 97):
        t     = (frame - 1) / 95.0
        angle = math.radians(-30.0 + t * 180.0)
        _place_camera(cam, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
        if sk_peri is not None:
            sk_peri.value = 0.0
            sk_peri.keyframe_insert("value", frame=frame)

    # Act 2: morph to SK_Periodic, camera at +150°
    for frame in range(97, 193):
        t     = (frame - 97) / 95.0
        angle = math.radians(150.0)
        _place_camera(cam, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
        if sk_peri is not None:
            sk_peri.value = t          # 0→1 morph to limit cycle
            sk_peri.keyframe_insert("value", frame=frame)

    # Act 3: reverse arc from +150° to -30°, SK_Periodic fully active
    for frame in range(193, N_FRAMES + 1):
        t     = (frame - 193) / 95.0
        angle = math.radians(150.0 - t * 180.0)
        _place_camera(cam, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
        if sk_peri is not None:
            sk_peri.value = 1.0
            sk_peri.keyframe_insert("value", frame=frame)


def setup_render():
    scene = bpy.context.scene
    scene.render.engine         = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x   = 1280
    scene.render.resolution_y   = 720
    scene.render.fps            = FPS
    scene.frame_start           = 1
    scene.frame_end             = N_FRAMES
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format            = "MPEG4"
    scene.render.ffmpeg.codec             = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUTPUT_FILE

    # Bloom — makes the emissive tube glow against the black world
    eevee = scene.eevee
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.70
    eevee.bloom_radius    = 6.0
    eevee.bloom_intensity = 0.80


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    cam = setup_camera()
    keyframe_camera(cam)
    setup_render()
    bpy.ops.render.render(animation=True)
    print(f"[Vallis record] Wrote → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
