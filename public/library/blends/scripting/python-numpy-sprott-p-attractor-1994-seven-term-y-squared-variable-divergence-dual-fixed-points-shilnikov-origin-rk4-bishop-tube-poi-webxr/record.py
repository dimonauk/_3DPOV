"""
record.py — Sprott P Attractor viewport animation
===================================================
Outputs: public/library/videos/scripting/
         python-numpy-sprott-p-attractor-.../viewport.mp4
Run AFTER blueprint.py has built the scene.
Duration: ~10 s at 30 fps (300 frames).

Animation plan
--------------
Frames   1– 75   Basis shape key held (a=2.7, canonical attractor)
Frames  76–150   Morph → SK_LowA (a=2.0, wider loops)
Frames 151–225   Morph → SK_HighA (a=3.5, tighter orbit)
Frames 226–300   Morph → Basis again (return to canonical)

Camera: slow orbit 8 m radius, elevation 25°, 1.0 revolution total.
Renderer: WORKBENCH, SOLID mode, VERTEX_COLORS on → reads SprottP_Speed.
"""

import bpy
import os

SLUG = (
    "python-numpy-sprott-p-attractor-1994-seven-term-y-squared-variable-"
    "divergence-dual-fixed-points-shilnikov-origin-rk4-bishop-tube-poi-webxr"
)
OUT_DIR = f"//../../videos/scripting/{SLUG}/"
FRAMES  = 300
FPS     = 30
RADIUS  = 8.0
ELEV    = 0.42     # radians above equator (~24°)

# ── Output ──────────────────────────────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start, scn.frame_end = 1, FRAMES
scn.render.fps = FPS
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format        = "MPEG4"
scn.render.ffmpeg.codec         = "H264"
scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
scn.render.resolution_x = 1920
scn.render.resolution_y = 1080
scn.render.filepath = os.path.join(bpy.path.abspath(OUT_DIR), "viewport.mp4")
os.makedirs(bpy.path.abspath(OUT_DIR), exist_ok=True)

# ── Renderer: Workbench + vertex colours ────────────────────────────────────
scn.render.engine = "BLENDER_WORKBENCH"
scn.display.shading.type = "SOLID"
scn.display.shading.color_type = "VERTEX"
scn.display.shading.show_shadows = False
scn.world.color = (0.02, 0.02, 0.04)

# ── Camera ───────────────────────────────────────────────────────────────────
import math
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scn.camera = cam_ob

# Animate camera as an orbit
for f in range(1, FRAMES + 1):
    theta = 2 * math.pi * (f - 1) / FRAMES   # one full revolution
    x = RADIUS * math.cos(theta) * math.cos(ELEV)
    y = RADIUS * math.sin(theta) * math.cos(ELEV)
    z = RADIUS * math.sin(ELEV)
    cam_ob.location = (x, y, z)
    cam_ob.keyframe_insert("location", frame=f)

# Point camera at origin each frame via a TrackTo constraint
track = cam_ob.constraints.new("TRACK_TO")
track.target     = bpy.data.objects.get("SprottP_Poi")
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

# ── Shape key animation ──────────────────────────────────────────────────────
poi = bpy.data.objects.get("SprottP_Poi")
if poi and poi.data.shape_keys:
    keys = poi.data.shape_keys.key_blocks
    schedule = [
        # (frame, Basis, SK_LowA, SK_HighA, SK_WideA)
        (  1, 1.0, 0.0, 0.0, 0.0),
        ( 75, 1.0, 0.0, 0.0, 0.0),
        (150, 0.0, 1.0, 0.0, 0.0),
        (225, 0.0, 0.0, 1.0, 0.0),
        (300, 1.0, 0.0, 0.0, 0.0),
    ]
    sk_names = ["Basis", "SK_LowA", "SK_HighA", "SK_WideA"]
    for row in schedule:
        frame = row[0]
        for idx, sk_name in enumerate(sk_names):
            if sk_name in keys:
                keys[sk_name].value = row[idx + 1]
                keys[sk_name].keyframe_insert("value", frame=frame)

# ── Render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print("record.py complete — viewport.mp4 written to", scn.render.filepath)
