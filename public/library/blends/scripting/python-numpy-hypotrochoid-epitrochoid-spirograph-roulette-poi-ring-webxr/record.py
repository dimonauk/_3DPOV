"""
record.py — Viewport animation recording for the roulette-poi-ring tutorial.
Run AFTER blueprint.py in the same Blender 5.1 session.

Output: public/library/videos/scripting/
        python-numpy-hypotrochoid-epitrochoid-spirograph-roulette-poi-ring-webxr/
        viewport.mp4  (1920×1080, 30 fps, ~8 s)

The animation cross-fades through the six roulette shape keys in sequence,
giving viewers a clear visual of how changing R, r, d transforms the curve
topology — from the loopy 5-petalled spirograph through to the 3-cusped deltoid
and cardioid.  A slow orbit camera arc reveals the tube cross-section.
"""

import bpy
import math

FRAME_START  = 1
FRAME_END    = 240          # 8 s at 30 fps
FPS          = 30
OUT_PATH     = "//../../videos/scripting/python-numpy-hypotrochoid-epitrochoid-spirograph-roulette-poi-ring-webxr/viewport.mp4"
ORBIT_RADIUS = 0.45         # camera orbit radius in Blender units
ORBIT_ELEV   = 0.22         # camera elevation above XY plane

# Shape key cross-fade schedule: (frame_in, frame_out, key_name, value_at_peak)
# Each key ramps from 0 → 1 → 0 in a 40-frame window, offset by 40 frames each
KEY_SCHEDULE = [
    ("Spirograph_5_3", 1,   40),
    ("Rose_7_2",       41,  80),
    ("Astroid",        81,  120),
    ("Deltoid",        121, 160),
    ("Cardioid",       161, 200),
    ("Nephroid",       201, 240),
]


def setup_camera():
    bpy.ops.object.camera_add(location=(ORBIT_RADIUS, 0, ORBIT_ELEV))
    cam = bpy.context.object
    cam.name = "rec_cam"
    cam.data.lens = 50
    # Track-to constraint — points at origin
    con = cam.constraints.new("TRACK_TO")
    con.target = bpy.data.objects.get("hf_spirograph_poi") or cam
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam
    return cam


def animate_camera_orbit(cam):
    cam.animation_data_create()
    cam.animation_data.action = bpy.data.actions.new("cam_orbit")
    fc_x = cam.animation_data.action.fcurves.new("location", index=0)
    fc_y = cam.animation_data.action.fcurves.new("location", index=1)
    steps = 16
    for s in range(steps + 1):
        f = FRAME_START + s * (FRAME_END - FRAME_START) // steps
        angle = 2 * math.pi * s / steps
        fc_x.keyframe_points.insert(f, ORBIT_RADIUS * math.cos(angle)).interpolation = "LINEAR"
        fc_y.keyframe_points.insert(f, ORBIT_RADIUS * math.sin(angle)).interpolation = "LINEAR"


def animate_shape_keys(obj):
    """Ramp each shape key 0→1→0 over its allocated window."""
    if not obj.data.shape_keys:
        return
    kb = obj.data.shape_keys.key_blocks
    for key_name, f_start, f_end in KEY_SCHEDULE:
        if key_name not in kb:
            continue
        sk = kb[key_name]
        f_mid = (f_start + f_end) // 2
        sk.value = 0.0; sk.keyframe_insert("value", frame=f_start)
        sk.value = 1.0; sk.keyframe_insert("value", frame=f_mid)
        sk.value = 0.0; sk.keyframe_insert("value", frame=f_end)
        for kp in sk.id_data.animation_data.action.fcurves[-1].keyframe_points:
            kp.interpolation = "BEZIER"


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    # Workbench — fastest, shows vertex colours without lighting setup
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light      = "FLAT"
    scene.display.shading.color_type = "VERTEX"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format         = "MPEG4"
    scene.render.ffmpeg.codec          = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = OUT_PATH


def record():
    obj = bpy.data.objects.get("hf_spirograph_poi")
    if not obj:
        print("[record] ERROR: run blueprint.py first to create hf_spirograph_poi")
        return

    cam = setup_camera()
    animate_camera_orbit(cam)
    animate_shape_keys(obj)
    setup_render()
    # Slow spin on the poi ring itself — one full Z rotation over the clip
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=FRAME_START)
    obj.rotation_euler = (0, 0, 2 * math.pi)
    obj.keyframe_insert("rotation_euler", frame=FRAME_END)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written to {OUT_PATH}")


record()
