"""
record.py — Viewport Animation Render: Anishchenko–Astakhov Oscillator
=======================================================================
Outputs: public/library/videos/scripting/
  python-numpy-anishchenko-astakhov-oscillator-1983-self-excited-inertial-nonlinearity-heaviside-chaos-rk4-bishop-tube-poi-webxr/
  viewport.mp4

Run after blueprint.py has placed hf_aa_poi in the scene.
Duration: 10 s at 24 fps = 240 frames.
Camera orbit 270°, elevation 16°, distance 1.1 m.
Shape-key morph: Basis → SK_LowM → SK_HighM → SK_LowG
(one morph per 80-frame quarter, then return to Basis).
Bloom radius softly highlights the glowing amber mid-orbit peak.
"""

import bpy, math

# ── Output ──────────────────────────────────────────────────────────
SLUG      = "hf_aa_poi"
OUT_DIR   = (
    "//../../videos/scripting/"
    "python-numpy-anishchenko-astakhov-oscillator-1983-self-excited-"
    "inertial-nonlinearity-heaviside-chaos-rk4-bishop-tube-poi-webxr/"
)
TOTAL_FR  = 240          # 10 s at 24 fps
FPS       = 24

# ── Camera ──────────────────────────────────────────────────────────
CAM_DIST  = 1.10         # m from world origin
CAM_ELEV  = 16.0         # degrees above horizon
ORBIT_DEG = 270.0        # total azimuth sweep


def setup_scene():
    # render engine
    sc = bpy.context.scene
    sc.render.engine          = "BLENDER_EEVEE_NEXT"
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = TOTAL_FR
    sc.render.filepath        = OUT_DIR + "viewport"
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format   = "MPEG4"
    sc.render.ffmpeg.codec    = "H264"
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.resolution_percentage = 100

    # bloom (EEVEE Next)
    sc.eevee.use_bloom        = True
    sc.eevee.bloom_threshold  = 0.30
    sc.eevee.bloom_intensity  = 0.30
    sc.eevee.bloom_radius     = 5.0


def add_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "REC_cam"
    bpy.context.scene.camera = cam

    # insert keyframes for orbit
    elev_rad = math.radians(CAM_ELEV)
    for fr in range(1, TOTAL_FR + 1):
        t   = (fr - 1) / (TOTAL_FR - 1)
        az  = math.radians(-ORBIT_DEG * t)
        x   = CAM_DIST * math.cos(elev_rad) * math.cos(az)
        y   = CAM_DIST * math.cos(elev_rad) * math.sin(az)
        z   = CAM_DIST * math.sin(elev_rad)
        cam.location = (x, y, z)
        # point camera at world origin
        dx, dy, dz = -x, -y, -z
        cam.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), dz),    # polar
            0.0,
            math.atan2(dy, dx) + math.pi,
        )
        cam.keyframe_insert("location",       frame=fr)
        cam.keyframe_insert("rotation_euler", frame=fr)

    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def add_light():
    bpy.ops.object.light_add(type="SUN", location=(3, 3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.color  = (1.0, 0.97, 0.90)


def add_shape_key_morph():
    """Animate shape keys: Basis for fr 1-60, cross-fade to SK_LowM 61-120,
    SK_HighM 121-180, SK_LowG 181-240, return to Basis at 240.
    """
    ob = bpy.data.objects.get(SLUG)
    if ob is None or ob.data.shape_keys is None:
        return

    sk_block = ob.data.shape_keys
    keys     = {k.name: k for k in sk_block.key_blocks}

    def zero_all(fr):
        for k in keys.values():
            k.value = 0.0
            k.keyframe_insert("value", frame=fr)

    def set_key(name, val, fr):
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=fr)

    # Quarters: [1,80] Basis, [81,160] LowM, [161,200] HighM, [201,240] LowG
    zero_all(1);   set_key("Basis",   1.0, 1)
    zero_all(80);  set_key("Basis",   1.0, 80)
    zero_all(81);  set_key("SK_LowM", 1.0, 81)
    zero_all(160); set_key("SK_LowM", 1.0, 160)
    zero_all(161); set_key("SK_HighM", 1.0, 161)
    zero_all(200); set_key("SK_HighM", 1.0, 200)
    zero_all(201); set_key("SK_LowG",  1.0, 201)
    zero_all(240); set_key("SK_LowG",  1.0, 240)

    for fc in sk_block.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "CONSTANT"


def main():
    setup_scene()
    add_light()
    add_camera()
    add_shape_key_morph()
    bpy.ops.render.render(animation=True)
    print("[AA record] Done → viewport.mp4")


main()
