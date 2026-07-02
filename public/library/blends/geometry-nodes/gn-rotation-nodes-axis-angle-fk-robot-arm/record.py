# record.py — Viewport animation for FK Robot Arm rotation nodes tutorial
# Blender 5.1 | CC0 | Holoflow Studio Library
#
# Animates the three GN group sockets (Yaw, Pitch, Roll) through a cycle
# that shows each axis of the FK chain independently, then a compound pose:
#   frames  1– 30  → YAW sweeps  0° → 120°   (base rotates)
#   frames 31– 60  → PITCH sweeps 0° → 70°   (arm folds forward)
#   frames 61– 90  → ROLL sweeps  0° → 180°  (gripper spins)
#   frames 91–120  → compound: yaw=30, pitch=50, roll=90 (hero pose)
#
# Run after blueprint.py:
#   blender --background fk_robot_arm.blend --python record.py

import bpy
import math

OUT_MP4 = "//../../videos/geometry-nodes/gn-rotation-nodes-axis-angle-fk-robot-arm/viewport.mp4"
FRAMES  = 120

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES

# ── Render settings ──────────────────────────────────────────────────────────
scene.render.engine                      = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x                = 1920
scene.render.resolution_y                = 1080
scene.render.fps                         = 30
scene.render.image_settings.file_format  = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath                    = OUT_MP4

# ── Camera — orbits slightly to show 3D depth ─────────────────────────────────
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

import mathutils
for frame in range(1, FRAMES + 1):
    t   = (frame - 1) / (FRAMES - 1)
    ang = math.radians(30 + t * 25)   # gentle orbit 30°→55°
    cam_obj.location = (
        1.4 * math.sin(ang),
        -1.4 * math.cos(ang),
        0.35,
    )
    target = mathutils.Vector((0.0, 0.0, 0.28))
    direction = target - mathutils.Vector(cam_obj.location)
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# ── Animate GN sockets ────────────────────────────────────────────────────────
obj = bpy.data.objects.get("fk_robot_arm")
if obj:
    mod = obj.modifiers.get("HS_FKArm")
    if mod and mod.node_group:
        def kf(sock, frame, val):
            mod[sock] = val
            mod.keyframe_insert(data_path=f'["{sock}"]', frame=frame)

        # Phase 1: YAW sweep (frames 1–30), pitch+roll = 0
        for fr, yaw in [(1, 0.0), (30, 120.0)]:
            kf("Yaw",   fr, yaw)
            kf("Pitch", fr, 0.0)
            kf("Roll",  fr, 0.0)

        # Phase 2: PITCH sweep (frames 31–60), yaw=120, roll=0
        for fr, pitch in [(31, 0.0), (60, 70.0)]:
            kf("Yaw",   fr, 120.0)
            kf("Pitch", fr, pitch)
            kf("Roll",  fr, 0.0)

        # Phase 3: ROLL sweep (frames 61–90), yaw=120, pitch=70
        for fr, roll in [(61, 0.0), (90, 180.0)]:
            kf("Yaw",   fr, 120.0)
            kf("Pitch", fr, 70.0)
            kf("Roll",  fr, roll)

        # Phase 4: compound hero pose settle (frames 91–120)
        for fr, (yaw, pitch, roll) in [(91, (120, 70, 180)), (120, (30, 50, 90))]:
            kf("Yaw",   fr, yaw)
            kf("Pitch", fr, pitch)
            kf("Roll",  fr, roll)

# ── Three-point lighting ───────────────────────────────────────────────────────
def add_light(name, ltype, location, energy):
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    lo = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.location = location

add_light("key",  "AREA",  ( 2.0, -1.5, 1.5), 500)
add_light("fill", "AREA",  (-1.5, -1.0, 0.8), 200)
add_light("back", "POINT", ( 0.0,  1.5, 0.5),  80)

bpy.ops.render.render(animation=True)
