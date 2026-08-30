"""
record.py — Viewport-animation renderer for the Kapitza Pendulum Poi Head
Output: public/library/videos/scripting/
  python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr/
  viewport.mp4

Run this in Blender 5.1 after blueprint.py has built the Poi Head object.
Duration: 12 seconds at 25 fps = 300 frames.

Animation sequence
──────────────────
F  1 – 60   : 360° orbit, camera height 0, showing Basis (Kapitza-stable coil near top)
F 61 – 110  : fade to SK_Border  (at Mathieu stability threshold — large wobble)
F111 – 160  : fade to SK_Wide    (larger initial displacement from inverted)
F161 – 210  : fade to SK_Fall    (below threshold — pendulum falls, coil migrates to bottom)
F211 – 300  : fade back to Basis; final full-orbit reveal
"""

import bpy
import math

# ── SCENE SETUP ────────────────────────────────────────────────────────────
RENDER_W    = 1920
RENDER_H    = 1080
FPS         = 25
N_FRAMES    = 300
OUTPUT_PATH = "//../../videos/scripting/python-numpy-kapitza-pendulum-parametric-resonance-mathieu-effective-potential-bishop-tube-poi-webxr/viewport"

CAM_DIST    = 0.30    # camera distance from origin (m)
CAM_ELEV    = 0.08    # camera height offset above centre
LENS_MM     = 85      # focal length

# Bloom / EEVEE-Next
BLOOM_THRESHOLD = 0.32
BLOOM_INTENSITY = 0.45

# Shape-key blend transitions (frame ranges, target SK name)
SK_TRANSITIONS = [
    (61,  110, "SK_Border"),
    (111, 160, "SK_Wide"),
    (161, 210, "SK_Fall"),
    (211, 260, "Basis"),
]


def setup_scene():
    scn = bpy.context.scene
    scn.render.engine         = "BLENDER_EEVEE_NEXT"
    scn.render.resolution_x   = RENDER_W
    scn.render.resolution_y   = RENDER_H
    scn.render.fps            = FPS
    scn.frame_start           = 1
    scn.frame_end             = N_FRAMES
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format  = "MPEG4"
    scn.render.ffmpeg.codec   = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.filepath       = OUTPUT_PATH

    # Bloom (EEVEE Next uses compositor bloom or legacy toggle)
    try:
        scn.eevee.use_bloom          = True
        scn.eevee.bloom_threshold    = BLOOM_THRESHOLD
        scn.eevee.bloom_intensity    = BLOOM_INTENSITY
    except AttributeError:
        pass   # EEVEE Next may expose bloom via compositor instead

    # World background — near-black for glow pop
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.02, 0.04, 1.0)
    bpy.context.scene.world.node_tree.nodes["Background"].inputs[1].default_value = 1.0


def setup_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = LENS_MM
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Animate orbit: one full 360° over 300 frames
    for f in range(1, N_FRAMES + 1):
        angle = 2 * math.pi * (f - 1) / N_FRAMES
        cam_obj.location = (
            CAM_DIST * math.cos(angle),
            CAM_DIST * math.sin(angle),
            CAM_ELEV,
        )
        # Always look at origin
        dx, dy, dz = -cam_obj.location
        cam_obj.rotation_euler = (
            math.atan2(math.sqrt(dx**2 + dy**2), -dz),
            0,
            math.atan2(dy, dx) + math.pi,
        )
        cam_obj.keyframe_insert("location", frame=f)
        cam_obj.keyframe_insert("rotation_euler", frame=f)

    # Linear interpolation for smooth orbit
    if cam_obj.animation_data:
        for fc in cam_obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def animate_shape_keys():
    """Insert shape-key value keyframes for blend transitions."""
    poi = bpy.data.objects.get("Kapitza_Poi")
    if not poi or not poi.data.shape_keys:
        print("Kapitza_Poi object or shape keys not found — skipping SK animation.")
        return

    kb = poi.data.shape_keys.key_blocks
    sk_names = [k.name for k in kb]

    def _zero_all(frame):
        for name in sk_names:
            if name == "Basis":
                continue
            kb[name].value = 0.0
            kb[name].keyframe_insert("value", frame=frame)

    def _set(name, val, frame):
        if name in sk_names:
            kb[name].value = val
            kb[name].keyframe_insert("value", frame=frame)

    # Frames 1–60: Basis (all others = 0)
    _zero_all(1)
    _zero_all(60)

    for (f_start, f_end, sk_name) in SK_TRANSITIONS:
        f_mid = (f_start + f_end) // 2
        # Hold previous state at f_start, blend to new by f_mid, hold to f_end
        _zero_all(f_start)
        _zero_all(f_mid)
        _set(sk_name, 1.0, f_mid)
        _set(sk_name, 1.0, f_end)
        _zero_all(f_end)   # end of this transition — next one takes over


def add_point_light():
    """Rim light from above to make the cobalt/amber emission pop."""
    light_data = bpy.data.lights.new("Rim", type="POINT")
    light_data.energy = 0.8
    light_data.color = (0.9, 0.95, 1.0)
    light_obj = bpy.data.objects.new("Rim", light_data)
    light_obj.location = (0.0, 0.0, 0.25)
    bpy.context.collection.objects.link(light_obj)


def render():
    bpy.ops.render.render(animation=True)


def main():
    import os
    out_dir = bpy.path.abspath(OUTPUT_PATH).rsplit("/", 1)[0]
    os.makedirs(out_dir, exist_ok=True)
    setup_scene()
    setup_camera()
    animate_shape_keys()
    add_point_light()
    render()
    print("Kapitza Poi viewport.mp4 rendered →", OUTPUT_PATH)


main()
