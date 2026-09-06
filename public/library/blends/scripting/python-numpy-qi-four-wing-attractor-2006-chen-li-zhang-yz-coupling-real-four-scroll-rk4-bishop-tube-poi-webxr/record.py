"""
record.py — Qi Four-Wing Attractor  (Blender 5.1 headless render)
==================================================================
Outputs a 10-second, 30 fps viewport animation (300 frames) to:
  public/library/videos/scripting/
  python-numpy-qi-four-wing-attractor-2006-chen-li-zhang-yz-coupling-real-four-scroll-rk4-bishop-tube-poi-webxr/
  viewport.mp4

Run *after* blueprint.py has produced the .blend with the Qi object.

  blender hf_qi_poi.blend --background --python record.py

Animation shows: the shape-key timeline cross-fades from canonical
four-wing (Basis) → two-wing (SK_TwoWing) → back, then orbits through
HighB and LowC, giving a clear before/after view of the yz coupling.
"""

import bpy, math

# ── CONFIG ────────────────────────────────────────────────────────────────────
OBJ_NAME   = "hf_qi_poi"
FPS        = 30
DURATION_S = 10
OUT_DIR    = (
    "//public/library/videos/scripting/"
    "python-numpy-qi-four-wing-attractor-2006-chen-li-zhang-yz-coupling-real-four-scroll-rk4-bishop-tube-poi-webxr/"
    "viewport"
)
SLUG = (
    "python-numpy-qi-four-wing-attractor-2006-chen-li-zhang-yz-coupling-"
    "real-four-scroll-rk4-bishop-tube-poi-webxr"
)

TOTAL_FRAMES = FPS * DURATION_S   # 300

# shape-key schedule (frame, key_name, value)
SK_SCHEDULE = [
    # 0–60:   pure four-wing (Basis)
    (  0, "Basis",      1.0), (  0, "SK_TwoWing", 0.0),
    (  0, "SK_HighB",   0.0), (  0, "SK_LowC",    0.0),
    # 60–120: fade to two-wing (yz coupling off)
    ( 60, "Basis",      1.0), ( 60, "SK_TwoWing",  0.0),
    ( 90, "Basis",      0.0), ( 90, "SK_TwoWing",  1.0),
    (120, "Basis",      0.0), (120, "SK_TwoWing",  1.0),
    # 120–180: back to four-wing
    (150, "Basis",      1.0), (150, "SK_TwoWing",  0.0),
    (180, "Basis",      1.0), (180, "SK_TwoWing",  0.0),
    # 180–240: high-B variant
    (210, "Basis",      0.0), (210, "SK_HighB",    1.0),
    (240, "Basis",      0.0), (240, "SK_HighB",    1.0),
    # 240–300: return to four-wing
    (270, "Basis",      1.0), (270, "SK_HighB",    0.0),
    (300, "Basis",      1.0),
]

def setup_render():
    sc = bpy.context.scene
    sc.frame_start  = 1
    sc.frame_end    = TOTAL_FRAMES
    sc.render.fps   = FPS
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format               = "MPEG4"
    sc.render.ffmpeg.codec                = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = OUT_DIR
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100
    sc.render.engine = "BLENDER_WORKBENCH"
    bpy.context.scene.display.shading.type = "MATERIAL"

def insert_shape_key_keyframes(ob):
    kb = ob.data.shape_keys
    if kb is None:
        print(f"[record] no shape keys on {ob.name}")
        return
    for frame, key_name, value in SK_SCHEDULE:
        if key_name in kb.key_blocks:
            kb.key_blocks[key_name].value = value
            kb.key_blocks[key_name].keyframe_insert("value", frame=frame)

def animate_camera():
    """Slow orbit around the attractor for a clear view of all four wings."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_ob   = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob
    cam_data.lens = 50

    radius = 80.0
    height = 20.0
    for f in range(1, TOTAL_FRAMES + 1):
        t  = (f - 1) / TOTAL_FRAMES
        angle = 2 * math.pi * t * 0.8   # 0.8 full orbit
        cx = radius * math.cos(angle)
        cy = radius * math.sin(angle)
        cam_ob.location = (cx, cy, height)
        # look at attractor centre
        import mathutils
        direction = mathutils.Vector((0, 0, 8)) - mathutils.Vector((cx, cy, height))
        rot = direction.to_track_quat("-Z", "Y")
        cam_ob.rotation_euler = rot.to_euler()
        cam_ob.keyframe_insert("location",       frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)

def main():
    ob = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        print(f"[record] Object '{OBJ_NAME}' not found — run blueprint.py first.")
        return

    setup_render()
    insert_shape_key_keyframes(ob)
    animate_camera()
    bpy.ops.render.render(animation=True)
    print(f"[record] done → {OUT_DIR}.mp4")

if __name__ == "__main__":
    main()
