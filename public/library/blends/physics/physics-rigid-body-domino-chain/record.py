"""
record.py — Rigid Body Domino Chain: viewport animation render
Blender 5.1 · CC0 · Holoflow Studio

EEVEE evaluates the Bullet rigid body cache frame-by-frame during animation
render — no explicit bake required.  The camera starts at a wide 3/4 angle
behind the tilted first domino and arcs gently to a side elevation by frame 60,
then holds while the last dominos fall.  The full 120-frame render (5 s at 24 fps)
captures the complete chain reaction.

Output: public/library/videos/physics/physics-rigid-body-domino-chain/viewport.mp4

Run after blueprint.py:
  blender --background domino_chain.blend --python record.py
"""

import bpy
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FPS          = 24
TOTAL_FRAMES = 120

DOMINO_COUNT   = 15
CHAIN_SPACING  = 0.045
DOMINO_H       = 0.080

OUTPUT_DIR = "//../../videos/physics/physics-rigid-body-domino-chain/"


def build_camera_path() -> None:
    scene   = bpy.context.scene
    cam     = scene.camera
    if cam is None:
        raise RuntimeError("No camera — run blueprint.py first to generate domino_chain.blend.")

    chain_len = (DOMINO_COUNT - 1) * CHAIN_SPACING
    mid_y     = chain_len * 0.5
    look_at   = Vector((0.0, mid_y, DOMINO_H * 0.35))

    # Phase 1 (frames 1–60): arc from 3/4-behind to side view
    # Phase 2 (frames 60–120): hold side elevation
    PHASE_1_END = 60

    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES

    for frame in range(1, TOTAL_FRAMES + 1):
        t = min(frame - 1, PHASE_1_END - 1) / (PHASE_1_END - 1)   # 0→1 over phase 1, held

        # Horizontal angle: start at -0.35 rad (slightly behind) → -1.57 rad (pure side)
        angle_h = -0.35 + t * (-1.57 - (-0.35))
        radius  = 1.1
        height  = 0.42 - t * 0.06   # descend slightly for final side shot

        cam.location = Vector((
            radius * math.cos(angle_h),
            mid_y + radius * math.sin(angle_h),
            height,
        ))
        direction = (look_at - cam.location).normalized()
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)

    # Linear interpolation prevents ease-in wobble on a smooth arc
    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine                         = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x                  = 1920
    scene.render.resolution_y                  = 1080
    scene.render.fps                            = FPS
    scene.render.image_settings.file_format    = 'FFMPEG'
    scene.render.ffmpeg.format                 = 'MPEG4'
    scene.render.ffmpeg.codec                  = 'H264'
    scene.render.ffmpeg.constant_rate_factor   = 'MEDIUM'
    scene.render.filepath                       = OUTPUT_DIR + "viewport"


if __name__ == '__main__':
    build_camera_path()
    configure_render()
    bpy.ops.render.render(animation=True)
