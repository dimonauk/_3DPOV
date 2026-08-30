"""
record.py — Viewport animation for the Magnetic Skyrmion stage floor.

Run AFTER blueprint.py.  Animates shape-key transitions and a slow camera
orbit around the floor, then renders to:
  public/library/videos/scripting/
    python-numpy-magnetic-skyrmion-belavin-polyakov-bps-pontryagin-topological-charge-stage-floor-webxr/
    viewport.mp4

Duration: 10 s at 24 fps = 240 frames.
  F1–60    Basis (Q=1 skyrmion)
  F60–100  fade to SK_Q2 (Q=2 two-skyrmion)
  F100–140 hold SK_Q2
  F140–180 fade to SK_Anti (Q=−1 antiskyrmion)
  F180–210 hold SK_Anti
  F210–240 fade back to Basis

Camera: overhead 45° elevation, 5.5 m radius, 180° arc (left → right).
"""

import bpy
import math
import os

# ─── scene setup ──────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 240
scene.render.fps  = 24

# EEVEE Next
scene.render.engine                   = "BLENDER_EEVEE_NEXT"
scene.eevee.bloom_threshold           = 0.28
scene.eevee.bloom_intensity           = 0.45
scene.eevee.bloom_radius              = 4.0
scene.eevee.use_gtao                  = True

# Output
SLUG = (
    "python-numpy-magnetic-skyrmion-belavin-polyakov-bps-"
    "pontryagin-topological-charge-stage-floor-webxr"
)
out_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..", "videos", "scripting", SLUG
)
os.makedirs(out_dir, exist_ok=True)

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format              = "MPEG4"
scene.render.ffmpeg.codec               = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                   = os.path.join(out_dir, "viewport.mp4")
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# World (deep space dark)
world = bpy.data.worlds.new("SkyWorld")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.01, 0.03, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
scene.world = world

# ─── camera ───────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("RecCam")
cam_data.lens        = 35
cam_data.clip_start  = 0.1
cam_data.clip_end    = 50.0
cam_ob   = bpy.data.objects.new("RecCam", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

CAM_R   = 5.5   # orbit radius (m)
CAM_EL  = 0.65  # elevation above XY plane (radians, ≈37°)
ARC_DEG = 180   # total arc

for f in range(1, 241):
    t_arc  = (f - 1) / 239                      # 0 → 1
    angle  = math.radians(-90 + ARC_DEG * t_arc)
    cx = CAM_R * math.cos(angle) * math.cos(CAM_EL)
    cy = CAM_R * math.sin(angle) * math.cos(CAM_EL)
    cz = CAM_R * math.sin(CAM_EL)
    cam_ob.location = (cx, cy, cz)
    cam_ob.keyframe_insert("location", frame=f)
    # Point at origin
    dx, dy, dz = -cx, -cy, -cz
    d = math.sqrt(dx*dx + dy*dy + dz*dz)
    cam_ob.rotation_euler = (
        math.asin(-dz / d),
        0.0,
        math.atan2(dx, -dy),
    )
    cam_ob.keyframe_insert("rotation_euler", frame=f)

for fc in cam_ob.animation_data.action.fcurves:
    for kf in fc.keyframe_points:
        kf.interpolation = "LINEAR"

# ─── shape-key animation ──────────────────────────────────────────────────────
ob = bpy.data.objects.get("skyrmion_floor")
if ob and ob.data.shape_keys:
    ks   = ob.data.shape_keys
    keys = {k.name: k for k in ks.key_blocks}

    def set_key_values(frame, basis=0.0, q2=0.0, anti=0.0, large=0.0):
        scene.frame_set(frame)
        keys["Basis"].value    = basis
        keys["SK_Q2"].value    = q2
        keys["SK_Anti"].value  = anti
        keys["SK_Large"].value = large
        keys["Basis"].keyframe_insert("value", frame=frame)
        keys["SK_Q2"].keyframe_insert("value", frame=frame)
        keys["SK_Anti"].keyframe_insert("value", frame=frame)
        keys["SK_Large"].keyframe_insert("value", frame=frame)

    # Basis: F1–60 (Basis)
    set_key_values( 1,  basis=1.0)
    set_key_values(60,  basis=1.0)
    # F60–100: fade Basis→SK_Q2
    set_key_values(100, basis=0.0, q2=1.0)
    # F100–140: hold SK_Q2
    set_key_values(140, basis=0.0, q2=1.0)
    # F140–180: fade SK_Q2→SK_Anti
    set_key_values(180, basis=0.0, q2=0.0, anti=1.0)
    # F180–210: hold SK_Anti
    set_key_values(210, basis=0.0, q2=0.0, anti=1.0)
    # F210–240: fade SK_Anti→Basis
    set_key_values(240, basis=1.0, q2=0.0, anti=0.0)

# ─── sun light ────────────────────────────────────────────────────────────────
sun = bpy.data.lights.new("Sun", "SUN")
sun.energy = 3.0
sun.angle  = math.radians(8)
sun_ob     = bpy.data.objects.new("Sun", sun)
scene.collection.objects.link(sun_ob)
sun_ob.rotation_euler = (math.radians(50), 0, math.radians(30))

# ─── render ───────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True)
print(f"Rendered → {scene.render.filepath}")
