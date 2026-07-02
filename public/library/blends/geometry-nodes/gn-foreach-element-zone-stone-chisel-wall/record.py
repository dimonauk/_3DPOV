# record.py — Viewport render for Foreach Element Zone ashlar wall tutorial
# Blender 5.1 | CC0 | Holoflow Studio Library
#
# Animates the Seed parameter from 0 → 40 over 60 frames, cycling through
# stone pattern variants so the viewer sees the per-face randomness live.
# A secondary pan rotates the camera around the wall to show depth variance.
#
# Run after blueprint.py has built the scene:
#   blender --background ashlar_wall.blend --python record.py

import bpy
import math

OUT_MP4 = "//../../videos/geometry-nodes/gn-foreach-element-zone-stone-chisel-wall/viewport.mp4"
FRAMES  = 90

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

# ── Render settings ────────────────────────────────────────────────────────────
scene.render.engine              = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x        = 1920
scene.render.resolution_y        = 1080
scene.render.fps                 = 30
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUT_MP4

# ── Camera ────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 35
cam_obj = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Arc around the wall (radius 4 m, height 1 m)
for frame in range(1, FRAMES + 1):
    t   = (frame - 1) / (FRAMES - 1)       # 0 → 1
    ang = math.radians(-30 + t * 60)       # −30° → +30° arc
    cam_obj.location = (
        4.0 * math.sin(ang),
        -4.0 * math.cos(ang),
        0.9 + 0.2 * math.sin(t * math.pi),  # slight up-down drift
    )
    dx = -cam_obj.location.x
    dy = -cam_obj.location.y
    cam_obj.rotation_euler = (
        math.radians(90 - math.degrees(math.atan2(0.9, 4.0))),
        0.0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── Animate Seed 0 → 3 (shows pattern diversity without disorienting viewer) ──
obj = bpy.data.objects.get("ashlar_wall")
if obj:
    mod = obj.modifiers.get("HS_AshlarChisel")
    if mod and mod.node_group:
        sock_name = "Seed"
        for frame, seed in [(1, 0), (30, 1), (60, 2), (90, 3)]:
            mod[sock_name] = seed
            mod.keyframe_insert(data_path=f'["{sock_name}"]', frame=frame)

# ── Three-point lighting ───────────────────────────────────────────────────────
def add_light(name, ltype, location, energy):
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = location

add_light("key",  "AREA",  ( 3.0, -2.5,  2.5), 400)
add_light("fill", "AREA",  (-2.0, -2.0,  1.5), 150)
add_light("back", "POINT", ( 0.0,  2.0,  1.0),  80)

bpy.ops.render.render(animation=True)
print(f"[HS] Recorded → {OUT_MP4}")
