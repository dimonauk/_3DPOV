"""
record.py — FTLE Double-Gyre Floor  (Blender 5.1 / bpy)
Renders viewport.mp4: 270 frames @ 30 fps = 9 seconds.
Run AFTER blueprint.py has built and saved ftle_double_gyre_floor.blend.

Camera orbits overhead at a low angle, panning to reveal the ridge structure
of each FTLE shape key in sequence.  EEVEE Next with bloom emphasises the
amber ridges against the cobalt gyre bodies.

Output: public/library/videos/scripting/
  python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr/
  viewport.mp4
"""

import bpy
import math

# ── PARAMETERS ───────────────────────────────────────────────────────────────
FPS          = 30
N_FRAMES     = 270
CAM_RADIUS   = 3.8      # metres from scene centre
CAM_ELEV     = 1.6      # metres above floor (low-angle top-down)
CAM_LENS     = 50       # mm — telephoto flattens the ridge geometry nicely
ORBIT_DEG    = 180      # total arc traversed during render
BLOOM_THRESH = 0.30
BLOOM_INT    = 0.45

OUT_PATH = "//../../videos/scripting/" \
    "python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr/" \
    "viewport"

# Shape-key timeline (frame: value of SK)
# F1-60   Basis (fwd FTLE)
# F60-100 fade → SK_Bwd (attracting)
# F100-140 hold
# F140-180 fade → SK_HiEps
# F180-220 hold
# F220-260 fade → SK_LongT (finest)
# F260-270 hold final
SK_KEYS = [
    ("Basis",    1, 60,  60, 100),
    ("SK_Bwd",   60, 100, 100, 140),
    ("SK_HiEps", 140, 180, 180, 220),
    ("SK_LongT", 220, 260, 260, 270),
]

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = N_FRAMES
scn.render.fps  = FPS
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format               = 'MPEG4'
scn.render.ffmpeg.codec                = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath = OUT_PATH

# ── RENDER ENGINE ────────────────────────────────────────────────────────────
scn.render.engine     = 'BLENDER_EEVEE_NEXT'
eevee = scn.eevee
eevee.use_bloom       = True
eevee.bloom_threshold = BLOOM_THRESH
eevee.bloom_intensity = BLOOM_INT
eevee.taa_render_samples = 16

# ── WORLD LIGHTING ───────────────────────────────────────────────────────────
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scn.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.02, 0.02, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.4

# ── CAMERA ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = CAM_LENS
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
scn.camera = cam_obj

# Orbit animation
for fr in range(1, N_FRAMES + 1):
    t     = (fr - 1) / (N_FRAMES - 1)    # 0 → 1
    angle = math.radians(ORBIT_DEG) * t
    x = CAM_RADIUS * math.sin(angle)
    y = -CAM_RADIUS * math.cos(angle)
    z = CAM_ELEV
    cam_obj.location = (x, y, z)
    cam_obj.rotation_euler = (
        math.atan2(CAM_RADIUS, CAM_ELEV),   # tilt down
        0.0,
        angle,                               # follow orbit
    )
    cam_obj.keyframe_insert('location', frame=fr)
    cam_obj.keyframe_insert('rotation_euler', frame=fr)

# Make all F-curves LINEAR for smooth constant-speed orbit
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── SHAPE-KEY ANIMATION ───────────────────────────────────────────────────────
obj = bpy.context.scene.objects.get("FTLE_DoubleGyre")
if obj and obj.data.shape_keys:
    ks = obj.data.shape_keys.key_blocks
    def set_sk(name: str, val: float, frame: int) -> None:
        if name in ks:
            ks[name].value = val
            ks[name].keyframe_insert('value', frame=frame)

    # Zero all shape keys at frame 1
    for key_name, fade_in_s, fade_in_e, hold_s, hold_e in SK_KEYS:
        set_sk(key_name, 0.0, 1)

    # Animate each key: fade in, hold
    for key_name, fade_in_s, fade_in_e, hold_s, hold_e in SK_KEYS:
        set_sk(key_name, 0.0, fade_in_s)
        set_sk(key_name, 1.0, fade_in_e)
        set_sk(key_name, 1.0, hold_e)
        # fade out unless it is the last key
        if hold_e < N_FRAMES:
            set_sk(key_name, 0.0, hold_e + 20)

    for fcurve in obj.data.shape_keys.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── RENDER ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("Render complete → " + OUT_PATH + ".mp4")
