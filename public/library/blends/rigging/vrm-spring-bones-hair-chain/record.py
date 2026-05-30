"""
VRM Spring Bones — viewport recording
public/library/blends/rigging/vrm-spring-bones-hair-chain/record.py
Blender 5.1 · CC0

Opens the .blend produced by blueprint.py and renders a 48-frame EEVEE
animation showing the hair chain swinging in a gentle arc.  The keyframes
mimic what the VRMC_springBone Verlet solver would produce at runtime when
the character shakes their head once.

Run after blueprint.py:
    blender --background --python record.py
Output: public/library/videos/rigging/vrm-spring-bones-hair-chain/viewport.mp4
"""

import bpy
from math import radians
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
HERE      = Path(__file__).parent
BLEND_IN  = HERE / "vrm_spring_bones.blend"
VIDEO_OUT = HERE.parents[3] / "videos" / "rigging" / "vrm-spring-bones-hair-chain" / "viewport.mp4"

VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

# ── Open scene ─────────────────────────────────────────────────────────────────
bpy.ops.wm.open_mainfile(filepath=str(BLEND_IN))
scene  = bpy.context.scene
arm_ob = bpy.data.objects['char_arm']

# ── Hair sway keyframe schedule ────────────────────────────────────────────────
# Pendulum motion: root of chain (Hair_1) leads; each subsequent joint lags by
# LAG_FRAMES to simulate inertial delay — the defining quality of spring dynamics.
#
# Frame 1  → rest (0°)
# Frame 12 → peak right swing (+20° for Hair_1, +14° for Hair_2, …)
# Frame 24 → rest (0°)
# Frame 36 → peak left swing  (−20°, −14°, …)
# Frame 48 → rest (0°)
HAIR_JOINTS = 4
PEAK_DEG    = 20.0   # Hair_1 peak; each joint attenuates by FALLOFF
FALLOFF     = 0.70   # amplitude ratio per joint (0.7^3 ≈ 34% at Hair_4)
LAG_FRAMES  = 2      # inertial lag per joint in frames

# schedule: list of (frame, peak_sign) for the root joint
ROOT_SCHEDULE = [(1, 0), (12, +1), (24, 0), (36, -1), (48, 0)]

bpy.context.view_layer.objects.active = arm_ob
bpy.ops.object.mode_set(mode='POSE')

for joint_idx in range(HAIR_JOINTS):
    name  = f'Hair_{joint_idx + 1}'
    pb    = arm_ob.pose.bones[name]
    pb.rotation_mode = 'XYZ'
    amp   = PEAK_DEG * (FALLOFF ** joint_idx)
    lag   = joint_idx * LAG_FRAMES   # later joints peak later

    for (frame, sign) in ROOT_SCHEDULE:
        scene.frame_set(frame + lag)
        pb.rotation_euler.x = radians(sign * amp)
        pb.keyframe_insert(data_path='rotation_euler', index=0, frame=frame + lag)

bpy.ops.object.mode_set(mode='OBJECT')
scene.frame_end = 48


# ── Camera ─────────────────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new('RecordCam')
cam_data.lens = 70
cam_ob   = bpy.data.objects.new('RecordCam', cam_data)
bpy.context.collection.objects.link(cam_ob)
cam_ob.location       = (0.0, -1.6, 1.55)
cam_ob.rotation_euler = (1.45, 0.0, 0.0)   # tilt down onto character
scene.camera          = cam_ob


# ── EEVEE render ──────────────────────────────────────────────────────────────
scene.render.engine            = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x      = 1280
scene.render.resolution_y      = 720
scene.render.fps               = 24
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format     = 'MPEG4'
scene.render.ffmpeg.codec      = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.filepath          = str(VIDEO_OUT)
scene.frame_start              = 1

bpy.ops.render.render(animation=True)
print(f'[holoflow] Video written: {VIDEO_OUT}')
