# blends/rigging/armature-ik-robot-arm/record.py
# Blender 5.1 | CC0
#
# Viewport animation recorder — renders a 60-frame turntable of the robot
# arm tracking its IK_Target empty around a horizontal orbit.
# Output: public/library/videos/rigging/armature-ik-robot-arm/viewport.mp4
#
# Run after blueprint.py has created robot_arm_ik.blend:
#   blender robot_arm_ik.blend --background --python record.py

import math
from pathlib import Path
import bpy

BLEND_DIR  = Path(__file__).parent
VIDEO_DIR  = BLEND_DIR.parents[3] / "videos" / "rigging" / "armature-ik-robot-arm"
VIDEO_OUT  = VIDEO_DIR / "viewport"   # Blender appends the frame range + .mp4

ANIM_FRAMES = 60
FPS         = 24
W, H        = 1920, 1080


def main():
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    sc = bpy.context.scene
    sc.render.fps           = FPS
    sc.frame_start          = 1
    sc.frame_end            = ANIM_FRAMES
    sc.render.resolution_x  = W
    sc.render.resolution_y  = H
    sc.render.resolution_percentage = 100

    # EEVEE Next for real-time quality without path-trace cost
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.eevee.use_bloom = True
    sc.eevee.bloom_intensity = 0.05

    # Output: lossless PNG sequence → FFmpeg MP4
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath = str(VIDEO_OUT)

    # ── Camera ────────────────────────────────────────────────────────────────
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    sc.camera = cam_obj

    # Position camera at eye level, slightly above and to the side
    cam_obj.location = (1.4, -1.6, 1.1)
    cam_obj.rotation_euler = (math.radians(80), 0, math.radians(42))

    # ── World ─────────────────────────────────────────────────────────────────
    sc.world.use_nodes = True
    bg_node = sc.world.node_tree.nodes['Background']
    bg_node.inputs['Color'].default_value    = (0.04, 0.04, 0.05, 1.0)
    bg_node.inputs['Strength'].default_value = 0.6

    # Key light — warm from upper-right
    bpy.ops.object.light_add(type='AREA', location=(1.2, -0.8, 2.0))
    key_light = bpy.context.active_object
    key_light.data.energy  = 180.0
    key_light.data.color   = (1.0, 0.96, 0.88)
    key_light.data.size    = 0.8
    key_light.rotation_euler = (math.radians(50), 0, math.radians(30))

    # Fill light — cool from left
    bpy.ops.object.light_add(type='AREA', location=(-1.5, 0.5, 1.2))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 60.0
    fill_light.data.color  = (0.75, 0.88, 1.0)
    fill_light.data.size   = 1.2

    # ── Camera slow dolly to emphasise arm motion ─────────────────────────────
    # A subtle arc keeps the arm legible without distracting from the IK solve.
    for fr in range(1, ANIM_FRAMES + 1):
        t     = (fr - 1) / (ANIM_FRAMES - 1)
        angle = math.radians(10) * math.sin(2 * math.pi * t)  # ±10° pan
        r     = 2.1
        cam_obj.location.x = r * math.sin(angle + math.radians(35))
        cam_obj.location.y = -r * math.cos(angle + math.radians(35))
        cam_obj.keyframe_insert('location', frame=fr)

    # ── Render ────────────────────────────────────────────────────────────────
    bpy.ops.render.render(animation=True)
    print(f"record.py complete — {VIDEO_OUT}*.mp4")


main()
