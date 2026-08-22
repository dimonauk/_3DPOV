"""
record.py — viewport animation render for the Boolean + Weld prop tutorial.

Outputs: public/library/videos/scripting/
           python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr/viewport.mp4

Run after blueprint.py has been executed (the hf_boolean_weld_prop mesh must
exist in the scene).  Animates a 120-frame turntable camera orbit at 24 fps
(5 seconds), rendered via Workbench engine for speed.
"""

import bpy
import math

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
OUTPUT_PATH    = "//../../../../videos/scripting/python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr/viewport"
FRAME_START    = 1
FRAME_END      = 120
FPS            = 24
CAM_DISTANCE   = 3.2
CAM_HEIGHT     = 1.4
CAM_FOCUS_Z    = 0.4


def setup_camera():
    bpy.ops.object.camera_add(location=(CAM_DISTANCE, 0.0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "rec_cam"

    bpy.ops.object.empty_add(location=(0.0, 0.0, CAM_FOCUS_Z))
    target = bpy.context.active_object
    target.name = "rec_target"

    ct = cam.constraints.new('TRACK_TO')
    ct.target     = target
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam
    return cam


def keyframe_orbit(cam):
    scene = bpy.context.scene
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.tau * t
        cam.location.x = CAM_DISTANCE * math.cos(angle)
        cam.location.y = CAM_DISTANCE * math.sin(angle)
        cam.location.z = CAM_HEIGHT
        scene.frame_set(frame)
        cam.keyframe_insert("location", frame=frame)


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format  = 'MPEG4'
    scene.render.ffmpeg.codec   = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath       = OUTPUT_PATH

    ws = scene.display.shading
    ws.light            = 'MATCAP'
    ws.show_cavity      = True
    ws.cavity_type      = 'WORLD'
    ws.cavity_ridge_factor = 1.2

    scene.display.light_direction = (0.8, -0.5, 1.0)


def add_light():
    bpy.ops.object.light_add(type='AREA', location=(2.0, -1.5, 3.0))
    light = bpy.context.active_object
    light.data.energy = 400
    light.data.size   = 2.0


def main():
    cam = setup_camera()
    keyframe_orbit(cam)
    add_light()
    setup_render()
    bpy.ops.render.render(animation=True)
    print("[holoflow] viewport.mp4 rendered")


if __name__ == "__main__":
    main()
