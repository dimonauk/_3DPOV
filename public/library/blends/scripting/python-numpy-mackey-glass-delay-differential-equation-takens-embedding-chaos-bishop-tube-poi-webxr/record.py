"""
record.py — Mackey-Glass DDE viewport animation recorder
──────────────────────────────────────────────────────────
Run AFTER blueprint.py has built mackey_glass_poi.blend.

What this renders:
  - 10-second clip (300 frames at 30 fps) in EEVEE Next
  - Camera orbits 360° around the poi head from a slight elevation
  - Shape-key morphs: Basis (0-90) → SK_HighTau (90-150) →
    SK_VeryHiTau (150-210) → SK_Periodic (210-270) → Basis (270-300)
  - Bloom + ambient occlusion for the cobalt-to-amber glow
  - Output: public/library/videos/scripting/<slug>/viewport.mp4

Run:
  blender mackey_glass_poi.blend --background --python record.py
"""

import bpy
import math

# ─── SETTINGS ────────────────────────────────────────────────────────────────
FPS         = 30
DURATION_S  = 10
N_FRAMES    = FPS * DURATION_S       # 300
CAM_RADIUS  = 3.4
CAM_ELEV    = 1.0                    # metres above origin
OUTPUT_PATH = "//../../videos/scripting/python-numpy-mackey-glass-delay-differential-equation-takens-embedding-chaos-bishop-tube-poi-webxr/viewport"

SLUG = "mackey_glass_poi"


def setup_scene():
    scn = bpy.context.scene
    scn.render.engine          = "BLENDER_EEVEE_NEXT"
    scn.render.fps             = FPS
    scn.frame_start            = 1
    scn.frame_end              = N_FRAMES
    scn.render.filepath        = OUTPUT_PATH
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format   = "MPEG4"
    scn.render.ffmpeg.codec    = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.resolution_x   = 1920
    scn.render.resolution_y   = 1080
    scn.render.resolution_percentage = 100

    # Bloom / glow
    scn.eevee.use_bloom = True
    scn.eevee.bloom_intensity = 0.35
    scn.eevee.bloom_radius    = 4.5
    scn.eevee.bloom_threshold = 0.6


def build_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    # Orbit: keyframe every quarter turn
    for fr, angle in [(1, 0.0), (76, math.pi/2), (151, math.pi),
                      (226, 3*math.pi/2), (N_FRAMES, 2*math.pi)]:
        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        z = CAM_ELEV
        cam_ob.location = (x, y, z)
        # Point at origin
        dx, dy, dz = -x, -y, -z
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        cam_ob.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), -dz) + math.pi,
            0.0,
            math.atan2(dx, -dy),
        )
        cam_ob.keyframe_insert("location",       frame=fr)
        cam_ob.keyframe_insert("rotation_euler", frame=fr)

    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def keyframe_shape_keys():
    """Sweep through shape keys over the animation duration."""
    obj = bpy.data.objects.get(SLUG)
    if not obj or not obj.data.shape_keys:
        print("WARNING: mesh object not found — skipping shape-key animation")
        return

    keys = obj.data.shape_keys.key_blocks

    def set_sk(name: str, val: float, fr: int):
        if name in keys:
            keys[name].value = val
            keys[name].keyframe_insert("value", frame=fr)

    # Basis dominant first
    set_sk("Basis",        1.0,  1);    set_sk("Basis",        1.0,  75)
    set_sk("Basis",        0.0,  90)

    # Morph to SK_HighTau
    set_sk("SK_HighTau",   0.0,  75);   set_sk("SK_HighTau",   1.0,  90)
    set_sk("SK_HighTau",   1.0, 150);   set_sk("SK_HighTau",   0.0, 165)

    # Morph to SK_VeryHiTau
    set_sk("SK_VeryHiTau", 0.0, 150);   set_sk("SK_VeryHiTau", 1.0, 165)
    set_sk("SK_VeryHiTau", 1.0, 210);   set_sk("SK_VeryHiTau", 0.0, 225)

    # Morph to SK_Periodic
    set_sk("SK_Periodic",  0.0, 210);   set_sk("SK_Periodic",  1.0, 225)
    set_sk("SK_Periodic",  1.0, 270);   set_sk("SK_Periodic",  0.0, 285)

    # Return to Basis
    set_sk("Basis",        0.0, 270);   set_sk("Basis",        1.0, 285)


def add_light():
    lamp_data = bpy.data.lights.new("KeyLight", type="AREA")
    lamp_data.energy = 800
    lamp_data.size   = 2.5
    lamp_ob = bpy.data.objects.new("KeyLight", lamp_data)
    bpy.context.collection.objects.link(lamp_ob)
    lamp_ob.location = (3.0, -2.0, 4.0)


if __name__ == "__main__":
    setup_scene()
    build_camera()
    keyframe_shape_keys()
    add_light()
    bpy.ops.render.render(animation=True)
    print("record.py done — viewport.mp4 written.")
