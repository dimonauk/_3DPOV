"""
record.py — Viewport animation for the Rabinovich–Fabrikant Attractor
======================================================================
Renders a 10-second / 240-frame sequence to:
  public/library/videos/scripting/
    python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr/
    viewport.mp4

Run from Blender's scripting workspace after blueprint.py has built the scene,
or invoke via:
    blender --background hf_rf_poi.blend --python record.py

WHAT IT SHOWS
  0 – 60   fr   Basis shape (canonical α=0.14 γ=0.10) — full orbit at rest
 60 – 120  fr   Morph → SK_WeakDiss  (weaker dissipation, wider orbit)
120 – 180  fr   Morph → SK_StrongDiss (tighter, more compressed scroll)
180 – 240  fr   Morph → SK_HighG (additional lobe structure, higher forcing)

Camera orbits 270° around the poi head at 28° elevation; bloom and depth-of-
field switched on for video legibility.
"""

import bpy
import math

# ── Constants ─────────────────────────────────────────────────────────────────
OUTPUT_DIR  = "//../../videos/scripting/" \
              "python-numpy-rabinovich-fabrikant-equations-1979-plasma-wave-modulation-chaos-rk4-bishop-tube-poi-webxr/"
N_FRAMES    = 240
FPS         = 24
CAM_DIST    = 0.45    # metres from origin
CAM_ELEV    = 0.28    # radians (~16°)
LENS_MM     = 85
ORBIT_DEG   = 270     # total azimuth sweep
SHAPE_KEYS  = ["SK_WeakDiss", "SK_StrongDiss", "SK_HighG"]


def setup_render():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = N_FRAMES
    sc.render.fps  = FPS

    # EEVEE Next
    sc.render.engine = "BLENDER_EEVEE_NEXT"
    eevee = sc.eevee
    eevee.use_bloom          = True
    eevee.bloom_threshold    = 0.30
    eevee.bloom_intensity    = 0.30
    eevee.bloom_radius       = 4.0

    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format              = "MPEG4"
    sc.render.ffmpeg.codec               = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.filepath = OUTPUT_DIR + "viewport"


def animate_camera():
    """Keyframe a helical camera orbit around the poi head."""
    cam = bpy.context.scene.camera
    if cam is None:
        bpy.ops.object.camera_add()
        cam = bpy.context.object
        bpy.context.scene.camera = cam

    cam.data.lens = LENS_MM

    for f in range(1, N_FRAMES + 1):
        t = (f - 1) / (N_FRAMES - 1)
        az = math.radians(ORBIT_DEG * t)
        x  = CAM_DIST * math.cos(az)
        y  = -CAM_DIST * math.sin(az)
        z  = CAM_DIST * math.sin(CAM_ELEV)

        cam.location = (x, y, z)
        # Always point toward origin
        dx, dy, dz = -x, -y, -z
        pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
        yaw   = math.atan2(-dy, dx) + math.pi / 2.0
        cam.rotation_euler = (math.pi / 2.0 - pitch, 0.0, yaw)

        cam.keyframe_insert("location",       frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)


def animate_shape_keys():
    """Morph through three shape keys in equal 60-frame segments."""
    ob = None
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data.shape_keys:
            ob = o
            break
    if ob is None:
        return

    keys = ob.data.shape_keys.key_blocks
    all_names = ["Basis"] + SHAPE_KEYS

    # Zero all shape-key values at frame 1
    for kn in all_names:
        if kn in keys:
            keys[kn].value = 0.0
            keys[kn].keyframe_insert("value", frame=1)

    seg = N_FRAMES // len(SHAPE_KEYS)
    for idx, sk_name in enumerate(SHAPE_KEYS):
        f_start = 1 + idx * seg
        f_peak  = f_start + seg // 2
        f_end   = f_start + seg

        if sk_name not in keys:
            continue

        keys[sk_name].value = 0.0
        keys[sk_name].keyframe_insert("value", frame=f_start)

        keys[sk_name].value = 1.0
        keys[sk_name].keyframe_insert("value", frame=f_peak)

        keys[sk_name].value = 0.0
        keys[sk_name].keyframe_insert("value", frame=f_end)


def main():
    setup_render()
    animate_camera()
    animate_shape_keys()

    bpy.ops.render.render(animation=True)
    print("[RF record] Render complete → " + OUTPUT_DIR)


if __name__ == "__main__":
    main()
