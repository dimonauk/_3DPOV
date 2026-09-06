# ============================================================
# record.py — Magnetic Pendulum Basin, viewport animation
# Blender 5.1 · CC0
# Run AFTER blueprint.py has created the scene.
# Outputs viewport.mp4 to public/library/videos/…/<slug>/
# ============================================================
#
# 240 frames @ 30 fps = 8 s
# Camera orbits the floor at mid-level elevation while the
# shape-key morphs through basin regimes:
#   f001–060  Basis      (3 mag, d=0.30, moderate fractal)
#   f061–100  → SK_HighDamp (smooth, almost no ridge detail)
#   f101–140  → SK_LowDamp  (intricate boundary, tall ridges)
#   f141–180  → SK_4Mag     (4-magnet square layout)
#   f181–240  → Basis       (return)
# ============================================================

import bpy
import os
import math

FRAMES     = 240
FPS        = 30
CAM_RADIUS = 5.0
CAM_ELEV   = 1.60      # m above XY plane
VIDEO_DIR  = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..", "..",   # library/blends/scripting/<slug> → library/videos/…
    "videos", "scripting",
    "python-numpy-magnetic-pendulum-fractal-basin-three-magnets-rk4-convergence-height-field-stage-floor-webxr",
)
os.makedirs(VIDEO_DIR, exist_ok=True)


def set_key(ob: bpy.types.Object, frame: int, basis: float,
            hi: float = 0.0, lo: float = 0.0, four: float = 0.0) -> None:
    kb = ob.data.shape_keys.key_blocks
    kb["Basis"].value   = basis
    kb["SK_HighDamp"].value = hi
    kb["SK_LowDamp"].value  = lo
    kb["SK_4Mag"].value     = four
    bpy.context.scene.frame_set(frame)
    for name in ("Basis", "SK_HighDamp", "SK_LowDamp", "SK_4Mag"):
        kb[name].keyframe_insert("value", frame=frame)


# ─── camera ───────────────────────────────────────────────────
bpy.ops.object.camera_add()
cam_ob = bpy.context.object
cam_ob.name = "RecCam"
bpy.context.scene.camera = cam_ob

# Track-to constraint targets the floor centre
track = cam_ob.constraints.new("TRACK_TO")
track.target = bpy.data.objects.get("MagPendFloor")
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis    = "UP_Y"

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = FRAMES
bpy.context.scene.render.fps  = FPS


def cam_at(frame: int, angle_deg: float) -> None:
    a = math.radians(angle_deg)
    cam_ob.location = (
        CAM_RADIUS * math.cos(a),
        CAM_RADIUS * math.sin(a),
        CAM_ELEV,
    )
    bpy.context.scene.frame_set(frame)
    cam_ob.keyframe_insert("location", frame=frame)


# 260° orbit, anticlockwise
for fr in range(1, FRAMES + 1):
    cam_at(fr, (fr / FRAMES) * 260.0 - 10.0)

# ─── shape-key animation ──────────────────────────────────────
ob = bpy.data.objects.get("MagPendFloor")
set_key(ob, 1,   basis=1.0)
set_key(ob, 60,  basis=1.0)
set_key(ob, 100, hi=1.0)
set_key(ob, 140, lo=1.0)
set_key(ob, 180, four=1.0)
set_key(ob, 240, basis=1.0)

# ─── render settings ──────────────────────────────────────────
sc  = bpy.context.scene
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.engine = "BLENDER_EEVEE_NEXT"

ev = sc.eevee
ev.use_bloom      = True
ev.bloom_threshold = 0.25
ev.bloom_intensity = 0.45
ev.bloom_radius    = 6.0

sc.world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)

sc.render.filepath = os.path.join(VIDEO_DIR, "viewport.mp4")
sc.render.image_settings.file_format  = "FFMPEG"
sc.render.ffmpeg.format               = "MPEG4"
sc.render.ffmpeg.codec                = "H264"
sc.render.ffmpeg.constant_rate_factor = "MEDIUM"

bpy.ops.render.render(animation=True)
print(f"viewport.mp4 → {VIDEO_DIR}")
