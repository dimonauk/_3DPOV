# =============================================================================
# HOLOFLOW STUDIO — record.py
# Topic  : geometry-nodes / gn-edge-crease-subdiv-hard-surface
# Blender: 5.1
# Run    : blender edge_crease_hard_surface.blend --background --python record.py
# Output : public/library/videos/geometry-nodes/
#                gn-edge-crease-subdiv-hard-surface/viewport.mp4
# =============================================================================
"""
Viewport animation: sweeps 'Angle Threshold Deg' from 0° → 85° over 150 frames.

At 0°: every edge is below the threshold → crease=0 everywhere → fully smooth
  Catmull-Clark sphere shape.
At ~40° (frame 70): edges above 40° reach crease=1.0 → box corners snap sharp.
At 85°: only near-flat edges remain uncreased → fully hard-surface cube look.

The sweep visualises the entire operating range of the crease system in one
5-second clip — the same animation that makes the technique immediately
comprehensible to a viewer who has never encountered crease weights before.
"""

import bpy
import pathlib

OUTPUT_VIEWPORT = "//../../videos/geometry-nodes/gn-edge-crease-subdiv-hard-surface/viewport"
FRAMES          = 150
FPS             = 30
THRESH_START    = 0.0    # degrees — fully smooth
THRESH_END      = 85.0   # degrees — all box corners fully creased

OBJ_NAME    = "edge_crease_hard_surface"
MOD_NAME    = "HoloflowGNCrease"


def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start  = 1
    scene.frame_end    = FRAMES
    scene.render.fps   = FPS
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec  = 'H264'
    scene.render.filepath      = OUTPUT_VIEWPORT

    # EEVEE Next for fast viewport-style render
    scene.render.engine = 'BLENDER_EEVEE_NEXT'


def setup_lighting() -> None:
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.05   # near-parallel for hard shadow definition


def setup_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = (3.8, -3.8, 2.8)

    target = bpy.data.objects.get(OBJ_NAME)
    if target:
        track = cam.constraints.new('TRACK_TO')
        track.target    = target
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam


def keyframe_threshold() -> None:
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{OBJ_NAME}' not found — run blueprint.py first.")

    mod = obj.modifiers.get(MOD_NAME)
    if mod is None:
        raise RuntimeError(f"Modifier '{MOD_NAME}' not found on '{OBJ_NAME}'.")

    # Frame 1: fully smooth
    bpy.context.scene.frame_set(1)
    mod['Input_2'] = THRESH_START
    mod.keyframe_insert(data_path='["Input_2"]', frame=1)

    # Frame 150: all box corners at full crease
    bpy.context.scene.frame_set(FRAMES)
    mod['Input_2'] = THRESH_END
    mod.keyframe_insert(data_path='["Input_2"]', frame=FRAMES)

    # Use LINEAR interpolation so the transition is even across all frames.
    anim = obj.animation_data
    if anim and anim.action:
        for fc in anim.action.fcurves:
            if 'Input_2' in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def main() -> None:
    setup_render()
    setup_lighting()
    setup_camera()
    keyframe_threshold()

    out = pathlib.Path(bpy.path.abspath(OUTPUT_VIEWPORT)).with_suffix('.mp4')
    out.parent.mkdir(parents=True, exist_ok=True)
    print(f'[record] rendering {FRAMES} frames → {out}')
    bpy.ops.render.render(animation=True)
    print('[record] done.')


if __name__ == '__main__':
    main()
