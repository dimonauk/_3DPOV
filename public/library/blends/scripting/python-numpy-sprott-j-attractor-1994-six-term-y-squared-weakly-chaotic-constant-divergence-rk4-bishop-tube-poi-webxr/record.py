"""
record.py — Sprott J Attractor: Viewport Animation Render
Outputs: public/library/videos/scripting/
         python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic-constant-divergence-rk4-bishop-tube-poi-webxr/
         viewport.mp4
Duration: ~7 seconds at 30 fps = 210 frames
Technique: shape-key cross-fade + slow camera orbit showing
           Basis → SK_LoB → SK_HiB → SK_VHiB transitions
Run from Blender Text Editor after blueprint.py has built the scene.
"""

import bpy
from math import pi, cos, sin

# ── OUTPUT PATH ──────────────────────────────────────────────────────────────
SLUG = (
    "python-numpy-sprott-j-attractor-1994-six-term-y-squared-weakly-chaotic"
    "-constant-divergence-rk4-bishop-tube-poi-webxr"
)
OUT_DIR  = f"//../../videos/scripting/{SLUG}/"
FILENAME = "viewport"
FPS      = 30
N_FRAMES = 210   # 7 s

# ── CAMERA RIG ───────────────────────────────────────────────────────────────
CAM_DIST = 7.0   # metres from origin
ELEV_RAD = 0.38  # elevation above equator (~22 °)
N_REVS   = 1.2   # camera revolves 1.2 × around attractor

bpy.ops.object.camera_add()
cam_obj = bpy.context.active_object
cam_obj.name = "SprottJ_RecordCam"
scene = bpy.context.scene
scene.camera = cam_obj
cam_obj.data.lens = 85  # mm — telephoto compresses the orbit nicely

# ── LIGHTING ─────────────────────────────────────────────────────────────────
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value  = (0.01, 0.01, 0.015, 1.0)
    bg.inputs["Strength"].default_value = 0.05

# ── RENDER SETTINGS: WORKBENCH (fast) ────────────────────────────────────────
scene.render.engine              = "BLENDER_WORKBENCH"
scene.display.shading.light      = "FLAT"
scene.display.shading.color_type = "VERTEX"
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                 = FPS
scene.frame_start                = 1
scene.frame_end                  = N_FRAMES
scene.render.filepath            = f"{OUT_DIR}{FILENAME}"
scene.render.image_settings.file_format       = "FFMPEG"
scene.render.ffmpeg.format                    = "MPEG4"
scene.render.ffmpeg.codec                     = "H264"
scene.render.ffmpeg.constant_rate_factor      = "MEDIUM"

# ── SHAPE-KEY ANIMATION ───────────────────────────────────────────────────────
tube = bpy.data.objects.get("SprottJ_Tube")
if tube and tube.data.shape_keys:
    keys = tube.data.shape_keys.key_blocks
    key_schedule = [
        # (frame_in, frame_out, key_name)
        (1,   50, "Basis"),
        (51,  100, "SK_LoB"),
        (101, 150, "SK_HiB"),
        (151, 210, "SK_VHiB"),
    ]
    for f_in, f_out, kname in key_schedule:
        if kname in keys:
            k = keys[kname]
            k.value = 0.0
            k.keyframe_insert("value", frame=f_in - 1)
            k.value = 1.0
            k.keyframe_insert("value", frame=f_in)
            k.value = 1.0
            k.keyframe_insert("value", frame=f_out)
            k.value = 0.0
            k.keyframe_insert("value", frame=f_out + 1)

# ── CAMERA ORBIT KEYFRAMES ───────────────────────────────────────────────────
def cam_pos(frame):
    t = (frame - 1) / (N_FRAMES - 1)
    angle = t * N_REVS * 2.0 * pi
    x = CAM_DIST * cos(angle) * cos(ELEV_RAD)
    y = CAM_DIST * sin(angle) * cos(ELEV_RAD)
    z = CAM_DIST * sin(ELEV_RAD)
    return (x, y, z)

for f in range(1, N_FRAMES + 1, 15):
    cam_obj.location = cam_pos(f)
    cam_obj.keyframe_insert("location", frame=f)

# Always point camera at origin
bpy.ops.object.select_all(action="DESELECT")
cam_obj.select_set(True)
bpy.ops.object.constraint_add(type="TRACK_TO")
tc = cam_obj.constraints["Track To"]
tc.target  = bpy.data.objects.get("SprottJ_Tube") or cam_obj
tc.track_axis  = "TRACK_NEGATIVE_Z"
tc.up_axis     = "UP_Y"

# ── RENDER ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Recorded → {OUT_DIR}{FILENAME}.mp4")
