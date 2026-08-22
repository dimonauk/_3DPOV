"""
record.py — Viewport animation render for SSS Stylised Skin
============================================================
Outputs: public/library/videos/shading/shader-subsurface-scattering-stylised-skin/viewport.mp4
Duration: 120 frames @ 24 fps = 5 seconds
Sequence: head rotates 360° while a rim light pulses, revealing
          ear translucency glow at back-lit angles.

Run after blueprint.py has populated the scene:
  blender --background sss_skin.blend --python record.py
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/shading/shader-subsurface-scattering-stylised-skin/viewport"
FRAME_START = 1
FRAME_END   = 120
FPS         = 24
HEAD_NAME   = "head"


def setup_animation():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    head = bpy.data.objects.get(HEAD_NAME)
    if not head:
        print(f"[record.py] Object '{HEAD_NAME}' not found — run blueprint.py first.")
        return

    ear_r = bpy.data.objects.get("ear_R")
    ear_l = bpy.data.objects.get("ear_L")

    # ── HEAD rotation: 0→360° over FRAME_END frames ──────────────────────
    # Full rotation shows ear glow at back-lit angle (~frames 30-90)
    for obj in (head, ear_r, ear_l):
        if obj is None:
            continue
        obj.rotation_euler = (0, 0, 0)
        obj.keyframe_insert(data_path="rotation_euler", frame=FRAME_START)
        obj.rotation_euler = (0, 0, math.radians(360))
        obj.keyframe_insert(data_path="rotation_euler", frame=FRAME_END)

    # Set linear interpolation — constant angular velocity, no ease-in/out
    for obj in (head, ear_r, ear_l):
        if obj is None:
            continue
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    # ── RIM LIGHT pulse: bright during back-lit frames (30-90) ───────────
    # At those frames the ear faces the rim, showing the SSS glow clearly
    rim = bpy.data.objects.get("rim_light")
    if rim:
        rim.data.energy = 100.0
        rim.data.keyframe_insert(data_path="energy", frame=FRAME_START)
        rim.data.energy = 1200.0
        rim.data.keyframe_insert(data_path="energy", frame=30)
        rim.data.energy = 1200.0
        rim.data.keyframe_insert(data_path="energy", frame=90)
        rim.data.energy = 100.0
        rim.data.keyframe_insert(data_path="energy", frame=FRAME_END)


def setup_viewport_render():
    scene = bpy.context.scene

    # Use EEVEE_NEXT for the viewport record (faster than Cycles for video)
    # SSS in EEVEE Next 5.1 uses screen-space approximation — accurate enough
    # for a demo recording.  The blueprint itself recommends Cycles for finals.
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    eevee = scene.eevee
    eevee.use_shadows = True
    eevee.shadow_step_count = 6

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 1280
    scene.render.filepath = OUTPUT_PATH
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'


def main():
    setup_animation()
    setup_viewport_render()
    bpy.ops.render.render(animation=True)
    print("[record.py] Render complete →", OUTPUT_PATH)


if __name__ == "__main__":
    main()
