"""
record.py — Viewport animation for the Chirikov Standard Map stage floor.
Animates shape-key influence cycling through five K-values: integrable →
partial KAM → threshold → chaotic sea → wild/accelerator modes.
Output: public/library/videos/scripting/<slug>/viewport.mp4
Run from Blender 5.1 (Scripting workspace) after blueprint.py has created
the scene and saved the .blend.  Does not require a display server.
"""

import bpy, os

SLUG        = "python-numpy-chirikov-standard-map-kam-tori-stochasticity-threshold-poincare-stage-floor-webxr"
OBJ_NAME    = "Chirikov_Standard_Map_Floor"
FPS         = 30
HOLD_FRAMES = 18    # frames to hold each shape key at peak value
RAMP_FRAMES = 12    # frames to ramp between shapes
SEQUENCE    = [
    "Basis",          # K=0.9716 (threshold) — start & end
    "SK_Integrable",  # K=0.00
    "SK_Partial",     # K=0.50
    "SK_Chaotic",     # K=2.00
    "SK_Wild",        # K=5.00
    "Basis",          # return to threshold
]

# ─── OUTPUT PATH ────────────────────────────────────────────────────────────
vid_dir = os.path.join(
    bpy.path.abspath("//"),
    "public", "library", "videos", "scripting", SLUG
)
os.makedirs(vid_dir, exist_ok=True)
out_path = os.path.join(vid_dir, "viewport.mp4")

# ─── RENDER SETTINGS ────────────────────────────────────────────────────────
sc = bpy.context.scene
sc.render.engine               = "BLENDER_WORKBENCH"
sc.render.filepath             = out_path
sc.render.image_settings.file_format = "FFMPEG"
sc.render.ffmpeg.format        = "MPEG4"
sc.render.ffmpeg.codec         = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
sc.render.resolution_x         = 1280
sc.render.resolution_y         = 720
sc.render.fps                  = FPS

# Workbench: cavity shading emphasises height-field topology
sc.display.shading.type        = "SOLID"
sc.display.shading.light       = "MATCAP"
sc.display.shading.show_cavity = True
sc.display.shading.cavity_type = "BOTH"
sc.display.shading.color_type  = "VERTEX"   # show Chirikov_Density colours

# ─── CAMERA ─────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecordCam")
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location      = (0.0, -6.5, 4.2)
cam_obj.rotation_euler = (0.96, 0.0, 0.0)   # ~55° tilt, overhead-ish
sc.camera              = cam_obj

# ─── SHAPE KEY ANIMATION ─────────────────────────────────────────────────────
obj = bpy.data.objects[OBJ_NAME]
key_blocks = obj.data.shape_keys.key_blocks

# Zero all influence values, then animate
for kb in key_blocks:
    kb.value = 0.0

frame = 1
prev_name = SEQUENCE[0]

for next_name in SEQUENCE[1:]:
    # Hold previous at 1.0
    key_blocks[prev_name].value = 1.0
    key_blocks[prev_name].keyframe_insert("value", frame=frame)
    frame += HOLD_FRAMES

    # Ramp down previous, ramp up next across RAMP_FRAMES
    ramp_end = frame + RAMP_FRAMES
    key_blocks[prev_name].value = 1.0
    key_blocks[prev_name].keyframe_insert("value", frame=frame)
    if next_name in key_blocks:
        key_blocks[next_name].value = 0.0
        key_blocks[next_name].keyframe_insert("value", frame=frame)

    key_blocks[prev_name].value = 0.0
    key_blocks[prev_name].keyframe_insert("value", frame=ramp_end)
    if next_name in key_blocks:
        key_blocks[next_name].value = 1.0
        key_blocks[next_name].keyframe_insert("value", frame=ramp_end)

    frame = ramp_end
    prev_name = next_name

sc.frame_start = 1
sc.frame_end   = frame + HOLD_FRAMES

# Slow slow interpolation for all fcurves → smooth morph
if obj.data.shape_keys.animation_data:
    for fc in obj.data.shape_keys.animation_data.action.fcurves:
        for kf in fc.keyframe_points:
            kf.interpolation = "BEZIER"
            kf.easing = "AUTO"

# ─── SLOW CAMERA ORBIT ───────────────────────────────────────────────────────
import math
total_frames = sc.frame_end
for f in range(1, total_frames + 1, 6):
    angle = (f / total_frames) * 2 * math.pi * 0.25   # quarter orbit
    r = 6.8
    cam_obj.location = (r * math.sin(angle), -r * math.cos(angle), 4.2)
    cam_obj.keyframe_insert("location", frame=f)
    # Always point at origin
    track = cam_obj.constraints.new("TRACK_TO") if not cam_obj.constraints else None

# Easier: just use a Track-To constraint locked on origin (add once)
bpy.context.view_layer.objects.active = cam_obj
if "Track To" not in cam_obj.constraints:
    tc = cam_obj.constraints.new(type="TRACK_TO")
    tc.target   = obj
    tc.track_axis = "TRACK_NEGATIVE_Z"
    tc.up_axis    = "UP_Y"

bpy.ops.render.render(animation=True)
print(f"[holoflow] viewport animation → {out_path}")
